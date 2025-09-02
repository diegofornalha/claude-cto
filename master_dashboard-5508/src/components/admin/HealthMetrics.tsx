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

export default function HealthMetrics({ refreshInterval = 5000 }: HealthMetricsProps) {
  const [metricsData, setMetricsData] = useState<MetricData[]>([])
  const [endpoints, setEndpoints] = useState<EndpointMetric[]>([
    { endpoint: '/api/tasks', requests: 1247, avgResponseTime: 145, errorRate: 0.2 },
    { endpoint: '/api/health', requests: 2891, avgResponseTime: 87, errorRate: 0.0 },
    { endpoint: '/api/submit', requests: 856, avgResponseTime: 234, errorRate: 1.1 },
    { endpoint: '/api/clear', requests: 143, avgResponseTime: 98, errorRate: 0.5 },
  ])
  const [systemStats, setSystemStats] = useState({
    uptime: '2d 14h 32m',
    totalRequests: 5137,
    avgResponseTime: 142,
    errorRate: 0.4
  })

  // Simular dados em tempo real
  useEffect(() => {
    const generateMetrics = () => {
      const now = new Date()
      const newMetric: MetricData = {
        timestamp: now.toLocaleTimeString(),
        cpu: Math.random() * 100,
        memory: 60 + Math.random() * 30,
        network: Math.random() * 50
      }
      
      setMetricsData(prev => {
        const updated = [...prev, newMetric]
        return updated.slice(-20) // Manter apenas os últimos 20 pontos
      })
    }

    generateMetrics()
    const interval = setInterval(generateMetrics, refreshInterval)
    
    return () => clearInterval(interval)
  }, [refreshInterval])

  const cpuData = metricsData.map(item => ({
    name: item.timestamp,
    cpu: item.cpu,
    memory: item.memory
  }))

  const networkData = [
    { name: 'Entrada', value: 1247, color: COLORS[0] },
    { name: 'Saída', value: 856, color: COLORS[1] },
    { name: 'Erro', value: 23, color: COLORS[3] }
  ]

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* CPU e Memória */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Cpu className="w-5 h-5 mr-2 text-blue-500" />
            CPU & Memória
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>CPU</span>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Memória</span>
          </div>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cpuData}>
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Area
                type="monotone"
                dataKey="cpu"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#cpuGradient)"
              />
              <Area
                type="monotone"
                dataKey="memory"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#memoryGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Estatísticas dos Endpoints */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Wifi className="w-5 h-5 mr-2 text-green-500" />
            Endpoints API
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500">Ativo</span>
          </div>
        </div>

        <div className="space-y-4">
          {endpoints.map((endpoint, index) => (
            <motion.div
              key={endpoint.endpoint}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                    {endpoint.endpoint}
                  </span>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {endpoint.requests} req
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {endpoint.avgResponseTime}ms
                    </span>
                    <span className={`flex items-center ${
                      endpoint.errorRate > 1 ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {endpoint.errorRate > 1 && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {endpoint.errorRate}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Estatísticas Gerais */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {systemStats.uptime}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-green-100 dark:bg-green-900 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {systemStats.totalRequests.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Requests</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-yellow-100 dark:bg-yellow-900 rounded-xl">
              <HardDrive className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {systemStats.avgResponseTime}ms
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Response</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-red-100 dark:bg-red-900 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {systemStats.errorRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Error Rate</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}