/**
 * Store Zustand para gerenciamento de estado das tarefas
 * Gerencia tarefas, filtros, cache e estado da aplicação
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Task, TaskData, TaskFilters, TaskAnalyticsData, TaskStatus, SavedFilter, TaskPagination, TaskViewMode } from '@/types/task'
import { MCPApiService } from '@/services/mcp-api'

interface TaskStoreState {
  // Estado das tarefas
  tasks: Task[]
  currentTask: Task | null
  isLoading: boolean
  lastFetch: Date | null
  
  // Filtros e busca
  filters: TaskFilters
  savedFilters: SavedFilter[]
  activeFilterId: string | null
  
  // Paginação
  pagination: TaskPagination
  
  // Visualização
  viewMode: TaskViewMode
  selectedTasks: string[]
  
  // Analytics
  analytics: TaskAnalyticsData | null
  analyticsLastFetch: Date | null
  
  // Cache de identificadores existentes
  existingTaskIdentifiers: string[]
  
  // Estados de operação
  isCreating: boolean
  isDeleting: boolean
  isBulkActionInProgress: boolean
  
  // Notificações e erros
  lastError: string | null
  successMessage: string | null
  
  // Ações básicas de tarefas
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  removeTask: (taskId: string) => void
  clearTasks: () => void
  
  // Ações de carregamento
  fetchTasks: (force?: boolean) => Promise<void>
  fetchTaskById: (taskId: string) => Promise<Task | null>
  refreshTasks: () => Promise<void>
  
  // Ações de criação
  createTask: (taskData: TaskData) => Promise<Task | null>
  
  // Ações de filtro
  setFilters: (filters: Partial<TaskFilters>) => void
  resetFilters: () => void
  saveFilter: (name: string, filters: TaskFilters) => void
  loadFilter: (filterId: string) => void
  deleteFilter: (filterId: string) => void
  
  // Ações de seleção
  selectTask: (taskId: string) => void
  selectMultipleTasks: (taskIds: string[]) => void
  clearSelection: () => void
  selectAll: () => void
  
  // Ações de visualização
  setViewMode: (mode: TaskViewMode) => void
  setPagination: (pagination: Partial<TaskPagination>) => void
  
  // Analytics
  fetchAnalytics: (force?: boolean) => Promise<void>
  
  // Operações em lote
  bulkDelete: (taskIds: string[]) => Promise<boolean>
  bulkUpdateStatus: (taskIds: string[], status: TaskStatus) => Promise<boolean>
  
  // Cache e identificadores
  fetchExistingTasks: () => Promise<void>
  
  // Utilidades
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSuccess: (message: string | null) => void
  clearMessages: () => void
}

// Estado inicial dos filtros
const defaultFilters: TaskFilters = {
  search: '',
  status: [],
  model: [],
  dateRange: {
    start: null,
    end: null
  },
  complexity: [0, 150],
  orchestrationGroup: '',
  sortBy: 'created_at',
  sortOrder: 'desc'
}

// Estado inicial da paginação
const defaultPagination: TaskPagination = {
  currentPage: 1,
  pageSize: 20,
  totalPages: 1,
  totalItems: 0,
  hasNext: false,
  hasPrev: false
}

// Estado inicial da visualização
const defaultViewMode: TaskViewMode = {
  mode: 'cards',
  density: 'comfortable'
}

export const useTaskStore = create<TaskStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        tasks: [],
        currentTask: null,
        isLoading: false,
        lastFetch: null,
        
        filters: { ...defaultFilters },
        savedFilters: [],
        activeFilterId: null,
        
        pagination: { ...defaultPagination },
        viewMode: { ...defaultViewMode },
        selectedTasks: [],
        
        analytics: null,
        analyticsLastFetch: null,
        
        existingTaskIdentifiers: [],
        
        isCreating: false,
        isDeleting: false,
        isBulkActionInProgress: false,
        
        lastError: null,
        successMessage: null,
        
        // Ações básicas
        setTasks: (tasks) => set({ tasks }),
        
        addTask: (task) => 
          set((state) => ({ 
            tasks: [task, ...state.tasks],
            existingTaskIdentifiers: [...state.existingTaskIdentifiers, task.task_identifier]
          })),
        
        updateTask: (taskId, updates) =>
          set((state) => ({
            tasks: state.tasks.map(task =>
              task.id === taskId ? { ...task, ...updates } : task
            ),
            currentTask: state.currentTask?.id === taskId 
              ? { ...state.currentTask, ...updates }
              : state.currentTask
          })),
        
        removeTask: (taskId) =>
          set((state) => ({
            tasks: state.tasks.filter(task => task.id !== taskId),
            selectedTasks: state.selectedTasks.filter(id => id !== taskId),
            currentTask: state.currentTask?.id === taskId ? null : state.currentTask
          })),
        
        clearTasks: () => 
          set({ 
            tasks: [], 
            selectedTasks: [], 
            currentTask: null,
            existingTaskIdentifiers: []
          }),
        
        // Carregamento de tarefas com cache inteligente
        fetchTasks: async (force = false) => {
          const state = get()
          const now = new Date()
          
          // Verificar se precisa recarregar (cache de 30 segundos)
          if (!force && state.lastFetch && 
              (now.getTime() - state.lastFetch.getTime()) < 30000) {
            return
          }
          
          set({ isLoading: true, lastError: null })
          
          try {
            // Tentar buscar dados cached primeiro se não forçado
            if (!force && state.tasks.length > 0 && state.lastFetch) {
              const timeSinceLastFetch = now.getTime() - state.lastFetch.getTime()
              if (timeSinceLastFetch < 15000) { // Cache de 15 segundos para não forçado
                set({ isLoading: false })
                return
              }
            }
            
            const { tasks, total, filtered } = await MCPApiService.listTasksWithFilters(
              state.filters,
              state.pagination.pageSize,
              (state.pagination.currentPage - 1) * state.pagination.pageSize
            )
            
            const totalPages = Math.ceil(total / state.pagination.pageSize)
            
            set({
              tasks,
              lastFetch: now,
              pagination: {
                ...state.pagination,
                totalItems: total,
                totalPages,
                hasNext: state.pagination.currentPage < totalPages,
                hasPrev: state.pagination.currentPage > 1
              }
            })
            
            // Limpar cache expirado da API
            MCPApiService.cleanExpiredCache()
          } catch (error) {
            // Se há dados em cache e ocorreu erro, usar dados em cache
            if (state.tasks.length > 0 && state.lastFetch) {
              console.warn('Erro ao buscar dados, usando cache local:', error)
              set({ 
                lastError: `Usando dados em cache - ${error instanceof Error ? error.message : 'Erro de conexão'}`,
                isLoading: false
              })
              return
            }
            
            // Se não há cache, tentar usar dados mock como fallback
            try {
              console.log('Tentando usar dados mock como fallback...')
              const mockData = await MCPApiService.getMockData()
              set({
                tasks: mockData.tasks,
                lastFetch: now,
                lastError: 'Modo offline ativo - usando dados de exemplo',
                pagination: {
                  ...state.pagination,
                  totalItems: mockData.tasks.length,
                  totalPages: 1,
                  hasNext: false,
                  hasPrev: false
                }
              })
            } catch (mockError) {
              set({ 
                lastError: error instanceof Error ? error.message : 'Erro ao carregar tarefas' 
              })
            }
          } finally {
            set({ isLoading: false })
          }
        },
        
        fetchTaskById: async (taskId) => {
          set({ isLoading: true, lastError: null })
          
          try {
            const task = await MCPApiService.getTaskStatus(taskId)
            set({ currentTask: task })
            return task
          } catch (error) {
            set({ 
              lastError: error instanceof Error ? error.message : 'Erro ao carregar tarefa' 
            })
            return null
          } finally {
            set({ isLoading: false })
          }
        },
        
        refreshTasks: () => get().fetchTasks(true),
        
        // Criação de tarefa
        createTask: async (taskData) => {
          set({ isCreating: true, lastError: null })
          
          try {
            const newTask = await MCPApiService.createTask(taskData)
            get().addTask(newTask)
            set({ successMessage: `Tarefa "${newTask.task_identifier}" criada com sucesso!` })
            return newTask
          } catch (error) {
            set({ 
              lastError: error instanceof Error ? error.message : 'Erro ao criar tarefa' 
            })
            return null
          } finally {
            set({ isCreating: false })
          }
        },
        
        // Ações de filtro
        setFilters: (newFilters) =>
          set((state) => ({
            filters: { ...state.filters, ...newFilters },
            pagination: { ...state.pagination, currentPage: 1 }
          })),
        
        resetFilters: () => 
          set({ 
            filters: { ...defaultFilters },
            pagination: { ...defaultPagination }
          }),
        
        saveFilter: (name, filters) =>
          set((state) => ({
            savedFilters: [
              ...state.savedFilters,
              {
                id: Date.now().toString(),
                name,
                filters,
                createdAt: new Date().toISOString(),
                isDefault: false
              }
            ]
          })),
        
        loadFilter: (filterId) => {
          const state = get()
          const savedFilter = state.savedFilters.find(f => f.id === filterId)
          if (savedFilter) {
            set({ 
              filters: { ...savedFilter.filters },
              activeFilterId: filterId,
              pagination: { ...defaultPagination }
            })
          }
        },
        
        deleteFilter: (filterId) =>
          set((state) => ({
            savedFilters: state.savedFilters.filter(f => f.id !== filterId),
            activeFilterId: state.activeFilterId === filterId ? null : state.activeFilterId
          })),
        
        // Seleção
        selectTask: (taskId) =>
          set((state) => ({
            selectedTasks: state.selectedTasks.includes(taskId)
              ? state.selectedTasks.filter(id => id !== taskId)
              : [...state.selectedTasks, taskId]
          })),
        
        selectMultipleTasks: (taskIds) =>
          set({ selectedTasks: taskIds }),
        
        clearSelection: () => set({ selectedTasks: [] }),
        
        selectAll: () =>
          set((state) => ({
            selectedTasks: state.tasks.map(task => task.id)
          })),
        
        // Visualização
        setViewMode: (mode) => set({ viewMode: mode }),
        
        setPagination: (pagination) =>
          set((state) => ({
            pagination: { ...state.pagination, ...pagination }
          })),
        
        // Analytics
        fetchAnalytics: async (force = false) => {
          const state = get()
          const now = new Date()
          
          // Cache de 5 minutos para analytics
          if (!force && state.analyticsLastFetch && 
              (now.getTime() - state.analyticsLastFetch.getTime()) < 300000) {
            return
          }
          
          try {
            const analytics = await MCPApiService.getTaskAnalytics()
            set({ 
              analytics, 
              analyticsLastFetch: now 
            })
          } catch (error) {
            // Se há dados de analytics em cache, usar eles
            if (state.analytics && state.analyticsLastFetch) {
              console.warn('Erro ao buscar analytics, usando cache:', error)
              set({ 
                lastError: `Analytics em cache - ${error instanceof Error ? error.message : 'Erro de conexão'}`
              })
              return
            }
            
            // Tentar usar dados mock
            try {
              const mockData = await MCPApiService.getMockData()
              set({
                analytics: mockData.analytics,
                analyticsLastFetch: now,
                lastError: 'Analytics em modo offline - usando dados de exemplo'
              })
            } catch (mockError) {
              set({ 
                lastError: error instanceof Error ? error.message : 'Erro ao carregar analytics' 
              })
            }
          }
        },
        
        // Operações em lote
        bulkDelete: async (taskIds) => {
          set({ isBulkActionInProgress: true, lastError: null })
          
          try {
            const result = await MCPApiService.bulkDeleteTasks(taskIds)
            
            if (result.success) {
              // Remover tarefas deletadas do estado
              set((state) => ({
                tasks: state.tasks.filter(task => !taskIds.includes(task.id)),
                selectedTasks: state.selectedTasks.filter(id => !taskIds.includes(id)),
                successMessage: `${result.processed} tarefas deletadas com sucesso!`
              }))
              return true
            } else {
              set({ 
                lastError: `Erro ao deletar tarefas: ${result.errors?.join(', ') || 'Erro desconhecido'}` 
              })
              return false
            }
          } catch (error) {
            set({ 
              lastError: error instanceof Error ? error.message : 'Erro ao deletar tarefas' 
            })
            return false
          } finally {
            set({ isBulkActionInProgress: false })
          }
        },
        
        bulkUpdateStatus: async (taskIds, status) => {
          set({ isBulkActionInProgress: true, lastError: null })
          
          try {
            const result = await MCPApiService.bulkUpdateTaskStatus(taskIds, status)
            
            if (result.success) {
              // Atualizar status das tarefas no estado
              set((state) => ({
                tasks: state.tasks.map(task =>
                  taskIds.includes(task.id) ? { ...task, status } : task
                ),
                successMessage: `Status de ${result.processed} tarefas atualizado!`
              }))
              return true
            } else {
              set({ 
                lastError: `Erro ao atualizar status: ${result.errors?.join(', ') || 'Erro desconhecido'}` 
              })
              return false
            }
          } catch (error) {
            set({ 
              lastError: error instanceof Error ? error.message : 'Erro ao atualizar status' 
            })
            return false
          } finally {
            set({ isBulkActionInProgress: false })
          }
        },
        
        // Cache
        fetchExistingTasks: async () => {
          try {
            const identifiers = await MCPApiService.getExistingTaskIdentifiers()
            set({ existingTaskIdentifiers: identifiers })
          } catch (error) {
            console.error('Erro ao carregar identificadores existentes:', error)
          }
        },
        
        // Utilidades
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ lastError: error }),
        setSuccess: (message) => set({ successMessage: message }),
        clearMessages: () => set({ lastError: null, successMessage: null })
      }),
      {
        name: 'claude-cto-task-store',
        partialize: (state) => ({
          // Persistir apenas dados importantes, não estado transitório
          savedFilters: state.savedFilters,
          viewMode: state.viewMode,
          filters: state.filters
        })
      }
    ),
    {
      name: 'TaskStore'
    }
  )
)

// Hooks customizados para facilitar o uso
export const useTaskFilters = () => {
  const filters = useTaskStore((state) => state.filters)
  const setFilters = useTaskStore((state) => state.setFilters)
  const resetFilters = useTaskStore((state) => state.resetFilters)
  
  return { filters, setFilters, resetFilters }
}

export const useTaskSelection = () => {
  const selectedTasks = useTaskStore((state) => state.selectedTasks)
  const selectTask = useTaskStore((state) => state.selectTask)
  const selectMultipleTasks = useTaskStore((state) => state.selectMultipleTasks)
  const clearSelection = useTaskStore((state) => state.clearSelection)
  const selectAll = useTaskStore((state) => state.selectAll)
  
  return { 
    selectedTasks, 
    selectTask, 
    selectMultipleTasks, 
    clearSelection, 
    selectAll,
    hasSelection: selectedTasks.length > 0,
    selectedCount: selectedTasks.length
  }
}

export const useTaskOperations = () => {
  const createTask = useTaskStore((state) => state.createTask)
  const bulkDelete = useTaskStore((state) => state.bulkDelete)
  const bulkUpdateStatus = useTaskStore((state) => state.bulkUpdateStatus)
  const refreshTasks = useTaskStore((state) => state.refreshTasks)
  
  const isCreating = useTaskStore((state) => state.isCreating)
  const isBulkActionInProgress = useTaskStore((state) => state.isBulkActionInProgress)
  
  return {
    createTask,
    bulkDelete,
    bulkUpdateStatus,
    refreshTasks,
    isCreating,
    isBulkActionInProgress
  }
}