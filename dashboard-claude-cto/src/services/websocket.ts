// Serviço WebSocket para comunicação em tempo real com a API
import { useEffect, useRef, useState, useCallback } from 'react';

// Tipos de eventos WebSocket
export type WebSocketEventType = 
  | 'task_created'
  | 'task_started'
  | 'task_completed'
  | 'task_failed'
  | 'stats_updated'
  | 'activity_added'
  | 'task_progress'
  | 'system_alert';

export interface WebSocketMessage {
  type: WebSocketEventType;
  timestamp: string;
  data: any;
}

export interface TaskEvent {
  task_id: string;
  task_identifier: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message?: string;
  progress?: number;
  execution_time?: number;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
}

export interface StatsUpdate {
  total_tasks: number;
  running_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  pending_tasks: number;
  average_execution_time: number;
  success_rate: number;
  memory_usage: number;
  cpu_usage: number;
  uptime: number;
  last_updated: string;
}

export interface ActivityEvent {
  id: string;
  type: 'task_created' | 'task_started' | 'task_completed' | 'task_failed' | 'system_event';
  task_id?: string;
  task_identifier?: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  details?: any;
}

export interface SystemAlert {
  level: 'info' | 'warning' | 'error';
  message: string;
  details?: any;
  timestamp: string;
}

// Configuração de reconexão
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000]; // Exponential backoff
const MAX_RECONNECT_ATTEMPTS = RECONNECT_DELAYS.length;

