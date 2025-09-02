/**
 * Componente validador de formulários de tarefas
 * Exibe feedback visual em tempo real sobre validação de campos
 */

import React from 'react'
import { ValidationResult } from '@/types/task'

interface TaskFormValidatorProps {
  validationResult?: ValidationResult
  className?: string
}

export const TaskFormValidator: React.FC<TaskFormValidatorProps> = ({
  validationResult,
  className = ''
}) => {
  if (!validationResult) {
    return null
  }

  const getValidationConfig = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return {
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-800 dark:text-red-200',
          iconColor: 'text-red-500 dark:text-red-400',
          icon: '❌'
        }
      case 'warning':
        return {
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          iconColor: 'text-yellow-500 dark:text-yellow-400',
          icon: '⚠️'
        }
      case 'info':
        return {
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-800 dark:text-green-200',
          iconColor: 'text-green-500 dark:text-green-400',
          icon: '✅'
        }
      default:
        return {
          bgColor: 'bg-gray-50 dark:bg-gray-700',
          borderColor: 'border-gray-200 dark:border-gray-600',
          textColor: 'text-gray-800 dark:text-gray-200',
          iconColor: 'text-gray-500 dark:text-gray-400',
          icon: 'ℹ️'
        }
    }
  }

  const config = getValidationConfig(validationResult.severity)

  const getValidationAdvice = (fieldName: string, severity: 'error' | 'warning' | 'info', message: string) => {
    const adviceMap: Record<string, Record<string, string[]>> = {
      identifier: {
        error: [
          'Use apenas letras, números, underscore (_) e hífen (-)',
          'Deve começar com uma letra',
          'Evite espaços e caracteres especiais',
          'Exemplo: analise_codigo_2023'
        ],
        warning: [
          'Identifique claramente o propósito da tarefa',
          'Use sufixos como _v2, _teste para versões',
          'Mantenha entre 5-30 caracteres para melhor legibilidade'
        ],
        info: ['Identificador válido e único!']
      },
      prompt: {
        error: [
          'Seja específico sobre arquivos e diretórios',
          'Inclua tecnologias e frameworks relevantes',
          'Defina critérios claros de sucesso',
          'Mencione dependências e limitações'
        ],
        warning: [
          'Considere adicionar mais contexto técnico',
          'Especifique padrões de código desejados',
          'Inclua exemplos ou referências quando relevante'
        ],
        info: ['Descrição detalhada e bem estruturada!']
      },
      directory: {
        error: [
          'Use caminhos absolutos quando possível',
          'Verifique se o diretório existe',
          'Evite caracteres especiais no caminho'
        ],
        warning: [
          'Considere usar caminhos relativos para portabilidade',
          'Verifique permissões de acesso ao diretório'
        ],
        info: ['Caminho de diretório válido!']
      },
      dependencies: {
        error: [
          'Verifique se as tarefas dependentes existem',
          'Use vírgulas para separar múltiplas dependências',
          'Evite dependências circulares'
        ],
        warning: [
          'Considere a ordem de execução das dependências',
          'Tarefas dependentes podem afetar o tempo total'
        ],
        info: ['Dependências configuradas corretamente!']
      }
    }

    return adviceMap[fieldName]?.[severity] || []
  }

  const advice = getValidationAdvice(validationResult.fieldName, validationResult.severity, validationResult.message)

  return (
    <div className={`mt-2 ${className}`}>
      {/* Mensagem principal de validação */}
      <div className={`flex items-start gap-2 p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
        <span className={`${config.iconColor} flex-shrink-0 mt-0.5`}>
          {config.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${config.textColor}`}>
            {validationResult.message}
          </p>
          
          {/* Dicas e conselhos quando há erro ou warning */}
          {(validationResult.severity === 'error' || validationResult.severity === 'warning') && advice.length > 0 && (
            <div className="mt-2 pl-0">
              <p className={`text-xs font-semibold ${config.textColor} opacity-80 mb-1`}>
                Dicas para correção:
              </p>
              <ul className={`text-xs ${config.textColor} opacity-70 space-y-0.5`}>
                {advice.map((tip, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="flex-shrink-0 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Feedback positivo quando tudo está correto */}
          {validationResult.severity === 'info' && validationResult.isValid && (
            <p className={`text-xs ${config.textColor} opacity-70 mt-1`}>
              Campo validado com sucesso!
            </p>
          )}
        </div>
      </div>

      {/* Indicador de progresso visual para campos obrigatórios */}
      {validationResult.fieldName === 'prompt' && (
        <div className="mt-2">
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Qualidade da descrição</span>
            <span>
              {validationResult.severity === 'error' ? 'Insuficiente' :
               validationResult.severity === 'warning' ? 'Boa' : 'Excelente'}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                validationResult.severity === 'error' ? 'bg-red-500 w-1/4' :
                validationResult.severity === 'warning' ? 'bg-yellow-500 w-2/3' : 'bg-green-500 w-full'
              }`}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Componente para mostrar múltiplos resultados de validação
 */
interface MultipleValidationProps {
  validationResults: ValidationResult[]
  className?: string
}

export const MultipleValidation: React.FC<MultipleValidationProps> = ({
  validationResults,
  className = ''
}) => {
  const errors = validationResults.filter(r => r.severity === 'error' && !r.isValid)
  const warnings = validationResults.filter(r => r.severity === 'warning' && !r.isValid)
  const successes = validationResults.filter(r => r.severity === 'info' && r.isValid)

  if (validationResults.length === 0) {
    return null
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Resumo geral */}
      <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-1 text-sm">
          <span className="text-red-500">❌</span>
          <span className="text-gray-600 dark:text-gray-400">{errors.length} erros</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-yellow-500">⚠️</span>
          <span className="text-gray-600 dark:text-gray-400">{warnings.length} avisos</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-green-500">✅</span>
          <span className="text-gray-600 dark:text-gray-400">{successes.length} válidos</span>
        </div>
      </div>

      {/* Lista de validações individuais */}
      {validationResults.map((result, index) => (
        <TaskFormValidator key={`${result.fieldName}-${index}`} validationResult={result} />
      ))}
    </div>
  )
}

export default TaskFormValidator