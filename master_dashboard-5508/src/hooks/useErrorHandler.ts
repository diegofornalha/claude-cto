/**
 * Hook personalizado para tratamento de erros em componentes React
 */

import { useCallback, useState } from 'react'
import { ErrorHandlingService } from '@/services/errorHandlingService'

export interface UseErrorHandlerReturn {
  error: Error | null
  isError: boolean
  clearError: () => void
  handleError: (error: Error, context?: string) => void
  handleAsyncError: <T>(promise: Promise<T>, context?: string) => Promise<T | null>
  withErrorHandling: <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: string
  ) => (...args: T) => Promise<R | null>
}

export const useErrorHandler = (defaultContext?: string): UseErrorHandlerReturn => {
  const [error, setError] = useState<Error | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleError = useCallback((error: Error, context?: string) => {
    const errorContext = context || defaultContext || 'Aplicação'
    
    setError(error)
    ErrorHandlingService.logError(error, errorContext)
    ErrorHandlingService.showErrorToast(error, errorContext)
  }, [defaultContext])

  const handleAsyncError = useCallback(async <T,>(
    promise: Promise<T>, 
    context?: string
  ): Promise<T | null> => {
    try {
      const result = await promise
      // Limpa erro anterior se operação foi bem-sucedida
      if (error) {
        clearError()
      }
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      handleError(error, context)
      return null
    }
  }, [error, clearError, handleError])

  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: string
  ) => {
    return async (...args: T): Promise<R | null> => {
      return handleAsyncError(fn(...args), context)
    }
  }, [handleAsyncError])

  return {
    error,
    isError: error !== null,
    clearError,
    handleError,
    handleAsyncError,
    withErrorHandling
  }
}

// Hook especializado para operações de API
export interface UseApiErrorHandlerReturn extends UseErrorHandlerReturn {
  handleApiCall: <T>(
    apiCall: () => Promise<T>,
    options?: {
      context?: string
      showSuccessToast?: boolean
      successMessage?: string
    }
  ) => Promise<T | null>
}

export const useApiErrorHandler = (defaultContext?: string): UseApiErrorHandlerReturn => {
  const baseHandler = useErrorHandler(defaultContext)

  const handleApiCall = useCallback(async <T,>(
    apiCall: () => Promise<T>,
    options?: {
      context?: string
      showSuccessToast?: boolean
      successMessage?: string
    }
  ): Promise<T | null> => {
    try {
      const result = await apiCall()
      
      // Limpa erro anterior se operação foi bem-sucedida
      if (baseHandler.error) {
        baseHandler.clearError()
      }

      // Mostra toast de sucesso se solicitado
      if (options?.showSuccessToast) {
        const { toast } = await import('react-hot-toast')
        toast.success(options.successMessage || 'Operação realizada com sucesso!')
      }

      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      const context = options?.context || defaultContext || 'API'
      baseHandler.handleError(error, context)
      return null
    }
  }, [baseHandler, defaultContext])

  return {
    ...baseHandler,
    handleApiCall
  }
}

// Hook para componentes que fazem múltiplas operações async
export interface UseAsyncOperationsReturn {
  operations: Map<string, { isLoading: boolean; error: Error | null }>
  startOperation: (key: string) => void
  finishOperation: (key: string, error?: Error) => void
  isLoading: (key: string) => boolean
  getError: (key: string) => Error | null
  clearOperation: (key: string) => void
  clearAllOperations: () => void
}

export const useAsyncOperations = (): UseAsyncOperationsReturn => {
  const [operations, setOperations] = useState(
    new Map<string, { isLoading: boolean; error: Error | null }>()
  )

  const startOperation = useCallback((key: string) => {
    setOperations(prev => new Map(prev).set(key, { isLoading: true, error: null }))
  }, [])

  const finishOperation = useCallback((key: string, error?: Error) => {
    setOperations(prev => {
      const newMap = new Map(prev)
      newMap.set(key, { isLoading: false, error: error || null })
      return newMap
    })
  }, [])

  const isLoading = useCallback((key: string) => {
    return operations.get(key)?.isLoading || false
  }, [operations])

  const getError = useCallback((key: string) => {
    return operations.get(key)?.error || null
  }, [operations])

  const clearOperation = useCallback((key: string) => {
    setOperations(prev => {
      const newMap = new Map(prev)
      newMap.delete(key)
      return newMap
    })
  }, [])

  const clearAllOperations = useCallback(() => {
    setOperations(new Map())
  }, [])

  return {
    operations,
    startOperation,
    finishOperation,
    isLoading,
    getError,
    clearOperation,
    clearAllOperations
  }
}

// Hook para retry automático
export interface UseRetryableOperationReturn<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  retry: () => Promise<void>
  canRetry: boolean
  retryCount: number
}

export const useRetryableOperation = <T,>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    retryDelay?: number
    autoRetry?: boolean
    context?: string
  } = {}
): UseRetryableOperationReturn<T> => {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const maxRetries = options.maxRetries || 3
  const retryDelay = options.retryDelay || 1000
  const context = options.context || 'Operação'

  const executeOperation = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await operation()
      setData(result)
      setRetryCount(0) // Reset retry count on success
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      
      ErrorHandlingService.logError(error, context)

      // Auto retry se configurado e ainda temos tentativas
      if (options.autoRetry && retryCount < maxRetries && ErrorHandlingService.isRecoverableError(error)) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          executeOperation()
        }, retryDelay * Math.pow(2, retryCount)) // Exponential backoff
      } else {
        ErrorHandlingService.showErrorToast(error, context)
      }
    } finally {
      setIsLoading(false)
    }
  }, [operation, retryCount, maxRetries, retryDelay, context, options.autoRetry])

  const retry = useCallback(async () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1)
      await executeOperation()
    }
  }, [executeOperation, retryCount, maxRetries])

  const canRetry = error !== null && retryCount < maxRetries && 
    (error ? ErrorHandlingService.isRecoverableError(error) : false)

  return {
    data,
    error,
    isLoading,
    retry,
    canRetry,
    retryCount
  }
}