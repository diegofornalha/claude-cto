#!/usr/bin/env python3
"""
Fix para o problema de timeout do CTO
Adiciona timeout mais agressivo e mata processos travados
"""

import asyncio
import signal
import os
from pathlib import Path

# Configurar timeout mais agressivo
AGGRESSIVE_TIMEOUT = {
    "haiku": 300,    # 5 minutos
    "sonnet": 900,   # 15 minutos  
    "opus": 1800,    # 30 minutos (metade do original)
}

def kill_stuck_processes():
    """Mata processos Claude travados há mais de 30 minutos"""
    import subprocess
    import time
    
    # Buscar processos claude antigos
    cmd = "ps aux | grep claude | grep -v grep"
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    for line in result.stdout.splitlines():
        parts = line.split()
        if len(parts) > 10:
            pid = parts[1]
            # Verificar tempo de execução
            time_str = parts[9]
            if ':' in time_str:
                hours, minutes = map(int, time_str.split(':'))
                total_minutes = hours * 60 + minutes
                
                if total_minutes > 30:  # Mais de 30 minutos
                    print(f"Matando processo travado PID {pid} (rodando há {total_minutes} minutos)")
                    try:
                        os.kill(int(pid), signal.SIGTERM)
                        time.sleep(1)
                        os.kill(int(pid), signal.SIGKILL)
                    except:
                        pass

def patch_executor():
    """Patch no executor para adicionar timeout mais agressivo"""
    executor_file = Path.home() / ".claude/claude-cto/claude_cto/server/executor.py"
    
    if executor_file.exists():
        content = executor_file.read_text()
        
        # Substituir timeouts
        new_content = content.replace(
            '"opus": 3600,   # 60 minutes',
            '"opus": 1800,   # 30 minutes - PATCHED'
        ).replace(
            '"sonnet": 1800, # 30 minutes',
            '"sonnet": 900,  # 15 minutes - PATCHED'
        )
        
        # Adicionar kill signal após timeout
        if "PATCHED" not in content:
            executor_file.write_text(new_content)
            print("✅ Executor patcheado com timeouts mais agressivos")
        else:
            print("⚠️ Executor já estava patcheado")

if __name__ == "__main__":
    print("🔧 Aplicando fix para travamentos do CTO...")
    
    # 1. Matar processos travados
    kill_stuck_processes()
    
    # 2. Aplicar patch no executor
    patch_executor()
    
    print("\n✅ Fix aplicado! Reinicie o servidor CTO para aplicar as mudanças.")
    print("\nRecomendações:")
    print("1. Use tarefas menores e mais específicas")
    print("2. Prefira Sonnet ao invés de Opus")
    print("3. Monitore ativamente com 'claude-cto list'")