/**
 * Página principal de tarefas - versão simplificada para teste
 */

import React, { useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { useTaskStore } from '@/store/taskStore'
import TaskErrorBoundary from '@/components/TaskErrorBoundary'

const TasksPage: React.FC = () => {
  const { tasks, isLoading, lastError, fetchTasks } = useTaskStore()

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
      case 'running':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400'
      case 'failed':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400'
    }
  }

  return (
    <TaskErrorBoundary>
      <Head>
        <title>Tarefas - Claude CTO Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🚀 Tarefas Claude CTO
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Gerenciar e monitorar todas as tarefas do sistema
              </p>
            </div>
            
            <Link
              href="/tasks/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              ➕ Nova Tarefa
            </Link>
          </div>

          {/* Erro */}
          {lastError && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              <strong>Erro:</strong> {lastError}
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando tarefas...</span>
            </div>
          )}

          {/* Lista de tarefas */}
          {!isLoading && (
            <div className="grid gap-6">
              {tasks.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    📋 Nenhuma tarefa encontrada
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 mt-2">
                    Crie sua primeira tarefa para começar
                  </p>
                  <Link
                    href="/tasks/create"
                    className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                  >
                    Criar Tarefa
                  </Link>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {task.task_identifier}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                          ID: {task.id}
                        </p>
                      </div>
                      
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>

                    {task.execution_prompt && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Descrição:
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                          {task.execution_prompt}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex gap-4">
                        {task.model && (
                          <span>🤖 {task.model}</span>
                        )}
                        {task.working_directory && (
                          <span>📁 {task.working_directory}</span>
                        )}
                      </div>
                      
                      <div>
                        Criado: {new Date(task.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </TaskErrorBoundary>
  )
}

export default TasksPage