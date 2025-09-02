import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Grid, GridItem, MetricsGrid } from '@/components/ui/Grid';
import { Stack } from '@/components/ui/Stack';
import { Skeleton, SkeletonCard, SkeletonMetricCard } from '@/components/ui/Skeleton';

// Types
interface Task {
  id: string;
  identifier: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  execution_prompt: string;
  model: string;
  working_directory: string;
}

interface TaskStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

// Mock data - Replace with real API calls
const mockStats: TaskStats = {
  total: 247,
  pending: 12,
  running: 3,
  completed: 215,
  failed: 17
};

const mockRecentTasks: Task[] = [
  {
    id: '1',
    identifier: 'refactor-auth-system',
    status: 'running',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T11:45:00Z',
    execution_prompt: 'Refactor the authentication system to use JWT tokens',
    model: 'opus',
    working_directory: '/app/src'
  },
  {
    id: '2',
    identifier: 'optimize-database-queries',
    status: 'completed',
    created_at: '2024-01-15T09:15:00Z',
    updated_at: '2024-01-15T10:20:00Z',
    execution_prompt: 'Optimize slow database queries in the user service',
    model: 'sonnet',
    working_directory: '/app/services'
  },
  {
    id: '3',
    identifier: 'add-unit-tests',
    status: 'failed',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:30:00Z',
    execution_prompt: 'Add comprehensive unit tests for the payment module',
    model: 'haiku',
    working_directory: '/app/tests'
  }
];

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
        <Stack direction="vertical" gap="sm">
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
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulate API loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setStats(mockStats);
      setRecentTasks(mockRecentTasks);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const headerActions = (
    <Stack direction="horizontal" gap="sm">
      <Button variant="outline" size="md">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Exportar
      </Button>
      <Button size="md">
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

      <Stack direction="vertical" gap="lg">
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
            <Grid cols={1} responsive={{ md: 2, lg: 3 }} gap="lg">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </Grid>
          ) : (
            <Grid cols={1} responsive={{ md: 2, lg: 3 }} gap="lg">
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
          
          <Grid cols={1} responsive={{ md: 2, lg: 4 }} gap="md">
            <Card hoverable>
              <CardBody>
                <Stack direction="vertical" gap="sm" align="center">
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
                <Stack direction="vertical" gap="sm" align="center">
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
                <Stack direction="vertical" gap="sm" align="center">
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
                <Stack direction="vertical" gap="sm" align="center">
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