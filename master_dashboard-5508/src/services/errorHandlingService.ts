/**
 * Serviço centralizado para tratamento de erros
 * Fornece utilities para retry, timeout, logging e recuperação
 */

import { toast } from 'react-hot-toast'

// Tipos de erro personalizados
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class TimeoutError extends Error {
  constructor(message: string, public timeout: number) {
    super(message)
    this.name = 'TimeoutError'
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message)
    this.name = 'NetworkError'
  }
}

// Interface para configuração de retry
export interface RetryOptions {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  retryOn?: (error: Error) => boolean
}

// Interface para configuração de timeout
export interface TimeoutOptions {
  timeout: number
  signal?: AbortSignal
}

// Interface para logging de erros
export interface ErrorLogEntry {
  error: Error
  context: string
  timestamp: number
  userAgent?: string
  url?: string
  userId?: string
  additional?: Record<string, any>
}

export class ErrorHandlingService {
  private static readonly DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryOn: (error: Error) => {
      // Não tentar novamente para erros do cliente (4xx)
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        return false
      }
      // Tentar novamente para erros de rede e servidor (5xx)
      return true
    }
  }

  private static readonly DEFAULT_TIMEOUT = 30000 // 30 segundos

  private static errorLog: ErrorLogEntry[] = []
  private static readonly MAX_LOG_ENTRIES = 100

  /**
   * Executa uma função com retry automático
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const config = { ...this.DEFAULT_RETRY_OPTIONS, ...options }
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Se não devemos tentar novamente ou é a última tentativa
        if (!config.retryOn?.(lastError) || attempt === config.maxRetries) {
          throw lastError
        }

        // Calcula delay com backoff exponencial
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt),
          config.maxDelay
        )

        console.warn(`Tentativa ${attempt + 1} falhou, tentando novamente em ${delay}ms:`, lastError.message)

        await this.sleep(delay)
      }
    }

    throw lastError
  }

  /**
   * Executa uma função com timeout
   */
  static async withTimeout<T>(
    fn: () => Promise<T>,
    options: Partial<TimeoutOptions> = {}
  ): Promise<T> {
    const timeout = options.timeout || this.DEFAULT_TIMEOUT

    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new TimeoutError(`Operação excedeu tempo limite de ${timeout}ms`, timeout))
      }, timeout)

      // Se um AbortSignal foi fornecido, escuta cancelamentos
      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          clearTimeout(timeoutId)
          reject(new Error('Operação foi cancelada'))
        })
      }

      fn()
        .then(result => {
          clearTimeout(timeoutId)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timeoutId)
          reject(error)
        })
    })
  }

  /**
   * Wrapper para fetch com tratamento de erros aprimorado
   */
  static async fetch(
    url: string,
    options: RequestInit & { 
      timeout?: number
      retryOptions?: Partial<RetryOptions>
    } = {}
  ): Promise<Response> {
    const { timeout, retryOptions, ...fetchOptions } = options

    return this.withTimeout(
      () => this.withRetry(
        async () => {
          const response = await fetch(url, fetchOptions)
          
          if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`
            let errorDetails = null

            try {
              const errorBody = await response.text()
              if (errorBody) {
                try {
                  errorDetails = JSON.parse(errorBody)
                  errorMessage = errorDetails.message || errorDetails.error || errorMessage
                } catch {
                  errorMessage = errorBody
                }
              }
            } catch {
              // Se não conseguir ler o body, use a mensagem padrão
            }

            throw new ApiError(errorMessage, response.status, response.headers.get('x-error-code') || undefined, errorDetails)
          }

          return response
        },
        retryOptions
      ),
      { timeout }
    )
  }

  /**
   * Log de erros estruturado
   */
  static logError(error: Error, context: string, additional?: Record<string, any>) {
    const logEntry: ErrorLogEntry = {
      error,
      context,
      timestamp: Date.now(),
      additional,
    }

    // Adiciona informações do browser se disponível
    if (typeof window !== 'undefined') {
      logEntry.userAgent = window.navigator.userAgent
      logEntry.url = window.location.href
    }

    // Adiciona ao log local
    this.errorLog.push(logEntry)
    
    // Mantém apenas os últimos N logs
    if (this.errorLog.length > this.MAX_LOG_ENTRIES) {
      this.errorLog = this.errorLog.slice(-this.MAX_LOG_ENTRIES)
    }

    // Log no console
    console.error(`[${context}]`, error, additional)

    // Em produção, enviar para serviço de monitoramento
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(logEntry).catch(err => 
        console.warn('Falha ao enviar erro para monitoramento:', err)
      )
    }
  }

  /**
   * Mostra notificação de erro user-friendly
   */
  static showErrorToast(error: Error, context?: string) {
    let message = this.getErrorMessage(error)
    
    if (context) {
      message = `${context}: ${message}`
    }

    toast.error(message, {
      duration: error instanceof TimeoutError ? 8000 : 6000,
      id: `error-${error.name}-${Date.now()}`, // Evita duplicatas
    })
  }

  /**
   * Converte erro em mensagem user-friendly
   */
  static getErrorMessage(error: Error): string {
    if (error instanceof ApiError) {
      switch (error.status) {
        case 400:
          return 'Dados inválidos enviados'
        case 401:
          return 'Não autorizado. Verifique suas credenciais'
        case 403:
          return 'Acesso negado'
        case 404:
          return 'Recurso não encontrado'
        case 408:
          return 'Tempo limite da requisição esgotado'
        case 409:
          return 'Conflito com o estado atual do recurso'
        case 429:
          return 'Muitas requisições. Tente novamente em breve'
        case 500:
          return 'Erro interno do servidor'
        case 502:
        case 503:
        case 504:
          return 'Serviço temporariamente indisponível'
        default:
          return error.message
      }
    }

    if (error instanceof TimeoutError) {
      return `Operação demorou muito para responder (${Math.round(error.timeout / 1000)}s)`
    }

    if (error instanceof NetworkError) {
      return 'Erro de conexão. Verifique sua internet'
    }

    if (error.name === 'AbortError') {
      return 'Operação foi cancelada'
    }

    // Erros genéricos de fetch/network
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'Erro de conexão. Verifique sua internet'
    }

    return error.message || 'Erro desconhecido'
  }

  /**
   * Obtém logs de erro
   */
  static getErrorLogs(limit?: number): ErrorLogEntry[] {
    return limit ? this.errorLog.slice(-limit) : [...this.errorLog]
  }

  /**
   * Limpa logs de erro
   */
  static clearErrorLogs(): void {
    this.errorLog = []
  }

  /**
   * Verifica se um erro é recuperável
   */
  static isRecoverableError(error: Error): boolean {
    if (error instanceof ApiError) {
      // Erros 4xx não são recuperáveis (exceto 408, 409, 429)
      if (error.status >= 400 && error.status < 500) {
        return [408, 409, 429].includes(error.status)
      }
      // Erros 5xx são potencialmente recuperáveis
      return error.status >= 500
    }

    return error instanceof TimeoutError || error instanceof NetworkError
  }

  /**
   * Cria um handler de erro padrão para componentes React
   */
  static createErrorHandler(context: string) {
    return (error: Error) => {
      this.logError(error, context)
      this.showErrorToast(error, context)
    }
  }

  // Métodos privados
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private static async sendToMonitoring(logEntry: ErrorLogEntry): Promise<void> {
    try {
      // Aqui você enviaria para Sentry, LogRocket, etc.
      // Exemplo:
      // await Sentry.captureException(logEntry.error, {
      //   tags: { context: logEntry.context },
      //   extra: logEntry.additional,
      //   user: { id: logEntry.userId }
      // })
    } catch (error) {
      // Falha silenciosa - não queremos que o logging de erro cause mais erros
    }
  }
}

// Helper functions para uso mais fácil
export const handleApiError = ErrorHandlingService.createErrorHandler.bind(ErrorHandlingService)
export const withRetry = ErrorHandlingService.withRetry.bind(ErrorHandlingService)
export const withTimeout = ErrorHandlingService.withTimeout.bind(ErrorHandlingService)
export const safeFetch = ErrorHandlingService.fetch.bind(ErrorHandlingService)