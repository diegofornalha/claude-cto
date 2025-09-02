import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Stack } from '../ui/Stack';
import { Grid } from '../ui/Grid';
import { Skeleton } from '../ui/Skeleton';

interface Metric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  status: 'good' | 'warning' | 'critical';
  icon?: React.ReactNode;
}

interface SystemMetricsProps {
  refreshInterval?: number;
}

export const SystemMetrics: React.FC<SystemMetricsProps> = ({
  refreshInterval = 5000
}) => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Carregar métricas reais da API
  const loadMetrics = async () => {
    try {
      // Buscar estatísticas da API real
      const response = await fetch('http://localhost:8888/api/v1/stats');
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const stats = await response.json();
      
      // Converter estatísticas da API para métricas do sistema
      const systemMetrics: Metric[] = [
        {
          id: 'total_tasks',
          name: 'Total de Tasks',
          value: stats.total_tasks || 0,
          unit: 'tasks',
          trend: 'stable',
          trendValue: '0',
          status: 'good',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )
        },
        {
          id: 'pending_tasks',
          name: 'Tasks Pendentes',
          value: stats.pending_tasks || 0,
          unit: 'tasks',
          trend: stats.pending_tasks > 5 ? 'up' : 'stable',
          trendValue: `${stats.pending_tasks}`,
          status: stats.pending_tasks > 10 ? 'warning' : 'good',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          id: 'running_tasks',
          name: 'Em Execução',
          value: stats.running_tasks || 0,
          unit: 'tasks',
          trend: 'stable',
          trendValue: `${stats.running_tasks}`,
          status: stats.running_tasks > 5 ? 'warning' : 'good',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )
        },
        {
          id: 'completed_tasks',
          name: 'Concluídas',
          value: stats.completed_tasks || 0,
          unit: 'tasks',
          trend: 'up',
          trendValue: `${stats.completed_tasks}`,
          status: 'good',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          id: 'failed_tasks',
          name: 'Com Falha',
          value: stats.failed_tasks || 0,
          unit: 'tasks',
          trend: stats.failed_tasks > 0 ? 'up' : 'stable',
          trendValue: `${stats.failed_tasks}`,
          status: stats.failed_tasks > 5 ? 'critical' : stats.failed_tasks > 0 ? 'warning' : 'good',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          id: 'success_rate',
          name: 'Taxa de Sucesso',
          value: stats.total_tasks > 0 
            ? Math.round((stats.completed_tasks / stats.total_tasks) * 100)
            : 100,
          unit: '%',
          trend: 'stable',
          trendValue: `${Math.round((stats.completed_tasks / Math.max(stats.total_tasks, 1)) * 100)}%`,
          status: stats.failed_tasks > 5 ? 'warning' : 'good',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )
        }
      ];
      
      setMetrics(systemMetrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      
      // Definir métricas padrão em caso de erro
      setMetrics([
        {
          id: 'error',
          name: 'Status da API',
          value: 0,
          unit: '',
          status: 'critical',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    
    const interval = setInterval(loadMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusColor = (status: Metric['status']) => {
    switch (status) {
      case 'good':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900';
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900';
    }
  };

  const getTrendIcon = (trend?: Metric['trend']) => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      case 'stable':
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton variant="text" width="200px" />
        </CardHeader>
        <CardBody>
          <Grid cols={2} colsMd={3} colsLg={6} gap="md">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="text-center">
                <Skeleton variant="circular" width="60px" height="60px" className="mx-auto mb-2" />
                <Skeleton variant="text" />
                <Skeleton variant="text" width="80%" className="mx-auto" />
              </div>
            ))}
          </Grid>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Stack direction="horizontal" spacing="sm" align="center" justify="between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Métricas em Tempo Real
          </h3>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Atualizado: {lastUpdate.toLocaleTimeString()}
          </div>
        </Stack>
      </CardHeader>
      <CardBody>
        <Grid cols={2} colsMd={3} colsLg={6} gap="md">
          {metrics.map((metric) => (
            <div key={metric.id} className="text-center">
              <div className={`
                inline-flex items-center justify-center w-12 h-12 rounded-full mb-2
                ${getStatusColor(metric.status)}
              `}>
                {metric.icon}
              </div>
              
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {metric.name}
              </div>
              
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {metric.value}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  {metric.unit}
                </span>
              </div>
              
              {metric.trend && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  {getTrendIcon(metric.trend)}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {metric.trendValue}
                  </span>
                </div>
              )}
            </div>
          ))}
        </Grid>
      </CardBody>
    </Card>
  );
};

export default SystemMetrics;