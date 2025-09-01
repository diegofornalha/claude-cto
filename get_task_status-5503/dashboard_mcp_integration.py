#!/usr/bin/env python3
"""
Dashboard Get Task Status - Ferramenta MCP Claude-CTO
Interface para consulta de status específico de tarefas
"""

import streamlit as st
import requests
import json
from datetime import datetime
from typing import Dict, Optional, List

# Configuração da página
st.set_page_config(
    page_title="Get Task Status - Claude-CTO",
    page_icon="🔍",
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
        background: linear-gradient(90deg, #17a2b8 0%, #007bff 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    .search-container {
        background: white;
        padding: 2rem;
        border-radius: 15px;
        border: 2px solid #17a2b8;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        margin: 1rem 0;
    }
    
    .task-detail-card {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border: 1px solid #dee2e6;
        border-radius: 15px;
        padding: 2rem;
        margin: 1rem 0;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .status-indicator {
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: bold;
        text-align: center;
        display: inline-block;
        margin: 0.5rem 0;
        font-size: 1rem;
    }
    
    .status-completed { background: linear-gradient(45deg, #28a745, #20c997); color: white; }
    .status-running { background: linear-gradient(45deg, #007bff, #17a2b8); color: white; }
    .status-failed { background: linear-gradient(45deg, #dc3545, #fd7e14); color: white; }
    .status-pending { background: linear-gradient(45deg, #6c757d, #adb5bd); color: white; }
    
    .detail-section {
        background: white;
        border-radius: 10px;
        padding: 1.5rem;
        margin: 1rem 0;
        border-left: 4px solid #17a2b8;
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
    
    .quick-search {
        background: #e7f3ff;
        border: 1px solid #bee5eb;
        border-radius: 10px;
        padding: 1rem;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

class GetTaskStatusDashboard:
    def __init__(self):
        self.base_url = "http://localhost:8889/api/v1"
        self.status_colors = {
            'COMPLETED': '#28a745',
            'RUNNING': '#007bff', 
            'FAILED': '#dc3545',
            'PENDING': '#6c757d'
        }
        
    def check_api_health(self) -> bool:
        """Verifica se a API claude-cto está funcionando"""
        try:
            response = requests.get("http://localhost:8889/health", timeout=5)
            return response.status_code == 200
        except Exception:
            return False
    
    def get_task_status(self, task_identifier: str) -> Optional[Dict]:
        """Busca status específico de uma tarefa"""
        try:
            response = requests.get(f"{self.base_url}/tasks/{task_identifier}", timeout=10)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                return {"error": "Tarefa não encontrada"}
            else:
                return {"error": f"Erro {response.status_code}: {response.text}"}
                
        except requests.exceptions.ConnectionError:
            return {"error": "Conexão com API falhou"}
        except Exception as e:
            return {"error": f"Erro: {e}"}
    
    def get_recent_tasks(self) -> List[Dict]:
        """Busca tarefas recentes para busca rápida"""
        try:
            response = requests.get(f"{self.base_url}/tasks?limit=10", timeout=10)
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list):
                    return result
                return result.get('tasks', [])
            return []
        except Exception:
            return []
    
    def calculate_elapsed_time(self, start_time: str) -> str:
        """Calcula tempo decorrido"""
        try:
            if not start_time:
                return "N/A"
            
            formats = [
                "%Y-%m-%dT%H:%M:%S.%fZ",
                "%Y-%m-%dT%H:%M:%SZ", 
                "%Y-%m-%dT%H:%M:%S"
            ]
            
            start = None
            for fmt in formats:
                try:
                    start = datetime.strptime(start_time, fmt)
                    break
                except ValueError:
                    continue
            
            if not start:
                return "N/A"
                
            elapsed = datetime.utcnow() - start
            
            if elapsed.total_seconds() < 60:
                return f"{int(elapsed.total_seconds())}s"
            elif elapsed.total_seconds() < 3600:
                return f"{int(elapsed.total_seconds() / 60)}m"
            else:
                hours = int(elapsed.total_seconds() / 3600)
                minutes = int((elapsed.total_seconds() % 3600) / 60)
                return f"{hours}h {minutes}m"
                
        except Exception:
            return "N/A"
    
    def render_task_details(self, task_data: Dict):
        """Renderiza detalhes completos da tarefa"""
        if "error" in task_data:
            st.markdown(f"""
            <div class="error-message">
                <strong>❌ {task_data['error']}</strong>
            </div>
            """, unsafe_allow_html=True)
            return
        
        # Informações básicas
        identifier = task_data.get('task_identifier', 'N/A')
        status = task_data.get('status', 'UNKNOWN').upper()
        task_id = task_data.get('id', 'N/A')
        created_at = task_data.get('created_at', '')
        
        st.markdown(f"""
        <div class="task-detail-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0;">📋 {identifier}</h3>
                <span class="status-indicator status-{status.lower()}">{status}</span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div><strong>ID:</strong> {task_id}</div>
                <div><strong>Tempo:</strong> {self.calculate_elapsed_time(created_at)}</div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Prompt de execução
        execution_prompt = task_data.get('execution_prompt', '')
        if execution_prompt:
            st.markdown(f"""
            <div class="detail-section">
                <h4>📝 Descrição da Tarefa</h4>
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; font-family: monospace;">
                    {execution_prompt}
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        # Configurações
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("""
            <div class="detail-section">
                <h4>⚙️ Configurações</h4>
            </div>
            """, unsafe_allow_html=True)
            
            config_info = {
                "Modelo": task_data.get('model', 'N/A'),
                "Diretório": task_data.get('working_directory', 'N/A'),
                "Grupo": task_data.get('orchestration_group', 'Nenhum')
            }
            
            for key, value in config_info.items():
                st.text(f"{key}: {value}")
        
        with col2:
            st.markdown("""
            <div class="detail-section">
                <h4>🔗 Dependências</h4>
            </div>
            """, unsafe_allow_html=True)
            
            depends_on = task_data.get('depends_on', [])
            if depends_on:
                for dep in depends_on:
                    st.text(f"• {dep}")
            else:
                st.text("Nenhuma dependência")
            
            wait_time = task_data.get('wait_after_dependencies', 0)
            if wait_time > 0:
                st.text(f"Espera: {wait_time}s após dependências")
        
        # Resultados/Logs se disponível
        if 'final_summary' in task_data or 'result' in task_data:
            summary = task_data.get('final_summary') or task_data.get('result', '')
            if summary:
                st.markdown(f"""
                <div class="detail-section">
                    <h4>📊 Resultado/Resumo</h4>
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; max-height: 300px; overflow-y: auto;">
                        {summary}
                    </div>
                </div>
                """, unsafe_allow_html=True)
        
        # JSON completo
        with st.expander("📄 Dados Completos (JSON)"):
            st.json(task_data)
    
    def run_dashboard(self):
        """Interface principal para consulta de status"""
        # Cabeçalho
        st.markdown('<h1 class="main-header">🔍 Consultar Status da Tarefa</h1>', unsafe_allow_html=True)
        
        # Verificar saúde da API
        if not self.check_api_health():
            st.markdown("""
            <div class="error-message">
                <strong>❌ API claude-cto não está disponível</strong><br>
                Verifique se o serviço está rodando na porta 8889
            </div>
            """, unsafe_allow_html=True)
            return
        
        st.markdown('<div class="search-container">', unsafe_allow_html=True)
        
        # Formulário de busca
        st.subheader("🔍 Buscar Tarefa")
        
        col1, col2 = st.columns([3, 1])
        
        with col1:
            task_identifier = st.text_input(
                "Identificador da Tarefa",
                placeholder="Ex: analisar_codigo_auth",
                help="Digite o task_identifier da tarefa que deseja consultar"
            )
        
        with col2:
            search_button = st.button("🔍 Buscar", use_container_width=True, type="primary")
        
        st.markdown('</div>', unsafe_allow_html=True)
        
        # Busca rápida com tarefas recentes
        st.markdown("### 🕒 Tarefas Recentes")
        
        with st.spinner("🔄 Carregando tarefas recentes..."):
            recent_tasks = self.get_recent_tasks()
        
        if recent_tasks:
            st.markdown("""
            <div class="quick-search">
                <strong>💡 Clique em uma tarefa para ver detalhes:</strong>
            </div>
            """, unsafe_allow_html=True)
            
            cols = st.columns(min(len(recent_tasks), 3))
            
            for i, task in enumerate(recent_tasks[:6]):  # Máximo 6 tarefas
                col_idx = i % 3
                with cols[col_idx]:
                    identifier = task.get('task_identifier', f"task_{task.get('id', 'N/A')}")
                    status = task.get('status', 'UNKNOWN').upper()
                    
                    status_color = self.status_colors.get(status, '#6c757d')
                    
                    if st.button(
                        f"{identifier}\n{status}",
                        key=f"recent_{i}",
                        help=f"Clique para ver detalhes de {identifier}"
                    ):
                        st.session_state.selected_task = identifier
                        task_identifier = identifier
        
        # Processar busca
        if search_button or task_identifier or st.session_state.get('selected_task'):
            search_id = task_identifier or st.session_state.get('selected_task', '')
            
            if search_id.strip():
                st.markdown("---")
                st.subheader(f"📋 Detalhes da Tarefa: {search_id}")
                
                with st.spinner("🔄 Buscando status da tarefa..."):
                    task_data = self.get_task_status(search_id.strip())
                
                if task_data:
                    self.render_task_details(task_data)
                    
                    # Botão para atualizar status
                    if st.button("🔄 Atualizar Status", key="refresh_status"):
                        st.rerun()
                else:
                    st.markdown("""
                    <div class="error-message">
                        <strong>❌ Não foi possível obter status da tarefa</strong><br>
                        Verifique se o identificador está correto
                    </div>
                    """, unsafe_allow_html=True)
            else:
                st.warning("⚠️ Digite um identificador de tarefa para buscar")
        
        # Limpar seleção
        if st.session_state.get('selected_task'):
            if st.button("🧹 Limpar Seleção"):
                del st.session_state.selected_task
                st.rerun()
        
        # Seção de ajuda
        st.markdown("---")
        st.subheader("💡 Como Usar")
        
        st.markdown("""
        <div style="background: #e7f3ff; border: 1px solid #bee5eb; border-radius: 5px; padding: 1rem; margin: 1rem 0;">
            <strong>Formas de buscar tarefas:</strong><br>
            1. <strong>Busca Manual:</strong> Digite o task_identifier no campo de busca<br>
            2. <strong>Busca Rápida:</strong> Clique em uma das tarefas recentes listadas<br>
            3. <strong>Atualização:</strong> Use o botão "Atualizar Status" para dados em tempo real<br><br>
            
            <strong>Informações exibidas:</strong><br>
            • Status atual e progresso<br>
            • Configurações e dependências<br>
            • Resultados e logs (quando disponível)<br>
            • Dados completos em formato JSON
        </div>
        """, unsafe_allow_html=True)

def main():
    """Função principal"""
    dashboard = GetTaskStatusDashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()