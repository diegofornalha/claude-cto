import { useState, useEffect, lazy, Suspense, startTransition, useDeferredValue } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  Zap, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

// Lazy loading dos componentes
const MetricCard = lazy(() => import('@/components/MetricCard'))
const SystemHealth = lazy(() => import('@/components/SystemHealth'))
const QuickActions = lazy(() => import('@/components/QuickActions'))

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

// Componentes de fallback para erros de loading
const LoadingCardFallback = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </div>
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
    </div>
  </div>
)

const SystemHealthFallback = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
)

const QuickActionsFallback = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="ml-3 h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </div>
    ))}
  </div>
)

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
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Usar useDeferredValue para adiar atualizações não críticas
  const deferredTaskMetrics = useDeferredValue(taskMetrics)

  // Effect para verificar hidratação
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return // Só executar após hidratação completa
    
    // Simular carregamento de dados
    const loadMetrics = async () => {
      try {
        // Usar startTransition para marcar atualizações não urgentes
        startTransition(() => {
          setTaskMetrics({
            total: 127,
            completed: 98,
            running: 4,
            failed: 2
          })
        })
      } catch (error) {
        console.error('Erro ao carregar métricas:', error)
      }
    }

    // Aguardar um pouco antes de iniciar as atualizações
    const timeoutId = setTimeout(() => {
      loadMetrics()
      const interval = setInterval(loadMetrics, 30000) // Atualizar a cada 30s
      
      return () => clearInterval(interval)
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [isHydrated])

  const toggleDarkMode = () => {
    startTransition(() => {
      setDarkMode(!darkMode)
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark')
      }
    })
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const LoadingCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-pulse"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
      </div>
    </div>
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
          <Suspense fallback={<LoadingCard />}>
            <MetricCard
              title="Total de Tasks"
              value={deferredTaskMetrics.total}
              icon={Activity}
              color="bg-gradient-to-r from-blue-500 to-blue-600"
              change={12}
            />
          </Suspense>
          <Suspense fallback={<LoadingCard />}>
            <MetricCard
              title="Completadas"
              value={deferredTaskMetrics.completed}
              icon={CheckCircle}
              color="bg-gradient-to-r from-green-500 to-green-600"
              change={8}
            />
          </Suspense>
          <Suspense fallback={<LoadingCard />}>
            <MetricCard
              title="Em Execução"
              value={deferredTaskMetrics.running}
              icon={Clock}
              color="bg-gradient-to-r from-yellow-500 to-orange-500"
            />
          </Suspense>
          <Suspense fallback={<LoadingCard />}>
            <MetricCard
              title="Falhas"
              value={deferredTaskMetrics.failed}
              icon={AlertCircle}
              color="bg-gradient-to-r from-red-500 to-red-600"
              change={-25}
            />
          </Suspense>
        </motion.div>

        {/* System Health */}
        <Suspense fallback={
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-8 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        }>
          <SystemHealth data={systemHealth} />
        </Suspense>

        {/* Quick Actions */}
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="ml-3 h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        }>
          <QuickActions />
        </Suspense>

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