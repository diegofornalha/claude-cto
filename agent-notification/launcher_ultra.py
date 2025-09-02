#!/usr/bin/env python3
"""
Launcher Ultra - Dashboards MCP Claude-CTO
Launcher principal para todos os dashboards ultra-otimizados
"""

import streamlit as st
import subprocess
import os
import sys
import json
from datetime import datetime
from typing import Dict, List

# Configuração da página
st.set_page_config(
    page_title="Claude-CTO Ultra Launcher",
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS do launcher
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    .main-header {
        font-size: 4rem;
        font-weight: 700;
        text-align: center;
        margin-bottom: 2rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-family: 'Inter', sans-serif;
    }
    
    .dashboard-card {
        background: white;
        border-radius: 20px;
        padding: 2rem;
        margin: 1rem;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        border: 2px solid #e9ecef;
        transition: all 0.3s ease;
        cursor: pointer;
    }
    
    .dashboard-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 40px rgba(0,0,0,0.15);
        border-color: #667eea;
    }
    
    .dashboard-icon {
        font-size: 3rem;
        text-align: center;
        margin-bottom: 1rem;
    }
    
    .dashboard-title {
        font-size: 1.3rem;
        font-weight: 600;
        color: #495057;
        text-align: center;
        margin-bottom: 0.5rem;
    }
    
    .dashboard-description {
        color: #6c757d;
        text-align: center;
        font-size: 0.9rem;
        line-height: 1.4;
    }
    
    .quick-stats {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 15px;
        padding: 1.5rem;
        margin: 1rem 0;
    }
    
    .status-indicator {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-right: 0.5rem;
    }
    
    .status-online { background: #28a745; animation: pulse 2s infinite; }
    .status-offline { background: #dc3545; }
    .status-warning { background: #ffc107; }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.6; }
        100% { opacity: 1; }
    }
</style>
""", unsafe_allow_html=True)

class DashboardInfo:
    """Informações de cada dashboard"""
    
    @staticmethod
    def get_dashboards() -> List[Dict]:
        """Retorna lista de dashboards disponíveis"""
        return [
            {
                'id': 'create_task-5501',
                'name': 'Create Task Ultra',
                'icon': '🚀',
                'description': 'Interface avançada para criação de tarefas com templates, validação em tempo real e análise de complexidade',
                'file': 'dashboard_ultra.py',
                'port': 8501,
                'features': ['Templates Inteligentes', 'Validação Real-time', 'Grafo de Dependências', 'Estimativa de Complexidade']
            },
            {
                'id': 'submit_orchestration-5502',
                'name': 'Submit Orchestration Ultra',
                'icon': '🎼',
                'description': 'Submissão de orquestrações com visualização DAG, preview completo e simulation mode',
                'file': 'dashboard_ultra_orchestration.py',
                'port': 8502,
                'features': ['Visualização DAG', 'Preview Completo', 'Análise de Risco', 'Simulation Mode']
            },
            {
                'id': 'get_task_status-5503',
                'name': 'Task Status Ultra',
                'icon': '📊',
                'description': 'Monitoramento detalhado com search fuzzy, timeline visual e logs streaming',
                'file': 'dashboard_ultra_status.py',
                'port': 8503,
                'features': ['Search Fuzzy', 'Timeline Visual', 'Logs Streaming', 'Resource Usage']
            },
            {
                'id': 'list_tasks-5504',
                'name': 'List Tasks Ultra',
                'icon': '📋',
                'description': 'Monitoramento master com paginação, filtros avançados e bulk operations',
                'file': 'dashboard_ultra_list.py',
                'port': 8504,
                'features': ['Paginação Inteligente', 'Filtros Multi-dimensionais', 'Bulk Operations', 'Export Avançado']
            },
            {
                'id': 'clear_tasks-5505',
                'name': 'Clear Tasks Ultra',
                'icon': '🧹',
                'description': 'Limpeza inteligente com preview de impacto, backup opcional e confirmação visual',
                'file': 'dashboard_ultra_clear.py',
                'port': 8505,
                'features': ['Preview de Impacto', 'Backup Automático', 'Filtros Avançados', 'Limpeza Segura']
            },
            {
                'id': 'delete_task-5506',
                'name': 'Delete Task Ultra',
                'icon': '🗑️',
                'description': 'Remoção segura com análise de dependências, quarentena e audit trail',
                'file': 'dashboard_ultra_delete.py',
                'port': 8506,
                'features': ['Análise de Impacto', 'Modo Quarentena', 'Audit Trail', 'Safe Delete']
            },
            {
                'id': 'check_api_health-5507',
                'name': 'API Health Ultra',
                'icon': '🏥',
                'description': 'Monitor de saúde com métricas real-time, histórico de uptime e alertas configuráveis',
                'file': 'dashboard_ultra_health.py',
                'port': 8507,
                'features': ['Métricas Real-time', 'Histórico de Uptime', 'Sistema de Alertas', 'Teste de Endpoints']
            }
        ]

class DashboardLauncher:
    def __init__(self):
        self.base_dir = "/home/suthub/.claude/claude-cto"
        self.dashboards = DashboardInfo.get_dashboards()
        
        # Estado da aplicação
        if 'running_dashboards' not in st.session_state:
            st.session_state.running_dashboards = {}
    
    def check_dashboard_status(self, port: int) -> bool:
        """Verifica se um dashboard está rodando"""
        try:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('localhost', port))
            sock.close()
            return result == 0
        except:
            return False
    
    def launch_dashboard(self, dashboard: Dict) -> bool:
        """Lança um dashboard"""
        try:
            dashboard_dir = os.path.join(self.base_dir, dashboard['id'])
            dashboard_file = os.path.join(dashboard_dir, dashboard['file'])
            
            if not os.path.exists(dashboard_file):
                st.error(f"❌ Arquivo não encontrado: {dashboard_file}")
                return False
            
            # Comando para executar streamlit
            cmd = [
                sys.executable, "-m", "streamlit", "run",
                dashboard_file,
                "--server.port", str(dashboard['port']),
                "--server.headless", "true",
                "--browser.gatherUsageStats", "false"
            ]
            
            # Executar em background
            process = subprocess.Popen(
                cmd,
                cwd=dashboard_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                start_new_session=True
            )
            
            # Armazenar processo
            st.session_state.running_dashboards[dashboard['id']] = {
                'process': process,
                'port': dashboard['port'],
                'started_at': datetime.now().isoformat()
            }
            
            return True
        except Exception as e:
            st.error(f"❌ Erro ao lançar dashboard: {e}")
            return False
    
    def stop_dashboard(self, dashboard_id: str) -> bool:
        """Para um dashboard"""
        try:
            if dashboard_id in st.session_state.running_dashboards:
                process_info = st.session_state.running_dashboards[dashboard_id]
                process = process_info['process']
                
                process.terminate()
                process.wait(timeout=5)
                
                del st.session_state.running_dashboards[dashboard_id]
                return True
        except Exception:
            pass
        return False
    
    def render_dashboard_grid(self):
        """Renderiza grid de dashboards"""
        st.subheader("🎯 Dashboards Disponíveis")
        
        # Grid 2x4
        rows = [self.dashboards[i:i+2] for i in range(0, len(self.dashboards), 2)]
        
        for row in rows:
            cols = st.columns(len(row))
            
            for i, dashboard in enumerate(row):
                with cols[i]:
                    dashboard_id = dashboard['id']
                    is_running = self.check_dashboard_status(dashboard['port'])
                    
                    # Status indicator
                    status_class = "status-online" if is_running else "status-offline"
                    status_text = "🟢 Online" if is_running else "🔴 Offline"
                    
                    # Card do dashboard
                    st.markdown(f"""
                    <div class="dashboard-card">
                        <div class="dashboard-icon">{dashboard['icon']}</div>
                        <div class="dashboard-title">{dashboard['name']}</div>
                        <div class="dashboard-description">{dashboard['description']}</div>
                        <div style="margin-top: 1rem; text-align: center;">
                            <span class="status-indicator {status_class}"></span>
                            {status_text} | Porta {dashboard['port']}
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    # Botões de ação
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        if is_running:
                            if st.button(f"👀 Abrir", key=f"open_{dashboard_id}", use_container_width=True):
                                st.markdown(f"""
                                <script>
                                window.open('http://localhost:{dashboard['port']}', '_blank');
                                </script>
                                """, unsafe_allow_html=True)
                                st.success(f"🚀 Abrindo {dashboard['name']}...")
                        else:
                            if st.button(f"🚀 Iniciar", key=f"start_{dashboard_id}", use_container_width=True):
                                with st.spinner(f"🔄 Iniciando {dashboard['name']}..."):
                                    success = self.launch_dashboard(dashboard)
                                
                                if success:
                                    st.success(f"✅ {dashboard['name']} iniciado!")
                                    time.sleep(2)
                                    st.rerun()
                    
                    with col2:
                        if is_running:
                            if st.button(f"⏹️ Parar", key=f"stop_{dashboard_id}", use_container_width=True):
                                success = self.stop_dashboard(dashboard_id)
                                if success:
                                    st.success(f"⏹️ {dashboard['name']} parado!")
                                    st.rerun()
                        else:
                            st.button(f"💤 Parado", key=f"stopped_{dashboard_id}", disabled=True, use_container_width=True)
                    
                    # Features do dashboard
                    with st.expander(f"✨ Features do {dashboard['name']}"):
                        for feature in dashboard['features']:
                            st.markdown(f"• {feature}")
    
    def render_system_overview(self):
        """Renderiza visão geral do sistema"""
        st.subheader("📊 Visão Geral do Sistema")
        
        # Estatísticas de dashboards
        total_dashboards = len(self.dashboards)
        running_dashboards = sum(1 for d in self.dashboards if self.check_dashboard_status(d['port']))
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("🎯 Total Dashboards", total_dashboards)
        
        with col2:
            st.metric("🟢 Online", running_dashboards)
        
        with col3:
            st.metric("🔴 Offline", total_dashboards - running_dashboards)
        
        with col4:
            uptime_percentage = (running_dashboards / total_dashboards * 100) if total_dashboards > 0 else 0
            st.metric("📈 Uptime", f"{uptime_percentage:.1f}%")
        
        # Gráfico de status
        if total_dashboards > 0:
            status_data = {
                'Status': ['Online', 'Offline'],
                'Count': [running_dashboards, total_dashboards - running_dashboards],
                'Color': ['#28a745', '#dc3545']
            }
            
            fig = go.Figure(data=[go.Pie(
                labels=status_data['Status'],
                values=status_data['Count'],
                hole=0.4,
                marker_colors=status_data['Color']
            )])
            
            fig.update_layout(
                title="📊 Status dos Dashboards",
                height=300
            )
            
            st.plotly_chart(fig, use_container_width=True)
    
    def render_quick_actions(self):
        """Renderiza ações rápidas"""
        st.subheader("⚡ Ações Rápidas")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if st.button("🚀 Iniciar Todos", use_container_width=True, type="primary"):
                success_count = 0
                
                with st.spinner("🔄 Iniciando todos os dashboards..."):
                    for dashboard in self.dashboards:
                        if not self.check_dashboard_status(dashboard['port']):
                            if self.launch_dashboard(dashboard):
                                success_count += 1
                            time.sleep(1)  # Evitar sobrecarga
                
                st.success(f"✅ {success_count} dashboards iniciados!")
                if success_count > 0:
                    st.rerun()
        
        with col2:
            if st.button("⏹️ Parar Todos", use_container_width=True):
                stopped_count = 0
                
                with st.spinner("⏹️ Parando todos os dashboards..."):
                    for dashboard in self.dashboards:
                        if self.stop_dashboard(dashboard['id']):
                            stopped_count += 1
                
                st.success(f"⏹️ {stopped_count} dashboards parados!")
                if stopped_count > 0:
                    st.rerun()
        
        with col3:
            if st.button("🔄 Atualizar Status", use_container_width=True):
                st.rerun()
    
    def render_installation_guide(self):
        """Renderiza guia de instalação"""
        st.subheader("📦 Instalação e Configuração")
        
        with st.expander("🛠️ Guia de Instalação", expanded=False):
            st.markdown("""
            ### 📋 Pré-requisitos
            ```bash
            # Instalar dependências
            pip install -r requirements_ultra.txt
            ```
            
            ### 🚀 Executar Dashboards Individualmente
            ```bash
            # Create Task Ultra
            cd create_task-5501 && streamlit run dashboard_ultra.py --server.port 8501
            
            # Submit Orchestration Ultra  
            cd submit_orchestration-5502 && streamlit run dashboard_ultra_orchestration.py --server.port 8502
            
            # Task Status Ultra
            cd get_task_status-5503 && streamlit run dashboard_ultra_status.py --server.port 8503
            
            # List Tasks Ultra
            cd list_tasks-5504 && streamlit run dashboard_ultra_list.py --server.port 8504
            
            # Clear Tasks Ultra
            cd clear_tasks-5505 && streamlit run dashboard_ultra_clear.py --server.port 8505
            
            # Delete Task Ultra
            cd delete_task-5506 && streamlit run dashboard_ultra_delete.py --server.port 8506
            
            # API Health Ultra
            cd check_api_health-5507 && streamlit run dashboard_ultra_health.py --server.port 8507
            ```
            
            ### 🎯 Usando Este Launcher
            ```bash
            # Executar launcher principal
            streamlit run launcher_ultra.py --server.port 8500
            ```
            """)
    
    def run_launcher(self):
        """Interface principal do launcher"""
        # Cabeçalho
        st.markdown('<h1 class="main-header">🚀 Claude-CTO Ultra Launcher</h1>', unsafe_allow_html=True)
        
        # Descrição
        st.markdown("""
        <div style="text-align: center; color: #6c757d; font-size: 1.2rem; margin-bottom: 2rem;">
            Centro de controle para todos os dashboards ultra-otimizados do Claude-CTO
        </div>
        """, unsafe_allow_html=True)
        
        # Visão geral do sistema
        self.render_system_overview()
        
        # Ações rápidas
        st.markdown("---")
        self.render_quick_actions()
        
        # Grid de dashboards
        st.markdown("---")
        self.render_dashboard_grid()
        
        # Guia de instalação
        st.markdown("---")
        self.render_installation_guide()
        
        # Sidebar com informações detalhadas
        with st.sidebar:
            st.subheader("📊 Dashboard Status")
            
            # Status de cada dashboard
            for dashboard in self.dashboards:
                is_running = self.check_dashboard_status(dashboard['port'])
                status_icon = "🟢" if is_running else "🔴"
                status_text = "Online" if is_running else "Offline"
                
                st.markdown(f"""
                <div style="background: white; padding: 0.8rem; border-radius: 10px; margin: 0.5rem 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    <strong>{dashboard['icon']} {dashboard['name']}</strong><br>
                    <small>{status_icon} {status_text} | Porta {dashboard['port']}</small>
                </div>
                """, unsafe_allow_html=True)
                
                # Link direto se estiver rodando
                if is_running:
                    st.markdown(f"[🔗 Abrir Dashboard](http://localhost:{dashboard['port']})")
            
            st.markdown("---")
            
            # Configurações globais
            st.subheader("⚙️ Configurações")
            
            auto_start = st.checkbox(
                "🚀 Auto-start ao abrir",
                help="Iniciar dashboards automaticamente"
            )
            
            if auto_start:
                st.info("🔄 Auto-start configurado")
            
            # Monitoramento
            monitor_health = st.checkbox(
                "🏥 Monitor de Saúde",
                help="Monitorar saúde dos dashboards"
            )
            
            if monitor_health:
                # Verificação automática a cada 30 segundos
                time.sleep(30)
                st.rerun()
            
            st.markdown("---")
            
            # Informações do sistema
            st.subheader("💻 Sistema")
            
            try:
                import psutil
                cpu = psutil.cpu_percent()
                memory = psutil.virtual_memory()
                
                st.metric("🖥️ CPU", f"{cpu:.1f}%")
                st.metric("💾 Memória", f"{memory.percent:.1f}%")
                st.metric("💽 Disponível", f"{memory.available / (1024**3):.1f} GB")
            except:
                st.info("📊 Métricas do sistema indisponíveis")
            
            # Links úteis
            st.markdown("---")
            st.subheader("🔗 Links Úteis")
            
            st.markdown("""
            - [📚 Documentação](http://localhost:8889/docs)
            - [🏥 API Health](http://localhost:8889/health)
            - [📊 Métricas](http://localhost:8889/metrics)
            """)

def main():
    """Função principal"""
    launcher = DashboardLauncher()
    launcher.run_launcher()

if __name__ == "__main__":
    main()