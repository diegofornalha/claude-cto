// Página principal do Monitor de Tarefas CTO
import React, { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { Bell, Settings } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { NotificationProvider, useNotifications } from '../../context/NotificationContext';
import SystemMetrics from '../../components/monitor/SystemMetrics';
import TaskMonitor from '../../components/monitor/TaskMonitor';
import ActivityFeed from '../../components/monitor/ActivityFeed';
import NotificationSettings from '../../components/monitor/NotificationSettings';
import ErrorBoundary from '../../components/ErrorBoundary';
import { Grid } from '../../components/ui/Grid';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { McpApi, SystemStats } from '../../services/mcp-api';
import { useWebSocket, useRealtimeStats } from '../../services/websocket';

// Componente do Modal
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 max-w-lg w-full mx-4">
        {children}
      </div>
    </div>
  );
};

// Componente do botão flutuante de notificações
const FloatingNotificationButton: React.FC<{
  onClick: () => void;
  unreadCount: number;
}> = ({ onClick, unreadCount }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 group"
      title="Configurações de Notificação"
    >
      <div className="relative">
        <Bell className="h-6 w-6 group-hover:animate-pulse" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
    </button>
  );
};

// Componente interno do Monitor que usa o contexto
const MonitorContent: React.FC = () => {
  const router = useRouter();
  const { isConnected } = useWebSocket();
  const realtimeStats = useRealtimeStats();
  const { unreadCount, addNotification, settings } = useNotifications();
  
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  // Carregar estatísticas iniciais
  useEffect(() => {
    loadStats();
    // Recarregar a cada 30 segundos se não houver WebSocket
    const interval = setInterval(() => {
      if (!isConnected) {
        loadStats();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Atualizar estatísticas com dados em tempo real
  useEffect(() => {
    if (realtimeStats) {
      setStats(realtimeStats);
      
      // Verificar alertas do sistema
      if (settings.systemAlerts && settings.enabled) {
        if (realtimeStats.cpu_usage > 80) {
          addNotification({
            type: 'warning',
            title: 'Alto uso de CPU',
            message: `CPU está em ${realtimeStats.cpu_usage.toFixed(1)}%`
          });
        }
        if (realtimeStats.memory_usage > 80) {
          addNotification({
            type: 'warning',
            title: 'Alto uso de memória',
            message: `Memória está em ${realtimeStats.memory_usage.toFixed(1)}%`
          });
        }
      }
    }
  }, [realtimeStats, settings, addNotification]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await McpApi.getSystemStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar estatísticas');
      console.error(err);
      
      // Notificar erro se configurado
      if (settings.systemAlerts && settings.enabled) {
        addNotification({
          type: 'error',
          title: 'Erro ao carregar estatísticas',
          message: 'Não foi possível carregar as métricas do sistema'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageLayout maxWidth="7xl" padding="lg">
        {/* Título da Página */}
        <Container className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Monitor de Tarefas CTO
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "success" : "warning"}>
                {isConnected ? "WebSocket Conectado" : "Modo Polling"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
              >
                Dashboard Principal
              </Button>
            </div>
          </div>
        </Container>

        {/* Métricas do Sistema */}
        <ErrorBoundary>
          <Container className="mb-8">
            <SystemMetrics />
          </Container>
        </ErrorBoundary>

        {/* Grid Principal com TaskMonitor e ActivityFeed */}
        <Grid cols={1} gap="lg" className="lg:grid-cols-3">
          {/* Monitor de Tarefas (2/3 da largura) */}
          <div className="lg:col-span-2">
            <ErrorBoundary>
              <TaskMonitor 
                refreshInterval={5000}
              />
            </ErrorBoundary>
          </div>

          {/* Feed de Atividades (1/3 da largura) */}
          <div className="lg:col-span-1">
            <ErrorBoundary>
              <Card className="h-full">
                <div className="p-6">
                  <ActivityFeed />
                </div>
              </Card>
            </ErrorBoundary>
          </div>
        </Grid>
      </PageLayout>

      {/* Botão Flutuante de Notificações */}
      <FloatingNotificationButton
        onClick={() => setShowNotificationSettings(true)}
        unreadCount={unreadCount}
      />

      {/* Modal de Configurações de Notificação */}
      <Modal 
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      >
        <NotificationSettings 
          onClose={() => setShowNotificationSettings(false)}
        />
      </Modal>
    </>
  );
};

// Componente principal com Provider
const MonitorDashboard: React.FC = () => {
  return (
    <NotificationProvider>
      <MonitorContent />
    </NotificationProvider>
  );
};

export default MonitorDashboard;