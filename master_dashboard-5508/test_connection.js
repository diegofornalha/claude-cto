const fetch = require('node-fetch');

async function testConnection() {
    console.log('Testando conexão direta...');
    
    try {
        console.log('1. Testando health endpoint...');
        const healthResponse = await fetch('http://127.0.0.1:8889/health');
        console.log(`   Status: ${healthResponse.status}`);
        const healthData = await healthResponse.text();
        console.log(`   Resposta: ${healthData}`);
        
        console.log('\n2. Testando tasks endpoint...');
        const tasksResponse = await fetch('http://127.0.0.1:8889/api/v1/tasks');
        console.log(`   Status: ${tasksResponse.status}`);
        const tasksData = await tasksResponse.text();
        console.log(`   Resposta (primeiros 200 chars): ${tasksData.substring(0, 200)}...`);
        
        console.log('\n3. Testando stats endpoint...');
        const statsResponse = await fetch('http://127.0.0.1:8889/api/v1/stats');
        console.log(`   Status: ${statsResponse.status}`);
        const statsData = await statsResponse.text();
        console.log(`   Resposta: ${statsData}`);
        
        console.log('\n4. Testando activities endpoint...');
        const activitiesResponse = await fetch('http://127.0.0.1:8889/api/v1/activities?limit=5');
        console.log(`   Status: ${activitiesResponse.status}`);
        const activitiesData = await activitiesResponse.text();
        console.log(`   Resposta: ${activitiesData}`);
        
    } catch (error) {
        console.error('Erro na conexão:', error.message);
    }
}

testConnection();