#!/usr/bin/env python3
"""
🤖 AGENTE DE NOTIFICAÇÕES INTELIGENTE - CURSOR IDE
==================================================

OBJETIVO: Agente autônomo para gerenciar notificações inteligentes no Cursor IDE

RECURSOS AVANÇADOS:
- Detecção automática de contexto
- Notificações inteligentes baseadas em prioridade
- Sistema de templates personalizáveis
- Integração com múltiplos canais
- Machine Learning para otimização
- Dashboard de analytics

PADRÃO: CrewAI Agent com capacidades de notificação
"""

import os
import sys
import json
import psutil
import asyncio
import logging
from typing import Dict, Optional, List, Any, Union
from datetime import datetime, timedelta
from pathlib import Path
from dataclasses import dataclass, field
from enum import Enum
import threading
import time
import subprocess

# Configurações de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class NotificationPriority(Enum):
    """Prioridades de notificação"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class NotificationChannel(Enum):
    """Canais de notificação disponíveis"""
    TERMINAL = "terminal"
    DESKTOP = "desktop"
    WEBHOOK = "webhook"
    EMAIL = "email"
    SLACK = "slack"
    DISCORD = "discord"

@dataclass
class NotificationTemplate:
    """Template para notificações"""
    name: str
    title: str
    message: str
    priority: NotificationPriority
    channel: NotificationChannel
    color: str
    emoji: str
    sound: bool = True
    duration: int = 5000  # ms

@dataclass
class NotificationEvent:
    """Evento de notificação"""
    id: str
    template: str
    title: str
    message: str
    priority: NotificationPriority
    channel: NotificationChannel
    timestamp: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)
    read: bool = False
    acknowledged: bool = False

class NotificationAgent:
    """Agente inteligente de notificações para Cursor IDE"""
    
    def __init__(self, config_path: Optional[str] = None):
        self.config_path = Path(config_path) if config_path else Path("notification_config.json")
        self.config = self._load_config()
        self.templates = self._load_templates()
        self.notification_history: List[NotificationEvent] = []
        self.active_notifications: Dict[str, NotificationEvent] = {}
        self.is_cursor = self._detect_cursor_ide()
        self.analytics = NotificationAnalytics()
        
        # Inicializar canais
        self.channels = self._initialize_channels()
        
        # Thread de monitoramento
        self.monitoring_thread = None
        self.should_monitor = False
        
    def _load_config(self) -> Dict[str, Any]:
        """Carrega configuração avançada"""
        default_config = {
            "agent": {
                "name": "NotificationAgent",
                "version": "2.0.0",
                "auto_start": True,
                "intelligent_routing": True
            },
            "notifications": {
                "enabled": True,
                "max_concurrent": 5,
                "default_priority": "medium",
                "default_channel": "terminal"
            },
            "channels": {
                "terminal": {
                    "enabled": True,
                    "colors": True,
                    "sounds": True,
                    "title_updates": True
                },
                "desktop": {
                    "enabled": False,
                    "timeout": 5000
                },
                "webhook": {
                    "enabled": False,
                    "url": "",
                    "headers": {}
                }
            },
            "templates": {
                "default": {
                    "title": "Notificação",
                    "message": "Mensagem padrão",
                    "priority": "medium",
                    "color": "\033[1;36m",
                    "emoji": "ℹ️"
                }
            },
            "analytics": {
                "enabled": True,
                "retention_days": 30,
                "track_engagement": True
            }
        }
        
        try:
            if self.config_path.exists():
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    loaded_config = json.load(f)
                    self._deep_merge(default_config, loaded_config)
        except Exception as e:
            logger.warning(f"Erro ao carregar config: {e}")
            
        return default_config
    
    def _load_templates(self) -> Dict[str, NotificationTemplate]:
        """Carrega templates de notificação"""
        templates = {}
        
        # Templates padrão
        default_templates = {
            "task_completed": NotificationTemplate(
                name="task_completed",
                title="🎉 Task Concluída!",
                message="Task {task_name} foi concluída com sucesso em {duration}",
                priority=NotificationPriority.MEDIUM,
                channel=NotificationChannel.TERMINAL,
                color="\033[1;32m",
                emoji="🎉"
            ),
            "task_failed": NotificationTemplate(
                name="task_failed",
                title="❌ Task Falhou!",
                message="Task {task_name} falhou: {error}",
                priority=NotificationPriority.HIGH,
                channel=NotificationChannel.TERMINAL,
                color="\033[1;31m",
                emoji="❌"
            ),
            "system_alert": NotificationTemplate(
                name="system_alert",
                title="🚨 Alerta do Sistema",
                message="{message}",
                priority=NotificationPriority.CRITICAL,
                channel=NotificationChannel.TERMINAL,
                color="\033[1;35m",
                emoji="🚨"
            ),
            "info": NotificationTemplate(
                name="info",
                title="ℹ️ Informação",
                message="{message}",
                priority=NotificationPriority.LOW,
                channel=NotificationChannel.TERMINAL,
                color="\033[1;36m",
                emoji="ℹ️"
            )
        }
        
        # Carregar templates customizados da config
        config_templates = self.config.get("templates", {})
        for name, template_data in config_templates.items():
            if name not in default_templates:
                try:
                    default_templates[name] = NotificationTemplate(
                        name=name,
                        title=template_data.get("title", "Notificação"),
                        message=template_data.get("message", "Mensagem"),
                        priority=NotificationPriority(template_data.get("priority", "medium")),
                        channel=NotificationChannel(template_data.get("channel", "terminal")),
                        color=template_data.get("color", "\033[1;36m"),
                        emoji=template_data.get("emoji", "ℹ️")
                    )
                except Exception as e:
                    logger.warning(f"Erro ao carregar template {name}: {e}")
        
        return default_templates
    
    def _initialize_channels(self) -> Dict[NotificationChannel, Any]:
        """Inicializa canais de notificação"""
        channels = {}
        
        # Canal Terminal
        if self.config["channels"]["terminal"]["enabled"]:
            channels[NotificationChannel.TERMINAL] = TerminalChannel(self.config["channels"]["terminal"])
        
        # Canal Desktop (se disponível)
        if self.config["channels"]["desktop"]["enabled"]:
            try:
                channels[NotificationChannel.DESKTOP] = DesktopChannel(self.config["channels"]["desktop"])
            except Exception as e:
                logger.warning(f"Desktop channel não disponível: {e}")
        
        # Canal Webhook
        if self.config["channels"]["webhook"]["enabled"]:
            channels[NotificationChannel.WEBHOOK] = WebhookChannel(self.config["channels"]["webhook"])
        
        return channels
    
    def _detect_cursor_ide(self) -> bool:
        """Detecta se está executando no Cursor IDE"""
        try:
            env_indicators = [
                'VSCODE_IPC_HOOK',
                'VSCODE_PID',
                'CURSOR_PID',
                'TERM_PROGRAM'
            ]
            
            for env_var in env_indicators:
                value = os.environ.get(env_var, '')
                if 'cursor' in value.lower() or 'vscode' in value.lower():
                    return True
            
            # Verificar processo pai
            try:
                current_pid = os.getpid()
                parent = psutil.Process(current_pid).parent()
                
                while parent and parent.pid != 1:
                    process_name = parent.name().lower()
                    if 'cursor' in process_name or 'code' in process_name:
                        return True
                    parent = parent.parent()
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
            
            return False
        except Exception:
            return False
    
    def _deep_merge(self, base: Dict, update: Dict):
        """Merge profundo de configurações"""
        for key, value in update.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                self._deep_merge(base[key], value)
            else:
                base[key] = value
    
    async def send_notification(
        self,
        template_name: str,
        **kwargs
    ) -> Optional[NotificationEvent]:
        """Envia notificação usando template"""
        if not self.config["notifications"]["enabled"]:
            return None
        
        template = self.templates.get(template_name)
        if not template:
            logger.warning(f"Template '{template_name}' não encontrado")
            return None
        
        # Criar evento de notificação
        event = NotificationEvent(
            id=f"notif_{int(time.time() * 1000)}",
            template=template_name,
            title=template.title.format(**kwargs),
            message=template.message.format(**kwargs),
            priority=template.priority,
            channel=template.channel,
            timestamp=datetime.now(),
            metadata=kwargs
        )
        
        # Adicionar ao histórico
        self.notification_history.append(event)
        self.active_notifications[event.id] = event
        
        # Enviar através do canal apropriado
        channel = self.channels.get(template.channel)
        if channel:
            try:
                await channel.send(event)
                logger.info(f"Notificação enviada: {event.title}")
            except Exception as e:
                logger.error(f"Erro ao enviar notificação: {e}")
        
        # Analytics
        self.analytics.track_notification(event)
        
        # Limpar histórico antigo
        self._cleanup_old_notifications()
        
        return event
    
    def _cleanup_old_notifications(self):
        """Remove notificações antigas do histórico"""
        retention_days = self.config["analytics"]["retention_days"]
        cutoff_date = datetime.now() - timedelta(days=retention_days)
        
        self.notification_history = [
            n for n in self.notification_history 
            if n.timestamp > cutoff_date
        ]
        
        # Limitar número de notificações ativas
        max_concurrent = self.config["notifications"]["max_concurrent"]
        if len(self.active_notifications) > max_concurrent:
            # Remover as mais antigas
            sorted_notifications = sorted(
                self.active_notifications.values(),
                key=lambda x: x.timestamp
            )
            for notification in sorted_notifications[:-max_concurrent]:
                del self.active_notifications[notification.id]
    
    def start_monitoring(self):
        """Inicia monitoramento em background"""
        if self.monitoring_thread and self.monitoring_thread.is_alive():
            return
        
        self.should_monitor = True
        self.monitoring_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitoring_thread.start()
        logger.info("Monitoramento de notificações iniciado")
    
    def stop_monitoring(self):
        """Para monitoramento"""
        self.should_monitor = False
        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=1)
        logger.info("Monitoramento de notificações parado")
    
    def _monitoring_loop(self):
        """Loop de monitoramento"""
        while self.should_monitor:
            try:
                # Verificar notificações não lidas
                unread_count = len([n for n in self.notification_history if not n.read])
                
                # Atualizar título do terminal se necessário
                if self.is_cursor and unread_count > 0:
                    self._update_terminal_title(f"({unread_count}) Notificações")
                
                time.sleep(5)  # Verificar a cada 5 segundos
                
            except Exception as e:
                logger.error(f"Erro no loop de monitoramento: {e}")
                time.sleep(10)
    
    def _update_terminal_title(self, title: str):
        """Atualiza título do terminal"""
        try:
            print(f"\033]0;{title}\007", end="", flush=True)
        except:
            pass
    
    def get_analytics(self) -> Dict[str, Any]:
        """Retorna analytics das notificações"""
        return self.analytics.get_summary()
    
    def acknowledge_notification(self, notification_id: str):
        """Marca notificação como lida"""
        if notification_id in self.active_notifications:
            self.active_notifications[notification_id].acknowledged = True
            self.active_notifications[notification_id].read = True
    
    def get_unread_count(self) -> int:
        """Retorna número de notificações não lidas"""
        return len([n for n in self.notification_history if not n.read])

class TerminalChannel:
    """Canal de notificação para terminal"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
    
    async def send(self, event: NotificationEvent):
        """Envia notificação no terminal"""
        if not self.config["enabled"]:
            return
        
        # Criar caixa visual
        box = self._create_notification_box(event)
        
        # Emitir som se habilitado
        if self.config["sounds"]:
            print("\a", end="", flush=True)
        
        # Exibir notificação
        print(box)
        
        # Atualizar título se habilitado
        if self.config["title_updates"]:
            self._update_terminal_title(event.title)
    
    def _create_notification_box(self, event: NotificationEvent) -> str:
        """Cria caixa visual para notificação"""
        color = event.metadata.get("color", "\033[1;36m")
        reset = "\033[0m"
        
        # Largura da caixa
        max_width = max(len(event.title), len(event.message)) + 4
        box_width = max(50, max_width)
        
        # Bordas
        top_border = "╔" + "═" * (box_width - 2) + "╗"
        bottom_border = "╚" + "═" * (box_width - 2) + "╝"
        
        # Texto centralizado
        title_padded = event.title.center(box_width - 2)
        message_padded = event.message.center(box_width - 2)
        
        # Montar caixa
        box = f"{color}{top_border}\n"
        box += f"║{title_padded}║\n"
        box += f"║{' ' * (box_width - 2)}║\n"
        box += f"║{message_padded}║\n"
        box += f"{bottom_border}{reset}"
        
        return box
    
    def _update_terminal_title(self, title: str):
        """Atualiza título do terminal"""
        try:
            print(f"\033]0;{title}\007", end="", flush=True)
        except:
            pass

