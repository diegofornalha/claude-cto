import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { McpApi } from '@/services/mcp-api';

interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingTasks: number;
  runningTasks: number;
  averageExecutionTime: number;
  successRate: number;
  tasksByModel: {
    opus: number;
    sonnet: number;
    haiku: number;
  };
  recentActivities: Array<{
    id: string;
    type: string;
    timestamp: string;
    message: string;
    task_identifier?: string;
  }>;
  systemStats: {
    cpu: number;
    memory: number;
  };
}

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAnalyticsData = async () => {
    try {
      // Buscar dados reais do servidor
      const [tasks, stats, activities] = await Promise.all([
        McpApi.getTasks(),
        McpApi.getSystemStats(),
        McpApi.getActivities(10)
      ]);

      // Calcular métricas das tasks
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const failedTasks = tasks.filter(t => t.status === 'failed').length;
      const pendingTasks = tasks.filter(t => t.status === 'pending').length;
      const runningTasks = tasks.filter(t => t.status === 'running').length;
      
      // Calcular tasks por modelo
      const tasksByModel = tasks.reduce((acc, task) => {
        const model = task.model || 'opus';
        acc[model] = (acc[model] || 0) + 1;
        return acc;
      }, { opus: 0, sonnet: 0, haiku: 0 });

      // Calcular tempo médio de execução
      const executionTimes = tasks
        .filter(t => t.execution_time && t.execution_time > 0)
        .map(t => t.execution_time || 0);
      
      const averageExecutionTime = executionTimes.length > 0
        ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
        : 0;

      // Calcular taxa de sucesso
      const totalCompleted = completedTasks + failedTasks;
      const successRate = totalCompleted > 0 
        ? (completedTasks / totalCompleted) * 100 
        : 0;

      setAnalyticsData({
        totalTasks: tasks.length,
        completedTasks,
        failedTasks,
        pendingTasks,
        runningTasks,
        averageExecutionTime: Math.round(averageExecutionTime / 100) / 10, // Convert to seconds
        successRate: Math.round(successRate * 10) / 10,
        tasksByModel,
        recentActivities: activities.map(activity => ({
          id: activity.id,
          type: activity.type,
          timestamp: activity.timestamp,
          message: activity.message,
          task_identifier: activity.task_identifier
        })),
        systemStats: {
          cpu: Math.round(stats.cpu_usage || 0),
          memory: stats.memory_usage > 100 ? Math.round((stats.memory_usage / 1024) * 100) : Math.round(stats.memory_usage || 0)
        }
      });
      
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar analytics:', err);
      setError('Erro ao carregar dados de analytics. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAnalyticsData();
    }, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-red-600 dark:text-red-400">
          {error}
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchAnalyticsData();
          }}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!analyticsData) {
    return null;
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'task_completed': return 'bg-green-100 text-green-800';
      case 'task_failed': return 'bg-red-100 text-red-800';
      case 'task_started': return 'bg-blue-100 text-blue-800';
      case 'task_created': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatActivityType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📊 Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize métricas e desempenho do sistema em tempo real
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded ${
              autoRefresh 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
          </button>
          <button
            onClick={() => {
              setLoading(true);
              fetchAnalyticsData();
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            🔄 Atualizar
          </button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Tasks</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{analyticsData.totalTasks}</div>
          <div className="mt-2 text-sm text-gray-600">{analyticsData.runningTasks} em execução</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Taxa de Sucesso</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{analyticsData.successRate}%</div>
          <div className="mt-2 text-sm text-green-600">{analyticsData.successRate > 90 ? '↑ Alta' : '↓ Baixa'}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Tempo Médio</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{analyticsData.averageExecutionTime}s</div>
          <div className="mt-2 text-sm text-gray-600">{analyticsData.averageExecutionTime < 30 ? '↓ Rápido' : '↑ Lento'}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Tasks Ativas</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{analyticsData.runningTasks + analyticsData.pendingTasks}</div>
          <div className="mt-2 text-sm text-gray-600">{analyticsData.runningTasks} rodando</div>
        </div>
      </div>

      {/* Status das Tasks e Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Status das Tasks</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">✅ Completadas</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{analyticsData.completedTasks}</span>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  {analyticsData.totalTasks > 0 
                    ? `${Math.round((analyticsData.completedTasks / analyticsData.totalTasks) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">🚀 Em Execução</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{analyticsData.runningTasks}</span>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {analyticsData.totalTasks > 0 
                    ? `${Math.round((analyticsData.runningTasks / analyticsData.totalTasks) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">⏳ Pendentes</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{analyticsData.pendingTasks}</span>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                  {analyticsData.totalTasks > 0 
                    ? `${Math.round((analyticsData.pendingTasks / analyticsData.totalTasks) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">❌ Falhadas</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{analyticsData.failedTasks}</span>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                  {analyticsData.totalTasks > 0 
                    ? `${Math.round((analyticsData.failedTasks / analyticsData.totalTasks) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Tasks por Modelo</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Opus</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{analyticsData.tasksByModel.opus}</span>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {analyticsData.totalTasks > 0 
                    ? `${Math.round((analyticsData.tasksByModel.opus / analyticsData.totalTasks) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Sonnet</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{analyticsData.tasksByModel.sonnet}</span>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                  {analyticsData.totalTasks > 0 
                    ? `${Math.round((analyticsData.tasksByModel.sonnet / analyticsData.totalTasks) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Haiku</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{analyticsData.tasksByModel.haiku}</span>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                  {analyticsData.totalTasks > 0 
                    ? `${Math.round((analyticsData.tasksByModel.haiku / analyticsData.totalTasks) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recursos do Sistema</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">CPU</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{analyticsData.systemStats.cpu}%</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${analyticsData.systemStats.cpu > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {analyticsData.systemStats.cpu > 80 ? 'Alto' : 'Normal'}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Memória</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{analyticsData.systemStats.memory}%</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${analyticsData.systemStats.memory > 80 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {analyticsData.systemStats.memory > 80 ? 'Alto' : 'Normal'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Atividades Recentes</h2>
        {analyticsData.recentActivities.length > 0 ? (
          <div className="space-y-2">
            {analyticsData.recentActivities.map(activity => (
              <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                  <div>
                    <span className="font-medium">{formatActivityType(activity.type)}</span>
                    {activity.task_identifier && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        ({activity.task_identifier})
                      </span>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400">{activity.message}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(activity.type)}`}>
                  {activity.type.replace('task_', '').replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Nenhuma atividade recente</p>
        )}
      </div>

      {/* Links de Navegação */}
      <div className="mt-8 flex gap-4">
        <Link href="/tasks">
          <span className="text-indigo-600 hover:text-indigo-500 cursor-pointer">
            Ver Tasks →
          </span>
        </Link>
        <Link href="/monitor">
          <span className="text-indigo-600 hover:text-indigo-500 cursor-pointer">
            Monitor →
          </span>
        </Link>
        <Link href="/">
          <span className="text-gray-600 hover:text-gray-500 cursor-pointer">
            ← Voltar para Home
          </span>
        </Link>
      </div>
    </div>
  );
};

export default Analytics;