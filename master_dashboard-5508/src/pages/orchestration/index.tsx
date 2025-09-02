import React from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { GitBranch, Plus, List, Clock, Activity, ArrowRight } from 'lucide-react'

const OrchestrationPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Orquestração - Claude CTO Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                <GitBranch className="w-8 h-8 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Orquestração de Tarefas
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Gerencie e coordene múltiplas tarefas com dependências
                </p>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Orquestrações Ativas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                </div>
                <Activity className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tarefas em Fila</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Concluídas Hoje</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                </div>
                <List className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Sucesso</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">100%</p>
                </div>
                <GitBranch className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Ações Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link href="/orchestration/submit">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                        Nova Orquestração
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Crie uma nova orquestração com múltiplas tarefas e defina dependências entre elas
                    </p>
                    <div className="flex items-center text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                      <span className="font-medium">Criar Agora</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 opacity-75 cursor-not-allowed">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <List className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <h3 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                      Orquestrações Ativas
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Visualize e gerencie orquestrações em andamento
                  </p>
                  <div className="text-gray-500 dark:text-gray-400">
                    <span className="text-sm">Em breve</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informações sobre Orquestração */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <GitBranch className="w-6 h-6 mr-2 text-purple-600 dark:text-purple-400" />
              O que é Orquestração?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold mb-2 text-purple-700 dark:text-purple-400">
                  🔄 Dependências
                </h3>
                <p className="text-sm">
                  Configure tarefas para executar em sequência ou paralelo com base em dependências
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 text-purple-700 dark:text-purple-400">
                  ⚡ Execução Inteligente
                </h3>
                <p className="text-sm">
                  O sistema gerencia automaticamente a ordem de execução baseada nas dependências
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 text-purple-700 dark:text-purple-400">
                  📊 Monitoramento
                </h3>
                <p className="text-sm">
                  Acompanhe o progresso de cada tarefa e o status geral da orquestração
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Exemplo de Uso:
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>1. <strong>Tarefa A:</strong> Analisar código (identifier: &ldquo;analyze&rdquo;)</p>
                <p>2. <strong>Tarefa B:</strong> Corrigir problemas (depends_on: [&ldquo;analyze&rdquo;])</p>
                <p>3. <strong>Tarefa C:</strong> Executar testes (depends_on: [&ldquo;fix&rdquo;])</p>
                <p>4. <strong>Tarefa D:</strong> Gerar relatório (depends_on: [&ldquo;test&rdquo;])</p>
              </div>
            </div>
          </div>

          {/* Dicas */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">
                💡 Dica: Planeje Antes
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Antes de criar uma orquestração, mapeie todas as tarefas e suas dependências para garantir uma execução eficiente
              </p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 dark:text-green-400 mb-2">
                ✅ Boas Práticas
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Use identificadores descritivos e agrupe tarefas relacionadas no mesmo orchestration_group
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default OrchestrationPage