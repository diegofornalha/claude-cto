import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Stack } from '../ui/Stack';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source?: string;
  details?: any;
}

interface SystemLogsProps {
  maxEntries?: number;
  autoScroll?: boolean;
}

export const SystemLogs: React.FC<SystemLogsProps> = ({
  maxEntries = 100,
  autoScroll = true
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'debug'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Carregar logs reais da API ou WebSocket
  useEffect(() => {
    if (isPaused) return;

    const fetchLogs = async () => {
      try {
        // Tentar buscar logs da API (se existir endpoint)
        const response = await fetch('http://localhost:8888/api/v1/activities');
        
        if (response.ok) {
          const activities = await response.json();
          
          // Converter atividades para formato de log
          const logsFromAPI: LogEntry[] = activities.slice(0, maxEntries).map((activity: any) => ({
            id: `log-${activity.id || Date.now()}-${Math.random()}`,
            timestamp: activity.timestamp || activity.created_at || new Date().toISOString(),
            level: determineLogLevel(activity),
            message: activity.message || activity.description || 'Atividade registrada',
            source: activity.source || activity.type || 'System',
            details: activity.details || activity.data
          }));
          
          setLogs(logsFromAPI);
        } else {
          // Se não houver endpoint de logs/activities, mostrar mensagem informativa
          setLogs([{
            id: 'no-logs',
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'Sistema de logs aguardando conexão com o servidor',
            source: 'System'
          }]);
        }
      } catch (error) {
        console.error('Erro ao buscar logs:', error);
        // Mostrar log de erro de conexão
        setLogs([{
          id: 'error-log',
          timestamp: new Date().toISOString(),
          level: 'warning',
          message: 'Não foi possível conectar ao servidor de logs. Verifique se a API está rodando.',
          source: 'System'
        }]);
      }
    };

    // Buscar logs inicialmente
    fetchLogs();

    // Atualizar logs periodicamente
    const interval = setInterval(fetchLogs, 5000);

    return () => clearInterval(interval);
  }, [isPaused, maxEntries]);

  // Função auxiliar para determinar o nível do log baseado na atividade
  const determineLogLevel = (activity: any): LogEntry['level'] => {
    if (activity.level) return activity.level;
    if (activity.type === 'error' || activity.status === 'failed') return 'error';
    if (activity.type === 'warning') return 'warning';
    if (activity.type === 'debug') return 'debug';
    return 'info';
  };

  // Auto scroll para o final
  useEffect(() => {
    if (autoScroll && !isPaused) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, isPaused]);

  const getLevelBadgeProps = (level: LogEntry['level']) => {
    switch (level) {
      case 'info':
        return { variant: 'info' as const, text: 'INFO' };
      case 'warning':
        return { variant: 'warning' as const, text: 'WARN' };
      case 'error':
        return { variant: 'danger' as const, text: 'ERROR' };
      case 'debug':
        return { variant: 'default' as const, text: 'DEBUG' };
    }
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info':
        return '🔵';
      case 'warning':
        return '🟡';
      case 'error':
        return '🔴';
      case 'debug':
        return '⚪';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filter === 'all' || log.level === filter;
    const matchesSearch = searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `system-logs-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <Card>
      <CardHeader>
        <Stack direction="horizontal" spacing="sm" align="center" justify="between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Logs do Sistema
          </h3>
          <Stack direction="horizontal" spacing="sm" align="center">
            <Badge variant="default" size="sm">
              {filteredLogs.length} logs
            </Badge>
            <Button
              variant={isPaused ? 'danger' : 'secondary'}
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isPaused ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                  )}
                </svg>
              }
            >
              {isPaused ? 'Retomar' : 'Pausar'}
            </Button>
          </Stack>
        </Stack>
      </CardHeader>
      <CardBody>
        <Stack spacing="md">
          {/* Controles de Filtro */}
          <Stack direction="horizontal" spacing="sm" align="center" wrap>
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Buscar nos logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="
                  w-full px-3 py-1.5 text-sm
                  border border-gray-300 dark:border-gray-600
                  rounded-lg
                  bg-white dark:bg-gray-700
                  text-gray-900 dark:text-white
                  placeholder-gray-500 dark:placeholder-gray-400
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                "
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="
                px-3 py-1.5 text-sm
                border border-gray-300 dark:border-gray-600
                rounded-lg
                bg-white dark:bg-gray-700
                text-gray-900 dark:text-white
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              "
            >
              <option value="all">Todos os níveis</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="debug">Debug</option>
            </select>

            <Button
              variant="ghost"
              size="sm"
              onClick={clearLogs}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
            >
              Limpar
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={exportLogs}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              }
            >
              Exportar
            </Button>
          </Stack>

          {/* Lista de Logs */}
          <div className="bg-gray-900 dark:bg-black rounded-lg p-4 font-mono text-xs overflow-auto max-h-96">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum log encontrado
              </div>
            ) : (
              <div className="space-y-1">
                {filteredLogs.map((log) => (
                  <div 
                    key={log.id}
                    className="flex items-start gap-2 hover:bg-gray-800 dark:hover:bg-gray-900 p-1 rounded"
                  >
                    <span className="text-gray-500 flex-shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="flex-shrink-0">
                      {getLevelIcon(log.level)}
                    </span>
                    {log.source && (
                      <span className="text-cyan-400 flex-shrink-0">
                        [{log.source}]
                      </span>
                    )}
                    <span className={`
                      flex-1
                      ${log.level === 'error' ? 'text-red-400' : ''}
                      ${log.level === 'warning' ? 'text-yellow-400' : ''}
                      ${log.level === 'info' ? 'text-green-400' : ''}
                      ${log.level === 'debug' ? 'text-gray-400' : ''}
                    `}>
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>

          {/* Rodapé com estatísticas */}
          <Stack direction="horizontal" spacing="sm" align="center" justify="between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Mostrando {filteredLogs.length} de {logs.length} logs
            </div>
            <Stack direction="horizontal" spacing="xs" align="center">
              <span className="text-xs text-gray-500 dark:text-gray-400">Níveis:</span>
              {['info', 'warning', 'error', 'debug'].map(level => {
                const count = filteredLogs.filter(l => l.level === level).length;
                if (count === 0) return null;
                return (
                  <Badge 
                    key={level}
                    {...getLevelBadgeProps(level as LogEntry['level'])}
                    size="sm"
                  >
                    {count}
                  </Badge>
                );
              })}
            </Stack>
          </Stack>
        </Stack>
      </CardBody>
    </Card>
  );
};

export default SystemLogs;