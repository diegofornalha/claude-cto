/**
 * Layout principal da aplicação
 * Inclui header, sidebar, status badge da API e containers principais
 */

import React from 'react'
import { useApiHealth } from '@/hooks/useApiHealth'
import { useTaskStore } from '@/store/taskStore'
import { ConnectionBadge, useToast } from '@/components/ui/LoadingIndicators'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  showSidebar?: boolean
}

export function Layout({ 
  children, 
  title = 'Claude CTO Dashboard',
  description,
  showSidebar = true 
}: LayoutProps) {
  const { 
    isOnline, 
    isConnecting, 
    connectionQuality, 
    responseTime,
    errorMessage,
    consecutiveErrors,
    shouldShowWarning,
    restartMonitoring
  } = useApiHealth()
  
  const { lastError, successMessage, clearMessages } = useTaskStore()
  const toast = useToast()
  
  // Mapear status da API para status do badge
  const getBadgeStatus = () => {
    if (isConnecting) return 'connecting'
    if (isOnline) return 'online'
    if (consecutiveErrors > 0) return 'error'
    return 'offline'
  }
  
  // Efeito para mostrar toasts baseados em mensagens do store
  React.useEffect(() => {
    if (successMessage) {
      toast.success(successMessage)
      const timer = setTimeout(() => clearMessages(), 100)
      return () => clearTimeout(timer)
    }
  }, [successMessage, toast, clearMessages])
  
  React.useEffect(() => {
    if (lastError && !lastError.includes('cache') && !lastError.includes('offline')) {
      toast.error(lastError)
      const timer = setTimeout(() => clearMessages(), 100)
      return () => clearTimeout(timer)
    }
  }, [lastError, toast, clearMessages])
  
  // Toast de aviso sobre conexão
  React.useEffect(() => {
    if (shouldShowWarning && errorMessage) {
      toast.warning(`Problemas de conexão: ${errorMessage}`)
    }
  }, [shouldShowWarning, errorMessage, toast])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Título */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">
                  {title}
                </h1>
                {description && (
                  <p className="text-sm text-gray-500">{description}</p>
                )}
              </div>
            </div>
            
            {/* Status da API e ações */}
            <div className="flex items-center space-x-4">
              {/* Badge de status da API */}
              <div className="flex items-center space-x-2">
                <ConnectionBadge 
                  status={getBadgeStatus()}
                  responseTime={responseTime}
                />
                
                {/* Botão de reconexão quando há problemas */}
                {(!isOnline || consecutiveErrors > 2) && (
                  <button
                    onClick={restartMonitoring}
                    className="
                      text-xs px-2 py-1 bg-blue-600 text-white rounded
                      hover:bg-blue-700 transition-colors
                    "
                    title="Tentar reconectar"
                  >
                    🔄
                  </button>
                )}
              </div>
              
              {/* Menu do usuário (placeholder) */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">U</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          {showSidebar && (
            <aside className="w-64 flex-shrink-0">
              <nav className="bg-white rounded-lg shadow-sm p-4">
                <div className="space-y-2">
                  <SidebarLink href="/" active icon="🏠">
                    Dashboard
                  </SidebarLink>
                  <SidebarLink href="/tasks" icon="📋">
                    Tarefas
                  </SidebarLink>
                  <SidebarLink href="/tasks/create" icon="➕">
                    Nova Tarefa
                  </SidebarLink>
                  <SidebarLink href="/orchestration" icon="🔧">
                    Orquestração
                  </SidebarLink>
                  <SidebarLink href="/admin" icon="⚙️">
                    Administração
                  </SidebarLink>
                </div>
                
                {/* Status de conexão detalhado na sidebar */}
                <div className="mt-6 pt-4 border-t">
                  <div className="text-xs font-medium text-gray-500 mb-2">
                    Status da Conexão
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={
                        isOnline ? 'text-green-600' : 'text-red-600'
                      }>
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    {responseTime > 0 && (
                      <div className="flex justify-between">
                        <span>Resposta:</span>
                        <span>{responseTime}ms</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Qualidade:</span>
                      <span className={
                        connectionQuality === 'excellent' ? 'text-green-600' :
                        connectionQuality === 'good' ? 'text-yellow-600' :
                        connectionQuality === 'poor' ? 'text-orange-600' :
                        'text-red-600'
                      }>
                        {
                          connectionQuality === 'excellent' ? 'Excelente' :
                          connectionQuality === 'good' ? 'Boa' :
                          connectionQuality === 'poor' ? 'Fraca' :
                          'Sem conexão'
                        }
                      </span>
                    </div>
                    {consecutiveErrors > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Erros:</span>
                        <span>{consecutiveErrors}</span>
                      </div>
                    )}
                  </div>
                </div>
              </nav>
            </aside>
          )}

          {/* Conteúdo principal */}
          <main className={`flex-1 ${showSidebar ? '' : 'w-full'}`}>
            {children}
          </main>
        </div>
      </div>
      
      {/* Container para toasts */}
      <toast.ToastContainer />
    </div>
  )
}

// Componente para links da sidebar
function SidebarLink({ 
  href, 
  children, 
  active = false, 
  icon,
  className = '' 
}: {
  href: string
  children: React.ReactNode
  active?: boolean
  icon?: string
  className?: string
}) {
  return (
    <a
      href={href}
      className={`
        flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium
        transition-colors
        ${active 
          ? 'bg-blue-50 text-blue-700 border-blue-200' 
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        }
        ${className}
      `}
    >
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </a>
  )
}

// Layout simplificado sem sidebar
export function SimpleLayout({ children, title, description }: LayoutProps) {
  return (
    <Layout 
      title={title} 
      description={description}
      showSidebar={false}
    >
      {children}
    </Layout>
  )
}

// Layout com foco no conteúdo (para páginas de criação/edição)
export function ContentLayout({ 
  children, 
  title, 
  description,
  actions
}: LayoutProps & { actions?: React.ReactNode }) {
  return (
    <Layout title={title} description={description}>
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header da página */}
        {(title || description || actions) && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                {title && (
                  <h2 className="text-lg font-semibold text-gray-900">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {description}
                  </p>
                )}
              </div>
              {actions && <div>{actions}</div>}
            </div>
          </div>
        )}
        
        {/* Conteúdo */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </Layout>
  )
}

export default Layout