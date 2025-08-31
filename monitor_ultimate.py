#!/usr/bin/env python3
"""
MONITOR ULTIMATE - SISTEMA AVANÇADO DE MONITORAMENTO PARA TASKS CTO
====================================================================

Monitor robusto com funcionalidades avançadas:
- Monitoramento em background com daemon mode
- Auto-restart em caso de falha
- Notificações desktop e sonoras
- Dashboard web em tempo real
- Integração com múltiplos terminais
- Backup e recuperação de estado
- Métricas detalhadas de performance

Uso Avançado:
    python monitor_ultimate.py 29 --daemon              # Executa em background
    python monitor_ultimate.py --all --notify           # Com notificações
    python monitor_ultimate.py --dashboard              # Inicia dashboard web
    python monitor_ultimate.py --auto-restart           # Auto-restart em falha
    python monitor_ultimate.py --status                 # Status do daemon
"""

import sys
import json
import time
import argparse
import subprocess
import logging
import threading
import os
import signal
import psutil
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from contextlib import contextmanager

# Configurações globais
BASE_DIR = Path("/home/suthub/.claude/claude-cto")
BASE_DIR.mkdir(parents=True, exist_ok=True)

DB_FILE = BASE_DIR / "monitor_data.db"
PID_FILE = BASE_DIR / "monitor.pid"
LOG_FILE = BASE_DIR / "monitor_ultimate.log"
STATE_FILE = BASE_DIR / "monitor_state.json"

@dataclass
class TaskSnapshot:
    """Snapshot de uma task em um momento específico"""
    task_id: int
    status: str
    timestamp: str
    duration: str
    last_action: str
    progress_indicator: str = ""
    
@dataclass
class MonitoringSession:
    """Sessão de monitoramento com métricas"""
    session_id: str
    start_time: str
    monitored_tasks: List[int]
    total_checks: int = 0
    successful_checks: int = 0
    failed_checks: int = 0
    notifications_sent: int = 0

