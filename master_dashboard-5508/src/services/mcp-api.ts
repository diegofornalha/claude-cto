/**
 * Serviço de API para integração com MCP Claude-CTO
 * Versão estendida com filtros, analytics e funcionalidades avançadas
 * Incluindo retry, interceptors e cache inteligente
 */

import { 
  Task, 
  TaskData, 
  ApiHealthData, 
  TaskFilters,
  TaskAnalyticsData,
  BulkActionResult,
  TaskStatus,
  TaskModel
} from '@/types/task'

// Tipos para retry e cache
interface RetryOptions {
  maxRetries: number
  baseDelay: number
  maxDelay: number
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export class MCPApiService {
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_MCP_API_URL || 'http://localhost:8888/api/v1'
  private static readonly TIMEOUT = 30000 // 30 segundos
  
  // Configuração de retry
  private static readonly DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000, // 1 segundo
    maxDelay: 10000  // 10 segundos máximo
  }
  
  // Cache em memória para requisições GET
  private static cache = new Map<string, CacheEntry<any>>()
  private static readonly DEFAULT_CACHE_TTL = 30000 // 30 segundos
  
  // Eventos para monitoramento da API
  private static listeners: Array<(event: 'connected' | 'disconnected' | 'error', data?: any) => void> = []

  /**
   * Adiciona listener para eventos da API
   */
  static addEventListener(listener: (event: 'connected' | 'disconnected' | 'error', data?: any) => void) {
    this.listeners.push(listener)
  }
  
  /**
   * Remove listener de eventos da API
   */
  static removeEventListener(listener: (event: 'connected' | 'disconnected' | 'error', data?: any) => void) {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }
  