class DesktopChannel:
    """Canal de notificação para desktop (Linux)"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
    
    async def send(self, event: NotificationEvent):
        """Envia notificação desktop"""
        try:
            # Usar notify-send no Linux
            cmd = [
                "notify-send",
                "-t", str(self.config["timeout"]),
                "-u", self._get_urgency(event.priority),
                event.title,
                event.message
            ]
            
            subprocess.run(cmd, check=True)
        except Exception as e:
            logger.warning(f"Erro ao enviar notificação desktop: {e}")

class WebhookChannel:
    """Canal de notificação via webhook"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
    
    async def send(self, event: NotificationEvent):
        """Envia notificação via webhook"""
        # Implementar envio via webhook
        pass

class NotificationAnalytics:
    """Analytics para notificações"""
    
    def __init__(self):
        self.stats = {
            "total_sent": 0,
            "total_read": 0,
            "by_priority": {},
            "by_channel": {},
            "by_template": {},
            "engagement_rate": 0.0
        }
    
    def track_notification(self, event: NotificationEvent):
        """Registra estatísticas da notificação"""
        self.stats["total_sent"] += 1
        
        # Por prioridade
        priority = event.priority.value
        self.stats["by_priority"][priority] = self.stats["by_priority"].get(priority, 0) + 1
        
        # Por canal
        channel = event.channel.value
        self.stats["by_channel"][channel] = self.stats["by_channel"].get(channel, 0) + 1
        
        # Por template
        template = event.template
        self.stats["by_template"][template] = self.stats["by_template"].get(template, 0) + 1
    
    def get_summary(self) -> Dict[str, Any]:
        """Retorna resumo das estatísticas"""
        if self.stats["total_sent"] > 0:
            self.stats["engagement_rate"] = (self.stats["total_read"] / self.stats["total_sent"]) * 100
        
        return self.stats.copy()

# Função principal para uso direto
async def main():
    """Função principal para demonstração"""
    agent = NotificationAgent()
    
    print("🤖 Agente de Notificações Iniciado!")
    print(f"🎯 Cursor IDE detectado: {'✅' if agent.is_cursor else '❌'}")
    
    # Iniciar monitoramento
    agent.start_monitoring()
    
    # Exemplo de notificações
    await agent.send_notification("info", message="Sistema iniciado com sucesso!")
    await asyncio.sleep(2)
    
    await agent.send_notification("task_completed", task_name="Setup", duration="30s")
    await asyncio.sleep(2)
    
    await agent.send_notification("system_alert", message="Monitoramento ativo")
    
    # Manter rodando
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Parando agente...")
        agent.stop_monitoring()

if __name__ == "__main__":
    asyncio.run(main())
