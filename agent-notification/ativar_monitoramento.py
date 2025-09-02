#!/usr/bin/env python3
"""
🔄 ATIVADOR DE MONITORAMENTO PERSISTENTE INFINITO
=================================================

Script simples para ativar o sistema de monitoramento que NUNCA PARA.

USO:
    python ativar_monitoramento.py    # Ativa monitoramento infinito
    
COMANDOS DURANTE EXECUÇÃO:
    Ctrl+C                           # Para o monitoramento
    
CARACTERÍSTICAS:
✅ Loop infinito real - nunca para sozinho
✅ Interface clara com emojis 
✅ Substituição completa do bypass por time.sleep()
✅ Persistência total até intervenção manual
✅ Status detalhado em tempo real

PRINCÍPIO: NUNCA PARA SOZINHO - SÓ PARA COM COMANDO EXPLÍCITO!
"""

import subprocess
import sys
import os
from pathlib import Path

def main():
    print("🔄 ATIVANDO MONITORAMENTO PERSISTENTE INFINITO")
    print("=" * 60)
    print()
    print("📋 CARACTERÍSTICAS:")
    print("  ✅ Loop infinito real - NUNCA PARA SOZINHO")
    print("  ✅ Interface clara com emojis")  
    print("  ✅ Sem sistema bypass - só time.sleep() limpo")
    print("  ✅ Persistência total até comando manual")
    print("  ✅ Monitoramento contínuo de tasks")
    print()
    print("🛑 PARA PARAR:")
    print("  • Pressione Ctrl+C durante execução")
    print("  • Ou use: python monitor_infinito.py --stop")
    print()
    print("⚠️  AVISO: Este monitor NUNCA PARA sozinho!")
    print("   Só para com intervenção manual explícita.")
    print()
    
    resposta = input("🚀 Ativar monitoramento infinito? (s/N): ").strip().lower()
    
    if resposta in ['s', 'sim', 'y', 'yes']:
        print()
        print("🔄 INICIANDO MONITORAMENTO PERSISTENTE INFINITO...")
        print("   (Use Ctrl+C para parar)")
        print()
        
        script_path = Path(__file__).parent / "monitor_infinito.py"
        
        try:
            # Executa o monitor infinito
            subprocess.run([sys.executable, str(script_path)], check=True)
        except KeyboardInterrupt:
            print("\n🛑 Monitoramento interrompido pelo usuário")
        except subprocess.CalledProcessError as e:
            print(f"\n❌ Erro ao executar monitor: {e}")
        except Exception as e:
            print(f"\n💥 Erro inesperado: {e}")
    else:
        print()
        print("❌ Monitoramento não ativado.")
        print()
        print("💡 DICA: Quando quiser ativar o monitoramento infinito,")
        print("   execute: python ativar_monitoramento.py")
        print()

if __name__ == "__main__":
    main()