/**
 * Componente para visualizar logs de erro - útil para administradores
 */

import React, { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Clock, Trash2, Download, RefreshCw, Filter, X } from 'lucide-react'
import { ErrorHandlingService, ErrorLogEntry } from '@/services/errorHandlingService'

interface ErrorLogViewerProps {
  maxEntries?: number
  autoRefresh?: boolean
  refreshInterval?: number
  className?: string
}

const ErrorLogViewer: React.FC<ErrorLogViewerProps> = ({
  maxEntries = 50,
  autoRefresh = false,
  refreshInterval = 5000,
  className = ''
}) => {
  const [logs, setLogs] = useState<ErrorLogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ErrorLogEntry[]>([])
  const [filter, setFilter] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<ErrorLogEntry | null>(null)

  // Atualiza logs
  const refreshLogs = useCallback(() => {
    const newLogs = ErrorHandlingService.getErrorLogs(maxEntries)
    setLogs(newLogs)
  }, [maxEntries])

  // Auto refresh
  useEffect(() => {
    refreshLogs()
    
    if (autoRefresh) {
      const interval = setInterval(refreshLogs, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [maxEntries, autoRefresh, refreshInterval, refreshLogs])

  // Filtragem
  useEffect(() => {
    if (!filter.trim()) {
      setFilteredLogs(logs)
    } else {
      const filtered = logs.filter(log => 
        log.error.message.toLowerCase().includes(filter.toLowerCase()) ||
        log.context.toLowerCase().includes(filter.toLowerCase()) ||
        log.error.name.toLowerCase().includes(filter.toLowerCase())
      )
      setFilteredLogs(filtered)
    }
  }, [logs, filter])

  const handleClearLogs = () => {
    ErrorHandlingService.clearErrorLogs()
    refreshLogs()
  }

  const handleExportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR')
  }

  const getErrorSeverityColor = (error: Error) => {
    if (error.name.includes('Network') || error.name.includes('Timeout')) {
      return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
    }
    if (error.name.includes('Api') && error.message.includes('50')) {
      return 'text-red-600 bg-red-100 dark:bg-red-900/30'
    }
    return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Logs de Erro
            </h3>
            <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full">
              {filteredLogs.length}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshLogs}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Atualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleExportLogs}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Exportar logs"
              disabled={logs.length === 0}
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleClearLogs}
              className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Limpar logs"
              disabled={logs.length === 0}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filtro */}
        <div className="mt-3 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar por mensagem, contexto ou tipo de erro..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Lista de erros */}
      <div className="max-h-96 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {filter ? 'Nenhum erro encontrado com o filtro atual' : 'Nenhum erro registrado'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLogs.map((log, index) => (
              <div
                key={`${log.timestamp}-${index}`}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => setSelectedEntry(log)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full mr-2 ${getErrorSeverityColor(log.error)}`}>
                        {log.error.name}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {log.context}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {log.error.message}
                    </p>
                    
                    <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(log.timestamp)}
                      
                      {log.url && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="truncate max-w-48">{log.url}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalhes do erro */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Detalhes do Erro
              </h3>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo do Erro
                  </label>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getErrorSeverityColor(selectedEntry.error)}`}>
                    {selectedEntry.error.name}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contexto
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedEntry.context}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mensagem
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedEntry.error.message}</p>
                </div>

                {selectedEntry.error.stack && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stack Trace
                    </label>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded-md overflow-x-auto text-gray-800 dark:text-gray-200">
                      {selectedEntry.error.stack}
                    </pre>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Timestamp
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedEntry.timestamp)}</p>
                  </div>

                  {selectedEntry.url && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        URL
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white break-all">{selectedEntry.url}</p>
                    </div>
                  )}
                </div>

                {selectedEntry.userAgent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      User Agent
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 break-all">{selectedEntry.userAgent}</p>
                  </div>
                )}

                {selectedEntry.additional && Object.keys(selectedEntry.additional).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Informações Adicionais
                    </label>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded-md overflow-x-auto text-gray-800 dark:text-gray-200">
                      {JSON.stringify(selectedEntry.additional, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ErrorLogViewer