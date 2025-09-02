// Serviço para comunicação com a API do Claude CTO
// Base URL da API MCP Claude CTO
const API_BASE_URL = 'http://localhost:8888/api/v1';

// Interfaces para os tipos de dados
export interface Task {
  id: string;
  identifier: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  execution_prompt: string;
  model: 'opus' | 'sonnet' | 'haiku';
  working_directory: string;
  orchestration_group?: string;
  execution_time?: number;
}

export interface TaskStats {
  total: number;
  completed: number;
  failed: number;
  toBeCleared: number;
}

export interface ClearTasksResponse {
  success: boolean;
  cleared: number;
  message: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface SystemStats {
  total_tasks: number;
  running_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  average_execution_time: number;
  success_rate: number;
  memory_usage: number;
  cpu_usage: number;
}

export interface Activity {
  id: string;
  type: 'task_created' | 'task_started' | 'task_completed' | 'task_failed' | 'system_event';
  timestamp: string;
  task_id?: string;
  task_identifier?: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  email?: boolean;
  events: {
    task_completed: boolean;
    task_failed: boolean;
    system_alerts: boolean;
  };
}

export interface OrchestrationTask {
  task_id: number;
  identifier: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  depends_on: string[];
  initial_delay?: number;
  started_at?: string;
  ended_at?: string;
  error_message?: string;
}

export interface Orchestration {
  orchestration_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  started_at?: string;
  ended_at?: string;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  skipped_tasks: number;
  tasks?: OrchestrationTask[];
}

export interface CreateOrchestrationRequest {
  tasks: {
    task_identifier: string;
    execution_prompt: string;
    working_directory?: string;
    model?: 'opus' | 'sonnet' | 'haiku';
    depends_on?: string[];
    wait_after_dependencies?: number;
  }[];
}

// Classe para gerenciar chamadas à API MCP Claude CTO
class McpApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Método utilitário para fazer requisições HTTP
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw {
          message: `Erro na API: ${response.status} - ${errorText || response.statusText}`,
          status: response.status,
        } as ApiError;
      }

      // Verificar se a resposta tem conteúdo
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        // Para respostas sem JSON, retornar um objeto de sucesso genérico
        return { success: true } as T;
      }
    } catch (error) {
      if (error instanceof TypeError) {
        // Erro de rede ou conectividade
        throw {
          message: 'Erro de conexão com a API Claude CTO. Verifique se o serviço está em execução em localhost:8888',
          status: 0,
        } as ApiError;
      }
      throw error;
    }
  }

  // Listar todas as tasks
  async getTasks(): Promise<Task[]> {
    try {
      // Usar o endpoint REST correto para listar tasks
      const response = await this.request<Task[]>('/tasks', {
        method: 'GET',
      });

      // A resposta já vem no formato correto
      if (Array.isArray(response)) {
        return response.map((task: any) => ({
          id: String(task.id),
          identifier: `task_${task.id}`, // Sempre usar ID como identifier já que vem null da API
          status: task.status,
          created_at: task.created_at || new Date().toISOString(),
          updated_at: task.ended_at || task.started_at || task.created_at || new Date().toISOString(),
          execution_prompt: task.last_action_cache || task.final_summary || 'Task sem descrição',
          model: task.model || 'opus',
          working_directory: task.working_directory || '.',
          orchestration_group: task.orchestration_id || undefined,
          execution_time: task.ended_at && task.started_at 
            ? new Date(task.ended_at).getTime() - new Date(task.started_at).getTime()
            : undefined,
        }));
      }

      return [];
    } catch (error) {
      console.error('Erro ao buscar tasks:', error);
      throw error;
    }
  }

  // Calcular estatísticas das tasks
  async getTaskStats(): Promise<TaskStats> {
    const tasks = await this.getTasks();
    
    const completed = tasks.filter(t => t.status === 'completed').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    const toBeCleared = completed + failed;

    return {
      total: tasks.length,
      completed,
      failed,
      toBeCleared,
    };
  }

  // Limpar tasks concluídas e com falha
  async clearTasks(): Promise<ClearTasksResponse> {
    try {
      const response = await this.request<any>('/tasks/clear', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const cleared = response.cleared || response.tasks_deleted || 0;
      return {
        success: true,
        cleared,
        message: `${cleared} tasks foram removidas com sucesso do sistema`,
      };
    } catch (error) {
      console.error('Erro ao limpar tasks:', error);
      throw {
        success: false,
        cleared: 0,
        message: error instanceof Error ? error.message : 'Erro desconhecido ao limpar tasks',
      };
    }
  }

  // Deletar uma task específica
  async deleteTask(taskIdentifier: string): Promise<boolean> {
    try {
      // Se parecer ser um ID numérico, tentar deletar diretamente via API REST
      if (/^\d+$/.test(taskIdentifier) || taskIdentifier.startsWith('task_')) {
        // Extrair o ID numérico
        const taskId = taskIdentifier.replace('task_', '');
        
        try {
          // Tentar primeiro via endpoint REST direto
          await this.request<any>(`/tasks/${taskId}`, {
            method: 'DELETE',
          });
          return true;
        } catch (restError) {
          console.warn('Falha no DELETE REST, tentando MCP:', restError);
        }
      }
      
      // Tentar via MCP como fallback ou para identifiers personalizados
      const response = await this.request<any>('/mcp/tools/delete_task', {
        method: 'POST',
        body: JSON.stringify({
          tool: 'mcp__claude-cto__delete_task',
          arguments: {
            task_identifier: taskIdentifier
          }
        }),
      });
      
      // Verificar se teve sucesso
      if (response.result && response.result.success !== false) {
        return true;
      }
      
      console.warn('Task não pôde ser deletada:', response);
      return false;
    } catch (error) {
      console.error('Erro ao deletar task:', error);
      return false;
    }
  }

  // Obter status de uma task específica
  async getTaskStatus(taskIdentifier: string): Promise<Task | null> {
    try {
      const response = await this.request<any>('/mcp/tools/get_task_status', {
        method: 'POST',
        body: JSON.stringify({
          tool: 'mcp__claude-cto__get_task_status',
          arguments: {
            task_identifier: taskIdentifier
          }
        }),
      });

      if (response.result) {
        const task = response.result;
        return {
          id: task.id || task.identifier,
          identifier: task.identifier,
          status: task.status,
          created_at: task.created_at || new Date().toISOString(),
          updated_at: task.updated_at || new Date().toISOString(),
          execution_prompt: task.execution_prompt || 'Task sem descrição',
          model: task.model || 'opus',
          working_directory: task.working_directory || '.',
          orchestration_group: task.orchestration_group,
          execution_time: task.execution_time,
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar status da task:', error);
      return null;
    }
  }

  // Criar nova task
  async createTask(
    taskIdentifier: string,
    executionPrompt: string,
    workingDirectory: string = '.',
    model: 'opus' | 'sonnet' | 'haiku' = 'opus',
    orchestrationGroup?: string
  ): Promise<Task | null> {
    try {
      const response = await this.request<any>('/mcp/tools/create_task', {
        method: 'POST',
        body: JSON.stringify({
          tool: 'mcp__claude-cto__create_task',
          arguments: {
            task_identifier: taskIdentifier,
            execution_prompt: executionPrompt,
            working_directory: workingDirectory,
            model,
            orchestration_group: orchestrationGroup,
          }
        }),
      });

      if (response.result) {
        const task = response.result;
        return {
          id: task.id || task.identifier,
          identifier: task.identifier,
          status: task.status || 'pending',
          created_at: task.created_at || new Date().toISOString(),
          updated_at: task.updated_at || new Date().toISOString(),
          execution_prompt: executionPrompt,
          model,
          working_directory: workingDirectory,
          orchestration_group: orchestrationGroup,
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao criar task:', error);
      throw error;
    }
  }

  // Verificar se a API está disponível
  async healthCheck(): Promise<boolean> {
    try {
      // O endpoint de health está na raiz, não em /api/v1
      const response = await fetch('http://localhost:8888/health');
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Obter estatísticas do sistema
  async getSystemStats(): Promise<SystemStats> {
    try {
      const response = await this.request<any>('/stats', {
        method: 'GET',
      });
      
      // Mapear a resposta real da API para o formato esperado
      return {
        total_tasks: response.total_tasks_by_status?.completed || 0 + 
                    response.total_tasks_by_status?.running || 0 +
                    response.total_tasks_by_status?.pending || 0 +
                    response.total_tasks_by_status?.failed || 0,
        running_tasks: response.total_tasks_by_status?.running || 0,
        completed_tasks: response.total_tasks_by_status?.completed || 0,
        failed_tasks: response.total_tasks_by_status?.failed || 0,
        average_execution_time: response.average_execution_time || 0,
        success_rate: response.success_rate || 0,
        memory_usage: response.system_resources?.memory_mb || 0,
        cpu_usage: response.system_resources?.cpu_percent || 0,
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      // Retornar valores padrão em caso de erro
      return {
        total_tasks: 0,
        running_tasks: 0,
        completed_tasks: 0,
        failed_tasks: 0,
        average_execution_time: 0,
        success_rate: 0,
        memory_usage: 0,
        cpu_usage: 0,
      };
    }
  }

  // Obter atividades recentes (criadas a partir das tasks)
  async getActivities(limit: number = 50): Promise<Activity[]> {
    try {
      // Como não há endpoint de activities, vamos criar atividades baseadas nas tasks
      const tasks = await this.getTasks();
      
      // Converter tasks em atividades
      const activities: Activity[] = [];
      
      tasks.slice(0, limit).forEach(task => {
        // Adicionar atividade de criação
        if (task.created_at) {
          activities.push({
            id: `${task.id}-created`,
            type: 'task_created',
            timestamp: task.created_at,
            task_id: task.id,
            task_identifier: task.identifier,
            message: `Task ${task.identifier} criada`,
            metadata: {}
          });
        }
        
        // Adicionar atividade baseada no status
        if (task.status === 'completed' && task.updated_at) {
          activities.push({
            id: `${task.id}-completed`,
            type: 'task_completed',
            timestamp: task.updated_at,
            task_id: task.id,
            task_identifier: task.identifier,
            message: `Task ${task.identifier} concluída com sucesso`,
            metadata: {}
          });
        } else if (task.status === 'failed' && task.updated_at) {
          activities.push({
            id: `${task.id}-failed`,
            type: 'task_failed',
            timestamp: task.updated_at,
            task_id: task.id,
            task_identifier: task.identifier,
            message: `Task ${task.identifier} falhou`,
            metadata: {}
          });
        } else if (task.status === 'running') {
          activities.push({
            id: `${task.id}-started`,
            type: 'task_started',
            timestamp: task.updated_at || task.created_at,
            task_id: task.id,
            task_identifier: task.identifier,
            message: `Task ${task.identifier} está em execução`,
            metadata: {}
          });
        }
      });
      
      // Ordenar por timestamp decrescente
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return activities.slice(0, limit);
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
      return [];
    }
  }

  // Obter configurações de notificação
  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const response = await this.request<NotificationSettings>('/notifications/settings', {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Erro ao buscar configurações de notificação:', error);
      // Retornar configurações padrão
      return {
        enabled: true,
        sound: false,
        desktop: true,
        email: false,
        events: {
          task_completed: true,
          task_failed: true,
          system_alerts: true,
        },
      };
    }
  }

  // Atualizar configurações de notificação
  async updateNotificationSettings(settings: NotificationSettings): Promise<boolean> {
    try {
      await this.request('/notifications/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar configurações de notificação:', error);
      return false;
    }
  }

  // Testar conexão WebSocket
  async testWebSocketConnection(): Promise<boolean> {
    try {
      const response = await this.request<{ connected: boolean }>('/ws/status', {
        method: 'GET',
      });
      return response.connected || false;
    } catch (error) {
      console.error('Erro ao testar WebSocket:', error);
      return false;
    }
  }

  // MÉTODOS PARA ORQUESTRAÇÕES

  // Listar todas as orquestrações
  async getOrchestrations(): Promise<Orchestration[]> {
    try {
      const response = await this.request<Orchestration[]>('/orchestrations', {
        method: 'GET',
      });
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Erro ao buscar orquestrações:', error);
      return [];
    }
  }

  // Obter uma orquestração específica por ID
  async getOrchestration(id: number): Promise<Orchestration | null> {
    try {
      const response = await this.request<Orchestration>(`/orchestrations/${id}`, {
        method: 'GET',
      });
      return response || null;
    } catch (error) {
      console.error('Erro ao buscar orquestração:', error);
      return null;
    }
  }

  // Criar nova orquestração
  async createOrchestration(request: CreateOrchestrationRequest): Promise<Orchestration | null> {
    try {
      const response = await this.request<Orchestration>('/orchestrations', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      return response || null;
    } catch (error) {
      console.error('Erro ao criar orquestração:', error);
      throw error;
    }
  }

  // Cancelar uma orquestração
  async cancelOrchestration(id: number): Promise<boolean> {
    try {
      await this.request(`/orchestrations/${id}/cancel`, {
        method: 'POST',
      });
      return true;
    } catch (error) {
      console.error('Erro ao cancelar orquestração:', error);
      return false;
    }
  }

  // Deletar uma orquestração
  async deleteOrchestration(id: number): Promise<boolean> {
    try {
      await this.request(`/orchestrations/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Erro ao deletar orquestração:', error);
      return false;
    }
  }

  // Obter estatísticas das orquestrações
  async getOrchestrationStats(): Promise<{
    total: number;
    running: number;
    completed: number;
    failed: number;
  }> {
    try {
      const orchestrations = await this.getOrchestrations();
      return {
        total: orchestrations.length,
        running: orchestrations.filter(o => o.status === 'running').length,
        completed: orchestrations.filter(o => o.status === 'completed').length,
        failed: orchestrations.filter(o => o.status === 'failed').length,
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas de orquestrações:', error);
      return { total: 0, running: 0, completed: 0, failed: 0 };
    }
  }
}

// Instância singleton do serviço
export const McpApi = new McpApiService();

// Exportar a classe para casos onde seja necessário criar instâncias customizadas
export default McpApiService;