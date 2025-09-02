import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Grid } from '../../components/ui/Grid';
import { Stack } from '../../components/ui/Stack';
import { Skeleton, SkeletonCard, SkeletonMetricCard } from '../../components/ui/Skeleton';
import { SystemMetrics } from '../../components/admin/SystemMetrics';
import { SystemLogs } from '../../components/admin/SystemLogs';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { AuthProvider } from '../../contexts/AuthContext';

interface SystemMetrics {
  totalTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  uptime: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  variant: 'primary' | 'secondary' | 'danger';
}

const AdminDashboardContent: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick actions do admin
  const quickActions: QuickAction[] = [
    {
      id: 'create-task',
      title: 'Criar Nova Task',
      description: 'Criar uma nova task no sistema',
      href: '/tasks/create',
      variant: 'primary',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    {
      id: 'view-health',
      title: 'System Health',
      description: 'Monitorar saúde do sistema',
      href: '/admin/health',
      variant: 'secondary',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'clear-tasks',
      title: 'Limpar Tasks',
      description: 'Limpar tasks concluídas e com falha',
      href: '/admin/clear-tasks',
      variant: 'danger',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )
    }
  ];

  // Simulação de carregamento de dados
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        
        // Buscar dados reais da API
        const response = await fetch('http://localhost:8888/api/v1/tasks');
        if (!response.ok) {
          throw new Error('Falha ao buscar tarefas');
        }
        
        const tasks = await response.json();
        
        // Calcular métricas reais
        const runningTasks = tasks.filter((t: any) => t.status === 'running').length;
        const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
        const failedTasks = tasks.filter((t: any) => t.status === 'failed').length;
        
        const realMetrics: SystemMetrics = {
          totalTasks: tasks.length,
          runningTasks,
          completedTasks,
          failedTasks,
          systemHealth: failedTasks > 5 ? 'warning' : 'healthy',
          uptime: '2d 14h 23m' // TODO: buscar de endpoint de status
        };
        
        setMetrics(realMetrics);
      } catch (err) {
        console.error('Erro ao carregar métricas:', err);
        setError('Erro ao conectar com a API. Verifique se o servidor está rodando em localhost:8888');
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, []);

  const getHealthBadgeProps = (health: SystemMetrics['systemHealth']) => {
    switch (health) {
      case 'healthy':
        return { variant: 'success' as const, text: 'Saudável' };
      case 'warning':
        return { variant: 'warning' as const, text: 'Atenção' };
      case 'critical':
        return { variant: 'danger' as const, text: 'Crítico' };
      default:
        return { variant: 'default' as const, text: 'Desconhecido' };
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Admin Dashboard"
        description="Visão geral do sistema e controles administrativos"
        actions={
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
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

      {/* Alertas */}
      {error && (
        <Alert severity="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Métricas em Tempo Real */}
      <SystemMetrics refreshInterval={5000} />

      {/* Métricas do Sistema */}
      <Stack spacing="lg">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Métricas do Sistema
          </h2>
          
          {loading ? (
            <Grid cols={1} colsMd={2} colsLg={4} gap="lg">
              <SkeletonMetricCard />
              <SkeletonMetricCard />
              <SkeletonMetricCard />
              <SkeletonMetricCard />
            </Grid>
          ) : metrics ? (
            <Grid cols={1} colsMd={2} colsLg={4} gap="lg">
              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total de Tasks
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {metrics.totalTasks}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Tasks Executando
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {metrics.runningTasks}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                      <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Tasks Concluídas
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {metrics.completedTasks}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Tasks com Falha
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {metrics.failedTasks}
                      </p>
                    </div>
                    <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                      <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Grid>
          ) : null}
        </div>

        {/* Status do Sistema */}
        {metrics && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Status do Sistema
              </h3>
            </CardHeader>
            <CardBody>
              <Stack direction="horizontal" spacing="lg" align="center" justify="between">
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Saúde do Sistema:
                  </div>
                  <Badge {...getHealthBadgeProps(metrics.systemHealth)}>
                    {getHealthBadgeProps(metrics.systemHealth).text}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Uptime: <span className="font-mono">{metrics.uptime}</span>
                </div>
              </Stack>
            </CardBody>
          </Card>
        )}

        {/* Ações Rápidas */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ações Rápidas
          </h2>
          
          <Grid cols={1} colsMd={2} colsLg={3} gap="lg">
            {quickActions.map((action) => (
              <Card key={action.id} hoverable>
                <CardBody>
                  <Stack spacing="sm">
                    <Stack direction="horizontal" spacing="sm" align="center">
                      {action.icon}
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {action.title}
                      </h3>
                    </Stack>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {action.description}
                    </p>
                    
                    <Button
                      variant={action.variant}
                      size="sm"
                      onClick={() => window.location.href = action.href}
                    >
                      Acessar
                    </Button>
                  </Stack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </div>

        {/* Logs do Sistema */}
        <SystemLogs maxEntries={50} autoScroll />
      </Stack>
    </AdminLayout>
  );
};

const AdminDashboard: React.FC = () => {
  return (
    <AuthProvider>
      <ProtectedRoute requireAdmin>
        <AdminDashboardContent />
      </ProtectedRoute>
    </AuthProvider>
  );
};

export default AdminDashboard;