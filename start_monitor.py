#!/usr/bin/env python3
"""
SCRIPT DE INICIALIZAÇÃO AUTOMÁTICA PARA MONITOR DE TASKS CTO
============================================================

Script inteligente que:
- Detecta tasks running automaticamente
- Inicia monitoramento persistente
- Configura logs e notificações
- Gerencia múltiplas instâncias
- Recupera de falhas automaticamente

Uso:
    python start_monitor.py                  # Auto-detecta e monitora todas as tasks running
    python start_monitor.py 29              # Monitora task específica
    python start_monitor.py --daemon        # Executa em background
    python start_monitor.py --ultimate      # Usa monitor ultimate
"""

import sys
import os
import json
import time
import argparse
import subprocess
import logging
from datetime import datetime
from pathlib import Path

# Configurações
SCRIPT_DIR = Path("/home/suthub/.claude/claude-cto")
MONITOR_PY = SCRIPT_DIR / "monitor.py"
MONITOR_ULTIMATE_PY = SCRIPT_DIR / "monitor_ultimate.py"
LOG_FILE = SCRIPT_DIR / "start_monitor.log"

class MonitorStarter:
    """Gerenciador inteligente de inicialização de monitoramento"""
    
    def __init__(self):
        self.setup_logging()
        self.logger = logging.getLogger(__name__)
        
    def setup_logging(self):
        """Configura logging para o starter"""
        SCRIPT_DIR.mkdir(parents=True, exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='[%(asctime)s] %(levelname)s - %(message)s',
            datefmt='%H:%M:%S',
            handlers=[
                logging.FileHandler(LOG_FILE),
                logging.StreamHandler(sys.stdout)
            ]
        )
        
    def get_running_tasks(self):
        """Obtém lista de tasks em execução via MCP"""
        try:
            cmd = ['claude', 'mcp', 'call', 'claude-cto', 'list_tasks', '{"limit": 50}']
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                self.logger.error(f"Erro ao obter tasks: {result.stderr}")
                return []
                
            data = json.loads(result.stdout)
            running_tasks = []
            
            if 'tasks' in data:
                for task in data['tasks']:
                    if task.get('status') == 'running':
                        running_tasks.append({
                            'id': task['id'],
                            'identifier': task.get('identifier'),
                            'working_directory': task.get('working_directory'),
                            'created_at': task.get('created_at'),
                            'started_at': task.get('started_at')
                        })
                        
            return running_tasks
            
        except Exception as e:
            self.logger.error(f"Erro ao obter tasks running: {e}")
            return []
            
    def calculate_runtime(self, start_time_str):
        """Calcula tempo de execução de uma task"""
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
            return "tempo desconhecido"
            
    def start_monitor(self, task_id=None, use_ultimate=False, daemon=False, interval=60):
        """Inicia o monitor apropriado"""
        script = MONITOR_ULTIMATE_PY if use_ultimate else MONITOR_PY
        
        if not script.exists():
            self.logger.error(f"Script de monitoramento não encontrado: {script}")
            return False
            
        # Constrói comando
        cmd = ['python3', str(script)]
        
        if task_id:
            cmd.append(str(task_id))
        else:
            cmd.append('--all')
            
        cmd.extend(['--interval', str(interval)])
        
        if daemon:
            if use_ultimate:
                cmd.append('--daemon')
            else:
                cmd.append('--persist')
                
        # Log do comando que será executado
        self.logger.info(f"Executando: {' '.join(cmd)}")
        
        try:
            if daemon:
                # Executa em background
                process = subprocess.Popen(
                    cmd,
                    cwd=SCRIPT_DIR,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    start_new_session=True
                )
                
                self.logger.info(f"✅ Monitor iniciado em background (PID: {process.pid})")
                return True
            else:
                # Executa em foreground
                process = subprocess.run(cmd, cwd=SCRIPT_DIR)
                return process.returncode == 0
                
        except Exception as e:
            self.logger.error(f"Erro ao iniciar monitor: {e}")
            return False
            
    def auto_start(self, use_ultimate=False, daemon=False, interval=60):
        """Inicia monitoramento automático baseado em tasks running"""
        self.logger.info("🚀 INICIANDO AUTO-START DO SISTEMA DE MONITORAMENTO")
        self.logger.info("=" * 70)
        
        # Obtém tasks running
        self.logger.info("🔍 Buscando tasks em execução...")
        running_tasks = self.get_running_tasks()
        
        if not running_tasks:
            self.logger.warning("⚠️ Nenhuma task running encontrada!")
            self.logger.info("💡 Aguarde algumas tasks serem criadas e tente novamente.")
            return False
            
        # Exibe resumo das tasks encontradas
        self.logger.info(f"📊 Encontradas {len(running_tasks)} task(s) em execução:")
        
        for i, task in enumerate(running_tasks, 1):
            task_name = task['identifier'] or f"Task-{task['id']}"
            runtime = self.calculate_runtime(task['started_at']) if task['started_at'] else "unknown"
            
            self.logger.info(f"   {i}. ID {task['id']} '{task_name}' - {runtime}")
            
            # Destaca tasks de longa execução
            if runtime and ('h' in runtime):
                self.logger.warning(f"      ⚠️ Task de longa execução detectada!")
                
        self.logger.info("=" * 70)
        
        # Decide estratégia de monitoramento
        if len(running_tasks) == 1:
            # Uma única task - monitoramento específico
            task = running_tasks[0]
            task_id = task['id']
            task_name = task['identifier'] or f"Task-{task_id}"
            
            self.logger.info(f"🎯 Iniciando monitoramento específico da Task {task_id} '{task_name}'")
            return self.start_monitor(task_id=task_id, use_ultimate=use_ultimate, 
                                   daemon=daemon, interval=interval)
        else:
            # Múltiplas tasks - monitoramento global
            self.logger.info(f"🌍 Iniciando monitoramento global de {len(running_tasks)} tasks")
            return self.start_monitor(use_ultimate=use_ultimate, daemon=daemon, 
                                   interval=interval)
                                   
    def show_status(self):
        """Mostra status atual dos monitores"""
        self.logger.info("📊 STATUS DOS MONITORES DE TASKS CTO")
        self.logger.info("=" * 50)
        
        # Verifica status do daemon ultimate
        if MONITOR_ULTIMATE_PY.exists():
            try:
                result = subprocess.run([
                    'python3', str(MONITOR_ULTIMATE_PY), '--status'
                ], capture_output=True, text=True, cwd=SCRIPT_DIR)
                
                if result.returncode == 0:
                    status_data = json.loads(result.stdout)
                    if status_data['status'] == 'running':
                        self.logger.info(f"✅ Monitor Ultimate ATIVO (PID: {status_data['pid']})")
                        self.logger.info(f"   💾 Memória: {status_data['memory_mb']:.1f}MB")
                        self.logger.info(f"   🕒 Iniciado: {status_data['start_time']}")
                    else:
                        self.logger.info("⭕ Monitor Ultimate INATIVO")
                else:
                    self.logger.info("❓ Monitor Ultimate status desconhecido")
                    
            except Exception as e:
                self.logger.error(f"Erro ao verificar status ultimate: {e}")
                
        # Verifica tasks running atuais
        running_tasks = self.get_running_tasks()
        if running_tasks:
            self.logger.info(f"🔄 {len(running_tasks)} task(s) ainda em execução:")
            for task in running_tasks:
                task_name = task['identifier'] or f"Task-{task['id']}"
                runtime = self.calculate_runtime(task['started_at']) if task['started_at'] else "unknown"
                self.logger.info(f"   • ID {task['id']} '{task_name}' - {runtime}")
        else:
            self.logger.info("✅ Nenhuma task running no momento")
            
        self.logger.info("=" * 50)

