#!/usr/bin/env python3
"""
Monitor de Tasks do CTO - Acompanha execução e detecta tasks travadas
"""
import requests
import time
from datetime import datetime, timedelta
import json
from typing import Dict, List
import sys

API_URL = "http://127.0.0.1:8741"

class TaskMonitor:
    def __init__(self):
        self.stuck_threshold = timedelta(minutes=10)  # Tasks rodando > 10 min são suspeitas
        self.check_interval = 5  # Verificar a cada 5 segundos
        
    def get_tasks(self) -> List[Dict]:
        """Busca todas as tasks do servidor"""
        try:
            response = requests.get(f"{API_URL}/api/v1/tasks")
            return response.json()
        except Exception as e:
            print(f"Erro ao buscar tasks: {e}")
            return []
    
    def check_stuck_tasks(self, tasks: List[Dict]) -> List[Dict]:
        """Identifica tasks potencialmente travadas"""
        stuck_tasks = []
        now = datetime.now()
        
        for task in tasks:
            if task['status'] == 'running' and task['started_at']:
                started = datetime.fromisoformat(task['started_at'])
                running_time = now - started
                
                if running_time > self.stuck_threshold:
                    stuck_tasks.append({
                        'id': task['id'],
                        'running_time': str(running_time),
                        'last_action': task.get('last_action_cache', '')[:100]
                    })
        
        return stuck_tasks
    
    def display_status(self, tasks: List[Dict]):
        """Mostra status das tasks de forma clara"""
        print("\n" + "="*60)
        print(f"STATUS DAS TASKS - {datetime.now().strftime('%H:%M:%S')}")
        print("="*60)
        
        # Contar por status
        status_count = {}
        for task in tasks:
            status = task['status']
            status_count[status] = status_count.get(status, 0) + 1
        
        print("\nRESUMO:")
        for status, count in status_count.items():
            emoji = {
                'running': '🔄',
                'completed': '✅',
                'failed': '❌',
                'pending': '⏳',
                'waiting': '⏸️'
            }.get(status, '❓')
            print(f"  {emoji} {status.upper()}: {count}")
        
        # Mostrar tasks em execução
        running_tasks = [t for t in tasks if t['status'] == 'running']
        if running_tasks:
            print("\nTASKS EM EXECUÇÃO:")
            for task in running_tasks:
                started = datetime.fromisoformat(task['started_at']) if task['started_at'] else datetime.now()
                running_time = datetime.now() - started
                minutes = int(running_time.total_seconds() / 60)
                seconds = int(running_time.total_seconds() % 60)
                
                print(f"  ID {task['id']}: {minutes}min {seconds}s")
                if task.get('last_action_cache'):
                    action = task['last_action_cache'][:80]
                    print(f"    Última ação: {action}...")
        
        # Alertar sobre tasks travadas
        stuck_tasks = self.check_stuck_tasks(tasks)
        if stuck_tasks:
            print("\n⚠️  ALERTA - POSSÍVEIS TASKS TRAVADAS:")
            for stuck in stuck_tasks:
                print(f"  Task {stuck['id']}: Rodando há {stuck['running_time']}")
                print(f"    Última ação: {stuck['last_action']}")
    
    def monitor_continuous(self):
        """Monitora continuamente as tasks"""
        print("Iniciando monitoramento de tasks...")
        print("Pressione Ctrl+C para parar\n")
        
        try:
            while True:
                tasks = self.get_tasks()
                if tasks:
                    # Limpar tela (funciona em Linux/Mac)
                    print("\033[2J\033[H", end='')
                    self.display_status(tasks)
                    
                    # Verificar se todas completaram
                    running = [t for t in tasks if t['status'] == 'running']
                    if not running and any(t['status'] == 'completed' for t in tasks):
                        print("\n✨ Todas as tasks foram concluídas!")
                        break
                
                time.sleep(self.check_interval)
                
        except KeyboardInterrupt:
            print("\n\nMonitoramento interrompido.")
            sys.exit(0)

if __name__ == "__main__":
    monitor = TaskMonitor()
    
    if len(sys.argv) > 1 and sys.argv[1] == "--once":
        # Execução única
        tasks = monitor.get_tasks()
        if tasks:
            monitor.display_status(tasks)
    else:
        # Monitoramento contínuo
        monitor.monitor_continuous()