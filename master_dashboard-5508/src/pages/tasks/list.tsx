import React, { useState, useEffect, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Grid, GridItem } from '@/components/ui/Grid';
import { Stack } from '@/components/ui/Stack';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

// Types
interface Task {
  id: string;
  identifier: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  execution_prompt: string;
  model: 'opus' | 'sonnet' | 'haiku';
  working_directory: string;
  orchestration_group?: string;
  execution_time?: number; // in seconds
}

interface TaskFilters {
  search: string;
  status: string;
  model: string;
  dateRange: string;
  sortBy: 'created_at' | 'updated_at' | 'identifier';
  sortOrder: 'asc' | 'desc';
}

// Mock data
const mockTasks: Task[] = [
  {
    id: '1',
    identifier: 'refactor-auth-system',
    status: 'running',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T11:45:00Z',
    execution_prompt: 'Refatorar o sistema de autenticação para usar JWT tokens com refresh tokens. Implementar middleware de autenticação e autorização baseado em roles.',
    model: 'opus',
    working_directory: '/app/src/auth',
    orchestration_group: 'security-upgrade',
    execution_time: 1875
  },
  {
    id: '2',
    identifier: 'optimize-database-queries',
    status: 'completed',
    created_at: '2024-01-15T09:15:00Z',
    updated_at: '2024-01-15T10:20:00Z',
    execution_prompt: 'Otimizar queries lentas no serviço de usuários. Adicionar índices apropriados, revisar N+1 queries e implementar cache Redis.',
    model: 'sonnet',
    working_directory: '/app/services/users',
    execution_time: 3900
  },
  {
    id: '3',
    identifier: 'add-unit-tests-payments',
    status: 'failed',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:30:00Z',
    execution_prompt: 'Adicionar testes unitários abrangentes para o módulo de pagamentos. Incluir testes para cenários de sucesso, falha e edge cases.',
    model: 'haiku',
    working_directory: '/app/tests/payments',
    execution_time: 450
  },
  {
    id: '4',
    identifier: 'implement-monitoring',
    status: 'pending',
    created_at: '2024-01-15T07:30:00Z',
    updated_at: '2024-01-15T07:30:00Z',
    execution_prompt: 'Implementar sistema de monitoramento com Prometheus e Grafana. Adicionar métricas customizadas para monitorar performance da aplicação.',
    model: 'opus',
    working_directory: '/app/monitoring',
    orchestration_group: 'infrastructure'
  },
  {
    id: '5',
    identifier: 'fix-memory-leak-users',
    status: 'completed',
    created_at: '2024-01-14T16:20:00Z',
    updated_at: '2024-01-14T18:45:00Z',
    execution_prompt: 'Investigar e corrigir vazamento de memória no service de usuários. Usar profiling tools para identificar a causa.',
    model: 'sonnet',
    working_directory: '/app/services/users',
    execution_time: 8640
  },
  {
    id: '6',
    identifier: 'create-api-documentation',
    status: 'running',
    created_at: '2024-01-14T14:10:00Z',
    updated_at: '2024-01-14T15:30:00Z',
    execution_prompt: 'Criar documentação completa da API usando Swagger/OpenAPI. Incluir exemplos de request/response para todos os endpoints.',
    model: 'haiku',
    working_directory: '/app/docs',
    execution_time: 4800
  }
];

