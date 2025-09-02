/**
 * Componente estimador de complexidade para tarefas
 * Análise visual da complexidade, duração e score da tarefa
 */

import React from 'react'
import { TaskComplexityEstimate } from '@/types/task'

interface ComplexityEstimatorProps {
  estimate: TaskComplexityEstimate
  isDarkMode: boolean
}

export const ComplexityEstimator: React.FC<ComplexityEstimatorProps> = ({
  estimate,
  isDarkMode
}) => {
  const getComplexityConfig = (complexity: string) => {
    switch (complexity) {
      case 'Simples':
        return {
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: '🟢',
          description: 'Tarefa direta, execução rápida'
        }
      case 'Moderada':
        return {
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          icon: '🟡',
          description: 'Requer planejamento e análise'
        }
      case 'Complexa':
        return {
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-100 dark:bg-orange-900/30',
          borderColor: 'border-orange-200 dark:border-orange-800',
          icon: '🟠',
          description: 'Múltiplas etapas e dependências'
        }
      case 'Muito Complexa':
        return {
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: '🔴',
          description: 'Arquitetura complexa, alta coordenação'
        }
      default:
        return {
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-700',
          borderColor: 'border-gray-200 dark:border-gray-600',
          icon: '⚪',
          description: 'Complexidade não determinada'
        }
    }
  }

  const config = getComplexityConfig(estimate.complexity)
  
  // Calcular progresso do score (0-150 escala)
  const scoreProgress = Math.min(100, (estimate.score / 150) * 100)
  
  // Determinar cor da barra de progresso baseada no score
  const getProgressColor = (score: number) => {
    if (score < 20) return 'bg-green-500'
    if (score < 50) return 'bg-yellow-500'
    if (score < 100) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const progressColor = getProgressColor(estimate.score)

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 border-2 ${config.borderColor} ${isDarkMode ? 'shadow-gray-900/20' : 'shadow-gray-200/60'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span>⚡</span>
          Análise de Complexidade
        </h3>
      </div>

      {/* Complexidade principal */}
      <div className={`${config.bgColor} rounded-lg p-4 mb-4`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.icon}</span>
            <span className={`text-lg font-bold ${config.color}`}>
              {estimate.complexity}
            </span>
          </div>
          <div className="text-right">
            <div className={`text-sm font-medium ${config.color}`}>
              Score: {estimate.score}
            </div>
          </div>
        </div>
        <p className={`text-sm ${config.color} opacity-80`}>
          {config.description}
        </p>
      </div>

      {/* Barra de progresso do score */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Índice de Complexidade
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {estimate.score}/150
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${scoreProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Estimativa de duração */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⏱️</span>
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Duração Estimada
            </span>
          </div>
          <span className="text-blue-600 dark:text-blue-400 font-bold">
            {estimate.duration}
          </span>
        </div>
      </div>

      {/* Métricas detalhadas */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-1">
          Detalhes da Análise
        </h4>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Fator de complexidade */}
          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <div className="text-gray-500 dark:text-gray-400">Fator</div>
            <div className="font-semibold">
              {estimate.score < 20 ? 'Baixo' : 
               estimate.score < 50 ? 'Moderado' :
               estimate.score < 100 ? 'Alto' : 'Muito Alto'}
            </div>
          </div>

          {/* Recomendação de modelo */}
          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <div className="text-gray-500 dark:text-gray-400">Modelo Sugerido</div>
            <div className="font-semibold">
              {estimate.score < 30 ? 'Haiku' : 
               estimate.score < 80 ? 'Sonnet' : 'Opus'}
            </div>
          </div>

          {/* Necessidade de recursos */}
          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <div className="text-gray-500 dark:text-gray-400">Recursos</div>
            <div className="font-semibold">
              {estimate.complexity === 'Simples' ? 'Mínimos' : 
               estimate.complexity === 'Moderada' ? 'Moderados' : 'Intensivos'}
            </div>
          </div>

          {/* Prioridade sugerida */}
          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <div className="text-gray-500 dark:text-gray-400">Prioridade</div>
            <div className="font-semibold">
              {estimate.complexity === 'Muito Complexa' ? 'Alta' : 
               estimate.complexity === 'Complexa' ? 'Média' : 'Normal'}
            </div>
          </div>
        </div>
      </div>

      {/* Dicas baseadas na complexidade */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-start gap-2">
          <span className="text-sm">💡</span>
          <div>
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Recomendações:
            </div>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {estimate.complexity === 'Simples' && (
                <>
                  <li>• Execução direta, sem necessidade de planejamento complexo</li>
                  <li>• Modelo Haiku é suficiente para esta tarefa</li>
                </>
              )}
              {estimate.complexity === 'Moderada' && (
                <>
                  <li>• Considere dividir em sub-tarefas se necessário</li>
                  <li>• Modelo Sonnet oferece bom equilíbrio custo/performance</li>
                </>
              )}
              {estimate.complexity === 'Complexa' && (
                <>
                  <li>• Planeje dependências e ordem de execução</li>
                  <li>• Modelo Opus recomendado para melhor qualidade</li>
                  <li>• Considere usar grupos de orquestração</li>
                </>
              )}
              {estimate.complexity === 'Muito Complexa' && (
                <>
                  <li>• Divida obrigatoriamente em múltiplas tarefas</li>
                  <li>• Use dependências para coordenar execução</li>
                  <li>• Monitore execução de perto</li>
                  <li>• Considere aumentar timeouts</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComplexityEstimator