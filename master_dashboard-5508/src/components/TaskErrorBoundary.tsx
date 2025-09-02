import React from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, List, Plus } from 'lucide-react'
import { ErrorBoundaryWrapper } from './ErrorBoundary'

interface TaskErrorFallbackProps {
  error?: Error
  resetError?: () => void
}

const TaskErrorFallback: React.FC<TaskErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <AlertTriangle className="mx-auto h-16 w-16 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          Erro nas Tarefas
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Ocorreu um erro ao carregar a página de tarefas. Isso pode ter acontecido devido a:
        </p>

        <ul className="text-left text-sm text-gray-500 dark:text-gray-400 mb-6 space-y-1">
          <li>• Problemas de conectividade com a API</li>
          <li>• Erro no processamento dos dados de tarefas</li>
          <li>• Componente com falha na renderização</li>
          <li>• Estado inconsistente do armazenamento local</li>
        </ul>

        {/* Detalhes do erro em desenvolvimento */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 text-left bg-red-50 dark:bg-red-900/20 p-4 rounded border border-red-200 dark:border-red-800">
            <summary className="cursor-pointer font-medium text-sm text-red-700 dark:text-red-300 mb-2">
              Detalhes do erro (desenvolvimento)
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
        <div className="space-y-3">
          <div className="flex gap-3 justify-center">
            {resetError && (
              <button
                onClick={resetError}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </button>
            )}
            
            <Link
              href="/tasks"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <List className="w-4 h-4 mr-2" />
              Ir para Tarefas
            </Link>
          </div>

          <div className="flex gap-3 justify-center">
            <Link
              href="/tasks/create"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Nova Tarefa
            </Link>
            
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Dashboard Principal
            </Link>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          Se o problema persistir, verifique a conexão com a API ou entre em contato com o suporte.
        </div>
      </div>
    </div>
  )
}

interface TaskErrorBoundaryProps {
  children: React.ReactNode
}

const TaskErrorBoundary: React.FC<TaskErrorBoundaryProps> = ({ children }) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('TaskErrorBoundary capturou erro:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      context: 'Tasks Page',
    })

    // Em produção, enviar para serviço de monitoramento com contexto específico
    if (process.env.NODE_ENV === 'production') {
      // Exemplo: Sentry.captureException(error, { 
      //   tags: { context: 'tasks' },
      //   extra: errorInfo 
      // })
    }
  }

  return (
    <ErrorBoundaryWrapper
      fallback={<TaskErrorFallback />}
      onError={handleError}
    >
      {children}
    </ErrorBoundaryWrapper>
  )
}

export default TaskErrorBoundary