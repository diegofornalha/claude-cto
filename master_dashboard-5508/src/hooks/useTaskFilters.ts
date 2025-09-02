/**
 * Hook para gerenciar filtros de tarefas
 */

import { useState, useEffect, useMemo } from 'react'
import { Task, TaskFilters, TaskStatus, TaskModel } from '@/types/task'

const DEFAULT_FILTERS: TaskFilters = {
  search: '',
  status: ['pending', 'running', 'completed'],
  model: ['haiku', 'sonnet', 'opus'],
  dateRange: {
    start: null,
    end: null
  },
  complexity: [0, 100],
  orchestrationGroup: '',
  sortBy: 'created_at',
  sortOrder: 'desc'
}

export interface UseTaskFiltersReturn {
  filters: TaskFilters
  setFilters: React.Dispatch<React.SetStateAction<TaskFilters>>
  filteredTasks: Task[]
  appliedFiltersCount: number
  resetFilters: () => void
  saveFilter: (name: string) => void
  loadFilter: (name: string) => void
  savedFilters: Record<string, TaskFilters>
}

export function useTaskFilters(tasks: Task[]): UseTaskFiltersReturn {
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS)
  const [savedFilters, setSavedFilters] = useState<Record<string, TaskFilters>>({})

  // Aplicar filtros às tarefas
  const filteredTasks = useMemo(() => {
    if (!tasks.length) return []

    let filtered = [...tasks]

    // Busca fuzzy
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim()
      filtered = filtered.filter(task => {
        const searchableText = [
          task.task_identifier,
          task.execution_prompt || '',
          task.orchestration_group || '',
          task.model || '',
          task.status,
          task._metadata?.estimated_complexity || ''
        ].join(' ').toLowerCase()

        // Busca simples por palavras
        const searchWords = searchTerm.split(' ').filter(word => word.length > 0)
        return searchWords.every(word => searchableText.includes(word))
      })
    }

    // Filtro por status
    if (filters.status.length > 0 && filters.status.length < 4) {
      filtered = filtered.filter(task => filters.status.includes(task.status))
    }

    // Filtro por modelo
    if (filters.model.length > 0 && filters.model.length < 3) {
      filtered = filtered.filter(task => 
        task.model && filters.model.includes(task.model)
      )
    }

    // Filtro por grupo de orquestração
    if (filters.orchestrationGroup.trim()) {
      const groupTerm = filters.orchestrationGroup.toLowerCase().trim()
      filtered = filtered.filter(task => 
        task.orchestration_group?.toLowerCase().includes(groupTerm)
      )
    }

    // Filtro por range de data
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.created_at)
        const start = filters.dateRange.start
        const end = filters.dateRange.end

        if (start && taskDate < start) return false
        if (end && taskDate > end) return false

        return true
      })
    }

    // Filtro por complexidade
    if (filters.complexity[0] > 0 || filters.complexity[1] < 100) {
      filtered = filtered.filter(task => {
        const complexity = task._metadata?.complexity_score || 50
        return complexity >= filters.complexity[0] && complexity <= filters.complexity[1]
      })
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (filters.sortBy) {
        case 'task_identifier':
          aValue = a.task_identifier
          bValue = b.task_identifier
          break
        case 'status':
          // Ordenar por prioridade de status
          const statusPriority: Record<TaskStatus, number> = {
            running: 4,
            pending: 3,
            completed: 2,
            failed: 1
          }
          aValue = statusPriority[a.status] || 0
          bValue = statusPriority[b.status] || 0
          break
        case 'complexity_score':
          aValue = a._metadata?.complexity_score || 0
          bValue = b._metadata?.complexity_score || 0
          break
        case 'created_at':
        default:
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
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

    return filtered
  }, [tasks, filters])

  // Contar filtros aplicados (que não sejam os padrões)
  const appliedFiltersCount = useMemo(() => {
    let count = 0

    if (filters.search.trim()) count++
    if (filters.status.length !== 3) count++ // Não são todos os status
    if (filters.model.length !== 3) count++ // Não são todos os modelos
    if (filters.orchestrationGroup.trim()) count++
    if (filters.dateRange.start || filters.dateRange.end) count++
    if (filters.complexity[0] > 0 || filters.complexity[1] < 100) count++

    return count
  }, [filters])

  // Resetar filtros
  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  // Salvar filtro
  const saveFilter = (name: string) => {
    setSavedFilters(prev => ({
      ...prev,
      [name]: { ...filters }
    }))

    // Persistir no localStorage
    try {
      const allSavedFilters = { ...savedFilters, [name]: filters }
      localStorage.setItem('taskListSavedFilters', JSON.stringify(allSavedFilters))
    } catch (error) {
      console.warn('Erro ao salvar filtros no localStorage:', error)
    }
  }

  // Carregar filtro
  const loadFilter = (name: string) => {
    const filter = savedFilters[name]
    if (filter) {
      setFilters(filter)
    }
  }

  // Carregar filtros salvos do localStorage na inicialização
  useEffect(() => {
    try {
      const saved = localStorage.getItem('taskListSavedFilters')
      if (saved) {
        const parsedSaved = JSON.parse(saved)
        setSavedFilters(parsedSaved)
      }
    } catch (error) {
      console.warn('Erro ao carregar filtros salvos:', error)
    }
  }, [])

  // Filtros predefinidos
  useEffect(() => {
    const predefinedFilters: Record<string, TaskFilters> = {
      'Tarefas Ativas': {
        ...DEFAULT_FILTERS,
        status: ['pending', 'running']
      },
      'Tarefas Complexas': {
        ...DEFAULT_FILTERS,
        complexity: [70, 100]
      },
      'Falhas Recentes': {
        ...DEFAULT_FILTERS,
        status: ['failed'],
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 dias
          end: new Date()
        }
      },
      'Tarefas Opus': {
        ...DEFAULT_FILTERS,
        model: ['opus']
      },
      'Sem Grupo': {
        ...DEFAULT_FILTERS,
        orchestrationGroup: '' // Isso não funcionará perfeitamente, mas é uma aproximação
      }
    }

    setSavedFilters(prev => ({ ...predefinedFilters, ...prev }))
  }, [])

  return {
    filters,
    setFilters,
    filteredTasks,
    appliedFiltersCount,
    resetFilters,
    saveFilter,
    loadFilter,
    savedFilters
  }
}