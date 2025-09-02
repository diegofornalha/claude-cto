import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
import { ErrorState, EmptyState, LoadingState, SkeletonTaskCard, ConnectionStatus } from '@/components/ui/States';
import { tokens } from '../../utils/design-tokens';
import { McpApi } from '@/services/mcp-api';

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
  sortBy: 'created_at' | 'updated_at' | 'identifier' | 'execution_time';
  sortOrder: 'asc' | 'desc';
}


// Enhanced filter options with icons
const statusOptions = [
  { value: '', label: 'Todos os Status', icon: '📋' },
  { value: 'pending', label: 'Pendente', icon: '⏳' },
  { value: 'running', label: 'Em Execução', icon: '⚡' },
  { value: 'completed', label: 'Concluída', icon: '✅' },
  { value: 'failed', label: 'Falhada', icon: '❌' }
];

const modelOptions = [
  { value: '', label: 'Todos os Modelos', icon: '🤖' },
  { value: 'opus', label: 'Opus', icon: '🎭' },
  { value: 'sonnet', label: 'Sonnet', icon: '📝' },
  { value: 'haiku', label: 'Haiku', icon: '🌸' }
];

const dateRangeOptions = [
  { value: '', label: 'Todas as Datas', icon: '📅' },
  { value: 'today', label: 'Hoje', icon: '📍' },
  { value: 'week', label: 'Última Semana', icon: '📊' },
  { value: 'month', label: 'Último Mês', icon: '📈' }
];

const sortOptions = [
  { value: 'created_at', label: 'Data de Criação', icon: '🕐' },
  { value: 'updated_at', label: 'Última Atualização', icon: '🔄' },
  { value: 'identifier', label: 'Nome', icon: '🏷️' },
  { value: 'execution_time', label: 'Tempo de Execução', icon: '⏱️' }
];

