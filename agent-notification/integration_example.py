#!/usr/bin/env python3
"""
🔌 EXEMPLO DE INTEGRAÇÃO - NotificationAgent
============================================

OBJETIVO: Demonstrar como integrar o NotificationAgent com sistemas existentes

INTEGRAÇÕES:
- Monitor infinito de notificações
- Sistema de tasks existente
- Webhooks externos
- APIs de terceiros

USO:
    python3 integration_example.py
"""

import asyncio
import time
import random
from pathlib import Path
import sys

# Adicionar pasta atual ao path
sys.path.insert(0, str(Path(__file__).parent))

try:
    from notification_agent import NotificationAgent
except ImportError as e:
    print(f"❌ Erro ao importar: {e}")
    sys.exit(1)

class SistemaIntegrado:
    """Exemplo de sistema integrado com NotificationAgent"""
    
    def __init__(self):
        self.agent = None
        self.tasks_running = []
        self.webhook_events = []
        
    async def inicializar(self):
        """Inicializa o sistema integrado"""
        print("🚀 Inicializando Sistema Integrado...")
        
        # Inicializar agente
        config_path = Path(__file__).parent / "notification_config.json"
        self.agent = NotificationAgent(str(config_path))
        
        # Iniciar monitoramento
        self.agent.start_monitoring()
        
        print("✅ Sistema integrado inicializado!")
        return True
    
    async def simular_tasks(self):
        """Simula execução de tasks com notificações"""
        print("\n🔄 SIMULANDO EXECUÇÃO DE TASKS")
        print("=" * 50)
        
        tasks = [
            {"name": "Build do Projeto", "duration": "2m 30s", "success": True},
            {"name": "Testes Unitários", "duration": "45s", "success": True},
            {"name": "Deploy Staging", "duration": "1m 15s", "success": False, "error": "Timeout"},
            {"name": "Análise de Segurança", "duration": "3m", "success": True},
            {"name": "Backup Database", "duration": "5m", "success": True}
        ]
        
        for i, task in enumerate(tasks, 1):
            print(f"\n📋 Executando Task {i}: {task['name']}")
            
            # Simular execução
            await asyncio.sleep(1)
            
            if task['success']:
                await self.agent.send_notification(
                    "task_completed",
                    task_name=task['name'],
                    duration=task['duration']
                )
                print(f"   ✅ {task['name']} concluída com sucesso")
            else:
                await self.agent.send_notification(
                    "task_failed",
                    task_name=task['name'],
                    error=task['error']
                )
                print(f"   ❌ {task['name']} falhou: {task['error']}")
            
            await asyncio.sleep(1)
    
    async def simular_build_pipeline(self):
        """Simula pipeline de build com notificações"""
        print("\n🏗️ SIMULANDO PIPELINE DE BUILD")
        print("=" * 50)
        
        stages = [
            {"name": "Compilação", "status": "Concluído", "details": "0 warnings"},
            {"name": "Testes", "status": "Concluído", "details": "100% coverage"},
            {"name": "Análise de Código", "status": "Concluído", "details": "A+ rating"},
            {"name": "Build Docker", "status": "Concluído", "details": "Image: 1.2.3"},
            {"name": "Deploy", "status": "Em Progresso", "details": "Rolling update"}
        ]
        
        for stage in stages:
            print(f"\n🔧 {stage['name']}: {stage['status']}")
            
            if stage['status'] == "Concluído":
                await self.agent.send_notification(
                    "build_success",
                    project_name=f"Claude-CTO - {stage['name']}"
                )
            else:
                await self.agent.send_notification(
                    "deployment",
                    environment="Produção",
                    status=stage['status'],
                    details=stage['details']
                )
            
            await asyncio.sleep(1.5)
    
    async def simular_monitoramento_sistema(self):
        """Simula monitoramento de sistema com alertas"""
        print("\n🔍 SIMULANDO MONITORAMENTO DE SISTEMA")
        print("=" * 50)
        
        # Simular métricas do sistema
        metrics = [
            {"cpu": 85, "memory": 78, "disk": 45, "alert": False},
            {"cpu": 92, "memory": 85, "disk": 47, "alert": False},
            {"cpu": 98, "memory": 92, "disk": 49, "alert": True},
            {"cpu": 95, "memory": 88, "disk": 50, "alert": True}
        ]
        
        for i, metric in enumerate(metrics, 1):
            print(f"\n📊 Métricas {i}: CPU {metric['cpu']}%, RAM {metric['memory']}%, Disk {metric['disk']}%")
            
            if metric['alert']:
                await self.agent.send_notification(
                    "system_alert",
                    message=f"ALERTA: CPU {metric['cpu']}%, RAM {metric['memory']}% - Sistema sobrecarregado!"
                )
                print("   🚨 Alerta enviado!")
            else:
                await self.agent.send_notification(
                    "info",
                    message=f"Sistema estável: CPU {metric['cpu']}%, RAM {metric['memory']}%"
                )
            
            await asyncio.sleep(2)
    
    async def simular_webhooks(self):
        """Simula recebimento de webhooks externos"""
        print("\n🌐 SIMULANDO WEBHOOKS EXTERNOS")
        print("=" * 50)
        
        webhook_events = [
            {"source": "GitHub", "event": "Push", "branch": "main", "commit": "abc123"},
            {"source": "Slack", "event": "Mensagem", "channel": "#dev", "user": "João"},
            {"source": "Jira", "event": "Issue", "status": "Resolvido", "assignee": "Maria"},
            {"source": "Jenkins", "event": "Build", "status": "Sucesso", "duration": "8m"}
        ]
        
        for event in webhook_events:
            print(f"\n📡 Webhook recebido: {event['source']} - {event['event']}")
            
            # Criar notificação baseada no tipo de evento
            if event['source'] == "GitHub":
                await self.agent.send_notification(
                    "info",
                    message=f"Push para branch {event['branch']}: {event['commit'][:7]}"
                )
            elif event['source'] == "Jira":
                await self.agent.send_notification(
                    "task_completed",
                    task_name=f"Jira Issue - {event['event']}",
                    duration="Resolvido"
                )
            elif event['source'] == "Jenkins":
                await self.agent.send_notification(
                    "build_success",
                    project_name=f"Jenkins - {event['event']}"
                )
            
            await asyncio.sleep(1.5)
    
    async def exibir_analytics_finais(self):
        """Exibe analytics finais do sistema"""
        print("\n📊 ANALYTICS FINAIS DO SISTEMA")
        print("=" * 50)
        
        if not self.agent:
            return
        
        stats = self.agent.get_analytics()
        
        print(f"\n📈 ESTATÍSTICAS GERAIS:")
        print(f"   📤 Total de notificações: {stats['total_sent']}")
        print(f"   📖 Total lidas: {stats['total_read']}")
        print(f"   📊 Taxa de engajamento: {stats['engagement_rate']:.1f}%")
        
        if stats['by_priority']:
            print(f"\n🎯 DISTRIBUIÇÃO POR PRIORIDADE:")
            for priority, count in stats['by_priority'].items():
                print(f"   • {priority.capitalize()}: {count}")
        
        if stats['by_template']:
            print(f"\n📝 DISTRIBUIÇÃO POR TEMPLATE:")
            for template, count in stats['by_template'].items():
                print(f"   • {template}: {count}")
        
        # Contador de não lidas
        unread = self.agent.get_unread_count()
        print(f"\n📬 Notificações não lidas: {unread}")
        
        if unread > 0:
            print("   💡 Use Ctrl+C para parar e verificar notificações")
    
    async def executar_demonstracao(self):
        """Executa demonstração completa de integração"""
        if not await self.inicializar():
            return
        
        print("\n🎬" + "=" * 78 + "🎬")
        print("           DEMONSTRAÇÃO DE INTEGRAÇÃO - NotificationAgent")
        print("🎬" + "=" * 78 + "🎬")
        
        try:
            # 1. Simular tasks
            await self.simular_tasks()
            
            # 2. Simular pipeline de build
            await self.simular_build_pipeline()
            
            # 3. Simular monitoramento de sistema
            await self.simular_monitoramento_sistema()
            
            # 4. Simular webhooks
            await self.simular_webhooks()
            
            # 5. Analytics finais
            await self.exibir_analytics_finais()
            
            print("\n🎉 DEMONSTRAÇÃO DE INTEGRAÇÃO CONCLUÍDA!")
            print("\n💡 O sistema está rodando. Use Ctrl+C para parar.")
            
            # Manter rodando para mostrar monitoramento
            while True:
                await asyncio.sleep(5)
                
        except KeyboardInterrupt:
            print("\n🛑 Demonstração interrompida pelo usuário")
        finally:
            if self.agent:
                self.agent.stop_monitoring()
                print("🛑 Monitoramento parado")

async def main():
    """Função principal"""
    sistema = SistemaIntegrado()
    await sistema.executar_demonstracao()

if __name__ == "__main__":
    asyncio.run(main())
