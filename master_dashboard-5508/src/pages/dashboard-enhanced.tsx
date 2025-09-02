/**
 * Dashboard aprimorado com integração completa da API
 * Demonstra o uso de todos os novos componentes e hooks
 */

import React from 'react'
import Layout from '@/components/Layout'
import TaskListEnhanced from '@/components/TaskListEnhanced'
import { useApiHealth, ApiHealthProvider } from '@/hooks/useApiHealth'
import { useTaskStore } from '@/store/taskStore'
import { 
  LoadingSpinner,
  ConnectionBadge,
  ErrorMessage,
  useToast
} from '@/components/ui/LoadingIndicators'

function DashboardContent() {
  const { 
    isOnline, 
    isConnecting, 
    connectionQuality,
    responseTime,
    errorMessage,
    checkHealth,
    restartMonitoring 
  } = useApiHealth()
  
  const { 
    analytics, 
    fetchAnalytics, 
    lastError: analyticsError 
  } = useTaskStore()
  
  const toast = useToast()
  
  // Carregar analytics ao montar
  React.useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])
  
  const handleTestConnection = async () => {
    toast.info('Testando conexão...')
    const result = await checkHealth()
    if (result.status) {
      toast.success(`Conexão OK! (${result.response_time}ms)`)
    } else {
      toast.error(`Falha na conexão: ${result.error}`)
    }
  }
  
  return (
    <Layout title="Dashboard Aprimorado" description="Painel com monitoramento avançado da API">
      <div className="space-y-6">
        {/* Status da API */}
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <h3 className="text-lg font-semibold mb-4">Status da Conexão</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <ConnectionBadge 
                  status={
                    isConnecting ? 'connecting' : 
                    isOnline ? 'online' : 
                    'offline'
                  }
                  responseTime={responseTime}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Qualidade:</span>
                <span className={`text-sm font-medium ${
                  connectionQuality === 'excellent' ? 'text-green-600' :
                  connectionQuality === 'good' ? 'text-yellow-600' :
                  connectionQuality === 'poor' ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {
                    connectionQuality === 'excellent' ? 'Excelente' :
                    connectionQuality === 'good' ? 'Boa' :
                    connectionQuality === 'poor' ? 'Fraca' :
                    'Sem conexão'
                  }
                </span>
              </div>
              
              {responseTime > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Latência:</span>
                  <span className="text-sm font-mono">{responseTime}ms</span>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleTestConnection}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Testando...</span>
                  </div>
                ) : (
                  'Testar Conexão'
                )}
              </button>
              
              <button
                onClick={restartMonitoring}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Reiniciar Monitor
              </button>
            </div>
            
            <div className="space-y-2">
              {errorMessage && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  <strong>Erro:</strong> {errorMessage}
                </div>
              )}
              
              <div className="text-xs text-gray-500 space-y-1">
                <div>🔄 Monitoramento automático ativo</div>
                <div>⚡ Retry com exponential backoff</div>
                <div>💾 Cache inteligente ativo</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Analytics */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.totalTasks}
              </div>
              <div className="text-sm text-gray-600">Total de Tarefas</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-green-600">
                {analytics.successRate}%
              </div>
              <div className="text-sm text-gray-600">Taxa de Sucesso</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-yellow-600">
                {analytics.statusCounts.running || 0}
              </div>
              <div className="text-sm text-gray-600">Em Execução</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-gray-600">
                {Math.round(analytics.avgExecutionTime)}s
              </div>
              <div className="text-sm text-gray-600">Tempo Médio</div>
            </div>
          </div>
        )}
        
        {/* Erro de analytics */}
        {analyticsError && !analytics && (
          <ErrorMessage 
            message={`Erro ao carregar analytics: ${analyticsError}`}
            onRetry={() => fetchAnalytics(true)}
          />
        )}
        
        {/* Lista de Tarefas Aprimorada */}
        <TaskListEnhanced 
          showFilters={true}
          autoRefresh={true}
          refreshInterval={30000}
        />
        
        {/* Footer com informações técnicas */}
        <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <strong>Funcionalidades:</strong>
              <ul className="mt-1 space-y-1">
                <li>✅ Retry automático com backoff</li>
                <li>✅ Cache inteligente (30s)</li>
                <li>✅ Modo offline com dados mock</li>
                <li>✅ Monitoramento de saúde da API</li>
              </ul>
            </div>
            
            <div>
              <strong>Tratamento de Erros:</strong>
              <ul className="mt-1 space-y-1">
                <li>✅ Fallback para dados cached</li>
                <li>✅ Notificações de toast</li>
                <li>✅ Indicadores visuais de status</li>
                <li>✅ Recuperação automática</li>
              </ul>
            </div>
            
            <div>
              <strong>UX Aprimorada:</strong>
              <ul className="mt-1 space-y-1">
                <li>✅ Loading skeletons</li>
                <li>✅ Estados vazios informativos</li>
                <li>✅ Feedback de ações</li>
                <li>✅ Badge de conexão em tempo real</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default function DashboardEnhanced() {
  return (
    <ApiHealthProvider options={{ 
      checkInterval: 30000,  // 30 segundos
      autoStart: true,
      retryOnError: true,
      maxRetries: 5
    }}>
      <DashboardContent />
    </ApiHealthProvider>
  )
}