// Classe WebSocket Manager
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Map<WebSocketEventType, Set<(data: any) => void>> = new Map();
  private reconnectAttempt = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  private connectionStateListeners: Set<(connected: boolean) => void> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(url: string = 'ws://localhost:8741/ws') {
    this.url = url;
    console.log('WebSocket configurado para:', url);
  }

  // Conectar ao WebSocket
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isIntentionallyClosed = false;
    
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket conectado');
        this.reconnectAttempt = 0;
        this.notifyConnectionState(true);
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Erro WebSocket:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket desconectado');
        this.notifyConnectionState(false);
        this.stopHeartbeat();
        
        if (!this.isIntentionallyClosed) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('Erro ao criar WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  // Desconectar WebSocket
  disconnect(): void {
    this.isIntentionallyClosed = true;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.notifyConnectionState(false);
  }

  // Agendar reconexão com exponential backoff
  private scheduleReconnect(): void {
    if (this.reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Máximo de tentativas de reconexão atingido');
      return;
    }

    const delay = RECONNECT_DELAYS[this.reconnectAttempt];
    console.log(`Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempt + 1}/${MAX_RECONNECT_ATTEMPTS})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempt++;
      this.connect();
    }, delay);
  }

  // Heartbeat para manter conexão ativa
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping a cada 30 segundos
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Processar mensagem recebida
  private handleMessage(message: WebSocketMessage): void {
    const listeners = this.listeners.get(message.type);
    
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(message.data);
        } catch (error) {
          console.error('Erro no listener:', error);
        }
      });
    }
  }

  // Adicionar listener para evento específico
  on(eventType: WebSocketEventType, callback: (data: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(callback);
    
    // Retornar função para remover o listener
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  // Remover listener para evento específico
  off(eventType: WebSocketEventType, callback: (data: any) => void): void {
    this.listeners.get(eventType)?.delete(callback);
  }

  // Emitir evento personalizado (para testes ou eventos locais)
  emit(eventType: WebSocketEventType, data: any): void {
    const listeners = this.listeners.get(eventType);
    
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Erro no listener:', error);
        }
      });
    }
  }

  // Adicionar listener para estado de conexão
  onConnectionStateChange(callback: (connected: boolean) => void): () => void {
    this.connectionStateListeners.add(callback);
    
    // Notificar estado atual imediatamente
    callback(this.isConnected());
    
    return () => {
      this.connectionStateListeners.delete(callback);
    };
  }

  // Notificar mudança de estado de conexão
  private notifyConnectionState(connected: boolean): void {
    this.connectionStateListeners.forEach(listener => {
      try {
        listener(connected);
      } catch (error) {
        console.error('Erro no listener de conexão:', error);
      }
    });
  }

  // Verificar se está conectado
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Enviar mensagem
  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket não está conectado');
    }
  }
}

// Instância singleton
let wsManagerInstance: WebSocketManager | null = null;

export function getWebSocketManager(): WebSocketManager {
  if (!wsManagerInstance) {
    wsManagerInstance = new WebSocketManager();
  }
  return wsManagerInstance;
}

// Hook React para usar WebSocket
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const wsManager = useRef<WebSocketManager>();

  useEffect(() => {
    wsManager.current = getWebSocketManager();
    
    // Conectar ao WebSocket
    wsManager.current.connect();
    
    // Escutar mudanças de conexão
    const unsubscribe = wsManager.current.onConnectionStateChange(setIsConnected);
    
    return () => {
      unsubscribe();
    };
  }, []);

  const on = useCallback((eventType: WebSocketEventType, callback: (data: any) => void) => {
    if (!wsManager.current) return () => {};
    return wsManager.current.on(eventType, callback);
  }, []);

  const send = useCallback((data: any) => {
    wsManager.current?.send(data);
  }, []);

  return {
    isConnected,
    on,
    send,
    manager: wsManager.current,
  };
}

// Hook para escutar eventos específicos
export function useWebSocketEvent<T = any>(
  eventType: WebSocketEventType,
  callback: (data: T) => void
) {
  const { on } = useWebSocket();

  useEffect(() => {
    const unsubscribe = on(eventType, callback);
    return unsubscribe;
  }, [eventType, callback, on]);
}

// Hook para estatísticas em tempo real
export function useRealtimeStats() {
  const [stats, setStats] = useState<StatsUpdate | null>(null);
  
  useWebSocketEvent<StatsUpdate>('stats_updated', (data) => {
    setStats(data);
  });

  return stats;
}

// Hook para atividades em tempo real
export function useRealtimeActivities(maxItems: number = 50) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);

  useWebSocketEvent<ActivityEvent>('activity_added', (data) => {
    setActivities(prev => {
      const newActivities = [data, ...prev];
      return newActivities.slice(0, maxItems);
    });
  });

  return activities;
}

// Hook para eventos de task específicos
export function useTaskEvents() {
  const [taskEvents, setTaskEvents] = useState<TaskEvent[]>([]);

  const handleTaskEvent = useCallback((data: TaskEvent) => {
    setTaskEvents(prev => {
      // Remove evento anterior da mesma task se existir
      const filtered = prev.filter(event => event.task_id !== data.task_id);
      return [data, ...filtered].slice(0, 100); // Manter apenas os 100 mais recentes
    });
  }, []);

  useWebSocketEvent<TaskEvent>('task_created', handleTaskEvent);
  useWebSocketEvent<TaskEvent>('task_started', handleTaskEvent);
  useWebSocketEvent<TaskEvent>('task_completed', handleTaskEvent);
  useWebSocketEvent<TaskEvent>('task_failed', handleTaskEvent);

  return taskEvents;
}

// Hook para monitorar uma task específica
export function useTaskMonitor(taskId: string) {
  const [taskEvent, setTaskEvent] = useState<TaskEvent | null>(null);

  const handleTaskEvent = useCallback((data: TaskEvent) => {
    if (data.task_id === taskId) {
      setTaskEvent(data);
    }
  }, [taskId]);

  useWebSocketEvent<TaskEvent>('task_created', handleTaskEvent);
  useWebSocketEvent<TaskEvent>('task_started', handleTaskEvent);
  useWebSocketEvent<TaskEvent>('task_completed', handleTaskEvent);
  useWebSocketEvent<TaskEvent>('task_failed', handleTaskEvent);

  return taskEvent;
}

// Exportar tipos e funções úteis
export default getWebSocketManager;