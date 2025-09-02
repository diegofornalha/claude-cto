#!/usr/bin/env python3
"""
🎯 SISTEMA DE NOTIFICAÇÕES CURSOR IDE TERMINAL
=============================================

OBJETIVO: Notificações visuais inteligentes no terminal do Cursor IDE quando tasks completam.

RECURSOS:
- Detecção automática do terminal Cursor IDE
- Notificações visuais com cores e sons
- Títulos dinâmicos da janela do terminal
- Configurações personalizáveis
- Fallback para terminal padrão

INTEGRAÇÃO: Projetado para integrar com monitor_infinito.py

ULTRATHINK: Sistema completo de notificações para maximizar visibilidade de completude das tasks.
"""

import os
import sys
import json
import psutil
import subprocess
from typing import Dict, Optional, List, Any
from datetime import datetime
from pathlib import Path

# Configurações
NOTIF_CONFIG_FILE = Path("/home/suthub/.claude/claude-cto/cursor_notifications.json")

class CursorNotifications:
    """Sistema de Notificações para Terminal Cursor IDE"""
    
    def __init__(self):
        self.is_cursor = self._detect_cursor_ide()
        self.config = self._load_config()
        self.notification_history = []
        
    def _detect_cursor_ide(self) -> bool:
        """Detecta se está executando no terminal do Cursor IDE"""
        try:
            # Método 1: Verificar variáveis de ambiente específicas do Cursor
            env_indicators = [
                'VSCODE_IPC_HOOK',  # Cursor é baseado no VSCode
                'VSCODE_PID',
                'CURSOR_PID',
                'TERM_PROGRAM'
            ]
            
            for env_var in env_indicators:
                value = os.environ.get(env_var, '')
                if 'cursor' in value.lower() or 'vscode' in value.lower():
                    return True
            
            # Método 2: Verificar processo pai
            try:
                current_pid = os.getpid()
                parent = psutil.Process(current_pid).parent()
                
                while parent and parent.pid != 1:  # Até chegar ao init
                    process_name = parent.name().lower()
                    if 'cursor' in process_name or 'code' in process_name:
                        return True
                    parent = parent.parent()
                    
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
            
            # Método 3: Verificar TERM_PROGRAM
            term_program = os.environ.get('TERM_PROGRAM', '').lower()
            if 'cursor' in term_program or 'vscode' in term_program:
                return True
                
            # Método 4: Verificar se há processos Cursor rodando
            try:
                for proc in psutil.process_iter(['name']):
                    if 'cursor' in proc.info['name'].lower():
                        return True
            except:
                pass
                
            return False
            
        except Exception:
            return False
    
    def _load_config(self) -> Dict[str, Any]:
        """Carrega configurações das notificações"""
        default_config = {
            "enabled": True,
            "sound_enabled": True,
            "title_updates": True,
            "colors_enabled": True,
            "notification_types": {
                "completed": True,
                "failed": True,
                "started": False
            },
            "colors": {
                "completed": "\033[1;32m",  # Verde brilhante
                "failed": "\033[1;31m",     # Vermelho brilhante
                "started": "\033[1;33m",    # Amarelo brilhante
                "info": "\033[1;36m",       # Ciano brilhante
                "reset": "\033[0m"          # Reset
            },
            "emojis": {
                "completed": "🎉",
                "failed": "❌", 
                "started": "🚀",
                "info": "ℹ️"
            }
        }
        
        try:
            if NOTIF_CONFIG_FILE.exists():
                with open(NOTIF_CONFIG_FILE, 'r', encoding='utf-8') as f:
                    loaded_config = json.load(f)
                    # Merge with default config
                    default_config.update(loaded_config)
            else:
                # Salva config padrão
                self._save_config(default_config)
                
        except Exception:
            pass  # Usa config padrão em caso de erro
            
        return default_config
    
    def _save_config(self, config: Dict[str, Any]):
        """Salva configurações das notificações"""
        try:
            NOTIF_CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
            with open(NOTIF_CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
        except Exception:
            pass  # Falha silenciosa
    
    def _bell_sound(self):
        """Emite som de notificação (bell)"""
        if self.config.get("sound_enabled", True):
            try:
                print("\a", end="", flush=True)
            except:
                pass
    
    def _update_terminal_title(self, title: str):
        """Atualiza título da janela do terminal"""
        if self.config.get("title_updates", True):
            try:
                # Sequência de escape ANSI para alterar título
                print(f"\033]0;{title}\007", end="", flush=True)
            except:
                pass
    
    def _get_color(self, status: str) -> str:
        """Obtém código de cor para status"""
        if not self.config.get("colors_enabled", True):
            return ""
        return self.config.get("colors", {}).get(status, "")
    
    def _get_emoji(self, status: str) -> str:
        """Obtém emoji para status"""
        return self.config.get("emojis", {}).get(status, "")
    
    def _create_notification_box(self, title: str, content: str, status: str = "info") -> str:
        """Cria caixa visual para notificação"""
        color = self._get_color(status)
        reset = self._get_color("reset")
        
        # Calcula largura da caixa
        max_width = max(len(title), len(content)) + 4
        box_width = max(50, max_width)
        
        # Cria bordas
        top_border = "╔" + "═" * (box_width - 2) + "╗"
        bottom_border = "╚" + "═" * (box_width - 2) + "╝"
        
        # Centraliza texto
        title_padded = title.center(box_width - 2)
        content_padded = content.center(box_width - 2)
        
        # Monta caixa
        box = f"{color}{top_border}\n"
        box += f"║{title_padded}║\n"
        box += f"║{' ' * (box_width - 2)}║\n"
        box += f"║{content_padded}║\n"
        box += f"{bottom_border}{reset}"
        
        return box
    
    def notify_task_completion(self, task_id: str, task_name: str, status: str, duration: str = ""):
        """Notifica conclusão de task"""
        if not self.config.get("enabled", True):
            return
            
        if not self.config.get("notification_types", {}).get(status, True):
            return
        
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        # Determina conteúdo da notificação
        emoji = self._get_emoji(status)
        
        if status == "completed":
            title = f"{emoji} TASK CONCLUÍDA!"
            content = f"Task {task_id}: {task_name}"
            if duration:
                content += f" | Tempo: {duration}"
            terminal_title = f"✅ Task {task_id} - Concluída"
            
        elif status == "failed":
            title = f"{emoji} TASK FALHOU!"
            content = f"Task {task_id}: {task_name}"
            terminal_title = f"❌ Task {task_id} - Falhou"
            
        elif status == "started":
            title = f"{emoji} TASK INICIADA!"
            content = f"Task {task_id}: {task_name}"
            terminal_title = f"🚀 Task {task_id} - Iniciada"
            
        else:
            return  # Status desconhecido
        
        # Som de notificação
        self._bell_sound()
        
        # Atualiza título da janela
        self._update_terminal_title(terminal_title)
        
        # Cria e exibe notificação visual
        print("\n" + "=" * 80)
        
        if self.is_cursor:
            print(f"🎯 CURSOR IDE NOTIFICATION | {timestamp}")
        else:
            print(f"📟 TERMINAL NOTIFICATION | {timestamp}")
            
        print("=" * 80)
        
        # Caixa de notificação
        notification_box = self._create_notification_box(title, content, status)
        print(notification_box)
        
        # Informações adicionais para Cursor IDE
        if self.is_cursor:
            color = self._get_color("info")
            reset = self._get_color("reset")
            print(f"\n{color}💡 Executando no Cursor IDE - Título da janela atualizado{reset}")
        
        print("=" * 80 + "\n")
        
        # Salva no histórico
        notification_record = {
            "timestamp": timestamp,
            "task_id": task_id,
            "task_name": task_name,
            "status": status,
            "duration": duration,
            "cursor_ide": self.is_cursor
        }
        self.notification_history.append(notification_record)
    
    def notify_monitor_event(self, event_type: str, message: str):
        """Notifica eventos do monitor"""
        if not self.config.get("enabled", True):
            return
            
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        # Cores baseadas no tipo de evento
        if event_type in ["start", "resume"]:
            status = "started"
        elif event_type in ["stop", "pause"]:
            status = "failed"  # Usa cor vermelha
        else:
            status = "info"
        
        color = self._get_color(status)
        reset = self._get_color("reset")
        
        print(f"\n{color}🔔 MONITOR EVENT | {timestamp}")
        print(f"   {message}{reset}\n")
        
        if event_type in ["start", "resume"]:
            self._update_terminal_title("🔄 Monitor Ativo")
            self._bell_sound()
    
    def get_notification_summary(self) -> Dict[str, Any]:
        """Retorna resumo das notificações"""
        total = len(self.notification_history)
        completed = len([n for n in self.notification_history if n["status"] == "completed"])
        failed = len([n for n in self.notification_history if n["status"] == "failed"])
        
        return {
            "total_notifications": total,
            "completed_notifications": completed,
            "failed_notifications": failed,
            "cursor_detected": self.is_cursor,
            "config_enabled": self.config.get("enabled", True)
        }
    
    def update_config(self, new_config: Dict[str, Any]):
        """Atualiza configurações"""
        self.config.update(new_config)
        self._save_config(self.config)
    
    def reset_terminal_title(self):
        """Reseta título do terminal para padrão"""
        self._update_terminal_title("Terminal")

def create_default_notifier() -> CursorNotifications:
    """Cria instância padrão do notificador"""
    return CursorNotifications()

def test_notifications():
    """Testa sistema de notificações"""
    notifier = CursorNotifications()
    
    print("🧪 TESTANDO SISTEMA DE NOTIFICAÇÕES")
    print("=" * 50)
    print(f"Cursor IDE detectado: {'✅ Sim' if notifier.is_cursor else '❌ Não'}")
    print(f"Notificações ativas: {'✅ Sim' if notifier.config.get('enabled') else '❌ Não'}")
    print()
    
    # Testa diferentes tipos de notificação
    print("Testando notificação de task concluída...")
    notifier.notify_task_completion("test_001", "Teste de Conclusão", "completed", "2min 30s")
    
    import time
    time.sleep(2)
    
    print("Testando notificação de task falhada...")
    notifier.notify_task_completion("test_002", "Teste de Falha", "failed", "1min 15s")
    
    time.sleep(2)
    
    print("Testando evento do monitor...")
    notifier.notify_monitor_event("start", "Monitor iniciado com sucesso")
    
    # Resumo
    summary = notifier.get_notification_summary()
    print("\n📊 RESUMO DO TESTE:")
    print(f"   Total de notificações: {summary['total_notifications']}")
    print(f"   Cursor IDE: {summary['cursor_detected']}")
    
    # Reseta título
    notifier.reset_terminal_title()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        test_notifications()
    else:
        print(__doc__)