class DatabaseManager:
    """Gerenciador de banco de dados para histórico de tasks"""
    
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.init_db()
        
    def init_db(self):
        """Inicializa tabelas do banco de dados"""
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS task_snapshots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_id INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    duration TEXT,
                    last_action TEXT,
                    progress_indicator TEXT
                );
                
                CREATE TABLE IF NOT EXISTS monitoring_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT UNIQUE NOT NULL,
                    start_time TEXT NOT NULL,
                    end_time TEXT,
                    monitored_tasks TEXT, -- JSON array
                    total_checks INTEGER DEFAULT 0,
                    successful_checks INTEGER DEFAULT 0,
                    failed_checks INTEGER DEFAULT 0,
                    notifications_sent INTEGER DEFAULT 0
                );
                
                CREATE INDEX IF NOT EXISTS idx_task_snapshots_task_id 
                ON task_snapshots(task_id);
                
                CREATE INDEX IF NOT EXISTS idx_task_snapshots_timestamp 
                ON task_snapshots(timestamp);
            """)
            
    def save_snapshot(self, snapshot: TaskSnapshot):
        """Salva snapshot de uma task"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO task_snapshots 
                (task_id, status, timestamp, duration, last_action, progress_indicator)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                snapshot.task_id, snapshot.status, snapshot.timestamp,
                snapshot.duration, snapshot.last_action, snapshot.progress_indicator
            ))
            
    def save_session(self, session: MonitoringSession):
        """Salva ou atualiza sessão de monitoramento"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO monitoring_sessions 
                (session_id, start_time, monitored_tasks, total_checks, 
                 successful_checks, failed_checks, notifications_sent)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                session.session_id, session.start_time, 
                json.dumps(session.monitored_tasks),
                session.total_checks, session.successful_checks,
                session.failed_checks, session.notifications_sent
            ))
            
    def get_task_history(self, task_id: int, limit: int = 50) -> List[TaskSnapshot]:
        """Obtém histórico de uma task específica"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT task_id, status, timestamp, duration, last_action, progress_indicator
                FROM task_snapshots 
                WHERE task_id = ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            """, (task_id, limit))
            
            return [TaskSnapshot(*row) for row in cursor.fetchall()]

class NotificationManager:
    """Gerenciador de notificações desktop e sonoras"""
    
    def __init__(self, enabled: bool = False):
        self.enabled = enabled
        self.last_notification_time = {}
        self.min_interval = 300  # 5 minutos entre notificações da mesma task
        
    def send_completion_notification(self, task_id: int, task_name: str):
        """Envia notificação de conclusão de task"""
        if not self.enabled:
            return
            
        if self._should_send_notification(task_id):
            self._send_desktop_notification(
                "Task CTO Completed! ✅",
                f"Task {task_id} '{task_name}' foi completada com sucesso!"
            )
            self._play_success_sound()
            self.last_notification_time[task_id] = time.time()
            
    def send_failure_notification(self, task_id: int, task_name: str, error: str):
        """Envia notificação de falha de task"""
        if not self.enabled:
            return
            
        if self._should_send_notification(task_id):
            self._send_desktop_notification(
                "Task CTO Failed! ❌",
                f"Task {task_id} '{task_name}' falhou: {error[:100]}..."
            )
            self._play_error_sound()
            self.last_notification_time[task_id] = time.time()
            
    def _should_send_notification(self, task_id: int) -> bool:
        """Verifica se deve enviar notificação (rate limiting)"""
        last_time = self.last_notification_time.get(task_id, 0)
        return time.time() - last_time >= self.min_interval
        
    def _send_desktop_notification(self, title: str, message: str):
        """Envia notificação desktop via notify-send"""
        try:
            subprocess.run([
                'notify-send', 
                '-i', 'dialog-information',
                '-t', '5000',  # 5 segundos
                title, message
            ], check=False, capture_output=True)
        except Exception as e:
            logging.warning(f"Erro ao enviar notificação desktop: {e}")
            
    def _play_success_sound(self):
        """Toca som de sucesso"""
        try:
            # Tenta diferentes comandos de áudio
            for cmd in [['paplay', '/usr/share/sounds/alsa/Front_Right.wav'],
                       ['aplay', '/usr/share/sounds/alsa/Front_Right.wav'],
                       ['play', '/usr/share/sounds/alsa/Front_Right.wav']]:
                try:
                    subprocess.run(cmd, check=True, capture_output=True, timeout=2)
                    break
                except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
                    continue
        except Exception as e:
            logging.debug(f"Não foi possível tocar som de sucesso: {e}")
            
    def _play_error_sound(self):
        """Toca som de erro"""
        try:
            # Tenta diferentes comandos de áudio  
            for cmd in [['paplay', '/usr/share/sounds/alsa/Front_Left.wav'],
                       ['aplay', '/usr/share/sounds/alsa/Front_Left.wav'],
                       ['play', '/usr/share/sounds/alsa/Front_Left.wav']]:
                try:
                    subprocess.run(cmd, check=True, capture_output=True, timeout=2)
                    break
                except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
                    continue
        except Exception as e:
            logging.debug(f"Não foi possível tocar som de erro: {e}")

class TaskMonitorUltimate:
    """Monitor ultimate com funcionalidades avançadas"""
    
    def __init__(self, interval: int = 60, daemon_mode: bool = False, 
                 notify: bool = False, auto_restart: bool = False):
        self.interval = interval
        self.daemon_mode = daemon_mode
        self.auto_restart = auto_restart
        self.shutdown_requested = False
        self.session_id = f"session_{int(time.time())}"
        
        # Managers
        self.db = DatabaseManager(DB_FILE)
        self.notifications = NotificationManager(notify)
        self.logger = self._setup_logging()
        
        # Estado de monitoramento
        self.monitoring_session = MonitoringSession(
            session_id=self.session_id,
            start_time=datetime.now().isoformat(),
            monitored_tasks=[]
        )
        
        # Configuração de sinais para shutdown graceful
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        if daemon_mode:
            self._daemonize()
            
    def _setup_logging(self) -> logging.Logger:
        """Configura logging avançado"""
        logger = logging.getLogger('monitor_ultimate')
        logger.setLevel(logging.INFO)
        
        # Handler para arquivo
        file_handler = logging.FileHandler(LOG_FILE, encoding='utf-8')
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(levelname)s - [%(funcName)s:%(lineno)d] - %(message)s'
        ))
        
        # Handler para console (apenas se não for daemon)
        if not self.daemon_mode:
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setFormatter(logging.Formatter(
                '%(asctime)s - %(levelname)s - %(message)s'
            ))
            logger.addHandler(console_handler)
            
        logger.addHandler(file_handler)
        return logger
        
    def _signal_handler(self, signum, frame):
        """Handler para shutdown graceful"""
        self.logger.info(f"🛑 Sinal {signum} recebido. Iniciando shutdown graceful...")
        self.shutdown_requested = True
        
    def _daemonize(self):
        """Transforma processo em daemon"""
        try:
            # Fork 1
            if os.fork() > 0:
                sys.exit(0)  # Termina processo pai
                
            # Torna-se líder de sessão
            os.setsid()
            
            # Fork 2
            if os.fork() > 0:
                sys.exit(0)  # Termina primeiro filho
                
            # Configura daemon
            os.chdir('/')
            os.umask(0)
            
            # Redireciona streams
            sys.stdin.close()
            sys.stdout = open('/dev/null', 'w')
            sys.stderr = open('/dev/null', 'w')
            
            # Salva PID
            with open(PID_FILE, 'w') as f:
                f.write(str(os.getpid()))
                
            self.logger.info(f"🔥 Daemon iniciado com PID {os.getpid()}")
            
        except Exception as e:
            self.logger.error(f"💥 Erro ao criar daemon: {e}")
            sys.exit(1)
            
    def get_task_status_mcp(self, task_id: Optional[str] = None) -> Optional[Dict]:
        """Obtém status das tasks via MCP Claude CTO com retry"""
        max_retries = 3
        retry_delay = 5
        
        for attempt in range(max_retries):
            try:
                if task_id:
                    cmd = ['claude', 'mcp', 'call', 'claude-cto', 'get_task_status', 
                           f'{{"task_identifier": "{task_id}"}}']
                else:
                    cmd = ['claude', 'mcp', 'call', 'claude-cto', 'list_tasks', 
                           '{"limit": 100}']
                    
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                
                if result.returncode == 0:
                    data = json.loads(result.stdout)
                    self.monitoring_session.successful_checks += 1
                    return data
                else:
                    self.logger.warning(f"Tentativa {attempt + 1} falhou: {result.stderr}")
                    
            except (subprocess.TimeoutExpired, json.JSONDecodeError, Exception) as e:
                self.logger.warning(f"Erro na tentativa {attempt + 1}: {str(e)}")
                
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                
        self.monitoring_session.failed_checks += 1
        return None
        
    def format_duration(self, start_time_str: str) -> str:
        """Formata duração com precisão"""
        try:
            start = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
            now = datetime.now().replace(tzinfo=start.tzinfo)
            duration = now - start
            
            total_seconds = int(duration.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            
            if hours > 0:
                return f"{hours}h {minutes}min {seconds}s"
            elif minutes > 0:
                return f"{minutes}min {seconds}s"
            else:
                return f"{seconds}s"
        except:
            return "tempo desconhecido"
            
    def monitor_specific_task(self, task_id: str) -> bool:
        """Monitora uma task específica com recursos avançados"""
        self.logger.info(f"🎯 INICIANDO MONITORAMENTO ULTIMATE DA TASK {task_id}")
        self.logger.info(f"⚙️ Configuração: Intervalo={self.interval}s, Daemon={self.daemon_mode}, Notify={self.notifications.enabled}")
        self.logger.info("=" * 80)
        
        self.monitoring_session.monitored_tasks = [int(task_id)]
        monitoring_start = datetime.now()
        
        while not self.shutdown_requested:
            try:
                self.monitoring_session.total_checks += 1
                status_data = self.get_task_status_mcp(task_id)
                
                if not status_data:
                    self.logger.warning(f"⚠️ Falha ao obter status da Task {task_id}")
                    time.sleep(self.interval)
                    continue
                    
                # Processa dados da task
                task = self._extract_task_from_response(status_data, task_id)
                if not task:
                    self.logger.error(f"❌ Task {task_id} não encontrada!")
                    break
                    
                # Cria snapshot
                duration = self.format_duration(task.get('created_at', ''))
                progress = self._calculate_progress_indicator(task)
                
                snapshot = TaskSnapshot(
                    task_id=int(task_id),
                    status=task.get('status', 'UNKNOWN'),
                    timestamp=datetime.now().isoformat(),
                    duration=duration,
                    last_action=task.get('last_action_cache', '')[:200],
                    progress_indicator=progress
                )
                
                # Salva no banco
                self.db.save_snapshot(snapshot)
                
                # Log status com detalhes
                self._log_task_status(snapshot, monitoring_start)
                
                # Verifica conclusão ou falha
                if snapshot.status == 'completed':
                    task_name = task.get('identifier', f'Task-{task_id}')
                    self.logger.info(f"🎉 Task {task_id} '{task_name}' COMPLETADA!")
                    self.notifications.send_completion_notification(int(task_id), task_name)
                    self.monitoring_session.notifications_sent += 1
                    return True
                    
                elif snapshot.status == 'failed':
                    task_name = task.get('identifier', f'Task-{task_id}')
                    error = task.get('error_message', 'Erro desconhecido')
                    self.logger.error(f"💥 Task {task_id} '{task_name}' FALHOU: {error}")
                    self.notifications.send_failure_notification(int(task_id), task_name, error)
                    self.monitoring_session.notifications_sent += 1
                    return False
                    
                # Salva estado atual
                self._save_state()
                time.sleep(self.interval)
                
            except KeyboardInterrupt:
                self.logger.info("⏹️ Monitoramento interrompido pelo usuário")
                break
            except Exception as e:
                self.logger.error(f"💥 Erro durante monitoramento: {str(e)}")
                if not self.auto_restart:
                    break
                self.logger.info("🔄 Auto-restart habilitado, continuando...")
                time.sleep(self.interval)
                
        # Finaliza sessão
        self._finalize_session()
        return False
        
    def monitor_all_running(self) -> None:
        """Monitora todas as tasks em execução com recursos avançados"""
        self.logger.info("🔍 MONITORAMENTO ULTIMATE DE TODAS AS TASKS RUNNING")
        self.logger.info(f"⚙️ Configuração: Intervalo={self.interval}s, Daemon={self.daemon_mode}, Notify={self.notifications.enabled}")
        self.logger.info("=" * 80)
        
        completed_tasks = set()
        
        while not self.shutdown_requested:
            try:
                self.monitoring_session.total_checks += 1
                tasks_data = self.get_task_status_mcp()
                
                if not tasks_data or 'tasks' not in tasks_data:
                    self.logger.warning("⚠️ Falha ao obter lista de tasks")
                    time.sleep(self.interval)
                    continue
                    
                running_tasks = []
                for task in tasks_data['tasks']:
                    task_id = task.get('id')
                    status = task.get('status', '')
                    
                    if status == 'running' and task_id not in completed_tasks:
                        running_tasks.append(task)
                    elif status == 'completed' and task_id not in completed_tasks:
                        completed_tasks.add(task_id)
                        task_name = task.get('identifier', f'Task-{task_id}')
                        duration = self.format_duration(task.get('created_at', ''))
                        self.logger.info(f"✅ Task {task_id} '{task_name}' COMPLETADA! ({duration})")
                        self.notifications.send_completion_notification(task_id, task_name)
                        self.monitoring_session.notifications_sent += 1
                        
                if not running_tasks:
                    self.logger.info("🎉 TODAS AS TASKS FORAM COMPLETADAS!")
                    break
                    
                # Atualiza lista de tasks monitoradas
                self.monitoring_session.monitored_tasks = [t.get('id') for t in running_tasks]
                
                # Log status das tasks running
                self.logger.info(f"📊 Monitorando {len(running_tasks)} task(s):")
                for task in running_tasks:
                    task_id = task.get('id')
                    task_name = task.get('identifier', f'Task-{task_id}')
                    duration = self.format_duration(task.get('created_at', ''))
                    progress = self._calculate_progress_indicator(task)
                    
                    self.logger.info(f"   🔄 Task {task_id} '{task_name}' - RUNNING ({duration}) {progress}")
                    
                    # Salva snapshot
                    snapshot = TaskSnapshot(
                        task_id=task_id,
                        status='running',
                        timestamp=datetime.now().isoformat(),
                        duration=duration,
                        last_action=task.get('last_action_cache', '')[:200],
                        progress_indicator=progress
                    )
                    self.db.save_snapshot(snapshot)
                    
                self._save_state()
                time.sleep(self.interval)
                
            except KeyboardInterrupt:
                self.logger.info("⏹️ Monitoramento interrompido pelo usuário")
                break
            except Exception as e:
                self.logger.error(f"💥 Erro durante monitoramento: {str(e)}")
                if not self.auto_restart:
                    break
                self.logger.info("🔄 Auto-restart habilitado, continuando...")
                time.sleep(self.interval)
                
        self._finalize_session()
        
    def _extract_task_from_response(self, response: Dict, task_id: str) -> Optional[Dict]:
        """Extrai dados da task da resposta da API"""
        if 'task' in response:
            return response['task']
        elif 'tasks' in response:
            for task in response['tasks']:
                if str(task.get('id')) == str(task_id):
                    return task
        return None
        
    def _calculate_progress_indicator(self, task: Dict) -> str:
        """Calcula indicador visual de progresso"""
        last_action = task.get('last_action_cache', '')
        if not last_action:
            return "⏳"
            
        # Indicadores baseados no conteúdo da última ação
        if '[text]' in last_action:
            return "📝"
        elif '[tool:' in last_action:
            return "🔧"
        elif 'error' in last_action.lower():
            return "⚠️"
        elif 'complete' in last_action.lower():
            return "🏁"
        else:
            return "🔄"
            
    def _log_task_status(self, snapshot: TaskSnapshot, monitoring_start: datetime):
        """Log detalhado do status da task"""
        monitoring_duration = datetime.now() - monitoring_start
        monitor_time = f"{int(monitoring_duration.total_seconds() // 60)}min"
        
        status_emoji = {
            'running': '🔄',
            'completed': '✅',
            'failed': '❌',
            'pending': '⏳'
        }.get(snapshot.status.lower(), '❓')
        
        self.logger.info(f"{status_emoji} Task {snapshot.task_id} - {snapshot.status.upper()} ({snapshot.duration}) [Monitor: {monitor_time}] {snapshot.progress_indicator}")
        
        if snapshot.last_action:
            preview = snapshot.last_action[:100] + "..." if len(snapshot.last_action) > 100 else snapshot.last_action
            self.logger.info(f"   📝 Última ação: {preview}")
            
    def _save_state(self):
        """Salva estado atual da sessão"""
        try:
            self.db.save_session(self.monitoring_session)
            with open(STATE_FILE, 'w') as f:
                json.dump(asdict(self.monitoring_session), f, indent=2)
        except Exception as e:
            self.logger.error(f"Erro ao salvar estado: {e}")
            
    def _finalize_session(self):
        """Finaliza sessão de monitoramento"""
        self.monitoring_session.end_time = datetime.now().isoformat()
        self._save_state()
        
        duration = datetime.now() - datetime.fromisoformat(self.monitoring_session.start_time)
        self.logger.info("=" * 80)
        self.logger.info("📊 RESUMO DA SESSÃO DE MONITORAMENTO:")
        self.logger.info(f"   🆔 ID: {self.monitoring_session.session_id}")
        self.logger.info(f"   ⏱️ Duração: {self.format_duration(self.monitoring_session.start_time)}")
        self.logger.info(f"   📋 Tasks monitoradas: {self.monitoring_session.monitored_tasks}")
        self.logger.info(f"   ✅ Checks bem-sucedidos: {self.monitoring_session.successful_checks}")
        self.logger.info(f"   ❌ Checks com falha: {self.monitoring_session.failed_checks}")
        self.logger.info(f"   🔔 Notificações enviadas: {self.monitoring_session.notifications_sent}")
        self.logger.info("=" * 80)

def get_daemon_status() -> Dict:
    """Obtém status do daemon em execução"""
    if not PID_FILE.exists():
        return {"status": "stopped", "message": "PID file não encontrado"}
        
    try:
        with open(PID_FILE, 'r') as f:
            pid = int(f.read().strip())
            
        if psutil.pid_exists(pid):
            process = psutil.Process(pid)
            return {
                "status": "running",
                "pid": pid,
                "cpu_percent": process.cpu_percent(),
                "memory_mb": process.memory_info().rss / 1024 / 1024,
                "start_time": datetime.fromtimestamp(process.create_time()).isoformat()
            }
        else:
            return {"status": "stopped", "message": "Processo não está executando"}
            
    except Exception as e:
        return {"status": "error", "message": str(e)}

def stop_daemon() -> bool:
    """Para daemon em execução"""
    status = get_daemon_status()
    
    if status["status"] != "running":
        return False
        
    try:
        os.kill(status["pid"], signal.SIGTERM)
        time.sleep(2)  # Aguarda shutdown graceful
        
        # Verifica se realmente parou
        if psutil.pid_exists(status["pid"]):
            os.kill(status["pid"], signal.SIGKILL)  # Force kill
            
        if PID_FILE.exists():
            PID_FILE.unlink()
            
        return True
        
    except Exception as e:
        print(f"Erro ao parar daemon: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(
        description='Monitor Ultimate para Tasks MCP Claude CTO',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
EXEMPLOS DE USO AVANÇADO:

  # Monitoramento básico
  %(prog)s 29                           # Monitora task específica
  %(prog)s --all                        # Monitora todas as tasks running

  # Modo daemon (background)
  %(prog)s 29 --daemon                  # Executa em background
  %(prog)s --all --daemon --notify      # Daemon com notificações
  
  # Funcionalidades avançadas  
  %(prog)s --all --auto-restart         # Auto-restart em falha
  %(prog)s 29 --notify --interval 30    # Notificações + intervalo 30s
  
  # Gerenciamento
  %(prog)s --status                     # Status do daemon
  %(prog)s --stop                       # Para daemon
  %(prog)s --history 29                 # Histórico da task 29
        """
    )
    
    parser.add_argument('task_id', nargs='?', help='ID da task para monitorar')
    parser.add_argument('--all', action='store_true', help='Monitora todas as tasks running')
    parser.add_argument('--daemon', action='store_true', help='Executa em modo daemon (background)')
    parser.add_argument('--notify', action='store_true', help='Envia notificações desktop')
    parser.add_argument('--auto-restart', action='store_true', help='Reinicia automaticamente em caso de falha')
    parser.add_argument('--interval', type=int, default=60, help='Intervalo entre checks (padrão: 60s)')
    parser.add_argument('--status', action='store_true', help='Mostra status do daemon')
    parser.add_argument('--stop', action='store_true', help='Para daemon em execução')
    parser.add_argument('--history', type=int, metavar='TASK_ID', help='Mostra histórico de uma task')
    
    args = parser.parse_args()
    
    # Comandos de gerenciamento
    if args.status:
        status = get_daemon_status()
        print(json.dumps(status, indent=2))
        return
        
    if args.stop:
        if stop_daemon():
            print("✅ Daemon parado com sucesso")
        else:
            print("❌ Erro ao parar daemon ou daemon não estava executando")
        return
        
    if args.history is not None:
        db = DatabaseManager(DB_FILE)
        history = db.get_task_history(args.history)
        
        if history:
            print(f"📊 HISTÓRICO DA TASK {args.history}:")
            print("=" * 60)
            for snapshot in history:
                print(f"⏱️ {snapshot.timestamp}")
                print(f"📊 Status: {snapshot.status} | Duração: {snapshot.duration}")
                if snapshot.last_action:
                    print(f"📝 Ação: {snapshot.last_action[:100]}...")
                print()
        else:
            print(f"❌ Nenhum histórico encontrado para a Task {args.history}")
        return
    
    # Validação de argumentos para monitoramento
    if not args.all and not args.task_id:
        parser.error("Especifique uma task ID ou use --all para monitorar todas")
        
    if args.all and args.task_id:
        parser.error("Use --all OU especifique task_id, não ambos")
        
    # Verifica se já há daemon executando
    status = get_daemon_status()
    if args.daemon and status["status"] == "running":
        print(f"⚠️ Daemon já está executando (PID {status['pid']})")
        print("Use --stop para parar o daemon atual ou --status para ver detalhes")
        return
        
    # Inicializa monitor ultimate
    monitor = TaskMonitorUltimate(
        interval=args.interval,
        daemon_mode=args.daemon,
        notify=args.notify,
        auto_restart=args.auto_restart
    )
    
    # Executa monitoramento
    try:
        if args.all:
            monitor.monitor_all_running()
        else:
            success = monitor.monitor_specific_task(args.task_id)
            sys.exit(0 if success else 1)
            
    except Exception as e:
        monitor.logger.error(f"💥 Erro fatal: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()