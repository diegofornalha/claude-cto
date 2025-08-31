#!/bin/bash
# 🎯 SCRIPT WRAPPER PARA SISTEMA DE MONITORAMENTO
# ============================================

echo "🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀"
echo "🚀 SISTEMA DE MONITORAMENTO PERSISTENTE - MCP CLAUDE CTO"
echo "🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀"

echo ""
echo "📋 OPÇÕES DISPONÍVEIS:"
echo ""
echo "1️⃣  Monitorar Task 29 (resolver_sessao_definitivo) - RECOMENDADO"
echo "2️⃣  Monitorar todas as tasks running"
echo "3️⃣  Análise detalhada da Task 29"  
echo "4️⃣  Verificar status do monitor atual"
echo "5️⃣  Parar monitor em execução"
echo ""

read -p "🎯 Escolha uma opção (1-5): " choice

case $choice in
    1)
        echo "🎯 Iniciando monitoramento Task 29..."
        echo "⏱️  Intervalo: 30s | Modo: Persistente"
        echo ""
        python3 monitor_ultimate.py 29 --persist --interval 30
        ;;
    2)
        echo "🌍 Iniciando monitoramento global..."
        python3 monitor_ultimate.py --all --persist --interval 45
        ;;
    3)
        echo "📋 Análise detalhada Task 29..."
        python3 monitor_ultimate.py --details 29
        ;;
    4)
        echo "📊 Verificando status do monitor..."
        ps aux | grep monitor | grep -v grep
        echo ""
        echo "📁 Logs recentes:"
        ls -la /home/suthub/.claude/claude-cto/monitor*.log 2>/dev/null || echo "Nenhum log encontrado"
        ;;
    5)
        echo "🛑 Parando monitors em execução..."
        pkill -f monitor_now.py
        pkill -f monitor_ultimate.py
        echo "✅ Monitors parados"
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac