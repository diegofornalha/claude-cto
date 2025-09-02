/**
 * Componente TaskCard - Visualização em cards para tarefas
 */

import React, { useState } from 'react'
import {
  CheckIcon,
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
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LinkIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline'

import { Task, TaskStatus, TaskModel } from '@/types/task'
import { useToast } from '@/components/ui/LoadingIndicators'

interface TaskCardProps {
  task: Task
  isSelected: boolean
  onSelect: (taskId: string) => void
  density?: 'compact' | 'comfortable' | 'spacious'
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  isSelected, 
  onSelect,
  density = 'comfortable'
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFullPrompt, setShowFullPrompt] = useState(false)
  const toast = useToast()

  const getStatusConfig = (status: TaskStatus) => {
    const configs = {
      pending: {
        icon: ClockIcon,
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/10',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        textColor: 'text-yellow-800 dark:text-yellow-400',
        badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        label: 'Pendente'
      },
      running: {
        icon: PlayIcon,
        bgColor: 'bg-blue-50 dark:bg-blue-900/10',
        borderColor: 'border-blue-200 dark:border-blue-800',
        textColor: 'text-blue-800 dark:text-blue-400',
        badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
        label: 'Executando'
      },
      completed: {
        icon: CheckCircleIcon,
        bgColor: 'bg-green-50 dark:bg-green-900/10',
        borderColor: 'border-green-200 dark:border-green-800',
        textColor: 'text-green-800 dark:text-green-400',
        badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        label: 'Concluída'
      },
      failed: {
        icon: XCircleIcon,
        bgColor: 'bg-red-50 dark:bg-red-900/10',
        borderColor: 'border-red-200 dark:border-red-800',
        textColor: 'text-red-800 dark:text-red-400',
        badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        label: 'Falhada'
      }
    }
    return configs[status] || configs.pending
  }

  const getModelConfig = (model?: TaskModel) => {
    if (!model) return null
    
    const configs = {
      haiku: {
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
        label: 'Haiku'
      },
      sonnet: {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
        label: 'Sonnet'
      },
      opus: {
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
        label: 'Opus'
      }
    }
    return configs[model]
  }

  const getComplexityConfig = (complexity: string) => {
    const configs = {
      'Simples': { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      'Moderada': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      'Complexa': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' },
      'Muito Complexa': { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' }
    }
    return configs[complexity as keyof typeof configs] || configs['Simples']
  }

  const statusConfig = getStatusConfig(task.status)
  const modelConfig = getModelConfig(task.model)
  const StatusIcon = statusConfig.icon

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const createdDate = formatDate(task.created_at)
  const updatedDate = formatDate(task.updated_at)

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${type} copiado para o clipboard!`)
    } catch (err) {
      console.error('Erro ao copiar para clipboard:', err)
      toast.error(`Erro ao copiar ${type.toLowerCase()}`)
    }
  }

  const cardPadding = {
    compact: 'p-3',
    comfortable: 'p-4',
    spacious: 'p-6'
  }[density]

  const cardSpacing = {
    compact: 'space-y-2',
    comfortable: 'space-y-3',
    spacious: 'space-y-4'
  }[density]

  return (
    <div
      className={`relative bg-white dark:bg-slate-800 rounded-xl border-2 transition-all duration-200 hover:shadow-lg group ${
        isSelected 
          ? `${statusConfig.borderColor} ${statusConfig.bgColor} shadow-md`
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      } ${cardPadding}`}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-3 right-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(task.task_identifier)}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
        />
      </div>

      {/* Header */}
      <div className={`${cardSpacing}`}>
        <div className="flex items-start justify-between pr-8">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${statusConfig.badgeColor}`}>
              <StatusIcon className="w-4 h-4" />
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 font-mono truncate">
                  {task.task_identifier}
                </h3>
                <button
                  onClick={() => copyToClipboard(task.task_identifier, 'ID')}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-opacity"
                  title="Copiar ID"
                >
                  <ClipboardDocumentIcon className="w-3 h-3" />
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.badgeColor}`}>
                  {statusConfig.label}
                </span>
                
                {modelConfig && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${modelConfig.color}`}>
                    <CpuChipIcon className="w-3 h-3 mr-1" />
                    {modelConfig.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Prompt Preview */}
        {task.execution_prompt && (
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center">
                <DocumentTextIcon className="w-3 h-3 mr-1" />
                Prompt de Execução
              </h4>
              
              {task.execution_prompt.length > 150 && (
                <button
                  onClick={() => setShowFullPrompt(!showFullPrompt)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-1"
                >
                  <span>{showFullPrompt ? 'Menos' : 'Mais'}</span>
                  {showFullPrompt ? (
                    <ChevronUpIcon className="w-3 h-3" />
                  ) : (
                    <ChevronDownIcon className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">
              {showFullPrompt ? task.execution_prompt : truncateText(task.execution_prompt, 150)}
            </p>
          </div>
        )}

        {/* Metadata Row */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <CalendarIcon className="w-3 h-3" />
              <span>{createdDate.date}</span>
              <span>{createdDate.time}</span>
            </div>
            
            {task.working_directory && (
              <div className="flex items-center space-x-1 max-w-[120px]">
                <FolderIcon className="w-3 h-3 flex-shrink-0" />
                <span className="truncate" title={task.working_directory}>
                  {task.working_directory.split('/').pop() || task.working_directory}
                </span>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <EyeIcon className="w-3 h-3" />
            <span>{isExpanded ? 'Menos' : 'Detalhes'}</span>
            {isExpanded ? (
              <ChevronUpIcon className="w-3 h-3" />
            ) : (
              <ChevronDownIcon className="w-3 h-3" />
            )}
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3 space-y-3">
            {/* Orchestration Info */}
            {(task.orchestration_group || (task.depends_on && task.depends_on.length > 0)) && (
              <div>
                <h5 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                  <TagIcon className="w-3 h-3 mr-1" />
                  Orquestração
                </h5>
                
                <div className="space-y-2">
                  {task.orchestration_group && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Grupo:</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {task.orchestration_group}
                      </span>
                    </div>
                  )}
                  
                  {task.depends_on && task.depends_on.length > 0 && (
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Dependências:</span>
                      <div className="flex flex-wrap gap-1">
                        {task.depends_on.map((dep, index) => (
                          <span key={index} className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs px-2 py-0.5 rounded">
                            {dep}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {task.wait_after_dependencies && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Aguardar:</span>
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        {task.wait_after_dependencies}s após dependências
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            {task._metadata && (
              <div>
                <h5 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                  <CpuChipIcon className="w-3 h-3 mr-1" />
                  Informações Técnicas
                </h5>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Complexidade:</span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        getComplexityConfig(task._metadata.estimated_complexity).color
                      }`}>
                        {task._metadata.estimated_complexity}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Score:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {task._metadata.complexity_score}/100
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Duração Est.:</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {task._metadata.estimated_duration}
                    </span>
                  </div>
                  
                  {task._metadata.template_used && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Template:</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {task._metadata.template_used}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div>
              <h5 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                <CalendarIcon className="w-3 h-3 mr-1" />
                Cronologia
              </h5>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Criada:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {createdDate.date} às {createdDate.time}
                  </span>
                </div>
                
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Atualizada:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {updatedDate.date} às {updatedDate.time}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {task.error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <h5 className="text-xs font-medium text-red-700 dark:text-red-400 mb-2 flex items-center">
                  <XCircleIcon className="w-3 h-3 mr-1" />
                  Erro
                </h5>
                <p className="text-xs text-red-600 dark:text-red-400 font-mono">
                  {task.error}
                </p>
              </div>
            )}

            {/* Result Display */}
            {task.result && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <h5 className="text-xs font-medium text-green-700 dark:text-green-400 mb-2 flex items-center">
                  <CheckCircleIcon className="w-3 h-3 mr-1" />
                  Resultado
                </h5>
                <p className="text-xs text-green-600 dark:text-green-400 font-mono">
                  {typeof task.result === 'string' ? task.result : JSON.stringify(task.result, null, 2)}
                </p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard(task.task_identifier, 'ID')}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 flex items-center space-x-1 transition-colors"
                >
                  <ClipboardDocumentIcon className="w-3 h-3" />
                  <span>Copiar ID</span>
                </button>
                
                {task.execution_prompt && (
                  <button
                    onClick={() => copyToClipboard(task.execution_prompt!, 'prompt')}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 flex items-center space-x-1 transition-colors"
                  >
                    <DocumentTextIcon className="w-3 h-3" />
                    <span>Copiar Prompt</span>
                  </button>
                )}
              </div>
              
              <div className="text-xs text-slate-400 dark:text-slate-500">
                ID: {task.id}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Indicator Bar */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-xl ${
          statusConfig.badgeColor.includes('yellow') ? 'bg-yellow-400' :
          statusConfig.badgeColor.includes('blue') ? 'bg-blue-400' :
          statusConfig.badgeColor.includes('green') ? 'bg-green-400' :
          statusConfig.badgeColor.includes('red') ? 'bg-red-400' : 'bg-slate-400'
        }`}
      />
    </div>
  )
}

export default TaskCard