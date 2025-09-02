/**
 * Hook para monitorar status da API e saúde da conexão
 * Monitora automaticamente a saúde da API e fornece indicadores de status
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { MCPApiService } from '@/services/mcp-api'
import { ApiHealthData } from '@/types/task'

export interface ApiHealthState {
  isOnline: boolean
  isConnecting: boolean
  lastCheck: Date | null
  responseTime: number
  consecutiveErrors: number
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline'
  errorMessage: string | null
  serverInfo: any | null
}

interface UseApiHealthOptions {
  checkInterval?: number // Intervalo entre verificações em ms (padrão: 30000 - 30s)
  autoStart?: boolean    // Iniciar verificações automaticamente (padrão: true)
  retryOnError?: boolean // Tentar reconectar automaticamente (padrão: true)
  maxRetries?: number    // Máximo de tentativas consecutivas (padrão: 5)
}

export function useApiHealth(options: UseApiHealthOptions = {}) {
  const {
    checkInterval = 30000, // 30 segundos
    autoStart = true,
    retryOnError = true,
    maxRetries = 5
  } = options

  const [healthState, setHealthState] = useState<ApiHealthState>({
    isOnline: false,
    isConnecting: false,
    lastCheck: null,
    responseTime: 0,
    consecutiveErrors: 0,
    connectionQuality: 'offline',
    errorMessage: null,
    serverInfo: null
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMonitoringRef = useRef(false)
  const lastCheckRef = useRef<Date | null>(null)

  /**
   * Determina qualidade da conexão baseada no tempo de resposta
   */
  const getConnectionQuality = useCallback((responseTime: number, isOnline: boolean): ApiHealthState['connectionQuality'] => {
    if (!isOnline) return 'offline'
    
    if (responseTime < 500) return 'excellent'
    if (responseTime < 1500) return 'good'
    return 'poor'
  }, [])

  /**
   * Executa verificação de saúde da API
   */
  const checkHealth = useCallback(async (): Promise<ApiHealthData> => {
    // Evitar múltiplas verificações simultâneas
    if (healthState.isConnecting) {
      return { 
        status: false, 
        response_time: 0, 
        timestamp: new Date().toISOString(),
        error: 'Verificação já em andamento'
      }
    }

    setHealthState(prev => ({ 
      ...prev, 
      isConnecting: true,
      errorMessage: null
    }))

    try {
      const result = await MCPApiService.checkHealth()
      const now = new Date()
      
      setHealthState(prev => ({
        ...prev,
        isOnline: result.status,
        isConnecting: false,
        lastCheck: now,
        responseTime: result.response_time,
        consecutiveErrors: result.status ? 0 : prev.consecutiveErrors + 1,
        connectionQuality: getConnectionQuality(result.response_time, result.status),
        errorMessage: result.error || null,
        serverInfo: result.server_info || prev.serverInfo
      }))

      lastCheckRef.current = now
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na verificação de saúde'
      
      setHealthState(prev => ({
        ...prev,
        isOnline: false,
        isConnecting: false,
        lastCheck: new Date(),
        consecutiveErrors: prev.consecutiveErrors + 1,
        connectionQuality: 'offline',
        errorMessage,
        responseTime: 0
      }))

      return {
        status: false,
        response_time: 0,
        timestamp: new Date().toISOString(),
        error: errorMessage
      }
    }
  }, [healthState.isConnecting, getConnectionQuality])

  /**
   * Força uma verificação imediata
   */
  const forceCheck = useCallback(() => {
    return checkHealth()
  }, [checkHealth])

  /**
   * Inicia monitoramento automático
   */
  const startMonitoring = useCallback(() => {
    if (isMonitoringRef.current) return

    isMonitoringRef.current = true

    // Verificação inicial
    checkHealth()

    // Configurar interval para verificações periódicas
    intervalRef.current = setInterval(() => {
      // Se tivemos muitos erros consecutivos e não estamos tentando reconectar, pular
      if (healthState.consecutiveErrors >= maxRetries && !retryOnError) {
        return
      }

      checkHealth()
    }, checkInterval)
  }, [checkHealth, checkInterval, healthState.consecutiveErrors, maxRetries, retryOnError])

  /**
   * Para monitoramento automático
   */
  const stopMonitoring = useCallback(() => {
    isMonitoringRef.current = false
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  /**
   * Reinicia o monitoramento
   */
  const restartMonitoring = useCallback(() => {
    stopMonitoring()
    setHealthState(prev => ({ ...prev, consecutiveErrors: 0 }))
    startMonitoring()
  }, [stopMonitoring, startMonitoring])

  // Efeito para iniciar/parar monitoramento
  useEffect(() => {
    if (autoStart) {
      startMonitoring()
    }

    // Cleanup
    return () => {
      stopMonitoring()
    }
  }, [autoStart, startMonitoring, stopMonitoring])

  // Efeito para escutar eventos da API
  useEffect(() => {
    const handleApiEvent = (event: 'connected' | 'disconnected' | 'error', data?: any) => {
      setHealthState(prev => {
        switch (event) {
          case 'connected':
            return {
              ...prev,
              isOnline: true,
              consecutiveErrors: 0,
              connectionQuality: getConnectionQuality(prev.responseTime, true),
              errorMessage: null
            }
          
          case 'disconnected':
            return {
              ...prev,
              isOnline: false,
              connectionQuality: 'offline',
              errorMessage: 'API desconectada'
            }
          
          case 'error':
            return {
              ...prev,
              isOnline: false,
              connectionQuality: 'offline',
              errorMessage: data?.message || 'Erro na API',
              consecutiveErrors: prev.consecutiveErrors + 1
            }
          
          default:
            return prev
        }
      })
    }

    MCPApiService.addEventListener(handleApiEvent)

    return () => {
      MCPApiService.removeEventListener(handleApiEvent)
    }
  }, [getConnectionQuality])

  // Valores computados
  const timeSinceLastCheck = lastCheckRef.current 
    ? Date.now() - lastCheckRef.current.getTime()
    : null

  const isStale = timeSinceLastCheck ? timeSinceLastCheck > checkInterval * 1.5 : true

  const statusText = healthState.isConnecting 
    ? 'Verificando...' 
    : healthState.isOnline 
      ? 'Conectado' 
      : healthState.consecutiveErrors >= maxRetries 
        ? 'Falha na conexão'
        : 'Desconectado'

  const shouldShowWarning = healthState.consecutiveErrors > 2 && healthState.consecutiveErrors < maxRetries

  return {
    // Estado atual
    ...healthState,
    
    // Estados computados
    timeSinceLastCheck,
    isStale,
    statusText,
    shouldShowWarning,
    isMonitoring: isMonitoringRef.current,
    
    // Ações
    checkHealth: forceCheck,
    startMonitoring,
    stopMonitoring,
    restartMonitoring,
    
    // Métodos de conveniência
    getStatusColor: () => {
      if (healthState.isConnecting) return 'blue'
      if (healthState.isOnline) {
        switch (healthState.connectionQuality) {
          case 'excellent': return 'green'
          case 'good': return 'yellow'
          case 'poor': return 'orange'
          default: return 'gray'
        }
      }
      return 'red'
    },
    
    getStatusIcon: () => {
      if (healthState.isConnecting) return 'loading'
      if (healthState.isOnline) {
        switch (healthState.connectionQuality) {
          case 'excellent': return 'check-circle'
          case 'good': return 'check'
          case 'poor': return 'exclamation-triangle'
          default: return 'question-circle'
        }
      }
      return 'times-circle'
    }
  }
}

/**
 * Hook simplificado que retorna apenas o status online/offline
 */
export function useApiStatus() {
  const { isOnline, isConnecting, connectionQuality } = useApiHealth({
    checkInterval: 60000, // 1 minuto para versão simplificada
    autoStart: true
  })

  return {
    isOnline,
    isConnecting,
    connectionQuality,
    status: isConnecting ? 'connecting' : isOnline ? 'online' : 'offline'
  }
}

/**
 * Provider de contexto para compartilhar estado da API entre componentes
 */
import React, { createContext, useContext } from 'react'

const ApiHealthContext = createContext<ReturnType<typeof useApiHealth> | null>(null)

export function ApiHealthProvider({ 
  children, 
  options = {} 
}: { 
  children: React.ReactNode
  options?: UseApiHealthOptions
}) {
  const apiHealth = useApiHealth(options)
  
  return React.createElement(
    ApiHealthContext.Provider,
    { value: apiHealth },
    children
  )
}

export function useApiHealthContext() {
  const context = useContext(ApiHealthContext)
  if (!context) {
    throw new Error('useApiHealthContext must be used within an ApiHealthProvider')
  }
  return context
}