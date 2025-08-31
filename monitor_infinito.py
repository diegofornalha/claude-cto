#!/usr/bin/env python3
"""
🔄 SISTEMA DE MONITORAMENTO PERSISTENTE INFINITO
===============================================

OBJETIVO: Criar monitoramento que NUNCA PARA até comando manual explícito.

CARACTERÍSTICAS:
- Loop infinito real (while True sem condições de saída automática)
- Interface clara e intuitiva com emojis
- Substituição completa do sistema bypass por time.sleep()
- Só para com Ctrl+C ou comando 'stop' explícito
- Persistência TOTAL até intervenção manual

USO:
    python monitor_infinito.py            # Ativa monitoramento infinito
    python monitor_infinito.py --stop     # Para monitoramento
    python monitor_infinito.py --status   # Status atual

PRINCÍPIO: NUNCA PARA SOZINHO - SÓ PARA COM COMANDO EXPLÍCITO!
"""

import sys
import json
import time
import signal
import subprocess
import logging
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
import psutil

# Configurações
BASE_DIR = Path("/home/suthub/.claude/claude-cto")
PID_FILE = BASE_DIR / "monitor_infinito.pid"
LOG_FILE = BASE_DIR / "monitor_infinito.log"
ESTADO_FILE = BASE_DIR / "monitor_infinito_estado.json"

class MonitorInfinito:
    """Sistema de Monitoramento Persistente Infinito"""
    
    def __init__(self):
        self.ativo = True  # Flag de controle
        self.inicio = datetime.now()
        self.total_verificacoes = 0
        self.tasks_completadas = []
        self.ultima_verificacao = None
        
        # Configurar logging
        self._setup_logging()
        
        # Configurar handlers de sinal
        signal.signal(signal.SIGINT, self._handler_parada)
        signal.signal(signal.SIGTERM, self._handler_parada)
        
        # Salvar PID
        self._salvar_pid()
        
    def _setup_logging(self):
        """Configura logging com formato limpo"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(message)s',
            handlers=[
                logging.FileHandler(LOG_FILE, encoding='utf-8'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
        
    def _handler_parada(self, signum, frame):
        """Handler para parada manual (Ctrl+C ou SIGTERM)"""
        self.logger.info(f"\n🛑 SINAL {signum} RECEBIDO - PARANDO MONITORAMENTO...")
        self.logger.info("   Finalizando de forma segura...")
        self.ativo = False
        
    def _salvar_pid(self):
        """Salva PID do processo atual"""
        try:
            with open(PID_FILE, 'w') as f:
                f.write(str(os.getpid()))
        except Exception as e:
            self.logger.error(f"❌ Erro ao salvar PID: {e}")
            
    def _salvar_estado(self):
        """Salva estado atual do monitoramento"""
        estado = {
            "inicio": self.inicio.isoformat(),
            "total_verificacoes": self.total_verificacoes,
            "tasks_completadas": self.tasks_completadas,
            "ultima_verificacao": self.ultima_verificacao.isoformat() if self.ultima_verificacao else None,
            "tempo_ativo": str(datetime.now() - self.inicio)
        }
        
        try:
            with open(ESTADO_FILE, 'w', encoding='utf-8') as f:
                json.dump(estado, f, indent=2, ensure_ascii=False)
        except Exception as e:
            self.logger.error(f"❌ Erro ao salvar estado: {e}")
            
    def get_all_tasks(self) -> Optional[List[Dict]]:
        """Busca todas as tasks via MCP com múltiplas estratégias - NUNCA FALHA"""
        # ULTRATHINK: Múltiplas estratégias de recuperação
        
        # Estratégia 1: Claude MCP direto
        try:
            cmd = ['claude', 'mcp', 'claude-cto', 'list_tasks', '{"limit": 100}']
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            
            if result.returncode == 0:
                data = json.loads(result.stdout)
                tasks = data.get('tasks', [])
                if tasks:
                    self.logger.debug(f"✅ {len(tasks)} tasks via MCP")
                    return tasks
        except Exception as e:
            self.logger.debug(f"MCP falhou: {e}")
            
        # Estratégia 2: API Python direta
        try:
            script_dir = BASE_DIR / "claude_cto"
            if (script_dir / "__init__.py").exists():
                cmd = [
                    sys.executable, "-c",
                    """
