#!/usr/bin/env python3
"""
Servidor de Monitoramento para Claude CTO
Com WebSocket, notificações e dashboard em tempo real
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Set, Optional
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn
import aiohttp
from sqlitedict import SqliteDict

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== MODELOS ====================

class TaskStatus(BaseModel):
    """Status de uma tarefa"""
    id: int
    identifier: Optional[str]
    status: str  # running, completed, failed, pending
    progress: int = 0
    message: str = ""
    created_at: datetime
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    error: Optional[str]

class NotificationConfig(BaseModel):
    """Configuração de notificações"""
    enabled: bool = True
    sound: bool = True
    desktop: bool = True
    email: bool = False
    webhook_slack: Optional[str] = None
    webhook_discord: Optional[str] = None

class MonitorStats(BaseModel):
    """Estatísticas do monitor"""
    total_tasks: int = 0
    running: int = 0
    completed: int = 0
    failed: int = 0
    avg_duration: float = 0
    success_rate: float = 0
    uptime: str = "0h"

# ==================== APLICAÇÃO ====================

app = FastAPI(title="CTO Monitor Dashboard")

# CORS para permitir frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== ESTADO GLOBAL ====================

class MonitorState:
    def __init__(self):
        self.tasks: Dict[int, TaskStatus] = {}
        self.connections: Set[WebSocket] = set()
        self.stats = MonitorStats()
        self.config = NotificationConfig()
        self.db = SqliteDict("monitor.db", autocommit=True)
        self.start_time = datetime.now()
        
    async def broadcast(self, message: dict):
        """Envia mensagem para todos os clientes conectados"""
        dead_connections = set()
        for connection in self.connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.add(connection)
        
        # Remover conexões mortas
        self.connections -= dead_connections
    
    async def notify(self, event_type: str, data: dict):
        """Envia notificação para clientes"""
        notification = {
            "type": event_type,
            "timestamp": datetime.now().isoformat(),
            "data": data
        }
        
        # Broadcast via WebSocket
        await self.broadcast(notification)
        
        # Webhook Slack
        if self.config.webhook_slack and event_type in ["task_failed", "task_completed"]:
            await self.send_slack_notification(data)
        
        # Webhook Discord
        if self.config.webhook_discord:
            await self.send_discord_notification(data)
    
    async def send_slack_notification(self, data: dict):
        """Envia notificação para Slack"""
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "text": f"Claude CTO: {data.get('message', 'Atualização de tarefa')}",
                    "attachments": [{
                        "color": "good" if data.get("status") == "completed" else "danger",
                        "fields": [
                            {"title": "Task", "value": data.get("identifier", "N/A")},
                            {"title": "Status", "value": data.get("status", "N/A")}
                        ]
                    }]
                }
                await session.post(self.config.webhook_slack, json=payload)
        except Exception as e:
            logger.error(f"Erro ao enviar para Slack: {e}")
    
    async def send_discord_notification(self, data: dict):
        """Envia notificação para Discord"""
        try:
            async with aiohttp.ClientSession() as session:
                embed = {
                    "title": "Claude CTO Update",
                    "description": data.get("message", "Task update"),
                    "color": 0x00ff00 if data.get("status") == "completed" else 0xff0000,
                    "fields": [
                        {"name": "Task", "value": data.get("identifier", "N/A")},
                        {"name": "Status", "value": data.get("status", "N/A")}
                    ],
                    "timestamp": datetime.now().isoformat()
                }
                await session.post(
                    self.config.webhook_discord,
                    json={"embeds": [embed]}
                )
        except Exception as e:
            logger.error(f"Erro ao enviar para Discord: {e}")
    
    def update_stats(self):
        """Atualiza estatísticas"""
        self.stats.total_tasks = len(self.tasks)
        self.stats.running = sum(1 for t in self.tasks.values() if t.status == "running")
        self.stats.completed = sum(1 for t in self.tasks.values() if t.status == "completed")
        self.stats.failed = sum(1 for t in self.tasks.values() if t.status == "failed")
        
        if self.stats.completed + self.stats.failed > 0:
            self.stats.success_rate = (
                self.stats.completed / (self.stats.completed + self.stats.failed) * 100
            )
        
        # Calcular uptime
        uptime = datetime.now() - self.start_time
        hours = int(uptime.total_seconds() / 3600)
        minutes = int((uptime.total_seconds() % 3600) / 60)
        self.stats.uptime = f"{hours}h {minutes}m"

# Estado global
state = MonitorState()

# ==================== WEBSOCKET ====================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket para comunicação em tempo real"""
    await websocket.accept()
    state.connections.add(websocket)
    
    # Enviar estado inicial
    await websocket.send_json({
        "type": "initial_state",
        "tasks": [task.dict() for task in state.tasks.values()],
        "stats": state.stats.dict()
    })
    
    try:
        while True:
            # Manter conexão viva
            data = await websocket.receive_text()
            
            # Processar comandos do cliente
            try:
                command = json.loads(data)
                if command.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
                elif command.get("type") == "get_stats":
                    await websocket.send_json({
                        "type": "stats",
                        "data": state.stats.dict()
                    })
            except json.JSONDecodeError:
                pass
                
    except WebSocketDisconnect:
        state.connections.remove(websocket)

