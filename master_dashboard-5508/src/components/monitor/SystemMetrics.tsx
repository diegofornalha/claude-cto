'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  AlertTriangle
} from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import { MetricsGrid } from '@/components/ui/Grid'
import { Alert } from '@/components/ui/Alert'
import { McpApi, SystemStats } from '@/services/mcp-api'
import { useWebSocket, useRealtimeStats } from '@/services/websocket'

interface SystemMetricsProps {
  className?: string
}

interface MetricTrend {
  value: number
  positive: boolean
}

const SystemMetrics: React.FC<SystemMetricsProps> = ({ className = '' }) => {
  const { isConnected } = useWebSocket()
  const realtimeStats = useRealtimeStats()
  
  const [stats, setStats] = useState<SystemStats>({
    total_tasks: 0,
    running_tasks: 0,
    completed_tasks: 0,
    failed_tasks: 0,
    average_execution_time: 0,
    success_rate: 0,
    memory_usage: 0,
    cpu_usage: 0
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previousStats, setPreviousStats] = useState<SystemStats | null>(null)
  const [trends, setTrends] = useState<{
    totalTasks: MetricTrend | null
    successRate: MetricTrend | null
    executionTime: MetricTrend | null
  }>({
    totalTasks: null,
    successRate: null,
    executionTime: null
  })

  const fetchStats = useCallback(async () => {
    try {
      setError(null)
      const newStats = await McpApi.getSystemStats()
      
      // Calcular tendências se temos dados anteriores
      if (previousStats) {
        setTrends({
          totalTasks: {
            value: Math.abs(((newStats.total_tasks - previousStats.total_tasks) / Math.max(previousStats.total_tasks, 1)) * 100),
            positive: newStats.total_tasks >= previousStats.total_tasks
          },
          successRate: {
            value: Math.abs(newStats.success_rate - previousStats.success_rate),
            positive: newStats.success_rate >= previousStats.success_rate
          },
          executionTime: {
            value: previousStats.average_execution_time > 0 
              ? Math.abs(((newStats.average_execution_time - previousStats.average_execution_time) / previousStats.average_execution_time) * 100)
              : 0,
            positive: newStats.average_execution_time <= previousStats.average_execution_time
          }
        })
      }
      
      setPreviousStats(stats)
      setStats(newStats)
    } catch (err) {
      console.error('Erro ao buscar estatísticas do sistema:', err)
      setError('Falha ao carregar estatísticas do sistema')
    } finally {
      setLoading(false)
    }
  }, [previousStats, stats])

  // Atualizar com dados WebSocket em tempo real
  useEffect(() => {
    if (realtimeStats) {
      // Calcular tendências com dados WebSocket
      if (previousStats) {
        setTrends({
          totalTasks: {
            value: Math.abs(((realtimeStats.total_tasks - previousStats.total_tasks) / Math.max(previousStats.total_tasks, 1)) * 100),
            positive: realtimeStats.total_tasks >= previousStats.total_tasks
          },
          successRate: {
            value: Math.abs(realtimeStats.success_rate - previousStats.success_rate),
            positive: realtimeStats.success_rate >= previousStats.success_rate
          },
          executionTime: {
            value: previousStats.average_execution_time > 0 
              ? Math.abs(((realtimeStats.average_execution_time - previousStats.average_execution_time) / previousStats.average_execution_time) * 100)
              : 0,
            positive: realtimeStats.average_execution_time <= previousStats.average_execution_time
          }
        })
      }
      
      setPreviousStats(stats)
      setStats(realtimeStats)
      setLoading(false)
      setError(null)
    }
  }, [realtimeStats])

  // Fetch inicial e fallback para polling se WebSocket não conectado
  useEffect(() => {
    fetchStats()
    
    // Usar polling apenas se WebSocket não estiver conectado
    if (!isConnected) {
      const interval = setInterval(fetchStats, 10000)
      return () => clearInterval(interval)
    }
  }, [isConnected])

  // Função para determinar cor da taxa de sucesso
  const getSuccessRateColor = (rate: number): string => {
    if (rate >= 80) return 'text-success-600'
    if (rate >= 50) return 'text-warning-600'
    return 'text-error-600'
  }

  // Função para formatar tempo de execução
  const formatExecutionTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}m ${remainingSeconds.toFixed(0)}s`
    } else {
      const hours = Math.floor(seconds / 3600)
      const remainingMinutes = Math.floor((seconds % 3600) / 60)
      return `${hours}h ${remainingMinutes}m`
    }
  }

  if (error) {
    return (
      <div className={className}>
        <Alert>
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-red-700">{error}</span>
        </Alert>
      </div>
    )
  }

  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <MetricsGrid>
          {/* Total de Tasks */}
          <MetricCard
            title="Total de Tasks"
            value={stats.total_tasks}
            icon={BarChart3}
            iconColor="text-primary-600"
            loading={loading}
            trend={trends.totalTasks ? {
              value: trends.totalTasks.value,
              label: 'desde última atualização',
              positive: trends.totalTasks.positive
            } : undefined}
            subtitle="Total geral no sistema"
          />

          {/* Tasks em Execução */}
          <MetricCard
            title="Em Execução"
            value={stats.running_tasks}
            icon={Activity}
            iconColor="text-blue-600"
            loading={loading}
            subtitle="Tasks ativas agora"
          >
            {stats.running_tasks > 0 && (
              <div className="mt-2 flex items-center text-xs text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2" />
                Processando...
              </div>
            )}
          </MetricCard>

          {/* Tasks Concluídas */}
          <MetricCard
            title="Concluídas"
            value={stats.completed_tasks}
            icon={CheckCircle2}
            iconColor="text-success-600"
            loading={loading}
            subtitle="Tasks finalizadas"
          />

          {/* Tasks Falhadas */}
          <MetricCard
            title="Falhadas"
            value={stats.failed_tasks}
            icon={XCircle}
            iconColor="text-error-600"
            loading={loading}
            subtitle="Tasks com erro"
          />

          {/* Taxa de Sucesso */}
          <MetricCard
            title="Taxa de Sucesso"
            value={`${stats.success_rate.toFixed(1)}%`}
            icon={stats.success_rate >= 80 ? TrendingUp : stats.success_rate >= 50 ? Activity : TrendingDown}
            iconColor={getSuccessRateColor(stats.success_rate)}
            loading={loading}
            trend={trends.successRate ? {
              value: trends.successRate.value,
              label: 'pontos percentuais',
              positive: trends.successRate.positive
            } : undefined}
            subtitle={
              stats.success_rate >= 80 
                ? 'Excelente desempenho' 
                : stats.success_rate >= 50 
                  ? 'Desempenho moderado' 
                  : 'Necessita atenção'
            }
          >
            <div className="mt-2 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  stats.success_rate >= 80 
                    ? 'bg-success-600' 
                    : stats.success_rate >= 50 
                      ? 'bg-warning-600' 
                      : 'bg-error-600'
                }`}
                style={{ width: `${Math.min(stats.success_rate, 100)}%` }}
              />
            </div>
          </MetricCard>

          {/* Tempo Médio de Execução */}
          <MetricCard
            title="Tempo Médio"
            value={formatExecutionTime(stats.average_execution_time)}
            icon={Clock}
            iconColor="text-purple-600"
            loading={loading}
            trend={trends.executionTime && trends.executionTime.value > 0 ? {
              value: trends.executionTime.value,
              label: 'variação',
              positive: trends.executionTime.positive
            } : undefined}
            subtitle="Por task executada"
          />

        </MetricsGrid>

        {/* Indicador de conexão e atualização */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex items-center justify-center"
        >
          <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isConnected 
                ? 'bg-green-500 animate-pulse' 
                : 'bg-yellow-500'
            }`} />
            {isConnected 
              ? 'WebSocket conectado - dados em tempo real'
              : 'Modo polling - atualização a cada 10 segundos'
            }
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default SystemMetrics