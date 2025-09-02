import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, 
  Server, 
  Clock, 
  Wifi, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  RotateCcw,
  Zap,
  Database,
  Globe
} from 'lucide-react'
import HealthMetricsFixed from '@/components/admin/HealthMetricsFixed'
import SystemGauges from '@/components/admin/SystemGauges'
import AdminLayout from '@/components/admin/AdminLayout'
import Head from 'next/head'
import toast from 'react-hot-toast'

interface SystemStatus {
  status: 'healthy' | 'warning' | 'critical' | 'offline'
  uptime: string
  lastCheck: Date
  version: string
}

interface EndpointStatus {
  endpoint: string
  status: 'healthy' | 'warning' | 'critical' | 'offline'
  responseTime: number
  lastCheck: Date
  statusCode?: number
  errorMessage?: string
}

interface AlertItem {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  resolved: boolean
}

const statusConfig = {
  healthy: {
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-100 dark:bg-green-900',
    label: 'Saudável',
    borderColor: 'border-green-500'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bg: 'bg-yellow-100 dark:bg-yellow-900',
    label: 'Atenção',
    borderColor: 'border-yellow-500'
  },
  critical: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-100 dark:bg-red-900',
    label: 'Crítico',
    borderColor: 'border-red-500'
  },
  offline: {
    icon: XCircle,
    color: 'text-gray-500',
    bg: 'bg-gray-100 dark:bg-gray-900',
    label: 'Offline',
    borderColor: 'border-gray-500'
  }
}