# ==================== API ENDPOINTS ====================

@app.get("/")
async def root():
    """Endpoint raiz"""
    return {
        "service": "CTO Monitor Dashboard",
        "version": "1.0.0",
        "status": "running",
        "websocket": "ws://localhost:8890/ws",
        "stats": state.stats.dict()
    }

@app.get("/api/tasks")
async def get_tasks():
    """Retorna todas as tarefas"""
    return {
        "tasks": [task.dict() for task in state.tasks.values()],
        "count": len(state.tasks)
    }

@app.get("/api/tasks/{task_id}")
async def get_task(task_id: int):
    """Retorna uma tarefa específica"""
    if task_id not in state.tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return state.tasks[task_id].dict()

@app.post("/api/tasks/{task_id}/update")
async def update_task(task_id: int, status: TaskStatus):
    """Atualiza status de uma tarefa"""
    state.tasks[task_id] = status
    state.update_stats()
    
    # Notificar clientes
    await state.notify(f"task_{status.status}", {
        "id": task_id,
        "identifier": status.identifier,
        "status": status.status,
        "message": status.message
    })
    
    return {"success": True}

@app.get("/api/stats")
async def get_stats():
    """Retorna estatísticas"""
    state.update_stats()
    return state.stats.dict()

@app.post("/api/config")
async def update_config(config: NotificationConfig):
    """Atualiza configuração de notificações"""
    state.config = config
    state.db["config"] = config.dict()
    return {"success": True}

@app.get("/api/config")
async def get_config():
    """Retorna configuração atual"""
    return state.config.dict()

# ==================== MONITOR DO CLAUDE CTO ====================

async def monitor_claude_cto():
    """Monitora o Claude CTO em background"""
    CTO_URL = "http://localhost:8888/api/v1"
    
    while True:
        try:
            async with aiohttp.ClientSession() as session:
                # Buscar tarefas do Claude CTO
                async with session.get(f"{CTO_URL}/tasks") as resp:
                    if resp.status == 200:
                        tasks = await resp.json()
                        
                        for task_data in tasks.get("tasks", []):
                            task_id = task_data["id"]
                            
                            # Criar ou atualizar tarefa
                            task = TaskStatus(
                                id=task_id,
                                identifier=task_data.get("identifier"),
                                status=task_data.get("status", "unknown"),
                                message=task_data.get("last_action", ""),
                                created_at=datetime.fromisoformat(
                                    task_data.get("created_at", datetime.now().isoformat())
                                ),
                                error=task_data.get("error_message")
                            )
                            
                            # Verificar se mudou
                            old_task = state.tasks.get(task_id)
                            if not old_task or old_task.status != task.status:
                                state.tasks[task_id] = task
                                
                                # Notificar mudança
                                await state.notify(f"task_{task.status}", {
                                    "id": task_id,
                                    "identifier": task.identifier,
                                    "status": task.status,
                                    "message": f"Task {task.identifier or task_id} is now {task.status}"
                                })
                        
                        state.update_stats()
                        
        except Exception as e:
            logger.error(f"Erro ao monitorar Claude CTO: {e}")
        
        await asyncio.sleep(2)  # Poll a cada 2 segundos

# ==================== INICIALIZAÇÃO ====================

@app.on_event("startup")
async def startup_event():
    """Inicializa o monitor"""
    logger.info("🚀 Iniciando CTO Monitor Dashboard...")
    
    # Carregar configuração salva
    if "config" in state.db:
        state.config = NotificationConfig(**state.db["config"])
    
    # Iniciar monitor em background
    asyncio.create_task(monitor_claude_cto())
    
    logger.info("✅ Monitor iniciado na porta 8890")
    logger.info("📊 Dashboard: http://localhost:3000")
    logger.info("🔌 WebSocket: ws://localhost:8890/ws")

@app.on_event("shutdown")
async def shutdown_event():
    """Encerra o monitor"""
    logger.info("🛑 Encerrando monitor...")
    state.db.close()

# ==================== MAIN ====================

if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8890,
        reload=True,
        log_level="info"
    )