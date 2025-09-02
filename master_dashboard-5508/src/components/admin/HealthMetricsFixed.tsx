import { motion } from 'framer-motion'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Cpu, HardDrive, Wifi, Clock, TrendingUp, AlertTriangle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface MetricData {
  timestamp: string
  cpu: number
  memory: number
  network: number
}

interface EndpointMetric {
  endpoint: string
  requests: number
  avgResponseTime: number
  errorRate: number
}

interface HealthMetricsProps {
  refreshInterval?: number
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']

// Helper para formatação consistente de números
const formatNumber = (num: number, mounted: boolean): string => {
  if (!mounted) return num.toString()
  return num.toLocaleString('en-US')
}

const formatDecimal = (num: number, decimals: number, mounted: boolean): string => {
  if (!mounted) return num.toString()
  return num.toFixed(decimals)
}

export default function HealthMetricsFixed({ refreshInterval = 5000 }: HealthMetricsProps) {
  const [mounted, setMounted] = useState(false)
  const [metricsData, setMetricsData] = useState<MetricData[]>([])
  const [endpoints, setEndpoints] = useState<EndpointMetric[]>([
    { endpoint: '/api/v1/tasks', requests: 1247, avgResponseTime: 145, errorRate: 0.2 },
    { endpoint: '/api/v1/orchestrations', requests: 523, avgResponseTime: 89, errorRate: 0.1 },
    { endpoint: '/api/v1/tasks/clear', requests: 143, avgResponseTime: 98, errorRate: 0.5 },
    { endpoint: '/health', requests: 2891, avgResponseTime: 12, errorRate: 0.0 },
  ])
  const [systemStats, setSystemStats] = useState({
    uptime: '2d 14h 32m',
    totalRequests: 5137,
    avgResponseTime: 142,
    errorRate: 0.4,
    activeConnections: 23
  })

  // Mount effect
  useEffect(() => {
    setMounted(true)
  }, [])

  // Simular dados em tempo real
  useEffect(() => {
    if (!mounted) return

    const generateMetrics = () => {
      const now = new Date()
      const newMetric: MetricData = {
        timestamp: now.toLocaleTimeString('en-US'),
        cpu: Math.random() * 100,
        memory: 60 + Math.random() * 30,
        network: Math.random() * 50
      }

      setMetricsData(prev => {
        const updated = [...prev, newMetric]
        return updated.slice(-20) // Manter apenas os últimos 20 pontos
      })

      // Atualizar estatísticas
      setSystemStats(prev => ({
        ...prev,
        totalRequests: prev.totalRequests + Math.floor(Math.random() * 5),
        avgResponseTime: 100 + Math.random() * 100,
        errorRate: Math.random() * 2,
        activeConnections: 15 + Math.floor(Math.random() * 20)
      }))
    }

    // Gerar dados iniciais
    const initialData: MetricData[] = []
    for (let i = 19; i >= 0; i--) {
      const time = new Date(Date.now() - i * refreshInterval)
      initialData.push({
        timestamp: time.toLocaleTimeString('en-US'),
        cpu: Math.random() * 100,
        memory: 60 + Math.random() * 30,
        network: Math.random() * 50
      })
    }
    setMetricsData(initialData)

    const interval = setInterval(generateMetrics, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval, mounted])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {formatDecimal(entry.value, 1, mounted)}%
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (!mounted) {
    // Renderização inicial sem formatação para evitar problemas de hidratação
    return (
      <div className="space-y-6">
        <div className="text-center">Carregando métricas...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Título da seção */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center mb-4 sm:mb-0">
          <Cpu className="w-6 h-6 mr-2" />
          Métricas do Sistema
        </h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Atualizando a cada {refreshInterval / 1000}s
          </span>
        </div>
      </div>

      {/* Gráfico de Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Performance em Tempo Real
        </h3>
        
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metricsData}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorNetwork" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis 
                dataKey="timestamp" 
                stroke="#9CA3AF"
                fontSize={12}
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tick={{ fontSize: 10 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="cpu"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorCpu)"
                name="CPU"
              />
              <Area
                type="monotone"
                dataKey="memory"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorMemory)"
                name="Memória"
              />
              <Area
                type="monotone"
                dataKey="network"
                stroke="#F59E0B"
                fillOpacity={1}
                fill="url(#colorNetwork)"
                name="Rede"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-xs text-gray-600 dark:text-gray-400">CPU</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Memória</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Rede</span>
          </div>
        </div>
      </motion.div>

      {/* Estatísticas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg text-center">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 bg-green-100 dark:bg-green-900 rounded-xl">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {formatNumber(systemStats.totalRequests, mounted)}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Requests</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg text-center">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
            <Wifi className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {formatNumber(systemStats.activeConnections, mounted)}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Conexões Ativas</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg text-center">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 bg-yellow-100 dark:bg-yellow-900 rounded-xl">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {formatDecimal(systemStats.avgResponseTime, 1, mounted)}ms
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Tempo Médio</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg text-center">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 bg-red-100 dark:bg-red-900 rounded-xl">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {formatDecimal(systemStats.errorRate, 2, mounted)}%
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Taxa de Erro</div>
        </div>
      </motion.div>

      {/* Tabela de Endpoints - Responsiva */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg overflow-x-auto"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Performance por Endpoint
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="pb-3">Endpoint</th>
                <th className="pb-3 text-right">Requests</th>
                <th className="pb-3 text-right">Tempo Médio</th>
                <th className="pb-3 text-right">Taxa de Erro</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {endpoints.map((endpoint) => (
                <tr key={endpoint.endpoint} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="py-3">
                    <span className="font-mono text-sm text-gray-900 dark:text-white">
                      {endpoint.endpoint}
                    </span>
                  </td>
                  <td className="py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                    {formatNumber(endpoint.requests, mounted)}
                  </td>
                  <td className="py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                    {formatDecimal(endpoint.avgResponseTime, 0, mounted)}ms
                  </td>
                  <td className="py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                    {formatDecimal(endpoint.errorRate, 1, mounted)}%
                  </td>
                  <td className="py-3 text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      endpoint.errorRate > 1 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      endpoint.avgResponseTime > 200 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {endpoint.errorRate > 1 ? 'Crítico' :
                       endpoint.avgResponseTime > 200 ? 'Lento' : 'OK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}