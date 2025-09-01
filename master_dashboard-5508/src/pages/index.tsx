import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  BarChart3, 
  Settings, 
  Users, 
  Zap, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Server
} from 'lucide-react'

interface TaskMetrics {
  total: number
  completed: number
  running: number
  failed: number
}

interface SystemHealth {
  cpu: number
  memory: number
  uptime: string
  status: 'healthy' | 'warning' | 'critical'
}

export default function DashboardMaster() {
  const [taskMetrics, setTaskMetrics] = useState<TaskMetrics>({
    total: 0,
    completed: 0,
    running: 0,
    failed: 0
  })
  
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    cpu: 15,
    memory: 68,
    uptime: '2d 14h 32m',
    status: 'healthy'
  })

  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Simular carregamento de dados
    const loadMetrics = async () => {
      try {
        // Aqui conectaria com a API real
        setTaskMetrics({
          total: 127,
          completed: 98,
          running: 4,
          failed: 2
        })
      } catch (error) {
        console.error('Erro ao carregar métricas:', error)
      }
    }

    loadMetrics()
    const interval = setInterval(loadMetrics, 30000) // Atualizar a cada 30s
    
    return () => clearInterval(interval)
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const MetricCard = ({ title, value, icon: Icon, color, change }: any) => (
    <motion.div
      variants={cardVariants}
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {change && (
            <p className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              {change > 0 ? '+' : ''}{change}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
                    Dashboard Master ULTRATHINK
                  </h1>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {darkMode ? '🌞' : '🌙'}
              </button>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${systemHealth.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Sistema Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          className="mb-8"
        >
          <motion.h2 
            variants={cardVariants}
            className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
          >
            Hub Central Premium
          </motion.h2>
          <motion.p 
            variants={cardVariants}
            className="text-gray-600 dark:text-gray-400"
          >
            Centralize e gerencie todo o ecossistema Claude CTO em uma interface unificada
          </motion.p>
        </motion.div>

        {/* Metrics Cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <MetricCard
            title="Total de Tasks"
            value={taskMetrics.total}
            icon={Activity}
            color="bg-gradient-to-r from-blue-500 to-blue-600"
            change={12}
          />
          <MetricCard
            title="Completadas"
            value={taskMetrics.completed}
            icon={CheckCircle}
            color="bg-gradient-to-r from-green-500 to-green-600"
            change={8}
          />
          <MetricCard
            title="Em Execução"
            value={taskMetrics.running}
            icon={Clock}
            color="bg-gradient-to-r from-yellow-500 to-orange-500"
          />
          <MetricCard
            title="Falhas"
            value={taskMetrics.failed}
            icon={AlertCircle}
            color="bg-gradient-to-r from-red-500 to-red-600"
            change={-25}
          />
        </motion.div>

        {/* System Health */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Server className="w-5 h-5 mr-2" />
              Saúde do Sistema
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              systemHealth.status === 'healthy' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}>
              {systemHealth.status === 'healthy' ? 'Saudável' : 'Atenção'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">CPU</p>
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                  <motion.div 
                    className="bg-blue-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${systemHealth.cpu}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{systemHealth.cpu}%</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Memória</p>
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                  <motion.div 
                    className="bg-green-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${systemHealth.memory}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{systemHealth.memory}%</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Uptime</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{systemHealth.uptime}</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          <motion.div variants={cardVariants}>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer group">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                  <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">Analytics</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Visualize métricas e insights detalhados do sistema
              </p>
            </div>
          </motion.div>

          <motion.div variants={cardVariants}>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer group">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                  <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">Task Manager</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Gerencie e monitore todas as tasks em execução
              </p>
            </div>
          </motion.div>

          <motion.div variants={cardVariants}>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer group">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                  <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">Configurações</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Configure o sistema e gerencie integrações
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white text-center"
        >
          <h3 className="text-xl font-bold mb-2">🚀 Dashboard Master ULTRATHINK</h3>
          <p className="text-blue-100">
            Hub Central Premium - Consolidando o poder do ecossistema Claude CTO
          </p>
          <div className="mt-4 flex justify-center space-x-4 text-sm">
            <span>📊 Porta 5508</span>
            <span>⚡ Next.js 14</span>
            <span>🎯 TypeScript</span>
            <span>🎨 Tailwind CSS</span>
          </div>
        </motion.div>
      </main>
    </div>
  )
}