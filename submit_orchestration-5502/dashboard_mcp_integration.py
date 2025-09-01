#!/usr/bin/env python3
"""
Dashboard Submit Orchestration - Ferramenta MCP Claude-CTO
Interface para lançar grupos de tarefas em orquestração
"""

import streamlit as st
import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Optional

# Configuração da página
st.set_page_config(
    page_title="Submit Orchestration - Claude-CTO",
    page_icon="🚀",
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
        background: linear-gradient(90deg, #007bff 0%, #6610f2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    .orchestration-container {
        background: white;
        padding: 2rem;
        border-radius: 15px;
        border: 2px solid #007bff;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        margin: 1rem 0;
    }
    
    .task-preview {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 1rem;
        margin: 0.5rem 0;
    }
    
    .group-badge {
        background: linear-gradient(45deg, #007bff, #6610f2);
        color: white;
        padding: 0.3rem 0.8rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: bold;
        display: inline-block;
        margin: 0.2rem;
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
    
    .warning-message {
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 5px;
        padding: 1rem;
        color: #856404;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

class SubmitOrchestrationDashboard:
    def __init__(self):
        self.base_url = "http://localhost:8889/api/v1"
        
    def check_api_health(self) -> bool:
        """Verifica se a API claude-cto está funcionando"""
        try:
            response = requests.get("http://localhost:8889/health", timeout=5)
            return response.status_code == 200
        except Exception:
            return False
    
    def get_groups(self) -> List[str]:
        """Busca grupos disponíveis"""
        try:
            response = requests.get(f"{self.base_url}/orchestration/groups", timeout=10)
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list):
                    return result
                return result.get('groups', [])
            return []
        except Exception:
            return []
    
    def get_tasks_by_group(self, group: str) -> List[Dict]:
        """Busca tarefas de um grupo específico"""
        try:
            response = requests.get(f"{self.base_url}/tasks?group={group}", timeout=10)
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list):
                    return result
                return result.get('tasks', [])
            return []
        except Exception:
            return []
    
    def submit_orchestration(self, group: str) -> Optional[Dict]:
        """Submete orquestração para execução"""
        try:
            response = requests.post(
                f"{self.base_url}/orchestration/submit",
                json={"orchestration_group": group},
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                st.error(f"Erro ao submeter orquestração: {response.status_code} - {response.text}")
                return None
                
        except requests.exceptions.ConnectionError:
            st.error("❌ Não foi possível conectar com a API claude-cto na porta 8889")
            return None
        except Exception as e:
            st.error(f"❌ Erro ao submeter orquestração: {e}")
            return None
    
    def render_task_preview(self, task: Dict):
        """Renderiza prévia de uma tarefa"""
        identifier = task.get('task_identifier', 'N/A')
        status = task.get('status', 'UNKNOWN').upper()
        prompt = task.get('execution_prompt', 'Sem descrição')
        depends_on = task.get('depends_on', [])
        
        # Truncar prompt se muito longo
        if len(prompt) > 100:
            prompt = prompt[:97] + "..."
        
        status_color = {
            'PENDING': '#6c757d',
            'RUNNING': '#007bff', 
            'COMPLETED': '#28a745',
            'FAILED': '#dc3545'
        }.get(status, '#6c757d')
        
        st.markdown(f"""
        <div class="task-preview">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>{identifier}</strong>
                <span style="background: {status_color}; color: white; padding: 0.2rem 0.5rem; border-radius: 10px; font-size: 0.8rem;">
                    {status}
                </span>
            </div>
            <div style="color: #666; font-size: 0.9rem; margin: 0.5rem 0;">
                {prompt}
            </div>
            {f'<div style="color: #007bff; font-size: 0.8rem;">Depende de: {", ".join(depends_on)}</div>' if depends_on else ''}
        </div>
        """, unsafe_allow_html=True)
    
    def run_dashboard(self):
        """Interface principal para submissão de orquestrações"""
        # Cabeçalho
        st.markdown('<h1 class="main-header">🚀 Submeter Orquestração</h1>', unsafe_allow_html=True)
        
        # Verificar saúde da API
        if not self.check_api_health():
            st.markdown("""
            <div class="error-message">
                <strong>❌ API claude-cto não está disponível</strong><br>
                Verifique se o serviço está rodando na porta 8889
            </div>
            """, unsafe_allow_html=True)
            return
        
        st.markdown('<div class="orchestration-container">', unsafe_allow_html=True)
        
        # Buscar grupos disponíveis
        with st.spinner("🔍 Buscando grupos de orquestração..."):
            groups = self.get_groups()
        
        if not groups:
            st.markdown("""
            <div class="warning-message">
                <strong>⚠️ Nenhum grupo de orquestração encontrado</strong><br>
                Crie tarefas com o mesmo orchestration_group primeiro
            </div>
            """, unsafe_allow_html=True)
            
            st.markdown("### 📝 Como criar um grupo:")
            st.code("""
# 1. Crie tarefas com o mesmo orchestration_group
Task 1: análise (grupo: "projeto_refactor")
Task 2: refatoração (grupo: "projeto_refactor") 
Task 3: testes (grupo: "projeto_refactor")

# 2. Submeta o grupo aqui para execução
            """)
            return
        
        # Seleção de grupo
        st.subheader("📂 Selecionar Grupo")
        selected_group = st.selectbox(
            "Escolha o grupo para submeter:",
            groups,
            help="Grupos com tarefas prontas para execução"
        )
        
        if selected_group:
            # Mostrar tarefas do grupo
            st.subheader(f"📋 Tarefas no Grupo: {selected_group}")
            
            with st.spinner("🔄 Carregando tarefas do grupo..."):
                group_tasks = self.get_tasks_by_group(selected_group)
            
            if group_tasks:
                st.markdown(f'<span class="group-badge">📦 {len(group_tasks)} tarefas</span>', 
                          unsafe_allow_html=True)
                
                # Exibir prévia das tarefas
                for task in group_tasks:
                    self.render_task_preview(task)
                
                st.markdown("---")
                
                # Botão de submissão
                col1, col2, col3 = st.columns([1, 2, 1])
                
                with col2:
                    if st.button("🚀 Submeter Orquestração", use_container_width=True, type="primary"):
                        with st.spinner("🔄 Submetendo orquestração..."):
                            result = self.submit_orchestration(selected_group)
                        
                        if result:
                            st.markdown(f"""
                            <div class="success-message">
                                <strong>✅ Orquestração submetida com sucesso!</strong><br>
                                <strong>Grupo:</strong> {selected_group}<br>
                                <strong>Tarefas:</strong> {len(group_tasks)} tarefas iniciadas<br>
                                <strong>Status:</strong> Em execução
                            </div>
                            """, unsafe_allow_html=True)
                            
                            # Mostrar detalhes da submissão
                            with st.expander("📋 Detalhes da Submissão"):
                                st.json(result)
                            
                            # Link para monitoramento
                            st.info("💡 Acesse o dashboard list_tasks-5504 para monitorar o progresso")
                        
            else:
                st.markdown(f"""
                <div class="warning-message">
                    <strong>⚠️ Nenhuma tarefa encontrada no grupo "{selected_group}"</strong><br>
                    Verifique se as tarefas foram criadas corretamente
                </div>
                """, unsafe_allow_html=True)
        
        st.markdown('</div>', unsafe_allow_html=True)
        
        # Seção de ajuda
        st.markdown("---")
        st.subheader("💡 Como Funciona a Orquestração")
        
        st.markdown("""
        <div style="background: #e7f3ff; border: 1px solid #bee5eb; border-radius: 5px; padding: 1rem; margin: 1rem 0;">
            <strong>Fluxo de Orquestração:</strong><br>
            1. <strong>Criar Tarefas:</strong> Use create_task com o mesmo orchestration_group<br>
            2. <strong>Revisar Grupo:</strong> Verifique as tarefas que serão executadas<br>
            3. <strong>Submeter:</strong> Lance todas as tarefas do grupo simultaneamente<br>
            4. <strong>Monitorar:</strong> Acompanhe o progresso no dashboard de list_tasks<br><br>
            
            <strong>Vantagens:</strong><br>
            • Execução paralela de tarefas independentes<br>
            • Respeitam dependências definidas<br>
            • Monitoramento unificado do grupo
        </div>
        """, unsafe_allow_html=True)

def main():
    """Função principal"""
    dashboard = SubmitOrchestrationDashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()