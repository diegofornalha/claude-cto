import { motion } from 'framer-motion'
import { Activity, Trash2, Database, Settings, LucideIcon } from 'lucide-react'
import { memo } from 'react'
import Link from 'next/link'

interface QuickAction {
  title: string
  description: string
  icon: LucideIcon
  color: string
  href: string
  isAdmin?: boolean
}

const quickActionsData: QuickAction[] = [
  {
    title: 'Saúde do Sistema',
    description: 'Monitoramento em tempo real da API e infraestrutura',
    icon: Activity,
    color: 'bg-blue-100 dark:bg-blue-900',
    href: '/admin/health',
    isAdmin: true
  },
  {
    title: 'Limpeza de Tarefas',
    description: 'Gerencie e limpe tarefas completadas ou falhadas',
    icon: Trash2,
    color: 'bg-green-100 dark:bg-green-900',
    href: '/admin/clear-tasks',
    isAdmin: true
  },
  {
    title: 'Deletar Tarefa',
    description: 'Busque e remova tarefas específicas com segurança',
    icon: Database,
    color: 'bg-red-100 dark:bg-red-900',
    href: '/admin/delete-task',
    isAdmin: true
  }
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
            <Link href={action.href}>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer group relative">
                {action.isAdmin && (
                  <div className="absolute top-3 right-3">
                    <div className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 text-xs font-medium rounded-full">
                      Admin
                    </div>
                  </div>
                )}
                
                <div className="flex items-center mb-4">
                  <div className={`p-2 ${action.color} rounded-lg group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${
                      action.title.includes('Saúde') ? 'text-blue-600 dark:text-blue-400' :
                      action.title.includes('Limpeza') ? 'text-green-600 dark:text-green-400' :
                      'text-red-600 dark:text-red-400'
                    }`} />
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">{action.title}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {action.description}
                </p>
                
                <div className="mt-4 flex items-center text-sm text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors">
                  <span>Acessar →</span>
                </div>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </motion.div>
  )
})

QuickActions.displayName = 'QuickActions'

export default QuickActions