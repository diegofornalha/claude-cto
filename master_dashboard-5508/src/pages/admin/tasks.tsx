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
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { AuthProvider } from '../../contexts/AuthContext';
import { McpApi } from '../../services/mcp-api';

interface Task {
  id: string;
  identifier: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  title: string;
  createdAt: string;
  updatedAt: string;
  model?: string;
  workingDirectory?: string;
  result?: any;
  error?: string;
}

const TaskManagementContent: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Task['status']>('all');
  
  // Estados para diálogos
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Carregar tasks
  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:8888/api/v1/tasks');
      if (!response.ok) {
        throw new Error('Falha ao buscar tasks');
      }
      
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      console.error('Erro ao carregar tasks:', err);
      setError('Erro ao carregar tasks. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  // Deletar task individual
  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Chamar API para deletar task
      await McpApi.deleteTask(taskToDelete.identifier);
      
      // Remover da lista local
      setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
      setSelectedTask(null);
      setTaskToDelete(null);
      setDeleteDialogOpen(false);
      
      // Mostrar mensagem de sucesso
      setError(null);
    } catch (err) {
      setError('Erro ao deletar task. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Limpar tasks concluídas e com falha
  const handleClearTasks = async () => {
    try {
      setIsClearing(true);
      
      const result = await McpApi.clearTasks();
      
      if (result.success) {
        // Recarregar lista de tasks
        await loadTasks();
        setClearDialogOpen(false);
      } else {
        setError('Erro ao limpar tasks. Tente novamente.');
      }
    } catch (err) {
      setError('Erro ao limpar tasks. Tente novamente.');
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    loadTasks();
    
    // Auto-refresh a cada 10 segundos
    const interval = setInterval(loadTasks, 10000);
    return () => clearInterval(interval);
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

  // Filtrar tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchTerm === '' || 
      task.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Estatísticas
  const stats = {
    total: tasks.length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    toBeCleared: tasks.filter(t => t.status === 'completed' || t.status === 'failed').length
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Task Management"
        description="Gerenciamento centralizado de todas as tasks do sistema"
        actions={
          <Stack direction="horizontal" spacing="sm">
            <Button
              variant="danger"
              onClick={() => setClearDialogOpen(true)}
              disabled={stats.toBeCleared === 0}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
            >
              Limpar ({stats.toBeCleared})
            </Button>
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
          </Stack>
        }
      />

      <Stack spacing="lg">
        {/* Alertas */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Estatísticas */}
        <Grid cols={1} colsMd={2} colsLg={5} gap="lg">
          <Card>
            <CardBody>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Executando</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.running}</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Concluídas</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Falhas</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendentes</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.pending}</p>
              </div>
            </CardBody>
          </Card>
        </Grid>

        {/* Filtros */}
        <Card>
          <CardBody>
            <Stack direction="horizontal" spacing="sm" align="center" wrap>
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Buscar por identificador ou título..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="
                    w-full px-3 py-2
                    border border-gray-300 dark:border-gray-600
                    rounded-lg
                    bg-white dark:bg-gray-700
                    text-gray-900 dark:text-white
                    placeholder-gray-500 dark:placeholder-gray-400
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  "
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="
                  px-3 py-2
                  border border-gray-300 dark:border-gray-600
                  rounded-lg
                  bg-white dark:bg-gray-700
                  text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                "
              >
                <option value="all">Todos os status</option>
                <option value="running">Executando</option>
                <option value="completed">Concluídas</option>
                <option value="failed">Falhas</option>
                <option value="pending">Pendentes</option>
              </select>

              <Badge variant="default">
                {filteredTasks.length} tasks
              </Badge>
            </Stack>
          </CardBody>
        </Card>

        {/* Lista de Tasks */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tasks
            </h3>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Stack spacing="sm">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <Skeleton variant="text" className="mb-2" />
                    <Skeleton variant="text" className="w-3/4" />
                  </div>
                ))}
              </Stack>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhuma task encontrada
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Identificador
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Título
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Criada
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredTasks.map((task) => (
                      <tr 
                        key={task.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => setSelectedTask(task)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-sm text-gray-900 dark:text-white">
                            {task.identifier}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge {...getStatusBadgeProps(task.status)} size="sm">
                            {getStatusBadgeProps(task.status).text}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {task.title || 'Sem título'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatRelativeTime(task.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTaskToDelete(task);
                              setDeleteDialogOpen(true);
                            }}
                            disabled={task.status === 'running'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Detalhes da Task Selecionada */}
        {selectedTask && (
          <Card>
            <CardHeader>
              <Stack direction="horizontal" spacing="sm" align="center" justify="between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Detalhes da Task
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTask(null)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </Stack>
            </CardHeader>
            <CardBody>
              <Grid cols={1} colsMd={2} gap="md">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Identificador</p>
                  <p className="font-mono text-gray-900 dark:text-white">{selectedTask.identifier}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                  <Badge {...getStatusBadgeProps(selectedTask.status)}>
                    {getStatusBadgeProps(selectedTask.status).text}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Model</p>
                  <p className="text-gray-900 dark:text-white">{selectedTask.model || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Diretório</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white">
                    {selectedTask.workingDirectory || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Criada</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedTask.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Atualizada</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedTask.updatedAt).toLocaleString()}
                  </p>
                </div>
              </Grid>
              
              {selectedTask.error && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Erro</p>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
                      {selectedTask.error}
                    </pre>
                  </div>
                </div>
              )}
              
              {selectedTask.result && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Resultado</p>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(selectedTask.result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </Stack>

      {/* Diálogo de Confirmação para Deletar */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Deletar Task"
        message={`Tem certeza que deseja deletar a task "${taskToDelete?.identifier}"? Esta ação não pode ser desfeita.`}
        confirmText="Deletar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDeleteTask}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setTaskToDelete(null);
        }}
        loading={isDeleting}
      />

      {/* Diálogo de Confirmação para Limpar */}
      <ConfirmDialog
        isOpen={clearDialogOpen}
        title="Limpar Tasks"
        message={`Tem certeza que deseja limpar ${stats.toBeCleared} tasks (${stats.completed} concluídas e ${stats.failed} com falha)? Esta ação não pode ser desfeita.`}
        confirmText={`Limpar ${stats.toBeCleared} Tasks`}
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleClearTasks}
        onCancel={() => setClearDialogOpen(false)}
        loading={isClearing}
      />
    </AdminLayout>
  );
};

const TaskManagementPage: React.FC = () => {
  return (
    <AuthProvider>
      <ProtectedRoute requireAdmin>
        <TaskManagementContent />
      </ProtectedRoute>
    </AuthProvider>
  );
};

export default TaskManagementPage;