export default function TasksList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [bulkActionMode, setBulkActionMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: '',
    model: '',
    dateRange: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      const apiTasks = await McpApi.getTasks();
      // Transform API tasks to match the interface
      const transformedTasks = apiTasks.map(task => ({
        ...task,
        execution_time: task.execution_time ? Math.floor(task.execution_time / 1000) : undefined
      }));
      setTasks(transformedTasks);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar tasks:', err);
      setError('Erro ao carregar tasks. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTasks();
  }, []);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchTasks();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Performance optimization: debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Enhanced filter and sort tasks with performance optimization
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Search filter with debouncing
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(task =>
        task.identifier.toLowerCase().includes(searchLower) ||
        task.execution_prompt.toLowerCase().includes(searchLower) ||
        task.working_directory.toLowerCase().includes(searchLower) ||
        task.orchestration_group?.toLowerCase().includes(searchLower)
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

    // Enhanced sort with multiple field support
    filtered = [...filtered].sort((a, b) => {
      let aVal: any = a[filters.sortBy];
      let bVal: any = b[filters.sortBy];

      if (filters.sortBy === 'created_at' || filters.sortBy === 'updated_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else if (filters.sortBy === 'execution_time') {
        aVal = a.execution_time || 0;
        bVal = b.execution_time || 0;
      }

      if (filters.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [tasks, filters, debouncedSearch]);

  // Statistics for filtered tasks
  const taskStats = useMemo(() => {
    const stats = filteredTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: filteredTasks.length,
      pending: stats.pending || 0,
      running: stats.running || 0,
      completed: stats.completed || 0,
      failed: stats.failed || 0
    };
  }, [filteredTasks]);

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

  const TaskCard: React.FC<{ task: Task; index: number }> = ({ task, index }) => (
    <Card 
      hoverable 
      className={`
        transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl
        ${selectedTasks.has(task.id) ? 'ring-2 ring-blue-500 shadow-lg' : ''}
        animate-fade-in-up
      `}
      style={{
        animationDelay: `${index * 50}ms`
      }}
    >
      <CardBody className="p-6">
        <Stack direction="vertical" spacing="sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={selectedTasks.has(task.id)}
                onChange={() => toggleTaskSelection(task.id)}
                className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-transform duration-150 hover:scale-110"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                    {task.identifier}
                  </h3>
                  {task.orchestration_group && (
                    <Badge variant="default" size="sm" className="text-xs">
                      🎭 {task.orchestration_group}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    {modelOptions.find(m => m.value === task.model)?.icon || '🤖'}
                    <span className="font-medium">{task.model}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    📁 <span className="font-mono text-xs">{task.working_directory}</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <Badge 
                variant={getStatusBadgeVariant(task.status)}
                className="animate-pulse-soft"
              >
                {statusOptions.find(s => s.value === task.status)?.icon || '📋'}
                <span className="ml-1 capitalize">{task.status}</span>
              </Badge>
              
              {task.execution_time && (
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  ⏱️ {formatExecutionTime(task.execution_time)}
                </span>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">
              {task.execution_prompt}
            </p>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                🕐 <span>Criada: {formatDate(task.created_at)}</span>
              </span>
              <span className="flex items-center gap-1">
                🔄 <span>Atualizada: {formatDate(task.updated_at)}</span>
              </span>
            </div>
            
            <div className="flex gap-1">
              <Button size="sm" variant="secondary" className="text-xs px-2 py-1">
                👁️ Ver
              </Button>
              <Button size="sm" variant="secondary" className="text-xs px-2 py-1">
                ✏️ Editar
              </Button>
            </div>
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
    <Stack direction="horizontal" spacing="sm" className="flex-wrap">
      {/* Statistics Badges */}
      <div className="flex items-center gap-2 mr-4">
        <Badge variant="default" className="text-xs">
          📊 {taskStats.total} total
        </Badge>
        {taskStats.running > 0 && (
          <Badge variant="warning" className="text-xs animate-pulse-soft">
            ⚡ {taskStats.running} executando
          </Badge>
        )}
      </div>
      
      <Button
        variant={autoRefresh ? 'success' : 'secondary'}
        size="sm"
        onClick={() => setAutoRefresh(!autoRefresh)}
      >
        {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
      </Button>

      <Button 
        variant="secondary" 
        size="sm"
        onClick={async () => {
          if (confirm('Limpar todas as tasks completadas e falhadas?')) {
            try {
              const result = await McpApi.clearTasks();
              alert(`${result.cleared} tasks removidas`);
              fetchTasks();
            } catch (err) {
              alert('Erro ao limpar tasks');
            }
          }
        }}
      >
        🧹 Limpar Concluídas
      </Button>
      
      <Button 
        variant="secondary" 
        size="sm"
        onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
        className="lg:hidden"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
        </svg>
        Filtros
      </Button>
      
      <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <button
          onClick={() => setViewMode('grid')}
          className={`px-3 py-2 text-sm transition-all duration-200 ${
            viewMode === 'grid' 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
          title="Visualização em grade"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`px-3 py-2 text-sm transition-all duration-200 ${
            viewMode === 'list' 
              ? 'bg-blue-500 text-white shadow-md' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
          title="Visualização em lista"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
      </div>
      
      <Link href="/tasks/create">
        <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Task
        </Button>
      </Link>
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
        {/* Enhanced Filters */}
        <Card className={`transition-all duration-300 ${isFilterCollapsed ? 'lg:block hidden' : 'block'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🔍</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Filtros Avançados
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Refine sua busca com precisão
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setFilters({
                      search: '',
                      status: '',
                      model: '',
                      dateRange: '',
                      sortBy: 'created_at',
                      sortOrder: 'desc'
                    });
                  }}
                  className="text-gray-500 hover:text-red-500"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Limpar
                </Button>
                
                <button
                  onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
                  className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className={`w-4 h-4 transform transition-transform ${isFilterCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </CardHeader>
          
          <CardBody className="space-y-6">
            {/* Search with enhanced styling */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Input
                placeholder="🔍 Buscar por nome, descrição, diretório ou grupo..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 text-sm border-2 focus:border-blue-500 transition-all duration-200"
                fullWidth
              />
              {filters.search && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            
            <Grid cols={1} colsMd={2} colsLg={3} colsXl={5} gap="md">
              <Select
                options={statusOptions}
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                placeholder="📋 Status"
                className="transition-all duration-200 focus-within:scale-105"
                fullWidth
              />
              
              <Select
                options={modelOptions}
                value={filters.model}
                onChange={(e) => handleFilterChange('model', e.target.value)}
                placeholder="🤖 Modelo"
                className="transition-all duration-200 focus-within:scale-105"
                fullWidth
              />
              
              <Select
                options={dateRangeOptions}
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                placeholder="📅 Período"
                className="transition-all duration-200 focus-within:scale-105"
                fullWidth
              />
              
              <Select
                options={sortOptions}
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                placeholder="🏷️ Ordenar por"
                className="transition-all duration-200 focus-within:scale-105"
                fullWidth
              />
              
              <Select
                options={[
                  { value: 'desc', label: '⬇️ Decrescente' },
                  { value: 'asc', label: '⬆️ Crescente' }
                ]}
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="transition-all duration-200 focus-within:scale-105"
                fullWidth
              />
            </Grid>
            
            {/* Filter summary */}
            {(filters.search || filters.status || filters.model || filters.dateRange) && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Filtros ativos:</span>
                {filters.search && (
                  <Badge variant="default" className="text-xs">
                    🔍 "{filters.search}"
                    <button 
                      onClick={() => handleFilterChange('search', '')}
                      className="ml-1 hover:text-red-500"
                    >×</button>
                  </Badge>
                )}
                {filters.status && (
                  <Badge variant={getStatusBadgeVariant(filters.status as Task['status'])} className="text-xs">
                    {statusOptions.find(s => s.value === filters.status)?.icon} {statusOptions.find(s => s.value === filters.status)?.label}
                    <button 
                      onClick={() => handleFilterChange('status', '')}
                      className="ml-1 hover:text-red-500"
                    >×</button>
                  </Badge>
                )}
                {filters.model && (
                  <Badge variant="default" className="text-xs">
                    {modelOptions.find(m => m.value === filters.model)?.icon} {modelOptions.find(m => m.value === filters.model)?.label}
                    <button 
                      onClick={() => handleFilterChange('model', '')}
                      className="ml-1 hover:text-red-500"
                    >×</button>
                  </Badge>
                )}
                {filters.dateRange && (
                  <Badge variant="default" className="text-xs">
                    {dateRangeOptions.find(d => d.value === filters.dateRange)?.icon} {dateRangeOptions.find(d => d.value === filters.dateRange)?.label}
                    <button 
                      onClick={() => handleFilterChange('dateRange', '')}
                      className="ml-1 hover:text-red-500"
                    >×</button>
                  </Badge>
                )}
              </div>
            )}
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
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={async () => {
                      if (confirm(`Tem certeza que deseja excluir ${selectedTasks.size} task(s)?`)) {
                        try {
                          let deletedCount = 0;
                          const selectedArray = Array.from(selectedTasks);
                          
                          // Deletar tasks uma por uma usando o identifier ou ID
                          for (const taskId of selectedArray) {
                            // Encontrar a task para pegar o identifier
                            const task = tasks.find(t => t.id === taskId);
                            if (task) {
                              // Tentar deletar usando identifier primeiro, senão usar ID
                              const identifierToUse = task.identifier || taskId;
                              const success = await McpApi.deleteTask(identifierToUse);
                              if (success) {
                                deletedCount++;
                              }
                            }
                          }
                          
                          alert(`${deletedCount} task(s) excluída(s) com sucesso!`);
                          setSelectedTasks(new Set()); // Limpar seleção
                          fetchTasks(); // Recarregar lista
                        } catch (err) {
                          console.error('Erro ao excluir tasks:', err);
                          alert('Erro ao excluir algumas tasks. Verifique o console para mais detalhes.');
                        }
                      }
                    }}
                  >
                    🗑️ Excluir Selecionadas
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTasks(new Set())}>
                    ❌ Limpar Seleção
                  </Button>
                </Stack>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Tasks List/Grid */}
        {error ? (
          <Card>
            <CardBody>
              <ErrorState
                title="Erro ao carregar tasks"
                message={error}
                action={{
                  label: "Tentar novamente",
                  onClick: fetchTasks
                }}
              />
            </CardBody>
          </Card>
        ) : loading ? (
          viewMode === 'grid' ? (
            <Grid cols={1} colsMd={2} colsLg={3} gap="lg">
              {[...Array(6)].map((_, i) => (
                <SkeletonTaskCard key={i} index={i} />
              ))}
            </Grid>
          ) : (
            <Card>
              <CardBody>
                <LoadingState 
                  message="Carregando tasks..."
                  size="lg"
                />
              </CardBody>
            </Card>
          )
        ) : filteredTasks.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                title="Nenhuma task encontrada"
                message="Não há tasks que correspondam aos filtros selecionados. Ajuste os filtros ou crie uma nova task."
                icon={
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                }
                action={{
                  label: "Nova Task",
                  onClick: () => window.location.href = '/tasks/create'
                }}
              />
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
              {filteredTasks.map((task, index) => (
                <TaskCard key={task.id} task={task} index={index} />
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