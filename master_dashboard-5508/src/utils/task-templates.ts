/**
 * Templates pré-definidos para criação de tarefas
 */

import { TaskTemplate } from '@/types/task'

export class TaskTemplateManager {
  /**
   * Retorna lista de templates pré-definidos
   */
  static getTemplates(): TaskTemplate[] {
    return [
      {
        name: 'Análise de Código',
        icon: '🔍',
        description: 'Analisar complexidade, padrões e qualidade do código',
        identifierPrefix: 'analise_codigo_',
        executionPromptTemplate: 'Analisar todos os arquivos {linguagem} em {caminho} para identificar {criterios} e fornecer relatório detalhado com sugestões específicas de melhoria',
        defaultModel: 'sonnet',
        tags: ['análise', 'qualidade', 'código'],
        estimatedDuration: '5-15 min',
        complexity: 'Moderada'
      },
      {
        name: 'Implementação de Feature',
        icon: '⚡',
        description: 'Implementar nova funcionalidade completa',
        identifierPrefix: 'feature_',
        executionPromptTemplate: 'Implementar {feature_name} em {tecnologia} no diretório {caminho}, incluindo {componentes} e testes adequados',
        defaultModel: 'opus',
        tags: ['desenvolvimento', 'feature', 'implementação'],
        estimatedDuration: '30-60 min',
        complexity: 'Complexa'
      },
      {
        name: 'Correção de Bug',
        icon: '🐛',
        description: 'Investigar e corrigir problemas específicos',
        identifierPrefix: 'bugfix_',
        executionPromptTemplate: 'Investigar e corrigir {problema} no arquivo {arquivo}, implementando {solucao} e adicionando testes de regressão',
        defaultModel: 'sonnet',
        tags: ['bug', 'correção', 'debug'],
        estimatedDuration: '10-30 min',
        complexity: 'Moderada'
      },
      {
        name: 'Refatoração',
        icon: '🔧',
        description: 'Melhorar estrutura e qualidade do código existente',
        identifierPrefix: 'refactor_',
        executionPromptTemplate: 'Refatorar {componente} em {caminho} para {objetivo}, mantendo funcionalidade existente e melhorando {aspectos}',
        defaultModel: 'opus',
        tags: ['refatoração', 'limpeza', 'otimização'],
        estimatedDuration: '20-45 min',
        complexity: 'Complexa'
      },
      {
        name: 'Documentação',
        icon: '📚',
        description: 'Criar ou atualizar documentação',
        identifierPrefix: 'doc_',
        executionPromptTemplate: 'Criar documentação detalhada para {componente} em {formato}, incluindo {secoes} e exemplos práticos',
        defaultModel: 'haiku',
        tags: ['documentação', 'manual', 'guia'],
        estimatedDuration: '10-25 min',
        complexity: 'Simples'
      },
      {
        name: 'Teste Automatizado',
        icon: '🧪',
        description: 'Criar suíte de testes abrangente',
        identifierPrefix: 'test_',
        executionPromptTemplate: 'Criar testes {tipo_teste} para {componente} em {framework}, cobrindo {cenarios} com pelo menos 90% de cobertura',
        defaultModel: 'sonnet',
        tags: ['teste', 'qa', 'cobertura'],
        estimatedDuration: '15-40 min',
        complexity: 'Complexa'
      },
      {
        name: 'Migração de Dados',
        icon: '🔄',
        description: 'Migrar dados entre sistemas ou formatos',
        identifierPrefix: 'migracao_',
        executionPromptTemplate: 'Migrar dados de {origem} para {destino}, transformando {estrutura} e garantindo {integridade}',
        defaultModel: 'opus',
        tags: ['migração', 'dados', 'transformação'],
        estimatedDuration: '30-90 min',
        complexity: 'Muito Complexa'
      },
      {
        name: 'Otimização de Performance',
        icon: '⚡',
        description: 'Melhorar performance e eficiência',
        identifierPrefix: 'otimizacao_',
        executionPromptTemplate: 'Otimizar {componente} em {caminho} para melhorar {metricas}, implementando {estrategias}',
        defaultModel: 'opus',
        tags: ['performance', 'otimização', 'eficiência'],
        estimatedDuration: '20-60 min',
        complexity: 'Complexa'
      },
      {
        name: 'Configuração CI/CD',
        icon: '🔧',
        description: 'Configurar pipelines de integração e entrega',
        identifierPrefix: 'cicd_',
        executionPromptTemplate: 'Configurar pipeline {tipo} para {projeto} usando {ferramenta}, incluindo {etapas}',
        defaultModel: 'sonnet',
        tags: ['ci/cd', 'devops', 'automação'],
        estimatedDuration: '30-60 min',
        complexity: 'Complexa'
      },
      {
        name: 'Análise de Segurança',
        icon: '🔒',
        description: 'Analisar e corrigir vulnerabilidades',
        identifierPrefix: 'seguranca_',
        executionPromptTemplate: 'Analisar {componente} em busca de vulnerabilidades {tipo}, implementando correções para {riscos}',
        defaultModel: 'opus',
        tags: ['segurança', 'vulnerabilidade', 'auditoria'],
        estimatedDuration: '20-45 min',
        complexity: 'Complexa'
      }
    ]
  }

  /**
   * Gera identificador único baseado no template
   */
  static generateIdentifier(template: TaskTemplate): string {
    const timestamp = new Date().toISOString()
      .replace(/[:\-T]/g, '')
      .slice(0, 12)
    return `${template.identifierPrefix}${timestamp}`
  }

  /**
   * Substitui variáveis no template do prompt
   */
  static fillTemplate(template: string, variables: Record<string, string>): string {
    let filled = template
    Object.entries(variables).forEach(([key, value]) => {
      filled = filled.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
    })
    return filled
  }

  /**
   * Encontra template por nome
   */
  static findTemplate(name: string): TaskTemplate | undefined {
    return this.getTemplates().find(t => t.name === name)
  }
}