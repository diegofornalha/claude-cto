/**
 * Lista de Tarefas Ultra - Dashboard Master Next.js
 * Migração completa do dashboard Python Streamlit para Next.js
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { NextPage } from 'next'
import Head from 'next/head'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  TableCellsIcon,
  Squares2X2Icon,
  ArrowPathIcon,
  TrashIcon,
  PauseIcon,
  PlayIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

// Importações locais
import { Task, TaskStatus, TaskModel, TaskAnalyticsData } from '@/types/task'
import { MCPApiService } from '@/services/mcp-api'
import TaskGrid from '@/components/tasks/TaskGrid'
import TaskFilters from '@/components/tasks/TaskFilters'
import TaskCard from '@/components/tasks/TaskCard'
import ExportButton from '@/components/tasks/ExportButton'
import TaskAnalytics from '@/components/tasks/TaskAnalytics'
import { useTaskList } from '@/hooks/useTaskList'
import { useTaskFilters } from '@/hooks/useTaskFilters'
import { useTaskSelection } from '@/hooks/useTaskSelection'
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates'

const TaskListPage: NextPage = () => {
  // Estados principais
  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(true)
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)

  // Custom hooks
  const {
    tasks,
    loading,
    error,
    totalCount,
    refreshTasks,
    bulkDeleteTasks,
    bulkUpdateStatus
  } = useTaskList()

  const {
    filters,
    setFilters,
    filteredTasks,
    appliedFiltersCount
  } = useTaskFilters(tasks)

  const {
    selectedTasks,
    toggleTaskSelection,
    selectAllTasks,
    clearSelection,
    isTaskSelected
  } = useTaskSelection()

  const {
    isRealTimeEnabled,
    setRealTimeEnabled,
    lastUpdate,
    connectionStatus
  } = useRealTimeUpdates(refreshTasks, 30000) // 30 segundos

  // Dados paginados
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredTasks.slice(startIndex, endIndex)
  }, [filteredTasks, currentPage, pageSize])

  const totalPages = Math.ceil(filteredTasks.length / pageSize)

  // Analytics calculados
  const analyticsData: TaskAnalyticsData = useMemo(() => {
    const totalTasks = filteredTasks.length
    if (totalTasks === 0) {
      return {
        totalTasks: 0,
        statusCounts: {} as Record<TaskStatus, number>,
        successRate: 0,
        avgExecutionTime: 0,
        modelDistribution: {} as Record<TaskModel, number>,
        complexityDistribution: {},
        trendsData: [],
        performanceMetrics: {
          throughput: 0,
          errorRate: 0,
          avgResponseTime: 0
        }
      }
    }

    // Contagem por status
    const statusCounts = filteredTasks.reduce((acc, task) => {
      const status = task.status || 'pending'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<TaskStatus, number>)

    // Taxa de sucesso
    const successRate = ((statusCounts.completed || 0) / totalTasks) * 100

    // Distribuição por modelo
    const modelDistribution = filteredTasks.reduce((acc, task) => {
      const model = task.model || 'sonnet'
      acc[model] = (acc[model] || 0) + 1
      return acc
    }, {} as Record<TaskModel, number>)

    // Simulação de tempo médio e complexidade
    const avgExecutionTime = filteredTasks.reduce((acc, task) => {
      return acc + (task._metadata?.complexity_score || 30)
    }, 0) / totalTasks

    // Dados de tendência simulados
    const trendsData = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      count: Math.floor(Math.random() * 20) + 5
    }))

    return {
      totalTasks,
      statusCounts,
      successRate: Math.round(successRate * 10) / 10,
      avgExecutionTime: Math.round(avgExecutionTime * 10) / 10,
      modelDistribution,
      complexityDistribution: {
        'Simples': Math.floor(totalTasks * 0.3),
        'Moderada': Math.floor(totalTasks * 0.4),
        'Complexa': Math.floor(totalTasks * 0.2),
        'Muito Complexa': Math.floor(totalTasks * 0.1)
      },
      trendsData,
      performanceMetrics: {
        throughput: Math.round(totalTasks / 30 * 100) / 100, // Tasks per day
        errorRate: Math.round((1 - successRate / 100) * 100 * 100) / 100,
        avgResponseTime: avgExecutionTime
      }
    }
  }, [filteredTasks])

  // Handlers
  const handleBulkDelete = useCallback(async () => {
    if (selectedTasks.size === 0) return
    
    try {
      await bulkDeleteTasks(Array.from(selectedTasks))
      clearSelection()
    } catch (err) {
      console.error('Erro ao deletar tarefas:', err)
    }
  }, [selectedTasks, bulkDeleteTasks, clearSelection])

  const handleBulkStatusUpdate = useCallback(async (newStatus: TaskStatus) => {
    if (selectedTasks.size === 0) return
    
    try {
      await bulkUpdateStatus(Array.from(selectedTasks), newStatus)
      clearSelection()
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    }
  }, [selectedTasks, bulkUpdateStatus, clearSelection])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Head>
        <title>Lista de Tarefas Ultra - Claude CTO</title>
        <meta name="description" content="Dashboard avançado para gerenciamento de tarefas Claude CTO" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      📋 Lista de Tarefas Ultra
                    </h1>
                  </div>
                  
                  {connectionStatus && (
                    <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                      <span>Atualizado:</span>
                      <span className="font-mono">
                        {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Nunca'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {/* Toggle Real-time */}
                  <button
                    onClick={() => setRealTimeEnabled(!isRealTimeEnabled)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isRealTimeEnabled
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <ArrowPathIcon className={`w-4 h-4 ${isRealTimeEnabled ? 'animate-spin' : ''}`} />
                    <span>Real-time</span>
                  </button>

                  {/* Toggle Analytics */}
                  <button
                    onClick={() => setShowAnalytics(!showAnalytics)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      showAnalytics
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <ChartBarIcon className="w-4 h-4" />
                    <span>Analytics</span>
                  </button>

                  {/* Toggle Filters */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      showFilters
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <FunnelIcon className="w-4 h-4" />
                    <span>Filtros {appliedFiltersCount > 0 && `(${appliedFiltersCount})`}</span>
                  </button>

                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      <TableCellsIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'cards'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      <Squares2X2Icon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Analytics Dashboard */}
          {showAnalytics && (
            <div className="mb-8">
              <TaskAnalytics data={analyticsData} />
            </div>
          )}

          {/* Filtros Avançados */}
          {showFilters && (
            <div className="mb-8">
              <TaskFilters 
                filters={filters}
                onFiltersChange={setFilters}
                tasksCount={filteredTasks.length}
              />
            </div>
          )}

          {/* Busca e Ações */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Busca */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Busca fuzzy por ID, prompt ou grupo..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Ações em lote */}
              {selectedTasks.size > 0 && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedTasks.size} selecionadas
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleBulkStatusUpdate('pending')}
                      className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      <PlayIcon className="w-4 h-4" />
                      <span>Retomar</span>
                    </button>
                    
                    <button
                      onClick={() => handleBulkStatusUpdate('pending')} // Simulando pause
                      className="flex items-center space-x-1 px-3 py-2 text-sm bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/40 transition-colors"
                    >
                      <PauseIcon className="w-4 h-4" />
                      <span>Pausar</span>
                    </button>
                    
                    <button
                      onClick={handleBulkDelete}
                      className="flex items-center space-x-1 px-3 py-2 text-sm bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>Deletar</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Export */}
              <div className="flex items-center space-x-3">
                <ExportButton 
                  tasks={filteredTasks} 
                  selectedOnly={selectedTasks.size > 0}
                  selectedTasks={Array.from(selectedTasks)}
                />
                
                <button
                  onClick={refreshTasks}
                  disabled={loading}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Atualizar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Lista/Grid de Tarefas */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            {error ? (
              <div className="p-8 text-center">
                <div className="text-red-500 dark:text-red-400 mb-2">❌ Erro ao carregar tarefas</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{error}</div>
                <button 
                  onClick={refreshTasks}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            ) : loading ? (
              <div className="p-8 text-center">
                <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto text-slate-400 mb-4" />
                <div className="text-slate-600 dark:text-slate-400">Carregando tarefas...</div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-slate-500 dark:text-slate-400 mb-2">📭 Nenhuma tarefa encontrada</div>
                <div className="text-sm text-slate-400 dark:text-slate-500">
                  {appliedFiltersCount > 0 ? 'Ajuste os filtros' : 'Crie sua primeira tarefa'} 
                </div>
              </div>
            ) : (
              <>
                {/* Informações de Paginação */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Mostrando {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredTasks.length)} de {filteredTasks.length} tarefas
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <label className="text-sm text-slate-600 dark:text-slate-400">
                        Itens por página:
                        <select 
                          value={pageSize} 
                          onChange={(e) => {
                            setPageSize(Number(e.target.value))
                            setCurrentPage(1)
                          }}
                          className="ml-2 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </label>
                      
                      {filteredTasks.length > 0 && (
                        <button
                          onClick={() => selectAllTasks(paginatedTasks.map(t => t.task_identifier))}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          Selecionar todos desta página
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Conteúdo das Tarefas */}
                <div className="p-6">
                  {viewMode === 'grid' ? (
                    <TaskGrid
                      tasks={paginatedTasks}
                      selectedTasks={selectedTasks}
                      onTaskSelect={toggleTaskSelection}
                      onSelectAll={selectAllTasks}
                      isTaskSelected={isTaskSelected}
                      sortBy={filters.sortBy}
                      sortOrder={filters.sortOrder}
                      onSort={(field, order) => setFilters(prev => ({ ...prev, sortBy: field, sortOrder: order }))}
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {paginatedTasks.map((task) => (
                        <TaskCard
                          key={task.task_identifier}
                          task={task}
                          isSelected={isTaskSelected(task.task_identifier)}
                          onSelect={toggleTaskSelection}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                      >
                        ⏮️ Primeira
                      </button>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                        >
                          ◀️ Anterior
                        </button>

                        <span className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">
                          Página {currentPage} de {totalPages}
                        </span>

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                        >
                          ▶️ Próxima
                        </button>
                      </div>

                      <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                      >
                        ⏭️ Última
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default TaskListPage