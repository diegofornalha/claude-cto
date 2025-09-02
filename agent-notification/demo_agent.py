#!/usr/bin/env python3
"""
🎬 DEMONSTRAÇÃO DO AGENTE DE NOTIFICAÇÕES INTELIGENTE
=====================================================

OBJETIVO: Demonstrar todas as capacidades do NotificationAgent

RECURSOS DEMONSTRADOS:
- Templates personalizáveis
- Múltiplos canais de notificação
- Sistema de prioridades
- Analytics em tempo real
- Monitoramento inteligente
- Integração com Cursor IDE

USO:
    python3 demo_agent.py           # Demonstração completa
    python3 demo_agent.py --quick   # Demo rápida
    python3 demo_agent.py --test    # Teste de funcionalidades
"""

import os
import sys
import asyncio
import time
import argparse
from pathlib import Path

# Adicionar pasta atual ao path
sys.path.insert(0, str(Path(__file__).parent))

try:
    from notification_agent import NotificationAgent, NotificationPriority, NotificationChannel
except ImportError as e:
    print(f"❌ Erro ao importar NotificationAgent: {e}")
    print("💡 Certifique-se de que o arquivo notification_agent.py está na mesma pasta")
    sys.exit(1)

class DemonstradorAgente:
    """Demonstrador completo do agente de notificações"""
    
    def __init__(self):
        self.agent = None
        self.demo_running = False
        
    async def inicializar_agente(self):
        """Inicializa o agente de notificações"""
        print("🚀 Inicializando NotificationAgent...")
        
        # Usar configuração local
        config_path = Path(__file__).parent / "notification_config.json"
        self.agent = NotificationAgent(str(config_path))
        
        print(f"✅ Agente inicializado: {self.agent.config['agent']['name']} v{self.agent.config['agent']['version']}")
        print(f"🎯 Cursor IDE detectado: {'✅' if self.agent.is_cursor else '❌'}")
        print(f"🔔 Notificações: {'✅' if self.agent.config['notifications']['enabled'] else '❌'}")
        
        # Iniciar monitoramento
        self.agent.start_monitoring()
        
        return True
    
    async def demonstracao_completa(self):
        """Demonstração completa com todas as funcionalidades"""
        if not await self.inicializar_agente():
            return
        
        print("\n🎬" + "=" * 78 + "🎬")
        print("           DEMONSTRAÇÃO COMPLETA - AGENTE DE NOTIFICAÇÕES")
        print("🎬" + "=" * 78 + "🎬")
        
        # 1. Demonstração de templates básicos
        await self._demo_templates_basicos()
        
        # 2. Demonstração de prioridades
        await self._demo_prioridades()
        
        # 3. Demonstração de canais
        await self._demo_canais()
        
        # 4. Demonstração de templates avançados
        await self._demo_templates_avancados()
        
        # 5. Demonstração de analytics
        await self._demo_analytics()
        
        # 6. Demonstração de monitoramento
        await self._demo_monitoramento()
        
        print("\n🎉 DEMONSTRAÇÃO COMPLETA FINALIZADA!")
        print("📊 Analytics finais:")
        await self._exibir_analytics()
        
        # Parar monitoramento
        self.agent.stop_monitoring()
    
    async def _demo_templates_basicos(self):
        """Demonstra templates básicos"""
        print("\n🔤" + "=" * 78)
        print("1. TEMPLATES BÁSICOS")
        print("🔤" + "=" * 78)
        
        print("\n📝 Enviando notificação de informação...")
        await self.agent.send_notification("info", message="Sistema de demonstração iniciado")
        await asyncio.sleep(2)
        
        print("\n✅ Enviando notificação de task concluída...")
        await self.agent.send_notification("task_completed", task_name="Setup", duration="45s")
        await asyncio.sleep(2)
        
        print("\n❌ Enviando notificação de task falhada...")
        await self.agent.send_notification("task_failed", task_name="Teste", error="Timeout")
        await asyncio.sleep(2)
        
        print("\n🚨 Enviando alerta do sistema...")
        await self.agent.send_notification("system_alert", message="Demonstração em andamento")
        await asyncio.sleep(2)
    
    async def _demo_prioridades(self):
        """Demonstra sistema de prioridades"""
        print("\n🎯" + "=" * 78)
        print("2. SISTEMA DE PRIORIDADES")
        print("🎯" + "=" * 78)
        
        print("\n🟢 Notificação de prioridade BAIXA...")
        await self.agent.send_notification("info", message="Processo em background")
        await asyncio.sleep(1.5)
        
        print("\n🟡 Notificação de prioridade MÉDIA...")
        await self.agent.send_notification("task_completed", task_name="Processamento", duration="2m")
        await asyncio.sleep(1.5)
        
        print("\n🟠 Notificação de prioridade ALTA...")
        await self.agent.send_notification("task_failed", task_name="Crítico", error="Falha de conexão")
        await asyncio.sleep(1.5)
        
        print("\n🔴 Notificação de prioridade CRÍTICA...")
        await self.agent.send_notification("system_alert", message="ATENÇÃO: Sistema crítico offline!")
        await asyncio.sleep(2)
    
    async def _demo_canais(self):
        """Demonstra diferentes canais"""
        print("\n📡" + "=" * 78)
        print("3. CANAIS DE NOTIFICAÇÃO")
        print("📡" + "=" * 78)
        
        print("\n💻 Canal Terminal (padrão)...")
        await self.agent.send_notification("info", message="Notificação via terminal")
        await asyncio.sleep(1.5)
        
        # Verificar se desktop está habilitado
        if self.agent.config["channels"]["desktop"]["enabled"]:
            print("\n🖥️ Canal Desktop...")
            # Criar notificação customizada para desktop
            await self.agent.send_notification("info", message="Notificação via desktop")
            await asyncio.sleep(1.5)
        else:
            print("\n🖥️ Canal Desktop: ❌ Desabilitado na configuração")
        
        print("\n🌐 Canal Webhook: ❌ Desabilitado por padrão")
        print("   (Configure webhook_url na configuração para habilitar)")
    
    async def _demo_templates_avancados(self):
        """Demonstra templates avançados"""
        print("\n🚀" + "=" * 78)
        print("4. TEMPLATES AVANÇADOS")
        print("🚀" + "=" * 78)
        
        print("\n🏗️ Notificação de build...")
        await self.agent.send_notification("build_success", project_name="Claude-CTO")
        await asyncio.sleep(2)
        
        print("\n🚀 Notificação de deploy...")
        await self.agent.send_notification("deployment", environment="Produção", status="Concluído", details="v2.1.0")
        await asyncio.sleep(2)
        
        print("\n🔒 Notificação de segurança...")
        await self.agent.send_notification("security_alert", vulnerability="CVE-2024-1234 detectado")
        await asyncio.sleep(2)
    
    async def _demo_analytics(self):
        """Demonstra sistema de analytics"""
        print("\n📊" + "=" * 78)
        print("5. SISTEMA DE ANALYTICS")
        print("📊" + "=" * 78)
        
        print("\n📈 Exibindo estatísticas em tempo real...")
        await self._exibir_analytics()
        
        print("\n🔄 Enviando mais notificações para atualizar stats...")
        for i in range(3):
            await self.agent.send_notification("info", message=f"Notificação de teste {i+1}")
            await asyncio.sleep(0.5)
        
        print("\n📊 Estatísticas atualizadas:")
        await self._exibir_analytics()
    
    async def _demo_monitoramento(self):
        """Demonstra sistema de monitoramento"""
        print("\n🔍" + "=" * 78)
        print("6. SISTEMA DE MONITORAMENTO")
        print("🔍" + "=" * 78)
        
        print("\n👀 Monitoramento ativo em background...")
        print("   • Verificando notificações não lidas")
        print("   • Atualizando título do terminal")
        print("   • Coletando métricas")
        
        # Simular algumas notificações não lidas
        unread_count = self.agent.get_unread_count()
        print(f"\n📬 Notificações não lidas: {unread_count}")
        
        if unread_count > 0:
            print("   • Título do terminal deve mostrar contador")
            print("   • Use Ctrl+C para parar demonstração")
        
        await asyncio.sleep(3)
    
    async def _exibir_analytics(self):
        """Exibe analytics do agente"""
        if not self.agent:
            return
        
        stats = self.agent.get_analytics()
        
        print("\n📊 ESTATÍSTICAS DO AGENTE:")
        print(f"   📤 Total enviadas: {stats['total_sent']}")
        print(f"   📖 Total lidas: {stats['total_read']}")
        print(f"   📈 Taxa de engajamento: {stats['engagement_rate']:.1f}%")
        
        if stats['by_priority']:
            print("\n   🎯 Por Prioridade:")
            for priority, count in stats['by_priority'].items():
                print(f"      • {priority.capitalize()}: {count}")
        
        if stats['by_template']:
            print("\n   📝 Por Template:")
            for template, count in stats['by_template'].items():
                print(f"      • {template}: {count}")
    
    async def demonstracao_rapida(self):
        """Demonstração rápida das funcionalidades principais"""
        if not await self.inicializar_agente():
            return
        
        print("\n⚡ DEMONSTRAÇÃO RÁPIDA")
        print("=" * 50)
        
        # Enviar algumas notificações rapidamente
        await self.agent.send_notification("info", message="Demo rápida iniciada")
        await asyncio.sleep(1)
        
        await self.agent.send_notification("task_completed", task_name="Quick Demo", duration="10s")
        await asyncio.sleep(1)
        
        await self.agent.send_notification("system_alert", message="Demo rápida concluída!")
        
        print("\n✅ Demonstração rápida concluída!")
        self.agent.stop_monitoring()
    
    async def teste_funcionalidades(self):
        """Teste das funcionalidades principais"""
        if not await self.inicializar_agente():
            return
        
        print("\n🧪 TESTE DE FUNCIONALIDADES")
        print("=" * 50)
        
        # Teste 1: Templates
        print("\n🔤 Testando templates...")
        templates = list(self.agent.templates.keys())
        print(f"   Templates disponíveis: {', '.join(templates)}")
        
        # Teste 2: Canais
        print("\n📡 Testando canais...")
        channels = list(self.agent.channels.keys())
        print(f"   Canais ativos: {', '.join([c.value for c in channels])}")
        
        # Teste 3: Configuração
        print("\n⚙️ Testando configuração...")
        print(f"   Agente: {self.agent.config['agent']['name']}")
        print(f"   Versão: {self.agent.config['agent']['version']}")
        print(f"   Notificações: {self.agent.config['notifications']['enabled']}")
        
        # Teste 4: Envio de notificação
        print("\n📤 Testando envio...")
        event = await self.agent.send_notification("info", message="Teste de funcionalidade")
        if event:
            print(f"   ✅ Notificação enviada com ID: {event.id}")
        
        print("\n✅ Teste de funcionalidades concluído!")
        self.agent.stop_monitoring()

async def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description="Demonstrador do NotificationAgent")
    parser.add_argument("--quick", action="store_true", help="Demonstração rápida")
    parser.add_argument("--test", action="store_true", help="Teste de funcionalidades")
    
    args = parser.parse_args()
    
    demonstrador = DemonstradorAgente()
    
    try:
        if args.quick:
            await demonstrador.demonstracao_rapida()
        elif args.test:
            await demonstrador.teste_funcionalidades()
        else:
            await demonstrador.demonstracao_completa()
            
    except KeyboardInterrupt:
        print("\n🛑 Demonstração interrompida pelo usuário")
        if demonstrador.agent:
            demonstrador.agent.stop_monitoring()
    except Exception as e:
        print(f"\n❌ Erro durante demonstração: {e}")
        if demonstrador.agent:
            demonstrador.agent.stop_monitoring()

if __name__ == "__main__":
    asyncio.run(main())
