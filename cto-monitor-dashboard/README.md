# 📊 Orchestrator Monitor

> **Dashboard de Monitoramento em Tempo Real para Claude CTO**

## 🎯 Responsabilidades

Este componente é responsável por:
- 📈 **Monitoramento em tempo real** das tarefas do Claude CTO
- 🔔 **Sistema de notificações** (web, desktop, som)
- 📊 **Dashboard visual** com gráficos e estatísticas
- 🔄 **WebSocket** para atualizações ao vivo
- 📱 **Notificações push** para browser/mobile

## 🏗️ Arquitetura

```
orchestrator-monitor/
├── frontend/                  # Dashboard React/Next.js
│   ├── pages/
│   │   ├── index.tsx         # Dashboard principal
│   │   ├── tasks.tsx         # Lista de tarefas
│   │   └── analytics.tsx     # Analytics e gráficos
│   ├── components/
│   │   ├── TaskMonitor.tsx   # Monitor de tarefas
│   │   ├── NotificationPanel.tsx
│   │   └── RealtimeChart.tsx
│   └── services/
│       ├── websocket.ts      # Cliente WebSocket
│       └── notifications.ts   # API de notificações
│
├── backend/                   # Servidor de monitoramento
│   ├── server.py             # FastAPI + WebSocket
│   ├── monitor.py            # Monitor de tarefas
│   ├── notifier.py           # Sistema de notificações
│   └── database.py           # SQLite para histórico
│
└── notifications/            # Configurações de notificação
    ├── sounds/               # Sons personalizados
    ├── templates/            # Templates de mensagens
    └── config.json          # Configurações

```

## ⚡ Funcionalidades

### Dashboard Web
- Visualização em tempo real de todas as tarefas
- Gráficos de performance e utilização
- Histórico de execuções
- Logs detalhados

### Sistema de Notificações
- **Browser:** Push notifications
- **Desktop:** Notificações nativas
- **Som:** Alertas sonoros configuráveis
- **Email:** Notificações por email (opcional)
- **Webhook:** Integração com Slack/Discord

### Monitoramento
- Status de cada tarefa (running, completed, failed)
- Tempo de execução
- Uso de recursos
- Taxa de sucesso/falha
- Alertas automáticos

## 🚀 Como Usar

### 1. Iniciar Backend
```bash
cd backend
python server.py --port 8890
```

### 2. Iniciar Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Acessar Dashboard
```
http://localhost:3000
```

## 🔔 Tipos de Notificação

### Sucesso ✅
- Tarefa completada
- Orquestração finalizada
- Meta atingida

### Aviso ⚠️
- Tarefa demorada (>5min)
- Alto uso de memória
- Fila grande

### Erro ❌
- Tarefa falhou
- Timeout excedido
- Erro crítico

## 🎨 Interface

### Tela Principal
```
┌─────────────────────────────────────┐
│  Claude CTO - Monitor               │
├─────────────────────────────────────┤
│ ▶ Running: 3  ✓ Complete: 45  ✗ 2  │
├─────────────────────────────────────┤
│ [=====>    ] Task 1 - 45%          │
│ [=========>] Task 2 - 89%          │
│ [==>       ] Task 3 - 23%          │
├─────────────────────────────────────┤
│ 📊 Performance | 🔔 Alerts | ⚙️     │
└─────────────────────────────────────┘
```

## 🔌 Integração com Claude CTO

```python
# Monitor se conecta ao Claude CTO
from claude_cto import TaskMonitor

monitor = TaskMonitor(
    cto_host="localhost:8888",
    notify_on_complete=True,
    notify_on_error=True
)

# Recebe eventos em tempo real
@monitor.on_task_update
def handle_update(task):
    send_notification(task)
    update_dashboard(task)
```

## 📱 Notificações Web Push

```javascript
// Solicitar permissão
Notification.requestPermission().then(permission => {
  if (permission === "granted") {
    // Enviar notificação
    new Notification("Claude CTO", {
      body: "Tarefa 'analyze_code' completada!",
      icon: "/icon.png",
      sound: "/success.mp3"
    });
  }
});
```

## 🎵 Sons Personalizados

- `success.mp3` - Tarefa completada
- `warning.mp3` - Aviso
- `error.mp3` - Erro
- `notification.mp3` - Notificação geral

## 🔗 WebSocket Events

```typescript
// Conectar ao WebSocket
const ws = new WebSocket('ws://localhost:8890/ws');

// Receber atualizações
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'task_started':
      showTaskStarted(data.task);
      break;
    case 'task_completed':
      showTaskCompleted(data.task);
      playSound('success.mp3');
      break;
    case 'task_failed':
      showTaskFailed(data.task);
      playSound('error.mp3');
      sendDesktopNotification(data.error);
      break;
  }
};
```

## 📊 Métricas Monitoradas

- **Performance**
  - Tasks/hora
  - Tempo médio de execução
  - Taxa de sucesso

- **Recursos**
  - CPU usage
  - Memory usage
  - Disk I/O

- **Queue**
  - Tarefas pendentes
  - Tarefas em execução
  - Tempo de espera

## 🔧 Configuração

`config.json`:
```json
{
  "notifications": {
    "enabled": true,
    "sound": true,
    "desktop": true,
    "email": false,
    "webhook": {
      "slack": "https://hooks.slack.com/...",
      "discord": null
    }
  },
  "monitoring": {
    "interval": 1000,
    "history_days": 7,
    "alert_thresholds": {
      "task_duration": 300,
      "memory_usage": 80,
      "queue_size": 10
    }
  }
}
```

---

**Dashboard de monitoramento profissional para Claude CTO!**