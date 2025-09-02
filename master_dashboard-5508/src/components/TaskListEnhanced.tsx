/**
 * Componente TaskList com indicadores de loading e tratamento de erro aprimorado
 * Usa os novos componentes de UI e hooks de estado
 */

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useTaskStore } from '@/store/taskStore'
import { useApiHealth } from '@/hooks/useApiHealth'
import TaskCard from '@/components/tasks/TaskCard'
import { 
  LoadingSpinner, 
  SkeletonList, 
  ErrorMessage,
  PageLoader,
  EmptyState,
  LoadingButton,
  useToast
} from '@/components/ui/LoadingIndicators'

interface TaskListEnhancedProps {
  showFilters?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export function TaskListEnhanced({ 
  showFilters = true, 
  autoRefresh = true,
  refreshInterval = 30000 // 30 segundos
}: TaskListEnhancedProps) {
  const {
    tasks,
    isLoading,
    lastError,
    filters,
    pagination,
    selectedTasks,
    fetchTasks,
    refreshTasks,
    selectTask,
    clearSelection,
    setFilters,
    clearMessages
  } = useTaskStore()
  
  const { isOnline, isConnecting } = useApiHealth()
  const toast = useToast()
  
  // Auto refresh
  useEffect(() => {
    if (autoRefresh && isOnline && !isConnecting) {
      const interval = setInterval(() => {
        fetchTasks(false) // Não forçar, usar cache inteligente
      }, refreshInterval)
      
      return () => clearInterval(interval)
    }
  }, [autoRefresh, isOnline, isConnecting, refreshInterval, fetchTasks])
  
  // Carregamento inicial
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])
  
  // Limpar erro após mostrar
  useEffect(() => {
    if (lastError && !lastError.includes('cache') && !lastError.includes('offline')) {
      const timer = setTimeout(() => clearMessages(), 5000)
      return () => clearTimeout(timer)
    }
  }, [lastError, clearMessages])
  
  const handleRetry = () => {
    toast.info('Tentando reconectar...')
    fetchTasks(true) // Forçar refresh
  }
  
  const handleRefresh = () => {
    refreshTasks()
  }
  
  // Estado de loading inicial
  if (isLoading && tasks.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Tarefas</h2>
          <div className="flex items-center space-x-2">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-gray-600">Carregando tarefas...</span>
          </div>
        </div>
        <SkeletonList count={6} />
      </div>
    )
  }
  
  // Estado de erro sem dados
  if (lastError && tasks.length === 0 && !lastError.includes('cache') && !lastError.includes('offline')) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Tarefas</h2>
        <ErrorMessage 
          message={lastError}
          onRetry={handleRetry}
        />
      </div>
    )
  }
  
  // Estado vazio
  if (!isLoading && tasks.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Tarefas</h2>
          <LoadingButton
            isLoading={isLoading}
            onClick={handleRefresh}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Atualizar
          </LoadingButton>
        </div>
        
        <EmptyState
          title="Nenhuma tarefa encontrada"
          description="Não há tarefas criadas ainda. Crie sua primeira tarefa para começar."
          icon="📝"
          action={
            <Link
              href="/tasks/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Criar Nova Tarefa
            </Link>
          }
        />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Tarefas
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({tasks.length} {tasks.length === 1 ? 'item' : 'itens'})
            </span>
          </h2>
          
          {/* Status de conexão e avisos */}
          <div className="flex items-center space-x-4 mt-2">
            {lastError?.includes('cache') && (
              <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                ⚠️ Dados em cache
              </span>
            )}
            
            {lastError?.includes('offline') && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                📴 Modo offline
              </span>
            )}
            
            {!isOnline && (
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                ❌ Sem conexão
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Seleção múltipla */}
          {selectedTasks.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedTasks.length} selecionadas
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Limpar seleção
              </button>
            </div>
          )}
          
          {/* Botão de atualização */}
          <LoadingButton
            isLoading={isLoading}
            onClick={handleRefresh}
            className="bg-blue-600 text-white hover:bg-blue-700"
            disabled={!isOnline}
          >
            {isLoading ? 'Atualizando...' : 'Atualizar'}
          </LoadingButton>
        </div>
      </div>
      
      {/* Filtros rápidos */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={filters.status?.join(',') || ''}
                onChange={(e) => {
                  const values = e.target.value ? e.target.value.split(',') : []
                  setFilters({ status: values as any })
                }}
                className="text-sm border-gray-300 rounded-md"
              >
                <option value="">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="running">Executando</option>
                <option value="completed">Concluídas</option>
                <option value="failed">Falhadas</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Modelo:</label>
              <select
                value={filters.model?.join(',') || ''}
                onChange={(e) => {
                  const values = e.target.value ? e.target.value.split(',') : []
                  setFilters({ model: values as any })
                }}
                className="text-sm border-gray-300 rounded-md"
              >
                <option value="">Todos</option>
                <option value="haiku">Haiku</option>
                <option value="sonnet">Sonnet</option>
                <option value="opus">Opus</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Buscar:</label>
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => setFilters({ search: e.target.value })}
                placeholder="ID, prompt ou grupo..."
                className="text-sm border-gray-300 rounded-md w-48"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Lista de tarefas */}
      <div className="space-y-4">
        {isLoading && tasks.length > 0 && (
          <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
            <LoadingSpinner size="sm" className="mr-2" />
            <span className="text-sm text-blue-700">Atualizando dados...</span>
          </div>
        )}
        
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isSelected={selectedTasks.includes(task.id)}
            onSelect={selectTask}
            density="comfortable"
          />
        ))}
        
        {/* Loading mais itens */}
        {pagination.hasNext && (
          <div className="text-center py-4">
            <LoadingButton
              isLoading={isLoading}
              onClick={() => {
                // TODO: Implementar carregamento de próxima página
                toast.info('Carregamento de paginação em desenvolvimento')
              }}
              className="bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Carregar mais
            </LoadingButton>
          </div>
        )}
      </div>
      
      {/* Erro de conexão flutuante */}
      {lastError && !lastError.includes('cache') && !lastError.includes('offline') && tasks.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-sm">
            <div className="flex items-start">
              <span className="text-red-400 mr-2">⚠️</span>
              <div className="flex-1">
                <p className="text-sm text-red-700">
                  Problema na conexão: {lastError}
                </p>
                <button
                  onClick={handleRetry}
                  className="mt-2 text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                >
                  Tentar novamente
                </button>
              </div>
              <button
                onClick={clearMessages}
                className="text-red-400 hover:text-red-600 ml-2"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskListEnhanced