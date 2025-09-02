# 🤖 NotificationAgent - Agente Inteligente de Notificações

> **Sistema avançado de notificações para Cursor IDE com padrão CrewAI**

## 🎯 **Visão Geral**

O **NotificationAgent** é um agente autônomo e inteligente que gerencia notificações no Cursor IDE, seguindo o padrão CrewAI. Ele oferece um sistema robusto de notificações com múltiplos canais, templates personalizáveis, analytics e monitoramento inteligente.

## 🚀 **Recursos Principais**

### ✨ **Funcionalidades Core**
- **🤖 Agente Autônomo**: Funciona independentemente com monitoramento em background
- **🎯 Detecção Inteligente**: Detecta automaticamente o ambiente Cursor IDE
- **📱 Múltiplos Canais**: Terminal, Desktop, Webhook, Slack, Discord
- **🎨 Templates Personalizáveis**: Sistema flexível de templates com variáveis
- **⚡ Sistema de Prioridades**: LOW, MEDIUM, HIGH, CRITICAL
- **📊 Analytics em Tempo Real**: Métricas e estatísticas de uso
- **🔍 Monitoramento Inteligente**: Controle de notificações não lidas

### 🎨 **Interface Visual**
- **Caixas Unicode**: Bordas e formatação visual elegante
- **Cores Dinâmicas**: Sistema de cores baseado em prioridade
- **Emojis Contextuais**: Indicadores visuais para cada tipo
- **Títulos Dinâmicos**: Atualização automática do terminal

## 📁 **Estrutura do Projeto**

```
agent-notification/
├── notification_agent.py      # Agente principal
├── notification_config.json   # Configurações avançadas
├── demo_agent.py             # Demonstração completa
└── README.md                 # Este arquivo
```

## 🛠️ **Instalação e Configuração**

### **1. Pré-requisitos**
```bash
# Python 3.8+
python3 --version

# Dependências
pip3 install psutil asyncio
```

### **2. Configuração Básica**
O agente usa o arquivo `notification_config.json` para configurações. Principais seções:

```json
{
  "agent": {
    "name": "NotificationAgent",
    "version": "2.0.0",
    "auto_start": true
  },
  "notifications": {
    "enabled": true,
    "max_concurrent": 10
  },
  "channels": {
    "terminal": {"enabled": true},
    "desktop": {"enabled": true}
  }
}
```

## 🎬 **Como Usar**

### **Demonstração Rápida**
```bash
cd agent-notification
python3 demo_agent.py --quick
```

### **Demonstração Completa**
```bash
python3 demo_agent.py
```

### **Teste de Funcionalidades**
```bash
python3 demo_agent.py --test
```

## 🔧 **Uso Programático**

### **Inicialização Básica**
```python
from notification_agent import NotificationAgent

# Criar agente
agent = NotificationAgent("notification_config.json")

# Iniciar monitoramento
agent.start_monitoring()

# Enviar notificação
await agent.send_notification("info", message="Olá mundo!")
```

### **Templates Disponíveis**
```python
# Task concluída
await agent.send_notification("task_completed", 
    task_name="Build", 
    duration="2m 30s"
)

# Task falhou
await agent.send_notification("task_failed", 
    task_name="Deploy", 
    error="Timeout de conexão"
)

# Alerta do sistema
await agent.send_notification("system_alert", 
    message="Servidor offline!"
)

# Informação
await agent.send_notification("info", 
    message="Processo em background"
)
```

### **Templates Avançados**
```python
# Build
await agent.send_notification("build_success", 
    project_name="Meu Projeto"
)

# Deploy
await agent.send_notification("deployment", 
    environment="Produção", 
    status="Concluído", 
    details="v1.2.0"
)

# Segurança
await agent.send_notification("security_alert", 
    vulnerability="CVE-2024-1234"
)
```

## 📊 **Sistema de Analytics**

### **Métricas Disponíveis**
- **Total de notificações** enviadas
- **Taxa de engajamento** (lidas vs. enviadas)
- **Distribuição por prioridade**
- **Distribuição por template**
- **Distribuição por canal**

### **Acesso aos Analytics**
```python
# Obter estatísticas
stats = agent.get_analytics()
print(f"Total enviadas: {stats['total_sent']}")
print(f"Taxa de engajamento: {stats['engagement_rate']:.1f}%")

# Contador de não lidas
unread = agent.get_unread_count()
print(f"Notificações não lidas: {unread}")
```

## 🔌 **Integração com Outros Sistemas**

### **Monitor de Tasks**
```python
# Integração com monitor infinito
from monitor_infinito_notif import MonitorInfinito

monitor = MonitorInfinito()
monitor.set_notification_agent(agent)

# Agora o monitor usará o agente para notificações
```

### **Webhooks Externos**
```json
{
  "channels": {
    "webhook": {
      "enabled": true,
      "url": "https://api.exemplo.com/webhook",
      "headers": {
        "Authorization": "Bearer token123"
      }
    }
  }
}
```

### **Slack/Discord**
```json
{
  "channels": {
    "slack": {
      "enabled": true,
      "webhook_url": "https://hooks.slack.com/...",
      "channel": "#notifications"
    }
  }
}
```

## 🎨 **Personalização de Templates**

