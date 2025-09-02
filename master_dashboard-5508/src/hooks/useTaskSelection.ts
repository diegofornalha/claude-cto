/**
 * Hook para gerenciar seleção de tarefas
 */

import { useState, useCallback } from 'react'

export interface UseTaskSelectionReturn {
  selectedTasks: Set<string>
  toggleTaskSelection: (taskId: string) => void
  selectAllTasks: (taskIds: string[]) => void
  clearSelection: () => void
  isTaskSelected: (taskId: string) => boolean
  selectMultipleTasks: (taskIds: string[]) => void
  unselectMultipleTasks: (taskIds: string[]) => void
}

export function useTaskSelection(): UseTaskSelectionReturn {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())

  const toggleTaskSelection = useCallback((taskId: string) => {
    setSelectedTasks(prev => {
      const newSelection = new Set(prev)
      if (newSelection.has(taskId)) {
        newSelection.delete(taskId)
      } else {
        newSelection.add(taskId)
      }
      return newSelection
    })
  }, [])

  const selectAllTasks = useCallback((taskIds: string[]) => {
    setSelectedTasks(prev => {
      const newSelection = new Set(prev)
      taskIds.forEach(id => newSelection.add(id))
      return newSelection
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedTasks(new Set())
  }, [])

  const isTaskSelected = useCallback((taskId: string) => {
    return selectedTasks.has(taskId)
  }, [selectedTasks])

  const selectMultipleTasks = useCallback((taskIds: string[]) => {
    setSelectedTasks(prev => {
      const newSelection = new Set(prev)
      taskIds.forEach(id => newSelection.add(id))
      return newSelection
    })
  }, [])

  const unselectMultipleTasks = useCallback((taskIds: string[]) => {
    setSelectedTasks(prev => {
      const newSelection = new Set(prev)
      taskIds.forEach(id => newSelection.delete(id))
      return newSelection
    })
  }, [])

  return {
    selectedTasks,
    toggleTaskSelection,
    selectAllTasks,
    clearSelection,
    isTaskSelected,
    selectMultipleTasks,
    unselectMultipleTasks
  }
}