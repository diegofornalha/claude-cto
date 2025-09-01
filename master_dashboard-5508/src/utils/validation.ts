/**
 * Validadores para formulários de tarefas
 */

import { ValidationResult } from '@/types/task'

export class FormValidator {
  /**
   * Valida identificador de tarefa
   */
  static validateIdentifier(identifier: string): ValidationResult {
    if (!identifier) {
      return {
        isValid: false,
        fieldName: 'identifier',
        message: 'Identificador é obrigatório',
        severity: 'error'
      }
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(identifier)) {
      return {
        isValid: false,
        fieldName: 'identifier',
        message: 'Use apenas letras, números, _ e -. Deve começar com letra',
        severity: 'error'
      }
    }

    if (identifier.length < 3) {
      return {
        isValid: false,
        fieldName: 'identifier',
        message: 'Identificador muito curto (mín. 3 caracteres)',
        severity: 'warning'
      }
    }

    if (identifier.length > 50) {
      return {
        isValid: false,
        fieldName: 'identifier',
        message: 'Identificador muito longo (máx. 50 caracteres)',
        severity: 'warning'
      }
    }

    return {
      isValid: true,
      fieldName: 'identifier',
      message: 'Identificador válido',
      severity: 'info'
    }
  }

  /**
   * Valida prompt de execução
   */
  static validatePrompt(prompt: string): ValidationResult {
    if (!prompt) {
      return {
        isValid: false,
        fieldName: 'prompt',
        message: 'Descrição é obrigatória',
        severity: 'error'
      }
    }

    if (prompt.length < 150) {
      return {
        isValid: false,
        fieldName: 'prompt',
        message: `Muito curto (${prompt.length}/150 caracteres mínimos)`,
        severity: 'error'
      }
    }

    if (prompt.length > 2000) {
      return {
        isValid: false,
        fieldName: 'prompt',
        message: 'Muito longo (máx. 2000 caracteres)',
        severity: 'warning'
      }
    }

    // Verificar qualidade do prompt
    const qualityIndicators = ['arquivo', 'diretório', 'implementar', 'analisar', 'corrigir']
    const qualityScore = qualityIndicators.filter(indicator => 
      prompt.toLowerCase().includes(indicator)
    ).length

    if (qualityScore < 2) {
      return {
        isValid: true,
        fieldName: 'prompt',
        message: 'Considere ser mais específico sobre arquivos/objetivos',
        severity: 'warning'
      }
    }

    return {
      isValid: true,
      fieldName: 'prompt',
      message: 'Descrição bem detalhada',
      severity: 'info'
    }
  }

  /**
   * Valida diretório de trabalho
   */
  static validateDirectory(directory: string): ValidationResult {
    if (!directory) {
      return {
        isValid: true,
        fieldName: 'directory',
        message: 'Usando diretório atual',
        severity: 'info'
      }
    }

    // Validação básica do formato do caminho
    if (directory.startsWith('/') && directory.includes('..')) {
      return {
        isValid: false,
        fieldName: 'directory',
        message: 'Caminho inválido',
        severity: 'warning'
      }
    }

    return {
      isValid: true,
      fieldName: 'directory',
      message: 'Diretório válido',
      severity: 'info'
    }
  }

  /**
   * Valida dependências de tarefas
   */
  static validateDependencies(depsText: string, existingTasks: string[]): ValidationResult {
    if (!depsText) {
      return {
        isValid: true,
        fieldName: 'dependencies',
        message: 'Nenhuma dependência',
        severity: 'info'
      }
    }

    const deps = depsText.split(',').map(dep => dep.trim()).filter(Boolean)

    for (const dep of deps) {
      if (!existingTasks.includes(dep)) {
        return {
          isValid: false,
          fieldName: 'dependencies',
          message: `Tarefa '${dep}' não encontrada`,
          severity: 'warning'
        }
      }
    }

    return {
      isValid: true,
      fieldName: 'dependencies',
      message: `${deps.length} dependências válidas`,
      severity: 'info'
    }
  }
}