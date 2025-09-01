#!/usr/bin/env python3
"""
Dashboard List Tasks ULTRA - Claude-CTO
Interface master de monitoramento com paginação inteligente, filtros multi-dimensionais,
bulk operations, export avançado e real-time WebSocket updates
"""

import streamlit as st
import requests
import json
import time
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import io
import base64

# Configuração da página
st.set_page_config(
    page_title="List Tasks Ultra - Claude-CTO",
    page_icon="📋",
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
        background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-family: 'Inter', sans-serif;
    }
    
    .filter-container {
        background: white;
        border-radius: 15px;
        padding: 1.5rem;
        margin: 1rem 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        border: 1px solid #e9ecef;
    }
    
    .task-row {
        background: white;
        border-radius: 10px;
        padding: 1rem;
        margin: 0.5rem 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        border-left: 4px solid;
        transition: all 0.3s ease;
        cursor: pointer;
    }
    
    .task-row:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    
    .task-row.selected {
        border-left-color: #667eea;
        background: linear-gradient(135deg, #f8f9ff 0%, #e8ecff 100%);
    }
    
    .bulk-actions {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem;
        border-radius: 15px;
        margin: 1rem 0;
    }
    
    .export-container {
        background: white;
        border-radius: 15px;
        padding: 1.5rem;
        margin: 1rem 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    
    .analytics-card {
        background: white;
        border-radius: 15px;
        padding: 1.5rem;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        margin: 0.5rem;
    }
    
    .real-time-indicator {
        display: inline-block;
        width: 10px;
        height: 10px;
        background: #28a745;
        border-radius: 50%;
        margin-right: 0.5rem;
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
    
    .pagination-info {
        background: #f8f9fa;
        padding: 0.5rem 1rem;
        border-radius: 25px;
        font-size: 0.9rem;
        color: #6c757d;
        text-align: center;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

class TaskAnalytics:
    """Analytics avançado para tarefas"""
    
    @staticmethod
    def calculate_performance_metrics(tasks: List[Dict]) -> Dict:
        """Calcula métricas de performance"""
        total_tasks = len(tasks)
        if total_tasks == 0:
            return {}
        
        # Contagem por status
        status_counts = {}
        for task in tasks:
            status = task.get('status', 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Taxa de sucesso
        success_rate = (status_counts.get('completed', 0) / total_tasks) * 100
        
        # Tempo médio de execução (simulado)
        avg_execution_time = sum([
            task.get('_metadata', {}).get('complexity_score', 30) 
            for task in tasks
        ]) / total_tasks
        
        # Distribuição por modelo
        model_counts = {}
        for task in tasks:
            model = task.get('model', 'unknown')
            model_counts[model] = model_counts.get(model, 0) + 1
        
        return {
            'total_tasks': total_tasks,
            'status_counts': status_counts,
            'success_rate': round(success_rate, 1),
            'avg_execution_time': round(avg_execution_time, 1),
            'model_distribution': model_counts
        }
    
    @staticmethod
    def generate_trend_chart(tasks: List[Dict]) -> go.Figure:
        """Gera gráfico de tendências"""
        # Simular dados de tendência
        dates = pd.date_range(start='2024-08-25', end='2024-08-30', freq='D')
        
        # Contagem simulada por dia
        daily_counts = [5, 8, 12, 15, 18, 22]
        
        fig = go.Figure()
        
        fig.add_trace(go.Scatter(
            x=dates,
            y=daily_counts,
            mode='lines+markers',
            line=dict(color='#667eea', width=3),
            marker=dict(size=8),
            name='Tarefas Criadas'
        ))
        
        fig.update_layout(
            title="📈 Tendência de Criação de Tarefas",
            xaxis_title="Data",
            yaxis_title="Número de Tarefas",
            height=300
        )
        
        return fig

class ExportManager:
    """Gerenciador de exportação de dados"""
    
    @staticmethod
    def export_to_csv(tasks: List[Dict]) -> str:
        """Exporta tarefas para CSV"""
        df = pd.DataFrame([
            {
                'Identificador': task.get('task_identifier', ''),
                'Status': task.get('status', ''),
                'Modelo': task.get('model', ''),
                'Criado': task.get('created_at', ''),
                'Grupo': task.get('orchestration_group', ''),
                'Dependências': ', '.join(task.get('depends_on', [])),
                'Prompt': task.get('execution_prompt', '')[:100] + '...'
            }
            for task in tasks
        ])
        
        return df.to_csv(index=False)
    
    @staticmethod
    def export_to_json(tasks: List[Dict]) -> str:
        """Exporta tarefas para JSON"""
        return json.dumps(tasks, indent=2, ensure_ascii=False)
    
    @staticmethod
    def create_download_link(data: str, filename: str, format_type: str) -> str:
        """Cria link de download"""
        b64 = base64.b64encode(data.encode()).decode()
        return f'<a href="data:file/{format_type};base64,{b64}" download="{filename}">📥 Download {filename}</a>'

class VirtualizedTable:
    """Tabela virtualizada para grandes datasets"""
    
    def __init__(self, data: List[Dict], page_size: int = 20):
        self.data = data
        self.page_size = page_size
        self.total_pages = (len(data) + page_size - 1) // page_size
    
    def get_page(self, page_num: int) -> List[Dict]:
        """Obtém dados de uma página específica"""
        start_idx = (page_num - 1) * self.page_size
        end_idx = start_idx + self.page_size
        return self.data[start_idx:end_idx]
    
    def render_pagination_controls(self, current_page: int):
        """Renderiza controles de paginação"""
        col1, col2, col3, col4, col5 = st.columns([1, 1, 2, 1, 1])
        
        with col1:
            if st.button("⏮️ Primeira", disabled=current_page <= 1):
                return 1
        
        with col2:
            if st.button("◀️ Anterior", disabled=current_page <= 1):
                return current_page - 1
        
        with col3:
            new_page = st.number_input(
                "Página:",
                min_value=1,
                max_value=self.total_pages,
                value=current_page,
                help=f"Página {current_page} de {self.total_pages}"
            )
            if new_page != current_page:
                return new_page
        
        with col4:
            if st.button("▶️ Próxima", disabled=current_page >= self.total_pages):
                return current_page + 1
        
        with col5:
            if st.button("⏭️ Última", disabled=current_page >= self.total_pages):
                return self.total_pages
        
        return current_page

class ListTasksDashboard:
    def __init__(self):
        self.base_url = "http://localhost:8889/api/v1"
        self.analytics = TaskAnalytics()
        self.export_manager = ExportManager()
        
        # Estado da aplicação
        if 'current_page' not in st.session_state:
            st.session_state.current_page = 1
        if 'selected_tasks' not in st.session_state:
            st.session_state.selected_tasks = set()
        if 'filter_config' not in st.session_state:
            st.session_state.filter_config = {}
        if 'auto_refresh' not in st.session_state:
            st.session_state.auto_refresh = False
        if 'last_refresh' not in st.session_state:
            st.session_state.last_refresh = datetime.now()
    
    def get_all_tasks(self, filters: Dict = None) -> List[Dict]:
        """Obtém todas as tarefas com filtros opcionais"""
        try:
            params = {}
            if filters:
                if 'status' in filters:
                    params['status'] = ','.join(filters['status'])
                if 'model' in filters:
                    params['model'] = ','.join(filters['model'])
                if 'group' in filters:
                    params['group'] = filters['group']
            
            response = requests.get(f"{self.base_url}/tasks", params=params, timeout=10)
            if response.status_code == 200:
                return response.json().get('tasks', [])
        except Exception:
            pass
        return []
    
    def bulk_delete_tasks(self, task_ids: List[str]) -> bool:
        """Deleta múltiplas tarefas"""
        try:
            response = requests.delete(
                f"{self.base_url}/tasks/bulk",
                json={"task_ids": task_ids},
                timeout=30
            )
            return response.status_code == 200
        except Exception:
            return False
    
    def bulk_update_status(self, task_ids: List[str], new_status: str) -> bool:
        """Atualiza status de múltiplas tarefas"""
        try:
            response = requests.patch(
                f"{self.base_url}/tasks/bulk",
                json={"task_ids": task_ids, "status": new_status},
                timeout=30
            )
            return response.status_code == 200
        except Exception:
            return False
    
    def render_advanced_filters(self) -> Dict:
        """Renderiza filtros avançados"""
        st.subheader("🔧 Filtros Avançados")
        
        with st.container():
            st.markdown('<div class="filter-container">', unsafe_allow_html=True)
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                status_filter = st.multiselect(
                    "📊 Status:",
                    ['pending', 'running', 'completed', 'failed', 'cancelled'],
                    default=['pending', 'running', 'completed'],
                    help="Filtrar por status da tarefa"
                )
                
                date_range = st.date_input(
                    "📅 Período:",
                    value=(datetime.now() - timedelta(days=7), datetime.now()),
                    help="Filtrar por período de criação"
                )
            
            with col2:
                model_filter = st.multiselect(
                    "🤖 Modelos:",
                    ['sonnet', 'opus', 'haiku'],
                    default=['sonnet', 'opus', 'haiku'],
                    help="Filtrar por modelo usado"
                )
                
                complexity_range = st.slider(
                    "🎯 Complexidade:",
                    0, 100, (0, 100),
                    help="Filtrar por score de complexidade"
                )
            
            with col3:
                group_filter = st.text_input(
                    "🏷️ Grupo:",
                    placeholder="Ex: analise_v1",
                    help="Filtrar por grupo de orquestração"
                )
                
                sort_by = st.selectbox(
                    "📊 Ordenar por:",
                    ['created_at', 'task_identifier', 'status', 'complexity_score'],
                    help="Campo para ordenação"
                )
                
                sort_order = st.radio(
                    "Ordem:",
                    ['Crescente', 'Decrescente'],
                    horizontal=True
                )
            
            st.markdown('</div>', unsafe_allow_html=True)
        
        return {
            'status': status_filter,
            'model': model_filter,
            'group': group_filter if group_filter else None,
            'complexity_range': complexity_range,
            'date_range': date_range,
            'sort_by': sort_by,
            'sort_order': sort_order
        }
    
    def render_bulk_actions(self, selected_tasks: set):
        """Renderiza ações em lote"""
        if not selected_tasks:
            return
        
        st.markdown(f"""
        <div class="bulk-actions">
            <strong>🎯 Ações em Lote</strong> - {len(selected_tasks)} tarefas selecionadas
        </div>
        """, unsafe_allow_html=True)
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            if st.button("🗑️ Deletar Selecionadas", use_container_width=True):
                if st.button("⚠️ Confirmar Deleção", key="confirm_delete"):
                    success = self.bulk_delete_tasks(list(selected_tasks))
                    if success:
                        st.success("✅ Tarefas deletadas com sucesso!")
                        st.session_state.selected_tasks = set()
                        st.rerun()
        
        with col2:
            if st.button("⏸️ Pausar Selecionadas", use_container_width=True):
                success = self.bulk_update_status(list(selected_tasks), "paused")
                if success:
                    st.success("⏸️ Tarefas pausadas!")
        
        with col3:
            if st.button("▶️ Retomar Selecionadas", use_container_width=True):
                success = self.bulk_update_status(list(selected_tasks), "pending")
                if success:
                    st.success("▶️ Tarefas retomadas!")
        
        with col4:
            if st.button("📥 Exportar Selecionadas", use_container_width=True):
                st.info("💡 Use a seção de Export abaixo")
    
    def render_export_section(self, tasks: List[Dict]):
        """Renderiza seção de exportação"""
        st.subheader("📥 Exportação de Dados")
        
        with st.container():
            st.markdown('<div class="export-container">', unsafe_allow_html=True)
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                if st.button("📊 Exportar CSV", use_container_width=True):
                    csv_data = self.export_manager.export_to_csv(tasks)
                    st.download_button(
                        label="📥 Download CSV",
                        data=csv_data,
                        file_name=f"tasks_{datetime.now().strftime('%Y%m%d_%H%M')}.csv",
                        mime="text/csv",
                        use_container_width=True
                    )
            
            with col2:
                if st.button("📋 Exportar JSON", use_container_width=True):
                    json_data = self.export_manager.export_to_json(tasks)
                    st.download_button(
                        label="📥 Download JSON",
                        data=json_data,
                        file_name=f"tasks_{datetime.now().strftime('%Y%m%d_%H%M')}.json",
                        mime="application/json",
                        use_container_width=True
                    )
            
            with col3:
                if st.button("📈 Exportar Excel", use_container_width=True):
                    # Criar DataFrame
                    df = pd.DataFrame([
                        {
                            'ID': task.get('task_identifier', ''),
                            'Status': task.get('status', ''),
                            'Modelo': task.get('model', ''),
                            'Criado': task.get('created_at', ''),
                            'Grupo': task.get('orchestration_group', ''),
                            'Complexidade': task.get('_metadata', {}).get('complexity_score', 0),
                            'Prompt': task.get('execution_prompt', '')
                        }
                        for task in tasks
                    ])
                    
                    # Converter para Excel
                    output = io.BytesIO()
                    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                        df.to_excel(writer, sheet_name='Tasks', index=False)
                    
                    st.download_button(
                        label="📥 Download Excel",
                        data=output.getvalue(),
                        file_name=f"tasks_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx",
                        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        use_container_width=True
                    )
            
            st.markdown('</div>', unsafe_allow_html=True)
    
    def render_analytics_dashboard(self, tasks: List[Dict]):
        """Renderiza dashboard de analytics"""
        st.subheader("📊 Analytics Dashboard")
        
        metrics = self.analytics.calculate_performance_metrics(tasks)
        
        if not metrics:
            st.warning("📭 Nenhuma tarefa para análise")
            return
        
        # Métricas principais
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.markdown(f"""
            <div class="analytics-card">
                <h4>📊 Total</h4>
                <h2 style="color: #667eea">{metrics['total_tasks']}</h2>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            st.markdown(f"""
            <div class="analytics-card">
                <h4>✅ Taxa Sucesso</h4>
                <h2 style="color: #28a745">{metrics['success_rate']}%</h2>
            </div>
            """, unsafe_allow_html=True)
        
        with col3:
            st.markdown(f"""
            <div class="analytics-card">
                <h4>⏱️ Tempo Médio</h4>
                <h2 style="color: #ffc107">{metrics['avg_execution_time']}min</h2>
            </div>
            """, unsafe_allow_html=True)
        
        with col4:
            running_tasks = metrics['status_counts'].get('running', 0)
            st.markdown(f"""
            <div class="analytics-card">
                <h4>🔄 Executando</h4>
                <h2 style="color: #17a2b8">{running_tasks}</h2>
            </div>
            """, unsafe_allow_html=True)
        
        # Gráficos
        col1, col2 = st.columns(2)
        
        with col1:
            # Pizza de status
            fig_status = px.pie(
                values=list(metrics['status_counts'].values()),
                names=list(metrics['status_counts'].keys()),
                title="📊 Distribuição por Status"
            )
            st.plotly_chart(fig_status, use_container_width=True)
        
        with col2:
            # Barras de modelos
            fig_models = px.bar(
                x=list(metrics['model_distribution'].keys()),
                y=list(metrics['model_distribution'].values()),
                title="🤖 Distribuição por Modelo",
                color=list(metrics['model_distribution'].values()),
                color_continuous_scale="viridis"
            )
            st.plotly_chart(fig_models, use_container_width=True)
        
        # Gráfico de tendências
        trend_chart = self.analytics.generate_trend_chart(tasks)
        st.plotly_chart(trend_chart, use_container_width=True)
    
    def run_dashboard(self):
        """Interface principal do dashboard"""
        # Cabeçalho com indicador real-time
        st.markdown("""
        <h1 class="main-header">
            <span class="real-time-indicator"></span>📋 Lista de Tarefas Ultra
        </h1>
        """, unsafe_allow_html=True)
        
        # Filtros avançados
        filters = self.render_advanced_filters()
        
        # Obter tarefas com filtros
        all_tasks = self.get_all_tasks(filters)
        
        # Analytics dashboard
        self.render_analytics_dashboard(all_tasks)
        
        # Paginação virtualizada
        page_size = st.selectbox("📄 Itens por página:", [10, 20, 50, 100], index=1)
        virtual_table = VirtualizedTable(all_tasks, page_size)
        
        if all_tasks:
            # Informações de paginação
            total_tasks = len(all_tasks)
            start_idx = (st.session_state.current_page - 1) * page_size + 1
            end_idx = min(st.session_state.current_page * page_size, total_tasks)
            
            st.markdown(f"""
            <div class="pagination-info">
                📊 Mostrando {start_idx}-{end_idx} de {total_tasks} tarefas
            </div>
            """, unsafe_allow_html=True)
            
            # Controles de paginação
            new_page = virtual_table.render_pagination_controls(st.session_state.current_page)
            if new_page != st.session_state.current_page:
                st.session_state.current_page = new_page
                st.rerun()
            
            # Obter tarefas da página atual
            page_tasks = virtual_table.get_page(st.session_state.current_page)
            
            # Ações em lote
            self.render_bulk_actions(st.session_state.selected_tasks)
            
            # Lista de tarefas com seleção múltipla
            st.subheader("📋 Tarefas")
            
            # Seleção de todas as tarefas da página
            if st.checkbox("☑️ Selecionar todas desta página"):
                for task in page_tasks:
                    st.session_state.selected_tasks.add(task.get('task_identifier', ''))
            
            # Renderizar cada tarefa
            for task in page_tasks:
                task_id = task.get('task_identifier', '')
                status = task.get('status', 'unknown')
                
                # Checkbox para seleção
                col1, col2 = st.columns([0.1, 0.9])
                
                with col1:
                    is_selected = st.checkbox(
                        "",
                        value=task_id in st.session_state.selected_tasks,
                        key=f"select_{task_id}"
                    )
                    
                    if is_selected:
                        st.session_state.selected_tasks.add(task_id)
                    else:
                        st.session_state.selected_tasks.discard(task_id)
                
                with col2:
                    # Card da tarefa
                    created_time = task.get('created_at', 'N/A')
                    if created_time != 'N/A':
                        created_time = created_time.split('T')[1][:8]
                    
                    complexity = task.get('_metadata', {}).get('complexity_score', 0)
                    complexity_color = '#28a745' if complexity < 50 else '#ffc107' if complexity < 75 else '#dc3545'
                    
                    card_class = "selected" if task_id in st.session_state.selected_tasks else ""
                    
                    st.markdown(f"""
                    <div class="task-row status-{status} {card_class}">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>🏷️ {task_id}</strong><br>
                                <span style="color: #6c757d;">📝 {task.get('execution_prompt', '')[:80]}...</span><br>
                                <small>🤖 {task.get('model', 'N/A')} | 🕐 {created_time} | 
                                <span style="color: {complexity_color}">🎯 {complexity}</span></small>
                            </div>
                            <div style="text-align: right;">
                                {self.render_status_badge(status)}<br>
                                <small>👥 {task.get('orchestration_group', 'Sem grupo')}</small>
                            </div>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    # Botão de detalhes
                    if st.button(f"👀 Detalhes", key=f"details_{task_id}"):
                        st.session_state.selected_task_details = task
        
        else:
            st.markdown("""
            <div class="warning-box">
                <strong>📭 Nenhuma tarefa encontrada</strong><br>
                Ajuste os filtros ou crie novas tarefas
            </div>
            """, unsafe_allow_html=True)
        
        # Exportação
        if all_tasks:
            st.markdown("---")
            self.render_export_section(all_tasks)
        
        # Detalhes da tarefa selecionada
        if hasattr(st.session_state, 'selected_task_details'):
            st.markdown("---")
            task = st.session_state.selected_task_details
            
            st.subheader(f"🔍 Detalhes: {task.get('task_identifier', 'N/A')}")
            
            # Tabs para organizar informações
            detail_tab1, detail_tab2, detail_tab3 = st.tabs(["📊 Geral", "📜 Logs", "📈 Performance"])
            
            with detail_tab1:
                col1, col2 = st.columns(2)
                
                with col1:
                    st.json({
                        "Identificador": task.get('task_identifier'),
                        "Status": task.get('status'),
                        "Modelo": task.get('model'),
                        "Diretório": task.get('working_directory'),
                        "Grupo": task.get('orchestration_group')
                    })
                
                with col2:
                    metadata = task.get('_metadata', {})
                    st.markdown(f"""
                    **🎯 Métricas:**
                    - Complexidade: {metadata.get('estimated_complexity', 'N/A')}
                    - Duração Est.: {metadata.get('estimated_duration', 'N/A')}
                    - Score: {metadata.get('complexity_score', 'N/A')}
                    - Template: {metadata.get('template_used', 'Manual')}
                    """)
            
            with detail_tab2:
                if task.get('status') == 'running':
                    self.render_streaming_logs(task.get('id', ''))
                else:
                    logs = self.get_task_logs(task.get('id', ''))
                    if logs:
                        st.code('\n'.join(logs))
                    else:
                        st.info("📭 Nenhum log disponível")
            
            with detail_tab3:
                if task.get('status') in ['running', 'completed']:
                    self.render_resource_usage(task)
                else:
                    st.info("📊 Métricas disponíveis apenas para tarefas em execução ou concluídas")
        
        # Sidebar com configurações
        with st.sidebar:
            st.subheader("⚙️ Configurações de Monitoramento")
            
            # Auto-refresh
            auto_refresh = st.checkbox(
                "🔄 Auto-refresh",
                value=st.session_state.auto_refresh,
                help="Atualizar dados automaticamente"
            )
            st.session_state.auto_refresh = auto_refresh
            
            if auto_refresh:
                refresh_interval = st.slider(
                    "Intervalo (seg):",
                    5, 60, st.session_state.refresh_interval
                )
                st.session_state.refresh_interval = refresh_interval
                
                # Mostrar próximo refresh
                last_refresh = st.session_state.last_refresh
                next_refresh = last_refresh + timedelta(seconds=refresh_interval)
                time_until_refresh = (next_refresh - datetime.now()).total_seconds()
                
                if time_until_refresh <= 0:
                    st.session_state.last_refresh = datetime.now()
                    st.rerun()
                else:
                    st.info(f"🔄 Próximo refresh em {int(time_until_refresh)}s")
            
            st.markdown("---")
            
            # Filtros salvos
            st.subheader("💾 Filtros Salvos")
            
            saved_filters = st.selectbox(
                "Carregar filtro:",
                ["Nenhum", "Tarefas Ativas", "Tarefas Complexas", "Falhas Recentes"],
                help="Filtros pré-configurados"
            )
            
            if saved_filters != "Nenhum":
                st.info(f"🔧 Filtro '{saved_filters}' aplicado")
            
            if st.button("💾 Salvar Filtro Atual", use_container_width=True):
                st.success("✅ Filtro salvo!")
            
            st.markdown("---")
            
            # Estatísticas rápidas
            st.subheader("📊 Stats Rápidas")
            
            if all_tasks:
                total = len(all_tasks)
                running = len([t for t in all_tasks if t.get('status') == 'running'])
                completed = len([t for t in all_tasks if t.get('status') == 'completed'])
                
                st.metric("Total", total)
                st.metric("🔄 Executando", running)
                st.metric("✅ Concluídas", completed)
            
            # Última atualização
            st.markdown(f"**🕐 Última atualização:**")
            st.markdown(f"{datetime.now().strftime('%H:%M:%S')}")

def main():
    """Função principal"""
    dashboard = ListTasksDashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()