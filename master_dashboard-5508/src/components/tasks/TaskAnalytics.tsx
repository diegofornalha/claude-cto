/**
 * Componente TaskAnalytics - Dashboard de analytics com gráficos e métricas
 */

import React, { useMemo } from 'react'
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  PauseIcon,
  CpuChipIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

import { TaskAnalyticsData } from '@/types/task'

interface TaskAnalyticsProps {
  data: TaskAnalyticsData
}

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
  trend?: {
    value: number
    direction: 'up' | 'down' | 'flat'
  }
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color,
  trend 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    gray: 'bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800'
  }

  const iconColorClasses = {
    blue: 'text-blue-500 dark:text-blue-400',
    green: 'text-green-500 dark:text-green-400',
    yellow: 'text-yellow-500 dark:text-yellow-400',
    red: 'text-red-500 dark:text-red-400',
    purple: 'text-purple-500 dark:text-purple-400',
    gray: 'text-slate-500 dark:text-slate-400'
  }

  const getTrendIcon = () => {
    if (!trend) return null
    
    switch (trend.direction) {
      case 'up':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
      case 'down':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
      case 'flat':
        return <MinusIcon className="w-4 h-4 text-slate-400" />
      default:
        return null
    }
  }

  return (
    <div className={`p-6 rounded-xl border transition-all hover:shadow-md ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-white dark:bg-slate-800 ${iconColorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        
        {trend && (
          <div className="flex items-center space-x-1 text-sm">
            {getTrendIcon()}
            <span className={`font-medium ${
              trend.direction === 'up' ? 'text-green-600 dark:text-green-400' :
              trend.direction === 'down' ? 'text-red-600 dark:text-red-400' :
              'text-slate-500 dark:text-slate-400'
            }`}>
              {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
          {value}
        </h3>
        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
          {title}
        </h4>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

const SimpleBarChart: React.FC<{
  data: Array<{ label: string; value: number; color: string }>
  title: string
}> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(item => item.value), 1)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
        <ChartBarIcon className="w-5 h-5 mr-2" />
        {title}
      </h3>
      
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {item.label}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {item.value}
              </span>
            </div>
            
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${item.color}`}
                style={{
                  width: `${(item.value / maxValue) * 100}%`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const SimplePieChart: React.FC<{
  data: Array<{ label: string; value: number; color: string }>
  title: string
}> = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  if (total === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {title}
        </h3>
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2" />
          <p>Nenhum dado disponível</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        {title}
      </h3>
      
      <div className="flex items-center justify-between">
        {/* Simple donut visualization */}
        <div className="relative w-24 h-24 mx-auto">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-200 dark:text-slate-700"
            />
            
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100
              const dashArray = 2 * Math.PI * 40
              const dashOffset = dashArray - (dashArray * percentage) / 100
              const previousPercentage = data.slice(0, index).reduce((sum, prevItem) => sum + (prevItem.value / total) * 100, 0)
              const rotation = (previousPercentage * 360) / 100
              
              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  strokeWidth="8"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  className={item.color.replace('bg-', 'text-')}
                  style={{
                    transformOrigin: '50px 50px',
                    transform: `rotate(${rotation}deg)`
                  }}
                />
              )
            })}
          </svg>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {total}
            </span>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex-1 ml-6 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {item.label}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {item.value}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {((item.value / total) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const TrendChart: React.FC<{
  data: TaskAnalyticsData['trendsData']
  title: string
}> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(item => item.count), 1)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        {title}
      </h3>
      
      <div className="flex items-end space-x-2 h-32">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-blue-500 dark:bg-blue-400 rounded-t-sm transition-all duration-500 hover:bg-blue-600 dark:hover:bg-blue-300"
              style={{
                height: `${(item.count / maxValue) * 100}%`,
                minHeight: '4px'
              }}
              title={`${item.date}: ${item.count} tarefas`}
            />
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
              {item.date}
            </div>
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {item.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const TaskAnalytics: React.FC<TaskAnalyticsProps> = ({ data }) => {
  // Preparar dados dos gráficos
  const statusChartData = useMemo(() => {
    return Object.entries(data.statusCounts).map(([status, count]) => {
      const statusConfig = {
        pending: { label: 'Pendente', color: 'bg-yellow-500' },
        running: { label: 'Executando', color: 'bg-blue-500' },
        completed: { label: 'Concluída', color: 'bg-green-500' },
        failed: { label: 'Falhada', color: 'bg-red-500' }
      }
      
      const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-slate-500' }
      
      return {
        label: config.label,
        value: count,
        color: config.color
      }
    })
  }, [data.statusCounts])

  const modelChartData = useMemo(() => {
    return Object.entries(data.modelDistribution).map(([model, count]) => {
      const modelConfig = {
        haiku: { label: 'Haiku', color: 'bg-purple-500' },
        sonnet: { label: 'Sonnet', color: 'bg-blue-500' },
        opus: { label: 'Opus', color: 'bg-orange-500' }
      }
      
      const config = modelConfig[model as keyof typeof modelConfig] || { label: model, color: 'bg-slate-500' }
      
      return {
        label: config.label,
        value: count,
        color: config.color
      }
    })
  }, [data.modelDistribution])

  const complexityChartData = useMemo(() => {
    return Object.entries(data.complexityDistribution).map(([complexity, count]) => {
      const complexityConfig = {
        'Simples': { color: 'bg-green-500' },
        'Moderada': { color: 'bg-yellow-500' },
        'Complexa': { color: 'bg-orange-500' },
        'Muito Complexa': { color: 'bg-red-500' }
      }
      
      const config = complexityConfig[complexity as keyof typeof complexityConfig] || { color: 'bg-slate-500' }
      
      return {
        label: complexity,
        value: count,
        color: config.color
      }
    })
  }, [data.complexityDistribution])

  if (data.totalTasks === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <ChartBarIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            📊 Nenhuma Tarefa para Análise
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Crie algumas tarefas para ver as métricas de performance aqui.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
          <ChartBarIcon className="w-6 h-6 mr-2" />
          📊 Analytics Dashboard
        </h2>
        
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Última atualização: {new Date().toLocaleTimeString('pt-BR')}
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Tarefas"
          value={data.totalTasks}
          subtitle="Todas as tarefas"
          icon={ChartBarIcon}
          color="blue"
          trend={{ value: 12, direction: 'up' }}
        />
        
        <MetricCard
          title="Taxa de Sucesso"
          value={`${data.successRate}%`}
          subtitle="Tarefas concluídas"
          icon={CheckCircleIcon}
          color="green"
          trend={{ value: 5, direction: 'up' }}
        />
        
        <MetricCard
          title="Tempo Médio"
          value={`${data.avgExecutionTime}min`}
          subtitle="Duração estimada"
          icon={ClockIcon}
          color="yellow"
          trend={{ value: 2, direction: 'down' }}
        />
        
        <MetricCard
          title="Em Execução"
          value={data.statusCounts.running || 0}
          subtitle="Tarefas ativas"
          icon={PlayIcon}
          color="purple"
          trend={{ value: 0, direction: 'flat' }}
        />
      </div>

      {/* Métricas de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Taxa Conclusão"
          value={`${data.performanceMetrics.completionRate}%`}
          icon={CheckCircleIcon}
          color="green"
        />
        
        <MetricCard
          title="Tempo Médio"
          value={`${data.performanceMetrics.averageTimeToComplete}min`}
          icon={ClockIcon}
          color="blue"
        />
        
        <MetricCard
          title="Taxa de Falha"
          value={`${data.performanceMetrics.failureRate}%`}
          icon={XCircleIcon}
          color="red"
        />
        
        <MetricCard
          title="Na Fila"
          value={data.performanceMetrics.queuedTasks}
          icon={PauseIcon}
          color="gray"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimplePieChart
          data={statusChartData}
          title="📊 Distribuição por Status"
        />
        
        <SimpleBarChart
          data={modelChartData}
          title="🤖 Distribuição por Modelo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart
          data={complexityChartData}
          title="🎯 Distribuição por Complexidade"
        />
        
        <TrendChart
          data={data.trendsData}
          title="📈 Tendência de Criação (7 dias)"
        />
      </div>
    </div>
  )
}

export default TaskAnalytics