#!/usr/bin/env python3
"""
Monitor ULTRATHINK - Acompanha performance das tarefas CTO em tempo real
"""
import json
import time
import subprocess
from datetime import datetime
from pathlib import Path

def get_task_status():
    """Busca status das tarefas no banco de dados SQLite"""
    db_path = Path.home() / ".claude-cto" / "tasks.db"
    
    if not db_path.exists():
        print("❌ Banco de dados não encontrado")
        return []
    
    try:
        # Query SQLite diretamente
        cmd = f'sqlite3 {db_path} "SELECT id, task_identifier, status, created_at, started_at FROM tasks WHERE status = \'running\' ORDER BY id DESC LIMIT 10"'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            tasks = []
            for line in lines:
                if line:
                    parts = line.split('|')
                    if len(parts) >= 5:
                        tasks.append({
                            'id': parts[0],
                            'identifier': parts[1] if parts[1] else 'N/A',
                            'status': parts[2],
                            'created': parts[3][:19] if parts[3] else 'N/A',
                            'started': parts[4][:19] if parts[4] else 'N/A'
                        })
            return tasks
    except Exception as e:
        print(f"❌ Erro ao acessar banco: {e}")
        return []

def monitor_performance():
    """Monitora CPU e memória"""
    try:
        # CPU
        cpu_cmd = "top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1"
        cpu = subprocess.run(cpu_cmd, shell=True, capture_output=True, text=True)
        cpu_usage = cpu.stdout.strip() if cpu.returncode == 0 else "N/A"
        
        # Memory
        mem_cmd = "free -m | grep Mem | awk '{print ($3/$2) * 100.0}'"
        mem = subprocess.run(mem_cmd, shell=True, capture_output=True, text=True)
        mem_usage = f"{float(mem.stdout.strip()):.1f}" if mem.returncode == 0 else "N/A"
        
        return cpu_usage, mem_usage
    except:
        return "N/A", "N/A"

def main():
    print("\n" + "="*80)
    print("🚀 ULTRATHINK MONITOR - Acompanhamento de Tarefas CTO")
    print("="*80)
    
    while True:
        # Limpa tela
        print("\033[H\033[J", end="")
        
        # Header
        print(f"\n📊 MONITORAMENTO EM TEMPO REAL - {datetime.now().strftime('%H:%M:%S')}")
        print("-"*80)
        
        # Performance do sistema
        cpu, mem = monitor_performance()
        print(f"💻 Sistema: CPU {cpu}% | RAM {mem}%")
        print("-"*80)
        
        # Tarefas em execução
        tasks = get_task_status()
        
        if tasks:
            print(f"\n⚡ TAREFAS EM EXECUÇÃO ({len(tasks)} simultâneas):")
            print("-"*80)
            
            for i, task in enumerate(tasks, 1):
                # Calcula tempo de execução
                if task['started'] != 'N/A':
                    try:
                        started = datetime.strptime(task['started'], '%Y-%m-%d %H:%M:%S')
                        elapsed = datetime.now() - started
                        elapsed_str = f"{elapsed.seconds // 60}m {elapsed.seconds % 60}s"
                    except:
                        elapsed_str = "N/A"
                else:
                    elapsed_str = "N/A"
                
                print(f"\n{i}. Task ID: {task['id']}")
                print(f"   📦 Identificador: {task['identifier']}")
                print(f"   ⏱️ Tempo execução: {elapsed_str}")
                print(f"   🕐 Iniciado: {task['started']}")
        else:
            print("\n✅ Nenhuma tarefa em execução no momento")
        
        print("\n" + "-"*80)
        print("💡 Com 10 workers configurados, o CTO pode executar até 10 tarefas simultâneas")
        print("🔄 Atualizando a cada 5 segundos... (Ctrl+C para sair)")
        
        time.sleep(5)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Monitor encerrado")