def main():
    parser = argparse.ArgumentParser(
        description='Auto-Starter para Sistema de Monitoramento de Tasks CTO',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
GUIA DE USO COMPLETO:

🚀 AUTO-START INTELIGENTE:
  %(prog)s                          # Auto-detecta e monitora tasks running
  %(prog)s --ultimate               # Usa monitor ultimate com recursos avançados
  %(prog)s --daemon                 # Executa em background
  %(prog)s --ultimate --daemon      # Monitor ultimate em background

🎯 MONITORAMENTO ESPECÍFICO:
  %(prog)s 29                       # Monitora task ID 29 especificamente
  %(prog)s 29 --ultimate            # Monitora task 29 com monitor ultimate
  %(prog)s 29 --daemon --interval 30 # Background + intervalo 30s

📊 GERENCIAMENTO:
  %(prog)s --status                 # Mostra status dos monitores ativos
  %(prog)s --stop                   # Para todos os monitores em execução

⚙️ CONFIGURAÇÕES:
  %(prog)s --interval 30            # Intervalo de check personalizado (30s)
  %(prog)s --all --ultimate --daemon --interval 45
    └─ Monitora todas as tasks com monitor ultimate em background

💡 CASOS DE USO TÍPICOS:

1. PRIMEIRO USO (RECOMENDADO):
   python start_monitor.py --ultimate --daemon
   → Auto-detecta tasks e inicia monitoramento em background

2. TASK ESPECÍFICA PROBLEMÁTICA:
   python start_monitor.py 29 --ultimate --interval 30
   → Monitora task 29 de perto com checks a cada 30s

3. MONITORAMENTO PERSISTENTE:
   python start_monitor.py --ultimate --daemon --interval 60
   → Monitora todas as tasks em background com checks de 1min

4. VERIFICAR STATUS:
   python start_monitor.py --status
   → Vê quantas tasks estão executando e status dos monitores
        """
    )
    
    parser.add_argument('task_id', nargs='?', 
                       help='ID específico da task para monitorar (opcional)')
    parser.add_argument('--ultimate', action='store_true', 
                       help='Usa monitor ultimate com recursos avançados')
    parser.add_argument('--daemon', action='store_true', 
                       help='Executa monitor em background (daemon mode)')
    parser.add_argument('--interval', type=int, default=60, 
                       help='Intervalo entre checks em segundos (padrão: 60)')
    parser.add_argument('--status', action='store_true', 
                       help='Mostra status atual dos monitores')
    parser.add_argument('--stop', action='store_true', 
                       help='Para monitores em execução')
    parser.add_argument('--all', action='store_true', 
                       help='Força monitoramento de todas as tasks')
    
    args = parser.parse_args()
    
    starter = MonitorStarter()
    
    # Comandos de gerenciamento
    if args.status:
        starter.show_status()
        return
        
    if args.stop:
        if MONITOR_ULTIMATE_PY.exists():
            try:
                result = subprocess.run([
                    'python3', str(MONITOR_ULTIMATE_PY), '--stop'
                ], cwd=SCRIPT_DIR, capture_output=True, text=True)
                
                if result.returncode == 0:
                    print("✅ Monitor ultimate parado com sucesso")
                else:
                    print("⚠️ Monitor ultimate não estava executando ou erro ao parar")
            except Exception as e:
                print(f"❌ Erro ao parar monitor ultimate: {e}")
        else:
            print("❌ Monitor ultimate não encontrado")
        return
        
    # Validação de intervalo
    if args.interval < 5:
        starter.logger.warning(f"⚠️ Intervalo {args.interval}s muito baixo. Ajustando para 5s")
        args.interval = 5
    elif args.interval > 600:
        starter.logger.warning(f"⚠️ Intervalo {args.interval}s muito alto. Ajustando para 600s")
        args.interval = 600
        
    # Banner de inicialização
    starter.logger.info("🌟" * 70)
    starter.logger.info("🚀 AUTO-STARTER SISTEMA DE MONITORAMENTO CTO")
    starter.logger.info(f"📅 Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    starter.logger.info(f"⚙️ Monitor: {'Ultimate' if args.ultimate else 'Standard'}")
    starter.logger.info(f"🔧 Modo: {'Daemon (Background)' if args.daemon else 'Foreground'}")
    starter.logger.info(f"⏱️ Intervalo: {args.interval}s")
    starter.logger.info("🌟" * 70)
    
    try:
        if args.task_id:
            # Monitoramento específico
            starter.logger.info(f"🎯 Iniciando monitoramento da Task {args.task_id}")
            success = starter.start_monitor(
                task_id=args.task_id,
                use_ultimate=args.ultimate,
                daemon=args.daemon,
                interval=args.interval
            )
        elif args.all:
            # Força monitoramento global
            starter.logger.info("🌍 Iniciando monitoramento global de todas as tasks")
            success = starter.start_monitor(
                use_ultimate=args.ultimate,
                daemon=args.daemon,
                interval=args.interval
            )
        else:
            # Auto-start inteligente
            success = starter.auto_start(
                use_ultimate=args.ultimate,
                daemon=args.daemon,
                interval=args.interval
            )
            
        if success:
            if args.daemon:
                starter.logger.info("🎉 Monitor iniciado com sucesso em background!")
                starter.logger.info(f"📁 Logs disponíveis em: {LOG_FILE}")
                starter.logger.info("💡 Use --status para verificar o progresso")
            else:
                starter.logger.info("✅ Monitoramento concluído!")
        else:
            starter.logger.error("❌ Falha ao iniciar monitoramento")
            sys.exit(1)
            
    except KeyboardInterrupt:
        starter.logger.info("\n⏹️ Auto-starter interrompido pelo usuário")
        sys.exit(0)
    except Exception as e:
        starter.logger.error(f"💥 Erro fatal no auto-starter: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()