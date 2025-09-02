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

interface TaskStats {
  total: number;
  completed: number;
  failed: number;
  toBeCleared: number;
}

interface ClearResult {
  success: boolean;
  cleared: number;
  message: string;
}

const ClearTasksPage: React.FC = () => {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ClearResult | null>(null);

  // Simular carregamento de estatísticas
  const loadStats = async () => {
    try {
      setLoading(true);
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Dados mockados
      const mockStats: TaskStats = {
        total: 127,
        completed: 89,
        failed: 12,
        toBeCleared: 101 // completed + failed
      };
      
      setStats(mockStats);
    } catch (err) {
      setError('Erro ao carregar estatísticas das tasks');
    } finally {
      setLoading(false);
    }
  };

  // Simular operação de limpeza
  const handleClearTasks = async () => {
    if (!stats) return;
    
    try {
      setClearing(true);
      setError(null);
      
      // Simular delay de operação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular resultado
      const cleared = stats.toBeCleared;
      const result: ClearResult = {
        success: true,
        cleared,
        message: `${cleared} tasks foram removidas com sucesso do sistema`
      };
      
      setLastResult(result);
      
      // Atualizar stats após limpeza
      setStats({
        ...stats,
        completed: 0,
        failed: 0,
        toBeCleared: 0,
        total: stats.total - cleared
      });
      
    } catch (err) {
      const result: ClearResult = {
        success: false,
        cleared: 0,
        message: 'Erro ao limpar tasks. Tente novamente.'
      };
      setLastResult(result);
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const hasTasksToClear = stats && stats.toBeCleared > 0;

  return (
    <AdminLayout>
      <PageHeader
        title="Clear Tasks"
        description="Remover tasks concluídas e com falha do sistema para otimizar performance"
        actions={
          <Button
            variant="secondary"
            onClick={loadStats}
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

        {lastResult && (
          <Alert 
            variant={lastResult.success ? 'success' : 'danger'}
            onClose={() => setLastResult(null)}
          >
            {lastResult.message}
          </Alert>
        )}

        {/* Estatísticas das Tasks */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Estatísticas das Tasks
          </h2>
          
          {loading ? (
            <Grid cols="1" responsive={{ md: 2, lg: 4 }} gap="lg">
              {Array.from({ length: 4 }, (_, i) => (
                <Card key={i}>
                  <CardBody>
                    <Skeleton variant="text" className="mb-2" />
                    <Skeleton variant="text" className="mb-4 w-16 h-8" />
                    <Skeleton variant="text" className="w-24" />
                  </CardBody>
                </Card>
              ))}
            </Grid>
          ) : stats ? (
            <Grid cols="1" responsive={{ md: 2, lg: 4 }} gap="lg">
              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total de Tasks
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.total}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        No sistema
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
                        Tasks Concluídas
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.completed}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Prontas para limpeza
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
                        {stats.failed}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Precisam ser limpas
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

              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total a Limpar
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.toBeCleared}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Concluídas + Falhas
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                      <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Grid>
          ) : null}
        </div>

        {/* Ação de Limpeza */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Operação de Limpeza
            </h3>
          </CardHeader>
          <CardBody>
            <Stack spacing="md">
              {hasTasksToClear ? (
                <>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                          Atenção - Operação Irreversível
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                          Esta operação irá remover permanentemente <strong>{stats?.toBeCleared}</strong> tasks do sistema. 
                          Esta ação não pode ser desfeita. Tasks que estão sendo executadas não serão afetadas.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Tasks que serão removidas:
                    </h4>
                    <Stack direction="horizontal" spacing="sm" wrap>
                      <Badge variant="success">
                        {stats?.completed} Concluídas
                      </Badge>
                      <Badge variant="danger">
                        {stats?.failed} com Falha
                      </Badge>
                    </Stack>
                  </div>

                  <Stack direction="horizontal" spacing="sm" align="center">
                    <Button
                      variant="danger"
                      onClick={handleClearTasks}
                      loading={clearing}
                      leftIcon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      }
                    >
                      {clearing ? 'Limpando Tasks...' : `Limpar ${stats?.toBeCleared} Tasks`}
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => window.history.back()}
                    >
                      Cancelar
                    </Button>
                  </Stack>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full inline-flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Sistema Limpo
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Não há tasks concluídas ou com falha para serem removidas no momento.
                  </p>
                  <div className="mt-4">
                    <Button
                      variant="secondary"
                      onClick={() => window.location.href = '/admin'}
                    >
                      Voltar ao Dashboard
                    </Button>
                  </div>
                </div>
              )}
            </Stack>
          </CardBody>
        </Card>
      </Stack>
    </AdminLayout>
  );
};

export default ClearTasksPage;