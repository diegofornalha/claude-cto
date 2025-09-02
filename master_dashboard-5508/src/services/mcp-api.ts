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
          identifier: task.identifier || `task_${task.id}`,
          status: task.status,
          created_at: task.created_at || new Date().toISOString(),
          updated_at: task.updated_at || task.created_at || new Date().toISOString(),
          execution_prompt: task.execution_prompt || 'Task sem descrição',
          model: task.model || 'opus',
          working_directory: task.working_directory || '.',
          orchestration_group: task.orchestration_group,
          execution_time: task.execution_time,
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
      await this.request<any>(`/tasks/${taskIdentifier}`, {
        method: 'DELETE',
      });
      return true;
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
      await this.request('/health');
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Instância singleton do serviço
export const McpApi = new McpApiService();

// Exportar a classe para casos onde seja necessário criar instâncias customizadas
export default McpApiService;