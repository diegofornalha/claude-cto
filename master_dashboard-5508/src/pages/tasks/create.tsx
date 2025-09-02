/**
 * Página de criação de tarefas do Claude-CTO
 * Migração completa do dashboard_ultra.py para Next.js
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { TaskTemplateSelector } from '@/components/tasks/TaskTemplateSelector'
import { ComplexityEstimator } from '@/components/tasks/ComplexityEstimator'
import { TaskFormValidator } from '@/components/tasks/TaskFormValidator'
import { MCPApiService } from '@/services/mcp-api'
import { useTaskStore } from '@/store/taskStore'
import { TaskData, TaskTemplate, TaskModel, ValidationResult, TaskComplexityEstimate } from '@/types/task'
import { TaskTemplateManager } from '@/utils/task-templates'
import { TaskComplexityEstimator } from '@/utils/complexity-estimator'
import { FormValidator } from '@/utils/validation'

interface FormData {
  task_identifier: string
  execution_prompt: string
  working_directory: string
  model: TaskModel
  system_prompt: string
  orchestration_group: string
  depends_on: string
  wait_after_dependencies: number
}

const CreateTaskPage: React.FC = () => {
  const router = useRouter()
  const { addTask, existingTaskIdentifiers, fetchExistingTasks } = useTaskStore()

  // Estados do formulário
  const [formData, setFormData] = useState<FormData>({
    task_identifier: '',
    execution_prompt: '',
    working_directory: '.',
    model: 'sonnet',
    system_prompt: '',
    orchestration_group: '',
    depends_on: '',
    wait_after_dependencies: 0
  })

  // Estados de controle
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null)
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [complexityEstimate, setComplexityEstimate] = useState<TaskComplexityEstimate | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({})

  // Carregar tarefas existentes e preferências ao montar
  useEffect(() => {
    fetchExistingTasks()
    
    // Detectar dark mode
    const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDarkMode(darkMode)
    
    // Escutar mudanças no dark mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [fetchExistingTasks])

  // Validação em tempo real
  useEffect(() => {
    const results: ValidationResult[] = []
    
    results.push(FormValidator.validateIdentifier(formData.task_identifier))
    results.push(FormValidator.validatePrompt(formData.execution_prompt))
    results.push(FormValidator.validateDirectory(formData.working_directory))
    results.push(FormValidator.validateDependencies(formData.depends_on, existingTaskIdentifiers))
    
    setValidationResults(results)

    // Estimar complexidade quando prompt mudar
    if (formData.execution_prompt.length > 10) {
      const estimate = TaskComplexityEstimator.estimateComplexity(
        formData.execution_prompt, 
        formData.model
      )
      setComplexityEstimate(estimate)
    }
  }, [formData, existingTaskIdentifiers])

  // Manipulador de seleção de template
  const handleTemplateSelect = (template: TaskTemplate) => {
    setSelectedTemplate(template)
    const identifier = TaskTemplateManager.generateIdentifier(template)
    
    setFormData(prev => ({
      ...prev,
      task_identifier: identifier,
      model: template.defaultModel,
      execution_prompt: template.executionPromptTemplate
    }))

    // Extrair variáveis do template
    const variables: Record<string, string> = {}
    const matches = template.executionPromptTemplate.match(/\{([^}]+)\}/g)
    if (matches) {
      matches.forEach(match => {
        const key = match.slice(1, -1)
        variables[key] = ''
      })
    }
    setTemplateVariables(variables)
  }

  // Manipulador de mudança de variáveis do template
  const handleTemplateVariableChange = (key: string, value: string) => {
    const newVariables = { ...templateVariables, [key]: value }
    setTemplateVariables(newVariables)
    
    if (selectedTemplate) {
      const filledPrompt = TaskTemplateManager.fillTemplate(
        selectedTemplate.executionPromptTemplate,
        newVariables
      )
      setFormData(prev => ({ ...prev, execution_prompt: filledPrompt }))
    }
  }

  // Manipulador de mudança de dados do formulário
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Validar se formulário está pronto para submissão
  const isFormValid = () => {
    return validationResults.every(result => 
      result.severity !== 'error' || result.isValid
    ) && formData.task_identifier && formData.execution_prompt.length >= 150
  }

  // Manipulador de submissão
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid()) {
      alert('Por favor, corrija os erros antes de submeter.')
      return
    }

    setIsSubmitting(true)
    
    try {
      const taskData: TaskData = {
        task_identifier: formData.task_identifier,
        execution_prompt: formData.execution_prompt,
        working_directory: formData.working_directory || undefined,
        model: formData.model,
        system_prompt: formData.system_prompt || undefined,
        orchestration_group: formData.orchestration_group || undefined,
        depends_on: formData.depends_on ? 
          formData.depends_on.split(',').map(d => d.trim()).filter(Boolean) : 
          undefined,
        wait_after_dependencies: formData.wait_after_dependencies > 0 ? 
          formData.wait_after_dependencies : undefined,
        _metadata: {
          created_via: 'web_dashboard',
          template_used: selectedTemplate?.name,
          estimated_complexity: complexityEstimate?.complexity || 'Moderada',
          estimated_duration: complexityEstimate?.duration || '10-30 min',
          complexity_score: complexityEstimate?.score || 50,
          creation_timestamp: new Date().toISOString()
        }
      }

      const newTask = await MCPApiService.createTask(taskData)
      addTask(newTask)
      
      alert(`Tarefa "${newTask.task_identifier}" criada com sucesso!`)
      router.push('/tasks')
      
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
      alert(`Erro ao criar tarefa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset do formulário
  const handleReset = () => {
    setFormData({
      task_identifier: '',
      execution_prompt: '',
      working_directory: '.',
      model: 'sonnet',
      system_prompt: '',
      orchestration_group: '',
      depends_on: '',
      wait_after_dependencies: 0
    })
    setSelectedTemplate(null)
    setTemplateVariables({})
  }

  const themeClasses = isDarkMode 
    ? 'bg-gray-900 text-white' 
    : 'bg-gray-50 text-gray-900'

  return (
    <>
      <Head>
        <title>Criar Nova Tarefa - Claude CTO Dashboard</title>
        <meta name="description" content="Criar nova tarefa no sistema Claude-CTO" />
      </Head>

      <div className={`min-h-screen transition-colors duration-300 ${themeClasses}`}>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              🚀 Criar Nova Tarefa
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configure e execute tarefas no Claude-CTO com templates inteligentes
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna da esquerda - Seletor de templates */}
            <div className="lg:col-span-1">
              <TaskTemplateSelector
                selectedTemplate={selectedTemplate}
                onTemplateSelect={handleTemplateSelect}
                isDarkMode={isDarkMode}
              />

              {/* Estimador de complexidade */}
              {complexityEstimate && (
                <div className="mt-6">
                  <ComplexityEstimator
                    estimate={complexityEstimate}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}
            </div>

            {/* Coluna principal - Formulário */}
            <div className="lg:col-span-2">
              <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${isDarkMode ? 'shadow-gray-900/20' : 'shadow-gray-200/60'}`}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Identificador da tarefa */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Identificador da Tarefa *
                    </label>
                    <input
                      type="text"
                      value={formData.task_identifier}
                      onChange={(e) => handleInputChange('task_identifier', e.target.value)}
                      placeholder="ex: analise_codigo_20231201"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      disabled={!!selectedTemplate}
                    />
                    <TaskFormValidator
                      validationResult={validationResults.find(r => r.fieldName === 'identifier')}
                    />
                  </div>

                  {/* Variáveis do template */}
                  {selectedTemplate && Object.keys(templateVariables).length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <h3 className="font-semibold mb-3 text-blue-800 dark:text-blue-200">
                        Variáveis do Template
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(templateVariables).map(([key, value]) => (
                          <div key={key}>
                            <label className="block text-sm font-medium mb-1 text-blue-700 dark:text-blue-300">
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </label>
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => handleTemplateVariableChange(key, e.target.value)}
                              placeholder={`Informe ${key}...`}
                              className="w-full px-3 py-2 rounded border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Descrição da tarefa */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Descrição Detalhada da Tarefa *
                    </label>
                    <textarea
                      value={formData.execution_prompt}
                      onChange={(e) => handleInputChange('execution_prompt', e.target.value)}
                      placeholder="Descreva detalhadamente o que deve ser feito, incluindo arquivos específicos, tecnologias e critérios de sucesso..."
                      rows={6}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-y"
                    />
                    <div className="mt-1 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                      <span>{formData.execution_prompt.length}/2000 caracteres</span>
                      <span>Mínimo: 150 caracteres</span>
                    </div>
                    <TaskFormValidator
                      validationResult={validationResults.find(r => r.fieldName === 'prompt')}
                    />
                  </div>

                  {/* Modelo e Diretório */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Modelo Claude
                      </label>
                      <select
                        value={formData.model}
                        onChange={(e) => handleInputChange('model', e.target.value as TaskModel)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      >
                        <option value="haiku">Haiku (Rápido, Simples)</option>
                        <option value="sonnet">Sonnet (Balanceado)</option>
                        <option value="opus">Opus (Complexo, Detalhado)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Diretório de Trabalho
                      </label>
                      <input
                        type="text"
                        value={formData.working_directory}
                        onChange={(e) => handleInputChange('working_directory', e.target.value)}
                        placeholder="/caminho/para/projeto"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>

                  {/* Configurações avançadas */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                    >
                      <span className={`mr-2 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                      Configurações Avançadas
                    </button>

                    {showAdvanced && (
                      <div className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Prompt do Sistema (Opcional)
                          </label>
                          <textarea
                            value={formData.system_prompt}
                            onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                            placeholder="Instruções específicas para o modelo..."
                            rows={3}
                            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Grupo de Orquestração
                          </label>
                          <input
                            type="text"
                            value={formData.orchestration_group}
                            onChange={(e) => handleInputChange('orchestration_group', e.target.value)}
                            placeholder="nome_do_grupo"
                            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Dependências (separadas por vírgula)
                          </label>
                          <input
                            type="text"
                            value={formData.depends_on}
                            onChange={(e) => handleInputChange('depends_on', e.target.value)}
                            placeholder="tarefa1, tarefa2, tarefa3"
                            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                          />
                          <TaskFormValidator
                            validationResult={validationResults.find(r => r.fieldName === 'dependencies')}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Atraso após Dependências (segundos)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="3600"
                            value={formData.wait_after_dependencies}
                            onChange={(e) => handleInputChange('wait_after_dependencies', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-4 pt-6">
                    <button
                      type="submit"
                      disabled={!isFormValid() || isSubmitting}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                          Criando...
                        </>
                      ) : (
                        '🚀 Criar Tarefa'
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      🔄 Limpar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CreateTaskPage