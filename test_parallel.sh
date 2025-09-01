#!/bin/bash
# Teste de paralelismo ULTRATHINK - 20 workers

echo "🚀 ULTRATHINK PARALLEL TEST - Testando 20 workers simultâneos"
echo "=================================================="

cd /home/suthub/.claude/claude-cto
source .venv/bin/activate

# Criar 10 tarefas de teste rápidas
for i in {1..10}; do
    echo "📦 Criando tarefa teste $i..."
    claude-cto run "Task teste $i: Calcule o fatorial de $((i*10)) e escreva o resultado em /tmp/test_$i.txt. Esta é uma tarefa de teste para verificar execução paralela." &
    sleep 0.5
done

echo ""
echo "✅ 10 tarefas criadas! Verificando execução paralela..."
sleep 3

# Verificar quantas estão rodando
echo ""
echo "📊 Status das tarefas:"
claude-cto list | head -15

echo ""
echo "💻 Processos Python ativos:"
ps aux | grep -E "python.*claude" | wc -l

echo ""
echo "🔍 Tarefas em execução:"
sqlite3 ~/.claude-cto/tasks.db "SELECT COUNT(*) as running FROM tasks WHERE status = 'running'"