"""
Contingency Manager for Claude CTO
Handles stuck tasks and system recovery automatically
"""

import logging
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import shutil

from sqlmodel import Session, select
from claude_cto.server.models import TaskDB, TaskStatus
from claude_cto.server.database import engine, get_session

logger = logging.getLogger(__name__)


class ContingencyManager:
    """Manages automatic recovery from stuck tasks and system issues"""
    
    def __init__(self, max_task_age_hours: float = 1.0, auto_fix: bool = True):
        self.max_task_age_hours = max_task_age_hours
        self.auto_fix = auto_fix
        self.monitoring_active = False
        self.check_interval = 300  # Check every 5 minutes
        self.backup_dir = Path.home() / ".claude-cto" / "backups"
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        
    async def start_monitoring(self):
        """Start background monitoring for stuck tasks"""
        if self.monitoring_active:
            logger.warning("Contingency monitoring already active")
            return
            
        self.monitoring_active = True
        logger.info("Starting contingency monitoring")
        
        while self.monitoring_active:
            try:
                await self.check_and_fix_stuck_tasks()
                await asyncio.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Error in contingency monitoring: {e}")
                await asyncio.sleep(60)  # Wait 1 minute on error
    
    def stop_monitoring(self):
        """Stop background monitoring"""
        self.monitoring_active = False
        logger.info("Stopping contingency monitoring")
    
    def get_stuck_tasks(self, session: Session) -> List[TaskDB]:
        """Get all tasks that have been running too long"""
        threshold = datetime.utcnow() - timedelta(hours=self.max_task_age_hours)
        
        statement = select(TaskDB).where(
            TaskDB.status == TaskStatus.RUNNING,
            TaskDB.started_at < threshold
        )
        
        stuck_tasks = session.exec(statement).all()
        return list(stuck_tasks)
    
    def get_orphaned_tasks(self, session: Session) -> List[TaskDB]:
        """Get tasks that are running but have no active process"""
        import psutil
        
        running_tasks = session.exec(
            select(TaskDB).where(TaskDB.status == TaskStatus.RUNNING)
        ).all()
        
        orphaned = []
        for task in running_tasks:
            if task.pid:
                # Check if process exists
                if not psutil.pid_exists(task.pid):
                    orphaned.append(task)
            else:
                # No PID recorded but task is running - likely orphaned
                if task.started_at:
                    age = datetime.utcnow() - task.started_at
                    if age.total_seconds() > 300:  # More than 5 minutes without PID
                        orphaned.append(task)
        
        return orphaned
    
    def backup_database(self) -> Optional[Path]:
        """Create a backup of the database"""
        try:
            db_path = Path.home() / ".claude-cto" / "tasks.db"
            if not db_path.exists():
                logger.warning(f"Database not found at {db_path}")
                return None
                
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = self.backup_dir / f"tasks_{timestamp}.db"
            
            shutil.copy2(db_path, backup_path)
            logger.info(f"Database backed up to {backup_path}")
            
            # Keep only last 10 backups
            self.cleanup_old_backups()
            
            return backup_path
        except Exception as e:
            logger.error(f"Failed to backup database: {e}")
            return None
    
    def cleanup_old_backups(self, keep_count: int = 10):
        """Remove old backup files, keeping only the most recent ones"""
        try:
            backups = sorted(self.backup_dir.glob("tasks_*.db"), 
                           key=lambda p: p.stat().st_mtime, 
                           reverse=True)
            
            for backup in backups[keep_count:]:
                backup.unlink()
                logger.info(f"Deleted old backup: {backup}")
                
        except Exception as e:
            logger.error(f"Error cleaning up backups: {e}")
    
    def fix_stuck_task(self, session: Session, task: TaskDB, reason: str = "exceeded timeout") -> bool:
        """Mark a stuck task as failed"""
        try:
            task.status = TaskStatus.FAILED
            task.ended_at = datetime.utcnow()
            task.error_message = f"Task killed by contingency manager: {reason}"
            
            # Kill the process if it exists
            if task.pid:
                try:
                    import os
                    import signal
                    os.kill(task.pid, signal.SIGTERM)
                    logger.info(f"Killed process {task.pid} for task {task.id}")
                except ProcessLookupError:
                    pass  # Process already dead
                except Exception as e:
                    logger.warning(f"Failed to kill process {task.pid}: {e}")
            
            session.add(task)
            session.commit()
            
            logger.info(f"Fixed stuck task {task.id}: {reason}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to fix task {task.id}: {e}")
            session.rollback()
            return False
    
    async def check_and_fix_stuck_tasks(self) -> Dict[str, any]:
        """Check for stuck tasks and fix them if auto_fix is enabled"""
        results = {
            "checked_at": datetime.utcnow().isoformat(),
            "stuck_tasks": [],
            "orphaned_tasks": [],
            "fixed_count": 0,
            "backup_created": False
        }
        
        try:
            # Get current session
            with Session(engine) as session:
                # Find stuck tasks
                stuck_tasks = self.get_stuck_tasks(session)
                results["stuck_tasks"] = [
                    {"id": t.id, "started_at": t.started_at.isoformat() if t.started_at else None}
                    for t in stuck_tasks
                ]
                
                # Find orphaned tasks
                orphaned_tasks = self.get_orphaned_tasks(session)
                results["orphaned_tasks"] = [
                    {"id": t.id, "pid": t.pid}
                    for t in orphaned_tasks
                ]
                
                total_problematic = len(stuck_tasks) + len(orphaned_tasks)
                
                if total_problematic > 0:
                    logger.warning(f"Found {len(stuck_tasks)} stuck and {len(orphaned_tasks)} orphaned tasks")
                    
                    if self.auto_fix:
                        # Create backup before fixing
                        backup_path = self.backup_database()
                        results["backup_created"] = backup_path is not None
                        
                        # Fix stuck tasks
                        for task in stuck_tasks:
                            if self.fix_stuck_task(session, task, "exceeded timeout"):
                                results["fixed_count"] += 1
                        
                        # Fix orphaned tasks
                        for task in orphaned_tasks:
                            if self.fix_stuck_task(session, task, "process not found"):
                                results["fixed_count"] += 1
                        
                        logger.info(f"Fixed {results['fixed_count']} problematic tasks")
                else:
                    logger.debug("No stuck or orphaned tasks found")
                    
        except Exception as e:
            logger.error(f"Error checking tasks: {e}")
            results["error"] = str(e)
        
        return results
    
    async def get_system_health(self) -> Dict[str, any]:
        """Get comprehensive system health status"""
        health = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "tasks": {
                "total": 0,
                "running": 0,
                "stuck": 0,
                "orphaned": 0,
                "completed": 0,
                "failed": 0
            },
            "monitoring": {
                "active": self.monitoring_active,
                "max_task_age_hours": self.max_task_age_hours,
                "check_interval": self.check_interval
            }
        }
        
        try:
            with Session(engine) as session:
                # Count tasks by status
                for status in TaskStatus:
                    count = session.exec(
                        select(TaskDB).where(TaskDB.status == status)
                    ).all()
                    health["tasks"][status.value] = len(count)
                    health["tasks"]["total"] += len(count)
                
                # Check for stuck tasks
                stuck_tasks = self.get_stuck_tasks(session)
                health["tasks"]["stuck"] = len(stuck_tasks)
                
                # Check for orphaned tasks
                orphaned_tasks = self.get_orphaned_tasks(session)
                health["tasks"]["orphaned"] = len(orphaned_tasks)
                
                # Determine overall health status
                if health["tasks"]["stuck"] > 5 or health["tasks"]["orphaned"] > 5:
                    health["status"] = "critical"
                elif health["tasks"]["stuck"] > 0 or health["tasks"]["orphaned"] > 0:
                    health["status"] = "warning"
                    
        except Exception as e:
            logger.error(f"Error getting system health: {e}")
            health["status"] = "error"
            health["error"] = str(e)
        
        return health


# Global instance
contingency_manager = ContingencyManager(max_task_age_hours=1.0, auto_fix=True)