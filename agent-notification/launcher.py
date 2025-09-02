#!/usr/bin/env python3
"""
Launcher Central - Dashboards MCP Claude-CTO
Interface para acessar todos os dashboards especializados
"""

import streamlit as st
import subprocess
import os
import sys
from pathlib import Path

# Configuração da página
st.set_page_config(
    page_title="Claude-CTO Dashboard Launcher",
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# CSS customizado
st.markdown("""
<style>
    .main-header {
        font-size: 3rem;
        font-weight: bold;
        text-align: center;
        margin-bottom: 2rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    .dashboard-card {
        background: white;
        border: 2px solid #e9ecef;
        border-radius: 15px;
        padding: 2rem;
        margin: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        text-align: center;
    }
    
    .dashboard-card:hover {
        border-color: #667eea;
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
    }
    
    .card-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }
    
    .card-title {
        font-size: 1.3rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
        color: #333;
    }
    
    .card-description {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 1rem;
    }
    
    .card-tools {
        background: #f8f9fa;
        border-radius: 20px;
        padding: 0.3rem 0.8rem;
        font-size: 0.8rem;
        color: #6c757d;
        display: inline-block;
    }
    
    .info-section {
        background: linear-gradient(135deg, #e7f3ff 0%, #d1ecf1 100%);
        border: 1px solid #17a2b8;
        border-radius: 12px;
        padding: 1.5rem;
        margin: 2rem 0;
    }
</style>
""", unsafe_allow_html=True)

class DashboardLauncher:
    def __init__(self):
        self.base_path = Path("/home/suthub/.claude/claude-cto")
        self.dashboards = [
            {
                "id": "create_task-5501",
                "icon": "➕",
                "title": "Create Task",
                "description": "Criar novas tarefas com formulário interativo",
                "tools": "mcp__claude-cto__create_task",
                "color": "#28a745"
            },
            {
                "id": "submit_orchestration-5502", 
                "icon": "🚀",
                "title": "Submit Orchestration",
                "description": "Lançar grupos de tarefas em orquestração",
                "tools": "mcp__claude-cto__submit_orchestration",
                "color": "#007bff"
            },
            {
                "id": "get_task_status-5503",
                "icon": "🔍", 
                "title": "Get Task Status",
                "description": "Consultar status específico de tarefas",
                "tools": "mcp__claude-cto__get_task_status",
                "color": "#17a2b8"
            },
            {
                "id": "list_tasks-5504",
                "icon": "📋",
                "title": "List Tasks", 
                "description": "Monitorar todas as tarefas em tempo real",
                "tools": "mcp__claude-cto__list_tasks",
                "color": "#6f42c1"
            },
            {
                "id": "clear_tasks-5505",
                "icon": "🧹",
                "title": "Clear Tasks",
                "description": "Limpar tarefas completadas e falhadas",
                "tools": "mcp__claude-cto__clear_tasks", 
                "color": "#dc3545"
            },
            {
                "id": "delete_task-5506",
                "icon": "🗑️",
                "title": "Delete Task",
                "description": "Remover tarefas específicas individualmente",
                "tools": "mcp__claude-cto__delete_task",
                "color": "#e74c3c"
            },
            {
                "id": "check_api_health-5507",
                "icon": "🏥",
                "title": "API Health Monitor",
                "description": "Monitorar saúde e diagnóstico da API",
                "tools": "Diagnóstico do Sistema",
                "color": "#6f42c1"
            }
        ]
    
    def render_dashboard_card(self, dashboard: Dict):
        """Renderiza card de um dashboard"""
        path = self.base_path / dashboard["id"]
        dashboard_file = path / "dashboard_mcp_integration.py"
        readme_file = path / "README.md"
        
        # Verificar se arquivos existem
        files_exist = dashboard_file.exists() and readme_file.exists()
        status_icon = "✅" if files_exist else "❌"
        
        st.markdown(f"""
        <div class="dashboard-card" style="border-color: {dashboard['color']};">
            <div class="card-icon">{dashboard['icon']}</div>
            <div class="card-title">{dashboard['title']} {status_icon}</div>
            <div class="card-description">{dashboard['description']}</div>
            <div class="card-tools">{dashboard['tools']}</div>
        </div>
        """, unsafe_allow_html=True)
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if st.button(f"🚀 Executar", key=f"run_{dashboard['id']}", disabled=not files_exist):
                self.launch_dashboard(dashboard['id'])
        
        with col2:
            if st.button(f"📖 README", key=f"readme_{dashboard['id']}", disabled=not readme_file.exists()):
                self.show_readme(dashboard['id'])
        
        with col3:
            if st.button(f"📁 Pasta", key=f"folder_{dashboard['id']}"):
                st.info(f"📁 Caminho: {path}")
    
    def launch_dashboard(self, dashboard_id: str):
        """Lança um dashboard específico"""
        dashboard_path = self.base_path / dashboard_id
        dashboard_file = dashboard_path / "dashboard_mcp_integration.py"
        
        if dashboard_file.exists():
            # Instruções para execução
            st.markdown(f"""
            <div class="info-section">
                <h4>🚀 Executar Dashboard: {dashboard_id}</h4>
                <p>Execute o seguinte comando no terminal:</p>
                <code>cd {dashboard_path} && streamlit run dashboard_mcp_integration.py</code>
                <br><br>
                <p>Ou use este comando direto:</p>
                <code>streamlit run {dashboard_file} --server.port 8501</code>
            </div>
            """, unsafe_allow_html=True)
        else:
            st.error(f"❌ Dashboard {dashboard_id} não encontrado")
    
    def show_readme(self, dashboard_id: str):
        """Mostra README de um dashboard"""
        readme_path = self.base_path / dashboard_id / "README.md"
        
        if readme_path.exists():
            with open(readme_path, 'r', encoding='utf-8') as f:
                readme_content = f.read()
            
            st.markdown(f"### 📖 README - {dashboard_id}")
            st.markdown(readme_content)
        else:
            st.error(f"❌ README não encontrado para {dashboard_id}")
    
    def run_launcher(self):
        """Interface principal do launcher"""
        # Cabeçalho
        st.markdown('<h1 class="main-header">🚀 Claude-CTO Dashboard Launcher</h1>', unsafe_allow_html=True)
        
        st.markdown("""
        <div class="info-section">
            <h4>🎯 Dashboards Especializados MCP</h4>
            <p>Cada dashboard é otimizado para uma ferramenta específica do claude-cto,
            fornecendo interface dedicada e funcionalidades especializadas.</p>
        </div>
        """, unsafe_allow_html=True)
        
        # Grid de dashboards
        cols = st.columns(2)
        
        for i, dashboard in enumerate(self.dashboards):
            with cols[i % 2]:
                self.render_dashboard_card(dashboard)
        
        # Informações gerais
        st.markdown("---")
        st.subheader("ℹ️ Informações Gerais")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("""
            **🔧 Configuração Necessária:**
            - API claude-cto rodando na porta 8889
            - Python com streamlit instalado
            - Dependências: requests, plotly, pandas
            """)
        
        with col2:
            st.markdown("""
            **📊 Ferramentas Disponíveis:**
            - Criação e gestão de tarefas
            - Orquestração e dependências
            - Monitoramento em tempo real
            - Limpeza e manutenção
            """)
        
        # Status do sistema
        st.markdown("### 🔍 Verificação Rápida do Sistema")
        
        if st.button("🏥 Verificar Saúde da API"):
            try:
                import requests
                response = requests.get("http://localhost:8889/health", timeout=5)
                if response.status_code == 200:
                    st.success("✅ API claude-cto está respondendo na porta 8889")
                else:
                    st.error(f"❌ API respondeu com status {response.status_code}")
            except:
                st.error("❌ API claude-cto não está acessível na porta 8889")

def main():
    """Função principal"""
    launcher = DashboardLauncher()
    launcher.run_launcher()

if __name__ == "__main__":
    main()