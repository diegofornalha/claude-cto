import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { MCPApiService } from '@/services/mcp-api'
import { useTaskStore } from '@/store/taskStore'

const CreateTaskSimplePage: React.FC = () => {
  const router = useRouter()
  const { addTask } = useTaskStore()

  const [formData, setFormData] = useState({
    task_identifier: '',
    execution_prompt: '',
    working_directory: '.',
    model: 'sonnet',
    system_prompt: '',
    orchestration_group: '',
    depends_on: '',
    wait_after_dependencies: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const taskData = {
        task_identifier: formData.task_identifier,
        execution_prompt: formData.execution_prompt,
        working_directory: formData.working_directory || '.',
        model: formData.model as any,
        system_prompt: formData.system_prompt || undefined,
        orchestration_group: formData.orchestration_group || undefined,
        depends_on: formData.depends_on ? formData.depends_on.split(',').map(s => s.trim()) : undefined,
        wait_after_dependencies: formData.wait_after_dependencies || undefined
      }

      const newTask = await MCPApiService.createTask(taskData)
      addTask(newTask)
      setSuccess('Tarefa criada com sucesso!')
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/tasks')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar tarefa')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'wait_after_dependencies' ? parseFloat(value) || 0 : value
    }))
  }

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
    setError('')
    setSuccess('')
  }

  const isValid = formData.task_identifier.length > 0 && formData.execution_prompt.length >= 150

  return (
    <>
      <Head>
        <title>Criar Tarefa - Claude CTO Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Criar Nova Tarefa
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Configure e execute uma nova tarefa no Claude CTO
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-300">{success}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="space-y-6">
                {/* Task Identifier */}
                <div>
                  <label htmlFor="task_identifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Identificador da Tarefa *
                  </label>
                  <input
                    type="text"
                    id="task_identifier"
                    name="task_identifier"
                    value={formData.task_identifier}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ex: analyze_code_quality"
                    required
                  />
                </div>

                {/* Execution Prompt */}
                <div>
                  <label htmlFor="execution_prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prompt de Execução * (mínimo 150 caracteres)
                  </label>
                  <textarea
                    id="execution_prompt"
                    name="execution_prompt"
                    value={formData.execution_prompt}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descreva detalhadamente a tarefa..."
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.execution_prompt.length}/150 caracteres
                  </p>
                </div>

                {/* Model */}
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Modelo
                  </label>
                  <select
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="opus">Opus (Complexo)</option>
                    <option value="sonnet">Sonnet (Balanceado)</option>
                    <option value="haiku">Haiku (Simples)</option>
                  </select>
                </div>

                {/* Working Directory */}
                <div>
                  <label htmlFor="working_directory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Diretório de Trabalho
                  </label>
                  <input
                    type="text"
                    id="working_directory"
                    name="working_directory"
                    value={formData.working_directory}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="."
                  />
                </div>

                {/* Advanced Options */}
                <details className="border-t pt-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Opções Avançadas
                  </summary>
                  
                  <div className="space-y-4 mt-4">
                    {/* System Prompt */}
                    <div>
                      <label htmlFor="system_prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        System Prompt
                      </label>
                      <textarea
                        id="system_prompt"
                        name="system_prompt"
                        value={formData.system_prompt}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Instruções específicas..."
                      />
                    </div>

                    {/* Orchestration Group */}
                    <div>
                      <label htmlFor="orchestration_group" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Grupo de Orquestração
                      </label>
                      <input
                        type="text"
                        id="orchestration_group"
                        name="orchestration_group"
                        value={formData.orchestration_group}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ex: backend_refactor"
                      />
                    </div>

                    {/* Dependencies */}
                    <div>
                      <label htmlFor="depends_on" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Dependências (separadas por vírgula)
                      </label>
                      <input
                        type="text"
                        id="depends_on"
                        name="depends_on"
                        value={formData.depends_on}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="task1, task2"
                      />
                    </div>

                    {/* Wait After Dependencies */}
                    <div>
                      <label htmlFor="wait_after_dependencies" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Aguardar após dependências (segundos)
                      </label>
                      <input
                        type="number"
                        id="wait_after_dependencies"
                        name="wait_after_dependencies"
                        value={formData.wait_after_dependencies}
                        onChange={handleChange}
                        min="0"
                        step="0.1"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </details>

                {/* Actions */}
                <div className="flex gap-4 pt-6 border-t">
                  <button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                      isValid && !isSubmitting
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? 'Criando...' : 'Criar Tarefa'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default CreateTaskSimplePage