### **Criar Template Customizado**
```json
{
  "templates": {
    "meu_template": {
      "title": "🎯 Meu Título",
      "message": "Mensagem: {variavel}",
      "priority": "medium",
      "channel": "terminal",
      "color": "\\033[1;34m",
      "emoji": "🎯"
    }
  }
}
```

### **Uso do Template Customizado**
```python
await agent.send_notification("meu_template", 
    variavel="Valor personalizado"
)
```

## 🔍 **Monitoramento e Debug**

### **Logs do Sistema**
```python
import logging

# Configurar nível de log
logging.basicConfig(level=logging.DEBUG)

# Logs incluem:
# - Inicialização do agente
# - Envio de notificações
# - Erros de canal
# - Métricas de performance
```

### **Status do Agente**
```python
# Verificar se está monitorando
if agent.monitoring_thread and agent.monitoring_thread.is_alive():
    print("✅ Monitoramento ativo")
else:
    print("❌ Monitoramento inativo")

# Verificar configuração
print(f"Agente: {agent.config['agent']['name']}")
print(f"Cursor detectado: {agent.is_cursor}")
```

## 🚨 **Tratamento de Erros**

### **Falhas de Canal**
- **Fallback automático** para terminal se outros canais falharem
- **Logs detalhados** de erros para debugging
- **Retry automático** para webhooks (configurável)

### **Configuração Inválida**
- **Validação automática** de configurações
- **Configurações padrão** em caso de erro
- **Warnings informativos** para problemas não críticos

## 🔄 **Migração do Sistema Anterior**

### **Compatibilidade**
- ✅ **Totalmente compatível** com `cursor_notifications.py`
- ✅ **Configurações existentes** são preservadas
- ✅ **Templates antigos** funcionam sem modificação

### **Melhorias Automáticas**
- 🆕 **Sistema de prioridades** adicionado
- 🆕 **Analytics automáticos** habilitados
- 🆕 **Monitoramento inteligente** ativo
- 🆕 **Múltiplos canais** disponíveis

## 📈 **Performance e Escalabilidade**

### **Otimizações**
- **Thread de monitoramento** separada
- **Limpeza automática** de notificações antigas
- **Rate limiting** configurável
- **Cache de templates** para performance

### **Limites Configuráveis**
```json
{
  "notifications": {
    "max_concurrent": 10,
    "cleanup_interval": 300
  },
  "monitoring": {
    "max_notifications_per_minute": 20
  }
}
```

## 🤝 **Contribuição e Extensibilidade**

### **Adicionar Novos Canais**
```python
class MeuCanal:
    def __init__(self, config):
        self.config = config
    
    async def send(self, event):
        # Implementar lógica de envio
        pass

# Registrar no agente
agent.channels[NotificationChannel.CUSTOM] = MeuCanal(config)
```

### **Novos Tipos de Template**
```python
# Adicionar ao config
"novo_tipo": {
    "title": "🆕 Novo Tipo",
    "message": "Mensagem: {dados}",
    "priority": "medium"
}

# Usar
await agent.send_notification("novo_tipo", dados="Informação")
```

## 📋 **Roadmap**

### **Versão 2.1**
- [ ] **Machine Learning** para otimização de notificações
- [ ] **Dashboard Web** para analytics
- [ ] **Integração com APIs** externas
- [ ] **Sistema de plugins** para extensibilidade

### **Versão 2.2**
- [ ] **Notificações push** para dispositivos móveis
- [ ] **Agendamento** de notificações
- [ ] **Filtros inteligentes** baseados em contexto
- [ ] **Integração com IA** para priorização automática

## 🐛 **Troubleshooting**

### **Problemas Comuns**

#### **Agente não inicia**
```bash
# Verificar dependências
pip3 install psutil

# Verificar permissões
chmod +x notification_agent.py

# Verificar Python
python3 --version
```

#### **Notificações não aparecem**
```bash
# Verificar configuração
cat notification_config.json

# Verificar logs
python3 demo_agent.py --test

# Verificar terminal
echo $TERM
```

#### **Erro de importação**
```bash
# Verificar estrutura de pastas
ls -la

# Verificar path Python
python3 -c "import sys; print(sys.path)"
```

## 📞 **Suporte**

### **Canais de Ajuda**
- 📖 **Documentação**: Este README
- 🧪 **Testes**: `python3 demo_agent.py --test`
- 🔍 **Debug**: Logs detalhados com `logging.DEBUG`
- 💬 **Issues**: GitHub Issues do projeto

### **Comandos Úteis**
```bash
# Status do sistema
python3 demo_agent.py --test

# Demo rápida
python3 demo_agent.py --quick

# Ver configuração
cat notification_config.json

# Ver logs
tail -f /var/log/syslog | grep NotificationAgent
```

---

## 🎉 **Conclusão**

O **NotificationAgent** representa uma evolução significativa do sistema de notificações, transformando-o de um simples notificador para um **agente inteligente e autônomo** que segue os princípios do CrewAI.

### **Benefícios Principais**
- 🚀 **Performance superior** com monitoramento assíncrono
- 🎯 **Flexibilidade total** com templates personalizáveis
- 📊 **Visibilidade completa** com analytics em tempo real
- 🔌 **Integração fácil** com sistemas existentes
- 🛡️ **Robustez** com tratamento de erros avançado

**Transforme seu sistema de notificações em um agente inteligente hoje mesmo!** 🚀 