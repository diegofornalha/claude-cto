'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardBody, Badge, Stack, Button } from '@/components/ui'
import { McpApi, Task } from '@/services/mcp-api'
import { useWebSocket, useWebSocketEvent, TaskEvent } from '@/services/websocket'

interface TaskStatus {
  emoji: string;
  variant: 'success' | 'danger' | 'warning' | 'info' | 'default';
  label: string;
}

// Mapeamento de status para emoji e estilo
const statusMap: Record<Task['status'], TaskStatus> = {
  completed: { emoji: '✅', variant: 'success', label: 'Concluída' },
  running: { emoji: '⏳', variant: 'warning', label: 'Executando' },
  failed: { emoji: '❌', variant: 'danger', label: 'Falhou' },
  pending: { emoji: '⏱️', variant: 'info', label: 'Pendente' }
}

interface TaskMonitorProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  maxTasks?: number;
  showFilters?: boolean;
  onTaskStatusChange?: (task: Task, previousStatus?: Task['status']) => void;
}

const TaskMonitor: React.FC<TaskMonitorProps> = ({
  className = '',
  autoRefresh = true,
  refreshInterval = 5000,
  maxTasks = 100,
  showFilters = true,
  onTaskStatusChange
}) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Task['status'] | 'all'>('all')
  const [sortBy, setSortBy] = useState<'updated_at' | 'created_at' | 'execution_time'>('updated_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  const intervalRef = useRef<NodeJS.Timeout>()
  const previousTasksRef = useRef<Map<string, Task['status']>>(new Map())
  const { isConnected } = useWebSocket()

  // Função para buscar tasks da API
  const fetchTasks = useCallback(async () => {
    try {
      setError(null)
      const fetchedTasks = await McpApi.getTasks()
      
      // Limitar número de tasks se especificado
      const limitedTasks = maxTasks ? fetchedTasks.slice(0, maxTasks) : fetchedTasks
      
      // Detectar mudanças de status para notificações
      limitedTasks.forEach(task => {
        const previousStatus = previousTasksRef.current.get(task.id)
        if (previousStatus && previousStatus !== task.status) {
          onTaskStatusChange?.(task, previousStatus)
          
          // Trigger browser notification if available
          if ('Notification' in window && Notification.permission === 'granted') {
            const statusInfo = statusMap[task.status]
            new Notification(`Task ${statusInfo.label}`, {
              body: `${task.identifier}: ${task.execution_prompt.substring(0, 100)}...`,
              icon: '/favicon.ico',
              tag: `task-${task.id}`,
            })
          }
        }
        previousTasksRef.current.set(task.id, task.status)
      })
      
      setTasks(limitedTasks)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar tasks'
      setError(errorMessage)
      console.error('Erro ao buscar tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [maxTasks, onTaskStatusChange])

  // Configurar auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      // Buscar imediatamente
      fetchTasks()
      
      // Configurar intervalo
      intervalRef.current = setInterval(fetchTasks, refreshInterval)
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    } else {
      fetchTasks()
    }
  }, [autoRefresh, refreshInterval, fetchTasks])

  // Escutar eventos WebSocket para atualizações em tempo real
  useWebSocketEvent<TaskEvent>('task_created', (data) => {
    fetchTasks() // Refresh após task criada
  })

  useWebSocketEvent<TaskEvent>('task_started', (data) => {
    fetchTasks() // Refresh após task iniciada
  })

  useWebSocketEvent<TaskEvent>('task_completed', (data) => {
    fetchTasks() // Refresh após task concluída
  })

  useWebSocketEvent<TaskEvent>('task_failed', (data) => {
    fetchTasks() // Refresh após task falhar
  })

  // Solicitar permissão para notificações
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Filtrar e ordenar tasks
  const processedTasks = React.useMemo(() => {
    let filtered = tasks
    
    // Aplicar filtro
    if (filter !== 'all') {
      filtered = filtered.filter(task => task.status === filter)
    }
    
    // Aplicar ordenação
    return filtered.sort((a, b) => {
      let aValue: any
      let bValue: any
      
      switch (sortBy) {
        case 'execution_time':
          aValue = a.execution_time || 0
          bValue = b.execution_time || 0
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'updated_at':
        default:
          aValue = new Date(a.updated_at).getTime()
          bValue = new Date(b.updated_at).getTime()
          break
      }
      
      if (sortOrder === 'asc') {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })
  }, [tasks, filter, sortBy, sortOrder])

  // Função para formatar timestamp
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) { // menos de 1 minuto
      return 'agora'
    } else if (diff < 3600000) { // menos de 1 hora
      const minutes = Math.floor(diff / 60000)
      return `${minutes}m atrás`
    } else if (diff < 86400000) { // menos de 1 dia
      const hours = Math.floor(diff / 3600000)
      return `${hours}h atrás`
    } else {
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  // Função para formatar tempo de execução
  const formatExecutionTime = (time?: number): string => {
    if (!time) return 'N/A'
    
    if (time < 1000) {
      return `${time}ms`
    } else if (time < 60000) {
      return `${(time / 1000).toFixed(1)}s`
    } else {
      const minutes = Math.floor(time / 60000)
      const seconds = Math.floor((time % 60000) / 1000)
      return `${minutes}m ${seconds}s`
    }
  }

  // Função para refresh manual
  const handleRefresh = () => {
    setLoading(true)
    fetchTasks()
  }

  // Estatísticas das tasks
  const stats = React.useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completed').length
    const running = tasks.filter(t => t.status === 'running').length
    const failed = tasks.filter(t => t.status === 'failed').length
    const pending = tasks.filter(t => t.status === 'pending').length
    
    return { total, completed, running, failed, pending }
  }, [tasks])

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-red-600">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="font-semibold">Erro ao carregar tasks</p>
          <p className="text-sm mt-1">{error}</p>
          <Button onClick={handleRefresh} className="mt-4" size="sm">
            Tentar novamente
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Monitor de Tasks</h2>
            <p className="text-sm text-gray-500 mt-1">
              Monitoramento em tempo real • {processedTasks.length} tasks
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Status de conexão */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-500">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            
            {/* Botão de refresh */}
            <Button 
              onClick={handleRefresh} 
              variant="ghost" 
              size="sm"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <motion.div
                animate={loading ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 1, repeat: loading ? Infinity : 0 }}
              >
                🔄
              </motion.div>
              {loading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="mt-4 grid grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.running}</div>
            <div className="text-xs text-gray-500">Executando</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-gray-500">Concluídas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-xs text-gray-500">Falhas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <div className="text-xs text-gray-500">Pendentes</div>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Filtro:</span>
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="all">Todas</option>
                <option value="running">Executando</option>
                <option value="completed">Concluídas</option>
                <option value="failed">Falhas</option>
                <option value="pending">Pendentes</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Ordenar por:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="updated_at">Última atualização</option>
                <option value="created_at">Data de criação</option>
                <option value="execution_time">Tempo de execução</option>
              </select>
              
              <Button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                variant="ghost"
                size="sm"
                className="px-2"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardBody>
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          <AnimatePresence initial={false}>
            {loading && processedTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-gray-500 py-8"
              >
                <div className="text-4xl mb-2">⏳</div>
                <p>Carregando tasks...</p>
              </motion.div>
            ) : processedTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-gray-500 py-8"
              >
                <div className="text-4xl mb-2">📭</div>
                <p>Nenhuma task encontrada</p>
                {filter !== 'all' && (
                  <p className="text-sm mt-1">Tente alterar o filtro para ver mais tasks</p>
                )}
              </motion.div>
            ) : (
              processedTasks.map((task, index) => {
                const statusInfo = statusMap[task.status]
                
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: index * 0.05,
                      ease: "easeOut"
                    }}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                  >
                    <Stack direction="horizontal" spacing="md" align="start">
                      {/* Status emoji */}
                      <div className="text-xl flex-shrink-0 mt-0.5">
                        {statusInfo.emoji}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Header com badges */}
                        <Stack direction="horizontal" spacing="sm" align="center" className="mb-2">
                          <Badge variant={statusInfo.variant} size="sm">
                            {statusInfo.label}
                          </Badge>
                          
                          <Badge variant="default" size="sm">
                            {task.model}
                          </Badge>
                          
                          {task.orchestration_group && (
                            <Badge variant="secondary" size="sm">
                              Grupo: {task.orchestration_group}
                            </Badge>
                          )}
                        </Stack>
                        
                        {/* Identificador e prompt */}
                        <div className="mb-2">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            {task.identifier}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {task.execution_prompt}
                          </p>
                        </div>
                        
                        {/* Informações adicionais */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
                          <div>
                            <span className="font-medium">Criada:</span><br />
                            {formatTimestamp(task.created_at)}
                          </div>
                          
                          <div>
                            <span className="font-medium">Atualizada:</span><br />
                            {formatTimestamp(task.updated_at)}
                          </div>
                          
                          <div>
                            <span className="font-medium">Execução:</span><br />
                            {formatExecutionTime(task.execution_time)}
                          </div>
                          
                          <div>
                            <span className="font-medium">Diretório:</span><br />
                            <span className="font-mono">{task.working_directory}</span>
                          </div>
                        </div>
                      </div>
                    </Stack>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>

        {/* Indicador de limite de tasks */}
        {maxTasks && tasks.length >= maxTasks && (
          <div className="mt-4 text-center">
            <Badge variant="info" size="sm">
              Mostrando as {maxTasks} tasks mais recentes de {tasks.length} total
            </Badge>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export default TaskMonitor