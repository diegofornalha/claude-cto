/**
 * Tipos para o sistema de tarefas MCP Claude-CTO
 */

export interface TaskTemplate {
  name: string
  icon: string
  description: string
  identifierPrefix: string
  executionPromptTemplate: string
  defaultModel: TaskModel
  tags: string[]
  estimatedDuration: string
  complexity: TaskComplexity
}

export type TaskModel = 'haiku' | 'sonnet' | 'opus'

export type TaskComplexity = 'Simples' | 'Moderada' | 'Complexa' | 'Muito Complexa'

export interface ValidationResult {
  isValid: boolean
  fieldName: string
  message: string
  severity: 'error' | 'warning' | 'info'
}

export interface TaskComplexityEstimate {
  complexity: TaskComplexity
  duration: string
  score: number
}

export interface TaskData {
  task_identifier: string
  execution_prompt: string
  working_directory?: string
  model: TaskModel
  system_prompt?: string
  orchestration_group?: string
  depends_on?: string[]
  wait_after_dependencies?: number
  _metadata?: TaskMetadata
}

export interface TaskMetadata {
  created_via: string
  template_used?: string
  estimated_complexity: TaskComplexity
  estimated_duration: string
  complexity_score: number
  creation_timestamp: string
}

export interface Task {
  id: string
  task_identifier: string
  status: TaskStatus
  created_at: string
  updated_at: string
  model?: TaskModel
  working_directory?: string
  execution_prompt?: string
  orchestration_group?: string
  depends_on?: string[]
  wait_after_dependencies?: number
  error?: string
  result?: any
  _metadata?: TaskMetadata
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface TaskDependency {
  taskId: string
  dependsOn: string[]
}

export interface ApiHealthData {
  status: boolean
  response_time: number
  timestamp: string
  server_info?: any
  error?: string
}

// Novos tipos para filtros e analytics
export interface TaskFilters {
  search: string
  status: TaskStatus[]
  model: TaskModel[]
  dateRange: {
    start: Date | null
    end: Date | null
  }
  complexity: [number, number]
  orchestrationGroup: string
  sortBy: 'created_at' | 'task_identifier' | 'status' | 'complexity_score'
  sortOrder: 'asc' | 'desc'
}

export interface TaskAnalyticsData {
  totalTasks: number
  statusCounts: Record<TaskStatus, number>
  successRate: number
  avgExecutionTime: number
  modelDistribution: Record<TaskModel, number>
  complexityDistribution: Record<string, number>
  trendsData: Array<{
    date: string
    count: number
    status?: TaskStatus
  }>
  performanceMetrics: {
    completionRate: number
    averageTimeToComplete: number
    failureRate: number
    queuedTasks: number
  }
}

export interface BulkActionResult {
  success: boolean
  processed: number
  failed: number
  errors?: string[]
}

export interface ExportFormat {
  type: 'csv' | 'json' | 'excel'
  filename: string
  fields: string[]
}

export interface TaskPagination {
  currentPage: number
  pageSize: number
  totalPages: number
  totalItems: number
  hasNext: boolean
  hasPrev: boolean
}

export interface TaskViewMode {
  mode: 'grid' | 'cards'
  density: 'compact' | 'comfortable' | 'spacious'
}

export interface SavedFilter {
  id: string
  name: string
  filters: TaskFilters
  createdAt: string
  isDefault: boolean
}