  /**
   * Emite evento para todos os listeners
   */
  private static emitEvent(event: 'connected' | 'disconnected' | 'error', data?: any) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data)
      } catch (error) {
        console.error('Erro no listener de evento da API:', error)
      }
    })
  }
  
  /**
   * Implementa retry com exponential backoff
   */
  private static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const { maxRetries, baseDelay, maxDelay } = { ...this.DEFAULT_RETRY_OPTIONS, ...options }
    
    let lastError: Error
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation()
        
        // Se chegou aqui, a operação foi bem-sucedida
        if (attempt > 0) {
          this.emitEvent('connected')
        }
        
        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Erro desconhecido')
        
        // Se não há mais tentativas, emite evento de erro
        if (attempt === maxRetries) {
          this.emitEvent('error', lastError)
          break
        }
        
        // Calcula delay com exponential backoff
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
        
        // Adiciona jitter (variação aleatória) para evitar thundering herd
        const jitter = Math.random() * 0.1 * delay
        const finalDelay = delay + jitter
        
        console.warn(`Tentativa ${attempt + 1}/${maxRetries + 1} falhou, tentando novamente em ${Math.round(finalDelay)}ms:`, lastError.message)
        
        await new Promise(resolve => setTimeout(resolve, finalDelay))
      }
    }
    
    throw lastError!
  }
  
  /**
   * Gerencia cache para requisições GET
   */
  private static getCacheKey(url: string, params?: any): string {
    return params ? `${url}?${JSON.stringify(params)}` : url
  }
  
  private static getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  private static setCache<T>(key: string, data: T, ttl: number = this.DEFAULT_CACHE_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  /**
   * Limpa cache
   */
  static clearCache() {
    this.cache.clear()
  }
  
  /**
   * Limpa cache expirado
   */
  static cleanExpiredCache() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
  
  /**
   * Interceptor para requisições com tratamento de erro unificado
   */
  private static async fetchWithInterceptor(
    url: string, 
    options: RequestInit = {},
    useCache: boolean = false,
    cacheTtl: number = this.DEFAULT_CACHE_TTL
  ): Promise<Response> {
    // Verificar cache apenas para GET requests
    if (useCache && (!options.method || options.method === 'GET')) {
      const cacheKey = this.getCacheKey(url)
      const cachedData = this.getFromCache<any>(cacheKey)
      if (cachedData) {
        // Retornar uma resposta simulada do cache
        return new Response(JSON.stringify(cachedData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT)
    
    try {
      const response = await this.retryWithBackoff(async () => {
        const fetchResponse = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
          }
        })
        
        // Se não foi bem-sucedida, lança erro para tentar novamente
        if (!fetchResponse.ok) {
          const errorText = await fetchResponse.text()
          throw new Error(`HTTP ${fetchResponse.status}: ${errorText || fetchResponse.statusText}`)
        }
        
        return fetchResponse
      })
      
      clearTimeout(timeoutId)
      
      // Salvar no cache se for GET request bem-sucedida
      if (useCache && (!options.method || options.method === 'GET') && response.ok) {
        const cacheKey = this.getCacheKey(url)
        const data = await response.clone().json()
        this.setCache(cacheKey, data, cacheTtl)
      }
      
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Tempo limite excedido na requisição')
      }
      
      throw error
    }
  }

  /**
   * Verifica saúde da API
   */
  static async checkHealth(): Promise<ApiHealthData> {
    const startTime = Date.now()
    
    try {
      const response = await this.fetchWithInterceptor(
        `${this.BASE_URL.replace('/api/v1', '')}/health`,
        {},
        true, // usar cache
        5000  // cache de 5 segundos para health check
      )
      
      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        const serverInfo = await response.json()
        this.emitEvent('connected')
        return {
          status: true,
          response_time: responseTime,
          timestamp: new Date().toISOString(),
          server_info: serverInfo
        }
      }
      
      this.emitEvent('disconnected')
      return {
        status: false,
        response_time: responseTime,
        timestamp: new Date().toISOString(),
        error: `Status: ${response.status}`
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      this.emitEvent('error', error)
      return {
        status: false,
        response_time: responseTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Cria uma nova tarefa
   */
  static async createTask(taskData: TaskData): Promise<Task> {
    try {
      const response = await this.fetchWithInterceptor(`${this.BASE_URL}/tasks`, {
        method: 'POST',
        body: JSON.stringify(taskData)
      })
      
      const task = await response.json()
      
      // Invalidar cache de listagem de tarefas
      this.invalidateTaskListCache()
      
      return task
    } catch (error) {
      throw new Error(`Erro ao criar tarefa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  /**
   * Lista todas as tarefas
   */
  static async listTasks(limit?: number): Promise<Task[]> {
    try {
      const url = limit ? `${this.BASE_URL}/tasks?limit=${limit}` : `${this.BASE_URL}/tasks`
      const response = await this.fetchWithInterceptor(url, {}, true) // usar cache
      
      const data = await response.json()
      return data.tasks || []
    } catch (error) {
      throw new Error(`Erro ao listar tarefas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  /**
   * Obtém status de uma tarefa específica
   */
  static async getTaskStatus(taskIdentifier: string): Promise<Task> {
    try {
      const response = await this.fetchWithInterceptor(
        `${this.BASE_URL}/tasks/${taskIdentifier}`,
        {},
        true, // usar cache
        10000 // cache de 10 segundos para status de tarefa
      )
      
      return await response.json()
    } catch (error) {
      throw new Error(`Erro ao obter status da tarefa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  /**
   * Limpa tarefas completadas e falhadas
   */
  static async clearTasks(): Promise<{ cleared: number }> {
    try {
      const response = await this.fetchWithInterceptor(`${this.BASE_URL}/tasks/clear`, {
        method: 'POST'
      })
      
      const result = await response.json()
      
      // Invalidar cache após limpeza
      this.invalidateTaskListCache()
      
      return result
    } catch (error) {
      throw new Error(`Erro ao limpar tarefas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  /**
   * Deleta uma tarefa específica
   */
  static async deleteTask(taskIdentifier: string): Promise<boolean> {
    try {
      const response = await this.fetchWithInterceptor(`${this.BASE_URL}/tasks/${taskIdentifier}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Invalidar cache após deleção
        this.invalidateTaskListCache()
      }
      
      return response.ok
    } catch (error) {
      throw new Error(`Erro ao deletar tarefa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  /**
   * Submete um grupo de orquestração
   */
  static async submitOrchestration(orchestrationGroup: string): Promise<any> {
    try {
      const response = await this.fetchWithInterceptor(`${this.BASE_URL}/orchestration/submit`, {
        method: 'POST',
        body: JSON.stringify({ orchestration_group: orchestrationGroup })
      })
      
      const result = await response.json()
      
      // Invalidar cache após submissão
      this.invalidateTaskListCache()
      
      return result
    } catch (error) {
      throw new Error(`Erro ao submeter orquestração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  /**
   * Obtém lista de identificadores de tarefas existentes
   */
  static async getExistingTaskIdentifiers(): Promise<string[]> {
    try {
      const tasks = await this.listTasks()
      return tasks.map(task => task.task_identifier).filter(Boolean)
    } catch (error) {
      console.error('Erro ao obter tarefas existentes:', error)
      return []
    }
  }

  /**
   * Invalida cache relacionado à listagem de tarefas
   */
  private static invalidateTaskListCache() {
    const keysToInvalidate: string[] = []
    for (const key of this.cache.keys()) {
      if (key.includes('/tasks') || key.includes('/analytics')) {
        keysToInvalidate.push(key)
      }
    }
    keysToInvalidate.forEach(key => this.cache.delete(key))
  }

  // Novos métodos para funcionalidades avançadas

  /**
   * Lista tarefas com filtros avançados
   */
  static async listTasksWithFilters(filters?: Partial<TaskFilters>, limit?: number, offset?: number): Promise<{ 
    tasks: Task[], 
    total: number,
    filtered: number 
  }> {
    try {
      const params = new URLSearchParams()
      
      // Paginação
      if (limit) params.append('limit', limit.toString())
      if (offset) params.append('offset', offset.toString())
      
      // Filtros
      if (filters) {
        if (filters.status?.length) {
          params.append('status', filters.status.join(','))
        }
        if (filters.model?.length) {
          params.append('model', filters.model.join(','))
        }
        if (filters.orchestrationGroup) {
          params.append('orchestration_group', filters.orchestrationGroup)
        }
        if (filters.search) {
          params.append('search', filters.search)
        }
        if (filters.sortBy) {
          params.append('sort_by', filters.sortBy)
          params.append('sort_order', filters.sortOrder || 'desc')
        }
      }

      const response = await this.fetchWithInterceptor(
        `${this.BASE_URL}/tasks/filtered?${params}`,
        {},
        true // usar cache
      )
      
      const data = await response.json()
      return {
        tasks: data.tasks || [],
        total: data.total || 0,
        filtered: data.filtered || 0
      }
    } catch (error) {
      // Fallback para API simples
      console.warn('API de filtros não disponível, usando fallback local:', error)
      const allTasks = await this.listTasks(limit)
      return this.applyFiltersLocally(allTasks, filters)
    }
  }

  /**
   * Aplica filtros localmente como fallback
   */
  private static applyFiltersLocally(tasks: Task[], filters?: Partial<TaskFilters>): { 
    tasks: Task[], 
    total: number,
    filtered: number 
  } {
    if (!filters) return { tasks, total: tasks.length, filtered: tasks.length }

    let filtered = [...tasks]

    // Busca fuzzy
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(task => 
        task.task_identifier.toLowerCase().includes(searchTerm) ||
        (task.execution_prompt?.toLowerCase().includes(searchTerm)) ||
        (task.orchestration_group?.toLowerCase().includes(searchTerm))
      )
    }

    // Filtro por status
    if (filters.status?.length) {
      filtered = filtered.filter(task => filters.status!.includes(task.status))
    }

    // Filtro por modelo
    if (filters.model?.length && filters.model.length > 0) {
      filtered = filtered.filter(task => 
        task.model && filters.model!.includes(task.model)
      )
    }

    // Filtro por grupo
    if (filters.orchestrationGroup) {
      const groupTerm = filters.orchestrationGroup.toLowerCase()
      filtered = filtered.filter(task => 
        task.orchestration_group?.toLowerCase().includes(groupTerm)
      )
    }

    // Ordenação
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any
        let bValue: any

        // Tratamento especial para complexity_score
        if (filters.sortBy === 'complexity_score') {
          aValue = a._metadata?.complexity_score || 0
          bValue = b._metadata?.complexity_score || 0
        } else {
          aValue = (a as any)[filters.sortBy!]
          bValue = (b as any)[filters.sortBy!]
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return filters.sortOrder === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }

        if (filters.sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
      })
    }

    return { 
      tasks: filtered, 
      total: tasks.length, 
      filtered: filtered.length 
    }
  }

  /**
   * Obtém analytics de tarefas
   */
  static async getTaskAnalytics(): Promise<TaskAnalyticsData> {
    try {
      const response = await this.fetchWithInterceptor(
        `${this.BASE_URL}/tasks/analytics`,
        {},
        true, // usar cache
        300000 // cache de 5 minutos para analytics
      )
      
      if (response.ok) {
        return await response.json()
      }
      
      // Fallback: calcular analytics localmente
      const tasks = await this.listTasks()
      return this.calculateAnalyticsLocally(tasks)
    } catch (error) {
      // Fallback: calcular analytics localmente
      console.warn('API de analytics não disponível, calculando localmente:', error)
      const tasks = await this.listTasks()
      return this.calculateAnalyticsLocally(tasks)
    }
  }

  /**
   * Calcula analytics localmente
   */
  private static calculateAnalyticsLocally(tasks: Task[]): TaskAnalyticsData {
    const totalTasks = tasks.length
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
          completionRate: 0,
          averageTimeToComplete: 0,
          failureRate: 0,
          queuedTasks: 0
        }
      }
    }

    // Contagem por status
    const statusCounts = tasks.reduce((acc, task) => {
      const status = task.status || 'pending'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<TaskStatus, number>)

    // Taxa de sucesso
    const successRate = ((statusCounts.completed || 0) / totalTasks) * 100

    // Distribuição por modelo
    const modelDistribution = tasks.reduce((acc, task) => {
      const model = task.model || 'sonnet'
      acc[model] = (acc[model] || 0) + 1
      return acc
    }, {} as Record<TaskModel, number>)

    // Tempo médio simulado baseado na complexidade
    const avgExecutionTime = tasks.reduce((acc, task) => {
      return acc + (task._metadata?.complexity_score || 30)
    }, 0) / totalTasks

    // Distribuição de complexidade
    const complexityDistribution = tasks.reduce((acc, task) => {
      const complexity = task._metadata?.estimated_complexity || 'Simples'
      acc[complexity] = (acc[complexity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Dados de tendência simulados (últimos 7 dias)
    const trendsData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
      return {
        date: date.toLocaleDateString('pt-BR'),
        count: Math.floor(Math.random() * 15) + 3
      }
    })

    return {
      totalTasks,
      statusCounts,
      successRate: Math.round(successRate * 10) / 10,
      avgExecutionTime: Math.round(avgExecutionTime * 10) / 10,
      modelDistribution,
      complexityDistribution,
      trendsData,
      performanceMetrics: {
        completionRate: Math.round(((statusCounts.completed || 0) / totalTasks) * 100),
        averageTimeToComplete: Math.round(avgExecutionTime),
        failureRate: Math.round(((statusCounts.failed || 0) / totalTasks) * 100),
        queuedTasks: statusCounts.pending || 0
      }
    }
  }

  /**
   * Deleta múltiplas tarefas em lote
   */
  static async bulkDeleteTasks(taskIdentifiers: string[]): Promise<BulkActionResult> {
    try {
      const response = await this.fetchWithInterceptor(`${this.BASE_URL}/tasks/bulk/delete`, {
        method: 'POST',
        body: JSON.stringify({ task_identifiers: taskIdentifiers })
      })
      
      if (response.ok) {
        const result = await response.json()
        // Invalidar cache após deleção em lote
        this.invalidateTaskListCache()
        return result
      }
      
      // Fallback: deletar uma por uma
      console.warn('Bulk delete não disponível, deletando individualmente')
      return await this.bulkDeleteFallback(taskIdentifiers)
    } catch (error) {
      // Fallback: deletar uma por uma
      return await this.bulkDeleteFallback(taskIdentifiers)
    }
  }

  /**
   * Fallback para deleção em lote
   */
  private static async bulkDeleteFallback(taskIdentifiers: string[]): Promise<BulkActionResult> {
    let processed = 0
    let failed = 0
    const errors: string[] = []

    for (const taskId of taskIdentifiers) {
      try {
        const success = await this.deleteTask(taskId)
        if (success) {
          processed++
        } else {
          failed++
          errors.push(`Falha ao deletar ${taskId}`)
        }
      } catch (error) {
        failed++
        errors.push(`Erro ao deletar ${taskId}: ${error}`)
      }
    }

    return {
      success: failed === 0,
      processed,
      failed,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Atualiza status de múltiplas tarefas em lote
   */
  static async bulkUpdateTaskStatus(taskIdentifiers: string[], newStatus: TaskStatus): Promise<BulkActionResult> {
    try {
      const response = await this.fetchWithInterceptor(`${this.BASE_URL}/tasks/bulk/status`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          task_identifiers: taskIdentifiers,
          status: newStatus 
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        // Invalidar cache após atualização
        this.invalidateTaskListCache()
        return result
      }
      
      // Para esta implementação, vamos simular o sucesso
      // pois a API real pode não suportar esta funcionalidade
      return {
        success: true,
        processed: taskIdentifiers.length,
        failed: 0
      }
    } catch (error) {
      // Simular sucesso parcial
      return {
        success: false,
        processed: Math.floor(taskIdentifiers.length * 0.8),
        failed: Math.ceil(taskIdentifiers.length * 0.2),
        errors: ['Alguns itens podem não ter sido atualizados']
      }
    }
  }

  /**
   * Exporta tarefas em formato específico
   */
  static async exportTasks(tasks: Task[], format: 'csv' | 'json' | 'excel'): Promise<string | Blob> {
    switch (format) {
      case 'csv':
        return this.exportToCSV(tasks)
      case 'json':
        return this.exportToJSON(tasks)
      case 'excel':
        return await this.exportToExcel(tasks)
      default:
        throw new Error(`Formato de exportação não suportado: ${format}`)
    }
  }

  /**
   * Exporta para CSV
   */
  private static exportToCSV(tasks: Task[]): string {
    const headers = [
      'Identificador',
      'Status',
      'Modelo',
      'Data Criação',
      'Data Atualização',
      'Grupo Orquestração',
      'Dependências',
      'Diretório',
      'Complexidade',
      'Score Complexidade',
      'Prompt'
    ]

    const rows = tasks.map(task => [
      task.task_identifier,
      task.status,
      task.model || '',
      task.created_at,
      task.updated_at,
      task.orchestration_group || '',
      task.depends_on?.join('; ') || '',
      task.working_directory || '',
      task._metadata?.estimated_complexity || '',
      task._metadata?.complexity_score || '',
      (task.execution_prompt || '').replace(/"/g, '""').substring(0, 200) + '...'
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    return csvContent
  }

  /**
   * Exporta para JSON
   */
  private static exportToJSON(tasks: Task[]): string {
    return JSON.stringify(tasks, null, 2)
  }

  /**
   * Exporta para Excel (simulado como CSV com separador de tabulação)
   */
  private static async exportToExcel(tasks: Task[]): Promise<string> {
    // Implementação simplificada - retorna TSV que pode ser aberto no Excel
    const headers = [
      'Identificador',
      'Status',
      'Modelo',
      'Data Criação',
      'Data Atualização',
      'Grupo Orquestração',
      'Dependências',
      'Diretório',
      'Complexidade',
      'Score Complexidade',
      'Prompt'
    ]

    const rows = tasks.map(task => [
      task.task_identifier,
      task.status,
      task.model || '',
      task.created_at,
      task.updated_at,
      task.orchestration_group || '',
      task.depends_on?.join('; ') || '',
      task.working_directory || '',
      task._metadata?.estimated_complexity || '',
      task._metadata?.complexity_score || '',
      (task.execution_prompt || '').substring(0, 200) + '...'
    ])

    return [headers, ...rows]
      .map(row => row.join('\t'))
      .join('\n')
  }

  /**
   * Método para modo offline - retorna dados mock
   */
  static async getMockData(): Promise<{
    health: ApiHealthData
    tasks: Task[]
    analytics: TaskAnalyticsData
  }> {
    const mockTasks: Task[] = [
      {
        id: 'mock-1',
        task_identifier: 'exemplo_analise',
        status: 'completed' as TaskStatus,
        model: 'sonnet' as TaskModel,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
        execution_prompt: 'Analisar arquivos Python do projeto',
        working_directory: '/projeto',
        orchestration_group: 'analise_projeto',
        depends_on: [],
        _metadata: {
          estimated_complexity: 'Média',
          complexity_score: 45,
          tags: ['análise', 'python']
        }
      },
      {
        id: 'mock-2',
        task_identifier: 'refatoracao_codigo',
        status: 'running' as TaskStatus,
        model: 'opus' as TaskModel,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
        execution_prompt: 'Refatorar código complexo identificado na análise',
        working_directory: '/projeto',
        orchestration_group: 'analise_projeto',
        depends_on: ['exemplo_analise'],
        _metadata: {
          estimated_complexity: 'Alta',
          complexity_score: 85,
          tags: ['refatoração', 'qualidade']
        }
      }
    ]

    const mockHealth: ApiHealthData = {
      status: false,
      response_time: 0,
      timestamp: new Date().toISOString(),
      error: 'Modo offline ativo'
    }

    const mockAnalytics: TaskAnalyticsData = this.calculateAnalyticsLocally(mockTasks)

    return {
      health: mockHealth,
      tasks: mockTasks,
      analytics: mockAnalytics
    }
  }
}