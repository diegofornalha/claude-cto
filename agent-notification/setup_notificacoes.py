#!/usr/bin/env python3
"""
⚙️ CONFIGURADOR DE NOTIFICAÇÕES CURSOR IDE
=========================================

OBJETIVO: Interface intuitiva para configurar notificações do sistema de monitoramento.

RECURSOS:
- Interface interativa para todas as configurações
- Validação de configurações
- Teste de notificações ao vivo
- Backup e restore de configurações
- Presets otimizados

USO:
    python setup_notificacoes.py              # Interface interativa
    python setup_notificacoes.py --preset <nome>  # Aplica preset
    python setup_notificacoes.py --backup     # Backup das configurações
    python setup_notificacoes.py --restore    # Restaura backup

ULTRATHINK: Interface completa para personalizar experiência de notificações.
"""

import os
import sys
import json
import shutil
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime

# Importa sistema de notificações
try:
    from cursor_notifications import CursorNotifications
except ImportError:
    print("❌ Erro: cursor_notifications.py não encontrado")
    sys.exit(1)

# Configurações
BASE_DIR = Path("/home/suthub/.claude/claude-cto")
CONFIG_FILE = BASE_DIR / "cursor_notifications.json"
BACKUP_DIR = BASE_DIR / "backups" / "notifications"