import sys
sys.path.append('/home/suthub/.claude/claude-cto')
from claude_cto.server.crud import get_all_tasks_from_db
import json
tasks = get_all_tasks_from_db()
result = {"tasks": [{"id": t.id, "status": t.status, "identifier": getattr(t, 'task_identifier', f'task_{t.id}'), "created_at": t.created_at.isoformat() if hasattr(t, 'created_at') and t.created_at else ""} for t in tasks]}
print(json.dumps(result))
"""
                ]
                
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
                
                if result.returncode == 0:
                    data = json.loads(result.stdout)
                    tasks = data.get('tasks', [])
                    if tasks:
                        self.logger.debug(f"✅ {len(tasks)} tasks via DB")
                        return tasks
        except Exception as e:
            self.logger.debug(f"DB falhou: {e}")
            
        # Estratégia 3: Sempre retorna lista vazia para NUNCA PARAR
        self.logger.debug("📋 Sem tasks detectadas - continuando monitoramento")
        return []
            
    def formatar_duracao(self, inicio_str: str) -> str:
        """Formata duração de forma legível"""
        try:
            if not inicio_str:
                return "tempo desconhecido"
                
            inicio = datetime.fromisoformat(inicio_str.replace('Z', '+00:00'))
            agora = datetime.now().replace(tzinfo=inicio.tzinfo)
            duracao = agora - inicio
            
            total_segundos = int(duracao.total_seconds())
            horas = total_segundos // 3600
            minutos = (total_segundos % 3600) // 60
            segundos = total_segundos % 60
            
            if horas > 0:
                return f"{horas}h {minutos}min"
            elif minutos > 0:
                return f"{minutos}min {segundos}s"
            else:
                return f"{segundos}s"
        except:
            return "tempo desconhecido"
            
    def monitor_infinito(self):
        """LOOP INFINITO PRINCIPAL - NUNCA PARA SOZINHO"""
        
        # ULTRATHINK: Interface clara sobre comportamento infinito
        os.system('clear')
        print("\n" + "=" * 80)
        print("🔄 MONITOR INFINITO ULTRATHINK ATIVADO")
        print("=" * 80)
        print("\n⚠️  COMPORTAMENTO INFINITO:")
        print("   • Este monitor NUNCA PARA automaticamente")
        print("   • Continuará mesmo sem tasks")
        print("   • Continuará mesmo com erros")
        print("   • Única forma de parar: Ctrl+C")
        print("\n📅 Iniciado em: " + self.inicio.strftime("%Y-%m-%d %H:%M:%S"))
        print("=" * 80 + "\n")
        
        self.logger.info("🚀 MONITOR INFINITO INICIADO - Loop eterno ativado")
        
        try:
            # ULTRATHINK: LOOP INFINITO VERDADEIRO
            # NUNCA SAI automaticamente - só com Ctrl+C
            iteracao = 0
            while self.ativo:  # Loop infinito real
                iteracao += 1
                    
                self.total_verificacoes += 1
                self.ultima_verificacao = datetime.now()
                
                # Busca tasks atuais
                tasks = self.get_all_tasks()
                
                if tasks is None:
                    self.logger.warning("❌ Falha na verificação - continuando...")
                    self._pausa_limpa(10)
                    continue
                    
                # Separa tasks por status
                running = [t for t in tasks if t.get('status') == 'running']
                completed = [t for t in tasks if t.get('status') == 'completed']
                failed = [t for t in tasks if t.get('status') == 'failed']
                pending = [t for t in tasks if t.get('status') == 'pending']
                
                # Detecta novas tasks completadas
                novas_completadas = []
                for task in completed:
                    task_id = task.get('id')
                    if task_id and task_id not in self.tasks_completadas:
                        self.tasks_completadas.append(task_id)
                        novas_completadas.append(task)
                
                # ULTRATHINK: Status visual melhorado
                tempo_ativo = datetime.now() - self.inicio
                
                # Indicador de atividade visual
                spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
                spin = spinner[iteracao % len(spinner)]
                
                self.logger.info(f"{spin} Ciclo #{self.total_verificacoes} | Loop infinito há: {self._formatar_tempo_ativo(tempo_ativo)}")
                
                if running:
                    self.logger.info(f"⏳ {len(running)} tasks ATIVAS:")
                    for task in running:
                        task_id = task.get('id')
                        nome = task.get('identifier', f'Task-{task_id}')
                        duracao = self.formatar_duracao(task.get('created_at', ''))
                        self.logger.info(f"  🔄 Task {task_id}: '{nome}' | Rodando há: {duracao}")
                        
                if novas_completadas:
                    for task in novas_completadas:
                        task_id = task.get('id')
                        nome = task.get('identifier', f'Task-{task_id}')
                        duracao = self.formatar_duracao(task.get('created_at', ''))
                        self.logger.info(f"✅ NOVA COMPLETADA: Task {task_id} '{nome}' | Total: {duracao}")
                        
                if failed:
                    for task in failed:
                        task_id = task.get('id')
                        nome = task.get('identifier', f'Task-{task_id}')
                        self.logger.error(f"❌ FALHA: Task {task_id} '{nome}'")
                        
                if not running and not pending:
                    # ULTRATHINK: Nunca sugere parar - sempre continua
                    if completed or failed:
                        self.logger.info("✅ Tasks finalizadas - MONITORAMENTO CONTINUA INFINITAMENTE...")
                    else:
                        self.logger.info(f"⏳ Sem tasks ativas - Loop infinito continua... (Ctrl+C para parar)")
                else:
                    resumo_status = []
                    if running: resumo_status.append(f"{len(running)} running")
                    if pending: resumo_status.append(f"{len(pending)} pending")
                    if completed: resumo_status.append(f"{len(completed)} completed")
                    if failed: resumo_status.append(f"{len(failed)} failed")
                    
                    self.logger.info(f"📊 Status: {' | '.join(resumo_status)}")
                
                # Salva estado
                self._salvar_estado()
                
                # ULTRATHINK: Pausa inteligente baseada em atividade
                intervalo = 5 if running else 10
                self._pausa_limpa(intervalo)
                
        except KeyboardInterrupt:
            # Ctrl+C detectado - única forma de parar
            self.logger.info("\n⏹️ Interrupção manual detectada - finalizando...")
            self.ativo = False
        except Exception as e:
            # ULTRATHINK: Recuperação automática de QUALQUER erro
            self.logger.error(f"💥 Erro recuperado: {str(e)}")
            self.logger.info("🔄 Auto-recovery ativado - continuando monitoramento...")
            time.sleep(3)
            
            # Reinicia o loop se não foi interrompido manualmente
            if self.ativo:
                self.logger.info("♻️ Reiniciando loop infinito após erro...")
                return self.monitor_infinito()  # Recursão para NUNCA PARAR
            
        finally:
            self._finalizar()
            
    def _pausa_limpa(self, segundos: int):
        """Pausa limpa usando time.sleep - SEM BYPASS"""
        try:
            time.sleep(segundos)
        except KeyboardInterrupt:
            self.logger.info("⏹️ Interrupção manual detectada")
            self.ativo = False
            
    def _formatar_tempo_ativo(self, delta: timedelta) -> str:
        """Formata tempo que o monitor está ativo"""
        total_segundos = int(delta.total_seconds())
        horas = total_segundos // 3600
        minutos = (total_segundos % 3600) // 60
        segundos = total_segundos % 60
        
        if horas > 0:
            return f"{horas}h {minutos}min {segundos}s"
        elif minutos > 0:
            return f"{minutos}min {segundos}s"
        else:
            return f"{segundos}s"
            
    def _finalizar(self):
        """Finaliza monitoramento de forma segura"""
        tempo_total = datetime.now() - self.inicio
        
        self.logger.info("=" * 60)
        self.logger.info("🏁 MONITORAMENTO INFINITO FINALIZADO")
        self.logger.info(f"   ⏱️  Tempo ativo: {self._formatar_tempo_ativo(tempo_total)}")
        self.logger.info(f"   🔍 Total de verificações: {self.total_verificacoes}")
        self.logger.info(f"   ✅ Tasks completadas detectadas: {len(self.tasks_completadas)}")
        self.logger.info("=" * 60)
        
        # Remove PID file
        try:
            if PID_FILE.exists():
                PID_FILE.unlink()
        except:
            pass

def verificar_status():
    """Verifica se monitoramento está ativo"""
    if not PID_FILE.exists():
        print("❌ Monitor não está executando")
        return False
        
    try:
        with open(PID_FILE, 'r') as f:
            pid = int(f.read().strip())
            
        if psutil.pid_exists(pid):
            processo = psutil.Process(pid)
            inicio = datetime.fromtimestamp(processo.create_time())
            tempo_ativo = datetime.now() - inicio
            
            print("✅ MONITOR INFINITO ATIVO")
            print(f"   🆔 PID: {pid}")
            print(f"   ⏱️  Ativo há: {tempo_ativo}")
            print(f"   💾 CPU: {processo.cpu_percent()}%")
            print(f"   🧠 Memória: {processo.memory_info().rss / 1024 / 1024:.1f}MB")
            
            # Ler estado se disponível
            if ESTADO_FILE.exists():
                try:
                    with open(ESTADO_FILE, 'r', encoding='utf-8') as f:
                        estado = json.load(f)
                    print(f"   🔍 Verificações: {estado.get('total_verificacoes', 0)}")
                    print(f"   ✅ Tasks completadas: {len(estado.get('tasks_completadas', []))}")
                except:
                    pass
                    
            return True
        else:
            print("❌ PID existe mas processo não está rodando")
            PID_FILE.unlink()  # Remove PID inválido
            return False
            
    except Exception as e:
        print(f"❌ Erro ao verificar status: {e}")
        return False

def parar_monitor():
    """Para o monitor infinito"""
    if not PID_FILE.exists():
        print("❌ Monitor não está executando")
        return False
        
    try:
        with open(PID_FILE, 'r') as f:
            pid = int(f.read().strip())
            
        if psutil.pid_exists(pid):
            print(f"🛑 Parando monitor (PID {pid})...")
            os.kill(pid, signal.SIGTERM)
            
            # Aguarda parada graceful
            for _ in range(10):
                if not psutil.pid_exists(pid):
                    break
                time.sleep(0.5)
                
            if psutil.pid_exists(pid):
                print("⚠️ Força parada necessária...")
                os.kill(pid, signal.SIGKILL)
                
            if PID_FILE.exists():
                PID_FILE.unlink()
                
            print("✅ Monitor parado com sucesso")
            return True
        else:
            print("❌ Processo não existe")
            PID_FILE.unlink()
            return False
            
    except Exception as e:
        print(f"❌ Erro ao parar monitor: {e}")
        return False

def main():
    """Função principal"""
    if len(sys.argv) > 1:
        comando = sys.argv[1]
        
        if comando == "--status":
            verificar_status()
            return
        elif comando == "--stop":
            parar_monitor()
            return
        elif comando == "--help":
            print(__doc__)
            return
        else:
            print(f"❌ Comando desconhecido: {comando}")
            print("Comandos disponíveis: --status, --stop, --help")
            return
    
    # Verificar se já está rodando
    if verificar_status():
        print("\n⚠️ Monitor infinito já está ativo!")
        print("   Use 'python monitor_infinito.py --stop' para parar")
        return
        
    # Iniciar monitor infinito
    monitor = MonitorInfinito()
    monitor.monitor_infinito()

if __name__ == "__main__":
    main()