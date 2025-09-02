import { motion } from 'framer-motion'
import { Clock, User, FileText, Trash2, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface AuditEntry {
  id: string
  timestamp: Date
  action: 'delete' | 'clear' | 'restore' | 'create' | 'update'
  user: string
  target: string
  details: string
  status: 'success' | 'error' | 'warning'
  metadata?: Record<string, any>
}

interface AuditLogProps {
  entries: AuditEntry[]
  maxEntries?: number
  autoRefresh?: boolean
  className?: string
}

const actionIcons = {
  delete: Trash2,
  clear: FileText,
  restore: RotateCcw,
  create: CheckCircle,
  update: FileText
}

const actionColors = {
  delete: 'text-red-500 bg-red-100 dark:bg-red-900',
  clear: 'text-orange-500 bg-orange-100 dark:bg-orange-900',
  restore: 'text-blue-500 bg-blue-100 dark:bg-blue-900',
  create: 'text-green-500 bg-green-100 dark:bg-green-900',
  update: 'text-purple-500 bg-purple-100 dark:bg-purple-900'
}

const statusColors = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
}

export default function AuditLog({ 
  entries, 
  maxEntries = 50, 
  autoRefresh = true,
  className = ''
}: AuditLogProps) {
  const [filteredEntries, setFilteredEntries] = useState<AuditEntry[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState<string>('')

  useEffect(() => {
    let filtered = entries.slice(0, maxEntries)

    if (filter !== 'all') {
      filtered = filtered.filter(entry => entry.action === filter)
    }

    if (search) {
      filtered = filtered.filter(entry => 
        entry.target.toLowerCase().includes(search.toLowerCase()) ||
        entry.details.toLowerCase().includes(search.toLowerCase()) ||
        entry.user.toLowerCase().includes(search.toLowerCase())
      )
    }

    setFilteredEntries(filtered)
  }, [entries, filter, search, maxEntries])

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'agora mesmo'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`
    return `${Math.floor(diffInSeconds / 86400)}d atrás`
  }

  const getActionLabel = (action: string) => {
    const labels = {
      delete: 'Deletou',
      clear: 'Limpou',
      restore: 'Restaurou',
      create: 'Criou',
      update: 'Atualizou'
    }
    return labels[action as keyof typeof labels] || action
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Log de Auditoria
          </h3>
        </div>
        {autoRefresh && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Auto-refresh ativo</span>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar no log..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">Todas as ações</option>
          <option value="delete">Deletar</option>
          <option value="clear">Limpar</option>
          <option value="restore">Restaurar</option>
          <option value="create">Criar</option>
          <option value="update">Atualizar</option>
        </select>
      </div>

      {/* Log Entries */}
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum registro encontrado</p>
          </div>
        ) : (
          filteredEntries.map((entry, index) => {
            const ActionIcon = actionIcons[entry.action]
            const actionColor = actionColors[entry.action]
            const statusColor = statusColors[entry.status]

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                {/* Icon */}
                <div className={`p-2 rounded-full ${actionColor}`}>
                  <ActionIcon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {entry.user}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {getActionLabel(entry.action)}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {entry.target}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                        {entry.status === 'success' ? 'Sucesso' : 
                         entry.status === 'error' ? 'Erro' : 'Atenção'}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {entry.details}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(entry.timestamp)}</span>
                    </div>
                    {entry.metadata && (
                      <span className="text-gray-400">
                        ID: {entry.metadata.taskId || entry.id.slice(0, 8)}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {filteredEntries.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{filteredEntries.length} registros exibidos</span>
            <span>Último update: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #374151;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #6b7280;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  )
}