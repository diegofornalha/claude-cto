/**
 * Hook para gerenciar lista de tarefas
 */

import { useState, useEffect, useCallback } from 'react'
import { Task, BulkActionResult, TaskStatus } from '@/types/task'
import { MCPApiService } from '@/services/mcp-api'

export interface UseTaskListReturn {
  tasks: Task[]
  loading: boolean
  error: string | null
  totalCount: number
  refreshTasks: () => Promise<void>
  bulkDeleteTasks: (taskIds: string[]) => Promise<BulkActionResult>
  bulkUpdateStatus: (taskIds: string[], status: TaskStatus) => Promise<BulkActionResult>
}

export function useTaskList(): UseTaskListReturn {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const refreshTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const fetchedTasks = await MCPApiService.listTasks(1000) // Buscar até 1000 tarefas
      setTasks(fetchedTasks)
      setTotalCount(fetchedTasks.length)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('Erro ao carregar tarefas:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const bulkDeleteTasks = useCallback(async (taskIds: string[]): Promise<BulkActionResult> => {
    try {
      const result = await MCPApiService.bulkDeleteTasks(taskIds)
      
      if (result.success) {
        // Atualizar lista local removendo as tarefas deletadas
        setTasks(prevTasks => 
          prevTasks.filter(task => !taskIds.includes(task.task_identifier))
        )
        setTotalCount(prevCount => prevCount - result.processed)
      }
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na deleção em lote'
      console.error('Erro ao deletar tarefas em lote:', err)
      return {
        success: false,
        processed: 0,
        failed: taskIds.length,
        errors: [errorMessage]
      }
    }
  }, [])

  const bulkUpdateStatus = useCallback(async (taskIds: string[], status: TaskStatus): Promise<BulkActionResult> => {
    try {
      const result = await MCPApiService.bulkUpdateTaskStatus(taskIds, status)
      
      if (result.success) {
        // Atualizar status local das tarefas
        setTasks(prevTasks => 
          prevTasks.map(task => 
            taskIds.includes(task.task_identifier) 
              ? { ...task, status, updated_at: new Date().toISOString() }
              : task
          )
        )
      }
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na atualização em lote'
      console.error('Erro ao atualizar status em lote:', err)
      return {
        success: false,
        processed: 0,
        failed: taskIds.length,
        errors: [errorMessage]
      }
    }
  }, [])

  // Carregar tarefas na inicialização
  useEffect(() => {
    refreshTasks()
  }, [refreshTasks])

  return {
    tasks,
    loading,
    error,
    totalCount,
    refreshTasks,
    bulkDeleteTasks,
    bulkUpdateStatus
  }
}