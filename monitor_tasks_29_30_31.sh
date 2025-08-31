#!/bin/bash
"""
Script para monitorar tasks específicas 29, 30, 31
=================================================

Este script é um exemplo de como usar o auto_continue.py
para monitorar tasks específicas até que estejam COMPLETED.

Uso:
    ./monitor_tasks_29_30_31.sh
    
Ou simplesmente:
    bash monitor_tasks_29_30_31.sh
"""

echo "🚀 Iniciando monitoramento das tasks 29, 30, 31..."
echo "🤖 Sistema de Auto-Continue ATIVO"
echo "🛑 Pressione Ctrl+C para parar"
echo "=" * 60

# Executa o script Python com as tasks específicas
python3 /home/suthub/.claude/claude-cto/auto_continue.py 29 30 31