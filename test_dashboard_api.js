#!/usr/bin/env node

/**
 * Teste de Conectividade Dashboard <-> API CTO
 * Simula exatamente as chamadas que o dashboard faz
 */

const http = require('http');

function makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: 8888,
            path: `/api/v1${path}`,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ 
                        status: res.statusCode, 
                        data: json,
                        headers: res.headers 
                    });
                } catch (e) {
                    resolve({ 
                        status: res.statusCode, 
                        data: data,
                        headers: res.headers 
                    });
                }
            });
        });

        req.on('error', (err) => reject(err));
        
        if (body) {
            req.write(JSON.stringify(body));
        }
        
        req.end();
    });
}

async function testDashboardAPI() {
    console.log('🧪 TESTE DE CONECTIVIDADE DASHBOARD -> API CTO');
    console.log('================================================\n');
    
    // 1. Health Check
    console.log('1. 🏥 Health Check');
    try {
        const health = await makeRequest('/../health');
        if (health.status === 200) {
            console.log('   ✅ API está online\n');
        } else {
            console.log(`   ❌ API retornou status ${health.status}\n`);
            return;
        }
    } catch (error) {
        console.log(`   ❌ Erro de conectividade: ${error.message}\n`);
        return;
    }

    // 2. Teste do endpoint /tasks (usado pelo dashboard)
    console.log('2. 📋 Listagem de Tasks (GET /api/v1/tasks)');
    try {
        const tasks = await makeRequest('/tasks');
        
        console.log(`   Status: ${tasks.status}`);
        
        if (tasks.status === 200 && Array.isArray(tasks.data)) {
            const taskCount = tasks.data.length;
            console.log(`   ✅ Sucesso! ${taskCount} tarefas encontradas`);
            
            // Estatísticas por status
            const stats = tasks.data.reduce((acc, task) => {
                acc[task.status] = (acc[task.status] || 0) + 1;
                return acc;
            }, {});
            
            console.log('   📊 Distribuição por status:');
            Object.entries(stats).forEach(([status, count]) => {
                console.log(`      ${status}: ${count}`);
            });
            
            console.log('\n   🔍 Primeiras 3 tarefas:');
            tasks.data.slice(0, 3).forEach(task => {
                console.log(`      ID: ${task.id} | Status: ${task.status} | Criada: ${task.created_at?.substring(0, 19) || 'N/A'}`);
            });
            
        } else {
            console.log(`   ❌ Erro: Status ${tasks.status}`);
            console.log(`   Resposta: ${JSON.stringify(tasks.data, null, 2)}`);
        }
    } catch (error) {
        console.log(`   ❌ Erro na requisição: ${error.message}`);
    }

    console.log('\n================================================');
    console.log('💡 DIAGNÓSTICO:');
    
    if (tasks.status === 200 && Array.isArray(tasks.data)) {
        const realCount = tasks.data.length;
        if (realCount === 8) {
            console.log('✅ A API está retornando a contagem correta (8 tarefas)');
            console.log('❓ Se o dashboard mostra 42, pode ser:');
            console.log('   • Cache do browser (tente Ctrl+Shift+R)');
            console.log('   • Estado local do React não atualizado');
            console.log('   • Problema no código de contagem do frontend');
        } else {
            console.log(`⚠️  A API está retornando ${realCount} tarefas (esperado: 8)`);
        }
    } else {
        console.log('❌ A API não está funcionando corretamente');
        console.log('   Verifique se o servidor CTO está rodando na porta 8888');
    }
    
    console.log('\n🔧 PRÓXIMOS PASSOS RECOMENDADOS:');
    console.log('1. Abrir o dashboard no browser');
    console.log('2. Abrir DevTools (F12)');
    console.log('3. Ir para a aba Network');
    console.log('4. Recarregar a página com Ctrl+Shift+R');
    console.log('5. Verificar se há chamadas para /api/v1/tasks');
    console.log('6. Ver o que está sendo retornado');
}

// Executar o teste
testDashboardAPI().catch(console.error);