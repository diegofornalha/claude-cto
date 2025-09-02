import React from 'react'
import Link from 'next/link'
import { Shield, AlertTriangle, RefreshCw, Settings, Home } from 'lucide-react'
import { ErrorBoundaryWrapper } from './ErrorBoundary'

interface AdminErrorFallbackProps {
  error?: Error
  resetError?: () => void
}

const AdminErrorFallback: React.FC<AdminErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-red-900/20 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center border border-red-200 dark:border-red-800">
        <div className="mb-6 relative">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full">
            <Shield className="h-10 w-10 text-red-600 dark:text-red-400" />
            <AlertTriangle className="absolute -top-1 -right-1 h-6 w-6 text-red-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Erro na Área Administrativa
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Ocorreu um erro crítico na área administrativa. Por motivos de segurança, o acesso foi bloqueado.
        </p>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-left">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Possíveis causas:
              </h3>
              <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Falha na autenticação ou autorização</li>
                <li>• Erro na comunicação com serviços administrativos</li>
                <li>• Componente administrativo com falha</li>
                <li>• Estado inconsistente de permissões</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Detalhes do erro em desenvolvimento */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 text-left bg-red-50 dark:bg-red-900/20 p-4 rounded border border-red-200 dark:border-red-800">
            <summary className="cursor-pointer font-medium text-sm text-red-700 dark:text-red-300 mb-2">
              Detalhes técnicos (desenvolvimento)
            </summary>
            <div className="text-xs text-red-600 dark:text-red-400 font-mono whitespace-pre-wrap">
              <strong>Erro:</strong> {error.message}
              {error.stack && (
                <>
                  <br /><br />
                  <strong>Stack:</strong>
                  <br />
                  {error.stack}
                </>
              )}
            </div>
          </details>
        )}

        {/* Ações de recuperação */}
        <div className="space-y-4">
          <div className="flex gap-3 justify-center">
            {resetError && (
              <button
                onClick={resetError}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </button>
            )}
            
            <Link
              href="/admin"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
            >
              <Settings className="w-4 h-4 mr-2" />
              Voltar ao Admin
            </Link>
          </div>

          <div className="flex gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard Principal
            </Link>
            
            <Link
              href="/tasks"
              className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
            >
              Ir para Tarefas
            </Link>
          </div>
        </div>

        <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700 rounded border text-xs text-gray-600 dark:text-gray-400">
          <strong>Segurança:</strong> Este erro foi registrado para auditoria.
          <br />
          Timestamp: {new Date().toISOString()}
        </div>
      </div>
    </div>
  )
}

interface AdminErrorBoundaryProps {
  children: React.ReactNode
}

const AdminErrorBoundary: React.FC<AdminErrorBoundaryProps> = ({ children }) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('AdminErrorBoundary capturou erro crítico:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      context: 'Admin Panel',
      severity: 'CRITICAL',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
    })

    // Em produção, enviar para serviço de monitoramento com alta prioridade
    if (process.env.NODE_ENV === 'production') {
      // Exemplo: Sentry.captureException(error, { 
      //   level: 'error',
      //   tags: { 
      //     context: 'admin',
      //     severity: 'critical'
      //   },
      //   extra: errorInfo 
      // })
      
      // Notificação imediata para equipe de segurança
      // Exemplo: notifySecurityTeam({ error, context: 'admin', timestamp: Date.now() })
    }
  }

  return (
    <ErrorBoundaryWrapper
      fallback={<AdminErrorFallback />}
      onError={handleError}
    >
      {children}
    </ErrorBoundaryWrapper>
  )
}

export default AdminErrorBoundary