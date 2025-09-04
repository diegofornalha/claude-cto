import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '../components/ui/Container';
import { Grid, GridItem } from '../components/ui/Grid';
import { Stack } from '../components/ui/Stack';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { McpApi, SystemStats } from '../services/mcp-api';


const HomePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<SystemStats | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());
    
    // Carregar dados reais da API
    const loadMetrics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const stats = await McpApi.getSystemStats();
        setMetrics(stats);
      } catch (err) {
        console.error('Erro ao carregar métricas:', err);
        setError('Erro ao carregar métricas do sistema');
        // Se houver erro, define valores padrão zerados
        setMetrics({
          total_tasks: 0,
          running_tasks: 0,
          completed_tasks: 0,
          failed_tasks: 0,
          average_execution_time: 0,
          success_rate: 0,
          memory_usage: 0,
          cpu_usage: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Recarregar métricas a cada 30 segundos
    const metricsInterval = setInterval(loadMetrics, 30000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(metricsInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <Container maxWidth="2xl" className="py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg transform hover:scale-105 transition-transform duration-200">
            <span className="text-3xl font-bold text-white">🚀</span>
          </div>
          
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent dark:from-white dark:via-blue-300 dark:to-purple-300 mb-4 animate-fade-in">
            Dashboard Master
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2 font-medium">
            Hub Central Premium - Claude CTO Management System
          </p>
          
          <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Sistema Operacional</span>
            <span className="mx-2">•</span>
            <span>{isMounted && currentTime ? currentTime.toLocaleString('pt-BR') : '...'}</span>
          </div>
        </div>

        {/* Metrics Overview */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardBody>
                  <Skeleton variant="text" width="60%" height="16px" className="mb-3" />
                  <Skeleton variant="text" width="40%" height="32px" className="mb-2" />
                  <Skeleton variant="text" width="80%" height="12px" />
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-fade-in-up">
            <Card hoverable className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Total de Tasks</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{metrics?.total_tasks || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">📋</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card hoverable className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">Em Execução</p>
                    <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{metrics?.running_tasks || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">⚡</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card hoverable className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Concluídas</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">{metrics?.completed_tasks || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">✅</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card hoverable className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Falhas</p>
                    <p className="text-3xl font-bold text-red-900 dark:text-red-100">{metrics?.failed_tasks || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">❌</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Main Navigation Cards */}
        <Grid cols={1} colsMd={2} colsLg={3} gap="lg" className="mb-12">
          {/* Tasks Card */}
          <Card hoverable className="group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-800 border-2 hover:border-blue-500/50">
            <CardBody className="p-8">
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Tasks
                  </h2>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Gerenciamento Completo</p>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Gerencie e monitore tarefas do Claude CTO com controle total sobre execução e status.
              </p>
              
              <Stack direction="vertical" spacing="sm">
                <Link href="/tasks/list" className="group/link flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">📄 Listar Tasks</span>
                  <svg className="w-4 h-4 text-gray-400 group-hover/link:text-blue-500 group-hover/link:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">💡 Use o MCP para criar tarefas</span>
                </div>
              </Stack>
            </CardBody>
          </Card>

          {/* Orchestration Card */}
          <Card hoverable className="group hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-800 border-2 hover:border-purple-500/50">
            <CardBody className="p-8">
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                  <span className="text-2xl">🎭</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Orchestration
                  </h2>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Execução Paralela</p>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Orquestre múltiplas tarefas em paralelo com controle avançado de dependências.
              </p>
              
              <Stack direction="vertical" spacing="sm">
                <Link href="/orchestration" className="group/link flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">👁️ Ver Orquestrações</span>
                  <svg className="w-4 h-4 text-gray-400 group-hover/link:text-purple-500 group-hover/link:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">💡 Use o MCP para orquestrações</span>
                </div>
              </Stack>
            </CardBody>
          </Card>

          {/* Monitor Card */}
          <Card hoverable className="group hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-800 border-2 hover:border-amber-500/50">
            <CardBody className="p-8">
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                  <span className="text-2xl">🔔</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Monitor
                  </h2>
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Tempo Real</p>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Monitoramento em tempo real com notificações inteligentes e alertas avançados.
              </p>
              
              <Stack direction="vertical" spacing="sm">
                <Link href="/monitor" className="group/link flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors duration-200">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">📊 Dashboard Monitor</span>
                  <svg className="w-4 h-4 text-gray-400 group-hover/link:text-amber-500 group-hover/link:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link href="/monitor/activities" className="group/link flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors duration-200">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">📈 Feed de Atividades</span>
                  <svg className="w-4 h-4 text-gray-400 group-hover/link:text-amber-500 group-hover/link:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link href="/monitor/notifications" className="group/link flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors duration-200">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">🔧 Config. Notificações</span>
                  <svg className="w-4 h-4 text-gray-400 group-hover/link:text-amber-500 group-hover/link:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </Stack>
            </CardBody>
          </Card>

          {/* Sitemap Card */}
          <Card hoverable className="group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-800 border-2 hover:border-indigo-500/50">
            <CardBody className="p-8">
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                  <span className="text-2xl">🗺️</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Navigation
                  </h2>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Exploração Completa</p>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Explore todas as rotas disponíveis no sistema com navegação intuitiva.
              </p>
              
              <Stack direction="vertical" spacing="sm">
                <Link href="/sitemap" className="group/link flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors duration-200">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">🧭 Ver Sitemap</span>
                  <svg className="w-4 h-4 text-gray-400 group-hover/link:text-indigo-500 group-hover/link:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </Stack>
            </CardBody>
          </Card>

          {/* Status Card */}
          <Card hoverable className="group hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-800 border-2 hover:border-cyan-500/50">
            <CardBody className="p-8">
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Status
                  </h2>
                  <p className="text-sm text-cyan-600 dark:text-cyan-400 font-medium">Sistema Ativo</p>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Sistema operacional em porta 5508 com monitoramento ativo de recursos.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                  <Badge variant="success" className="animate-pulse">
                    ● Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{metrics?.uptime || '...'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Memória</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{metrics?.memoryUsage || 0}%</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions Card */}
          <Card hoverable className="group hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-800 border-2 hover:border-rose-500/50">
            <CardBody className="p-8">
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Ações Rápidas
                  </h2>
                  <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">Controles Diretos</p>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Acesso rápido às funcionalidades mais utilizadas do sistema.
              </p>
              
              <Stack direction="vertical" spacing="sm">
                <Button 
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full justify-between group/btn hover:bg-rose-50 dark:hover:bg-rose-900/20 border-rose-200 dark:border-rose-700 hover:border-rose-300 dark:hover:border-rose-600"
                >
                  <span className="flex items-center">
                    <span className="mr-3">🔄</span>
                    <span>Atualizar Dashboard</span>
                  </span>
                  <svg className="w-4 h-4 text-gray-400 group-hover/btn:text-rose-500 group-hover/btn:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => fetch('http://localhost:8741/api/v1/tasks')}
                  className="w-full justify-between group/btn hover:bg-rose-50 dark:hover:bg-rose-900/20 border-rose-200 dark:border-rose-700 hover:border-rose-300 dark:hover:border-rose-600"
                >
                  <span className="flex items-center">
                    <span className="mr-3">📡</span>
                    <span>Testar API</span>
                  </span>
                  <svg className="w-4 h-4 text-gray-400 group-hover/btn:text-rose-500 group-hover/btn:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </Stack>
            </CardBody>
          </Card>
        </Grid>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center justify-center space-x-6 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Claude CTO Dashboard</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">v1.0.0</p>
            </div>
            
            <div className="h-8 border-l border-gray-300 dark:border-gray-600"></div>
            
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Porta</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">5508</p>
            </div>
            
            <div className="h-8 border-l border-gray-300 dark:border-gray-600"></div>
            
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">API</p>
              <p className="text-xs text-green-600 dark:text-green-400 font-mono">localhost:8741</p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default HomePage;

// Custom CSS for animations (add to global styles or Tailwind config)
// @keyframes fade-in {
//   from { opacity: 0; }
//   to { opacity: 1; }
// }

// @keyframes fade-in-up {
//   from {
//     opacity: 0;
//     transform: translateY(20px);
//   }
//   to {
//     opacity: 1;
//     transform: translateY(0);
//   }
// }

// .animate-fade-in {
//   animation: fade-in 0.6s ease-out;
// }

// .animate-fade-in-up {
//   animation: fade-in-up 0.8s ease-out;
// }