// Filter options
const statusOptions = [
  { value: '', label: 'Todos os Status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'running', label: 'Em Execução' },
  { value: 'completed', label: 'Concluída' },
  { value: 'failed', label: 'Falhada' }
];

const modelOptions = [
  { value: '', label: 'Todos os Modelos' },
  { value: 'opus', label: 'Opus' },
  { value: 'sonnet', label: 'Sonnet' },
  { value: 'haiku', label: 'Haiku' }
];

const dateRangeOptions = [
  { value: '', label: 'Todas as Datas' },
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Última Semana' },
  { value: 'month', label: 'Último Mês' }
];

const sortOptions = [
  { value: 'created_at', label: 'Data de Criação' },
  { value: 'updated_at', label: 'Última Atualização' },
  { value: 'identifier', label: 'Nome' }
];

export default function TasksList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: '',
    model: '',
    dateRange: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Simulate API loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setTasks(mockTasks);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(task =>
        task.identifier.toLowerCase().includes(searchLower) ||
        task.execution_prompt.toLowerCase().includes(searchLower) ||
        task.working_directory.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Model filter
    if (filters.model) {
      filtered = filtered.filter(task => task.model === filters.model);
    }

    // Date range filter (simplified)
    if (filters.dateRange) {
      const now = new Date();
      const taskDate = (task: Task) => new Date(task.created_at);
      
      switch (filters.dateRange) {
        case 'today':
          filtered = filtered.filter(task => {
            const diff = now.getTime() - taskDate(task).getTime();
            return diff < 24 * 60 * 60 * 1000; // 24 hours
          });
          break;
        case 'week':
          filtered = filtered.filter(task => {
            const diff = now.getTime() - taskDate(task).getTime();
            return diff < 7 * 24 * 60 * 60 * 1000; // 7 days
          });
          break;
        case 'month':
          filtered = filtered.filter(task => {
            const diff = now.getTime() - taskDate(task).getTime();
            return diff < 30 * 24 * 60 * 60 * 1000; // 30 days
          });
          break;
      }
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aVal: any = a[filters.sortBy];
      let bVal: any = b[filters.sortBy];

      if (filters.sortBy === 'created_at' || filters.sortBy === 'updated_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (filters.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [tasks, filters]);

  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const selectAllTasks = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map(t => t.id)));
    }
  };

  const getStatusBadgeVariant = (status: Task['status']) => {
    switch (status) {
      case 'running': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'danger';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatExecutionTime = (seconds?: number) => {
    if (!seconds) return '-';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <Card 
      hoverable 
      className={selectedTasks.has(task.id) ? 'ring-2 ring-blue-500' : ''}
    >
      <CardBody>
        <Stack direction="vertical" spacing="sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedTasks.has(task.id)}
                onChange={() => toggleTaskSelection(task.id)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {task.identifier}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {task.model} • {task.working_directory}
                  {task.orchestration_group && (
                    <span> • Grupo: {task.orchestration_group}</span>
                  )}
                </p>
              </div>
            </div>
            <Badge variant={getStatusBadgeVariant(task.status)}>
              {task.status}
            </Badge>
          </div>
          
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            {task.execution_prompt}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Criada: {formatDate(task.created_at)}</span>
            {task.execution_time && (
              <span>Tempo: {formatExecutionTime(task.execution_time)}</span>
            )}
          </div>
        </Stack>
      </CardBody>
    </Card>
  );

  const TaskListItem: React.FC<{ task: Task }> = ({ task }) => (
    <div className={`
      p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50
      ${selectedTasks.has(task.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
    `}>
      <div className="flex items-center gap-4">
        <input
          type="checkbox"
          checked={selectedTasks.has(task.id)}
          onChange={() => toggleTaskSelection(task.id)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {task.identifier}
            </h3>
            <Badge variant={getStatusBadgeVariant(task.status)} size="sm">
              {task.status}
            </Badge>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
            {task.execution_prompt}
          </p>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{task.model}</span>
            <span>{task.working_directory}</span>
            <span>Criada: {formatDate(task.created_at)}</span>
            {task.execution_time && (
              <span>Tempo: {formatExecutionTime(task.execution_time)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const headerActions = (
    <Stack direction="horizontal" spacing="sm">
      <Button variant="outline" size="md">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Exportar
      </Button>
      
      <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
        <button
          onClick={() => setViewMode('grid')}
          className={`px-3 py-2 text-sm ${
            viewMode === 'grid' 
              ? 'bg-blue-500 text-white' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`px-3 py-2 text-sm ${
            viewMode === 'list' 
              ? 'bg-blue-500 text-white' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
      </div>
      
      <Button size="md">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Nova Task
      </Button>
    </Stack>
  );

  return (
    <PageLayout>
      <PageHeader
        title="Lista de Tasks"
        description={`${filteredTasks.length} tasks encontradas`}
        actions={headerActions}
      />

      <Stack direction="vertical" spacing="lg">
        {/* Filters */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filtros
            </h3>
          </CardHeader>
          <CardBody>
            <Grid cols={1} colsMd={2} colsLg={4} colsXl={6} gap="md">
              <GridItem colSpan={1}>
                <Input
                  placeholder="Buscar por nome, descrição ou diretório..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  fullWidth
                />
              </GridItem>
              
              <Select
                options={statusOptions}
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                placeholder="Status"
                fullWidth
              />
              
              <Select
                options={modelOptions}
                value={filters.model}
                onChange={(e) => handleFilterChange('model', e.target.value)}
                placeholder="Modelo"
                fullWidth
              />
              
              <Select
                options={dateRangeOptions}
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                placeholder="Período"
                fullWidth
              />
              
              <Select
                options={sortOptions}
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                fullWidth
              />
              
              <Select
                options={[
                  { value: 'desc', label: 'Decrescente' },
                  { value: 'asc', label: 'Crescente' }
                ]}
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                fullWidth
              />
            </Grid>
          </CardBody>
        </Card>

        {/* Bulk Actions */}
        {selectedTasks.size > 0 && (
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedTasks.size} task(s) selecionada(s)
                </p>
                <Stack direction="horizontal" spacing="sm">
                  <Button variant="outline" size="sm">
                    Cancelar Tasks
                  </Button>
                  <Button variant="danger" size="sm">
                    Excluir Tasks
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTasks(new Set())}>
                    Limpar Seleção
                  </Button>
                </Stack>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Tasks List/Grid */}
        {loading ? (
          viewMode === 'grid' ? (
            <Grid cols={1} colsMd={2} colsLg={3} gap="lg">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </Grid>
          ) : (
            <Card>
              <CardBody>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-1"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )
        ) : filteredTasks.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  Nenhuma task encontrada
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Ajuste os filtros ou crie uma nova task.
                </p>
                <div className="mt-6">
                  <Button>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nova Task
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : viewMode === 'grid' ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                  onChange={selectAllTasks}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Selecionar todas
                </span>
              </div>
            </div>
            
            <Grid cols={1} colsMd={2} colsLg={3} gap="lg">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </Grid>
          </>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                  onChange={selectAllTasks}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Selecionar todas ({filteredTasks.length})
                </span>
              </div>
            </CardHeader>
            <CardBody>
              {filteredTasks.map((task) => (
                <TaskListItem key={task.id} task={task} />
              ))}
            </CardBody>
          </Card>
        )}
      </Stack>
    </PageLayout>
  );
}