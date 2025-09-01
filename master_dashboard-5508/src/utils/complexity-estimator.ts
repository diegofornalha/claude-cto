/**
 * Estimador de complexidade e duração de tarefas
 */

import { TaskModel, TaskComplexity, TaskComplexityEstimate } from '@/types/task'

export class TaskComplexityEstimator {
  private static readonly COMPLEX_KEYWORDS = [
    'refactor', 'refatorar', 'implement', 'implementar', 
    'create', 'criar', 'build', 'construir', 
    'deploy', 'implantar', 'migrate', 'migrar'
  ]

  private static readonly SIMPLE_KEYWORDS = [
    'read', 'ler', 'analyze', 'analisar', 
    'check', 'verificar', 'list', 'listar', 
    'find', 'encontrar', 'search', 'buscar'
  ]

  private static readonly MODEL_MULTIPLIERS: Record<TaskModel, number> = {
    haiku: 0.7,
    sonnet: 1.0,
    opus: 1.4
  }

  /**
   * Estima complexidade, duração e score baseado no prompt
   */
  static estimateComplexity(prompt: string, model: TaskModel): TaskComplexityEstimate {
    const words = prompt.split(' ').length
    const lowerPrompt = prompt.toLowerCase()

    // Contar palavras-chave complexas
    const complexCount = this.COMPLEX_KEYWORDS.filter(kw => 
      lowerPrompt.includes(kw)
    ).length

    // Contar palavras-chave simples
    const simpleCount = this.SIMPLE_KEYWORDS.filter(kw => 
      lowerPrompt.includes(kw)
    ).length

    // Score base
    let score = words * 0.5 + complexCount * 10 - simpleCount * 5

    // Ajuste por modelo
    const modelMultiplier = this.MODEL_MULTIPLIERS[model] || 1.0
    score *= modelMultiplier

    // Determinar complexidade e duração
    let complexity: TaskComplexity
    let duration: string

    if (score < 20) {
      complexity = 'Simples'
      duration = '2-5 min'
    } else if (score < 50) {
      complexity = 'Moderada'
      duration = '5-15 min'
    } else if (score < 100) {
      complexity = 'Complexa'
      duration = '15-45 min'
    } else {
      complexity = 'Muito Complexa'
      duration = '45+ min'
    }

    return {
      complexity,
      duration,
      score: Math.round(score)
    }
  }

  /**
   * Calcula score de qualidade do prompt
   */
  static calculatePromptQuality(prompt: string): number {
    const qualityIndicators = [
      'arquivo', 'diretório', 'caminho', 'path',
      'implementar', 'criar', 'adicionar', 'modificar',
      'corrigir', 'analisar', 'otimizar', 'refatorar'
    ]

    const lowerPrompt = prompt.toLowerCase()
    const qualityScore = qualityIndicators.filter(indicator => 
      lowerPrompt.includes(indicator)
    ).length

    // Score de 0 a 100 baseado em qualidade
    return Math.min(100, qualityScore * 20)
  }

  /**
   * Estima tempo de execução em minutos
   */
  static estimateExecutionTime(score: number): number {
    if (score < 20) return 3
    if (score < 50) return 10
    if (score < 100) return 30
    return 60
  }
}