import { motion } from 'framer-motion'
import { BarChart3, Users, Settings, LucideIcon } from 'lucide-react'
import { memo } from 'react'

interface QuickAction {
  title: string
  description: string
  icon: LucideIcon
  color: string
  onClick?: () => void
}

const quickActionsData: QuickAction[] = [
  {
    title: 'Analytics',
    description: 'Visualize métricas e insights detalhados do sistema',
    icon: BarChart3,
    color: 'bg-blue-100 dark:bg-blue-900',
  },
  {
    title: 'Task Manager',
    description: 'Gerencie e monitore todas as tasks em execução',
    icon: Users,
    color: 'bg-green-100 dark:bg-green-900',
  },
  {
    title: 'Configurações',
    description: 'Configure o sistema e gerencie integrações',
    icon: Settings,
    color: 'bg-purple-100 dark:bg-purple-900',
  },
]

const QuickActions = memo(() => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.1 } }
      }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
    >
      {quickActionsData.map((action) => {
        const Icon = action.icon
        return (
          <motion.div key={action.title} variants={cardVariants}>
            <div 
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer group"
              onClick={action.onClick}
            >
              <div className="flex items-center mb-4">
                <div className={`p-2 ${action.color} rounded-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">{action.title}</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {action.description}
              </p>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
})

QuickActions.displayName = 'QuickActions'

export default QuickActions