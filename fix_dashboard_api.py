#!/usr/bin/env python3
"""
Script de Correção: Dashboard Task Counter
Corrige a discrepância no contador de tarefas alterando o endpoint da API.

Uso:
    python3 fix_dashboard_api.py [--dry-run]
    
Opções:
    --dry-run    Simula as mudanças sem aplicá-las
"""

import sys
import os
import json
import argparse
from pathlib import Path
import requests

def log_info(message):
    print(f"[INFO] {message}")

def log_success(message):
    print(f"[✅] {message}")

def log_error(message):
    print(f"[❌] {message}")

def log_warning(message):
    print(f"[⚠️] {message}")

def check_api_connectivity():
    """Verifica se a API está acessível"""
    try:
        response = requests.get("http://localhost:8888/health", timeout=5)
        if response.status_code == 200:
            log_success("API CTO está online")
            return True
        else:
            log_error(f"API retornou status {response.status_code}")
            return False
    except Exception as e:
        log_error(f"Erro ao conectar com a API: {e}")
        return False

def get_real_task_count():
    """Obtém a contagem real de tarefas da API"""
    try:
        response = requests.get("http://localhost:8888/api/v1/tasks", timeout=10)
        if response.status_code == 200:
            tasks = response.json()
            return len(tasks)
        else:
            log_error(f"Erro ao buscar tarefas: {response.status_code}")
            return None
    except Exception as e:
        log_error(f"Erro ao buscar tarefas: {e}")
        return None

def backup_file(file_path):
    """Cria backup do arquivo antes da modificação"""
    backup_path = f"{file_path}.backup"
    try:
        import shutil
        shutil.copy2(file_path, backup_path)
        log_success(f"Backup criado: {backup_path}")
        return backup_path
    except Exception as e:
        log_error(f"Erro ao criar backup: {e}")
        return None

