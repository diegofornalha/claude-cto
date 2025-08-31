#!/usr/bin/env python3
"""
SISTEMA DE MONITORAMENTO PERSISTENTE PARA TASKS CTO
===================================================

Monitora automaticamente tasks em execução e não para até que estejam 100% COMPLETED.

Uso:
    python monitor.py <task_id>             # Monitora task específica
    python monitor.py --all                 # Monitora todas as tasks running
    python monitor.py --interval 30         # Intervalo personalizado (30s)
    python monitor.py --persist             # Continua mesmo se terminal fechar
    
Exemplo:
    python monitor.py 29                    # Monitora task 29
    python monitor.py --all --interval 60   # Monitora todas, intervalo 1min
"""

import sys
import json
import time
import argparse
import subprocess
import logging
from datetime import datetime, timedelta
from pathlib import Path

class TaskMonitor:
    def __init__(self, interval=60, persist=False, log_file=None):
        self.interval = interval
        self.persist = persist
        self.log_file = log_file or "/home/suthub/.claude/claude-cto/task_monitor.log"
        self.setup_logging()
        self.start_time = datetime.now()
        
    def setup_logging(self):
        """Configura sistema de logs detalhado"""
        logging.basicConfig(
            level=logging.INFO,
            format='[%(asctime)s] %(message)s',
            datefmt='%H:%M:%S',
            handlers=[
                logging.FileHandler(self.log_file),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
        
    def get_task_status(self, task_id=None):
        """Obtém status das tasks via MCP Claude CTO"""
        try:
            if task_id:
                # Busca task específica
                cmd = ['claude', 'mcp', 'call', 'claude-cto', 'get_task_status', f'{{"task_identifier": "{task_id}"}}']
            else:
                # Lista todas as tasks
                cmd = ['claude', 'mcp', 'call', 'claude-cto', 'list_tasks', '{"limit": 50}']
                
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                self.logger.error(f"Erro ao obter status: {result.stderr}")
                return None
                
            return json.loads(result.stdout)
            
        except subprocess.TimeoutExpired:
            self.logger.error("Timeout ao consultar status das tasks")
            return None
        except json.JSONDecodeError:
            self.logger.error("Erro ao decodificar resposta JSON")
            return None
        except Exception as e:
            self.logger.error(f"Erro inesperado: {str(e)}")
            return None
            
    def format_duration(self, start_time_str):
        """Formata duração desde início da task"""
        try:
            start = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
            now = datetime.now().replace(tzinfo=start.tzinfo)
            duration = now - start
            
            hours = int(duration.total_seconds() // 3600)
            minutes = int((duration.total_seconds() % 3600) // 60)
            
            if hours > 0:
                return f"{hours}h {minutes}min"
            else:
                return f"{minutes}min"
        except:
            return "duração desconhecida"
            
    def monitor_specific_task(self, task_id):
        """Monitora uma task específica até completar"""
        self.logger.info(f"🔍 INICIANDO MONITORAMENTO DA TASK {task_id}")
        self.logger.info(f"⏱️ Intervalo: {self.interval}s | Persist: {self.persist}")
        self.logger.info("=" * 60)
        
        monitoring_start = datetime.now()
        
        while True:
            try:
                status_data = self.get_task_status(task_id)
                
                if not status_data:
                    self.logger.warning(f"⚠️ Não foi possível obter status da Task {task_id}")
                    time.sleep(self.interval)
                    continue
                    
                # Processa resposta da API
                if 'task' in status_data:
                    task = status_data['task']
                elif 'tasks' in status_data and len(status_data['tasks']) > 0:
                    task = status_data['tasks'][0]
                else:
                    self.logger.error(f"❌ Task {task_id} não encontrada!")
                    break
                    
                status = task.get('status', 'UNKNOWN')
                created_at = task.get('created_at', '')
                last_action = task.get('last_action_cache', '')
                
                # Calcula tempo de execução
                duration = self.format_duration(created_at) if created_at else "unknown"
                monitoring_time = datetime.now() - monitoring_start
                monitoring_duration = f"{int(monitoring_time.total_seconds() // 60)}min"
                
                # Exibe status atual
                if status == 'running':
                    self.logger.info(f"🔄 Task ID {task_id} - RUNNING ({duration}) [Monitor: {monitoring_duration}]")
                    if last_action and len(last_action) > 100:
                        preview = last_action[:100] + "..."
                        self.logger.info(f"   📝 Última ação: {preview}")
                elif status == 'completed':
                    self.logger.info(f"✅ Task ID {task_id} - COMPLETED! ({duration})")
                    self.logger.info(f"🎉 MONITORAMENTO CONCLUÍDO COM SUCESSO!")
                    break
                elif status == 'failed':
                    self.logger.error(f"❌ Task ID {task_id} - FAILED ({duration})")
                    error = task.get('error_message', 'Sem detalhes do erro')
                    self.logger.error(f"   💥 Erro: {error}")
                    break
                else:
                    self.logger.warning(f"❓ Task ID {task_id} - Status: {status} ({duration})")
                    
                time.sleep(self.interval)
                
            except KeyboardInterrupt:
                self.logger.info(f"\n⏹️ Monitoramento interrompido pelo usuário")
                break
            except Exception as e:
                self.logger.error(f"💥 Erro durante monitoramento: {str(e)}")
                time.sleep(self.interval)
                
    def monitor_all_running(self):
        """Monitora todas as tasks em execução"""
        self.logger.info("🔍 MONITORAMENTO DE TODAS AS TASKS RUNNING")
        self.logger.info(f"⏱️ Intervalo: {self.interval}s | Persist: {self.persist}")
        self.logger.info("=" * 60)
        
        completed_tasks = set()
        
        while True:
            try:
                tasks_data = self.get_task_status()
                
                if not tasks_data or 'tasks' not in tasks_data:
                    self.logger.warning("⚠️ Não foi possível obter lista de tasks")
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
                        duration = self.format_duration(task.get('created_at', ''))
                        self.logger.info(f"✅ Task ID {task_id} - COMPLETED! ({duration})")
                        
                if not running_tasks:
                    self.logger.info("🎉 TODAS AS TASKS FORAM COMPLETADAS!")
                    break
                    
                # Exibe status das tasks running
                self.logger.info(f"📊 {len(running_tasks)} tasks ainda executando:")
                for task in running_tasks:
                    task_id = task.get('id')
                    created_at = task.get('created_at', '')
                    last_action = task.get('last_action_cache', '')
                    
                    duration = self.format_duration(created_at) if created_at else "unknown"
                    self.logger.info(f"   🔄 Task ID {task_id} - RUNNING ({duration})")
                    
                    if last_action and len(last_action) > 100:
                        preview = last_action[:100] + "..."
                        self.logger.info(f"      📝 {preview}")
                        
                time.sleep(self.interval)
                
            except KeyboardInterrupt:
                self.logger.info(f"\n⏹️ Monitoramento interrompido pelo usuário")
                break
            except Exception as e:
                self.logger.error(f"💥 Erro durante monitoramento: {str(e)}")
                time.sleep(self.interval)

def main():
    parser = argparse.ArgumentParser(
        description='Sistema de Monitoramento Persistente para Tasks CTO',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos de uso:
  %(prog)s 29                    # Monitora task ID 29
  %(prog)s --all                 # Monitora todas as tasks running
  %(prog)s --all --interval 30   # Monitora todas com intervalo de 30s
  %(prog)s 29 --persist          # Monitora task 29 com persistência
        """
    )
    
    parser.add_argument('task_id', nargs='?', help='ID da task para monitorar (opcional se --all for usado)')
    parser.add_argument('--all', action='store_true', help='Monitora todas as tasks running')
    parser.add_argument('--interval', type=int, default=60, help='Intervalo em segundos (padrão: 60)')
    parser.add_argument('--persist', action='store_true', help='Continua executando mesmo se terminal fechar')
    parser.add_argument('--log-file', default='/home/suthub/.claude/claude-cto/task_monitor.log',
                       help='Arquivo de log (padrão: task_monitor.log)')
    
    args = parser.parse_args()
    
    # Validação dos argumentos
    if not args.all and not args.task_id:
        print("❌ Erro: Especifique uma task ID ou use --all para monitorar todas")
        parser.print_help()
        sys.exit(1)
        
    if args.all and args.task_id:
        print("❌ Erro: Use --all OU especifique uma task ID, não ambos")
        parser.print_help()
        sys.exit(1)
        
    # Cria diretório de logs se não existir
    Path(args.log_file).parent.mkdir(parents=True, exist_ok=True)
    
    # Inicializa monitor
    monitor = TaskMonitor(
        interval=args.interval,
        persist=args.persist,
        log_file=args.log_file
    )
    
    # Executa monitoramento
    if args.all:
        monitor.monitor_all_running()
    else:
        monitor.monitor_specific_task(args.task_id)

if __name__ == '__main__':
    main()