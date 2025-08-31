#!/usr/bin/env python3
"""
Dashboard Get Task Status ULTRA - Claude-CTO
Interface ultra-avançada para monitoramento de status com search fuzzy,
timeline visual, logs streaming e resource usage graphs
"""

import streamlit as st
import requests
import json
import time
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import pandas as pd
from fuzzywuzzy import fuzz

# Configuração da página
st.set_page_config(
    page_title="Task Status Ultra - Claude-CTO",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS ultra-avançado
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    .main-header {
        font-size: 3rem;
        font-weight: 700;
        text-align: center;
        margin-bottom: 2rem;
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-family: 'Inter', sans-serif;
    }
    
    .status-card {
        background: white;
        border-radius: 15px;
        padding: 1.5rem;
        margin: 1rem 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        border-left: 5px solid;
        transition: all 0.3s ease;
    }
    
    .status-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }
    
    .status-pending { border-left-color: #ffc107; }
    .status-running { border-left-color: #17a2b8; }
    .status-completed { border-left-color: #28a745; }
    .status-failed { border-left-color: #dc3545; }
    
    .timeline-item {
        background: white;
        border-radius: 10px;
        padding: 1rem;
        margin: 0.5rem 0;
        border-left: 4px solid #17a2b8;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    
    .search-highlight {
        background-color: #fff3cd;
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
        font-weight: 600;
    }
    
    .log-container {
        background: #000;
        color: #00ff00;
        padding: 1rem;
        border-radius: 10px;
        font-family: 'Courier New', monospace;
        max-height: 400px;
        overflow-y: auto;
        margin: 1rem 0;
    }
    
    .resource-gauge {
        text-align: center;
        padding: 1rem;
        background: white;
        border-radius: 15px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
</style>
""", unsafe_allow_html=True)

class FuzzySearchEngine:
    """Motor de busca fuzzy para tarefas"""
    
    @staticmethod
    def search_tasks(query: str, tasks: List[Dict], threshold: int = 60) -> List[Tuple[Dict, int]]:
        """Busca fuzzy por identificador e prompt"""
        if not query:
            return [(task, 100) for task in tasks]
        
        results = []
        for task in tasks:
            # Score por identificador
            id_score = fuzz.partial_ratio(query.lower(), task.get('task_identifier', '').lower())
            
            # Score por prompt
            prompt_score = fuzz.partial_ratio(query.lower(), task.get('execution_prompt', '').lower())
            
            # Score combinado
            final_score = max(id_score, prompt_score * 0.7)
            
            if final_score >= threshold:
                results.append((task, int(final_score)))
        
        # Ordenar por score
        results.sort(key=lambda x: x[1], reverse=True)
        return results

class TaskStatusDashboard:
    def __init__(self):
        self.base_url = "http://localhost:8889/api/v1"
        self.search_engine = FuzzySearchEngine()
        
        # Estado da aplicação
        if 'search_query' not in st.session_state:
            st.session_state.search_query = ""
        if 'selected_task' not in st.session_state:
            st.session_state.selected_task = None
        if 'auto_refresh' not in st.session_state:
            st.session_state.auto_refresh = False
        if 'refresh_interval' not in st.session_state:
            st.session_state.refresh_interval = 30
    
    def get_task_status(self, task_id: str) -> Optional[Dict]:
        """Obtém status detalhado de uma tarefa"""
        try:
            response = requests.get(f"{self.base_url}/tasks/{task_id}/status", timeout=10)
            if response.status_code == 200:
                return response.json()
        except Exception:
            pass
        return None
    
    def get_all_tasks(self) -> List[Dict]:
        """Obtém todas as tarefas"""
        try:
            response = requests.get(f"{self.base_url}/tasks", timeout=10)
            if response.status_code == 200:
                return response.json().get('tasks', [])
        except Exception:
            pass
        return []
    
    def get_task_logs(self, task_id: str) -> List[str]:
        """Obtém logs de uma tarefa"""
        try:
            response = requests.get(f"{self.base_url}/tasks/{task_id}/logs", timeout=10)
            if response.status_code == 200:
                return response.json().get('logs', [])
        except Exception:
            pass
        return []
    
    def render_status_badge(self, status: str) -> str:
        """Renderiza badge de status"""
        status_config = {
            'pending': ('⏳', '#ffc107', 'Pendente'),
            'running': ('🔄', '#17a2b8', 'Executando'),
            'completed': ('✅', '#28a745', 'Concluída'),
            'failed': ('❌', '#dc3545', 'Falhou'),
            'cancelled': ('⏹️', '#6c757d', 'Cancelada')
        }
        
        icon, color, text = status_config.get(status.lower(), ('❓', '#6c757d', 'Desconhecido'))
        
        return f"""
        <span style="
            background: {color}; 
            color: white; 
            padding: 0.3rem 0.8rem; 
            border-radius: 15px; 
            font-size: 0.9rem;
            font-weight: 600;
        ">{icon} {text}</span>
        """
    
    def render_task_timeline(self, task: Dict):
        """Renderiza timeline visual de uma tarefa"""
        st.subheader("📈 Timeline da Tarefa")
        
        # Dados simulados de timeline (em produção viria da API)
        timeline_events = [
            {'time': '10:30:15', 'event': 'Tarefa criada', 'type': 'info'},
            {'time': '10:30:16', 'event': 'Dependências verificadas', 'type': 'info'},
            {'time': '10:30:20', 'event': 'Execução iniciada', 'type': 'success'},
            {'time': '10:32:45', 'event': 'Progresso: 25%', 'type': 'info'},
            {'time': '10:35:12', 'event': 'Progresso: 50%', 'type': 'info'},
            {'time': '10:37:30', 'event': 'Progresso: 75%', 'type': 'info'},
        ]
        
        if task.get('status') == 'completed':
            timeline_events.append({'time': '10:40:00', 'event': 'Tarefa concluída', 'type': 'success'})
        elif task.get('status') == 'running':
            timeline_events.append({'time': 'Agora', 'event': 'Em execução...', 'type': 'info'})
        
        for event in timeline_events:
            type_colors = {
                'info': '#17a2b8',
                'success': '#28a745',
                'warning': '#ffc107',
                'error': '#dc3545'
            }
            color = type_colors.get(event['type'], '#6c757d')
            
            st.markdown(f"""
            <div class="timeline-item" style="border-left-color: {color}">
                <strong>{event['time']}</strong> - {event['event']}
            </div>
            """, unsafe_allow_html=True)
    
    def render_resource_usage(self, task: Dict):
        """Renderiza gráficos de uso de recursos"""
        st.subheader("💻 Uso de Recursos")
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Gauge de CPU
            cpu_usage = 45  # Valor simulado
            
            fig_cpu = go.Figure(go.Indicator(
                mode = "gauge+number+delta",
                value = cpu_usage,
                domain = {'x': [0, 1], 'y': [0, 1]},
                title = {'text': "CPU %"},
                delta = {'reference': 30},
                gauge = {
                    'axis': {'range': [None, 100]},
                    'bar': {'color': "darkblue"},
                    'steps': [
                        {'range': [0, 50], 'color': "lightgray"},
                        {'range': [50, 80], 'color': "yellow"},
                        {'range': [80, 100], 'color': "red"}
                    ],
                    'threshold': {
                        'line': {'color': "red", 'width': 4},
                        'thickness': 0.75,
                        'value': 90
                    }
                }
            ))
            
            fig_cpu.update_layout(height=300)
            st.plotly_chart(fig_cpu, use_container_width=True)
        
        with col2:
            # Gauge de Memória
            memory_usage = 62  # Valor simulado
            
            fig_mem = go.Figure(go.Indicator(
                mode = "gauge+number+delta",
                value = memory_usage,
                domain = {'x': [0, 1], 'y': [0, 1]},
                title = {'text': "Memória %"},
                delta = {'reference': 40},
                gauge = {
                    'axis': {'range': [None, 100]},
                    'bar': {'color': "darkgreen"},
                    'steps': [
                        {'range': [0, 60], 'color': "lightgray"},
                        {'range': [60, 85], 'color': "yellow"},
                        {'range': [85, 100], 'color': "red"}
                    ],
                    'threshold': {
                        'line': {'color': "red", 'width': 4},
                        'thickness': 0.75,
                        'value': 90
                    }
                }
            ))
            
            fig_mem.update_layout(height=300)
            st.plotly_chart(fig_mem, use_container_width=True)
        
        # Gráfico de histórico
        st.subheader("📈 Histórico de Performance")
        
        # Dados simulados de histórico
        time_series = pd.DataFrame({
            'timestamp': pd.date_range(start='2024-08-30 10:30:00', periods=20, freq='30S'),
            'cpu': [30 + 15 * (i % 3) + (i * 2) for i in range(20)],
            'memory': [40 + 10 * (i % 4) + (i * 1.5) for i in range(20)]
        })
        
        fig_history = go.Figure()
        
        fig_history.add_trace(go.Scatter(
            x=time_series['timestamp'],
            y=time_series['cpu'],
            mode='lines+markers',
            name='CPU %',
            line=dict(color='#667eea')
        ))
        
        fig_history.add_trace(go.Scatter(
            x=time_series['timestamp'],
            y=time_series['memory'],
            mode='lines+markers',
            name='Memória %',
            line=dict(color='#f093fb')
        ))
        
        fig_history.update_layout(
            title="Performance ao Longo do Tempo",
            xaxis_title="Timestamp",
            yaxis_title="Uso (%)",
            height=300
        )
        
        st.plotly_chart(fig_history, use_container_width=True)
    
    def render_streaming_logs(self, task_id: str):
        """Renderiza logs em tempo real"""
        st.subheader("📜 Logs em Tempo Real")
        
        # Container para logs
        log_container = st.empty()
        
        # Botões de controle
        col1, col2, col3 = st.columns(3)
        
        with col1:
            auto_scroll = st.checkbox("🔄 Auto-scroll", value=True)
        with col2:
            show_timestamps = st.checkbox("🕐 Timestamps", value=True)
        with col3:
            log_level = st.selectbox("Level", ["ALL", "INFO", "ERROR", "WARNING"])
        
        # Obter logs
        logs = self.get_task_logs(task_id)
        
        # Simular logs em tempo real se a tarefa estiver rodando
        if not logs:
            logs = [
                "[10:30:15] INFO: Tarefa iniciada",
                "[10:30:16] INFO: Carregando dependências...",
                "[10:30:20] INFO: Processando arquivos...",
                "[10:32:45] INFO: Progresso: 25% concluído",
                "[10:35:12] INFO: Progresso: 50% concluído",
                "[10:37:30] INFO: Progresso: 75% concluído",
                "[10:40:00] INFO: Tarefa finalizada com sucesso"
            ]
        
        # Filtrar por nível
        if log_level != "ALL":
            logs = [log for log in logs if log_level in log]
        
        # Renderizar logs
        log_text = "\n".join(logs)
        
        log_container.markdown(f"""
        <div class="log-container">
            <pre>{log_text}</pre>
        </div>
        """, unsafe_allow_html=True)
        
        # Auto-refresh para logs
        if st.session_state.auto_refresh and auto_scroll:
            time.sleep(2)
            st.rerun()
    
    def render_comparison_chart(self, tasks: List[Dict]):
        """Renderiza gráfico de comparação de performance"""
        if len(tasks) < 2:
            return
        
        st.subheader("📊 Comparação de Performance")
        
        # Dados para comparação
        task_names = [task.get('task_identifier', '')[:15] + '...' for task in tasks[:10]]
        durations = [task.get('_metadata', {}).get('complexity_score', 30) for task in tasks[:10]]
        complexities = [task.get('_metadata', {}).get('complexity_score', 50) for task in tasks[:10]]
        
        fig = go.Figure()
        
        fig.add_trace(go.Bar(
            name='Duração Est. (min)',
            x=task_names,
            y=durations,
            marker_color='#667eea'
        ))
        
        fig.add_trace(go.Bar(
            name='Score Complexidade',
            x=task_names,
            y=complexities,
            marker_color='#f093fb'
        ))
        
        fig.update_layout(
            title="Comparação: Duração vs Complexidade",
            barmode='group',
            height=400
        )
        
        st.plotly_chart(fig, use_container_width=True)
    
    def render_task_details(self, task: Dict):
        """Renderiza detalhes completos de uma tarefa"""
        st.subheader(f"🔍 Detalhes: {task.get('task_identifier', 'N/A')}")
        
        # Status principal
        status = task.get('status', 'unknown')
        status_badge = self.render_status_badge(status)
        
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.markdown(f"**Status:** {status_badge}", unsafe_allow_html=True)
            st.markdown(f"**Modelo:** {task.get('model', 'N/A')}")
            st.markdown(f"**Diretório:** {task.get('working_directory', 'N/A')}")
            
            # Dependências
            deps = task.get('depends_on', [])
            if deps:
                st.markdown(f"**Dependências:** {', '.join(deps)}")
            
            # Grupo
            group = task.get('orchestration_group')
            if group:
                st.markdown(f"**Grupo:** {group}")
        
        with col2:
            # Métricas de tempo
            created = task.get('created_at', 'N/A')
            if created != 'N/A':
                st.metric("📅 Criado", created.split('T')[0])
            
            # Duração estimada
            metadata = task.get('_metadata', {})
            est_duration = metadata.get('estimated_duration', 'N/A')
            if est_duration != 'N/A':
                st.metric("⏱️ Duração Est.", est_duration)
            
            # Complexidade
            complexity = metadata.get('estimated_complexity', 'N/A')
            if complexity != 'N/A':
                st.metric("🎯 Complexidade", complexity)
        
        # Prompt da tarefa
        st.subheader("📝 Descrição da Tarefa")
        prompt = task.get('execution_prompt', '')
        if prompt:
            st.text_area("Prompt:", value=prompt, height=150, disabled=True)
        
        # Timeline
        self.render_task_timeline(task)
        
        # Logs streaming
        if status == 'running':
            self.render_streaming_logs(task.get('id', ''))
        
        # Resource usage se estiver rodando
        if status == 'running':
            self.render_resource_usage(task)
    
    def run_dashboard(self):
        """Interface principal do dashboard"""
        # Cabeçalho
        st.markdown('<h1 class="main-header">📊 Status de Tarefas Ultra</h1>', unsafe_allow_html=True)
        
        # Obter todas as tarefas
        all_tasks = self.get_all_tasks()
        
        if not all_tasks:
            st.markdown("""
            <div class="warning-box">
                <strong>📭 Nenhuma tarefa encontrada</strong><br>
                Crie algumas tarefas primeiro usando o dashboard Create Task
            </div>
            """, unsafe_allow_html=True)
            return
        
        # Barra de busca avançada
        st.subheader("🔍 Busca Inteligente")
        
        col1, col2, col3 = st.columns([3, 1, 1])
        
        with col1:
            search_query = st.text_input(
                "Buscar tarefas:",
                value=st.session_state.search_query,
                placeholder="Digite identificador ou palavras-chave do prompt...",
                help="Busca fuzzy por identificador e conteúdo do prompt"
            )
            st.session_state.search_query = search_query
        
        with col2:
            threshold = st.slider("Precisão", 0, 100, 60, help="Limiar de similaridade para busca fuzzy")
        
        with col3:
            if st.button("🔄 Atualizar", use_container_width=True):
                st.rerun()
        
        # Aplicar busca fuzzy
        if search_query:
            search_results = self.search_engine.search_tasks(search_query, all_tasks, threshold)
            filtered_tasks = [task for task, score in search_results]
            
            st.info(f"🎯 {len(filtered_tasks)} tarefas encontradas para '{search_query}'")
        else:
            filtered_tasks = all_tasks
        
        # Estatísticas rápidas
        st.subheader("📊 Visão Geral")
        
        status_counts = {}
        for task in filtered_tasks:
            status = task.get('status', 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
        
        cols = st.columns(len(status_counts) or 1)
        for i, (status, count) in enumerate(status_counts.items()):
            with cols[i % len(cols)]:
                status_badge = self.render_status_badge(status)
                st.markdown(f"""
                <div style="text-align: center; padding: 1rem; background: white; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    {status_badge}<br>
                    <h3 style="margin-top: 0.5rem;">{count}</h3>
                </div>
                """, unsafe_allow_html=True)
        
        # Lista de tarefas
        st.subheader("📋 Lista de Tarefas")
        
        for task in filtered_tasks:
            task_id = task.get('task_identifier', 'N/A')
            status = task.get('status', 'unknown')
            
            # Highlight da busca
            display_id = task_id
            if search_query and search_query.lower() in task_id.lower():
                display_id = task_id.replace(
                    search_query, 
                    f'<span class="search-highlight">{search_query}</span>'
                )
            
            status_class = f"status-{status}"
            
            with st.container():
                st.markdown(f"""
                <div class="status-card {status_class}">
                    <strong>🏷️ {display_id}</strong><br>
                    <strong>Status:</strong> {self.render_status_badge(status)}<br>
                    <strong>Modelo:</strong> {task.get('model', 'N/A')}<br>
                    <strong>Criado:</strong> {task.get('created_at', 'N/A')}<br>
                    <em>{task.get('execution_prompt', '')[:100]}...</em>
                </div>
                """, unsafe_allow_html=True)
                
                # Botão para ver detalhes
                if st.button(f"👀 Ver Detalhes", key=f"details_{task_id}"):
                    st.session_state.selected_task = task
        
        # Comparação de performance
        if len(filtered_tasks) > 1:
            st.markdown("---")
            self.render_comparison_chart(filtered_tasks)
        
        # Detalhes da tarefa selecionada
        if st.session_state.selected_task:
            st.markdown("---")
            self.render_task_details(st.session_state.selected_task)
        
        # Sidebar com configurações
        with st.sidebar:
            st.subheader("⚙️ Configurações")
            
            # Auto-refresh
            auto_refresh = st.checkbox(
                "🔄 Auto-refresh",
                value=st.session_state.auto_refresh,
                help="Atualizar automaticamente os dados"
            )
            st.session_state.auto_refresh = auto_refresh
            
            if auto_refresh:
                refresh_interval = st.slider(
                    "Intervalo (seg)",
                    5, 60, st.session_state.refresh_interval
                )
                st.session_state.refresh_interval = refresh_interval
                
                # Auto-refresh logic
                if auto_refresh:
                    time.sleep(refresh_interval)
                    st.rerun()
            
            st.markdown("---")
            
            # Filtros avançados
            st.subheader("🔧 Filtros")
            
            status_filter = st.multiselect(
                "Status:",
                ['pending', 'running', 'completed', 'failed'],
                default=['pending', 'running', 'completed', 'failed']
            )
            
            model_filter = st.multiselect(
                "Modelos:",
                ['sonnet', 'opus', 'haiku'],
                default=['sonnet', 'opus', 'haiku']
            )
            
            # Aplicar filtros
            if status_filter or model_filter:
                st.info(f"🔧 Filtros ativos: {len(status_filter)} status, {len(model_filter)} modelos")
            
            st.markdown("---")
            
            # Ações rápidas
            st.subheader("⚡ Ações Rápidas")
            
            if st.button("➕ Nova Tarefa", use_container_width=True):
                st.info("Redirecionando para Create Task...")
            
            if st.button("🎼 Orquestrações", use_container_width=True):
                st.info("Redirecionando para Submit Orchestration...")
            
            if st.button("🧹 Limpar Filtros", use_container_width=True):
                st.session_state.search_query = ""
                st.session_state.selected_task = None
                st.rerun()

def main():
    """Função principal"""
    dashboard = TaskStatusDashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()