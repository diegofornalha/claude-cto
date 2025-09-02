import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Grid, GridItem } from '@/components/ui/Grid';
import { Stack } from '@/components/ui/Stack';

// Types
interface TaskFormData {
  identifier: string;
  execution_prompt: string;
  working_directory: string;
  model: 'opus' | 'sonnet' | 'haiku';
  system_prompt?: string;
  depends_on: string[];
  wait_after_dependencies?: number;
  orchestration_group?: string;
}

interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  template: Partial<TaskFormData>;
  category: 'development' | 'testing' | 'deployment' | 'analysis';
}

// Mock templates
const templates: TaskTemplate[] = [
  {
    id: 'refactor-component',
    name: 'Refatorar Componente',
    description: 'Template para refatoração de componentes React',
    category: 'development',
    template: {
      execution_prompt: 'Refatorar o componente [NOME_COMPONENTE] aplicando as melhores práticas do React e TypeScript. Melhorar legibilidade, performance e manutenibilidade.',
      model: 'sonnet',
      working_directory: './src/components'
    }
  },
  {
    id: 'add-tests',
    name: 'Adicionar Testes',
    description: 'Template para criação de testes unitários',
    category: 'testing',
    template: {
      execution_prompt: 'Criar testes unitários abrangentes para [MÓDULO/COMPONENTE] usando Jest e Testing Library. Incluir casos de teste para cenários positivos, negativos e edge cases.',
      model: 'haiku',
      working_directory: './src/tests'
    }
  },
  {
    id: 'api-optimization',
    name: 'Otimização de API',
    description: 'Template para otimizar endpoints de API',
    category: 'development',
    template: {
      execution_prompt: 'Otimizar o endpoint [ENDPOINT_NAME] para melhorar performance. Analisar queries de banco, implementar cache, validar payloads e adicionar rate limiting se necessário.',
      model: 'opus',
      working_directory: './src/api'
    }
  },
  {
    id: 'bug-fix',
    name: 'Correção de Bug',
    description: 'Template para correção sistemática de bugs',
    category: 'development',
    template: {
      execution_prompt: 'Investigar e corrigir o bug: [DESCRIÇÃO_DO_BUG]. Identificar causa raiz, implementar correção, adicionar testes para prevenir regressão.',
      model: 'sonnet',
      working_directory: './'
    }
  }
];

const modelOptions = [
  { value: 'opus', label: 'Opus (Complexo)' },
  { value: 'sonnet', label: 'Sonnet (Equilibrado)' },
  { value: 'haiku', label: 'Haiku (Rápido)' }
];

