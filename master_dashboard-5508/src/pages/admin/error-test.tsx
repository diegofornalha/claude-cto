/**
 * Página para testar Error Boundaries e tratamento de erros
 * APENAS para desenvolvimento e testes
 */

import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { 
  AlertTriangle, 
  Bug, 
  Zap, 
  Wifi, 
  Clock, 
  RefreshCw,
  ArrowLeft,
  Play
} from 'lucide-react'
import AdminErrorBoundary from '@/components/AdminErrorBoundary'
import ErrorLogViewer from '@/components/ErrorLogViewer'
import { useErrorHandler, useApiErrorHandler } from '@/hooks/useErrorHandler'
import { ErrorHandlingService, ApiError, TimeoutError, NetworkError } from '@/services/errorHandlingService'

// Componente que simula diferentes tipos de erro
const ErrorSimulator: React.FC = () => {
  const { handleError, error, clearError } = useErrorHandler('Error Simulator')
  const { handleApiCall } = useApiErrorHandler('API Test')
  const [isLoading, setIsLoading] = useState(false)

  // Simular erro de renderização (vai ser capturado pelo ErrorBoundary)
  const [shouldCrash, setShouldCrash] = useState(false)

  const simulateErrors = {
    renderError: () => {
      setShouldCrash(true)
    },

    jsError: () => {
      const error = new Error('Erro JavaScript simulado')
      error.stack = `Error: Erro JavaScript simulado
    at simulateJsError (error-test.tsx:45:20)
    at onClick (error-test.tsx:89:31)
    at HTMLButtonElement.callCallback (react-dom.js:188:14)`
      handleError(error, 'JavaScript Error')
    },

    apiError: async () => {
      setIsLoading(true)
      await handleApiCall(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        throw new ApiError('Recurso não encontrado', 404, 'RESOURCE_NOT_FOUND', {
          resourceId: 'task-123',
          endpoint: '/api/v1/tasks/123'
        })
      }, { 
        context: 'API Error Test',
        showSuccessToast: false 
      })
      setIsLoading(false)
    },

    networkError: async () => {
      setIsLoading(true)
      await handleApiCall(async () => {
        await new Promise(resolve => setTimeout(resolve, 800))
        throw new NetworkError('Falha na conexão com o servidor', new Error('ECONNREFUSED'))
      }, { 
        context: 'Network Error Test' 
      })
      setIsLoading(false)
    },

    timeoutError: async () => {
      setIsLoading(true)
      await handleApiCall(async () => {
        await new Promise(resolve => setTimeout(resolve, 1200))
        throw new TimeoutError('Operação demorou mais que o esperado', 30000)
      }, { 
        context: 'Timeout Error Test' 
      })
      setIsLoading(false)
    },

    serverError: async () => {
      setIsLoading(true)
      await handleApiCall(async () => {
        await new Promise(resolve => setTimeout(resolve, 600))
        throw new ApiError('Erro interno do servidor', 500, 'INTERNAL_ERROR', {
          traceId: 'trace-456',
          timestamp: Date.now()
        })
      }, { 
        context: 'Server Error Test' 
      })
      setIsLoading(false)
    },

    asyncError: async () => {
      setIsLoading(true)
      try {
        await ErrorHandlingService.withRetry(async () => {
          await new Promise(resolve => setTimeout(resolve, 500))
          throw new Error('Erro em operação assíncrona com retry')
        }, {
          maxRetries: 2,
          baseDelay: 1000
        })
      } catch (error) {
        handleError(error as Error, 'Async Operation')
      }
      setIsLoading(false)
    }
  }

  // Se shouldCrash for true, vai disparar um erro de renderização
  if (shouldCrash) {
    throw new Error('Erro de renderização simulado - Este erro deve ser capturado pelo ErrorBoundary!')
  }

  return (
    <div className="space-y-6">
      {/* Status atual */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Último erro capturado:
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                <strong>{error.name}:</strong> {error.message}
              </p>
              <button
                onClick={clearError}
                className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:text-red-500"
              >
                Limpar erro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simuladores de erro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center mb-3">
            <Bug className="w-5 h-5 text-red-500 mr-2" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Erro de Renderização</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Simula um erro que quebra o componente (capturado pelo ErrorBoundary)
          </p>
          <button
            onClick={simulateErrors.renderError}
            className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors flex items-center justify-center"
          >
            <Play className="w-4 h-4 mr-2" />
            Quebrar Componente
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center mb-3">
            <Zap className="w-5 h-5 text-orange-500 mr-2" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Erro JavaScript</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Simula erro JavaScript comum (tratado pelo hook)
          </p>
          <button
            onClick={simulateErrors.jsError}
            disabled={isLoading}
            className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            <Play className="w-4 h-4 mr-2" />
            Erro JS
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Erro de API (404)</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Simula erro 404 da API com detalhes
          </p>
          <button
            onClick={simulateErrors.apiError}
            disabled={isLoading}
            className="w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            <Play className="w-4 h-4 mr-2" />
            {isLoading ? 'Testando...' : 'API Error'}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center mb-3">
            <Wifi className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Erro de Rede</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Simula falha na conexão de rede
          </p>
          <button
            onClick={simulateErrors.networkError}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            <Play className="w-4 h-4 mr-2" />
            {isLoading ? 'Testando...' : 'Network Error'}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center mb-3">
            <Clock className="w-5 h-5 text-purple-500 mr-2" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Timeout</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Simula operação que excede tempo limite
          </p>
          <button
            onClick={simulateErrors.timeoutError}
            disabled={isLoading}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            <Play className="w-4 h-4 mr-2" />
            {isLoading ? 'Testando...' : 'Timeout Error'}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center mb-3">
            <RefreshCw className="w-5 h-5 text-green-500 mr-2" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Erro com Retry</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Simula erro que tenta novamente automaticamente
          </p>
          <button
            onClick={simulateErrors.asyncError}
            disabled={isLoading}
            className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            <Play className="w-4 h-4 mr-2" />
            {isLoading ? 'Tentando...' : 'Async Error'}
          </button>
        </div>
      </div>

      {/* Informações sobre o teste */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          💡 Como testar:
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• <strong>Erro de Renderização:</strong> Quebra o componente e ativa o ErrorBoundary</li>
          <li>• <strong>Outros erros:</strong> São capturados pelos hooks e mostram notificação</li>
          <li>• <strong>Logs:</strong> Todos os erros são registrados no visualizador abaixo</li>
          <li>• <strong>Monitoramento:</strong> Em produção, seriam enviados para serviços como Sentry</li>
        </ul>
      </div>
    </div>
  )
}

const ErrorTestPage: React.FC = () => {
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Página não disponível em produção
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Esta página de teste está disponível apenas em ambiente de desenvolvimento.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Admin
          </Link>
        </div>
      </div>
    )
  }

  return (
    <AdminErrorBoundary>
      <Head>
        <title>Teste de Erros - Claude CTO Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Bug className="w-8 h-8 mr-3 text-red-500" />
                  Teste de Error Boundaries
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Página para testar diferentes tipos de erros e tratamento
                </p>
              </div>
              
              <Link
                href="/admin"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Admin
              </Link>
            </div>
          </div>

          {/* Aviso de desenvolvimento */}
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Ambiente de Desenvolvimento
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  Esta página está disponível apenas em desenvolvimento para testar o tratamento de erros
                </p>
              </div>
            </div>
          </div>

          {/* Simulador de erros */}
          <div className="mb-8">
            <ErrorSimulator />
          </div>

          {/* Visualizador de logs */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Logs de Erro em Tempo Real
            </h2>
            <ErrorLogViewer 
              maxEntries={20}
              autoRefresh={true}
              refreshInterval={3000}
              className="max-h-96"
            />
          </div>
        </div>
      </div>
    </AdminErrorBoundary>
  )
}

export default ErrorTestPage