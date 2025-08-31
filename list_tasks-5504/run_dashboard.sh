#!/bin/bash

# Script para executar o dashboard de monitoramento Claude-CTO

echo "🚀 Iniciando Claude-CTO Dashboard Monitor..."
echo ""
echo "Escolha a versão do dashboard:"
echo "1) Dashboard com dados de exemplo (recomendado para teste)"
echo "2) Dashboard com integração MCP real (requer claude-cto configurado)"
echo ""

read -p "Digite sua escolha (1 ou 2): " choice

case $choice in
    1)
        echo "📊 Executando dashboard com dados de exemplo..."
        dashboard_file="dashboard_monitor.py"
        ;;
    2)
        echo "🔗 Executando dashboard com integração MCP..."
        dashboard_file="dashboard_mcp_integration.py"
        ;;
    *)
        echo "❌ Opção inválida. Usando dashboard com dados de exemplo..."
        dashboard_file="dashboard_monitor.py"
        ;;
esac

echo "📍 Acesse: http://localhost:8501"
echo "⏹️  Para parar: Ctrl+C"
echo ""

# Instalar dependências se necessário
echo "🔧 Verificando dependências..."
pip install streamlit pandas requests plotly > /dev/null 2>&1

# Executar o dashboard
cd /home/suthub/.claude/claude-cto
streamlit run "$dashboard_file" --server.port 8501 --server.address localhost