class ConfiguradorNotificacoes:
    """Configurador interativo de notificações"""
    
    def __init__(self):
        self.notificador = CursorNotifications()
        self.config = self.notificador.config.copy()
        
    def exibir_status_atual(self):
        """Exibe status atual das configurações"""
        print("\n" + "=" * 60)
        print("📊 CONFIGURAÇÕES ATUAIS DE NOTIFICAÇÕES")
        print("=" * 60)
        
        print(f"🎯 Terminal Cursor IDE detectado: {'✅ Sim' if self.notificador.is_cursor else '❌ Não'}")
        print(f"🔔 Notificações habilitadas: {'✅ Sim' if self.config.get('enabled') else '❌ Não'}")
        print(f"🔊 Som habilitado: {'✅ Sim' if self.config.get('sound_enabled') else '❌ Não'}")
        print(f"📝 Atualizar título: {'✅ Sim' if self.config.get('title_updates') else '❌ Não'}")
        print(f"🎨 Cores habilitadas: {'✅ Sim' if self.config.get('colors_enabled') else '❌ Não'}")
        
        print(f"\n📋 Tipos de notificação:")
        tipos = self.config.get('notification_types', {})
        print(f"  ✅ Tasks completadas: {'✅' if tipos.get('completed') else '❌'}")
        print(f"  ❌ Tasks falhadas: {'✅' if tipos.get('failed') else '❌'}")
        print(f"  🚀 Tasks iniciadas: {'✅' if tipos.get('started') else '❌'}")
        
        print("=" * 60)
    
    def menu_principal(self):
        """Menu principal interativo"""
        while True:
            self.exibir_status_atual()
            
            print("\n⚙️ OPÇÕES DISPONÍVEIS:")
            print("1. 🔔 Habilitar/Desabilitar notificações")
            print("2. 🔊 Configurar som")
            print("3. 📝 Configurar título da janela")
            print("4. 🎨 Configurar cores")
            print("5. 📋 Configurar tipos de notificação")
            print("6. 🎭 Aplicar preset")
            print("7. 🧪 Testar notificações")
            print("8. 💾 Salvar configurações")
            print("9. 🔄 Restaurar padrões")
            print("0. ❌ Sair")
            
            try:
                escolha = input("\n👉 Escolha uma opção (0-9): ").strip()
                
                if escolha == "1":
                    self._toggle_notificacoes()
                elif escolha == "2":
                    self._configurar_som()
                elif escolha == "3":
                    self._configurar_titulo()
                elif escolha == "4":
                    self._configurar_cores()
                elif escolha == "5":
                    self._configurar_tipos()
                elif escolha == "6":
                    self._aplicar_preset()
                elif escolha == "7":
                    self._testar_notificacoes()
                elif escolha == "8":
                    self._salvar_configuracoes()
                elif escolha == "9":
                    self._restaurar_padroes()
                elif escolha == "0":
                    print("\n👋 Configuração finalizada!")
                    break
                else:
                    print("❌ Opção inválida! Tente novamente.")
                    
            except KeyboardInterrupt:
                print("\n\n👋 Configuração cancelada!")
                break
            except Exception as e:
                print(f"❌ Erro: {e}")
    
    def _toggle_notificacoes(self):
        """Toggle geral das notificações"""
        atual = self.config.get('enabled', True)
        novo = not atual
        self.config['enabled'] = novo
        
        status = "habilitadas" if novo else "desabilitadas"
        print(f"\n✅ Notificações {status}!")
    
    def _configurar_som(self):
        """Configura som das notificações"""
        print("\n🔊 CONFIGURAÇÃO DE SOM")
        print("1. ✅ Habilitar som")
        print("2. ❌ Desabilitar som")
        print("3. 🧪 Testar som")
        
        escolha = input("👉 Escolha (1-3): ").strip()
        
        if escolha == "1":
            self.config['sound_enabled'] = True
            print("✅ Som habilitado!")
        elif escolha == "2":
            self.config['sound_enabled'] = False
            print("❌ Som desabilitado!")
        elif escolha == "3":
            print("🔊 Testando som...")
            print("\a", end="", flush=True)
            print("Som testado!")
    
    def _configurar_titulo(self):
        """Configura atualização do título"""
        print("\n📝 CONFIGURAÇÃO DE TÍTULO DA JANELA")
        print("1. ✅ Habilitar atualização de título")
        print("2. ❌ Desabilitar atualização de título")
        
        escolha = input("👉 Escolha (1-2): ").strip()
        
        if escolha == "1":
            self.config['title_updates'] = True
            print("✅ Atualização de título habilitada!")
        elif escolha == "2":
            self.config['title_updates'] = False
            print("❌ Atualização de título desabilitada!")
    
    def _configurar_cores(self):
        """Configura sistema de cores"""
        print("\n🎨 CONFIGURAÇÃO DE CORES")
        print("1. ✅ Habilitar cores")
        print("2. ❌ Desabilitar cores")
        print("3. 🎭 Personalizar cores")
        
        escolha = input("👉 Escolha (1-3): ").strip()
        
        if escolha == "1":
            self.config['colors_enabled'] = True
            print("✅ Cores habilitadas!")
        elif escolha == "2":
            self.config['colors_enabled'] = False
            print("❌ Cores desabilitadas!")
        elif escolha == "3":
            self._personalizar_cores()
    
    def _personalizar_cores(self):
        """Interface para personalizar cores"""
        print("\n🎨 PERSONALIZAÇÃO DE CORES")
        cores_disponiveis = {
            "1": ("\033[1;32m", "Verde brilhante"),
            "2": ("\033[1;31m", "Vermelho brilhante"),
            "3": ("\033[1;33m", "Amarelo brilhante"),
            "4": ("\033[1;36m", "Ciano brilhante"),
            "5": ("\033[1;35m", "Magenta brilhante"),
            "6": ("\033[1;34m", "Azul brilhante")
        }
        
        print("Cores disponíveis:")
        for num, (codigo, nome) in cores_disponiveis.items():
            print(f"{num}. {codigo}{nome}\033[0m")
        
        print("\nEscolha cores para cada tipo:")
        
        # Configurar cor para completed
        escolha = input("Cor para tasks completadas (1-6): ").strip()
        if escolha in cores_disponiveis:
            self.config['colors']['completed'] = cores_disponiveis[escolha][0]
        
        # Configurar cor para failed
        escolha = input("Cor para tasks falhadas (1-6): ").strip()
        if escolha in cores_disponiveis:
            self.config['colors']['failed'] = cores_disponiveis[escolha][0]
    
    def _configurar_tipos(self):
        """Configura tipos de notificação"""
        print("\n📋 CONFIGURAÇÃO DE TIPOS DE NOTIFICAÇÃO")
        
        tipos = ["completed", "failed", "started"]
        nomes = {"completed": "Tasks Completadas", "failed": "Tasks Falhadas", "started": "Tasks Iniciadas"}
        
        for tipo in tipos:
            atual = self.config.get('notification_types', {}).get(tipo, False)
            status_atual = "habilitado" if atual else "desabilitado"
            
            resposta = input(f"{nomes[tipo]} (atualmente {status_atual}) - Habilitar? (s/n): ").lower().strip()
            
            if resposta in ['s', 'sim', 'y', 'yes']:
                self.config.setdefault('notification_types', {})[tipo] = True
            elif resposta in ['n', 'nao', 'não', 'no']:
                self.config.setdefault('notification_types', {})[tipo] = False
    
    def _aplicar_preset(self):
        """Aplica presets predefinidos"""
        print("\n🎭 PRESETS DISPONÍVEIS:")
        print("1. 🔥 Máximo (todas as notificações + efeitos)")
        print("2. ⚖️ Balanceado (completed + failed, sem som excessivo)")
        print("3. 🔇 Mínimo (apenas completed, sem som)")
        print("4. 🎯 Cursor IDE (otimizado para Cursor)")
        
        escolha = input("👉 Escolha um preset (1-4): ").strip()
        
        if escolha == "1":
            self._preset_maximo()
        elif escolha == "2":
            self._preset_balanceado()
        elif escolha == "3":
            self._preset_minimo()
        elif escolha == "4":
            self._preset_cursor()
    
    def _preset_maximo(self):
        """Preset com todas as funcionalidades ativas"""
        self.config.update({
            "enabled": True,
            "sound_enabled": True,
            "title_updates": True,
            "colors_enabled": True,
            "notification_types": {
                "completed": True,
                "failed": True,
                "started": True
            }
        })
        print("🔥 Preset MÁXIMO aplicado!")
    
    def _preset_balanceado(self):
        """Preset balanceado para uso geral"""
        self.config.update({
            "enabled": True,
            "sound_enabled": True,
            "title_updates": True,
            "colors_enabled": True,
            "notification_types": {
                "completed": True,
                "failed": True,
                "started": False
            }
        })
        print("⚖️ Preset BALANCEADO aplicado!")
    
    def _preset_minimo(self):
        """Preset mínimo e discreto"""
        self.config.update({
            "enabled": True,
            "sound_enabled": False,
            "title_updates": False,
            "colors_enabled": True,
            "notification_types": {
                "completed": True,
                "failed": False,
                "started": False
            }
        })
        print("🔇 Preset MÍNIMO aplicado!")
    
    def _preset_cursor(self):
        """Preset otimizado especificamente para Cursor IDE"""
        self.config.update({
            "enabled": True,
            "sound_enabled": True,
            "title_updates": True,  # Cursor IDE suporta bem
            "colors_enabled": True,
            "notification_types": {
                "completed": True,
                "failed": True,
                "started": False  # Evita spam
            }
        })
        print("🎯 Preset CURSOR IDE aplicado!")
    
    def _testar_notificacoes(self):
        """Testa notificações com configuração atual"""
        print("\n🧪 TESTANDO NOTIFICAÇÕES...")
        
        # Salva configuração atual temporariamente
        self._salvar_configuracoes_temp()
        
        # Cria novo notificador com config atual
        notificador = CursorNotifications()
        
        print("Testando notificação de task completada...")
        notificador.notify_task_completion("test_001", "Teste de Configuração", "completed", "30s")
        
        import time
        time.sleep(1)
        
        print("Testando notificação de task falhada...")
        notificador.notify_task_completion("test_002", "Teste de Falha", "failed", "15s")
        
        print("✅ Teste concluído!")
    
    def _salvar_configuracoes(self):
        """Salva configurações no arquivo"""
        try:
            # Cria backup antes de salvar
            self._criar_backup()
            
            with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
            
            print("💾 Configurações salvas com sucesso!")
            
        except Exception as e:
            print(f"❌ Erro ao salvar configurações: {e}")
    
    def _salvar_configuracoes_temp(self):
        """Salva configurações temporárias para teste"""
        try:
            with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
        except:
            pass
    
    def _restaurar_padroes(self):
        """Restaura configurações padrão"""
        confirmacao = input("⚠️ Restaurar configurações padrão? Isso apagará suas personalizações! (s/n): ")
        
        if confirmacao.lower().strip() in ['s', 'sim', 'y', 'yes']:
            # Configurações padrão
            self.config = {
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
                    "completed": "\033[1;32m",
                    "failed": "\033[1;31m",
                    "started": "\033[1;33m",
                    "info": "\033[1;36m",
                    "reset": "\033[0m"
                },
                "emojis": {
                    "completed": "🎉",
                    "failed": "❌",
                    "started": "🚀",
                    "info": "ℹ️"
                }
            }
            print("🔄 Configurações padrão restauradas!")
    
    def _criar_backup(self):
        """Cria backup das configurações atuais"""
        try:
            BACKUP_DIR.mkdir(parents=True, exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_file = BACKUP_DIR / f"notif_config_{timestamp}.json"
            
            if CONFIG_FILE.exists():
                shutil.copy2(CONFIG_FILE, backup_file)
                
        except Exception:
            pass  # Falha silenciosa em backup

def aplicar_preset_comando(nome_preset: str):
    """Aplica preset via linha de comando"""
    configurador = ConfiguradorNotificacoes()
    
    presets = {
        "maximo": configurador._preset_maximo,
        "balanceado": configurador._preset_balanceado,
        "minimo": configurador._preset_minimo,
        "cursor": configurador._preset_cursor
    }
    
    if nome_preset.lower() in presets:
        presets[nome_preset.lower()]()
        configurador._salvar_configuracoes()
        print(f"✅ Preset '{nome_preset}' aplicado com sucesso!")
    else:
        print(f"❌ Preset '{nome_preset}' não encontrado!")
        print(f"Presets disponíveis: {', '.join(presets.keys())}")

def fazer_backup():
    """Cria backup das configurações"""
    configurador = ConfiguradorNotificacoes()
    configurador._criar_backup()
    print("💾 Backup criado com sucesso!")

def main():
    """Função principal"""
    if len(sys.argv) > 1:
        comando = sys.argv[1]
        
        if comando == "--preset" and len(sys.argv) > 2:
            aplicar_preset_comando(sys.argv[2])
            return
        elif comando == "--backup":
            fazer_backup()
            return
        elif comando == "--help":
            print(__doc__)
            return
        else:
            print(f"❌ Comando desconhecido: {comando}")
            print("Comandos: --preset <nome>, --backup, --help")
            return
    
    # Interface interativa
    try:
        configurador = ConfiguradorNotificacoes()
        configurador.menu_principal()
    except KeyboardInterrupt:
        print("\n\n👋 Configuração cancelada!")

if __name__ == "__main__":
    main()