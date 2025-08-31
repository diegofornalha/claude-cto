#!/bin/bash
# 🔄 ATIVADOR DO MONITOR INFINITO ULTRATHINK

echo "=================================="
echo "🚀 ATIVANDO MONITOR INFINITO"
echo "=================================="
echo ""
echo "⚠️  IMPORTANTE:"
echo "   • Este monitor roda INFINITAMENTE"
echo "   • Só para com Ctrl+C"
echo "   • Continua mesmo sem tasks"
echo ""

cd /home/suthub/.claude/claude-cto

# Verifica se já está rodando
python3 monitor_infinito.py --status 2>/dev/null
if [ $? -eq 0 ]; then
    echo ""
    echo "⚠️  Monitor já está ativo!"
    echo "   Use: python3 monitor_infinito.py --stop"
    echo "   Para parar o monitor atual"
    exit 1
fi

echo "Iniciando monitor infinito em 3 segundos..."
echo "3..."
sleep 1
echo "2..."
sleep 1
echo "1..."
sleep 1

# Inicia o monitor infinito
python3 monitor_infinito.py