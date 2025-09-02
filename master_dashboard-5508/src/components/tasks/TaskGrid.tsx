/**
 * Componente TaskGrid - Tabela avançada de tarefas
 */

import React, { useState } from 'react'
import {
  CheckIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ClockIcon,
  CpuChipIcon,
  DocumentTextIcon,
  FolderIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseIcon,
  TagIcon,
  CalendarIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

import { Task, TaskStatus, TaskModel } from '@/types/task'

interface TaskGridProps {
  tasks: Task[]
  selectedTasks: Set<string>
  onTaskSelect: (taskId: string) => void
  onSelectAll: (taskIds: string[]) => void
  isTaskSelected: (taskId: string) => boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSort: (field: string, order: 'asc' | 'desc') => void
}

interface TaskDetailModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, isOpen, onClose }) => {
  if (!isOpen || !task) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            🔍 Detalhes da Tarefa
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informações Básicas */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center">
                  <DocumentTextIcon className="w-5 h-5 mr-2" />
                  Informações Básicas
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Identificador</label>
                    <div className="mt-1 text-slate-900 dark:text-slate-100 font-mono text-sm bg-slate-50 dark:bg-slate-900 rounded px-2 py-1">
                      {task.task_identifier}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</label>
                    <div className="mt-1">
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Modelo</label>
                    <div className="mt-1">
                      <ModelBadge model={task.model} />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Diretório de Trabalho</label>
                    <div className="mt-1 text-slate-900 dark:text-slate-100 text-sm font-mono bg-slate-50 dark:bg-slate-900 rounded px-2 py-1">
                      {task.working_directory || 'Não especificado'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Datas */}
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  Cronologia
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Criada em</label>
                    <div className="mt-1 text-slate-900 dark:text-slate-100 text-sm">
                      {new Date(task.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Atualizada em</label>
                    <div className="mt-1 text-slate-900 dark:text-slate-100 text-sm">
                      {new Date(task.updated_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Configurações Avançadas */}
            <div className="space-y-6">
              {/* Orquestração */}
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center">
                  <TagIcon className="w-5 h-5 mr-2" />
                  Orquestração
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Grupo</label>
                    <div className="mt-1 text-slate-900 dark:text-slate-100 text-sm">
                      {task.orchestration_group || 'Nenhum grupo'}
                    </div>
                  </div>
                  
                  {task.depends_on && task.depends_on.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Dependências</label>
                      <div className="mt-1">
                        <div className="flex flex-wrap gap-1">
                          {task.depends_on.map((dep, index) => (
                            <span key={index} className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs px-2 py-1 rounded">
                              {dep}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {task.wait_after_dependencies && (
                    <div>
                      <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Aguardar após dependências</label>
                      <div className="mt-1 text-slate-900 dark:text-slate-100 text-sm">
                        {task.wait_after_dependencies} segundos
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Metadata */}
              {task._metadata && (
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center">
                    <CpuChipIcon className="w-5 h-5 mr-2" />
                    Metadata
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Complexidade Estimada</label>
                      <div className="mt-1">
                        <ComplexityBadge complexity={task._metadata.estimated_complexity} />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Score de Complexidade</label>
                      <div className="mt-1 text-slate-900 dark:text-slate-100 text-sm">
                        {task._metadata.complexity_score}/100
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Duração Estimada</label>
                      <div className="mt-1 text-slate-900 dark:text-slate-100 text-sm">
                        {task._metadata.estimated_duration}
                      </div>
                    </div>
                    
                    {task._metadata.template_used && (
                      <div>
                        <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Template Usado</label>
                        <div className="mt-1 text-slate-900 dark:text-slate-100 text-sm">
                          {task._metadata.template_used}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Prompt de Execução */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center">
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              Prompt de Execução
            </h3>
            
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
              <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono">
                {task.execution_prompt || 'Nenhum prompt especificado'}
              </pre>
            </div>
          </div>
          
          {/* Erro, se houver */}
          {task.error && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4 flex items-center">
                <XCircleIcon className="w-5 h-5 mr-2" />
                Erro
              </h3>
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap font-mono">
                  {task.error}
                </pre>
              </div>
            </div>
          )}
          
          {/* Resultado, se houver */}
          {task.result && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-green-600 dark:text-green-400 mb-4 flex items-center">
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Resultado
              </h3>
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <pre className="text-sm text-green-700 dark:text-green-300 whitespace-pre-wrap font-mono">
                  {typeof task.result === 'string' ? task.result : JSON.stringify(task.result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const statusConfig = {
    pending: { 
      icon: ClockIcon, 
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      label: 'Pendente'
    },
    running: { 
      icon: PlayIcon, 
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      label: 'Executando'
    },
    completed: { 
      icon: CheckCircleIcon, 
      color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      label: 'Concluída'
    },
    failed: { 
      icon: XCircleIcon, 
      color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      label: 'Falhada'
    }
  }

  const config = statusConfig[status] || statusConfig.pending
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  )
}

const ModelBadge: React.FC<{ model?: TaskModel }> = ({ model }) => {
  if (!model) return <span className="text-slate-400 text-sm">N/A</span>

  const modelConfig = {
    haiku: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400', label: 'Haiku' },
    sonnet: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', label: 'Sonnet' },
    opus: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', label: 'Opus' }
  }

  const config = modelConfig[model] || modelConfig.sonnet

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <CpuChipIcon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  )
}

const ComplexityBadge: React.FC<{ complexity: string }> = ({ complexity }) => {
  const complexityConfig = {
    'Simples': { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
    'Moderada': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
    'Complexa': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' },
    'Muito Complexa': { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' }
  }

  const config = complexityConfig[complexity as keyof typeof complexityConfig] || complexityConfig['Simples']

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {complexity}
    </span>
  )
}

const TaskGrid: React.FC<TaskGridProps> = ({
  tasks,
  selectedTasks,
  onTaskSelect,
  onSelectAll,
  isTaskSelected,
  sortBy,
  sortOrder,
  onSort
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const handleSort = (field: string) => {
    if (sortBy === field) {
      onSort(field, sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      onSort(field, 'desc')
    }
  }

  const SortIcon: React.FC<{ field: string }> = ({ field }) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ? 
      <ChevronUpIcon className="w-4 h-4 ml-1" /> : 
      <ChevronDownIcon className="w-4 h-4 ml-1" />
  }

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task)
    setIsDetailModalOpen(true)
  }

  const allSelected = tasks.length > 0 && tasks.every(task => isTaskSelected(task.task_identifier))
  const indeterminate = tasks.some(task => isTaskSelected(task.task_identifier)) && !allSelected

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          {/* Header */}
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = indeterminate
                  }}
                  onChange={() => {
                    if (allSelected) {
                      tasks.forEach(task => {
                        if (isTaskSelected(task.task_identifier)) {
                          onTaskSelect(task.task_identifier)
                        }
                      })
                    } else {
                      onSelectAll(tasks.map(task => task.task_identifier))
                    }
                  }}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none"
                onClick={() => handleSort('task_identifier')}
              >
                <div className="flex items-center">
                  Identificador
                  <SortIcon field="task_identifier" />
                </div>
              </th>
              
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  <SortIcon field="status" />
                </div>
              </th>
              
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Modelo
              </th>
              
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center">
                  Criado
                  <SortIcon field="created_at" />
                </div>
              </th>
              
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Grupo
              </th>
              
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Complexidade
              </th>
              
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Prompt
              </th>
              
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          
          {/* Body */}
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {tasks.map((task) => (
              <tr 
                key={task.task_identifier} 
                className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                  isTaskSelected(task.task_identifier) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={isTaskSelected(task.task_identifier)}
                    onChange={() => onTaskSelect(task.task_identifier)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 font-mono">
                    {task.task_identifier}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={task.status} />
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <ModelBadge model={task.model} />
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    {new Date(task.created_at).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {new Date(task.created_at).toLocaleTimeString('pt-BR')}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {task.orchestration_group ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      <TagIcon className="w-3 h-3 mr-1" />
                      {task.orchestration_group}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-sm">Sem grupo</span>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {task._metadata ? (
                    <div className="flex items-center space-x-2">
                      <ComplexityBadge complexity={task._metadata.estimated_complexity} />
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        ({task._metadata.complexity_score}/100)
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-sm">N/A</span>
                  )}
                </td>
                
                <td className="px-6 py-4">
                  <div className="max-w-xs">
                    <div className="text-sm text-slate-900 dark:text-slate-100 truncate">
                      {task.execution_prompt ? (
                        task.execution_prompt.length > 80 
                          ? `${task.execution_prompt.substring(0, 80)}...`
                          : task.execution_prompt
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic">Sem prompt</span>
                      )}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleViewDetails(task)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-400 dark:text-slate-500">
              Nenhuma tarefa encontrada
            </div>
          </div>
        )}
      </div>

      <TaskDetailModal
        task={selectedTask}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedTask(null)
        }}
      />
    </>
  )
}

export default TaskGrid