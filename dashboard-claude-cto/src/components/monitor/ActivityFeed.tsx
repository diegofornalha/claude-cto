'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, Badge, Stack } from '@/components/ui'
import { useWebSocket, useRealtimeActivities } from '@/services/websocket'
import { McpApi, Activity } from '@/services/mcp-api'

const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const { isConnected } = useWebSocket()
  const realtimeActivities = useRealtimeActivities(50)
  const [loading, setLoading] = useState(true)

  // Carregar atividades iniciais da API
  useEffect(() => {
    const loadInitialActivities = async () => {
      try {
        setLoading(true)
        const apiActivities = await McpApi.getActivities(50)
        setActivities(apiActivities)
      } catch (error) {
        console.error('Erro ao carregar atividades:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialActivities()
  }, [])

  // Combinar atividades da API com WebSocket
  useEffect(() => {
    if (realtimeActivities.length > 0) {
      // Adicionar novas atividades do WebSocket mantendo as da API
      setActivities(prev => {
        const combined = [...realtimeActivities, ...prev]
        // Remover duplicatas baseado no ID e timestamp
        const unique = combined.filter((activity, index, arr) => 
          arr.findIndex(a => 
            a.id === activity.id || 
            (a.message === activity.message && 
             Math.abs(new Date(a.timestamp).getTime() - new Date(activity.timestamp).getTime()) < 1000)
          ) === index
        )
        return unique.slice(0, 50)
      })
    }
  }, [realtimeActivities])

  const getActivityIcon = (type: Activity['type']): string => {
    switch (type) {
      case 'task_completed':
        return '✅'
      case 'task_failed':
        return '❌'
      case 'task_created':
        return '🆕'
      case 'task_started':
        return '🚀'
      case 'system_event':
        return '⚙️'
      default:
        return '📝'
    }
  }

  const getActivityColor = (type: Activity['type']): "default" | "primary" | "secondary" | "danger" | "success" | "warning" | "info" => {
    switch (type) {
      case 'task_completed':
        return 'success'
      case 'task_failed':
        return 'danger'
      case 'task_created':
        return 'primary'
      case 'task_started':
        return 'warning'
      case 'system_event':
        return 'info'
      default:
        return 'default'
    }
  }

  const formatTimestamp = (timestamp: string | Date): string => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
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

  // Auto-scroll para o topo quando nova atividade chegar
  useEffect(() => {
    if (containerRef.current && activities.length > 0) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [activities.length])

  return (
    <Card className="p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Feed de Atividades</h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-500">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300"
      >
        <AnimatePresence initial={false}>
          {loading ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-gray-500 py-8"
            >
              <div className="animate-spin text-2xl mb-2">⏳</div>
              <p>Carregando atividades...</p>
            </motion.div>
          ) : activities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-gray-500 py-8"
            >
              <div className="text-4xl mb-2">📭</div>
              <p>Nenhuma atividade ainda</p>
              <p className="text-sm">Aguardando eventos do sistema...</p>
            </motion.div>
          ) : (
            activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.05,
                  ease: "easeOut"
                }}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <Stack direction="horizontal" spacing="md" align="start">
                  <div className="text-xl flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <Stack direction="horizontal" spacing="sm" align="center" className="mb-1">
                      <Badge variant={getActivityColor(activity.type)} size="sm">
                        {activity.type.replace('task_', '')}
                      </Badge>
                      {activity.task_id && (
                        <Badge variant="default" size="sm">
                          Task: {activity.task_id}
                        </Badge>
                      )}
                      {activity.task_identifier && (
                        <Badge variant="secondary" size="sm">
                          ID: {activity.task_identifier}
                        </Badge>
                      )}
                    </Stack>
                    
                    <p className="text-sm text-gray-700 break-words">
                      {activity.message}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                      
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <button 
                          className="text-xs text-blue-600 hover:text-blue-800"
                          onClick={() => console.log('Detalhes:', activity.metadata)}
                        >
                          Ver detalhes
                        </button>
                      )}
                    </div>
                  </div>
                </Stack>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
      
      {activities.length >= 50 && (
        <div className="mt-4 text-center">
          <Badge variant="secondary" size="sm">
            Mostrando as 50 atividades mais recentes
          </Badge>
        </div>
      )}
    </Card>
  )
}

export default ActivityFeed