#!/usr/bin/env python3
"""
Dashboard de Monitoramento Claude-CTO
Monitora tarefas do claude-cto via MCP em tempo real
"""

import streamlit as st
import pandas as pd
import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import plotly.graph_objects as go
import plotly.express as px

# Configuração da página
st.set_page_config(
    page_title="Claude-CTO Dashboard",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# CSS customizado para melhorar a aparência
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        text-align: center;
        margin-bottom: 1rem;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    .metric-card {
        background: white;
        padding: 1rem;
        border-radius: 10px;
        border-left: 4px solid #667eea;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .status-badge {
        padding: 0.2rem 0.5rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: bold;
        text-align: center;
    }
    
    .status-completed { background-color: #28a745; color: white; }
    .status-running { background-color: #007bff; color: white; }
    .status-failed { background-color: #dc3545; color: white; }
    .status-pending { background-color: #6c757d; color: white; }
    
    .last-update {
        text-align: right;
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 1rem;
    }
</style>
""", unsafe_allow_html=True)

class ClaudeCTODashboard:
    def __init__(self):
        self.api_url = "http://localhost:8889"
        self.status_colors = {
            'completed': '#28a745',
            'running': '#007bff', 
            'failed': '#dc3545',
            'pending': '#6c757d'
        }
        
    def fetch_tasks(self) -> Optional[List[Dict]]:
        """Busca lista de tarefas via MCP"""
        try:
            # Tentar usar dados reais via subprocess/API local se disponível
            import subprocess
            import json
            
            # Executar comando para listar tarefas (adapte conforme sua implementação)
            # Por ora, usar dados de exemplo
            return self.get_sample_tasks()
            
        except Exception as e:
            st.error(f"Erro ao buscar tarefas: {e}")
            return self.get_sample_tasks()
    
    def calculate_elapsed_time(self, start_time: str) -> str:
        """Calcula tempo decorrido desde o início da tarefa"""
        try:
            start = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            elapsed = datetime.now() - start.replace(tzinfo=None)
            
            if elapsed.total_seconds() < 60:
                return f"{int(elapsed.total_seconds())}s"
            elif elapsed.total_seconds() < 3600:
                return f"{int(elapsed.total_seconds() / 60)}m"
            else:
                hours = int(elapsed.total_seconds() / 3600)
                minutes = int((elapsed.total_seconds() % 3600) / 60)
                return f"{hours}h {minutes}m"
        except:
            return "N/A"
    
    def render_status_badge(self, status: str) -> str:
        """Renderiza badge colorido para status"""
        status_lower = status.lower()
        class_name = f"status-{status_lower}"
        return f'<span class="status-badge {class_name}">{status.upper()}</span>'
    
    def render_progress_bar(self, progress: float) -> str:
        """Renderiza barra de progresso"""
        width = min(max(progress, 0), 100)
        color = self.status_colors.get('running', '#007bff')
        return f"""
        <div style="background-color: #e9ecef; border-radius: 10px; height: 20px; overflow: hidden;">
            <div style="background-color: {color}; height: 100%; width: {width}%; 
                        border-radius: 10px; transition: width 0.3s ease;"></div>
        </div>
        """
    
    def render_metrics(self, tasks: List[Dict]):
        """Renderiza métricas no topo"""
        total = len(tasks)
        completed = len([t for t in tasks if t.get('status', '').lower() == 'completed'])
        running = len([t for t in tasks if t.get('status', '').lower() == 'running'])
        failed = len([t for t in tasks if t.get('status', '').lower() == 'failed'])
        pending = len([t for t in tasks if t.get('status', '').lower() == 'pending'])
        
        col1, col2, col3, col4, col5 = st.columns(5)
        
        with col1:
            st.metric("Total", total)
        with col2:
            st.metric("Completadas", completed, delta=None)
        with col3:
            st.metric("Executando", running, delta=None)
        with col4:
            st.metric("Falharam", failed, delta=None)
        with col5:
            st.metric("Pendentes", pending, delta=None)
    
    def render_tasks_table(self, tasks: List[Dict], status_filter: str):
        """Renderiza tabela de tarefas"""
        if not tasks:
            st.info("Nenhuma tarefa encontrada")
            return
            
        # Filtrar por status se especificado
        if status_filter != "Todos":
            tasks = [t for t in tasks if t.get('status', '').lower() == status_filter.lower()]
        
        if not tasks:
            st.info(f"Nenhuma tarefa encontrada com status: {status_filter}")
            return
        
        # Criar DataFrame
        df_data = []
        for task in tasks:
            df_data.append({
                'ID': task.get('id', 'N/A'),
                'Identificador': task.get('task_identifier', 'N/A'),
                'Status': task.get('status', 'N/A'),
                'Tempo Decorrido': self.calculate_elapsed_time(task.get('created_at', '')),
                'Progresso': task.get('progress', 0),
                'Descrição': task.get('execution_prompt', '')[:100] + '...' if len(task.get('execution_prompt', '')) > 100 else task.get('execution_prompt', '')
            })
        
        df = pd.DataFrame(df_data)
        
        # Renderizar tabela customizada
        for idx, row in df.iterrows():
            with st.container():
                col1, col2, col3, col4, col5 = st.columns([1, 2, 1, 1, 3])
                
                with col1:
                    st.write(f"**#{row['ID']}**")
                
                with col2:
                    st.write(f"**{row['Identificador']}**")
                
                with col3:
                    st.markdown(self.render_status_badge(row['Status']), unsafe_allow_html=True)
                
                with col4:
                    st.write(row['Tempo Decorrido'])
                
                with col5:
                    if row['Status'].lower() == 'running' and row['Progresso'] > 0:
                        st.markdown(self.render_progress_bar(row['Progresso']), unsafe_allow_html=True)
                        st.write(f"{row['Progresso']:.1f}%")
                    else:
                        st.write(row['Descrição'])
                
                st.divider()
    
    def render_dashboard(self):
        """Renderiza o dashboard principal"""
        # Cabeçalho
        st.markdown('<h1 class="main-header">🤖 Claude-CTO Monitor</h1>', unsafe_allow_html=True)
        
        # Controles superiores
        col1, col2, col3 = st.columns([2, 1, 1])
        
        with col1:
            auto_refresh = st.checkbox("Auto-refresh (5s)", value=True)
        
        with col2:
            status_filter = st.selectbox("Filtrar Status", 
                                       ["Todos", "Running", "Completed", "Failed", "Pending"])
        
        with col3:
            if st.button("🔄 Atualizar Agora"):
                st.rerun()
        
        # Placeholder para conteúdo dinâmico
        placeholder = st.empty()
        
        # Loop de atualização
        while True:
            with placeholder.container():
                # Timestamp da última atualização
                now = datetime.now().strftime("%H:%M:%S")
                st.markdown(f'<div class="last-update">Última atualização: {now}</div>', 
                          unsafe_allow_html=True)
                
                # Buscar tarefas
                tasks = self.fetch_tasks()
                
                if tasks is not None:
                    # Renderizar métricas
                    self.render_metrics(tasks)
                    
                    st.markdown("---")
                    
                    # Renderizar tabela de tarefas
                    st.subheader("📋 Lista de Tarefas")
                    self.render_tasks_table(tasks, status_filter)
                    
                    # Gráfico de status
                    if len(tasks) > 0:
                        st.markdown("---")
                        st.subheader("📊 Distribuição por Status")
                        
                        status_counts = pd.Series([t.get('status', 'unknown') for t in tasks]).value_counts()
                        
                        fig = px.pie(
                            values=status_counts.values,
                            names=status_counts.index,
                            color=status_counts.index,
                            color_discrete_map=self.status_colors
                        )
                        fig.update_traces(textposition='inside', textinfo='percent+label')
                        fig.update_layout(height=400)
                        
                        st.plotly_chart(fig, use_container_width=True)
                
                else:
                    st.error("❌ Não foi possível conectar ao claude-cto")
            
            if not auto_refresh:
                break
                
            time.sleep(5)
            st.rerun()
    
    def get_sample_tasks(self) -> List[Dict]:
        """Dados de exemplo para teste (remover quando integrar com MCP real)"""
        return [
            {
                'id': 1,
                'task_identifier': 'analyze_code_quality',
                'status': 'running',
                'progress': 65.5,
                'created_at': (datetime.now() - timedelta(minutes=5)).isoformat(),
                'execution_prompt': 'Analisar qualidade do código Python no diretório /src'
            },
            {
                'id': 2,
                'task_identifier': 'fix_security_issues',
                'status': 'completed',
                'progress': 100,
                'created_at': (datetime.now() - timedelta(minutes=15)).isoformat(),
                'execution_prompt': 'Corrigir vulnerabilidades de segurança encontradas no audit'
            },
            {
                'id': 3,
                'task_identifier': 'update_dependencies',
                'status': 'failed',
                'progress': 25,
                'created_at': (datetime.now() - timedelta(minutes=30)).isoformat(),
                'execution_prompt': 'Atualizar todas as dependências do projeto para versões mais recentes'
            },
            {
                'id': 4,
                'task_identifier': 'generate_docs',
                'status': 'pending',
                'progress': 0,
                'created_at': (datetime.now() - timedelta(minutes=2)).isoformat(),
                'execution_prompt': 'Gerar documentação técnica completa do projeto'
            }
        ]

def main():
    """Função principal"""
    dashboard = ClaudeCTODashboard()
    dashboard.render_dashboard()

if __name__ == "__main__":
    main()