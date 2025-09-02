import React, { useState, useEffect } from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Button, 
  Badge, 
  Grid, 
  Stack,
  Skeleton,
  Alert
} from '../../components/ui';

// Tipos para o dashboard de orquestração
interface OrchestrationTask {
  id: string;
  identifier: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  execution_prompt: string;
  working_directory: string;
  model: string;
  depends_on?: string[];
  orchestration_group?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

interface OrchestrationGroup {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  tasks: OrchestrationTask[];
  created_at: string;
  progress: number;
}

const OrchestrationDashboard: React.FC = () => {
  const [groups, setGroups] = useState<OrchestrationGroup[]>([]);
  const [tasks, setTasks] = useState<OrchestrationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data para desenvolvimento
  useEffect(() => {
    // Simular carregamento
    const timer = setTimeout(() => {
      setGroups([
        {
          name: 'feature-development',
          status: 'running',
          progress: 65,
          created_at: '2024-01-10T10:30:00Z',
          tasks: [
            {
              id: '1',
              identifier: 'analyze_codebase',
              status: 'completed',
              execution_prompt: 'Analisar a estrutura da base de código para identificar padrões',
              working_directory: '/project',
              model: 'opus',
              orchestration_group: 'feature-development',
              created_at: '2024-01-10T10:30:00Z',
              completed_at: '2024-01-10T10:35:00Z'
            },
            {
              id: '2',
              identifier: 'implement_feature',
              status: 'running',
              execution_prompt: 'Implementar nova funcionalidade baseada na análise',
              working_directory: '/project',
              model: 'opus',
              depends_on: ['analyze_codebase'],
              orchestration_group: 'feature-development',
              created_at: '2024-01-10T10:36:00Z',
              started_at: '2024-01-10T10:36:00Z'
            },
            {
              id: '3',
              identifier: 'run_tests',
              status: 'pending',
              execution_prompt: 'Executar testes automatizados',
              working_directory: '/project',
              model: 'sonnet',
              depends_on: ['implement_feature'],
              orchestration_group: 'feature-development',
              created_at: '2024-01-10T10:36:00Z'
            }
          ]
        }
      ]);
      
      setTasks([
        {
          id: '4',
          identifier: 'standalone_refactor',
          status: 'completed',
          execution_prompt: 'Refatorar módulo de autenticação',
          working_directory: '/auth-service',
          model: 'sonnet',
          created_at: '2024-01-10T09:00:00Z',
          completed_at: '2024-01-10T09:15:00Z'
        }
      ]);
      
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pendente', dot: false },
      running: { variant: 'primary' as const, label: 'Executando', dot: true },
      completed: { variant: 'success' as const, label: 'Completo', dot: false },
      failed: { variant: 'danger' as const, label: 'Falhou', dot: false },
      cancelled: { variant: 'default' as const, label: 'Cancelado', dot: false }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} dot={config.dot}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const headerActions = (
    <Stack direction="row" spacing="md">
      <Button 
        variant="outline" 
        onClick={() => window.location.reload()}
      >
        Atualizar
      </Button>
      <Button 
        variant="primary"
        onClick={() => window.location.href = '/orchestration/submit'}
      >
        Nova Orquestração
      </Button>
    </Stack>
  );

  if (loading) {
    return (
      <PageLayout>
        <PageHeader
          title="Dashboard de Orquestração"
          description="Gerencie e monitore suas orquestrações de tarefas"
          actions={headerActions}
        />
        
        <Grid columns={{ base: 1, lg: 2 }} spacing="lg">
          {[...Array(4)].map((_, i) => (
            <Card key={i} padding="lg">
              <Skeleton height="h-6" width="w-3/4" className="mb-4" />
              <Skeleton height="h-4" width="w-full" className="mb-2" />
              <Skeleton height="h-4" width="w-5/6" />
            </Card>
          ))}
        </Grid>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <PageHeader
          title="Dashboard de Orquestração"
          description="Gerencie e monitore suas orquestrações de tarefas"
          actions={headerActions}
        />
        
        <Alert variant="danger" title="Erro ao carregar dados">
          {error}
        </Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Dashboard de Orquestração"
        description="Gerencie e monitore suas orquestrações de tarefas"
        actions={headerActions}
      />

      {/* Grupos de Orquestração */}
      {groups.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Orquestrações Ativas
          </h2>
          
          <Stack spacing="lg">
            {groups.map((group) => (
              <Card key={group.name} padding="lg" hover>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {group.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {group.tasks.length} tarefas • Criado em {formatDate(group.created_at)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getStatusBadge(group.status)}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {group.progress}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Barra de progresso */}
                  <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${group.progress}%` }}
                    />
                  </div>
                </CardHeader>

                <CardBody>
                  <div className="space-y-3">
                    {group.tasks.map((task) => (
                      <div 
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-gray-900 dark:text-white">
                              {task.identifier}
                            </span>
                            {getStatusBadge(task.status)}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {task.execution_prompt}
                          </p>
                          {task.depends_on && task.depends_on.length > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Depende de: {task.depends_on.join(', ')}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="secondary" size="sm">
                            {task.model}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ))}
          </Stack>
        </div>
      )}

      {/* Tarefas Individuais */}
      {tasks.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Tarefas Individuais
          </h2>
          
          <Grid columns={{ base: 1, md: 2, lg: 3 }} spacing="lg">
            {tasks.map((task) => (
              <Card key={task.id} padding="md" hover>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {task.identifier}
                  </h3>
                  {getStatusBadge(task.status)}
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {task.execution_prompt}
                </p>
                
                <div className="space-y-2 text-xs text-gray-500 dark:text-gray-500">
                  <div className="flex justify-between">
                    <span>Modelo:</span>
                    <Badge variant="secondary" size="sm">{task.model}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Criado:</span>
                    <span>{formatDate(task.created_at)}</span>
                  </div>
                  {task.completed_at && (
                    <div className="flex justify-between">
                      <span>Concluído:</span>
                      <span>{formatDate(task.completed_at)}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </Grid>
        </div>
      )}

      {/* Estado vazio */}
      {groups.length === 0 && tasks.length === 0 && (
        <Card padding="lg" className="text-center">
          <div className="py-12">
            <div className="text-gray-400 mb-4">
              <svg 
                className="w-16 h-16 mx-auto" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhuma orquestração encontrada
            </h3>
            
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Crie sua primeira orquestração de tarefas para começar.
            </p>
            
            <Button 
              variant="primary"
              onClick={() => window.location.href = '/orchestration/submit'}
            >
              Criar Orquestração
            </Button>
          </div>
        </Card>
      )}
    </PageLayout>
  );
};

export default OrchestrationDashboard;