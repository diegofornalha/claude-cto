import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Grid } from '../../components/ui/Grid';
import { Stack } from '../../components/ui/Stack';
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton';

interface HealthMetric {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value: string;
  description: string;
  lastCheck: string;
}

interface SystemHealthData {
  overall: 'healthy' | 'warning' | 'critical';
  metrics: HealthMetric[];
  lastUpdated: string;
  uptime: string;
}

const SystemHealthPage: React.FC = () => {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simular carregamento de dados de saúde
  const loadHealthData = async () => {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Dados mockados
      const mockHealthData: SystemHealthData = {
        overall: 'healthy',
        lastUpdated: new Date().toISOString(),
        uptime: '2d 14h 23m',
        metrics: [
          {
            id: 'cpu',
            name: 'Uso de CPU',
            status: 'healthy',
            value: '23%',
            description: 'Utilização média da CPU nas últimas 5 minutos',
            lastCheck: new Date(Date.now() - 30000).toISOString()
          },
          {
            id: 'memory',
            name: 'Uso de Memória',
            status: 'warning',
            value: '76%',
            description: 'Utilização de memória RAM do sistema',
            lastCheck: new Date(Date.now() - 30000).toISOString()
          },
          {
            id: 'disk',
            name: 'Espaço em Disco',
            status: 'healthy',
            value: '45%',
            description: 'Utilização de espaço em disco principal',
            lastCheck: new Date(Date.now() - 30000).toISOString()
          },
          {
            id: 'api',
            name: 'API Response',
            status: 'healthy',
            value: '120ms',
            description: 'Tempo médio de resposta da API',
            lastCheck: new Date(Date.now() - 15000).toISOString()
          },
          {
            id: 'database',
            name: 'Conexão do Banco',
            status: 'healthy',
            value: 'Conectado',
            description: 'Status da conexão com o banco de dados',
            lastCheck: new Date(Date.now() - 10000).toISOString()
          },
          {
            id: 'tasks',
            name: 'Processamento de Tasks',
            status: 'critical',
            value: 'Queue cheia',
            description: '3 tasks pendentes há mais de 1 hora',
            lastCheck: new Date(Date.now() - 5000).toISOString()
          }
        ]
      };
      
      setHealthData(mockHealthData);
    } catch (err) {
      setError('Erro ao carregar dados de saúde do sistema');
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await loadHealthData();
      setLoading(false);
    };
    
    load();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(() => {
      if (!loading) {
        loadHealthData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loading]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadHealthData();
    setIsRefreshing(false);
  };

  const getStatusBadgeProps = (status: HealthMetric['status']) => {
    switch (status) {
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

  const getStatusIcon = (status: HealthMetric['status']) => {
    switch (status) {
      case 'healthy':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'critical':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
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

  return (
    <AdminLayout>
      <PageHeader
        title="System Health"
        description="Monitoramento da saúde e performance do sistema em tempo real"
        actions={
          <Button
            variant="secondary"
            onClick={handleRefresh}
            loading={isRefreshing}
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
        <Alert variant="danger" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack spacing="lg">
        {/* Status Geral */}
        {loading ? (
          <Card>
            <CardHeader>
              <Skeleton variant="text" width="200px" className="mb-2" />
            </CardHeader>
            <CardBody>
              <Stack direction="horizontal" spacing="lg" align="center" justify="between" className="mb-4">
                <Skeleton variant="rectangular" width="100px" height="30px" />
                <Skeleton variant="text" width="150px" />
              </Stack>
              <Skeleton variant="text" width="200px" />
            </CardBody>
          </Card>
        ) : healthData ? (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Status Geral do Sistema
              </h3>
            </CardHeader>
            <CardBody>
              <Stack direction="horizontal" spacing="lg" align="center" justify="between" className="mb-4">
                <div className="flex items-center gap-3">
                  <Badge {...getStatusBadgeProps(healthData.overall)}>
                    {getStatusBadgeProps(healthData.overall).text}
                  </Badge>
                  {getStatusIcon(healthData.overall)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Uptime: <span className="font-mono">{healthData.uptime}</span>
                </div>
              </Stack>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Última atualização: {formatRelativeTime(healthData.lastUpdated)}
              </div>
            </CardBody>
          </Card>
        ) : null}

        {/* Métricas Detalhadas */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Métricas Detalhadas
          </h2>
          
          {loading ? (
            <Grid cols="1" responsive={{ md: 2, lg: 3 }} gap="lg">
              {Array.from({ length: 6 }, (_, i) => (
                <Card key={i}>
                  <CardBody>
                    <Skeleton variant="text" className="mb-2" />
                    <Skeleton variant="text" className="mb-4 w-3/4" />
                    <Skeleton variant="rectangular" height="2rem" />
                  </CardBody>
                </Card>
              ))}
            </Grid>
          ) : healthData ? (
            <Grid cols="1" responsive={{ md: 2, lg: 3 }} gap="lg">
              {healthData.metrics.map((metric) => (
                <Card key={metric.id}>
                  <CardBody>
                    <Stack spacing="sm">
                      <Stack direction="horizontal" spacing="sm" align="center" justify="between">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {metric.name}
                        </h4>
                        {getStatusIcon(metric.status)}
                      </Stack>
                      
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {metric.value}
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {metric.description}
                      </p>
                      
                      <Stack direction="horizontal" spacing="sm" align="center" justify="between">
                        <Badge {...getStatusBadgeProps(metric.status)} size="sm">
                          {getStatusBadgeProps(metric.status).text}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatRelativeTime(metric.lastCheck)}
                        </span>
                      </Stack>
                    </Stack>
                  </CardBody>
                </Card>
              ))}
            </Grid>
          ) : null}
        </div>

        {/* Alertas de Problemas */}
        {healthData && healthData.metrics.some(m => m.status === 'critical' || m.status === 'warning') && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Problemas Detectados
            </h2>
            
            <Stack spacing="sm">
              {healthData.metrics
                .filter(m => m.status === 'critical' || m.status === 'warning')
                .map((metric) => (
                  <Alert
                    key={metric.id}
                    variant={metric.status === 'critical' ? 'danger' : 'warning'}
                  >
                    <div>
                      <strong>{metric.name}:</strong> {metric.description}
                      <div className="text-sm mt-1 opacity-90">
                        Valor atual: {metric.value} • Verificado {formatRelativeTime(metric.lastCheck)}
                      </div>
                    </div>
                  </Alert>
                ))}
            </Stack>
          </div>
        )}
      </Stack>
    </AdminLayout>
  );
};

export default SystemHealthPage;