"""
WebSocket Manager for Claude CTO Server
Handles WebSocket connections, broadcasting, and event management
"""

import asyncio
import json
import logging
from typing import Dict, Set, Any, Optional
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from enum import Enum

logger = logging.getLogger(__name__)


class WebSocketEventType(str, Enum):
    """WebSocket event types"""
    TASK_CREATED = "task_created"
    TASK_STARTED = "task_started"
    TASK_PROGRESS = "task_progress"
    TASK_COMPLETED = "task_completed"
    TASK_FAILED = "task_failed"
    STATS_UPDATED = "stats_updated"
    ORCHESTRATION_STARTED = "orchestration_started"
    ORCHESTRATION_COMPLETED = "orchestration_completed"
    ORCHESTRATION_FAILED = "orchestration_failed"
    CONNECTION_ESTABLISHED = "connection_established"
    HEARTBEAT = "heartbeat"
    PONG = "pong"


class ConnectionManager:
    """
    Manages WebSocket connections and message broadcasting
    Singleton pattern to ensure single instance across the application
    """
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.active_connections: Set[WebSocket] = set()
            cls._instance.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}
            cls._instance.stats = {
                "total_connections": 0,
                "messages_sent": 0,
                "events_broadcast": 0,
                "errors": 0
            }
            cls._instance._heartbeat_task = None
            logger.info("WebSocket ConnectionManager initialized")
        return cls._instance
    
    async def connect(self, websocket: WebSocket, client_id: Optional[str] = None) -> None:
        """
        Accept new WebSocket connection
        
        Args:
            websocket: FastAPI WebSocket instance
            client_id: Optional client identifier
        """
        try:
            await websocket.accept()
            self.active_connections.add(websocket)
            
            # Store connection metadata
            self.connection_metadata[websocket] = {
                "client_id": client_id,
                "connected_at": datetime.utcnow().isoformat(),
                "last_heartbeat": datetime.utcnow().isoformat()
            }
            
            self.stats["total_connections"] += 1
            
            # Send connection confirmation
            await self.send_personal_message(
                websocket,
                {
                    "type": WebSocketEventType.CONNECTION_ESTABLISHED,
                    "data": {
                        "message": "Connected to Claude CTO WebSocket",
                        "client_id": client_id,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
            
            logger.info(f"WebSocket connection established. Active connections: {len(self.active_connections)}")
            
        except Exception as e:
            logger.error(f"Error connecting WebSocket: {e}")
            self.stats["errors"] += 1
            raise
    
    def disconnect(self, websocket: WebSocket) -> None:
        """
        Remove WebSocket connection
        
        Args:
            websocket: FastAPI WebSocket instance to disconnect
        """
        try:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
                
            if websocket in self.connection_metadata:
                del self.connection_metadata[websocket]
                
            logger.info(f"WebSocket disconnected. Active connections: {len(self.active_connections)}")
            
        except Exception as e:
            logger.error(f"Error disconnecting WebSocket: {e}")
            self.stats["errors"] += 1
    
    async def send_personal_message(self, websocket: WebSocket, message: Dict[str, Any]) -> None:
        """
        Send message to specific WebSocket connection
        
        Args:
            websocket: Target WebSocket connection
            message: Message dictionary to send
        """
        try:
            await websocket.send_json(message)
            self.stats["messages_sent"] += 1
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            self.stats["errors"] += 1
            # Remove dead connection
            self.disconnect(websocket)
    
    async def broadcast(self, message: Dict[str, Any], exclude: Optional[WebSocket] = None) -> None:
        """
        Broadcast message to all connected clients
        
        Args:
            message: Message dictionary to broadcast
            exclude: Optional WebSocket to exclude from broadcast
        """
        if not self.active_connections:
            return
            
        # Create copy to avoid modification during iteration
        connections = list(self.active_connections)
        
        # Send to all connections concurrently
        tasks = []
        for connection in connections:
            if connection != exclude:
                tasks.append(self._send_safe(connection, message))
        
        if tasks:
            await asyncio.gather(*tasks)
            self.stats["events_broadcast"] += 1
    
    async def _send_safe(self, websocket: WebSocket, message: Dict[str, Any]) -> None:
        """
        Safely send message to WebSocket, handling errors
        
        Args:
            websocket: Target WebSocket connection
            message: Message to send
        """
        try:
            await websocket.send_json(message)
            self.stats["messages_sent"] += 1
        except Exception as e:
            logger.debug(f"Failed to send to WebSocket: {e}")
            # Remove dead connection
            self.disconnect(websocket)
    
    async def broadcast_task_event(
        self,
        event_type: WebSocketEventType,
        task_id: int,
        data: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Broadcast task-related event to all clients
        
        Args:
            event_type: Type of task event
            task_id: Task ID
            data: Additional event data
        """
        message = {
            "type": event_type,
            "task_id": task_id,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data or {}
        }
        
        await self.broadcast(message)
        logger.debug(f"Broadcast task event: {event_type} for task {task_id}")
    
    async def broadcast_orchestration_event(
        self,
        event_type: WebSocketEventType,
        orchestration_id: int,
        data: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Broadcast orchestration-related event to all clients
        
        Args:
            event_type: Type of orchestration event
            orchestration_id: Orchestration ID
            data: Additional event data
        """
        message = {
            "type": event_type,
            "orchestration_id": orchestration_id,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data or {}
        }
        
        await self.broadcast(message)
        logger.debug(f"Broadcast orchestration event: {event_type} for orchestration {orchestration_id}")
    
    async def broadcast_stats(self) -> None:
        """
        Broadcast current statistics to all clients
        """
        from .crud import get_task_statistics
        from .database import get_session
        
        try:
            # Get database session
            session = next(get_session())
            stats = get_task_statistics(session)
            
            message = {
                "type": WebSocketEventType.STATS_UPDATED,
                "timestamp": datetime.utcnow().isoformat(),
                "data": {
                    **stats,
                    "websocket_connections": len(self.active_connections),
                    "websocket_stats": self.stats
                }
            }
            
            await self.broadcast(message)
            
        except Exception as e:
            logger.error(f"Error broadcasting stats: {e}")
        finally:
            session.close()
    
    async def start_heartbeat(self, interval: int = 30) -> None:
        """
        Start heartbeat task to keep connections alive
        
        Args:
            interval: Heartbeat interval in seconds
        """
        if self._heartbeat_task:
            return
            
        async def heartbeat_loop():
            while True:
                try:
                    await asyncio.sleep(interval)
                    
                    if self.active_connections:
                        message = {
                            "type": WebSocketEventType.HEARTBEAT,
                            "timestamp": datetime.utcnow().isoformat()
                        }
                        await self.broadcast(message)
                        logger.debug(f"Heartbeat sent to {len(self.active_connections)} connections")
                        
                except Exception as e:
                    logger.error(f"Error in heartbeat loop: {e}")
        
        self._heartbeat_task = asyncio.create_task(heartbeat_loop())
        logger.info("WebSocket heartbeat started")
    
    async def stop_heartbeat(self) -> None:
        """Stop heartbeat task"""
        if self._heartbeat_task:
            self._heartbeat_task.cancel()
            try:
                await self._heartbeat_task
            except asyncio.CancelledError:
                pass
            self._heartbeat_task = None
            logger.info("WebSocket heartbeat stopped")
    
    async def handle_client_message(self, websocket: WebSocket, message: Dict[str, Any]) -> None:
        """
        Handle incoming message from client
        
        Args:
            websocket: Source WebSocket connection
            message: Received message
        """
        try:
            msg_type = message.get("type")
            
            if msg_type == "ping":
                # Respond to ping with pong
                await self.send_personal_message(
                    websocket,
                    {
                        "type": WebSocketEventType.PONG,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
                
                # Update last heartbeat
                if websocket in self.connection_metadata:
                    self.connection_metadata[websocket]["last_heartbeat"] = datetime.utcnow().isoformat()
            
            elif msg_type == "stats_request":
                # Client requested stats update
                await self.broadcast_stats()
            
            else:
                logger.debug(f"Received unknown message type: {msg_type}")
                
        except Exception as e:
            logger.error(f"Error handling client message: {e}")
            self.stats["errors"] += 1
    
    def get_connection_count(self) -> int:
        """Get number of active connections"""
        return len(self.active_connections)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get WebSocket statistics"""
        return {
            **self.stats,
            "active_connections": len(self.active_connections),
            "connection_details": [
                {
                    "client_id": meta.get("client_id"),
                    "connected_at": meta.get("connected_at"),
                    "last_heartbeat": meta.get("last_heartbeat")
                }
                for meta in self.connection_metadata.values()
            ]
        }


# Global instance
manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket, client_id: Optional[str] = None):
    """
    WebSocket endpoint handler
    
    Args:
        websocket: FastAPI WebSocket instance
        client_id: Optional client identifier
    """
    await manager.connect(websocket, client_id)
    
    try:
        while True:
            # Wait for messages from client
            data = await websocket.receive_json()
            await manager.handle_client_message(websocket, data)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info(f"Client {client_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)