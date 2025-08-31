#!/usr/bin/env python3
"""
🔄 SISTEMA DE MONITORAMENTO PERSISTENTE INFINITO COM NOTIFICAÇÕES CURSOR
======================================================================

OBJETIVO: Monitor infinito integrado com sistema de notificações visuais para Cursor IDE.

NOVAS CARACTERÍSTICAS:
- Sistema de notificações visuais completo
- Detecção automática do Cursor IDE
- Notificações com sons e cores
- Títulos dinâmicos da janela do terminal
- Configurações personalizáveis

ULTRATHINK: Integração completa entre monitoramento e notificações para máxima visibilidade.

USO:
    python monitor_infinito_notif.py              # Ativa monitor com notificações
    python monitor_infinito_notif.py --stop       # Para monitor
    python monitor_infinito_notif.py --status     # Status atual
    python monitor_infinito_notif.py --test-notif # Testa notificações
    python monitor_infinito_notif.py --config     # Configura notificações

PRINCÍPIO: NUNCA PARA SOZINHO + NOTIFICAÇÕES INTELIGENTES!
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
from typing import Dict, List, Optional, Any, Set
import psutil

# Importa sistema de notificações
try:
    from cursor_notifications import CursorNotifications
except ImportError:
    # Fallback se cursor_notifications não estiver disponível
    class CursorNotifications:
        def __init__(self): pass
        def notify_task_completion(self, *args, **kwargs): pass
        def notify_monitor_event(self, *args, **kwargs): pass
        def get_notification_summary(self): return {}

# Configurações
BASE_DIR = Path("/home/suthub/.claude/claude-cto")
PID_FILE = BASE_DIR / "monitor_infinito_notif.pid"
LOG_FILE = BASE_DIR / "monitor_infinito_notif.log"
ESTADO_FILE = BASE_DIR / "monitor_infinito_notif_estado.json"

class MonitorInfinitoNotif:
    """Sistema de Monitoramento Persistente Infinito com Notificações"""
    
    def __init__(self):
        self.ativo = True
        self.inicio = datetime.now()
        self.total_verificacoes = 0
        self.tasks_completadas = set()  # Usar set para evitar duplicatas
        self.tasks_falhadas = set()
        self.ultima_verificacao = None
        
        # Sistema de notificações
        self.notificador = CursorNotifications()
        
        # Configurar logging
        self._setup_logging()
        
        # Configurar handlers de sinal
        signal.signal(signal.SIGINT, self._handler_parada)
        signal.signal(signal.SIGTERM, self._handler_parada)
        
        # Salvar PID
        self._salvar_pid()
        
        # Notificar início do monitor
        self.notificador.notify_monitor_event("start", "Monitor Infinito com Notificações iniciado")
        
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
        self.notificador.notify_monitor_event("stop", f"Monitor parado por sinal {signum}")
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
        notif_summary = self.notificador.get_notification_summary()
        
        estado = {
            "inicio": self.inicio.isoformat(),
            "total_verificacoes": self.total_verificacoes,
            "tasks_completadas": list(self.tasks_completadas),
            "tasks_falhadas": list(self.tasks_falhadas),
            "ultima_verificacao": self.ultima_verificacao.isoformat() if self.ultima_verificacao else None,
            "tempo_ativo": str(datetime.now() - self.inicio),
            "notificacoes": notif_summary
        }
        
        try:
            with open(ESTADO_FILE, 'w', encoding='utf-8') as f:
                json.dump(estado, f, indent=2, ensure_ascii=False)
        except Exception as e:
            self.logger.error(f"❌ Erro ao salvar estado: {e}")
            
    def get_all_tasks(self) -> Optional[List[Dict]]:
        """Busca todas as tasks via MCP com múltiplas estratégias - NUNCA FALHA"""
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
    
    def _detectar_mudancas_status(self, tasks: List[Dict]) -> Dict[str, List[Dict]]:
        """Detecta mudanças de status das tasks para notificar"""
        mudancas = {
            "novas_completadas": [],
            "novas_falhadas": [],
            "novas_iniciadas": []
        }
        
        # Verifica novas tasks completadas
        for task in tasks:
            task_id = task.get('id')
            if not task_id:
                continue
                
            if task.get('status') == 'completed' and task_id not in self.tasks_completadas:
                self.tasks_completadas.add(task_id)
                mudancas["novas_completadas"].append(task)
                
            elif task.get('status') == 'failed' and task_id not in self.tasks_falhadas:
                self.tasks_falhadas.add(task_id)
                mudancas["novas_falhadas"].append(task)
                
        return mudancas
    
    def _processar_notificacoes(self, mudancas: Dict[str, List[Dict]]):
        """Processa e envia notificações para mudanças detectadas"""
        
        # Notifica tasks completadas
        for task in mudancas["novas_completadas"]:
            task_id = task.get('id')
            nome = task.get('identifier', f'Task-{task_id}')
            duracao = self.formatar_duracao(task.get('created_at', ''))
            
            self.notificador.notify_task_completion(
                task_id=str(task_id),
                task_name=nome,
                status="completed",
                duration=duracao
            )
            
            self.logger.info(f"🎉 NOTIFICAÇÃO: Task {task_id} '{nome}' CONCLUÍDA! | Tempo: {duracao}")
        
        # Notifica tasks falhadas
        for task in mudancas["novas_falhadas"]:
            task_id = task.get('id')
            nome = task.get('identifier', f'Task-{task_id}')
            duracao = self.formatar_duracao(task.get('created_at', ''))
            
            self.notificador.notify_task_completion(
                task_id=str(task_id),
                task_name=nome,
                status="failed",
                duration=duracao
            )
            
            self.logger.error(f"❌ NOTIFICAÇÃO: Task {task_id} '{nome}' FALHOU! | Tempo: {duracao}")
    
    def monitor_infinito(self):
        """LOOP INFINITO PRINCIPAL COM NOTIFICAÇÕES - NUNCA PARA SOZINHO"""
        
        # Interface clara sobre comportamento infinito
        os.system('clear')
        print("\n" + "=" * 80)
        print("🔄 MONITOR INFINITO ULTRATHINK COM NOTIFICAÇÕES CURSOR")
        print("=" * 80)
        print(f"\n🎯 Sistema de Notificações: {'✅ Cursor IDE' if self.notificador.is_cursor else '📟 Terminal Padrão'}")
        print("\n⚠️  COMPORTAMENTO INFINITO:")
        print("   • Este monitor NUNCA PARA automaticamente")
        print("   • Notificações visuais quando tasks completam")
        print("   • Continuará mesmo sem tasks")
        print("   • Continuará mesmo com erros")
        print("   • Única forma de parar: Ctrl+C")
        print("\n📅 Iniciado em: " + self.inicio.strftime("%Y-%m-%d %H:%M:%S"))
        print("=" * 80 + "\n")
        
        self.logger.info("🚀 MONITOR INFINITO COM NOTIFICAÇÕES INICIADO - Loop eterno ativado")
        
        try:
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
                    
                # Detecta mudanças de status para notificações
                mudancas = self._detectar_mudancas_status(tasks)
                
                # Processa notificações
                self._processar_notificacoes(mudancas)
                
                # Separa tasks por status
                running = [t for t in tasks if t.get('status') == 'running']
                completed = [t for t in tasks if t.get('status') == 'completed']
                failed = [t for t in tasks if t.get('status') == 'failed']
                pending = [t for t in tasks if t.get('status') == 'pending']
                
                # Status visual melhorado
                tempo_ativo = datetime.now() - self.inicio
                
                # Indicador de atividade visual
                spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
                spin = spinner[iteracao % len(spinner)]
                
                status_notif = f"📊 Notificações: {len(self.tasks_completadas)} ✅ | {len(self.tasks_falhadas)} ❌"
                self.logger.info(f"{spin} Ciclo #{self.total_verificacoes} | Loop há: {self._formatar_tempo_ativo(tempo_ativo)} | {status_notif}")
                
                if running:
                    self.logger.info(f"⏳ {len(running)} tasks ATIVAS:")
                    for task in running:
                        task_id = task.get('id')
                        nome = task.get('identifier', f'Task-{task_id}')
                        duracao = self.formatar_duracao(task.get('created_at', ''))
                        self.logger.info(f"  🔄 Task {task_id}: '{nome}' | Rodando há: {duracao}")
                        
                if not running and not pending:
                    if completed or failed:
                        self.logger.info(f"✅ Tasks finalizadas ({len(self.tasks_completadas)} notificadas) - MONITORAMENTO CONTINUA...")
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
                
                # Pausa inteligente baseada em atividade
                intervalo = 5 if running else 10
                self._pausa_limpa(intervalo)
                
        except KeyboardInterrupt:
            self.logger.info("\n⏹️ Interrupção manual detectada - finalizando...")
            self.ativo = False
        except Exception as e:
            self.logger.error(f"💥 Erro recuperado: {str(e)}")
            self.logger.info("🔄 Auto-recovery ativado - continuando monitoramento...")
            time.sleep(3)
            
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
        notif_summary = self.notificador.get_notification_summary()
        
        self.logger.info("=" * 60)
        self.logger.info("🏁 MONITOR INFINITO COM NOTIFICAÇÕES FINALIZADO")
        self.logger.info(f"   ⏱️  Tempo ativo: {self._formatar_tempo_ativo(tempo_total)}")
        self.logger.info(f"   🔍 Total de verificações: {self.total_verificacoes}")
        self.logger.info(f"   🎉 Tasks completadas notificadas: {len(self.tasks_completadas)}")
        self.logger.info(f"   ❌ Tasks falhadas notificadas: {len(self.tasks_falhadas)}")
        self.logger.info(f"   📊 Total de notificações: {notif_summary.get('total_notifications', 0)}")
        self.logger.info("=" * 60)
        
        # Notifica parada
        self.notificador.notify_monitor_event("stop", "Monitor finalizado com sucesso")
        self.notificador.reset_terminal_title()
        
        # Remove PID file
        try:
            if PID_FILE.exists():
                PID_FILE.unlink()
        except:
            pass

def verificar_status():
    """Verifica se monitoramento está ativo"""
    if not PID_FILE.exists():
        print("❌ Monitor com notificações não está executando")
        return False
        
    try:
        with open(PID_FILE, 'r') as f:
            pid = int(f.read().strip())
            
        if psutil.pid_exists(pid):
            processo = psutil.Process(pid)
            inicio = datetime.fromtimestamp(processo.create_time())
            tempo_ativo = datetime.now() - inicio
            
            print("✅ MONITOR INFINITO COM NOTIFICAÇÕES ATIVO")
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
                    print(f"   🎉 Tasks completadas: {len(estado.get('tasks_completadas', []))}")
                    print(f"   ❌ Tasks falhadas: {len(estado.get('tasks_falhadas', []))}")
                    
                    notif = estado.get('notificacoes', {})
                    if notif:
                        print(f"   🔔 Total notificações: {notif.get('total_notifications', 0)}")
                        print(f"   🎯 Cursor IDE: {'✅' if notif.get('cursor_detected') else '❌'}")
                except:
                    pass
                    
            return True
        else:
            print("❌ PID existe mas processo não está rodando")
            PID_FILE.unlink()
            return False
            
    except Exception as e:
        print(f"❌ Erro ao verificar status: {e}")
        return False

def parar_monitor():
    """Para o monitor infinito com notificações"""
    if not PID_FILE.exists():
        print("❌ Monitor com notificações não está executando")
        return False
        
    try:
        with open(PID_FILE, 'r') as f:
            pid = int(f.read().strip())
            
        if psutil.pid_exists(pid):
            print(f"🛑 Parando monitor com notificações (PID {pid})...")
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
                
            print("✅ Monitor com notificações parado com sucesso")
            return True
        else:
            print("❌ Processo não existe")
            PID_FILE.unlink()
            return False
            
    except Exception as e:
        print(f"❌ Erro ao parar monitor: {e}")
        return False

def testar_notificacoes():
    """Testa sistema de notificações"""
    print("🧪 TESTANDO SISTEMA DE NOTIFICAÇÕES CURSOR IDE")
    print("=" * 60)
    
    notificador = CursorNotifications()
    print(f"Cursor IDE detectado: {'✅ Sim' if notificador.is_cursor else '❌ Não'}")
    
    # Simula notificações de teste
    print("\nTestando notificações...")
    
    notificador.notify_task_completion("test_001", "Teste de Task Concluída", "completed", "2min 30s")
    time.sleep(1)
    
    notificador.notify_task_completion("test_002", "Teste de Task Falhada", "failed", "1min 15s")
    time.sleep(1)
    
    notificador.notify_monitor_event("start", "Teste de evento do monitor")
    
    summary = notificador.get_notification_summary()
    print(f"\n📊 Resumo: {summary['total_notifications']} notificações testadas")
    
    notificador.reset_terminal_title()
    print("✅ Teste concluído!")

def configurar_notificacoes():
    """Interface para configurar notificações"""
    print("⚙️ CONFIGURAÇÃO DE NOTIFICAÇÕES")
    print("=" * 40)
    
    notificador = CursorNotifications()
    config_atual = notificador.config
    
    print(f"Estado atual:")
    print(f"  Habilitado: {config_atual.get('enabled', True)}")
    print(f"  Som: {config_atual.get('sound_enabled', True)}")
    print(f"  Título: {config_atual.get('title_updates', True)}")
    print(f"  Cores: {config_atual.get('colors_enabled', True)}")
    
    print(f"\nCursor IDE detectado: {'✅ Sim' if notificador.is_cursor else '❌ Não'}")
    
    # Aqui poderia adicionar interface interativa para alterar configurações
    print("\n💡 Para alterar configurações, edite o arquivo:")
    print(f"   {BASE_DIR}/cursor_notifications.json")

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
        elif comando == "--test-notif":
            testar_notificacoes()
            return
        elif comando == "--config":
            configurar_notificacoes()
            return
        elif comando == "--help":
            print(__doc__)
            return
        else:
            print(f"❌ Comando desconhecido: {comando}")
            print("Comandos: --status, --stop, --test-notif, --config, --help")
            return
    
    # Verificar se já está rodando
    if verificar_status():
        print("\n⚠️ Monitor infinito com notificações já está ativo!")
        print("   Use 'python monitor_infinito_notif.py --stop' para parar")
        return
        
    # Iniciar monitor infinito com notificações
    monitor = MonitorInfinitoNotif()
    monitor.monitor_infinito()

if __name__ == "__main__":
    main()