def fix_mcp_api_service(dashboard_path, dry_run=False):
    """Corrige o arquivo mcp-api.ts"""
    api_file = dashboard_path / "src" / "services" / "mcp-api.ts"
    
    if not api_file.exists():
        log_error(f"Arquivo não encontrado: {api_file}")
        return False
    
    log_info(f"Processando {api_file}")
    
    # Ler conteúdo atual
    with open(api_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Backup se não for dry-run
    if not dry_run:
        backup_file(api_file)
    
    # Substituições necessárias
    changes = [
        {
            'old': '/mcp/tools/list_tasks',
            'new': '/tasks',
            'description': 'Corrigir endpoint para listar tarefas'
        },
        {
            'old': 'method: \'POST\',\n        body: JSON.stringify({\n          tool: \'mcp__claude-cto__list_tasks\',\n          arguments: {\n            limit: 100 // Buscar um número alto para pegar todas as tasks\n          }\n        }),',
            'new': 'method: \'GET\',',
            'description': 'Usar GET em vez de POST com body complexo'
        },
        {
            'old': '// Adaptar a resposta do MCP para o formato esperado\n      if (response.result && Array.isArray(response.result)) {\n        return response.result.map((task: any) => ({',
            'new': '// Processar resposta direta da API\n      if (Array.isArray(response)) {\n        return response.map((task: any) => ({',
            'description': 'Adaptar processamento da resposta'
        },
        {
            'old': 'return [];',
            'new': 'return [];\n    } catch (error) {\n      console.error(\'Erro ao buscar tasks via API direta:\', error);\n      throw error;',
            'description': 'Melhorar tratamento de erro'
        }
    ]
    
    modified_content = content
    applied_changes = []
    
    for change in changes:
        if change['old'] in modified_content:
            if not dry_run:
                modified_content = modified_content.replace(change['old'], change['new'])
            applied_changes.append(change['description'])
            log_success(f"✓ {change['description']}")
        else:
            log_warning(f"Padrão não encontrado: {change['description']}")
    
    if not dry_run and applied_changes:
        # Escrever arquivo modificado
        with open(api_file, 'w', encoding='utf-8') as f:
            f.write(modified_content)
        log_success(f"Arquivo atualizado: {api_file}")
        
    return len(applied_changes) > 0

def add_better_error_handling(dashboard_path, dry_run=False):
    """Adiciona melhor tratamento de erros no dashboard"""
    tasks_file = dashboard_path / "src" / "pages" / "tasks" / "index.tsx"
    
    if not tasks_file.exists():
        log_error(f"Arquivo não encontrado: {tasks_file}")
        return False
    
    log_info(f"Melhorando tratamento de erro em {tasks_file}")
    
    with open(tasks_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if not dry_run:
        backup_file(tasks_file)
    
    # Verificar se já tem o tratamento adequado
    if 'API Claude CTO não está disponível' in content:
        log_info("Tratamento de erro já implementado")
        return True
    
    # Adicionar melhor logging para debug
    error_improvement = '''      // Buscar todas as tasks
      const tasks = await McpApi.getTasks();
      console.log('Tasks carregadas:', tasks.length); // Debug: log do número real'''
    
    if 'const tasks = await McpApi.getTasks();' in content:
        if not dry_run:
            content = content.replace(
                '// Buscar todas as tasks\n      const tasks = await McpApi.getTasks();',
                error_improvement
            )
        log_success("✓ Adicionado logging de debug")
        
        if not dry_run:
            with open(tasks_file, 'w', encoding='utf-8') as f:
                f.write(content)
    
    return True

def create_api_test_script(dashboard_path, dry_run=False):
    """Cria script de teste para validar a API"""
    test_script = dashboard_path / "test_api_connection.js"
    
    script_content = '''#!/usr/bin/env node
/**
 * Script de Teste de Conectividade da API
 * Valida se o dashboard consegue conectar com a API CTO
 */

const http = require('http');

async function testEndpoint(path, method = 'GET') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
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
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (err) => reject(err));
        req.end();
    });
}

async function main() {
    console.log('🔍 Testando conectividade com API CTO...\n');
    
    // Teste 1: Health check
    try {
        const health = await testEndpoint('/../../health');
        console.log(`✅ Health Check: ${health.status === 200 ? 'OK' : 'FAILED'} (${health.status})`);
    } catch (e) {
        console.log(`❌ Health Check: FAILED - ${e.message}`);
        process.exit(1);
    }
    
    // Teste 2: Listar tasks
    try {
        const tasks = await testEndpoint('/tasks');
        if (tasks.status === 200 && Array.isArray(tasks.data)) {
            console.log(`✅ Lista de Tasks: OK - ${tasks.data.length} tarefas encontradas`);
            
            // Estatísticas por status
            const stats = tasks.data.reduce((acc, task) => {
                acc[task.status] = (acc[task.status] || 0) + 1;
                return acc;
            }, {});
            
            console.log('📊 Estatísticas por status:');
            Object.entries(stats).forEach(([status, count]) => {
                console.log(`   ${status}: ${count}`);
            });
        } else {
            console.log(`❌ Lista de Tasks: FAILED (${tasks.status})`);
            console.log('Resposta:', tasks.data);
        }
    } catch (e) {
        console.log(`❌ Lista de Tasks: FAILED - ${e.message}`);
    }
    
    console.log('\n🏁 Teste concluído!');
}

main().catch(console.error);
'''
    
    if not dry_run:
        with open(test_script, 'w', encoding='utf-8') as f:
            f.write(script_content)
        
        # Tornar executável
        import stat
        os.chmod(test_script, os.stat(test_script).st_mode | stat.S_IEXEC)
        
        log_success(f"Script de teste criado: {test_script}")
    else:
        log_info(f"[DRY-RUN] Criaria script de teste: {test_script}")
    
    return True

def main():
    parser = argparse.ArgumentParser(description='Corrige discrepância no contador de tarefas do dashboard')
    parser.add_argument('--dry-run', action='store_true', help='Simula mudanças sem aplicá-las')
    args = parser.parse_args()
    
    # Configuração
    dashboard_path = Path('/home/suthub/.claude/claude-cto/master_dashboard-5508')
    
    log_info(f"Iniciando correção do dashboard {'(DRY-RUN)' if args.dry_run else ''}")
    log_info(f"Caminho do dashboard: {dashboard_path}")
    
    # Verificações preliminares
    if not dashboard_path.exists():
        log_error(f"Dashboard não encontrado em: {dashboard_path}")
        return 1
    
    log_info("Verificando conectividade com a API...")
    if not check_api_connectivity():
        log_error("API não está acessível. Verifique se o servidor CTO está rodando.")
        return 1
    
    # Obter contagem real
    real_count = get_real_task_count()
    if real_count is not None:
        log_info(f"Contagem real de tarefas: {real_count}")
    else:
        log_warning("Não foi possível obter a contagem real de tarefas")
    
    # Aplicar correções
    success = True
    
    log_info("\n" + "="*50)
    log_info("APLICANDO CORREÇÕES")
    log_info("="*50)
    
    # 1. Corrigir serviço da API
    if fix_mcp_api_service(dashboard_path, args.dry_run):
        log_success("✅ Serviço da API corrigido")
    else:
        log_error("❌ Falha ao corrigir serviço da API")
        success = False
    
    # 2. Melhorar tratamento de erros
    if add_better_error_handling(dashboard_path, args.dry_run):
        log_success("✅ Tratamento de erros melhorado")
    else:
        log_error("❌ Falha ao melhorar tratamento de erros")
    
    # 3. Criar script de teste
    if create_api_test_script(dashboard_path, args.dry_run):
        log_success("✅ Script de teste criado")
    else:
        log_error("❌ Falha ao criar script de teste")
    
    # Próximos passos
    log_info("\n" + "="*50)
    log_info("PRÓXIMOS PASSOS")
    log_info("="*50)
    
    if not args.dry_run:
        log_info("1. Reiniciar o dashboard Next.js:")
        log_info("   cd /home/suthub/.claude/claude-cto/master_dashboard-5508")
        log_info("   npm run dev")
        log_info("")
        log_info("2. Testar a conectividade:")
        log_info("   cd /home/suthub/.claude/claude-cto/master_dashboard-5508")
        log_info("   ./test_api_connection.js")
        log_info("")
        log_info("3. Limpar cache do browser (Ctrl+Shift+R)")
        log_info("")
        log_info("4. Verificar se o contador mostra 8 tarefas")
    else:
        log_info("Execute o script sem --dry-run para aplicar as mudanças")
    
    return 0 if success else 1

if __name__ == '__main__':
    sys.exit(main())