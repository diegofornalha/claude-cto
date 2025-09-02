import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Grid, GridItem, MetricsGrid } from '@/components/ui/Grid';
import { Stack } from '@/components/ui/Stack';
import { Skeleton, SkeletonCard, SkeletonMetricCard } from '@/components/ui/Skeleton';
import { McpApi, Task, ApiError } from '@/services/mcp-api';

// Types
interface TaskStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
}


// Components
const MetricCard: React.FC<{
  title: string;
  value: number;
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info';
  icon: React.ReactNode;
}> = ({ title, value, variant, icon }) => (
  <Card>
    <CardBody>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value.toLocaleString()}
          </p>
        </div>
        <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700">
          {icon}
        </div>
      </div>
    </CardBody>
  </Card>
);

const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
  const getStatusBadgeVariant = (status: Task['status']) => {
    switch (status) {
      case 'running': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'danger';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card hoverable>
      <CardBody>
        <Stack direction="vertical" spacing="sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {task.identifier}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Modelo: {task.model} • Diretório: {task.working_directory}
              </p>
            </div>
            <Badge variant={getStatusBadgeVariant(task.status)}>
              {task.status}
            </Badge>
          </div>
          
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            {task.execution_prompt}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Criada: {formatDate(task.created_at)}</span>
            <span>Atualizada: {formatDate(task.updated_at)}</span>
          </div>
        </Stack>
      </CardBody>
    </Card>
  );
};

export default function TasksDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  // Função para calcular estatísticas das tasks
  const calculateStats = (tasks: Task[]): TaskStats => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const running = tasks.filter(t => t.status === 'running').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const failed = tasks.filter(t => t.status === 'failed').length;

    return { total, pending, running, completed, failed };
  };

  // Função para carregar dados da API
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Verificar conectividade da API
      const isOnline = await McpApi.healthCheck();
      setApiStatus(isOnline ? 'online' : 'offline');

      if (!isOnline) {
        throw new Error('API Claude CTO não está disponível em http://localhost:8888');
      }

      // Buscar todas as tasks
      const tasks = await McpApi.getTasks();
      
      // Calcular estatísticas
      const calculatedStats = calculateStats(tasks);
      setStats(calculatedStats);

      // Ordenar tasks por data de criação (mais recentes primeiro) e pegar as primeiras 10
      const sortedTasks = tasks
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
      
      setRecentTasks(sortedTasks);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar dados';
      setError(errorMessage);
      setApiStatus('offline');
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Função para refresh manual
  const handleRefresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  // Função para navegar para criar nova task
  const handleNewTask = useCallback(() => {
    router.push('/tasks/create');
  }, [router]);

  // Carregamento inicial dos dados
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh a cada 15 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 15000); // 15 segundos

    return () => clearInterval(interval);
  }, [loadData]);

  const headerActions = (
    <Stack direction="horizontal" spacing="sm" align="center">
      {/* Status da API */}
      <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className={`w-2 h-2 rounded-full ${
          apiStatus === 'online' ? 'bg-green-500' :
          apiStatus === 'offline' ? 'bg-red-500' :
          'bg-yellow-500 animate-pulse'
        }`}></div>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {apiStatus === 'online' ? 'API Online' :
           apiStatus === 'offline' ? 'API Offline' :
           'Verificando...'}
        </span>
      </div>

      <Button 
        variant="outline" 
        size="md" 
        onClick={handleRefresh}
        disabled={refreshing}
      >
        <svg 
          className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {refreshing ? 'Atualizando...' : 'Atualizar'}
      </Button>
      <Button variant="outline" size="md">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Exportar
      </Button>
      <Button size="md" onClick={handleNewTask}>
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Nova Task
      </Button>
    </Stack>
  );

  return (
    <PageLayout>
      <PageHeader
        title="Dashboard de Tasks"
        description="Monitore e gerencie todas as suas tasks de desenvolvimento"
        actions={headerActions}
      />

      <Stack direction="vertical" spacing="lg">
        {/* Alerta de Erro */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                  Erro ao carregar dados
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    Tentar novamente
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Métricas */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Métricas Gerais
          </h2>
          
          {loading ? (
            <MetricsGrid>
              {[...Array(5)].map((_, i) => (
                <SkeletonMetricCard key={i} />
              ))}
            </MetricsGrid>
          ) : (
            <MetricsGrid>
              <MetricCard
                title="Total de Tasks"
                value={stats?.total || 0}
                variant="default"
                icon={
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              />
              
              <MetricCard
                title="Em Execução"
                value={stats?.running || 0}
                variant="info"
                icon={
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              
              <MetricCard
                title="Pendentes"
                value={stats?.pending || 0}
                variant="warning"
                icon={
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              
              <MetricCard
                title="Completadas"
                value={stats?.completed || 0}
                variant="success"
                icon={
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                }
              />
              
              <MetricCard
                title="Falhas"
                value={stats?.failed || 0}
                variant="danger"
                icon={
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                }
              />
            </MetricsGrid>
          )}
        </section>

        {/* Tasks Recentes */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tasks Recentes
            </h2>
            <Button variant="ghost" size="sm">
              Ver todas
            </Button>
          </div>

          {loading ? (
            <Grid cols={1} colsMd={2} colsLg={3} gap="lg">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </Grid>
          ) : (
            <Grid cols={1} colsMd={2} colsLg={3} gap="lg">
              {recentTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </Grid>
          )}
        </section>

        {/* Ações Rápidas */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ações Rápidas
          </h2>
          
          <Grid cols={1} colsMd={2} colsLg={4} gap="md">
            <Card hoverable onClick={handleNewTask} className="cursor-pointer">
              <CardBody>
                <Stack direction="vertical" spacing="sm" align="center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Nova Task
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Criar uma nova task de desenvolvimento
                  </p>
                </Stack>
              </CardBody>
            </Card>

            <Card hoverable>
              <CardBody>
                <Stack direction="vertical" spacing="sm" align="center">
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Templates
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Usar templates pré-definidos
                  </p>
                </Stack>
              </CardBody>
            </Card>

            <Card hoverable>
              <CardBody>
                <Stack direction="vertical" spacing="sm" align="center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Orquestração
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Gerenciar tasks em lote
                  </p>
                </Stack>
              </CardBody>
            </Card>

            <Card hoverable>
              <CardBody>
                <Stack direction="vertical" spacing="sm" align="center">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Relatórios
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Visualizar análises e métricas
                  </p>
                </Stack>
              </CardBody>
            </Card>
          </Grid>
        </section>
      </Stack>
    </PageLayout>
  );
}