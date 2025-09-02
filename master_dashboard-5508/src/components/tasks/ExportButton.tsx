/**
 * Componente ExportButton - Exportação de tarefas em múltiplos formatos
 */

import React, { useState, useRef } from 'react'
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  DocumentChartBarIcon,
  TableCellsIcon,
  CheckIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

import { Task } from '@/types/task'
import { MCPApiService } from '@/services/mcp-api'

interface ExportButtonProps {
  tasks: Task[]
  selectedOnly?: boolean
  selectedTasks?: string[]
}

interface ExportOption {
  format: 'csv' | 'json' | 'excel'
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  extension: string
  mimeType: string
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    format: 'csv',
    icon: TableCellsIcon,
    label: 'CSV (Tabela)',
    description: 'Compatível com Excel, Google Sheets',
    extension: '.csv',
    mimeType: 'text/csv'
  },
  {
    format: 'json',
    icon: DocumentTextIcon,
    label: 'JSON (Dados)',
    description: 'Formato estruturado para desenvolvedores',
    extension: '.json',
    mimeType: 'application/json'
  },
  {
    format: 'excel',
    icon: DocumentChartBarIcon,
    label: 'Excel (TSV)',
    description: 'Separado por tabulação para Excel',
    extension: '.tsv',
    mimeType: 'text/tab-separated-values'
  }
]

const ExportButton: React.FC<ExportButtonProps> = ({
  tasks,
  selectedOnly = false,
  selectedTasks = []
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  
  const dropdownRef = useRef<HTMLDivElement>(null)

  const getTasksToExport = (): Task[] => {
    if (selectedOnly && selectedTasks.length > 0) {
      return tasks.filter(task => selectedTasks.includes(task.task_identifier))
    }
    return tasks
  }

  const downloadFile = (content: string | Blob, filename: string, mimeType: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExport = async (option: ExportOption) => {
    const tasksToExport = getTasksToExport()
    
    if (tasksToExport.length === 0) {
      setExportStatus({
        type: 'error',
        message: 'Nenhuma tarefa para exportar'
      })
      setTimeout(() => setExportStatus({ type: null, message: '' }), 3000)
      return
    }

    setIsExporting(true)
    setIsDropdownOpen(false)

    try {
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const timeString = new Date().toTimeString().split(' ')[0].replace(/:/g, '')
      const suffix = selectedOnly ? '_selecionadas' : '_todas'
      const filename = `tasks_${timestamp}_${timeString}${suffix}${option.extension}`

      const content = await MCPApiService.exportTasks(tasksToExport, option.format)
      
      downloadFile(content, filename, option.mimeType)
      
      setExportStatus({
        type: 'success',
        message: `${tasksToExport.length} tarefa${tasksToExport.length > 1 ? 's' : ''} exportada${tasksToExport.length > 1 ? 's' : ''} em ${option.format.toUpperCase()}`
      })

      setTimeout(() => setExportStatus({ type: null, message: '' }), 5000)
    } catch (error) {
      console.error('Erro ao exportar:', error)
      setExportStatus({
        type: 'error',
        message: `Erro ao exportar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      })
      setTimeout(() => setExportStatus({ type: null, message: '' }), 5000)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportAll = async () => {
    if (isExporting) return
    
    const tasksToExport = getTasksToExport()
    if (tasksToExport.length === 0) {
      setExportStatus({
        type: 'error',
        message: 'Nenhuma tarefa para exportar'
      })
      return
    }

    setIsExporting(true)
    setIsDropdownOpen(false)

    try {
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const timeString = new Date().toTimeString().split(' ')[0].replace(/:/g, '')
      const suffix = selectedOnly ? '_selecionadas' : '_todas'

      // Exportar em todos os formatos
      for (const option of EXPORT_OPTIONS) {
        const filename = `tasks_${timestamp}_${timeString}${suffix}${option.extension}`
        const content = await MCPApiService.exportTasks(tasksToExport, option.format)
        downloadFile(content, filename, option.mimeType)
        
        // Aguardar um pouco entre downloads para evitar conflitos
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      setExportStatus({
        type: 'success',
        message: `${tasksToExport.length} tarefa${tasksToExport.length > 1 ? 's' : ''} exportada${tasksToExport.length > 1 ? 's' : ''} em todos os formatos`
      })

      setTimeout(() => setExportStatus({ type: null, message: '' }), 5000)
    } catch (error) {
      console.error('Erro ao exportar tudo:', error)
      setExportStatus({
        type: 'error',
        message: `Erro na exportação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      })
      setTimeout(() => setExportStatus({ type: null, message: '' }), 5000)
    } finally {
      setIsExporting(false)
    }
  }

  // Fechar dropdown ao clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const tasksCount = getTasksToExport().length
  const hasNoTasks = tasksCount === 0

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Status Message */}
      {exportStatus.type && (
        <div className={`absolute bottom-full mb-2 left-0 right-0 px-3 py-2 rounded-lg text-xs font-medium z-50 ${
          exportStatus.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
            : 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {exportStatus.type === 'success' ? (
              <CheckIcon className="w-4 h-4" />
            ) : (
              <ExclamationTriangleIcon className="w-4 h-4" />
            )}
            <span>{exportStatus.message}</span>
          </div>
        </div>
      )}

      {/* Main Button */}
      <div className="flex">
        <button
          onClick={handleExportAll}
          disabled={isExporting || hasNoTasks}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${
            isExporting || hasNoTasks
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          <ArrowDownTrayIcon className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
          <span>
            {isExporting ? 'Exportando...' : 
             selectedOnly ? `Exportar ${tasksCount} Selecionada${tasksCount > 1 ? 's' : ''}` :
             `Exportar ${tasksCount} Tarefa${tasksCount > 1 ? 's' : ''}`}
          </span>
        </button>

        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={isExporting || hasNoTasks}
          className={`px-2 py-2 rounded-r-lg border-l transition-colors ${
            isExporting || hasNoTasks
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border-slate-300 dark:border-slate-600'
              : 'bg-green-600 hover:bg-green-700 text-white border-green-700'
          }`}
        >
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown */}
      {isDropdownOpen && !hasNoTasks && (
        <div className="absolute top-full mt-2 left-0 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Escolher Formato
              </h3>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {tasksCount} tarefa{tasksCount > 1 ? 's' : ''}
              </div>
            </div>
            {selectedOnly && selectedTasks.length > 0 && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                📌 Apenas tarefas selecionadas
              </p>
            )}
          </div>

          {/* Export Options */}
          <div className="py-2">
            {EXPORT_OPTIONS.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.format}
                  onClick={() => handleExport(option)}
                  disabled={isExporting}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                      <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {option.label}
                        </h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {option.extension}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <button
              onClick={handleExportAll}
              disabled={isExporting}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>{isExporting ? 'Exportando...' : 'Exportar em Todos os Formatos'}</span>
            </button>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
              Downloads múltiplos podem ser bloqueados pelo navegador
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {hasNoTasks && isDropdownOpen && (
        <div className="absolute top-full mt-2 left-0 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 p-4">
          <div className="text-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
              Nenhuma tarefa disponível
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedOnly 
                ? 'Selecione algumas tarefas para exportar'
                : 'Não há tarefas para exportar'
              }
            </p>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Preparando exportação...
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Por favor, aguarde
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExportButton