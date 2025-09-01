#!/usr/bin/env python3
"""
Dashboard Delete Task ULTRA - Claude-CTO
Interface ultra-segura para remoção de tarefas com dependency impact analysis,
confirmation workflow, safe delete (quarantine) e audit trail
"""

import streamlit as st
import requests
import json
import time
import plotly.graph_objects as go
import networkx as nx
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import pandas as pd

# Configuração da página
st.set_page_config(
    page_title="Delete Task Ultra - Claude-CTO",
    page_icon="🗑️",
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
        background: linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-family: 'Inter', sans-serif;
    }
    
    .danger-alert {
        background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
        border: 2px solid #dc3545;
        border-radius: 15px;
        padding: 2rem;
        margin: 1rem 0;
        animation: pulse-warning 2s infinite;
    }
    
    .safe-delete {
        background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
        border: 1px solid #ffc107;
        border-radius: 15px;
        padding: 1.5rem;
        margin: 1rem 0;
    }
    
    .impact-card {
        background: white;
        border-radius: 15px;
        padding: 1.5rem;
        margin: 1rem 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        border-left: 5px solid;
    }
    
    .impact-critical { border-left-color: #dc3545; }
    .impact-warning { border-left-color: #ffc107; }
    .impact-safe { border-left-color: #28a745; }
    
    .quarantine-container {
        background: linear-gradient(135deg, #e2e3e5 0%, #d6d8db 100%);
        border: 2px dashed #6c757d;
        border-radius: 15px;
        padding: 1.5rem;
        margin: 1rem 0;
    }
    
    .audit-trail {
        background: #000;
        color: #00ff00;
        padding: 1rem;
        border-radius: 10px;
        font-family: 'Courier New', monospace;
        margin: 1rem 0;
        max-height: 200px;
        overflow-y: auto;
    }
    
    @keyframes pulse-warning {
        0% { border-color: #dc3545; }
        50% { border-color: #ff6b6b; }
        100% { border-color: #dc3545; }
    }
    
    .confirmation-step {
        background: white;
        border-radius: 15px;
        padding: 1.5rem;
        margin: 1rem 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        border: 2px solid #e9ecef;
    }
    
    .confirmation-step.active {
        border-color: #667eea;
        background: linear-gradient(135deg, #f8f9ff 0%, #e8ecff 100%);
    }
    
    .confirmation-step.completed {
        border-color: #28a745;
        background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
    }
</style>
""", unsafe_allow_html=True)

class DependencyAnalyzer:
    """Analisador de impacto de dependências"""
    
    @staticmethod
    def analyze_dependency_impact(task_to_delete: str, all_tasks: List[Dict]) -> Dict:
        """Analisa impacto da remoção na rede de dependências"""
        # Encontrar tarefas que dependem desta
        dependent_tasks = []
        for task in all_tasks:
            deps = task.get('depends_on', [])
            if task_to_delete in deps:
                dependent_tasks.append(task)
        
        # Encontrar dependências desta tarefa
        task_data = next((t for t in all_tasks if t.get('task_identifier') == task_to_delete), None)
        dependencies = task_data.get('depends_on', []) if task_data else []
        
        # Calcular nível de impacto
        total_affected = len(dependent_tasks)
        
        if total_affected == 0:
            impact_level = "SEGURO"
        elif total_affected <= 2:
            impact_level = "BAIXO"
        elif total_affected <= 5:
            impact_level = "MÉDIO"
        else:
            impact_level = "CRÍTICO"
        
        # Verificar se há tarefas em execução afetadas
        running_affected = [t for t in dependent_tasks if t.get('status') == 'running']
        
        return {
            'impact_level': impact_level,
            'dependent_tasks': dependent_tasks,
            'dependencies': dependencies,
            'total_affected': total_affected,
            'running_affected': running_affected,
            'task_data': task_data
        }
    
    @staticmethod
    def render_dependency_graph(task_to_delete: str, all_tasks: List[Dict]):
        """Renderiza grafo de dependências com destaque para impacto"""
        # Criar grafo
        G = nx.DiGraph()
        
        # Adicionar nós
        for task in all_tasks:
            task_id = task.get('task_identifier', '')
            G.add_node(task_id, status=task.get('status', 'unknown'))
        
        # Adicionar arestas
        for task in all_tasks:
            task_id = task.get('task_identifier', '')
            for dep in task.get('depends_on', []):
                if dep in [t.get('task_identifier') for t in all_tasks]:
                    G.add_edge(dep, task_id)
        
        # Encontrar subgrafo relevante (tarefa + vizinhos)
        neighbors = set([task_to_delete])
        neighbors.update(G.predecessors(task_to_delete))
        neighbors.update(G.successors(task_to_delete))
        
        # Criar subgrafo
        subG = G.subgraph(neighbors)
        
        if len(subG.nodes()) == 0:
            st.info("📊 Tarefa não possui dependências")
            return
        
        # Layout
        pos = nx.spring_layout(subG, k=2, iterations=50)
        
        # Criar figura Plotly
        fig = go.Figure()
        
        # Adicionar arestas
        edge_x, edge_y = [], []
        for edge in subG.edges():
            x0, y0 = pos[edge[0]]
            x1, y1 = pos[edge[1]]
            edge_x.extend([x0, x1, None])
            edge_y.extend([y0, y1, None])
        
        fig.add_trace(go.Scatter(
            x=edge_x, y=edge_y,
            line=dict(width=2, color='#666'),
            hoverinfo='none',
            mode='lines',
            name='Dependências'
        ))
        
        # Adicionar nós com cores baseadas no impacto
        for node in subG.nodes():
            x, y = pos[node]
            
            if node == task_to_delete:
                color = '#dc3545'  # Vermelho para tarefa a ser deletada
                size = 30
                symbol = 'x'
            elif node in G.successors(task_to_delete):
                color = '#ffc107'  # Amarelo para tarefas afetadas
                size = 25
                symbol = 'circle'
            else:
                color = '#28a745'  # Verde para dependências
                size = 20
                symbol = 'circle'
            
            fig.add_trace(go.Scatter(
                x=[x], y=[y],
                mode='markers+text',
                marker=dict(size=size, color=color, symbol=symbol),
                text=[node[:10] + '...' if len(node) > 10 else node],
                textposition='bottom center',
                name=node,
                showlegend=False
            ))
        
        fig.update_layout(
            title="🕸️ Análise de Impacto de Dependências",
            showlegend=False,
            height=400,
            xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)'
        )
        
        st.plotly_chart(fig, use_container_width=True)
        
        # Legenda
        st.markdown("""
        **🎨 Legenda:**
        - 🔴 Tarefa a ser deletada
        - 🟡 Tarefas que serão afetadas
        - 🟢 Dependências da tarefa
        """)

class AuditLogger:
    """Logger de auditoria para remoções"""
    
    @staticmethod
    def log_deletion_attempt(task_id: str, user_info: Dict, impact_data: Dict) -> str:
        """Registra tentativa de deleção"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'action': 'DELETE_ATTEMPT',
            'task_id': task_id,
            'user': user_info.get('user', 'unknown'),
            'impact_level': impact_data.get('impact_level'),
            'affected_tasks': len(impact_data.get('dependent_tasks', [])),
            'session_id': hash(str(datetime.now()))
        }
        
        return json.dumps(log_entry, indent=2)
    
    @staticmethod
    def log_deletion_success(task_id: str, execution_time: float) -> str:
        """Registra deleção bem-sucedida"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'action': 'DELETE_SUCCESS',
            'task_id': task_id,
            'execution_time_ms': round(execution_time * 1000, 2),
            'session_id': hash(str(datetime.now()))
        }
        
        return json.dumps(log_entry, indent=2)

class DeleteTaskDashboard:
    def __init__(self):
        self.base_url = "http://localhost:8889/api/v1"
        self.dependency_analyzer = DependencyAnalyzer()
        self.audit_logger = AuditLogger()
        
        # Estado da aplicação
        if 'selected_task_to_delete' not in st.session_state:
            st.session_state.selected_task_to_delete = None
        if 'confirmation_steps' not in st.session_state:
            st.session_state.confirmation_steps = {}
        if 'quarantine_mode' not in st.session_state:
            st.session_state.quarantine_mode = True
        if 'audit_logs' not in st.session_state:
            st.session_state.audit_logs = []
    
    def get_all_tasks(self) -> List[Dict]:
        """Obtém todas as tarefas"""
        try:
            response = requests.get(f"{self.base_url}/tasks", timeout=10)
            if response.status_code == 200:
                return response.json().get('tasks', [])
        except Exception:
            pass
        return []
    
    def delete_task(self, task_id: str, safe_mode: bool = True) -> bool:
        """Deleta uma tarefa (com modo seguro)"""
        try:
            endpoint = f"{self.base_url}/tasks/{task_id}"
            if safe_mode:
                endpoint += "?safe_delete=true"
            
            response = requests.delete(endpoint, timeout=30)
            return response.status_code == 200
        except Exception:
            return False
    
    def quarantine_task(self, task_id: str) -> bool:
        """Move tarefa para quarentena (soft delete)"""
        try:
            response = requests.patch(
                f"{self.base_url}/tasks/{task_id}/quarantine",
                timeout=30
            )
            return response.status_code == 200
        except Exception:
            return False
    
    def render_task_selector(self, tasks: List[Dict]) -> Optional[str]:
        """Renderiza seletor de tarefas para deleção"""
        st.subheader("🎯 Selecionar Tarefa para Remoção")
        
        if not tasks:
            st.warning("📭 Nenhuma tarefa disponível para remoção")
            return None
        
        # Filtrar apenas tarefas que podem ser deletadas
        deletable_tasks = [
            task for task in tasks 
            if task.get('status') in ['completed', 'failed', 'cancelled']
        ]
        
        if not deletable_tasks:
            st.warning("⚠️ Nenhuma tarefa pode ser removida. Apenas tarefas concluídas, falhas ou canceladas podem ser deletadas.")
            return None
        
        # Grid de seleção
        cols = st.columns(3)
        
        for i, task in enumerate(deletable_tasks):
            with cols[i % 3]:
                task_id = task.get('task_identifier', '')
                status = task.get('status', 'unknown')
                created = task.get('created_at', '')[:10] if task.get('created_at') else 'N/A'
                
                # Card da tarefa
                if st.button(
                    f"🗑️ {task_id}",
                    key=f"select_delete_{i}",
                    help=f"Status: {status} | Criado: {created}",
                    use_container_width=True
                ):
                    return task_id
                
                # Informações adicionais
                st.markdown(f"""
                <div style="font-size: 0.8rem; color: #6c757d; text-align: center;">
                    📊 {status}<br>
                    📅 {created}
                </div>
                """, unsafe_allow_html=True)
        
        return None
    
    def render_impact_analysis(self, task_to_delete: str, all_tasks: List[Dict]):
        """Renderiza análise de impacto"""
        st.subheader("⚠️ Análise de Impacto")
        
        impact_data = self.dependency_analyzer.analyze_dependency_impact(task_to_delete, all_tasks)
        
        # Nível de impacto principal
        impact_level = impact_data['impact_level']
        total_affected = impact_data['total_affected']
        
        impact_colors = {
            'SEGURO': '#28a745',
            'BAIXO': '#20c997',
            'MÉDIO': '#ffc107',
            'CRÍTICO': '#dc3545'
        }
        
        impact_color = impact_colors.get(impact_level, '#6c757d')
        impact_class = f"impact-{impact_level.lower()}" if impact_level.lower() in ['safe', 'warning', 'critical'] else "impact-warning"
        
        st.markdown(f"""
        <div class="{impact_class}">
            <div style="text-align: center;">
                <h2>⚠️ Nível de Impacto: <span style="color: {impact_color}">{impact_level}</span></h2>
                <h3>🎯 {total_affected} tarefas serão afetadas</h3>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Detalhes do impacto
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("**📊 Tarefas Dependentes:**")
            if impact_data['dependent_tasks']:
                for dep_task in impact_data['dependent_tasks']:
                    status = dep_task.get('status', 'unknown')
                    status_emoji = {
                        'pending': '⏳',
                        'running': '🔄',
                        'completed': '✅',
                        'failed': '❌'
                    }.get(status, '❓')
                    
                    st.markdown(f"• {status_emoji} {dep_task.get('task_identifier', 'N/A')}")
            else:
                st.success("✅ Nenhuma tarefa depende desta")
        
        with col2:
            st.markdown("**🔗 Dependências Desta Tarefa:**")
            if impact_data['dependencies']:
                for dep in impact_data['dependencies']:
                    st.markdown(f"• 🔗 {dep}")
            else:
                st.info("ℹ️ Esta tarefa não possui dependências")
        
        # Alertas especiais
        if impact_data['running_affected']:
            st.markdown("""
            <div class="danger-alert">
                <strong>🚨 ATENÇÃO: TAREFAS EM EXECUÇÃO AFETADAS</strong><br>
                Existem tarefas em execução que dependem desta tarefa.
                Removê-la pode causar falhas em execuções ativas.
            </div>
            """, unsafe_allow_html=True)
        
        # Grafo de dependências
        if total_affected > 0 or impact_data['dependencies']:
            self.dependency_analyzer.render_dependency_graph(task_to_delete, all_tasks)
        
        return impact_data
    
    def render_safe_delete_options(self):
        """Renderiza opções de deleção segura"""
        st.subheader("🛡️ Opções de Segurança")
        
        with st.container():
            st.markdown('<div class="safe-delete">', unsafe_allow_html=True)
            
            col1, col2 = st.columns(2)
            
            with col1:
                quarantine_mode = st.checkbox(
                    "🗂️ Modo Quarentena",
                    value=st.session_state.quarantine_mode,
                    help="Move para quarentena em vez de deletar permanentemente"
                )
                st.session_state.quarantine_mode = quarantine_mode
                
                if quarantine_mode:
                    quarantine_days = st.number_input(
                        "Dias na quarentena:",
                        min_value=1,
                        max_value=90,
                        value=30,
                        help="Após este período, será deletada automaticamente"
                    )
                    
                    st.info("💡 Modo quarentena permite recuperação posterior")
            
            with col2:
                create_backup = st.checkbox(
                    "💾 Criar backup antes da remoção",
                    value=True,
                    help="Backup individual da tarefa"
                )
                
                if create_backup:
                    backup_format = st.selectbox(
                        "Formato do backup:",
                        ["JSON", "TXT"],
                        help="Formato do arquivo de backup"
                    )
                
                audit_trail = st.checkbox(
                    "📋 Registrar em audit trail",
                    value=True,
                    help="Manter registro da operação"
                )
            
            st.markdown('</div>', unsafe_allow_html=True)
        
        return {
            'quarantine_mode': quarantine_mode,
            'quarantine_days': quarantine_days if quarantine_mode else None,
            'create_backup': create_backup,
            'backup_format': backup_format if create_backup else None,
            'audit_trail': audit_trail
        }
    
    def render_confirmation_workflow(self, task_id: str, impact_data: Dict, safety_options: Dict):
        """Renderiza workflow de confirmação em múltiplas etapas"""
        st.subheader("✅ Confirmação de Remoção")
        
        steps_completed = 0
        total_steps = 3 if impact_data['impact_level'] != 'CRÍTICO' else 4
        
        # Etapa 1: Confirmação básica
        step1_class = "confirmation-step active" if steps_completed == 0 else "confirmation-step completed"
        
        st.markdown(f"""
        <div class="{step1_class}">
            <h4>📋 Etapa 1: Confirmação Básica</h4>
        </div>
        """, unsafe_allow_html=True)
        
        confirm_basic = st.checkbox(
            f"🔍 Confirmo que quero remover a tarefa '{task_id}'",
            help="Confirmação básica da intenção"
        )
        
        if confirm_basic:
            steps_completed = 1
        else:
            return False, steps_completed
        
        # Etapa 2: Confirmação de impacto
        step2_class = "confirmation-step active" if steps_completed == 1 else "confirmation-step completed"
        
        st.markdown(f"""
        <div class="{step2_class}">
            <h4>⚠️ Etapa 2: Confirmação de Impacto</h4>
        </div>
        """, unsafe_allow_html=True)
        
        impact_text = f"Li e compreendi que {impact_data['total_affected']} tarefas serão afetadas"
        if impact_data['running_affected']:
            impact_text += f" (incluindo {len(impact_data['running_affected'])} em execução)"
        
        confirm_impact = st.checkbox(
            f"📊 {impact_text}",
            help="Confirmação do entendimento do impacto"
        )
        
        if confirm_impact:
            steps_completed = 2
        else:
            return False, steps_completed
        
        # Etapa 3: Confirmação de segurança (apenas para crítico)
        if impact_data['impact_level'] == 'CRÍTICO':
            step3_class = "confirmation-step active" if steps_completed == 2 else "confirmation-step completed"
            
            st.markdown(f"""
            <div class="{step3_class}">
                <h4>🚨 Etapa 3: Confirmação de Alto Risco</h4>
            </div>
            """, unsafe_allow_html=True)
            
            confirm_critical = st.checkbox(
                "🚨 Entendo que esta é uma operação de ALTO RISCO",
                help="Confirmação obrigatória para operações críticas"
            )
            
            if confirm_critical:
                steps_completed = 3
            else:
                return False, steps_completed
        
        # Etapa final: Confirmação textual
        final_step = total_steps - 1
        step_final_class = "confirmation-step active" if steps_completed == final_step else "confirmation-step"
        
        st.markdown(f"""
        <div class="{step_final_class}">
            <h4>✍️ Etapa Final: Confirmação Textual</h4>
        </div>
        """, unsafe_allow_html=True)
        
        confirmation_text = "DELETAR" if not safety_options['quarantine_mode'] else "QUARENTENA"
        
        final_confirmation = st.text_input(
            f"Digite '{confirmation_text}' para confirmar:",
            placeholder=confirmation_text,
            help="Confirmação final obrigatória"
        )
        
        if final_confirmation.upper() == confirmation_text:
            steps_completed = total_steps
            return True, steps_completed
        
        return False, steps_completed
    
    def render_audit_trail(self):
        """Renderiza trail de auditoria"""
        st.subheader("📋 Audit Trail")
        
        # Simular logs de auditoria
        audit_logs = [
            "[14:30:15] DELETE_ATTEMPT: task_analyze_auth_0830 - Impact: BAIXO - Affected: 1",
            "[14:30:20] DELETE_SUCCESS: task_analyze_auth_0830 - Duration: 1.2s",
            "[14:25:10] QUARANTINE: task_old_feature_0825 - Mode: SAFE - Days: 30",
            "[14:20:05] DELETE_ATTEMPT: task_bugfix_mem_0829 - Impact: MÉDIO - Affected: 3",
            "[14:20:08] DELETE_CANCELLED: task_bugfix_mem_0829 - Reason: USER_ABORT"
        ]
        
        st.markdown("""
        <div class="audit-trail">
            <pre>""" + "\\n".join(audit_logs) + """</pre>
        </div>
        """, unsafe_allow_html=True)
    
    def run_dashboard(self):
        """Interface principal do dashboard"""
        # Cabeçalho
        st.markdown('<h1 class="main-header">🗑️ Remoção Segura de Tarefas</h1>', unsafe_allow_html=True)
        
        # Obter todas as tarefas
        all_tasks = self.get_all_tasks()
        
        if not all_tasks:
            st.markdown("""
            <div class="safe-zone">
                <strong>📭 Nenhuma tarefa encontrada</strong><br>
                Não há tarefas disponíveis para remoção.
            </div>
            """, unsafe_allow_html=True)
            return
        
        # Seletor de tarefa
        selected_task_id = self.render_task_selector(all_tasks)
        
        if selected_task_id:
            st.session_state.selected_task_to_delete = selected_task_id
        
        if not st.session_state.selected_task_to_delete:
            st.info("👆 Selecione uma tarefa acima para iniciar o processo de remoção")
            return
        
        task_to_delete = st.session_state.selected_task_to_delete
        
        # Análise de impacto
        impact_data = self.render_impact_analysis(task_to_delete, all_tasks)
        
        # Opções de segurança
        safety_options = self.render_safe_delete_options()
        
        # Workflow de confirmação
        st.markdown("---")
        confirmed, steps_completed = self.render_confirmation_workflow(
            task_to_delete, impact_data, safety_options
        )
        
        # Barra de progresso das confirmações
        total_steps = 3 if impact_data['impact_level'] != 'CRÍTICO' else 4
        progress = steps_completed / total_steps
        
        st.progress(progress)
        st.markdown(f"""
        <div style="text-align: center; color: #6c757d; margin: 0.5rem 0;">
            📊 Progresso da Confirmação: {steps_completed}/{total_steps} etapas
        </div>
        """, unsafe_allow_html=True)
        
        # Executar remoção se confirmado
        if confirmed:
            col1, col2 = st.columns(2)
            
            with col1:
                action_text = "🗂️ Mover para Quarentena" if safety_options['quarantine_mode'] else "🗑️ Deletar Permanentemente"
                
                if st.button(action_text, use_container_width=True, type="primary"):
                    # Log da tentativa
                    if safety_options['audit_trail']:
                        attempt_log = self.audit_logger.log_deletion_attempt(
                            task_to_delete, {'user': 'current_user'}, impact_data
                        )
                        st.session_state.audit_logs.append(attempt_log)
                    
                    # Executar operação
                    start_time = time.time()
                    
                    with st.spinner(f"🔄 {'Movendo para quarentena' if safety_options['quarantine_mode'] else 'Deletando tarefa'}..."):
                        if safety_options['quarantine_mode']:
                            success = self.quarantine_task(task_to_delete)
                        else:
                            success = self.delete_task(task_to_delete, True)
                        
                        execution_time = time.time() - start_time
                    
                    if success:
                        # Log de sucesso
                        if safety_options['audit_trail']:
                            success_log = self.audit_logger.log_deletion_success(task_to_delete, execution_time)
                            st.session_state.audit_logs.append(success_log)
                        
                        action_past = "movida para quarentena" if safety_options['quarantine_mode'] else "deletada"
                        
                        st.markdown(f"""
                        <div class="safe-zone">
                            <strong>✅ Operação concluída com sucesso!</strong><br>
                            Tarefa '{task_to_delete}' foi {action_past}.<br>
                            ⏱️ Tempo de execução: {execution_time:.2f}s
                        </div>
                        """, unsafe_allow_html=True)
                        
                        # Resetar estado
                        st.session_state.selected_task_to_delete = None
                        st.session_state.confirmation_steps = {}
                        
                        if st.button("🔄 Atualizar Dashboard"):
                            st.rerun()
                    else:
                        st.error("❌ Erro ao executar operação. Tente novamente.")
            
            with col2:
                if st.button("❌ Cancelar Operação", use_container_width=True):
                    st.session_state.selected_task_to_delete = None
                    st.session_state.confirmation_steps = {}
                    st.rerun()
        
        # Audit trail
        st.markdown("---")
        self.render_audit_trail()
        
        # Sidebar com informações
        with st.sidebar:
            st.subheader("📊 Estatísticas de Remoção")
            
            # Contagem por status
            status_counts = {}
            for task in all_tasks:
                status = task.get('status', 'unknown')
                status_counts[status] = status_counts.get(status, 0) + 1
            
            deletable_count = sum([
                status_counts.get('completed', 0),
                status_counts.get('failed', 0),
                status_counts.get('cancelled', 0)
            ])
            
            st.metric("🗑️ Tarefas Removíveis", deletable_count)
            st.metric("🔒 Tarefas Protegidas", len(all_tasks) - deletable_count)
            
            if st.session_state.selected_task_to_delete:
                st.metric("🎯 Tarefa Selecionada", "1")
            
            st.markdown("---")
            
            # Configurações rápidas
            st.subheader("⚙️ Configurações")
            
            # Modo de segurança global
            global_safe_mode = st.checkbox(
                "🛡️ Modo Segurança Global",
                value=True,
                help="Ativa todas as proteções por padrão"
            )
            
            if global_safe_mode:
                st.success("✅ Todas as proteções ativas")
            else:
                st.warning("⚠️ Modo avançado - Cuidado!")
            
            # Estatísticas de quarentena
            st.markdown("---")
            st.subheader("🗂️ Quarentena")
            
            # Simular estatísticas de quarentena
            quarantine_stats = {
                'items': 5,
                'oldest': '2024-08-25',
                'size': '12.5 MB'
            }
            
            st.metric("📦 Itens na Quarentena", quarantine_stats['items'])
            st.text(f"📅 Mais antiga: {quarantine_stats['oldest']}")
            st.text(f"💽 Tamanho: {quarantine_stats['size']}")
            
            if st.button("🧹 Limpar Quarentena", use_container_width=True):
                st.info("Limpando itens expirados da quarentena...")
            
            # Ações rápidas
            st.markdown("---")
            st.subheader("⚡ Ações Rápidas")
            
            if st.button("📋 Ver Todas Tarefas", use_container_width=True):
                st.info("Redirecionando para List Tasks...")
            
            if st.button("🧹 Limpeza em Lote", use_container_width=True):
                st.info("Redirecionando para Clear Tasks...")

def main():
    """Função principal"""
    dashboard = DeleteTaskDashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()