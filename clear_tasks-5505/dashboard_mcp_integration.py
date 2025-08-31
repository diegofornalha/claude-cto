#!/usr/bin/env python3
"""
Dashboard Clear Tasks - Ferramenta MCP Claude-CTO
Interface para limpeza de tarefas completadas e falhadas
"""

import streamlit as st
import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# Configuração da página
st.set_page_config(
    page_title="Clear Tasks - Claude-CTO",
    page_icon="🧹",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# CSS customizado
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        text-align: center;
        margin-bottom: 1rem;
        background: linear-gradient(90deg, #dc3545 0%, #fd7e14 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    .clear-container {
        background: white;
        padding: 2rem;
        border-radius: 15px;
        border: 2px solid #dc3545;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        margin: 1rem 0;
    }
    
    .warning-zone {
        background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
        border: 2px solid #ffc107;
        border-radius: 15px;
        padding: 2rem;
        margin: 1rem 0;
        text-align: center;
    }
    
    .danger-zone {
        background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
        border: 2px solid #dc3545;
        border-radius: 15px;
        padding: 2rem;
        margin: 1rem 0;
        text-align: center;
    }
    
    .safe-zone {
        background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
        border: 2px solid #28a745;
        border-radius: 15px;
        padding: 2rem;
        margin: 1rem 0;
        text-align: center;
    }
    
    .task-summary {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 10px;
        padding: 1rem;
        margin: 0.5rem 0;
    }
    
    .success-message {
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        border-radius: 5px;
        padding: 1rem;
        color: #155724;
        margin: 1rem 0;
    }
    
    .error-message {
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 5px;
        padding: 1rem;
        color: #721c24;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

class ClearTasksDashboard:
    def __init__(self):
        self.base_url = "http://localhost:8889/api/v1"
        
    def check_api_health(self) -> bool:
        """Verifica se a API claude-cto está funcionando"""
        try:
            response = requests.get("http://localhost:8889/health", timeout=5)
            return response.status_code == 200
        except Exception:
            return False
    
    def get_all_tasks(self) -> List[Dict]:
        """Busca todas as tarefas"""
        try:
            response = requests.get(f"{self.base_url}/tasks?limit=1000", timeout=10)
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list):
                    return result
                return result.get('tasks', [])
            return []
        except Exception:
            return []
    
    def clear_tasks(self) -> Optional[Dict]:
        """Limpa tarefas completadas e falhadas"""
        try:
            response = requests.post(f"{self.base_url}/tasks/clear", timeout=30)
            
            if response.status_code == 200:
                return response.json()
            else:
                st.error(f"Erro ao limpar tarefas: {response.status_code} - {response.text}")
                return None
                
        except requests.exceptions.ConnectionError:
            st.error("❌ Não foi possível conectar com a API claude-cto na porta 8889")
            return None
        except Exception as e:
            st.error(f"❌ Erro ao limpar tarefas: {e}")
            return None
    
    def categorize_tasks(self, tasks: List[Dict]) -> Dict[str, List[Dict]]:
        """Categoriza tarefas por status"""
        categories = {
            'COMPLETED': [],
            'FAILED': [],
            'RUNNING': [],
            'PENDING': []
        }
        
        for task in tasks:
            status = task.get('status', 'UNKNOWN').upper()
            if status in categories:
                categories[status].append(task)
        
        return categories
    
    def render_task_summary(self, tasks: List[Dict], status: str):
        """Renderiza resumo de tarefas por categoria"""
        if not tasks:
            return
        
        status_colors = {
            'COMPLETED': '#28a745',
            'FAILED': '#dc3545',
            'RUNNING': '#007bff',
            'PENDING': '#6c757d'
        }
        
        status_icons = {
            'COMPLETED': '✅',
            'FAILED': '❌',
            'RUNNING': '🔄',
            'PENDING': '⏳'
        }
        
        color = status_colors.get(status, '#6c757d')
        icon = status_icons.get(status, '📋')
        
        st.markdown(f"""
        <div style="border-left: 4px solid {color}; padding-left: 1rem; margin: 1rem 0;">
            <h4>{icon} {status} ({len(tasks)} tarefas)</h4>
        </div>
        """, unsafe_allow_html=True)
        
        # Mostrar algumas tarefas como exemplo
        for i, task in enumerate(tasks[:3]):  # Máximo 3 exemplos
            identifier = task.get('task_identifier', f"task_{task.get('id', 'N/A')}")
            created_at = task.get('created_at', '')
            
            try:
                if created_at:
                    dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    time_str = dt.strftime("%d/%m %H:%M")
                else:
                    time_str = "N/A"
            except:
                time_str = "N/A"
            
            st.markdown(f"""
            <div class="task-summary">
                <strong>{identifier}</strong> <span style="color: #666;">({time_str})</span>
            </div>
            """, unsafe_allow_html=True)
        
        if len(tasks) > 3:
            st.text(f"... e mais {len(tasks) - 3} tarefas")
    
    def run_dashboard(self):
        """Interface principal para limpeza de tarefas"""
        # Cabeçalho
        st.markdown('<h1 class="main-header">🧹 Limpar Tarefas</h1>', unsafe_allow_html=True)
        
        # Verificar saúde da API
        if not self.check_api_health():
            st.markdown("""
            <div class="error-message">
                <strong>❌ API claude-cto não está disponível</strong><br>
                Verifique se o serviço está rodando na porta 8889
            </div>
            """, unsafe_allow_html=True)
            return
        
        # Buscar tarefas atuais
        with st.spinner("🔄 Analisando tarefas atuais..."):
            all_tasks = self.get_all_tasks()
        
        if not all_tasks:
            st.markdown("""
            <div class="safe-zone">
                <h3>🎉 Nenhuma tarefa encontrada</h3>
                <p>Não há tarefas para limpar no momento</p>
            </div>
            """, unsafe_allow_html=True)
            return
        
        # Categorizar tarefas
        categorized = self.categorize_tasks(all_tasks)
        
        # Métricas
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.markdown(f"""
            <div class="metric-card">
                <h3 style="color: #28a745; margin: 0;">✅ {len(categorized['COMPLETED'])}</h3>
                <p style="margin: 0; color: #666;">Completadas</p>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            st.markdown(f"""
            <div class="metric-card">
                <h3 style="color: #dc3545; margin: 0;">❌ {len(categorized['FAILED'])}</h3>
                <p style="margin: 0; color: #666;">Falharam</p>
            </div>
            """, unsafe_allow_html=True)
        
        with col3:
            st.markdown(f"""
            <div class="metric-card">
                <h3 style="color: #007bff; margin: 0;">🔄 {len(categorized['RUNNING'])}</h3>
                <p style="margin: 0; color: #666;">Executando</p>
            </div>
            """, unsafe_allow_html=True)
        
        with col4:
            st.markdown(f"""
            <div class="metric-card">
                <h3 style="color: #6c757d; margin: 0;">⏳ {len(categorized['PENDING'])}</h3>
                <p style="margin: 0; color: #666;">Pendentes</p>
            </div>
            """, unsafe_allow_html=True)
        
        # Análise de limpeza
        can_clear = categorized['COMPLETED'] + categorized['FAILED']
        protected = categorized['RUNNING'] + categorized['PENDING']
        
        st.markdown("---")
        
        # Zona de limpeza
        if can_clear:
            st.markdown(f"""
            <div class="warning-zone">
                <h3>⚠️ Limpeza Disponível</h3>
                <p><strong>{len(can_clear)} tarefas</strong> podem ser removidas com segurança</p>
                <p>({len(categorized['COMPLETED'])} completadas + {len(categorized['FAILED'])} falhadas)</p>
            </div>
            """, unsafe_allow_html=True)
            
            # Mostrar prévia das tarefas que serão removidas
            st.subheader("📋 Tarefas que serão removidas:")
            
            col1, col2 = st.columns(2)
            
            with col1:
                if categorized['COMPLETED']:
                    self.render_task_summary(categorized['COMPLETED'], 'COMPLETED')
            
            with col2:
                if categorized['FAILED']:
                    self.render_task_summary(categorized['FAILED'], 'FAILED')
            
            # Zona de proteção
            if protected:
                st.markdown(f"""
                <div class="safe-zone">
                    <h4>🛡️ Tarefas Protegidas</h4>
                    <p><strong>{len(protected)} tarefas</strong> ativas não serão afetadas</p>
                    <p>({len(categorized['RUNNING'])} executando + {len(categorized['PENDING'])} pendentes)</p>
                </div>
                """, unsafe_allow_html=True)
            
            # Confirmação e execução
            st.markdown("---")
            
            col1, col2, col3 = st.columns([1, 2, 1])
            
            with col2:
                st.markdown("### 🚨 Confirmação Necessária")
                
                confirm = st.checkbox(
                    f"Confirmo que quero remover {len(can_clear)} tarefas completadas/falhadas",
                    help="Esta ação não pode ser desfeita"
                )
                
                if confirm:
                    if st.button("🧹 Executar Limpeza", use_container_width=True, type="primary"):
                        with st.spinner("🔄 Limpando tarefas..."):
                            result = self.clear_tasks()
                        
                        if result:
                            cleared_count = result.get('cleared_count', len(can_clear))
                            
                            st.markdown(f"""
                            <div class="success-message">
                                <strong>✅ Limpeza concluída com sucesso!</strong><br>
                                <strong>Tarefas removidas:</strong> {cleared_count}<br>
                                <strong>Tempo:</strong> {datetime.now().strftime('%H:%M:%S')}
                            </div>
                            """, unsafe_allow_html=True)
                            
                            # Recarregar página após limpeza
                            time.sleep(2)
                            st.rerun()
        
        else:
            st.markdown("""
            <div class="safe-zone">
                <h3>🎉 Sistema Limpo</h3>
                <p>Não há tarefas completadas ou falhadas para remover</p>
                <p>Apenas tarefas ativas estão presentes no sistema</p>
            </div>
            """, unsafe_allow_html=True)
            
            if protected:
                st.subheader("🔄 Tarefas Ativas:")
                
                col1, col2 = st.columns(2)
                
                with col1:
                    if categorized['RUNNING']:
                        self.render_task_summary(categorized['RUNNING'], 'RUNNING')
                
                with col2:
                    if categorized['PENDING']:
                        self.render_task_summary(categorized['PENDING'], 'PENDING')
        
        # Seção de informações
        st.markdown("---")
        st.subheader("ℹ️ Sobre a Limpeza")
        
        st.markdown("""
        <div style="background: #e7f3ff; border: 1px solid #bee5eb; border-radius: 5px; padding: 1rem; margin: 1rem 0;">
            <strong>O que é removido:</strong><br>
            • ✅ Tarefas com status COMPLETED<br>
            • ❌ Tarefas com status FAILED<br><br>
            
            <strong>O que é preservado:</strong><br>
            • 🔄 Tarefas em execução (RUNNING)<br>
            • ⏳ Tarefas pendentes (PENDING)<br><br>
            
            <strong>Segurança:</strong><br>
            • Operação atômica - ou todas são removidas ou nenhuma<br>
            • Tarefas ativas nunca são afetadas<br>
            • Confirmação obrigatória antes da execução
        </div>
        """, unsafe_allow_html=True)
        
        # Botão de atualização
        if st.button("🔄 Atualizar Lista", use_container_width=False):
            st.rerun()

def main():
    """Função principal"""
    dashboard = ClearTasksDashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()