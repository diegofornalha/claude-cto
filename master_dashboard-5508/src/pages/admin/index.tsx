import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { 
  Shield, 
  Activity, 
  Trash2, 
  Database, 
  Server,
  Users,
  Settings,
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Lock,
  Key,
  FileText,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react'

interface SystemStats {
  totalTasks: number
  activeTasks: number
  completedToday: number
  failedToday: number
  systemUptime: string
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalTasks: 0,
    activeTasks: 0,
    completedToday: 0,
    failedToday: 0,
    systemUptime: '2d 14h 32m',
    cpuUsage: 15,
    memoryUsage: 68,
    diskUsage: 45
  })

  const adminSections = [
    {
      title: 'Saúde do Sistema',
      description: 'Monitoramento em tempo real da API e infraestrutura',
      icon: Activity,
      href: '/admin/health',
      color: 'blue',
      status: 'online',
      metrics: {
        label: 'Tempo de Resposta',
        value: '45ms'
      }
    },
    {
      title: 'Limpeza de Tarefas',
      description: 'Gerencie e limpe tarefas completadas ou falhadas',
      icon: Trash2,
      href: '/admin/clear-tasks',
      color: 'green',
      status: 'ready',
      metrics: {
        label: 'Tarefas para Limpar',
        value: '0'
      }
    },
    {
      title: 'Deletar Tarefa',
      description: 'Busque e remova tarefas específicas com segurança',
      icon: Database,
      href: '/admin/delete-task',
      color: 'red',
      status: 'ready',
      metrics: {
        label: 'Total de Tarefas',
        value: '0'
      }
    }
  ]

  const systemMetrics = [
    {
      label: 'CPU',
      value: stats.cpuUsage,
      max: 100,
      icon: Cpu,
      color: 'blue',
      unit: '%'
    },
    {
      label: 'Memória',
      value: stats.memoryUsage,
      max: 100,
      icon: HardDrive,
      color: 'green',
      unit: '%'
    },
    {
      label: 'Disco',
      value: stats.diskUsage,
      max: 100,
      icon: Server,
      color: 'purple',
      unit: '%'
    },
    {
      label: 'Rede',
      value: 98,
      max: 100,
      icon: Wifi,
      color: 'yellow',
      unit: '%'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
      red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
    }
    return colors[color] || colors.blue
  }

  const getProgressColor = (value: number) => {
    if (value < 50) return 'bg-green-500'
    if (value < 75) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <>
      <Head>
        <title>Administração - Claude CTO Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="ml-4">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Painel Administrativo
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Controle total do sistema Claude CTO
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  Acesso Restrito
                </span>
              </div>
            </div>
          </div>

          {/* Alertas do Sistema */}
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  Sistema Operacional
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Todos os serviços estão funcionando normalmente
                </p>
              </div>
              <span className="text-xs text-green-600 dark:text-green-400">
                Última verificação: há 30 segundos
              </span>
            </div>
          </div>

          {/* Estatísticas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total de Tarefas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTasks}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Desde o início</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Ativas Agora</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeTasks}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Em execução</p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Concluídas Hoje</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedToday}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Últimas 24h</p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.systemUptime}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tempo ativo</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Seções Administrativas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {adminSections.map((section) => {
              const Icon = section.icon
              return (
                <Link key={section.href} href={section.href}>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer group">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${getColorClasses(section.color)}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      {section.status === 'online' && (
                        <span className="flex items-center text-xs font-medium text-green-600 dark:text-green-400">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                          Online
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {section.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {section.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium">{section.metrics.label}:</span>
                        <span className="ml-1 font-bold">{section.metrics.value}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                        <span>Acessar</span>
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Métricas do Sistema */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <Server className="w-6 h-6 mr-2" />
              Métricas do Sistema
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {systemMetrics.map((metric) => {
                const Icon = metric.icon
                return (
                  <div key={metric.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <Icon className="w-4 h-4 mr-1" />
                        {metric.label}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {metric.value}{metric.unit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(metric.value)}`}
                        style={{ width: `${(metric.value / metric.max) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-900 dark:to-black rounded-xl p-6 text-white">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Settings className="w-6 h-6 mr-2" />
              Ações Rápidas de Administração
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Exportar Logs</span>
              </button>
              
              <button className="p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center space-x-2">
                <Key className="w-5 h-5" />
                <span>Rotacionar Chaves</span>
              </button>
              
              <button className="p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Gerenciar Usuários</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminDashboard