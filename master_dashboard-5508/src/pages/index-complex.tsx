import { useState, useEffect, useMemo, startTransition, useDeferredValue } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  Zap, 
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  BarChart3,
  Users
} from 'lucide-react'

// Design System Components
import {
  PageLayout,
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardBody,
  MetricsGrid,
  ContentGrid,
  MetricCard,
  SystemHealthCard,
  Skeleton,
  SkeletonCard,
  SkeletonMetricCard
} from '@/components/ui'

// Types
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

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  href: string
  color: string
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
}

export default function DashboardHome() {
  // Estado
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

  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Performance: usar useDeferredValue para atualizações não críticas
  const deferredTaskMetrics = useDeferredValue(taskMetrics)
  
  // Quick Actions usando useMemo para performance
  const quickActions = useMemo<QuickAction[]>(() => [
    {
      id: 'create-task',
      title: 'Criar Nova Task',
      description: 'Inicie um novo processo de automação',
      icon: Activity,
      href: '/tasks/create',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    {
      id: 'view-analytics',
      title: 'Analytics',
      description: 'Visualize métricas e relatórios detalhados',
      icon: BarChart3,
      href: '/analytics',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600'
    },
    {
      id: 'manage-users',
      title: 'Gerenciar Usuários',
      description: 'Administre permissões e acessos',
      icon: Users,
      href: '/admin/users',
      color: 'bg-gradient-to-r from-green-500 to-green-600'
    },
    {
      id: 'system-settings',
      title: 'Configurações',
      description: 'Ajuste configurações do sistema',
      icon: Settings,
      href: '/settings',
      color: 'bg-gradient-to-r from-gray-500 to-gray-600'
    }
  ], [])

  // Effect para hidratação
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Effect para carregar dados
  useEffect(() => {
    if (!isHydrated) return

    const loadData = async () => {
      try {
        // Simular loading inicial
        setIsLoading(true)
        
        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Usar startTransition para atualizações não urgentes
        startTransition(() => {
          setTaskMetrics({
            total: 127,
            completed: 98,
            running: 4,
            failed: 2
          })
          
          setSystemHealth({
            cpu: Math.floor(Math.random() * 40) + 10,
            memory: Math.floor(Math.random() * 30) + 50,
            uptime: '2d 14h 32m',
            status: 'healthy'
          })
          
          setIsLoading(false)
        })
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        setIsLoading(false)
      }
    }

    loadData()

    // Configurar atualizações em tempo real
    const interval = setInterval(loadData, 30000) // Atualizar a cada 30s
    return () => clearInterval(interval)
  }, [isHydrated])

  // Actions para o header
  const headerActions = (
    <div className="flex items-center space-x-3">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200"
        onClick={() => window.location.href = '/tasks/create'}
      >
        Nova Task
      </motion.button>
      
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${
          systemHealth.status === 'healthy' ? 'bg-success-500' : 
          systemHealth.status === 'warning' ? 'bg-warning-500' : 
          'bg-error-500'
        }`}></div>
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          Sistema Online
        </span>
      </div>
    </div>
  )

  return (
    <PageLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Page Header */}
        <motion.div variants={itemVariants}>
          <PageHeader
            title="Hub Central Premium"
            description="Centralize e gerencie todo o ecossistema Claude CTO em uma interface unificada"
            subtitle="Dashboard Master ULTRATHINK"
            actions={headerActions}
            size="lg"
          />
        </motion.div>

        {/* Metrics Cards */}
        <motion.div variants={itemVariants}>
          <MetricsGrid className="mb-8">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 4 }, (_, index) => (
                <SkeletonMetricCard key={index} />
              ))
            ) : (
              <>
                <MetricCard
                  title="Total de Tasks"
                  value={deferredTaskMetrics.total.toLocaleString()}
                  icon={Activity}
                  iconColor="text-primary-600"
                  trend={{
                    value: 12,
                    label: "este mês",
                    positive: true
                  }}
                />
                
                <MetricCard
                  title="Completadas"
                  value={deferredTaskMetrics.completed.toLocaleString()}
                  icon={CheckCircle}
                  iconColor="text-success-600"
                  trend={{
                    value: 8,
                    label: "vs semana anterior",
                    positive: true
                  }}
                />
                
                <MetricCard
                  title="Em Execução"
                  value={deferredTaskMetrics.running.toLocaleString()}
                  icon={Clock}
                  iconColor="text-warning-600"
                  subtitle="Processando..."
                />
                
                <MetricCard
                  title="Falhas"
                  value={deferredTaskMetrics.failed.toLocaleString()}
                  icon={AlertCircle}
                  iconColor="text-error-600"
                  trend={{
                    value: 25,
                    label: "redução",
                    positive: true
                  }}
                />
              </>
            )}
          </MetricsGrid>
        </motion.div>

        {/* System Health */}
        <motion.div variants={itemVariants}>
          <SystemHealthCard
            data={systemHealth}
            loading={isLoading}
            className="mb-8"
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">
            Ações Rápidas
          </h2>
          <ContentGrid className="mb-8">
            {isLoading ? (
              Array.from({ length: 4 }, (_, index) => (
                <SkeletonCard key={index} />
              ))
            ) : (
              quickActions.map((action) => (
                <motion.div
                  key={action.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card 
                    hover 
                    interactive
                    onClick={() => window.location.href = action.href}
                  >
                    <CardContent>
                      <div className="flex items-center mb-4">
                        <div className={`p-3 rounded-lg ${action.color}`}>
                          <action.icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="ml-3 text-lg font-semibold text-neutral-900 dark:text-white">
                          {action.title}
                        </h3>
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        {action.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </ContentGrid>
        </motion.div>

        {/* Status Banner */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="bg-gradient-to-r from-primary-500 to-secondary-600 border-0">
            <CardContent className="text-center text-white">
              <h3 className="text-2xl font-bold mb-3">
                🚀 Dashboard Master ULTRATHINK
              </h3>
              <p className="text-primary-100 mb-4">
                Hub Central Premium - Consolidando o poder do ecossistema Claude CTO
              </p>
              <div className="flex justify-center items-center space-x-6 text-sm">
                <span className="flex items-center">
                  📊 <span className="ml-1">Porta 5508</span>
                </span>
                <span className="flex items-center">
                  ⚡ <span className="ml-1">Next.js 14</span>
                </span>
                <span className="flex items-center">
                  🎯 <span className="ml-1">TypeScript</span>
                </span>
                <span className="flex items-center">
                  🎨 <span className="ml-1">Tailwind CSS</span>
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </PageLayout>
  )
}