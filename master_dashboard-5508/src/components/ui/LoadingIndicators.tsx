/**
 * Componentes de loading e indicadores visuais
 * Componentes reutilizáveis para feedback de estado da aplicação
 */

import React from 'react'

// Spinner básico de loading
export function LoadingSpinner({ size = 'md', className = '' }: { 
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string 
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }
  
  return (
    <div className={`animate-spin ${sizeClasses[size]} ${className}`}>
      <div className="h-full w-full border-2 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  )
}

// Skeleton loader para cards
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-lg p-4 ${className}`}>
      <div className="h-4 bg-gray-300 rounded mb-3"></div>
      <div className="h-3 bg-gray-300 rounded mb-2 w-3/4"></div>
      <div className="h-3 bg-gray-300 rounded mb-2 w-1/2"></div>
      <div className="h-3 bg-gray-300 rounded w-2/3"></div>
    </div>
  )
}

// Skeleton para lista
export function SkeletonList({ count = 3, className = '' }: { 
  count?: number
  className?: string 
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// Loading overlay para tela inteira
export function LoadingOverlay({ 
  show, 
  message = 'Carregando...', 
  className = '' 
}: { 
  show: boolean
  message?: string
  className?: string 
}) {
  if (!show) return null
  
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
        <LoadingSpinner size="lg" />
        <span className="text-lg font-medium">{message}</span>
      </div>
    </div>
  )
}

// Loading inline para botões
export function LoadingButton({ 
  children, 
  isLoading, 
  disabled,
  onClick,
  className = '',
  ...props 
}: {
  children: React.ReactNode
  isLoading: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
  [key: string]: any
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        flex items-center justify-center space-x-2
        px-4 py-2 rounded-md font-medium transition-all
        ${isLoading ? 'cursor-not-allowed opacity-75' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}
        ${className}
      `}
      {...props}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      <span>{children}</span>
    </button>
  )
}

// Badge de status da conexão
export function ConnectionBadge({ 
  status, 
  responseTime,
  className = '' 
}: { 
  status: 'online' | 'offline' | 'connecting' | 'error'
  responseTime?: number
  className?: string 
}) {
  const statusConfig = {
    online: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '●',
      text: 'Online'
    },
    offline: {
      color: 'bg-red-100 text-red-800 border-red-200', 
      icon: '●',
      text: 'Offline'
    },
    connecting: {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: '↻',
      text: 'Conectando'
    },
    error: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '!',
      text: 'Erro'
    }
  }
  
  const config = statusConfig[status]
  
  return (
    <div className={`
      inline-flex items-center space-x-1 
      px-2 py-1 rounded-full border text-xs font-medium
      ${config.color} ${className}
    `}>
      <span className={status === 'connecting' ? 'animate-spin' : ''}>{config.icon}</span>
      <span>{config.text}</span>
      {responseTime && status === 'online' && (
        <span className="text-xs opacity-75">({responseTime}ms)</span>
      )}
    </div>
  )
}

// Componente de erro com retry
export function ErrorMessage({ 
  message, 
  onRetry,
  showRetry = true,
  className = '' 
}: { 
  message: string
  onRetry?: () => void
  showRetry?: boolean
  className?: string 
}) {
  return (
    <div className={`
      bg-red-50 border border-red-200 rounded-lg p-4
      ${className}
    `}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-red-400 text-lg">⚠️</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Erro na conexão
          </h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
          {showRetry && onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className="
                  bg-red-600 text-white px-3 py-1 rounded text-sm
                  hover:bg-red-700 transition-colors
                "
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Toast de sucesso/erro
export function Toast({ 
  type, 
  message, 
  onClose,
  autoClose = true,
  duration = 5000,
  className = '' 
}: { 
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  onClose?: () => void
  autoClose?: boolean
  duration?: number
  className?: string 
}) {
  const [visible, setVisible] = React.useState(true)
  
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(() => onClose?.(), 300) // Delay para animação
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [autoClose, duration, onClose])
  
  if (!visible) return null
  
  const typeConfig = {
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: '✓'
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800', 
      icon: '✕'
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      icon: '⚠'
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: 'ℹ'
    }
  }
  
  const config = typeConfig[type]
  
  return (
    <div className={`
      fixed top-4 right-4 z-50
      transform transition-all duration-300
      ${visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}
      ${config.bg} border rounded-lg p-4 shadow-lg
      max-w-sm ${className}
    `}>
      <div className="flex items-start">
        <span className={`${config.text} mr-2`}>{config.icon}</span>
        <div className="flex-1">
          <p className={`text-sm ${config.text}`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={() => {
              setVisible(false)
              setTimeout(() => onClose(), 300)
            }}
            className={`${config.text} ml-2 hover:opacity-75`}
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

// Hook para gerenciar toasts
export function useToast() {
  const [toasts, setToasts] = React.useState<Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
  }>>([])
  
  const showToast = React.useCallback((
    type: 'success' | 'error' | 'warning' | 'info', 
    message: string
  ) => {
    const id = Math.random().toString(36).substring(7)
    setToasts(prev => [...prev, { id, type, message }])
  }, [])
  
  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])
  
  const success = React.useCallback((message: string) => showToast('success', message), [showToast])
  const error = React.useCallback((message: string) => showToast('error', message), [showToast])
  const warning = React.useCallback((message: string) => showToast('warning', message), [showToast])
  const info = React.useCallback((message: string) => showToast('info', message), [showToast])
  
  const ToastContainer = React.useCallback(() => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  ), [toasts, removeToast])
  
  return {
    success,
    error,
    warning,
    info,
    ToastContainer
  }
}

// Loading state para páginas inteiras
export function PageLoader({ 
  message = 'Carregando dados...',
  showProgress = false,
  progress = 0 
}: { 
  message?: string
  showProgress?: boolean
  progress?: number 
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 space-y-4">
      <LoadingSpinner size="xl" />
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-gray-700">{message}</p>
        {showProgress && (
          <div className="w-64 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  )
}

// Empty state quando não há dados
export function EmptyState({ 
  title = 'Nenhum dado encontrado',
  description = 'Não há itens para exibir no momento.',
  action,
  icon = '📭',
  className = ''
}: { 
  title?: string
  description?: string
  action?: React.ReactNode
  icon?: string
  className?: string 
}) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      {action && <div>{action}</div>}
    </div>
  )
}