export default function HealthPage() {
  const [mounted, setMounted] = useState(false)
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    status: 'healthy',
    uptime: '2d 14h 32m',
    lastCheck: new Date(),
    version: '1.2.3'
  })

  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
    {
      endpoint: '/api/health',
      status: 'healthy',
      responseTime: 45,
      lastCheck: new Date(),
      statusCode: 200
    },
    {
      endpoint: '/api/tasks',
      status: 'healthy',
      responseTime: 120,
      lastCheck: new Date(),
      statusCode: 200
    },
    {
      endpoint: '/api/submit',
      status: 'warning',
      responseTime: 850,
      lastCheck: new Date(),
      statusCode: 200
    },
    {
      endpoint: '/api/clear',
      status: 'healthy',
      responseTime: 67,
      lastCheck: new Date(),
      statusCode: 200
    }
  ])

  const [systemMetrics, setSystemMetrics] = useState({
    cpu: 15.8,
    memory: 68.2,
    disk: 45.1,
    temperature: 62
  })

  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: '1',
      type: 'warning',
      title: 'Alta latência detectada',
      message: 'Endpoint /api/submit apresentando latência elevada (>800ms)',
      timestamp: new Date(Date.now() - 300000),
      resolved: false
    },
    {
      id: '2',
      type: 'info',
      title: 'Sistema reiniciado',
      message: 'Reinicialização programada completada com sucesso',
      timestamp: new Date(Date.now() - 7200000),
      resolved: true
    }
  ])

  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(5000)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Mount state to prevent hydration errors
  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        refreshHealthData()
      }, refreshInterval)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, refreshInterval])

  const refreshHealthData = async () => {
    try {
      // Simular atualização dos dados
      setSystemMetrics(prev => ({
        cpu: Math.max(5, Math.min(95, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(30, Math.min(90, prev.memory + (Math.random() - 0.5) * 5)),
        disk: prev.disk,
        temperature: Math.max(40, Math.min(85, prev.temperature + (Math.random() - 0.5) * 5))
      }))

      setEndpoints(prev => prev.map(endpoint => ({
        ...endpoint,
        responseTime: Math.max(20, Math.min(1000, endpoint.responseTime + (Math.random() - 0.5) * 100)),
        lastCheck: new Date(),
        status: endpoint.responseTime > 500 ? 'warning' : 'healthy'
      })))

      setSystemStatus(prev => ({
        ...prev,
        lastCheck: new Date()
      }))

    } catch (error) {
      console.error('Erro ao atualizar dados de saúde:', error)
    }
  }

  const handleRefreshToggle = () => {
    setAutoRefresh(!autoRefresh)
    toast.success(autoRefresh ? 'Auto-refresh pausado' : 'Auto-refresh ativado')
  }

  const handleManualRefresh = () => {
    refreshHealthData()
    toast.success('Dados atualizados')
  }

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ))
    toast.success('Alerta marcado como resolvido')
  }

  const getOverallStatus = (): 'healthy' | 'warning' | 'critical' | 'offline' => {
    const criticalMetrics = systemMetrics.cpu > 90 || systemMetrics.memory > 90 || systemMetrics.temperature > 80
    const warningMetrics = systemMetrics.cpu > 70 || systemMetrics.memory > 80 || systemMetrics.temperature > 70
    const criticalEndpoints = endpoints.some(ep => ep.status === 'critical')
    const warningEndpoints = endpoints.some(ep => ep.status === 'warning')
    
    if (criticalMetrics || criticalEndpoints) return 'critical'
    if (warningMetrics || warningEndpoints) return 'warning'
    return 'healthy'
  }

  const overallStatus = getOverallStatus()
  const StatusIcon = statusConfig[overallStatus].icon

  const formatUptime = (uptime: string) => {
    return uptime
  }

  const formatLastCheck = (date: Date) => {
    if (!mounted) return 'Carregando...'
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'agora mesmo'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`
    return `${Math.floor(diffInSeconds / 3600)}h atrás`
  }

  return (
    <AdminLayout>
      <Head>
        <title>Saúde do Sistema - Dashboard Admin</title>
      </Head>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                  <Activity className="w-8 h-8 mr-3 text-blue-500" />
                  Saúde do Sistema
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Monitoramento em tempo real da saúde e performance da API
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className={`w-2 h-2 rounded-full ${
                    autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {autoRefresh ? `Auto-refresh (${refreshInterval/1000}s)` : 'Manual'}
                  </span>
                </div>
                
                <button
                  onClick={handleRefreshToggle}
                  className={`p-2 rounded-lg transition-colors ${
                    autoRefresh 
                      ? 'bg-red-100 text-red-500 hover:bg-red-200' 
                      : 'bg-green-100 text-green-500 hover:bg-green-200'
                  }`}
                >
                  {autoRefresh ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={handleManualRefresh}
                  className="p-2 bg-blue-100 text-blue-500 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* System Overview Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            {/* Overall Status */}
            <div className={`
              bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-l-4
              ${statusConfig[overallStatus].borderColor}
            `}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status Geral</p>
                  <div className="flex items-center mt-2">
                    <StatusIcon className={`w-5 h-5 mr-2 ${statusConfig[overallStatus].color}`} />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {statusConfig[overallStatus].label}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${statusConfig[overallStatus].bg}`}>
                  <Server className={`w-6 h-6 ${statusConfig[overallStatus].color}`} />
                </div>
              </div>
            </div>

            {/* Uptime */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Uptime</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatUptime(systemStatus.uptime)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <Clock className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </div>

            {/* Response Time */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resp. Média</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {Math.round(endpoints.reduce((acc, ep) => acc + ep.responseTime, 0) / endpoints.length)}ms
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Zap className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </div>

            {/* Active Alerts */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Alertas Ativos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {alerts.filter(alert => !alert.resolved).length}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* System Gauges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Database className="w-5 h-5 mr-2 text-purple-500" />
                Métricas do Sistema
              </h3>
              <SystemGauges
                cpu={systemMetrics.cpu}
                memory={systemMetrics.memory}
                disk={systemMetrics.disk}
                temperature={systemMetrics.temperature}
              />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Endpoints Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-green-500" />
                  Status dos Endpoints
                </h3>
                <span className="text-sm text-gray-500">
                  Última verificação: {mounted ? formatLastCheck(systemStatus.lastCheck) : '...'}
                </span>
              </div>

              <div className="space-y-4">
                {endpoints.map((endpoint, index) => {
                  const EndpointIcon = statusConfig[endpoint.status].icon
                  
                  return (
                    <motion.div
                      key={endpoint.endpoint}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`
                        flex items-center justify-between p-4 border rounded-lg transition-all duration-200
                        ${statusConfig[endpoint.status].bg} ${statusConfig[endpoint.status].borderColor}
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <EndpointIcon className={`w-5 h-5 ${statusConfig[endpoint.status].color}`} />
                        <div>
                          <p className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                            {endpoint.endpoint}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Verificado {mounted ? formatLastCheck(endpoint.lastCheck) : '...'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm">
                        <div className="text-right">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {endpoint.responseTime}ms
                          </p>
                          <p className={`text-xs ${statusConfig[endpoint.status].color}`}>
                            {endpoint.statusCode ? `${endpoint.statusCode}` : 'N/A'}
                          </p>
                        </div>
                        
                        <div className={`
                          px-3 py-1 rounded-full text-xs font-medium
                          ${statusConfig[endpoint.status].bg} ${statusConfig[endpoint.status].color}
                        `}>
                          {statusConfig[endpoint.status].label}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                Alertas Recentes
              </h3>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum alerta ativo</p>
                  </div>
                ) : (
                  alerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        p-3 rounded-lg border-l-4 transition-all duration-200
                        ${alert.resolved ? 'opacity-60' : ''}
                        ${alert.type === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 
                          alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 
                          'border-blue-500 bg-blue-50 dark:bg-blue-900/20'}
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className={`
                            font-medium text-sm
                            ${alert.type === 'error' ? 'text-red-800 dark:text-red-200' :
                              alert.type === 'warning' ? 'text-yellow-800 dark:text-yellow-200' :
                              'text-blue-800 dark:text-blue-200'}
                          `}>
                            {alert.title}
                          </h4>
                          <p className={`
                            text-xs mt-1
                            ${alert.type === 'error' ? 'text-red-600 dark:text-red-300' :
                              alert.type === 'warning' ? 'text-yellow-600 dark:text-yellow-300' :
                              'text-blue-600 dark:text-blue-300'}
                          `}>
                            {alert.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {mounted ? alert.timestamp.toLocaleString('pt-BR') : '...'}
                          </p>
                        </div>
                        
                        {!alert.resolved && (
                          <button
                            onClick={() => resolveAlert(alert.id)}
                            className={`
                              ml-2 px-2 py-1 text-xs rounded transition-colors
                              ${alert.type === 'error' ? 'bg-red-500 hover:bg-red-600' :
                                alert.type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                'bg-blue-500 hover:bg-blue-600'}
                              text-white
                            `}
                          >
                            Resolver
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Health Metrics Charts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <HealthMetricsFixed refreshInterval={refreshInterval} />
          </motion.div>

          {/* System Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Server className="w-5 h-5 mr-2 text-gray-500" />
              Informações do Sistema
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Versão</p>
                <p className="font-mono text-gray-900 dark:text-white">{systemStatus.version}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Ambiente</p>
                <p className="font-mono text-gray-900 dark:text-white">Production</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Região</p>
                <p className="font-mono text-gray-900 dark:text-white">us-east-1</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  )
}