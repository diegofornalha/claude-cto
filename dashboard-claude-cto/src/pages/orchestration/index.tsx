import React, { useState, useEffect } from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Button, 
  Badge, 
  Grid, 
  Stack,
  Skeleton,
  Alert
} from '../../components/ui';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { McpApi, Orchestration, OrchestrationTask } from '../../services/mcp-api';

// Interfaces específicas para o dashboard
interface OrchestrationGroup {
  id: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  tasks: OrchestrationTask[];
  created_at: string;
  started_at?: string;
  ended_at?: string;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  progress: number;
}

const OrchestrationDashboard: React.FC = () => {
  const [orchestrations, setOrchestrations] = useState<Orchestration[]>([]);
  const [groups, setGroups] = useState<OrchestrationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });

  // Carregar dados reais da API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const orchestrationsData = await McpApi.getOrchestrations();
        setOrchestrations(orchestrationsData);
        
        // Transformar orquestrações em grupos para exibição
        const groupsData: OrchestrationGroup[] = await Promise.all(
          orchestrationsData.map(async (orch) => {
            // Buscar detalhes completos incluindo tasks
            const fullOrch = await McpApi.getOrchestration(orch.id);
            const progress = orch.total_tasks > 0 
              ? Math.round((orch.completed_tasks / orch.total_tasks) * 100) 
              : 0;
            
            // API retorna 'id' diretamente, não 'orchestration_id'
            const orchId = orch.id;
            console.log('=== DEBUG: Mapeando orquestração ID:', orchId, 'Status:', orch.status);
            
            return {
              id: orchId,
              name: `orchestration_${orchId}`,
              status: orch.status,
              tasks: fullOrch?.tasks || [],
              created_at: orch.created_at,
              started_at: orch.started_at,
              ended_at: orch.ended_at,
              total_tasks: orch.total_tasks,
              completed_tasks: orch.completed_tasks,
              failed_tasks: orch.failed_tasks,
              progress
            };
          })
        );
        
        setGroups(groupsData);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar orquestrações. Verifique se a API está funcionando.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pendente', dot: false },
      running: { variant: 'primary' as const, label: 'Executando', dot: true },
      completed: { variant: 'success' as const, label: 'Completo', dot: false },
      failed: { variant: 'danger' as const, label: 'Falhou', dot: false },
      cancelled: { variant: 'default' as const, label: 'Cancelado', dot: false }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} dot={config.dot}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const handleDeleteClick = (orchestrationId: number) => {
    console.log('=== DEBUG DELETE CLICK ===');
    console.log('Orquestração ID clicado:', orchestrationId);
    console.log('Tipo do ID:', typeof orchestrationId);
    setConfirmDelete({ isOpen: true, id: orchestrationId });
  };

  const handleDeleteConfirm = async () => {
    console.log('=== DEBUG DELETE CONFIRM ===');
    console.log('confirmDelete state:', confirmDelete);
    console.log('ID a ser deletado:', confirmDelete.id);
    
    if (!confirmDelete.id) {
      console.error('ID não encontrado no confirmDelete!');
      return;
    }

    setDeletingId(confirmDelete.id);
    try {
      console.log('Chamando API para deletar ID:', confirmDelete.id);
      const success = await McpApi.cancelOrchestration(confirmDelete.id);
      if (success) {
        // Atualizar status para cancelado e recarregar dados
        alert('Orquestração cancelada com sucesso!');
        setConfirmDelete({ isOpen: false, id: null });
        // Recarregar dados para refletir o status atualizado
        handleRefresh();
      } else {
        // Encontrar a orquestração para verificar seu status
        const orch = orchestrations.find(o => o.id === confirmDelete.id);
        if (orch && (orch.status === 'completed' || orch.status === 'failed')) {
          alert(`Não é possível cancelar orquestração #${confirmDelete.id} porque ela já está ${orch.status === 'completed' ? 'concluída' : 'com falha'}. Apenas orquestrações em execução podem ser canceladas.`);
        } else {
          alert('Erro ao cancelar orquestração. Apenas orquestrações em execução podem ser canceladas.');
        }
        setConfirmDelete({ isOpen: false, id: null });
      }
    } catch (err) {
      console.error('Erro ao deletar:', err);
      alert('Erro ao deletar orquestração');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmDelete({ isOpen: false, id: null });
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const orchestrationsData = await McpApi.getOrchestrations();
      setOrchestrations(orchestrationsData);
      
      const groupsData: OrchestrationGroup[] = await Promise.all(
        orchestrationsData.map(async (orch) => {
          const fullOrch = await McpApi.getOrchestration(orch.id);
          const progress = orch.total_tasks > 0 
            ? Math.round((orch.completed_tasks / orch.total_tasks) * 100) 
            : 0;
          
          return {
            id: orch.id,
            name: `orchestration_${orch.id}`,
            status: orch.status,
            tasks: fullOrch?.tasks || [],
            created_at: orch.created_at,
            started_at: orch.started_at,
            ended_at: orch.ended_at,
            total_tasks: orch.total_tasks,
            completed_tasks: orch.completed_tasks,
            failed_tasks: orch.failed_tasks,
            progress
          };
        })
      );
      
      setGroups(groupsData);
    } catch (err) {
      console.error('Erro ao recarregar dados:', err);
      setError('Erro ao recarregar orquestrações.');
    } finally {
      setLoading(false);
    }
  };

  const headerActions = (
    <Stack direction="horizontal" spacing="md">
      <Button 
        variant="outline" 
        onClick={handleRefresh}
        disabled={loading}
      >
        {loading ? 'Atualizando...' : 'Atualizar'}
      </Button>
    </Stack>
  );

  if (loading) {
    return (
      <PageLayout>
        <PageHeader
          title="Dashboard de Orquestração"
          description="Gerencie e monitore suas orquestrações de tarefas"
          actions={headerActions}
        />
        
        <Grid cols={1} colsLg={2} gap="lg">
          {[...Array(4)].map((_, i) => (
            <Card key={`skeleton-${i}`} padding="lg">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </Card>
          ))}
        </Grid>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <PageHeader
          title="Dashboard de Orquestração"
          description="Gerencie e monitore suas orquestrações de tarefas"
          actions={headerActions}
        />
        
        <Alert severity="error" title="Erro ao carregar dados">
          {error}
        </Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Dashboard de Orquestração"
        description="Gerencie e monitore suas orquestrações de tarefas"
        actions={headerActions}
      />

      {/* Grupos de Orquestração */}
      {groups.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Orquestrações ({groups.length})
          </h2>
          
          <Stack spacing="lg">
            {groups.map((group) => (
              <Card key={group.id} padding="lg" hoverable>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Orquestração #{group.id} {/* DEBUG: {JSON.stringify({id: group.id, type: typeof group.id})} */}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {group.total_tasks} tarefas • Criado em {formatDate(group.created_at)}
                        {group.started_at && ` • Iniciado em ${formatDate(group.started_at)}`}
                        {group.ended_at && ` • Finalizado em ${formatDate(group.ended_at)}`}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getStatusBadge(group.status)}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {group.progress}%
                      </span>
                      {group.status === 'running' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(group.id)}
                          disabled={deletingId === group.id}
                          className="text-orange-600 hover:text-orange-700 border-orange-300 hover:border-orange-400"
                          title="Cancelar orquestração em execução"
                        >
                          Cancelar
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={true}
                          className="text-gray-400 border-gray-200 cursor-not-allowed"
                          title={`Orquestração ${group.status === 'completed' ? 'concluída' : group.status === 'failed' ? 'com falha' : group.status}. Apenas orquestrações em execução podem ser canceladas.`}
                        >
                          {group.status === 'cancelled' ? 'Cancelada' : 'Finalizada'}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Barra de progresso */}
                  <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${group.progress}%` }}
                    />
                  </div>
                  
                  {/* Estatísticas */}
                  <div className="mt-3 flex gap-4 text-sm">
                    <span className="text-green-600 dark:text-green-400">
                      ✓ {group.completed_tasks} completas
                    </span>
                    {group.failed_tasks > 0 && (
                      <span className="text-red-600 dark:text-red-400">
                        ✗ {group.failed_tasks} falharam
                      </span>
                    )}
                    <span className="text-gray-500 dark:text-gray-400">
                      {group.total_tasks - group.completed_tasks - group.failed_tasks} pendentes
                    </span>
                  </div>
                </CardHeader>

                {/* Mensagem para orquestrações com falha sem detalhes de tarefas */}
                {group.failed_tasks > 0 && (!group.tasks || group.tasks.length === 0) && (
                  <CardBody>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        ⚠️ Esta orquestração falhou. Detalhes das tarefas não disponíveis.
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Verifique os logs do servidor para mais informações sobre o erro.
                      </p>
                    </div>
                  </CardBody>
                )}

                {group.tasks && group.tasks.length > 0 && (
                  <CardBody>
                    <div className="space-y-3">
                      {group.tasks.map((task) => (
                        <div 
                          key={task.task_id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            task.status === 'failed' 
                              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
                              : 'bg-gray-50 dark:bg-gray-800'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-gray-900 dark:text-white">
                                {task.identifier || `Task #${task.task_id}`}
                              </span>
                              {getStatusBadge(task.status)}
                            </div>
                            {task.depends_on && task.depends_on.length > 0 && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                <span className="font-semibold">Depende de:</span> {task.depends_on.join(', ')}
                              </p>
                            )}
                            {task.error_message && (
                              <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800">
                                <p className="text-xs text-red-800 dark:text-red-300 font-semibold mb-1">
                                  ❌ Erro:
                                </p>
                                <p className="text-xs text-red-700 dark:text-red-400 font-mono">
                                  {task.error_message}
                                </p>
                              </div>
                            )}
                            {task.started_at && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Iniciado: {formatDate(task.started_at)}
                              </p>
                            )}
                            {task.ended_at && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Finalizado: {formatDate(task.ended_at)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                )}
              </Card>
            ))}
          </Stack>
        </div>
      )}

      {/* Estado vazio */}
      {groups.length === 0 && !loading && !error && (
        <Card padding="lg" className="text-center">
          <div className="py-12">
            <div className="text-gray-400 mb-4">
              <svg 
                className="w-16 h-16 mx-auto" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhuma orquestração encontrada
            </h3>
            
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Use o MCP do Claude para criar orquestrações.
            </p>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                💡 Crie orquestrações via mcp__claude-cto__create_task
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Diálogo de confirmação */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Cancelar Orquestração"
        message={`Tem certeza que deseja cancelar a orquestração #${confirmDelete.id}? Isso irá parar todas as tasks em execução.`}
        confirmText="Cancelar Orquestração"
        cancelText="Voltar"
        variant="warning"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deletingId !== null}
      />
    </PageLayout>
  );
};

export default OrchestrationDashboard;