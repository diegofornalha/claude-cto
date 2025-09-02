/**
 * Componente TaskFilters - Filtros avançados para tarefas
 */

import React, { useState } from 'react'
import {
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
  CpuChipIcon,
  TagIcon,
  AdjustmentsHorizontalIcon,
  BookmarkIcon,
  TrashIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'

import { TaskFilters, TaskStatus, TaskModel } from '@/types/task'

interface TaskFiltersProps {
  filters: TaskFilters
  onFiltersChange: React.Dispatch<React.SetStateAction<TaskFilters>>
  tasksCount: number
}

interface FilterPreset {
  name: string
  filters: Partial<TaskFilters>
  icon: string
  description: string
}

const FILTER_PRESETS: FilterPreset[] = [
  {
    name: 'Tarefas Ativas',
    filters: {
      status: ['pending', 'running']
    },
    icon: '🔄',
    description: 'Tarefas em execução ou aguardando'
  },
  {
    name: 'Concluídas Hoje',
    filters: {
      status: ['completed'],
      dateRange: {
        start: new Date(new Date().setHours(0, 0, 0, 0)),
        end: new Date(new Date().setHours(23, 59, 59, 999))
      }
    },
    icon: '✅',
    description: 'Tarefas finalizadas hoje'
  },
  {
    name: 'Alta Complexidade',
    filters: {
      complexity: [75, 100]
    },
    icon: '🔥',
    description: 'Tarefas muito complexas'
  },
  {
    name: 'Falhas Recentes',
    filters: {
      status: ['failed'],
      dateRange: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
        end: new Date()
      }
    },
    icon: '❌',
    description: 'Falhas das últimas 24h'
  },
  {
    name: 'Modelo Opus',
    filters: {
      model: ['opus']
    },
    icon: '🎯',
    description: 'Apenas tarefas Opus'
  }
]

