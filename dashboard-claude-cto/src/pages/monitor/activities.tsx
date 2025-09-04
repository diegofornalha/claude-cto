// Página de feed completo de atividades
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { 
  Activity as ActivityIcon, 
  ArrowLeft,
  Filter,
  RefreshCw,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  PlayCircle
} from 'lucide-react';
import { McpApi, Activity } from '../../services/mcp-api';
import { useWebSocketEvent } from '../../services/websocket';

const ActivitiesPage: React.FC = () => {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Carregar atividades iniciais
  useEffect(() => {
    loadActivities();
  }, []);

  // Escutar novos eventos via WebSocket
  useWebSocketEvent('activity_added', (newActivity: Activity) => {
    if (autoRefresh) {
      setActivities(prev => [newActivity, ...prev].slice(0, 100));
    }
  });

  // Filtrar atividades
  useEffect(() => {
    let filtered = activities;

    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(a => a.type === filterType);
    }

    // Filtro por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.message.toLowerCase().includes(term) ||
        a.task_identifier?.toLowerCase().includes(term) ||
        a.task_id?.toLowerCase().includes(term)
      );
    }

    setFilteredActivities(filtered);
  }, [activities, filterType, searchTerm]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await McpApi.getActivities(100);
      setActivities(data);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'task_created':
        return <PlayCircle className="h-5 w-5 text-blue-500" />;
      case 'task_started':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'task_completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'task_failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'system_event':
        return <AlertCircle className="h-5 w-5 text-purple-500" />;
      default:
        return <ActivityIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'task_created':
        return 'bg-blue-50 border-blue-200';
      case 'task_started':
        return 'bg-yellow-50 border-yellow-200';
      case 'task_completed':
        return 'bg-green-50 border-green-200';
      case 'task_failed':
        return 'bg-red-50 border-red-200';
      case 'system_event':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Se for menos de 1 minuto
    if (diff < 60000) {
      return 'Agora mesmo';
    }
    
    // Se for menos de 1 hora
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} atrás`;
    }
    
    // Se for menos de 24 horas
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} ${hours === 1 ? 'hora' : 'horas'} atrás`;
    }
    
    // Caso contrário, mostrar data completa
    return date.toLocaleString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/monitor')}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              
              <ActivityIcon className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Feed de Atividades
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              
              <button
                onClick={loadActivities}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Recarregar"
              >
                <RefreshCw className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filtros e Controles */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Busca */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar atividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">Todas</option>
                  <option value="task_created">Tarefas Criadas</option>
                  <option value="task_started">Tarefas Iniciadas</option>
                  <option value="task_completed">Tarefas Concluídas</option>
                  <option value="task_failed">Tarefas com Falha</option>
                  <option value="system_event">Eventos do Sistema</option>
                </select>
              </div>

              {/* Auto-refresh */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="sr-only"
                />
                <div className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                  autoRefresh ? 'bg-indigo-600' : 'bg-gray-300'
                }`}>
                  <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                    autoRefresh ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </div>
                <span className="ml-2 text-sm text-gray-700">Auto-atualizar</span>
              </label>
            </div>
          </div>

          {/* Contadores */}
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
            <span>{filteredActivities.length} atividades</span>
            {searchTerm && (
              <span className="text-indigo-600">
                Filtrando por: "{searchTerm}"
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Atividades */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Carregando atividades...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-8 text-center">
              <ActivityIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma atividade encontrada</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-indigo-600 hover:text-indigo-700"
                >
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${getActivityColor(activity.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.message}
                        </p>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                      
                      {(activity.task_identifier || activity.task_id) && (
                        <div className="mt-1 flex items-center gap-4 text-xs text-gray-600">
                          {activity.task_identifier && (
                            <span>
                              <span className="font-medium">ID:</span> {activity.task_identifier}
                            </span>
                          )}
                          {activity.metadata?.execution_time && (
                            <span>
                              <span className="font-medium">Tempo:</span> {activity.metadata.execution_time.toFixed(2)}s
                            </span>
                          )}
                        </div>
                      )}
                      
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            Ver detalhes
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(activity.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ActivitiesPage;