// Teste abrangente dos endpoints McpApi
// Arquivo: test_mcp_api_endpoints.js

const fetch = require('node-fetch');

// Configurações da API
const API_BASE_URL = 'http://127.0.0.1:8888/api/v1';

// Classes de teste para emular o serviço McpApi
class McpApiTester {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Método utilitário para fazer requisições HTTP
  async request(endpoint, options = {}) {
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
        };
      }

      // Verificar se a resposta tem conteúdo
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        // Para respostas sem JSON, retornar um objeto de sucesso genérico
        return { success: true };
      }
    } catch (error) {
      if (error instanceof TypeError) {
        // Erro de rede ou conectividade
        throw {
          message: 'Erro de conexão com a API Claude CTO. Verifique se o serviço está em execução em 127.0.0.1:8888',
          status: 0,
        };
      }
      throw error;
    }
  }

  // Teste do método getTasks()
  async getTasks() {
    try {
      const response = await this.request('/tasks', {
        method: 'GET',
      });

      if (Array.isArray(response)) {
        return response.map((task) => ({
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

  // Teste do método getSystemStats()
  async getSystemStats() {
    try {
      const response = await this.request('/stats', {
        method: 'GET',
      });
      
      // Converter resposta real da API para formato esperado pelo McpApi
      if (response.total_tasks_by_status && response.system_resources) {
        const stats = response.total_tasks_by_status;
        const resources = response.system_resources;
        
        return {
          total_tasks: Object.values(stats).reduce((a, b) => a + b, 0),
          running_tasks: stats.running || 0,
          completed_tasks: stats.completed || 0,
          failed_tasks: stats.failed || 0,
          average_execution_time: response.average_execution_time || 0,
          success_rate: response.success_rate || 0,
          memory_usage: resources.memory_mb || 0,
          cpu_usage: resources.cpu_percent || 0,
        };
      }
      
      return response;
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

  // Teste do método getActivities()
  async getActivities(limit = 50) {
    try {
      const response = await this.request(`/activities?limit=${limit}`, {
        method: 'GET',
      });
      
      // A API retorna um objeto com propriedade 'activities', não um array direto
      if (response.activities && Array.isArray(response.activities)) {
        return response.activities.map(activity => ({
          id: String(activity.id),
          type: activity.event_type || 'system_event',
          timestamp: activity.timestamp,
          task_id: activity.task_id ? String(activity.task_id) : undefined,
          task_identifier: activity.task_identifier || undefined,
          message: activity.message || 'Atividade sem descrição',
          metadata: activity.details || {}
        }));
      }
      
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
      return [];
    }
  }

  // Verificar se a API está disponível
  async healthCheck() {
    try {
      const response = await fetch('http://localhost:8888/health');
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Funções de validação
function validateTask(task) {
  const requiredFields = ['id', 'identifier', 'status', 'created_at', 'execution_prompt', 'model'];
  const validStatuses = ['pending', 'running', 'completed', 'failed'];
  const validModels = ['opus', 'sonnet', 'haiku'];
  
  const issues = [];
  
  // Verificar campos obrigatórios
  for (const field of requiredFields) {
    if (!task.hasOwnProperty(field)) {
      issues.push(`Campo obrigatório ausente: ${field}`);
    }
  }
  
  // Verificar tipos de dados
  if (typeof task.id !== 'string') {
    issues.push(`Campo 'id' deve ser string, recebido: ${typeof task.id}`);
  }
  
  if (typeof task.identifier !== 'string') {
    issues.push(`Campo 'identifier' deve ser string, recebido: ${typeof task.identifier}`);
  }
  
  if (!validStatuses.includes(task.status)) {
    issues.push(`Status inválido: ${task.status}. Válidos: ${validStatuses.join(', ')}`);
  }
  
  if (!validModels.includes(task.model)) {
    issues.push(`Model inválido: ${task.model}. Válidos: ${validModels.join(', ')}`);
  }
  
  // Validar formato de data
  if (task.created_at && isNaN(Date.parse(task.created_at))) {
    issues.push(`Campo 'created_at' tem formato de data inválido: ${task.created_at}`);
  }
  
  if (task.updated_at && isNaN(Date.parse(task.updated_at))) {
    issues.push(`Campo 'updated_at' tem formato de data inválido: ${task.updated_at}`);
  }
  
  return issues;
}

function validateSystemStats(stats) {
  const requiredFields = [
    'total_tasks', 'running_tasks', 'completed_tasks', 'failed_tasks',
    'average_execution_time', 'success_rate', 'memory_usage', 'cpu_usage'
  ];
  
  const issues = [];
  
  // Verificar campos obrigatórios
  for (const field of requiredFields) {
    if (!stats.hasOwnProperty(field)) {
      issues.push(`Campo obrigatório ausente: ${field}`);
    }
  }
  
  // Verificar tipos numéricos
  for (const field of requiredFields) {
    if (stats[field] !== undefined && typeof stats[field] !== 'number') {
      issues.push(`Campo '${field}' deve ser número, recebido: ${typeof stats[field]}`);
    }
  }
  
  // Validar ranges específicos
  if (stats.success_rate < 0 || stats.success_rate > 100) {
    issues.push(`Campo 'success_rate' deve estar entre 0 e 100, recebido: ${stats.success_rate}`);
  }
  
  if (stats.memory_usage < 0 || stats.cpu_usage < 0) {
    issues.push(`Campos de uso de recursos não podem ser negativos`);
  }
  
  return issues;
}

function validateActivity(activity) {
  const requiredFields = ['id', 'type', 'timestamp', 'message'];
  const validTypes = ['task_created', 'task_started', 'task_completed', 'task_failed', 'system_event'];
  
  const issues = [];
  
  // Verificar campos obrigatórios
  for (const field of requiredFields) {
    if (!activity.hasOwnProperty(field)) {
      issues.push(`Campo obrigatório ausente: ${field}`);
    }
  }
  
  // Verificar tipo de atividade
  if (!validTypes.includes(activity.type)) {
    issues.push(`Tipo de atividade inválido: ${activity.type}. Válidos: ${validTypes.join(', ')}`);
  }
  
  // Validar formato de timestamp
  if (activity.timestamp && isNaN(Date.parse(activity.timestamp))) {
    issues.push(`Campo 'timestamp' tem formato de data inválido: ${activity.timestamp}`);
  }
  
  return issues;
}

// Função principal de teste
async function runTests() {
  console.log('='.repeat(80));
  console.log('INICIANDO TESTES ABRANGENTES DOS ENDPOINTS McpApi');
  console.log('='.repeat(80));
  
  const tester = new McpApiTester();
  const results = {
    getTasks: { status: 'Falha', details: '', problems: [] },
    getSystemStats: { status: 'Falha', details: '', problems: [] },
    getActivities: { status: 'Falha', details: '', problems: [] }
  };

  // Primeiro verificar se a API está disponível
  console.log('\n1. VERIFICANDO CONECTIVIDADE...');
  const isHealthy = await tester.healthCheck();
  if (!isHealthy) {
    console.log('❌ API não está disponível em localhost:8888');
    console.log('   Certifique-se de que o serviço Claude CTO está em execução.');
    
    // Marcar todos os testes como falha por conectividade
    for (const test in results) {
      results[test].problems.push('Serviço não está em execução em localhost:8888');
      results[test].details = 'Impossível conectar com a API';
    }
  } else {
    console.log('✅ API está disponível e respondendo');
  }

  // Teste 1: getTasks()
  console.log('\n' + '='.repeat(50));
  console.log('2. TESTANDO MÉTODO getTasks()');
  console.log('='.repeat(50));
  
  try {
    const startTime = Date.now();
    const tasks = await tester.getTasks();
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`✅ Endpoint respondeu em ${responseTime}ms`);
    console.log(`📊 Retornadas ${tasks.length} tasks`);
    
    // Validar estrutura dos dados
    let validationIssues = [];
    let validTasks = 0;
    
    if (Array.isArray(tasks)) {
      console.log('✅ Resposta é um array válido');
      
      tasks.forEach((task, index) => {
        const issues = validateTask(task);
        if (issues.length === 0) {
          validTasks++;
        } else {
          validationIssues.push(`Task ${index}: ${issues.join(', ')}`);
        }
      });
      
      console.log(`✅ ${validTasks}/${tasks.length} tasks são válidas`);
      
      if (validationIssues.length > 0) {
        console.log('⚠️  Problemas de validação encontrados:');
        validationIssues.forEach(issue => console.log(`   - ${issue}`));
      }
      
      // Testar diferentes cenários
      console.log('\n📋 Análise dos dados:');
      const statusCounts = {};
      const modelCounts = {};
      
      tasks.forEach(task => {
        statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
        modelCounts[task.model] = (modelCounts[task.model] || 0) + 1;
      });
      
      console.log('   Status distribution:', statusCounts);
      console.log('   Model distribution:', modelCounts);
      
      results.getTasks.status = validationIssues.length === 0 ? 'Sucesso' : 'Sucesso Parcial';
      results.getTasks.details = `Retornadas ${tasks.length} tasks em ${responseTime}ms. ${validTasks} válidas.`;
      results.getTasks.problems = validationIssues;
      
    } else {
      console.log('❌ Resposta não é um array');
      results.getTasks.problems.push('Resposta não é um array');
      results.getTasks.details = 'Estrutura de resposta inválida';
    }
    
  } catch (error) {
    console.log('❌ Erro ao executar getTasks():');
    console.log(`   ${error.message}`);
    results.getTasks.problems.push(error.message);
    results.getTasks.details = 'Falha na execução do método';
  }

  // Teste 2: getSystemStats()
  console.log('\n' + '='.repeat(50));
  console.log('3. TESTANDO MÉTODO getSystemStats()');
  console.log('='.repeat(50));
  
  try {
    const startTime = Date.now();
    const stats = await tester.getSystemStats();
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`✅ Endpoint respondeu em ${responseTime}ms`);
    console.log('📊 Estatísticas recebidas:', JSON.stringify(stats, null, 2));
    
    // Validar estrutura dos dados
    const validationIssues = validateSystemStats(stats);
    
    if (validationIssues.length === 0) {
      console.log('✅ Estrutura das estatísticas é válida');
      
      // Análise adicional dos dados
      console.log('\n📈 Análise das estatísticas:');
      console.log(`   - Total de tasks: ${stats.total_tasks}`);
      console.log(`   - Tasks em execução: ${stats.running_tasks}`);
      console.log(`   - Taxa de sucesso: ${stats.success_rate.toFixed(2)}%`);
      console.log(`   - Tempo médio de execução: ${stats.average_execution_time.toFixed(2)}s`);
      console.log(`   - Uso de memória: ${stats.memory_usage.toFixed(2)}MB`);
      console.log(`   - Uso de CPU: ${stats.cpu_usage.toFixed(2)}%`);
      
      // Verificar consistência dos dados
      const consistencyIssues = [];
      if (stats.running_tasks > stats.total_tasks) {
        consistencyIssues.push('Running tasks > Total tasks (inconsistente)');
      }
      if (stats.completed_tasks + stats.failed_tasks > stats.total_tasks) {
        consistencyIssues.push('Completed + Failed > Total tasks (inconsistente)');
      }
      
      if (consistencyIssues.length > 0) {
        console.log('⚠️  Problemas de consistência encontrados:');
        consistencyIssues.forEach(issue => console.log(`   - ${issue}`));
        results.getSystemStats.problems.push(...consistencyIssues);
      }
      
      results.getSystemStats.status = consistencyIssues.length === 0 ? 'Sucesso' : 'Sucesso Parcial';
      results.getSystemStats.details = `Estatísticas obtidas em ${responseTime}ms. Dados${consistencyIssues.length === 0 ? '' : ' parcialmente'} consistentes.`;
      
    } else {
      console.log('❌ Problemas de validação encontrados:');
      validationIssues.forEach(issue => console.log(`   - ${issue}`));
      results.getSystemStats.problems = validationIssues;
      results.getSystemStats.details = 'Estrutura de dados inválida';
    }
    
  } catch (error) {
    console.log('❌ Erro ao executar getSystemStats():');
    console.log(`   ${error.message}`);
    results.getSystemStats.problems.push(error.message);
    results.getSystemStats.details = 'Falha na execução do método';
  }

  // Teste 3: getActivities()
  console.log('\n' + '='.repeat(50));
  console.log('4. TESTANDO MÉTODO getActivities()');
  console.log('='.repeat(50));
  
  // Testar com diferentes limites
  const limits = [10, 50, 100];
  
  for (const limit of limits) {
    console.log(`\n🔍 Testando com limit=${limit}`);
    
    try {
      const startTime = Date.now();
      const activities = await tester.getActivities(limit);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`   ✅ Endpoint respondeu em ${responseTime}ms`);
      console.log(`   📊 Retornadas ${activities.length} atividades`);
      
      // Validar estrutura dos dados
      let validationIssues = [];
      let validActivities = 0;
      
      if (Array.isArray(activities)) {
        console.log('   ✅ Resposta é um array válido');
        
        activities.forEach((activity, index) => {
          const issues = validateActivity(activity);
          if (issues.length === 0) {
            validActivities++;
          } else {
            validationIssues.push(`Activity ${index}: ${issues.join(', ')}`);
          }
        });
        
        console.log(`   ✅ ${validActivities}/${activities.length} atividades são válidas`);
        
        if (validationIssues.length > 0 && limit === 50) { // Só mostrar detalhes para o limite padrão
          console.log('   ⚠️  Problemas de validação encontrados:');
          validationIssues.slice(0, 5).forEach(issue => console.log(`      - ${issue}`));
          if (validationIssues.length > 5) {
            console.log(`      ... e mais ${validationIssues.length - 5} problemas`);
          }
        }
        
        // Análise dos dados para o limite padrão
        if (limit === 50) {
          console.log('\n   📋 Análise das atividades:');
          const typeCounts = {};
          const recentActivities = activities.slice(0, 5);
          
          activities.forEach(activity => {
            typeCounts[activity.type] = (typeCounts[activity.type] || 0) + 1;
          });
          
          console.log('      Distribuição por tipo:', typeCounts);
          console.log('      Atividades mais recentes:');
          recentActivities.forEach((activity, i) => {
            console.log(`         ${i+1}. [${activity.type}] ${activity.message} (${activity.timestamp})`);
          });
          
          results.getActivities.status = validationIssues.length === 0 ? 'Sucesso' : 'Sucesso Parcial';
          results.getActivities.details = `Retornadas ${activities.length} atividades em ${responseTime}ms. ${validActivities} válidas.`;
          results.getActivities.problems = validationIssues.slice(0, 10); // Limitar para não sobrecarregar o relatório
        }
        
        // Verificar se o limite está sendo respeitado
        if (activities.length > limit) {
          const issue = `Limite não respeitado: solicitado ${limit}, retornado ${activities.length}`;
          console.log(`   ⚠️  ${issue}`);
          if (limit === 50) results.getActivities.problems.push(issue);
        }
        
      } else {
        console.log('   ❌ Resposta não é um array');
        if (limit === 50) {
          results.getActivities.problems.push('Resposta não é um array');
          results.getActivities.details = 'Estrutura de resposta inválida';
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Erro ao executar getActivities(${limit}):`);
      console.log(`      ${error.message}`);
      if (limit === 50) { // Só registrar erro para o limite padrão
        results.getActivities.problems.push(error.message);
        results.getActivities.details = 'Falha na execução do método';
      }
    }
  }

  // Gerar relatório final
  console.log('\n' + '='.repeat(80));
  console.log('RELATÓRIO FINAL DOS TESTES');
  console.log('='.repeat(80));
  
  console.log('\nRelatório de Testes dos Endpoints McpApi\n');
  
  console.log('1. Método getTasks()');
  console.log(`   - Status do Teste: ${results.getTasks.status}`);
  console.log(`   - Detalhes: ${results.getTasks.details}`);
  console.log(`   - Problemas Encontrados: ${results.getTasks.problems.length === 0 ? 'Nenhum' : results.getTasks.problems.join('; ')}`);
  
  console.log('\n2. Método getSystemStats()');
  console.log(`   - Status do Teste: ${results.getSystemStats.status}`);
  console.log(`   - Detalhes: ${results.getSystemStats.details}`);
  console.log(`   - Problemas Encontrados: ${results.getSystemStats.problems.length === 0 ? 'Nenhum' : results.getSystemStats.problems.join('; ')}`);
  
  console.log('\n3. Método getActivities()');
  console.log(`   - Status do Teste: ${results.getActivities.status}`);
  console.log(`   - Detalhes: ${results.getActivities.details}`);
  console.log(`   - Problemas Encontrados: ${results.getActivities.problems.length === 0 ? 'Nenhum' : results.getActivities.problems.join('; ')}`);
  
  console.log('\nRecomendações Gerais:');
  const recommendations = [];
  
  // Gerar recomendações baseadas nos resultados
  if (results.getTasks.status === 'Falha' || results.getSystemStats.status === 'Falha' || results.getActivities.status === 'Falha') {
    recommendations.push('Verificar se o serviço Claude CTO está rodando na porta 8888');
    recommendations.push('Confirmar se todos os endpoints da API estão implementados corretamente');
  }
  
  if (results.getTasks.problems.some(p => p.includes('formato'))) {
    recommendations.push('Revisar a validação de tipos de dados no endpoint /tasks');
  }
  
  if (results.getSystemStats.problems.some(p => p.includes('inconsistente'))) {
    recommendations.push('Verificar a lógica de cálculo das estatísticas do sistema');
  }
  
  if (results.getActivities.problems.some(p => p.includes('Limite não respeitado'))) {
    recommendations.push('Implementar paginação adequada no endpoint /activities');
  }
  
  // Recomendações gerais de melhoria
  recommendations.push('Adicionar logs de auditoria para todas as operações da API');
  recommendations.push('Implementar rate limiting para evitar sobrecarga');
  recommendations.push('Adicionar validação de entrada mais rigorosa');
  recommendations.push('Implementar cache para endpoints de consulta frequente');
  recommendations.push('Adicionar métricas de performance e monitoramento');
  
  recommendations.forEach((rec, i) => {
    console.log(`   ${i + 1}. ${rec}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('TESTES CONCLUÍDOS');
  console.log('='.repeat(80));
  
  // Resumo final
  const successCount = [results.getTasks, results.getSystemStats, results.getActivities]
    .filter(r => r.status === 'Sucesso').length;
  
  console.log(`\n📊 Resumo: ${successCount}/3 testes bem-sucedidos`);
  
  if (successCount === 3) {
    console.log('🎉 Todos os endpoints estão funcionando corretamente!');
  } else if (successCount > 0) {
    console.log('⚠️  Alguns endpoints precisam de atenção.');
  } else {
    console.log('❌ Todos os endpoints falharam. Verifique a conectividade e configuração da API.');
  }
}

// Executar os testes
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Erro fatal durante a execução dos testes:', error);
    process.exit(1);
  });
}

module.exports = { McpApiTester, validateTask, validateSystemStats, validateActivity };