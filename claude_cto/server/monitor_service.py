"""
Sistema de Monitoramento e Notificações para Claude CTO.
Integra funcionalidades do monitor antigo com a API principal.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Set, Optional, Any
from pathlib import Path
import aiohttp
from sqlmodel import Session, select
from fastapi import WebSocket

from .models import (
    TaskDB, TaskStatus, OrchestrationDB,
    ActivityLogDB, NotificationConfigDB,
    ActivityEvent, StatsResponse, SystemMetricsResponse
)
from .database import engine

logger = logging.getLogger(__name__)


class NotificationService:
    """Serviço de notificações para eventos do sistema."""
    
    def __init__(self):
        self.configs: List[NotificationConfigDB] = []
        self.load_configs()
    
    def load_configs(self):
        """Carrega configurações de notificação do banco."""
        try:
            with Session(engine) as session:
                statement = select(NotificationConfigDB).where(NotificationConfigDB.enabled == True)
                self.configs = list(session.exec(statement))
        except Exception as e:
            logger.error(f"Erro ao carregar configurações de notificação: {e}")
            self.configs = []
    
    async def notify(self, event_type: str, data: Dict[str, Any]):
        """Envia notificações para todos os webhooks configurados."""
        for config in self.configs:
            try:
                # Verifica se o tipo de evento está habilitado
                event_types = json.loads(config.event_types) if config.event_types else []
                if event_types and event_type not in event_types:
                    continue
                
                # Verifica thresholds se aplicável
                if not self._check_thresholds(event_type, data, config):
                    continue
                
                # Envia notificação baseada no tipo
                if config.webhook_url:
                    if config.webhook_type == "slack":
                        await self._send_slack_notification(config.webhook_url, event_type, data)
                    elif config.webhook_type == "discord":
                        await self._send_discord_notification(config.webhook_url, event_type, data)
                    else:
                        await self._send_generic_webhook(config.webhook_url, event_type, data)
                        
            except Exception as e:
                logger.error(f"Erro ao enviar notificação: {e}")
    
    def _check_thresholds(self, event_type: str, data: Dict[str, Any], config: NotificationConfigDB) -> bool:
        """Verifica se os thresholds foram atingidos."""
        try:
            thresholds = json.loads(config.alert_thresholds) if config.alert_thresholds else {}
            
            # Exemplo: threshold para taxa de falha
            if event_type == "task_failed" and "failure_rate_threshold" in thresholds:
                current_rate = data.get("failure_rate", 0)
                if current_rate < thresholds["failure_rate_threshold"]:
                    return False
            
            # Exemplo: threshold para tempo de execução
            if event_type == "task_completed" and "max_execution_time" in thresholds:
                execution_time = data.get("execution_time", 0)
                if execution_time < thresholds["max_execution_time"]:
                    return False
                    
            return True
        except Exception as e:
            logger.error(f"Erro ao verificar thresholds: {e}")
            return True
    
    async def _send_slack_notification(self, webhook_url: str, event_type: str, data: Dict[str, Any]):
        """Envia notificação formatada para Slack."""
        try:
            color = "good" if "completed" in event_type else "danger" if "failed" in event_type else "warning"
            
            payload = {
                "text": f"Claude CTO: {event_type.replace('_', ' ').title()}",
                "attachments": [{
                    "color": color,
                    "fields": [
                        {"title": key.replace('_', ' ').title(), "value": str(value), "short": True}
                        for key, value in data.items() if key not in ["details", "timestamp"]
                    ],
                    "footer": "Claude CTO Monitor",
                    "ts": int(datetime.now().timestamp())
                }]
            }
            
            async with aiohttp.ClientSession() as session:
                await session.post(webhook_url, json=payload)
                
        except Exception as e:
            logger.error(f"Erro ao enviar para Slack: {e}")
    
    async def _send_discord_notification(self, webhook_url: str, event_type: str, data: Dict[str, Any]):
        """Envia notificação formatada para Discord."""
        try:
            color = 0x00ff00 if "completed" in event_type else 0xff0000 if "failed" in event_type else 0xffff00
            
            embed = {
                "title": f"Claude CTO: {event_type.replace('_', ' ').title()}",
                "color": color,
                "fields": [
                    {"name": key.replace('_', ' ').title(), "value": str(value), "inline": True}
                    for key, value in data.items() if key not in ["details", "timestamp"]
                ],
                "timestamp": datetime.now().isoformat(),
                "footer": {"text": "Claude CTO Monitor"}
            }
            
            async with aiohttp.ClientSession() as session:
                await session.post(webhook_url, json={"embeds": [embed]})
                
        except Exception as e:
            logger.error(f"Erro ao enviar para Discord: {e}")
    
    async def _send_generic_webhook(self, webhook_url: str, event_type: str, data: Dict[str, Any]):
        """Envia notificação genérica via webhook."""
        try:
            payload = {
                "event_type": event_type,
                "timestamp": datetime.now().isoformat(),
                "data": data
            }
            
            async with aiohttp.ClientSession() as session:
                await session.post(webhook_url, json=payload)
                
        except Exception as e:
            logger.error(f"Erro ao enviar webhook genérico: {e}")


class ActivityLogger:
    """Registra atividades do sistema no banco de dados."""
    
    @staticmethod
    def log_activity(event_type: str, message: str, task_id: Optional[int] = None, 
                    orchestration_id: Optional[int] = None, details: Optional[Dict[str, Any]] = None):
        """Registra uma atividade no banco."""
        try:
            with Session(engine) as session:
                activity = ActivityLogDB(
                    event_type=event_type,
                    message=message,
                    task_id=task_id,
                    orchestration_id=orchestration_id,
                    details=json.dumps(details or {}),
                    timestamp=datetime.utcnow()
                )
                session.add(activity)
                session.commit()
                
                return activity
                
        except Exception as e:
            logger.error(f"Erro ao registrar atividade: {e}")
            return None
    
    @staticmethod
    def get_recent_activities(limit: int = 50, offset: int = 0) -> List[ActivityEvent]:
        """Busca atividades recentes."""
        try:
            with Session(engine) as session:
                statement = (
                    select(ActivityLogDB)
                    .order_by(ActivityLogDB.timestamp.desc())
                    .limit(limit)
                    .offset(offset)
                )
                
                activities = session.exec(statement).all()
                
                return [
                    ActivityEvent(
                        id=activity.id,
                        timestamp=activity.timestamp,
                        event_type=activity.event_type,
                        task_id=activity.task_id,
                        orchestration_id=activity.orchestration_id,
                        details=json.loads(activity.details) if activity.details else {},
                        message=activity.message
                    )
                    for activity in activities
                ]
                
        except Exception as e:
            logger.error(f"Erro ao buscar atividades: {e}")
            return []


class MonitorState:
    """Estado global do sistema de monitoramento."""
    
    def __init__(self):
        self.connections: Set[WebSocket] = set()
        self.notification_service = NotificationService()
        self.activity_logger = ActivityLogger()
        self.start_time = datetime.now()
        self.last_stats_update = None
        self.cached_stats = None
    
    async def broadcast(self, message: dict):
        """Envia mensagem para todos os clientes WebSocket conectados."""
        dead_connections = set()
        
        for connection in self.connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.debug(f"Conexão WebSocket morta: {e}")
                dead_connections.add(connection)
        
        # Remove conexões mortas
        self.connections -= dead_connections
    
    async def notify_event(self, event_type: str, data: Dict[str, Any]):
        """Notifica sobre um evento via WebSocket e webhooks."""
        
        # Registra a atividade
        self.activity_logger.log_activity(
            event_type=event_type,
            message=data.get("message", f"Evento: {event_type}"),
            task_id=data.get("task_id"),
            orchestration_id=data.get("orchestration_id"),
            details=data
        )
        
        # Broadcast via WebSocket
        await self.broadcast({
            "type": event_type,
            "timestamp": datetime.now().isoformat(),
            "data": data
        })
        
        # Envia notificações via webhooks
        await self.notification_service.notify(event_type, data)
    
    def get_stats(self, force_refresh: bool = False) -> StatsResponse:
        """Obtém estatísticas do sistema."""
        
        # Cache de 5 segundos para evitar queries excessivas
        if not force_refresh and self.cached_stats and self.last_stats_update:
            if datetime.now() - self.last_stats_update < timedelta(seconds=5):
                return self.cached_stats
        
        try:
            with Session(engine) as session:
                # Conta tarefas por status
                status_counts = {}
                for status in TaskStatus:
                    count = session.exec(
                        select(TaskDB).where(TaskDB.status == status.value)
                    ).all()
                    status_counts[status.value] = len(count)
                
                # Calcula taxas
                total_completed = status_counts.get("completed", 0)
                total_failed = status_counts.get("failed", 0)
                total_finished = total_completed + total_failed
                
                success_rate = (total_completed / total_finished * 100) if total_finished > 0 else 0
                failure_rate = (total_failed / total_finished * 100) if total_finished > 0 else 0
                
                # Tempo médio de execução
                completed_tasks = session.exec(
                    select(TaskDB).where(TaskDB.status == TaskStatus.COMPLETED)
                ).all()
                
                avg_time = None
                if completed_tasks:
                    total_time = 0
                    count = 0
                    for task in completed_tasks:
                        if task.started_at and task.ended_at:
                            duration = (task.ended_at - task.started_at).total_seconds()
                            total_time += duration
                            count += 1
                    
                    if count > 0:
                        avg_time = total_time / count
                
                # Tarefas nas últimas 24h
                yesterday = datetime.utcnow() - timedelta(days=1)
                recent_tasks = session.exec(
                    select(TaskDB).where(TaskDB.created_at >= yesterday)
                ).all()
                
                stats = StatsResponse(
                    total_tasks_by_status=status_counts,
                    success_rate=success_rate,
                    failure_rate=failure_rate,
                    average_execution_time=avg_time,
                    tasks_last_24h=len(recent_tasks)
                )
                
                self.cached_stats = stats
                self.last_stats_update = datetime.now()
                
                return stats
                
        except Exception as e:
            logger.error(f"Erro ao calcular estatísticas: {e}")
            return StatsResponse(
                total_tasks_by_status={},
                success_rate=0,
                failure_rate=0,
                average_execution_time=None,
                tasks_last_24h=0
            )
    
    def get_system_metrics(self) -> SystemMetricsResponse:
        """Obtém métricas do sistema."""
        try:
            uptime = (datetime.now() - self.start_time).total_seconds()
            
            with Session(engine) as session:
                pending = len(session.exec(
                    select(TaskDB).where(TaskDB.status == TaskStatus.PENDING)
                ).all())
                
                running = len(session.exec(
                    select(TaskDB).where(TaskDB.status == TaskStatus.RUNNING)
                ).all())
                
                waiting = len(session.exec(
                    select(TaskDB).where(TaskDB.status == TaskStatus.WAITING)
                ).all())
            
            # Tenta obter métricas de sistema
            memory_mb = None
            cpu_percent = None
            
            try:
                import psutil
                process = psutil.Process()
                memory_mb = process.memory_info().rss / 1024 / 1024
                cpu_percent = process.cpu_percent(interval=0.1)
            except:
                pass
            
            return SystemMetricsResponse(
                uptime_seconds=uptime,
                active_connections=len(self.connections),
                pending_tasks=pending,
                running_tasks=running,
                waiting_tasks=waiting,
                queue_size=pending + waiting,
                memory_usage_mb=memory_mb,
                cpu_usage_percent=cpu_percent
            )
            
        except Exception as e:
            logger.error(f"Erro ao obter métricas do sistema: {e}")
            return SystemMetricsResponse(
                uptime_seconds=0,
                active_connections=0,
                pending_tasks=0,
                running_tasks=0,
                waiting_tasks=0,
                queue_size=0
            )


# Instância global do estado do monitor
monitor_state = MonitorState()


async def monitor_task_changes():
    """
    Monitora mudanças no status das tarefas e emite eventos.
    Executa em background como uma tarefa assíncrona.
    """
    task_cache = {}
    
    while True:
        try:
            with Session(engine) as session:
                tasks = session.exec(select(TaskDB)).all()
                
                for task in tasks:
                    old_status = task_cache.get(task.id, {}).get("status")
                    
                    if old_status != task.status:
                        # Status mudou, emite evento
                        event_data = {
                            "task_id": task.id,
                            "identifier": task.identifier,
                            "status": task.status,
                            "old_status": old_status,
                            "message": f"Task {task.identifier or task.id} mudou de {old_status} para {task.status}"
                        }
                        
                        # Adiciona informações específicas baseadas no novo status
                        if task.status == TaskStatus.COMPLETED:
                            if task.started_at and task.ended_at:
                                duration = (task.ended_at - task.started_at).total_seconds()
                                event_data["execution_time"] = duration
                            event_data["summary"] = task.final_summary
                            
                        elif task.status == TaskStatus.FAILED:
                            event_data["error"] = task.error_message
                        
                        # Emite evento
                        event_type = f"task_{task.status}"
                        await monitor_state.notify_event(event_type, event_data)
                    
                    # Atualiza cache
                    task_cache[task.id] = {
                        "status": task.status,
                        "updated_at": datetime.now()
                    }
            
            # Limpa cache de tarefas antigas (mais de 24h sem atualização)
            cutoff_time = datetime.now() - timedelta(hours=24)
            task_cache = {
                task_id: info
                for task_id, info in task_cache.items()
                if info["updated_at"] > cutoff_time
            }
            
        except Exception as e:
            logger.error(f"Erro no monitor de tarefas: {e}")
        
        await asyncio.sleep(2)  # Poll a cada 2 segundos


async def start_monitoring():
    """Inicia o sistema de monitoramento."""
    logger.info("🚀 Iniciando sistema de monitoramento...")
    
    # Carrega configurações
    monitor_state.notification_service.load_configs()
    
    # Inicia monitor de tarefas em background
    asyncio.create_task(monitor_task_changes())
    
    logger.info("✅ Sistema de monitoramento iniciado")


async def stop_monitoring():
    """Para o sistema de monitoramento."""
    logger.info("🛑 Parando sistema de monitoramento...")
    
    # Fecha todas as conexões WebSocket
    for connection in monitor_state.connections:
        try:
            await connection.close()
        except:
            pass
    
    monitor_state.connections.clear()
    
    logger.info("✅ Sistema de monitoramento parado")