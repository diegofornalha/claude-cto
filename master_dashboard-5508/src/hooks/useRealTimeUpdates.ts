/**
 * Hook para atualizações em tempo real
 */

import { useState, useEffect, useCallback, useRef } from 'react'

export interface UseRealTimeUpdatesReturn {
  isRealTimeEnabled: boolean
  setRealTimeEnabled: (enabled: boolean) => void
  lastUpdate: string | null
  connectionStatus: 'connected' | 'disconnected' | 'connecting'
  refreshNow: () => void
}

export function useRealTimeUpdates(
  onUpdate: () => Promise<void>,
  intervalMs: number = 30000 // 30 segundos por padrão
): UseRealTimeUpdatesReturn {
  const [isRealTimeEnabled, setRealTimeEnabled] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isUpdatingRef = useRef(false)

  const refreshNow = useCallback(async () => {
    if (isUpdatingRef.current) return

    isUpdatingRef.current = true
    setConnectionStatus('connecting')

    try {
      await onUpdate()
      setLastUpdate(new Date().toISOString())
      setConnectionStatus('connected')
    } catch (error) {
      console.error('Erro na atualização em tempo real:', error)
      setConnectionStatus('disconnected')
    } finally {
      isUpdatingRef.current = false
    }
  }, [onUpdate])

  // Iniciar/parar polling
  useEffect(() => {
    if (isRealTimeEnabled) {
      setConnectionStatus('connecting')
      
      // Primeira atualização imediata
      refreshNow()
      
      // Configurar polling
      intervalRef.current = setInterval(() => {
        if (!isUpdatingRef.current) {
          refreshNow()
        }
      }, intervalMs)
    } else {
      // Parar polling
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setConnectionStatus('disconnected')
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRealTimeEnabled, refreshNow, intervalMs])

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Detectar mudança de foco da página para atualizar
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRealTimeEnabled) {
        // Página ficou visível, atualizar dados
        refreshNow()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isRealTimeEnabled, refreshNow])

  // Detectar reconexão da internet
  useEffect(() => {
    const handleOnline = () => {
      if (isRealTimeEnabled) {
        refreshNow()
      }
    }

    const handleOffline = () => {
      setConnectionStatus('disconnected')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isRealTimeEnabled, refreshNow])

  return {
    isRealTimeEnabled,
    setRealTimeEnabled,
    lastUpdate,
    connectionStatus,
    refreshNow
  }
}