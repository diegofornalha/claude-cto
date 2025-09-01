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
  error?: string
  result?: any
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