export default function CreateTask() {
  const [formData, setFormData] = useState<TaskFormData>({
    identifier: '',
    execution_prompt: '',
    working_directory: './',
    model: 'sonnet',
    system_prompt: '',
    depends_on: [],
    wait_after_dependencies: undefined,
    orchestration_group: ''
  });

  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<TaskFormData>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const applyTemplate = (template: TaskTemplate) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      ...template.template
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<TaskFormData> = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Identificador é obrigatório';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.identifier)) {
      newErrors.identifier = 'Identificador deve conter apenas letras, números, _ e -';
    }

    if (!formData.execution_prompt.trim()) {
      newErrors.execution_prompt = 'Prompt de execução é obrigatório';
    } else if (formData.execution_prompt.length < 50) {
      newErrors.execution_prompt = 'Prompt deve ter pelo menos 50 caracteres';
    }

    if (!formData.working_directory.trim()) {
      newErrors.working_directory = 'Diretório de trabalho é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Simular chamada API
      console.log('Criando task:', formData);
      
      // Aqui você faria a chamada real para a API
      // const response = await createTask(formData);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset form after success
      setFormData({
        identifier: '',
        execution_prompt: '',
        working_directory: './',
        model: 'sonnet',
        system_prompt: '',
        depends_on: [],
        wait_after_dependencies: undefined,
        orchestration_group: ''
      });
      
      setSelectedTemplate(null);
      
      alert('Task criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar task:', error);
      alert('Erro ao criar task. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getTemplatesByCategory = (category: TaskTemplate['category']) => 
    templates.filter(t => t.category === category);

  const headerActions = (
    <Stack direction="horizontal" gap="sm">
      <Button variant="outline" size="md">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Templates
      </Button>
    </Stack>
  );

  return (
    <PageLayout>
      <PageHeader
        title="Nova Task"
        description="Crie uma nova task de desenvolvimento automatizada"
        actions={headerActions}
      />

      <Grid cols={1} responsive={{ lg: 3 }} gap="lg">
        {/* Templates Section */}
        <GridItem span={1}>
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Templates Disponíveis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use templates pré-definidos para acelerar a criação
              </p>
            </CardHeader>
            <CardBody>
              <Stack direction="vertical" gap="md">
                {['development', 'testing', 'deployment', 'analysis'].map(category => {
                  const categoryTemplates = getTemplatesByCategory(category as TaskTemplate['category']);
                  if (categoryTemplates.length === 0) return null;

                  return (
                    <div key={category}>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                        {category}
                      </h4>
                      <Stack direction="vertical" gap="xs">
                        {categoryTemplates.map(template => (
                          <Card
                            key={template.id}
                            hoverable
                            className={`cursor-pointer transition-colors ${
                              selectedTemplate?.id === template.id 
                                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                : ''
                            }`}
                            onClick={() => applyTemplate(template)}
                          >
                            <CardBody padding="sm">
                              <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                {template.name}
                              </h5>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {template.description}
                              </p>
                            </CardBody>
                          </Card>
                        ))}
                      </Stack>
                    </div>
                  );
                })}
              </Stack>
            </CardBody>
          </Card>
        </GridItem>

        {/* Form Section */}
        <GridItem span={1} responsive={{ lg: 2 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Configuração da Task
                  </h3>
                  {selectedTemplate && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Template aplicado:
                      </span>
                      <Badge variant="info" size="sm">
                        {selectedTemplate.name}
                      </Badge>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? 'Ocultar' : 'Avançado'}
                </Button>
              </div>
            </CardHeader>
            
            <CardBody>
              <form onSubmit={handleSubmit}>
                <Stack direction="vertical" gap="lg">
                  {/* Basic Fields */}
                  <Grid cols={1} responsive={{ md: 2 }} gap="md">
                    <Input
                      label="Identificador"
                      placeholder="ex: refactor-auth-module"
                      value={formData.identifier}
                      onChange={(e) => handleInputChange('identifier', e.target.value)}
                      error={errors.identifier}
                      helperText="Nome único para identificar a task"
                      fullWidth
                      required
                    />

                    <Select
                      label="Modelo"
                      options={modelOptions}
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      helperText="Escolha baseado na complexidade"
                      fullWidth
                    />
                  </Grid>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Prompt de Execução *
                    </label>
                    <textarea
                      className={`
                        w-full px-4 py-3 rounded-lg border transition-all duration-200
                        bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                        placeholder:text-gray-400 dark:placeholder:text-gray-500
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                        ${errors.execution_prompt 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 dark:border-gray-600'
                        }
                      `}
                      rows={4}
                      placeholder="Descreva detalhadamente o que a task deve fazer..."
                      value={formData.execution_prompt}
                      onChange={(e) => handleInputChange('execution_prompt', e.target.value)}
                      required
                    />
                    {errors.execution_prompt && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                        {errors.execution_prompt}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {formData.execution_prompt.length}/150+ caracteres
                    </p>
                  </div>

                  <Input
                    label="Diretório de Trabalho"
                    placeholder="ex: ./src/components"
                    value={formData.working_directory}
                    onChange={(e) => handleInputChange('working_directory', e.target.value)}
                    error={errors.working_directory}
                    helperText="Diretório onde a task será executada"
                    fullWidth
                    required
                  />

                  {/* Advanced Fields */}
                  {showAdvanced && (
                    <Stack direction="vertical" gap="md">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          System Prompt (Opcional)
                        </label>
                        <textarea
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="Instruções especiais para o sistema..."
                          value={formData.system_prompt}
                          onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                        />
                      </div>

                      <Grid cols={1} responsive={{ md: 2 }} gap="md">
                        <Input
                          label="Grupo de Orquestração (Opcional)"
                          placeholder="ex: deployment-batch-1"
                          value={formData.orchestration_group}
                          onChange={(e) => handleInputChange('orchestration_group', e.target.value)}
                          helperText="Agrupe tasks relacionadas"
                          fullWidth
                        />

                        <Input
                          type="number"
                          label="Delay após Dependências (s)"
                          placeholder="0"
                          value={formData.wait_after_dependencies || ''}
                          onChange={(e) => handleInputChange('wait_after_dependencies', e.target.value ? Number(e.target.value) : undefined)}
                          helperText="Tempo de espera em segundos"
                          fullWidth
                        />
                      </Grid>
                    </Stack>
                  )}

                  {/* Form Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setFormData({
                          identifier: '',
                          execution_prompt: '',
                          working_directory: './',
                          model: 'sonnet',
                          system_prompt: '',
                          depends_on: [],
                          wait_after_dependencies: undefined,
                          orchestration_group: ''
                        });
                        setSelectedTemplate(null);
                        setErrors({});
                      }}
                    >
                      Limpar
                    </Button>
                    <Button
                      type="submit"
                      loading={loading}
                      disabled={loading}
                    >
                      {loading ? 'Criando...' : 'Criar Task'}
                    </Button>
                  </div>
                </Stack>
              </form>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </PageLayout>
  );
}