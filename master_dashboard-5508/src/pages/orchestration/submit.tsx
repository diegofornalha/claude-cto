import React, { useState, useCallback } from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Button, 
  Input,
  Select,
  Badge,
  Stack,
  Alert
} from '../../components/ui';

// Tipos para o formulário de orquestração
interface TaskFormData {
  task_identifier: string;
  execution_prompt: string;
  working_directory: string;
  model: 'opus' | 'sonnet' | 'haiku';
  depends_on: string[];
  wait_after_dependencies?: number;
}

interface OrchestrationFormData {
  orchestration_group: string;
  tasks: TaskFormData[];
}

const SubmitOrchestration: React.FC = () => {
  const [formData, setFormData] = useState<OrchestrationFormData>({
    orchestration_group: '',
    tasks: [{
      task_identifier: '',
      execution_prompt: '',
      working_directory: '.',
      model: 'opus',
      depends_on: [],
      wait_after_dependencies: undefined
    }]
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Opções para os selects
  const modelOptions = [
    { value: 'opus', label: 'Claude-3 Opus (Complexo/Padrão)' },
    { value: 'sonnet', label: 'Claude-3.5 Sonnet (Balanceado)' },
    { value: 'haiku', label: 'Claude-3 Haiku (Simples/Rápido)' }
  ];

  const handleGroupChange = (value: string) => {
    setFormData(prev => ({ ...prev, orchestration_group: value }));
  };

  const handleTaskChange = (index: number, field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  const addTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, {
        task_identifier: '',
        execution_prompt: '',
        working_directory: '.',
        model: 'opus',
        depends_on: [],
        wait_after_dependencies: undefined
      }]
    }));
  };

  const removeTask = (index: number) => {
    if (formData.tasks.length > 1) {
      setFormData(prev => ({
        ...prev,
        tasks: prev.tasks.filter((_, i) => i !== index)
      }));
    }
  };

  const handleDependencyChange = (taskIndex: number, dependencyValue: string) => {
    const dependencies = dependencyValue
      .split(',')
      .map(dep => dep.trim())
      .filter(dep => dep.length > 0);
    
    handleTaskChange(taskIndex, 'depends_on', dependencies);
  };

  const validateForm = (): string | null => {
    if (!formData.orchestration_group.trim()) {
      return 'Nome do grupo de orquestração é obrigatório';
    }

    for (let i = 0; i < formData.tasks.length; i++) {
      const task = formData.tasks[i];
      
      if (!task.task_identifier.trim()) {
        return `Identificador da tarefa ${i + 1} é obrigatório`;
      }
      
      if (!task.execution_prompt.trim()) {
        return `Prompt de execução da tarefa ${i + 1} é obrigatório`;
      }

      if (task.execution_prompt.length < 150) {
        return `Prompt de execução da tarefa ${i + 1} deve ter pelo menos 150 caracteres`;
      }

      // Verificar se dependências existem
      for (const dep of task.depends_on) {
        const dependencyExists = formData.tasks.some(t => t.task_identifier === dep);
        if (!dependencyExists) {
          return `Dependência "${dep}" da tarefa ${i + 1} não foi encontrada`;
        }
      }
    }

    // Verificar identificadores únicos
    const identifiers = formData.tasks.map(t => t.task_identifier);
    const uniqueIdentifiers = new Set(identifiers);
    if (identifiers.length !== uniqueIdentifiers.size) {
      return 'Todos os identificadores de tarefa devem ser únicos';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      // Submeter para a API real
      const response = await fetch('http://localhost:8888/api/v1/orchestrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orchestration_group: formData.orchestration_group,
          tasks: formData.tasks.map(task => ({
            task_identifier: task.task_identifier,
            execution_prompt: task.execution_prompt,
            working_directory: task.working_directory,
            model: task.model,
            depends_on: task.depends_on.length > 0 ? task.depends_on : undefined,
            wait_after_dependencies: task.wait_after_dependencies,
            orchestration_group: formData.orchestration_group
          }))
        })
      });

      if (!response.ok) {
        let errorMessage = `Erro HTTP: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.detail || errorData.message) {
            errorMessage = errorData.detail || errorData.message;
          }
        } catch {
          // Usar mensagem padrão se não conseguir parsear JSON
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Orquestração criada com sucesso:', result);
      
      setSuccess(true);
      
      // Redirecionar após sucesso (sem setTimeout)
      // Aguardar 2 segundos para mostrar mensagem de sucesso
      await new Promise(resolve => setTimeout(resolve, 2000));
      window.location.href = '/orchestration';

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao submeter orquestração: ${errorMessage}`);
      console.error('Erro ao submeter orquestração:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailableDependencies = (currentTaskIndex: number) => {
    return formData.tasks
      .slice(0, currentTaskIndex)
      .filter(task => task.task_identifier.trim() !== '')
      .map(task => task.task_identifier);
  };

  return (
    <PageLayout>
      <PageHeader
        title="Nova Orquestração"
        description="Crie e configure uma nova orquestração de tarefas com dependências"
        actions={
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/orchestration'}
          >
            Voltar
          </Button>
        }
      />

      {error && (
        <Alert severity="error" title="Erro de validação" className="mb-6">
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" title="Orquestração criada!" className="mb-6">
          Sua orquestração foi criada com sucesso. Redirecionando para o dashboard...
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Configurações do Grupo */}
        <Card padding="lg" className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Configurações do Grupo
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure as propriedades gerais da orquestração
            </p>
          </CardHeader>

          <CardBody>
            <Input
              label="Nome do Grupo de Orquestração"
              value={formData.orchestration_group}
              onChange={(e) => handleGroupChange(e.target.value)}
              placeholder="ex: feature-development, data-migration, refactor-auth"
              helperText="Identificador único para agrupar as tarefas relacionadas"
              required
              fullWidth
            />
          </CardBody>
        </Card>

        {/* Tarefas */}
        <Card padding="lg" className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Tarefas
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Configure as tarefas individuais e suas dependências
                </p>
              </div>
              <Button type="button" variant="outline" onClick={addTask}>
                Adicionar Tarefa
              </Button>
            </div>
          </CardHeader>

          <CardBody>
            <Stack spacing="xl">
              {formData.tasks.map((task, index) => (
                <div 
                  key={index}
                  className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Tarefa {index + 1}
                    </h3>
                    {formData.tasks.length > 1 && (
                      <Button 
                        type="button"
                        variant="danger" 
                        size="sm"
                        onClick={() => removeTask(index)}
                      >
                        Remover
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Input
                      label="Identificador da Tarefa"
                      value={task.task_identifier}
                      onChange={(e) => handleTaskChange(index, 'task_identifier', e.target.value)}
                      placeholder="ex: analyze_code, implement_feature"
                      required
                      fullWidth
                    />

                    <Select
                      label="Modelo"
                      value={task.model}
                      onChange={(e) => handleTaskChange(index, 'model', e.target.value as any)}
                      options={modelOptions}
                      selectSize="md"
                    />
                  </div>

                  <div className="mb-4">
                    <Input
                      label="Diretório de Trabalho"
                      value={task.working_directory}
                      onChange={(e) => handleTaskChange(index, 'working_directory', e.target.value)}
                      placeholder="/path/to/project"
                      helperText="Caminho onde a tarefa será executada"
                      fullWidth
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Prompt de Execução <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={task.execution_prompt}
                      onChange={(e) => handleTaskChange(index, 'execution_prompt', e.target.value)}
                      placeholder="Descreva detalhadamente o que a tarefa deve fazer..."
                      className="
                        w-full px-4 py-3 rounded-lg border
                        border-gray-300 dark:border-gray-600
                        bg-white dark:bg-gray-900
                        text-gray-900 dark:text-gray-100
                        placeholder-gray-400 dark:placeholder-gray-500
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        transition-colors duration-200
                        resize-vertical min-h-[120px]
                      "
                      required
                    />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Mínimo 150 caracteres • Atual: {task.execution_prompt.length} caracteres
                    </p>
                  </div>

                  {/* Dependências */}
                  {getAvailableDependencies(index).length > 0 && (
                    <div className="mb-4">
                      <Input
                        label="Dependências (opcional)"
                        value={task.depends_on.join(', ')}
                        onChange={(e) => handleDependencyChange(index, e.target.value)}
                        placeholder="identificador1, identificador2"
                        helperText="Tarefas que devem ser concluídas antes desta (separadas por vírgula)"
                        fullWidth
                      />
                      
                      {getAvailableDependencies(index).length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Dependências disponíveis:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {getAvailableDependencies(index).map(dep => (
                              <Badge key={dep} variant="secondary" size="sm">
                                {dep}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delay após dependências */}
                  {task.depends_on.length > 0 && (
                    <div>
                      <Input
                        label="Aguardar após dependências (segundos)"
                        type="number"
                        min="0"
                        step="0.1"
                        value={task.wait_after_dependencies?.toString() || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : undefined;
                          handleTaskChange(index, 'wait_after_dependencies', value);
                        }}
                        placeholder="0"
                        helperText="Tempo adicional de espera após conclusão das dependências"
                        fullWidth
                      />
                    </div>
                  )}
                </div>
              ))}
            </Stack>
          </CardBody>
        </Card>

        {/* Resumo */}
        <Card padding="lg" className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Resumo da Orquestração
            </h2>
          </CardHeader>

          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formData.tasks.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Tarefas
                </div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formData.tasks.filter(t => t.depends_on.length > 0).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Com Dependências
                </div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {new Set(formData.tasks.map(t => t.model)).size}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Modelos Diferentes
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Ações */}
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => window.location.href = '/orchestration'}
          >
            Cancelar
          </Button>
          
          <Button 
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={submitting}
          >
            {submitting ? 'Criando Orquestração...' : 'Criar Orquestração'}
          </Button>
        </div>
      </form>
    </PageLayout>
  );
};

export default SubmitOrchestration;