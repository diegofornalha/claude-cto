import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { 
  LayoutDashboard, 
  Trash2, 
  Database, 
  Activity,
  Settings,
  Menu,
  X,
  Home,
  ChevronRight,
  Shield
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigationItems = [
  {
    name: 'Dashboard Principal',
    href: '/',
    icon: Home,
    description: 'Voltar ao dashboard principal'
  },
  {
    name: 'Saúde do Sistema',
    href: '/admin/health',
    icon: Activity,
    description: 'Monitoramento em tempo real'
  },
  {
    name: 'Limpeza de Tarefas',
    href: '/admin/clear-tasks',
    icon: Trash2,
    description: 'Gerenciar tarefas completadas'
  },
  {
    name: 'Deletar Tarefa',
    href: '/admin/delete-task',
    icon: Database,
    description: 'Buscar e remover tarefas específicas'
  }
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const isActiveRoute = (href: string) => {
    if (href === '/') return router.pathname === '/'
    return router.pathname.startsWith(href)
  }

  const getBreadcrumbs = () => {
    const path = router.pathname
    const segments = path.split('/').filter(Boolean)
    
    const breadcrumbs = [
      { name: 'Dashboard', href: '/' }
    ]

    if (segments.includes('admin')) {
      breadcrumbs.push({ name: 'Admin', href: '/admin' })
      
      if (segments.includes('health')) {
        breadcrumbs.push({ name: 'Saúde do Sistema', href: '/admin/health' })
      } else if (segments.includes('clear-tasks')) {
        breadcrumbs.push({ name: 'Limpeza de Tarefas', href: '/admin/clear-tasks' })
      } else if (segments.includes('delete-task')) {
        breadcrumbs.push({ name: 'Deletar Tarefa', href: '/admin/delete-task' })
      }
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : '-100%'
        }}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg lg:translate-x-0 lg:static lg:inset-0"
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="ml-3 text-lg font-bold text-gray-900 dark:text-white">
              Admin Panel
            </span>
          </div>
          
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = isActiveRoute(item.href)
              
              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 group
                      ${isActive 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }
                    `}
                  >
                    <item.icon className={`
                      w-5 h-5 mr-3 transition-colors
                      ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `} />
                    
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className={`
                        text-xs mt-0.5
                        ${isActive 
                          ? 'text-blue-600 dark:text-blue-300' 
                          : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600'
                        }
                      `}>
                        {item.description}
                      </div>
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </div>

          {/* Admin Badge */}
          <div className="mt-8 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="ml-2 text-sm font-medium text-red-700 dark:text-red-300">
                Modo Administrativo
              </span>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Acesso privilegiado ativo
            </p>
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Claude CTO Admin v1.0
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs */}
            <nav className="ml-4 lg:ml-0">
              <ol className="flex items-center space-x-2">
                {breadcrumbs.map((crumb, index) => (
                  <li key={crumb.href} className="flex items-center">
                    {index > 0 && (
                      <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                    )}
                    <Link 
                      href={crumb.href}
                      className={`
                        text-sm font-medium transition-colors
                        ${index === breadcrumbs.length - 1
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }
                      `}
                    >
                      {crumb.name}
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          {/* Right side - could add user menu, notifications etc */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-red-100 dark:bg-red-900 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-red-700 dark:text-red-300">Admin</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}