const StatusFilter: React.FC<{
  selectedStatus: TaskStatus[]
  onChange: (status: TaskStatus[]) => void
}> = ({ selectedStatus, onChange }) => {
  const statusOptions: Array<{ value: TaskStatus; label: string; color: string }> = [
    { value: 'pending', label: 'Pendente', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
    { value: 'running', label: 'Executando', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { value: 'completed', label: 'Concluída', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
    { value: 'failed', label: 'Falhada', color: 'text-red-600 bg-red-50 dark:bg-red-900/20' }
  ]

  const toggleStatus = (status: TaskStatus) => {
    if (selectedStatus.includes(status)) {
      onChange(selectedStatus.filter(s => s !== status))
    } else {
      onChange([...selectedStatus, status])
    }
  }

  const selectAll = () => {
    onChange(statusOptions.map(s => s.value))
  }

  const selectNone = () => {
    onChange([])
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
        <div className="flex space-x-2">
          <button
            onClick={selectAll}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Todos
          </button>
          <button
            onClick={selectNone}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            Nenhum
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {statusOptions.map(option => (
          <label
            key={option.value}
            className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer border-2 transition-colors ${
              selectedStatus.includes(option.value)
                ? `${option.color} border-current`
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedStatus.includes(option.value)}
              onChange={() => toggleStatus(option.value)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

const ModelFilter: React.FC<{
  selectedModels: TaskModel[]
  onChange: (models: TaskModel[]) => void
}> = ({ selectedModels, onChange }) => {
  const modelOptions: Array<{ value: TaskModel; label: string; color: string }> = [
    { value: 'haiku', label: 'Haiku', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
    { value: 'sonnet', label: 'Sonnet', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { value: 'opus', label: 'Opus', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' }
  ]

  const toggleModel = (model: TaskModel) => {
    if (selectedModels.includes(model)) {
      onChange(selectedModels.filter(m => m !== model))
    } else {
      onChange([...selectedModels, model])
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
          <CpuChipIcon className="w-4 h-4 mr-1" />
          Modelos
        </label>
      </div>
      
      <div className="space-y-2">
        {modelOptions.map(option => (
          <label
            key={option.value}
            className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer border-2 transition-colors ${
              selectedModels.includes(option.value)
                ? `${option.color} border-current`
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedModels.includes(option.value)}
              onChange={() => toggleModel(option.value)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

const DateRangeFilter: React.FC<{
  dateRange: { start: Date | null; end: Date | null }
  onChange: (dateRange: { start: Date | null; end: Date | null }) => void
}> = ({ dateRange, onChange }) => {
  const quickRanges = [
    {
      label: 'Hoje',
      getValue: () => ({
        start: new Date(new Date().setHours(0, 0, 0, 0)),
        end: new Date(new Date().setHours(23, 59, 59, 999))
      })
    },
    {
      label: 'Últimos 7 dias',
      getValue: () => ({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      })
    },
    {
      label: 'Últimos 30 dias',
      getValue: () => ({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      })
    }
  ]

  const clearRange = () => {
    onChange({ start: null, end: null })
  }

  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return date.toISOString().split('T')[0]
  }

  const parseDate = (dateStr: string) => {
    return dateStr ? new Date(dateStr) : null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
          <CalendarIcon className="w-4 h-4 mr-1" />
          Período
        </label>
        {(dateRange.start || dateRange.end) && (
          <button
            onClick={clearRange}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            Limpar
          </button>
        )}
      </div>
      
      {/* Quick ranges */}
      <div className="flex flex-wrap gap-2">
        {quickRanges.map(range => (
          <button
            key={range.label}
            onClick={() => onChange(range.getValue())}
            className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {range.label}
          </button>
        ))}
      </div>
      
      {/* Date inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400">Data início</label>
          <input
            type="date"
            value={formatDate(dateRange.start)}
            onChange={(e) => onChange({ ...dateRange, start: parseDate(e.target.value) })}
            className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400">Data fim</label>
          <input
            type="date"
            value={formatDate(dateRange.end)}
            onChange={(e) => onChange({ ...dateRange, end: parseDate(e.target.value) })}
            className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  )
}

const ComplexityFilter: React.FC<{
  complexity: [number, number]
  onChange: (complexity: [number, number]) => void
}> = ({ complexity, onChange }) => {
  const handleMinChange = (value: number) => {
    onChange([Math.min(value, complexity[1]), complexity[1]])
  }

  const handleMaxChange = (value: number) => {
    onChange([complexity[0], Math.max(value, complexity[0])])
  }

  const reset = () => {
    onChange([0, 100])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Complexidade
        </label>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {complexity[0]} - {complexity[1]}
          </span>
          {(complexity[0] > 0 || complexity[1] < 100) && (
            <button
              onClick={reset}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              Reset
            </button>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400">Mínimo: {complexity[0]}</label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={complexity[0]}
            onChange={(e) => handleMinChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
          />
        </div>
        
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400">Máximo: {complexity[1]}</label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={complexity[1]}
            onChange={(e) => handleMaxChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
          />
        </div>
      </div>
      
      {/* Quick presets */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onChange([0, 25])}
          className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
        >
          Simples
        </button>
        <button
          onClick={() => onChange([26, 50])}
          className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 px-2 py-1 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/40 transition-colors"
        >
          Moderada
        </button>
        <button
          onClick={() => onChange([51, 75])}
          className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 px-2 py-1 rounded hover:bg-orange-200 dark:hover:bg-orange-900/40 transition-colors"
        >
          Complexa
        </button>
        <button
          onClick={() => onChange([76, 100])}
          className="text-xs bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
        >
          Muito Complexa
        </button>
      </div>
    </div>
  )
}

const TaskFiltersComponent: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
  tasksCount
}) => {
  const [savedFilters, setSavedFilters] = useState<Record<string, TaskFilters>>({})
  const [saveFilterName, setSaveFilterName] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)

  const resetAllFilters = () => {
    onFiltersChange({
      search: '',
      status: ['pending', 'running', 'completed'],
      model: ['haiku', 'sonnet', 'opus'],
      dateRange: { start: null, end: null },
      complexity: [0, 100],
      orchestrationGroup: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    })
  }

  const applyPreset = (preset: FilterPreset) => {
    onFiltersChange(prev => ({ ...prev, ...preset.filters }))
  }

  const saveCurrentFilter = () => {
    if (!saveFilterName.trim()) return
    
    setSavedFilters(prev => ({
      ...prev,
      [saveFilterName]: { ...filters }
    }))
    
    setSaveFilterName('')
    setShowSaveForm(false)
    
    // Persist to localStorage
    try {
      const allSavedFilters = { ...savedFilters, [saveFilterName]: filters }
      localStorage.setItem('taskListSavedFilters', JSON.stringify(allSavedFilters))
    } catch (error) {
      console.warn('Erro ao salvar filtro:', error)
    }
  }

  const loadSavedFilter = (name: string) => {
    const filter = savedFilters[name]
    if (filter) {
      onFiltersChange(filter)
    }
  }

  const deleteSavedFilter = (name: string) => {
    setSavedFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[name]
      return newFilters
    })
    
    // Update localStorage
    try {
      const updatedFilters = { ...savedFilters }
      delete updatedFilters[name]
      localStorage.setItem('taskListSavedFilters', JSON.stringify(updatedFilters))
    } catch (error) {
      console.warn('Erro ao deletar filtro:', error)
    }
  }

  // Load saved filters on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('taskListSavedFilters')
      if (saved) {
        setSavedFilters(JSON.parse(saved))
      }
    } catch (error) {
      console.warn('Erro ao carregar filtros salvos:', error)
    }
  }, [])

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Filtros Avançados
            </h3>
          </div>
          
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {tasksCount} resultado{tasksCount !== 1 ? 's' : ''}
          </div>
        </div>
        
        <button
          onClick={resetAllFilters}
          className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
          <span>Limpar Tudo</span>
        </button>
      </div>
      
      {/* Presets */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          🎯 Filtros Rápidos
        </h4>
        <div className="flex flex-wrap gap-2">
          {FILTER_PRESETS.map(preset => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title={preset.description}
            >
              <span>{preset.icon}</span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Status Filter */}
        <StatusFilter
          selectedStatus={filters.status}
          onChange={(status) => onFiltersChange(prev => ({ ...prev, status }))}
        />
        
        {/* Model Filter */}
        <ModelFilter
          selectedModels={filters.model}
          onChange={(model) => onFiltersChange(prev => ({ ...prev, model }))}
        />
        
        {/* Date Range Filter */}
        <DateRangeFilter
          dateRange={filters.dateRange}
          onChange={(dateRange) => onFiltersChange(prev => ({ ...prev, dateRange }))}
        />
        
        {/* Complexity Filter */}
        <ComplexityFilter
          complexity={filters.complexity}
          onChange={(complexity) => onFiltersChange(prev => ({ ...prev, complexity }))}
        />
      </div>
      
      {/* Additional Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Orchestration Group */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
            <TagIcon className="w-4 h-4 mr-1" />
            Grupo de Orquestração
          </label>
          <input
            type="text"
            placeholder="Filtrar por grupo..."
            value={filters.orchestrationGroup}
            onChange={(e) => onFiltersChange(prev => ({ ...prev, orchestrationGroup: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Sort Options */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
            <AdjustmentsHorizontalIcon className="w-4 h-4 mr-1" />
            Ordenação
          </label>
          <div className="flex space-x-2">
            <select
              value={filters.sortBy}
              onChange={(e) => onFiltersChange(prev => ({ 
                ...prev, 
                sortBy: e.target.value as any 
              }))}
              className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="created_at">Data de Criação</option>
              <option value="task_identifier">Identificador</option>
              <option value="status">Status</option>
              <option value="complexity_score">Complexidade</option>
            </select>
            
            <select
              value={filters.sortOrder}
              onChange={(e) => onFiltersChange(prev => ({ 
                ...prev, 
                sortOrder: e.target.value as 'asc' | 'desc' 
              }))}
              className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="desc">Decrescente</option>
              <option value="asc">Crescente</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Saved Filters */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
            <BookmarkIcon className="w-4 h-4 mr-1" />
            Filtros Salvos
          </h4>
          
          <button
            onClick={() => setShowSaveForm(!showSaveForm)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            💾 Salvar Atual
          </button>
        </div>
        
        {showSaveForm && (
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              placeholder="Nome do filtro..."
              value={saveFilterName}
              onChange={(e) => setSaveFilterName(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={saveCurrentFilter}
              disabled={!saveFilterName.trim()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Salvar
            </button>
            <button
              onClick={() => setShowSaveForm(false)}
              className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
        
        {Object.keys(savedFilters).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(savedFilters).map(([name, filter]) => (
              <div key={name} className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  onClick={() => loadSavedFilter(name)}
                  className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-l-lg transition-colors"
                >
                  <DocumentDuplicateIcon className="w-3 h-3 mr-1 inline" />
                  {name}
                </button>
                <button
                  onClick={() => deleteSavedFilter(name)}
                  className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-r-lg transition-colors"
                >
                  <TrashIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {Object.keys(savedFilters).length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">
            Nenhum filtro salvo ainda. Salve sua configuração atual para reutilizar depois.
          </p>
        )}
      </div>
    </div>
  )
}

export default TaskFiltersComponent