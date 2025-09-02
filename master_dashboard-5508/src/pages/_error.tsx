import { NextPage } from 'next'
import { NextPageContext } from 'next'
import { useRouter } from 'next/router'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ErrorProps {
  statusCode?: number
  hasGetInitialPropsRun?: boolean
  err?: Error
  title?: string
}

// Error Boundary Component
class ErrorBoundary {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
}

const ErrorPage: NextPage<ErrorProps> = ({ statusCode, hasGetInitialPropsRun, err, title }) => {
  const router = useRouter()
  const [isReloading, setIsReloading] = useState(false)

  useEffect(() => {
    // Log do erro para debug
    if (err) {
      console.error('Error captured by _error.tsx:', {
        error: err,
        statusCode,
        hasGetInitialPropsRun,
        title,
        url: router.asPath,
        timestamp: new Date().toISOString(),
        stack: err.stack
      })
    }
  }, [err, statusCode, hasGetInitialPropsRun, title, router.asPath])

  const handleReload = () => {
    setIsReloading(true)
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  const handleGoHome = () => {
    router.push('/')
  }

  const getErrorMessage = () => {
    if (statusCode === 404) {
      return {
        title: 'Página não encontrada',
        description: 'A página que você está procurando não existe ou foi movida.',
        icon: '🔍'
      }
    }
    
    if (statusCode === 500) {
      return {
        title: 'Erro interno do servidor',
        description: 'Ocorreu um erro interno. Nossa equipe foi notificada.',
        icon: '⚠️'
      }
    }

    if (statusCode && statusCode >= 400) {
      return {
        title: `Erro ${statusCode}`,
        description: 'Ocorreu um erro inesperado. Tente novamente em alguns instantes.',
        icon: '❌'
      }
    }

    return {
      title: 'Algo deu errado',
      description: 'Ocorreu um erro inesperado na aplicação. Tente recarregar a página.',
      icon: '🔧'
    }
  }

  const errorInfo = getErrorMessage()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="text-6xl mb-4">{errorInfo.icon}</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {errorInfo.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            {errorInfo.description}
          </p>
        </div>

        {/* Error Details - apenas em desenvolvimento */}
        {process.env.NODE_ENV === 'development' && err && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8 text-left">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Detalhes do erro (desenvolvimento)
              </h3>
            </div>
            <p className="text-xs text-red-700 dark:text-red-300 font-mono break-all">
              {err.message}
            </p>
            {statusCode && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Status Code: {statusCode}
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleReload}
            disabled={isReloading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <RefreshCw className={`h-5 w-5 ${isReloading ? 'animate-spin' : ''}`} />
            <span>{isReloading ? 'Recarregando...' : 'Recarregar página'}</span>
          </button>

          <button
            onClick={handleGoHome}
            className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <Home className="h-5 w-5" />
            <span>Ir para o início</span>
          </button>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-500">
          <p>Se o problema persistir, entre em contato com o suporte.</p>
          <p className="mt-1 font-mono text-xs">
            Error ID: {Date.now().toString(36)}
          </p>
        </div>
      </div>
    </div>
  )
}

ErrorPage.getInitialProps = async (ctx: NextPageContext) => {
  const { res, err } = ctx
  const statusCode = res?.statusCode || err?.statusCode || 404

  // Log do erro no servidor
  if (err) {
    console.error('Server-side error in _error.tsx:', {
      error: err.message,
      stack: err.stack,
      statusCode,
      url: ctx.req?.url,
      timestamp: new Date().toISOString()
    })
  }

  return { 
    statusCode,
    hasGetInitialPropsRun: true,
    err: err ? { 
      message: err.message,
      name: err.name,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    } as Error : undefined
  }
}

export default ErrorPage