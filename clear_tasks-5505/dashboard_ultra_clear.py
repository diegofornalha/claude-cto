#!/usr/bin/env python3
"""
Dashboard Clear Tasks ULTRA - Claude-CTO
Interface ultra-avançada para limpeza inteligente com preview de impacto,
filtros avançados, backup opcional e confirmação visual com estatísticas
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

# Configuração da página
st.set_page_config(
    page_title="Clear Tasks Ultra - Claude-CTO",
    page_icon="🧹",
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
        background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-family: 'Inter', sans-serif;
    }
    
    .impact-preview {
        background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
        border: 1px solid #ffc107;
        border-radius: 15px;
        padding: 2rem;
        margin: 1rem 0;
    }
    
    .danger-zone {
        background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
        border: 2px solid #dc3545;
        border-radius: 15px;
        padding: 2rem;
        margin: 1rem 0;
    }
    
    .safe-zone {
        background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
        border: 1px solid #28a745;
        border-radius: 15px;
        padding: 1.5rem;
        margin: 1rem 0;
    }
    
    .backup-container {
        background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
        border: 1px solid #17a2b8;
        border-radius: 15px;
        padding: 1.5rem;
        margin: 1rem 0;
    }
    
    .cleanup-card {
        background: white;
        border-radius: 15px;
        padding: 1.5rem;
        margin: 1rem 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        border-left: 5px solid;
        transition: all 0.3s ease;
    }
    
    .cleanup-card.safe { border-left-color: #28a745; }
    .cleanup-card.warning { border-left-color: #ffc107; }
    .cleanup-card.danger { border-left-color: #dc3545; }
    
    .progress-ring {
        display: inline-block;
        width: 60px;
        height: 60px;
        margin: 1rem;
    }
    
    .statistics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin: 1rem 0;
    }
    
    .stat-card {
        background: white;
        border-radius: 15px;
        padding: 1.5rem;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        border: 1px solid #e9ecef;
    }
</style>
""", unsafe_allow_html=True)

class CleanupAnalyzer:
    """Analisador de impacto de limpeza"""
    
    @staticmethod
    def analyze_cleanup_impact(tasks: List[Dict], filters: Dict) -> Dict:
        """Analisa o impacto da limpeza"""
        total_tasks = len(tasks)
        
        # Filtrar tarefas que serão removidas
        tasks_to_remove = []
        for task in tasks:
            if CleanupAnalyzer._should_remove_task(task, filters):
                tasks_to_remove.append(task)
        
        # Calcular estatísticas
        total_to_remove = len(tasks_to_remove)
        total_remaining = total_tasks - total_to_remove
        
        # Distribuição por status
        status_distribution = {}
        for task in tasks_to_remove:
            status = task.get('status', 'unknown')
            status_distribution[status] = status_distribution.get(status, 0) + 1
        
        # Espaço em disco estimado (simulado)
        estimated_disk_space = total_to_remove * 2.5  # MB por tarefa
        
        # Nível de risco
        if total_to_remove == 0:
            risk_level = "NENHUM"
        elif total_to_remove < total_tasks * 0.1:
            risk_level = "BAIXO"
        elif total_to_remove < total_tasks * 0.5:
            risk_level = "MÉDIO"
        else:
            risk_level = "ALTO"
        
        return {
            'total_tasks': total_tasks,
            'total_to_remove': total_to_remove,
            'total_remaining': total_remaining,
            'status_distribution': status_distribution,
            'estimated_disk_space': estimated_disk_space,
            'risk_level': risk_level,
            'tasks_to_remove': tasks_to_remove
        }
    
    @staticmethod
    def _should_remove_task(task: Dict, filters: Dict) -> bool:
        """Verifica se uma tarefa deve ser removida baseado nos filtros"""
        # Status
        if 'status' in filters and task.get('status') not in filters['status']:
            return False
        
        # Data
        if 'older_than_days' in filters:
            created_at = task.get('created_at')
            if created_at:
                created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                cutoff_date = datetime.now() - timedelta(days=filters['older_than_days'])
                if created_date > cutoff_date:
                    return False
        
        # Modelo
        if 'models' in filters and task.get('model') not in filters['models']:
            return False
        
        # Grupo
        if 'exclude_groups' in filters:
            task_group = task.get('orchestration_group', '')
            if task_group in filters['exclude_groups']:
                return False
        
        return True

class BackupManager:
    """Gerenciador de backup de tarefas"""
    
    @staticmethod
    def create_backup(tasks: List[Dict]) -> str:
        """Cria backup das tarefas em JSON"""
        backup_data = {
            'created_at': datetime.now().isoformat(),
            'total_tasks': len(tasks),
            'tasks': tasks
        }
        
        return json.dumps(backup_data, indent=2, ensure_ascii=False)
    
    @staticmethod
    def estimate_backup_size(tasks: List[Dict]) -> float:
        """Estima tamanho do backup em MB"""
        backup_json = BackupManager.create_backup(tasks)
        size_bytes = len(backup_json.encode('utf-8'))
        return round(size_bytes / (1024 * 1024), 2)

class ClearTasksDashboard:
    def __init__(self):
        self.base_url = "http://localhost:8889/api/v1"
        self.cleanup_analyzer = CleanupAnalyzer()
        self.backup_manager = BackupManager()
        
        # Estado da aplicação
        if 'cleanup_filters' not in st.session_state:
            st.session_state.cleanup_filters = {}
        if 'preview_data' not in st.session_state:
            st.session_state.preview_data = None
        if 'confirmation_step' not in st.session_state:
            st.session_state.confirmation_step = 0
    
    def get_all_tasks(self) -> List[Dict]:
        """Obtém todas as tarefas"""
        try:
            response = requests.get(f"{self.base_url}/tasks", timeout=10)
            if response.status_code == 200:
                return response.json().get('tasks', [])
        except Exception:
            pass
        return []
    
    def clear_tasks(self, task_ids: List[str]) -> bool:
        """Remove tarefas especificadas"""
        try:
            response = requests.delete(
                f"{self.base_url}/tasks/clear",
                json={"task_ids": task_ids},
                timeout=60
            )
            return response.status_code == 200
        except Exception:
            return False
    
    def render_cleanup_filters(self) -> Dict:
        """Renderiza filtros de limpeza"""
        st.subheader("🔧 Configurar Limpeza")
        
        with st.container():
            st.markdown('<div class="filter-container">', unsafe_allow_html=True)
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown("**📊 Filtros por Status:**")
                status_to_clear = st.multiselect(
                    "Status para remover:",
                    ['completed', 'failed', 'cancelled'],
                    default=['completed', 'failed'],
                    help="Selecione quais status devem ser removidos"
                )
                
                st.markdown("**📅 Filtros por Data:**")
                older_than_days = st.number_input(
                    "Remover tarefas mais antigas que (dias):",
                    min_value=1,
                    max_value=365,
                    value=30,
                    help="Tarefas criadas há mais de X dias"
                )
                
                exclude_recent = st.checkbox(
                    "🛡️ Proteger tarefas dos últimos 7 dias",
                    value=True,
                    help="Nunca remover tarefas muito recentes"
                )
            
            with col2:
                st.markdown("**🤖 Filtros por Modelo:**")
                models_to_clear = st.multiselect(
                    "Modelos para incluir:",
                    ['sonnet', 'opus', 'haiku'],
                    default=['sonnet', 'opus', 'haiku'],
                    help="Quais modelos incluir na limpeza"
                )
                
                st.markdown("**🏷️ Proteções de Grupo:**")
                protected_groups = st.text_input(
                    "Grupos protegidos (separados por vírgula):",
                    placeholder="grupo_importante,projeto_ativo",
                    help="Grupos que nunca devem ser removidos"
                )
                
                exclude_running_deps = st.checkbox(
                    "🔗 Proteger dependências de tarefas ativas",
                    value=True,
                    help="Não remover tarefas que são dependências de tarefas em execução"
                )
            
            st.markdown('</div>', unsafe_allow_html=True)
        
        # Preparar filtros
        filters = {
            'status': status_to_clear,
            'older_than_days': older_than_days if not exclude_recent else max(older_than_days, 7),
            'models': models_to_clear,
            'exclude_groups': [g.strip() for g in protected_groups.split(',') if g.strip()],
            'exclude_running_deps': exclude_running_deps
        }
        
        return filters
    
    def render_impact_preview(self, impact_data: Dict):
        """Renderiza preview do impacto da limpeza"""
        st.subheader("👀 Preview do Impacto")
        
        risk_level = impact_data['risk_level']
        total_to_remove = impact_data['total_to_remove']
        total_remaining = impact_data['total_remaining']
        
        # Escolher cor e estilo baseado no risco
        if risk_level == "NENHUM":
            container_class = "safe-zone"
            risk_color = "#28a745"
        elif risk_level == "BAIXO":
            container_class = "safe-zone"
            risk_color = "#20c997"
        elif risk_level == "MÉDIO":
            container_class = "impact-preview"
            risk_color = "#ffc107"
        else:
            container_class = "danger-zone"
            risk_color = "#dc3545"
        
        st.markdown(f"""
        <div class="{container_class}">
            <div style="text-align: center;">
                <h2>⚠️ Nível de Risco: <span style="color: {risk_color}">{risk_level}</span></h2>
                <h3>🗑️ {total_to_remove} tarefas serão removidas</h3>
                <h3>💾 {total_remaining} tarefas permanecerão</h3>
                <h3>💽 ~{impact_data['estimated_disk_space']:.1f} MB liberados</h3>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Estatísticas detalhadas
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.markdown("**📊 Distribuição por Status:**")
            for status, count in impact_data['status_distribution'].items():
                percentage = (count / total_to_remove * 100) if total_to_remove > 0 else 0
                st.markdown(f"• {status}: {count} ({percentage:.1f}%)")
        
        with col2:
            # Gráfico pizza
            if impact_data['status_distribution']:
                fig_status = px.pie(
                    values=list(impact_data['status_distribution'].values()),
                    names=list(impact_data['status_distribution'].keys()),
                    title="Distribuição de Remoções"
                )
                fig_status.update_layout(height=300)
                st.plotly_chart(fig_status, use_container_width=True)
        
        with col3:
            # Gauge de impacto
            impact_percentage = (total_to_remove / impact_data['total_tasks'] * 100) if impact_data['total_tasks'] > 0 else 0
            
            fig_gauge = go.Figure(go.Indicator(
                mode = "gauge+number",
                value = impact_percentage,
                domain = {'x': [0, 1], 'y': [0, 1]},
                title = {'text': "% de Remoção"},
                gauge = {
                    'axis': {'range': [None, 100]},
                    'bar': {'color': risk_color},
                    'steps': [
                        {'range': [0, 25], 'color': "lightgray"},
                        {'range': [25, 50], 'color': "yellow"},
                        {'range': [50, 100], 'color': "red"}
                    ],
                    'threshold': {
                        'line': {'color': "red", 'width': 4},
                        'thickness': 0.75,
                        'value': 75
                    }
                }
            ))
            
            fig_gauge.update_layout(height=300)
            st.plotly_chart(fig_gauge, use_container_width=True)
    
    def render_backup_options(self, tasks_to_backup: List[Dict]):
        """Renderiza opções de backup"""
        st.subheader("💾 Opções de Backup")
        
        with st.container():
            st.markdown('<div class="backup-container">', unsafe_allow_html=True)
            
            create_backup = st.checkbox(
                "✅ Criar backup antes da limpeza",
                value=True,
                help="Recomendado para recuperação de dados"
            )
            
            if create_backup:
                col1, col2 = st.columns(2)
                
                with col1:
                    backup_format = st.selectbox(
                        "Formato do backup:",
                        ["JSON", "CSV", "Excel"],
                        help="Formato do arquivo de backup"
                    )
                    
                    include_metadata = st.checkbox(
                        "Incluir metadados",
                        value=True,
                        help="Incluir informações de criação e performance"
                    )
                
                with col2:
                    backup_size = self.backup_manager.estimate_backup_size(tasks_to_backup)
                    st.metric("📊 Tamanho Estimado", f"{backup_size} MB")
                    
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    backup_filename = f"backup_tasks_{timestamp}.{backup_format.lower()}"
                    st.text_input("📁 Nome do arquivo:", value=backup_filename, disabled=True)
                
                # Preview do backup
                if st.button("👀 Preview do Backup"):
                    if backup_format == "JSON":
                        backup_data = self.backup_manager.create_backup(tasks_to_backup)
                        st.code(backup_data[:500] + "..." if len(backup_data) > 500 else backup_data)
                    else:
                        st.info(f"Preview disponível apenas para formato JSON")
            
            st.markdown('</div>', unsafe_allow_html=True)
            
            return create_backup, backup_format if create_backup else None
    
    def render_confirmation_workflow(self, impact_data: Dict):
        """Renderiza workflow de confirmação em etapas"""
        st.subheader("✅ Confirmação de Limpeza")
        
        total_to_remove = impact_data['total_to_remove']
        risk_level = impact_data['risk_level']
        
        # Etapa 1: Revisão do impacto
        st.markdown("**Etapa 1: Revisão do Impacto**")
        confirm_impact = st.checkbox(
            f"🔍 Li e compreendi que {total_to_remove} tarefas serão removidas",
            help="Confirme que você revisou o impacto"
        )
        
        if not confirm_impact:
            return False
        
        # Etapa 2: Confirmação de risco (apenas para alto risco)
        if risk_level in ["ALTO", "MÉDIO"]:
            st.markdown("**Etapa 2: Confirmação de Risco**")
            confirm_risk = st.checkbox(
                f"⚠️ Entendo que esta é uma operação de risco {risk_level}",
                help="Operações de alto risco requerem confirmação adicional"
            )
            
            if not confirm_risk:
                return False
        
        # Etapa 3: Confirmação final
        st.markdown("**Etapa 3: Confirmação Final**")
        final_confirmation = st.text_input(
            "Digite 'CONFIRMAR' para prosseguir:",
            placeholder="CONFIRMAR",
            help="Confirmação final obrigatória"
        )
        
        return final_confirmation.upper() == "CONFIRMAR"
    
    def render_cleanup_progress(self, tasks_to_remove: List[Dict]):
        """Renderiza progresso da limpeza"""
        st.subheader("🔄 Progresso da Limpeza")
        
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        total_tasks = len(tasks_to_remove)
        
        # Simular progresso de limpeza
        for i, task in enumerate(tasks_to_remove):
            progress = (i + 1) / total_tasks
            progress_bar.progress(progress)
            status_text.text(f"🧹 Removendo: {task.get('task_identifier', '')} ({i+1}/{total_tasks})")
            time.sleep(0.1)  # Simular tempo de processamento
        
        progress_bar.progress(1.0)
        status_text.text("✅ Limpeza concluída!")
        
        return True
    
    def run_dashboard(self):
        """Interface principal do dashboard"""
        # Cabeçalho
        st.markdown('<h1 class="main-header">🧹 Limpeza Inteligente de Tarefas</h1>', unsafe_allow_html=True)
        
        # Obter todas as tarefas
        all_tasks = self.get_all_tasks()
        
        if not all_tasks:
            st.markdown("""
            <div class="safe-zone">
                <strong>📭 Nenhuma tarefa encontrada</strong><br>
                Não há tarefas para limpar no momento.
            </div>
            """, unsafe_allow_html=True)
            return
        
        # Filtros de limpeza
        filters = self.render_cleanup_filters()
        
        # Análise de impacto
        impact_data = self.cleanup_analyzer.analyze_cleanup_impact(all_tasks, filters)
        st.session_state.preview_data = impact_data
        
        # Preview do impacto
        self.render_impact_preview(impact_data)
        
        # Se não há tarefas para remover
        if impact_data['total_to_remove'] == 0:
            st.markdown("""
            <div class="safe-zone">
                <strong>✅ Nenhuma tarefa corresponde aos critérios de limpeza</strong><br>
                Ajuste os filtros se necessário ou não há necessidade de limpeza.
            </div>
            """, unsafe_allow_html=True)
            return
        
        # Opções de backup
        create_backup, backup_format = self.render_backup_options(impact_data['tasks_to_remove'])
        
        # Lista detalhada das tarefas que serão removidas
        st.subheader("📋 Tarefas que Serão Removidas")
        
        with st.expander(f"Ver {impact_data['total_to_remove']} tarefas", expanded=False):
            for task in impact_data['tasks_to_remove'][:20]:  # Mostrar apenas as primeiras 20
                st.markdown(f"""
                <div class="cleanup-card warning">
                    <strong>🏷️ {task.get('task_identifier', 'N/A')}</strong><br>
                    <strong>Status:</strong> {task.get('status', 'N/A')}<br>
                    <strong>Criado:</strong> {task.get('created_at', 'N/A')}<br>
                    <em>{task.get('execution_prompt', '')[:100]}...</em>
                </div>
                """, unsafe_allow_html=True)
            
            if len(impact_data['tasks_to_remove']) > 20:
                st.info(f"... e mais {len(impact_data['tasks_to_remove']) - 20} tarefas")
        
        # Workflow de confirmação
        st.markdown("---")
        confirmed = self.render_confirmation_workflow(impact_data)
        
        if confirmed:
            # Botão de execução
            col1, col2 = st.columns(2)
            
            with col1:
                if st.button("🧹 Executar Limpeza", use_container_width=True, type="primary"):
                    # Criar backup se solicitado
                    if create_backup:
                        with st.spinner("💾 Criando backup..."):
                            backup_data = self.backup_manager.create_backup(impact_data['tasks_to_remove'])
                            
                            if backup_format == "JSON":
                                st.download_button(
                                    label="📥 Download Backup JSON",
                                    data=backup_data,
                                    file_name=f"backup_tasks_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                                    mime="application/json"
                                )
                    
                    # Executar limpeza
                    task_ids = [task.get('task_identifier', '') for task in impact_data['tasks_to_remove']]
                    
                    success = self.render_cleanup_progress(impact_data['tasks_to_remove'])
                    
                    if success:
                        # Simular chamada da API
                        api_success = self.clear_tasks(task_ids)
                        
                        if api_success:
                            st.markdown("""
                            <div class="safe-zone">
                                <strong>✅ Limpeza concluída com sucesso!</strong><br>
                                Todas as tarefas selecionadas foram removidas do sistema.
                            </div>
                            """, unsafe_allow_html=True)
                            
                            # Resetar estado
                            st.session_state.preview_data = None
                            st.session_state.confirmation_step = 0
                            
                            if st.button("🔄 Atualizar Dashboard"):
                                st.rerun()
                        else:
                            st.error("❌ Erro ao executar limpeza. Tente novamente.")
            
            with col2:
                if st.button("❌ Cancelar", use_container_width=True):
                    st.session_state.preview_data = None
                    st.session_state.confirmation_step = 0
                    st.rerun()
        
        # Sidebar com informações e ações
        with st.sidebar:
            st.subheader("📊 Estatísticas de Limpeza")
            
            if impact_data:
                st.metric("🗑️ Para Remover", impact_data['total_to_remove'])
                st.metric("💾 Permanecerão", impact_data['total_remaining'])
                st.metric("💽 Espaço Liberado", f"{impact_data['estimated_disk_space']:.1f} MB")
                
                # Indicador de risco
                risk_colors = {
                    'NENHUM': '#28a745',
                    'BAIXO': '#20c997',
                    'MÉDIO': '#ffc107',
                    'ALTO': '#dc3545'
                }
                risk_color = risk_colors.get(impact_data['risk_level'], '#6c757d')
                
                st.markdown(f"""
                <div style="text-align: center; padding: 1rem; background: white; border-radius: 15px; margin: 1rem 0;">
                    <h4>⚠️ Nível de Risco</h4>
                    <h3 style="color: {risk_color}">{impact_data['risk_level']}</h3>
                </div>
                """, unsafe_allow_html=True)
            
            st.markdown("---")
            
            # Presets de limpeza
            st.subheader("🎯 Presets de Limpeza")
            
            if st.button("🏃 Limpeza Rápida", use_container_width=True, help="Remove apenas completed e failed"):
                st.info("🔧 Aplicando preset 'Limpeza Rápida'")
            
            if st.button("🧹 Limpeza Completa", use_container_width=True, help="Remove todos os status não-ativos"):
                st.info("🔧 Aplicando preset 'Limpeza Completa'")
            
            if st.button("🛡️ Limpeza Conservadora", use_container_width=True, help="Remove apenas failed antigas"):
                st.info("🔧 Aplicando preset 'Conservadora'")
            
            st.markdown("---")
            
            # Ações rápidas
            st.subheader("⚡ Ações Rápidas")
            
            if st.button("📋 Ver Todas Tarefas", use_container_width=True):
                st.info("Redirecionando para List Tasks...")
            
            if st.button("➕ Nova Tarefa", use_container_width=True):
                st.info("Redirecionando para Create Task...")
            
            if st.button("🔄 Atualizar Dados", use_container_width=True):
                st.rerun()
            
            # Histórico de limpezas
            st.markdown("---")
            st.subheader("📚 Histórico")
            
            # Simular histórico
            cleanup_history = [
                {"date": "30/08/2024 14:30", "removed": 25, "type": "Rápida"},
                {"date": "29/08/2024 09:15", "removed": 12, "type": "Conservadora"},
                {"date": "28/08/2024 16:45", "removed": 8, "type": "Manual"}
            ]
            
            for cleanup in cleanup_history:
                st.markdown(f"""
                <div style="background: #f8f9fa; padding: 0.5rem; border-radius: 8px; margin: 0.25rem 0;">
                    <strong>{cleanup['date']}</strong><br>
                    🗑️ {cleanup['removed']} tarefas - {cleanup['type']}
                </div>
                """, unsafe_allow_html=True)

def main():
    """Função principal"""
    dashboard = ClearTasksDashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()