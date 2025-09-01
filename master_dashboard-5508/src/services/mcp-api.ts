/**
 * Serviço de API para integração com MCP Claude-CTO
 */

import { Task, TaskData, ApiHealthData } from '@/types/task'

export class MCPApiService {
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_MCP_API_URL || 'http://localhost:8889/api/v1'
  private static readonly TIMEOUT = 30000 // 30 segundos

  /**
   * Verifica saúde da API
   */
  static async checkHealth(): Promise<ApiHealthData> {
    const startTime = Date.now()
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${this.BASE_URL.replace('/api/v1', '')}/health`, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        const serverInfo = await response.json()
        return {
          status: true,
          response_time: responseTime,
          timestamp: new Date().toISOString(),
          server_info: serverInfo
        }
      }
      
      return {
        status: false,
        response_time: responseTime,
        timestamp: new Date().toISOString(),
        error: `Status: ${response.status}`
      }
    } catch (error) {
      return {
        status: false,
        response_time: Date.now() - startTime,
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
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT)
      
      const response = await fetch(`${this.BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro ao criar tarefa: ${response.status} - ${errorText}`)
      }
      
      return await response.json()
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Tempo limite excedido ao criar tarefa')
      }
      throw error
    }
  }

  /**
   * Lista todas as tarefas
   */
  static async listTasks(limit?: number): Promise<Task[]> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const url = limit ? `${this.BASE_URL}/tasks?limit=${limit}` : `${this.BASE_URL}/tasks`
      const response = await fetch(url, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Erro ao listar tarefas: ${response.status}`)
      }
      
      const data = await response.json()
      return data.tasks || []
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Tempo limite excedido ao listar tarefas')
      }
      throw error
    }
  }

  /**
   * Obtém status de uma tarefa específica
   */
  static async getTaskStatus(taskIdentifier: string): Promise<Task> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const response = await fetch(`${this.BASE_URL}/tasks/${taskIdentifier}`, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Erro ao obter status da tarefa: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Tempo limite excedido ao obter status')
      }
      throw error
    }
  }

  /**
   * Limpa tarefas completadas e falhadas
   */
  static async clearTasks(): Promise<{ cleared: number }> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const response = await fetch(`${this.BASE_URL}/tasks/clear`, {
        method: 'POST',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Erro ao limpar tarefas: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Tempo limite excedido ao limpar tarefas')
      }
      throw error
    }
  }

  /**
   * Deleta uma tarefa específica
   */
  static async deleteTask(taskIdentifier: string): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const response = await fetch(`${this.BASE_URL}/tasks/${taskIdentifier}`, {
        method: 'DELETE',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      return response.ok
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Tempo limite excedido ao deletar tarefa')
      }
      throw error
    }
  }

  /**
   * Submete um grupo de orquestração
   */
  static async submitOrchestration(orchestrationGroup: string): Promise<any> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT)
      
      const response = await fetch(`${this.BASE_URL}/orchestration/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orchestration_group: orchestrationGroup }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Erro ao submeter orquestração: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Tempo limite excedido ao submeter orquestração')
      }
      throw error
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
}