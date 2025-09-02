/**
 * Seletor de templates para criação de tarefas
 * Oferece templates pré-configurados com visualização intuitiva
 */

import React, { useState } from 'react'
import { TaskTemplate } from '@/types/task'
import { TaskTemplateManager } from '@/utils/task-templates'

interface TaskTemplateSelectorProps {
  selectedTemplate: TaskTemplate | null
  onTemplateSelect: (template: TaskTemplate) => void
  isDarkMode: boolean
}

export const TaskTemplateSelector: React.FC<TaskTemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect,
  isDarkMode
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')
  
  const templates = TaskTemplateManager.getTemplates()
  
  // Extrair categorias únicas dos templates
  const categories = ['todos', ...Array.from(new Set(templates.flatMap(t => t.tags)))]
  
  // Filtrar templates baseado na busca e categoria
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'todos' || 
                           template.tags.includes(selectedCategory)
    
    return matchesSearch && matchesCategory
  })

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Simples':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
      case 'Moderada':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'Complexa':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400'
      case 'Muito Complexa':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const getModelBadgeColor = (model: string) => {
    switch (model) {
      case 'haiku':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'sonnet':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'opus':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${isDarkMode ? 'shadow-gray-900/20' : 'shadow-gray-200/60'}`}>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">📋 Templates de Tarefa</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Selecione um template pré-configurado ou crie do zero
        </p>
      </div>

      {/* Barra de busca */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">🔍</span>
          </div>
        </div>
      </div>

      {/* Filtro por categoria */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Botão para limpar seleção */}
      {selectedTemplate && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Template selecionado: {selectedTemplate.name}
              </span>
            </div>
            <button
              onClick={() => onTemplateSelect(null as any)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm"
            >
              ✕ Limpar
            </button>
          </div>
        </div>
      )}

      {/* Lista de templates */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>🔍 Nenhum template encontrado</p>
            <p className="text-sm mt-1">Tente ajustar os filtros de busca</p>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div
              key={template.name}
              onClick={() => onTemplateSelect(template)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                selectedTemplate?.name === template.name
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {/* Header do template */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{template.icon}</span>
                  <h3 className="font-semibold text-sm">{template.name}</h3>
                </div>
                
                {/* Badge do modelo */}
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${getModelBadgeColor(template.defaultModel)}`}>
                  {template.defaultModel.toUpperCase()}
                </span>
              </div>

              {/* Descrição */}
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                {template.description}
              </p>

              {/* Informações da tarefa */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Complexidade */}
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getComplexityColor(template.complexity)}`}>
                    {template.complexity}
                  </span>
                  
                  {/* Duração estimada */}
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    ⏱️ {template.estimatedDuration}
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-2 flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  >
                    #{tag}
                  </span>
                ))}
                {template.tags.length > 3 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{template.tags.length - 3} mais
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Estatísticas dos templates */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {templates.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Templates</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {templates.filter(t => t.complexity === 'Simples').length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Simples</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {templates.filter(t => t.complexity === 'Complexa' || t.complexity === 'Muito Complexa').length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Complexas</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskTemplateSelector