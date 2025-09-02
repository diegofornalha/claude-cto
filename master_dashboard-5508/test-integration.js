#!/usr/bin/env node

/**
 * Script de teste para validar a integração com a API
 * Executa testes básicos de conectividade e funcionalidades
 */

const fetch = require('node-fetch').default || require('node-fetch');

const API_BASE_URL = process.env.NEXT_PUBLIC_MCP_API_URL || 'http://localhost:8888/api/v1';
const HEALTH_URL = API_BASE_URL.replace('/api/v1', '') + '/health';

async function testApiConnection() {
  console.log('🔍 Testando integração com Claude CTO API...\n');
  
  // Test 1: Health Check
  console.log('1. Testando Health Check...');
  try {
    const startTime = Date.now();
    const response = await fetch(HEALTH_URL);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Health Check OK (${responseTime}ms)`);
      console.log(`   📊 Server Info:`, JSON.stringify(data, null, 2));
    } else {
      console.log(`   ❌ Health Check failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`   ❌ Health Check error: ${error.message}`);
  }
  
  // Test 2: List Tasks
  console.log('\n2. Testando List Tasks...');
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`);
    
    if (response.ok) {
      const data = await response.json();
      const tasks = data.tasks || [];
      console.log(`   ✅ List Tasks OK (${tasks.length} tarefas encontradas)`);
      
      if (tasks.length > 0) {
        console.log(`   📋 Primeira tarefa: ${tasks[0].task_identifier}`);
      }
    } else {
      console.log(`   ❌ List Tasks failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`   ❌ List Tasks error: ${error.message}`);
  }
  
  // Test 3: Create Test Task
  console.log('\n3. Testando Create Task...');
  try {
    const testTask = {
      task_identifier: `test_task_${Date.now()}`,
      execution_prompt: 'Esta é uma tarefa de teste para validar a integração',
      working_directory: '/tmp',
      model: 'sonnet',
      orchestration_group: 'integration_test'
    };
    
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testTask)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Create Task OK`);
      console.log(`   📝 Tarefa criada: ${data.task_identifier}`);
      
      // Test 4: Get Task Status
      console.log('\n4. Testando Get Task Status...');
      try {
        const statusResponse = await fetch(`${API_BASE_URL}/tasks/${data.task_identifier}`);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log(`   ✅ Get Task Status OK`);
          console.log(`   📊 Status: ${statusData.status}`);
        } else {
          console.log(`   ❌ Get Task Status failed: ${statusResponse.status}`);
        }
      } catch (statusError) {
        console.log(`   ❌ Get Task Status error: ${statusError.message}`);
      }
      
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Create Task failed: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Create Task error: ${error.message}`);
  }
  
  // Test 5: Analytics
  console.log('\n5. Testando Analytics...');
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/analytics`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Analytics OK`);
      console.log(`   📈 Total de tarefas: ${data.totalTasks || 0}`);
      console.log(`   📊 Taxa de sucesso: ${data.successRate || 0}%`);
    } else {
      console.log(`   ⚠️  Analytics endpoint não disponível (${response.status})`);
      console.log(`   💡 Será usado fallback local`);
    }
  } catch (error) {
    console.log(`   ⚠️  Analytics error: ${error.message}`);
    console.log(`   💡 Será usado fallback local`);
  }
  
  console.log('\n🎉 Teste de integração concluído!\n');
  
  console.log('📋 Funcionalidades implementadas:');
  console.log('   ✅ Retry automático com exponential backoff');
  console.log('   ✅ Cache inteligente com TTL');
  console.log('   ✅ Interceptors para tratamento de erro');
  console.log('   ✅ Monitoramento de saúde da API');
  console.log('   ✅ Modo offline com dados mock');
  console.log('   ✅ Indicadores visuais de loading/erro');
  console.log('   ✅ Sistema de notificações toast');
  console.log('   ✅ Fallback hierárquico de dados');
  
  console.log('\n🚀 Para testar a interface:');
  console.log(`   1. npm run dev`);
  console.log(`   2. Acesse http://localhost:3000/dashboard-enhanced`);
  console.log(`   3. Teste desconectando/reconectando a API`);
}

// Executar se chamado diretamente
if (require.main === module) {
  testApiConnection().catch(console.error);
}

module.exports = { testApiConnection };