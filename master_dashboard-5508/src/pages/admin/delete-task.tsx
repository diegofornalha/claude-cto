import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Grid } from '../../components/ui/Grid';
import { Stack } from '../../components/ui/Stack';
import { Skeleton } from '../../components/ui/Skeleton';

interface Task {
  id: string;
  identifier: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  title: string;
  createdAt: string;
  updatedAt: string;
  model?: string;
  workingDirectory?: string;
}

interface DeleteResult {
  success: boolean;
  message: string;
  taskId?: string;
}

const DeleteTaskPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteResult, setDeleteResult] = useState<DeleteResult | null>(null);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Simular carregamento de tasks
  const loadTasks = async () => {
    try {
      setLoading(true);
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dados mockados
      const mockTasks: Task[] = [
        {
          id: 'task-1',
          identifier: 'analyze_project',
          status: 'completed',
          title: 'Análise do projeto principal',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 80000000).toISOString(),
          model: 'opus',
          workingDirectory: '/project'
        },
        {
          id: 'task-2',
          identifier: 'fix_bugs',
          status: 'failed',
          title: 'Correção de bugs críticos',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: new Date(Date.now() - 6900000).toISOString(),
          model: 'sonnet',
          workingDirectory: '/project/src'
        },
        {
          id: 'task-3',
          identifier: 'update_docs',
          status: 'completed',
          title: 'Atualização da documentação',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3300000).toISOString(),
          model: 'haiku',
          workingDirectory: '/docs'
        },
        {
          id: 'task-4',
          identifier: 'optimize_code',
          status: 'running',
          title: 'Otimização de performance',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          updatedAt: new Date(Date.now() - 300000).toISOString(),
          model: 'opus',
          workingDirectory: '/project/src'
        },
        {
          id: 'task-5',
          identifier: 'test_suite',
          status: 'pending',
          title: 'Execução da suite de testes',
          createdAt: new Date(Date.now() - 900000).toISOString(),
          updatedAt: new Date(Date.now() - 900000).toISOString(),
          model: 'sonnet',
          workingDirectory: '/project/tests'
        }
      ];
      
      setTasks(mockTasks);
    } catch (err) {
      setError('Erro ao carregar lista de tasks');
    } finally {
      setLoading(false);
    }
  };

  // Simular operação de delete
  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    try {
      setDeleting(taskId);
      setError(null);
      setDeleteResult(null);
      
      // Simular delay de operação
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Verificar se task pode ser deletada (não pode deletar tasks em execução)
      if (task.status === 'running') {
        throw new Error('Não é possível deletar uma task que está em execução');
      }
      
      // Simular resultado de sucesso
      const result: DeleteResult = {
        success: true,
        message: `Task "${task.identifier}" foi removida com sucesso`,
        taskId: taskId
      };
      
      setDeleteResult(result);
      
      // Remover task da lista
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setSelectedTask('');
      
    } catch (err) {
      const result: DeleteResult = {
        success: false,
        message: err instanceof Error ? err.message : 'Erro ao deletar task. Tente novamente.',
        taskId: taskId
      };
      setDeleteResult(result);
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const getStatusBadgeProps = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return { variant: 'success' as const, text: 'Concluída' };
      case 'running':
        return { variant: 'info' as const, text: 'Executando' };
      case 'pending':
        return { variant: 'warning' as const, text: 'Pendente' };
      case 'failed':
        return { variant: 'danger' as const, text: 'Falha' };
      default:
        return { variant: 'default' as const, text: 'Desconhecido' };
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const now = new Date();
    const time = new Date(isoString);
    const diffMs = now.getTime() - time.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs}s atrás`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m atrás`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h atrás`;
    return `${Math.floor(diffSecs / 86400)}d atrás`;
  };

  const filteredTasks = tasks.filter(task =>
    task.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedTaskData = selectedTask ? tasks.find(t => t.id === selectedTask) : null;
  const canDelete = selectedTaskData && selectedTaskData.status !== 'running';

  return (
    <AdminLayout>
      <PageHeader
        title="Delete Task"
        description="Remover uma task específica do sistema. Tasks em execução não podem ser removidas."
        actions={
          <Button
            variant="secondary"
            onClick={loadTasks}
            loading={loading}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Atualizar
          </Button>
        }
      />

      <Stack spacing="lg">
        {/* Alertas */}
        {error && (
          <Alert variant="danger" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {deleteResult && (
          <Alert 
            variant={deleteResult.success ? 'success' : 'danger'}
            onClose={() => setDeleteResult(null)}
          >
            {deleteResult.message}
          </Alert>
        )}

        <Grid cols="1" responsive={{ lg: 2 }} gap="lg">
          {/* Lista de Tasks */}
          <Card>
            <CardHeader>
              <Stack direction="horizontal" spacing="sm" align="center" justify="between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Selecionar Task
                </h3>
                <Badge variant="default" size="sm">
                  {filteredTasks.length} tasks
                </Badge>
              </Stack>
            </CardHeader>
            <CardBody>
              <Stack spacing="md">
                {/* Busca */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por identificador ou título..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="
                      w-full pl-10 pr-4 py-2 
                      border border-gray-300 dark:border-gray-600
                      rounded-lg 
                      bg-white dark:bg-gray-700
                      text-gray-900 dark:text-white
                      placeholder-gray-500 dark:placeholder-gray-400
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      transition-colors
                    "
                  />
                  <svg 
                    className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Lista de Tasks */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {loading ? (
                    Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <Skeleton variant="text" className="mb-2" />
                        <Skeleton variant="text" className="w-3/4" />
                      </div>
                    ))
                  ) : filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                      <label 
                        key={task.id}
                        className={`
                          block p-3 border rounded-lg cursor-pointer transition-all
                          ${selectedTask === task.id 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="selectedTask"
                          value={task.id}
                          checked={selectedTask === task.id}
                          onChange={(e) => setSelectedTask(e.target.value)}
                          className="sr-only"
                        />
                        <Stack spacing="sm">
                          <Stack direction="horizontal" spacing="sm" align="center" justify="between">
                            <div className="font-mono text-sm text-gray-900 dark:text-white">
                              {task.identifier}
                            </div>
                            <Badge {...getStatusBadgeProps(task.status)} size="sm">
                              {getStatusBadgeProps(task.status).text}
                            </Badge>
                          </Stack>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {task.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Criada {formatRelativeTime(task.createdAt)}
                          </div>
                        </Stack>
                      </label>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400">
                        Nenhuma task encontrada
                      </p>
                    </div>
                  )}
                </div>
              </Stack>
            </CardBody>
          </Card>

          {/* Detalhes e Ação de Delete */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Detalhes e Ação
              </h3>
            </CardHeader>
            <CardBody>
              {selectedTaskData ? (
                <Stack spacing="md">
                  {/* Detalhes da Task */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <Stack spacing="sm">
                      <Stack direction="horizontal" spacing="sm" align="center" justify="between">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {selectedTaskData.identifier}
                        </h4>
                        <Badge {...getStatusBadgeProps(selectedTaskData.status)}>
                          {getStatusBadgeProps(selectedTaskData.status).text}
                        </Badge>
                      </Stack>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedTaskData.title}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Model:</span>
                          <div className="font-mono">{selectedTaskData.model || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Diretório:</span>
                          <div className="font-mono truncate">{selectedTaskData.workingDirectory || 'N/A'}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Criada:</span>
                          <div>{formatRelativeTime(selectedTaskData.createdAt)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Atualizada:</span>
                          <div>{formatRelativeTime(selectedTaskData.updatedAt)}</div>
                        </div>
                      </div>
                    </Stack>
                  </div>

                  {/* Aviso de Segurança */}
                  {canDelete ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-red-800 dark:text-red-300">
                            Ação Irreversível
                          </h4>
                          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                            Esta operação irá remover permanentemente a task selecionada do sistema. 
                            Esta ação não pode ser desfeita.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Alert variant="warning">
                      Tasks em execução não podem ser removidas. Aguarde a conclusão ou falha da task.
                    </Alert>
                  )}

                  {/* Botões de Ação */}
                  <Stack direction="horizontal" spacing="sm" align="center">
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteTask(selectedTaskData.id)}
                      disabled={!canDelete}
                      loading={deleting === selectedTaskData.id}
                      leftIcon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      }
                    >
                      {deleting === selectedTaskData.id ? 'Deletando...' : 'Deletar Task'}
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => setSelectedTask('')}
                    >
                      Cancelar
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <div className="text-center py-8">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full inline-flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Selecione uma Task
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Escolha uma task da lista ao lado para ver os detalhes e opção de remoção.
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </Grid>
      </Stack>
    </AdminLayout>
  );
};

export default DeleteTaskPage;