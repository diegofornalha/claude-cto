#!/usr/bin/env python3
"""
Dashboard Check API Health ULTRA - Claude-CTO
Interface ultra-avançada para monitoramento de saúde com real-time metrics,
historical uptime tracking, response time graphs, error rate monitoring e alertas
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
import psutil
import threading

# Configuração da página
st.set_page_config(
    page_title="API Health Monitor Ultra - Claude-CTO",
    page_icon="🏥",
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
        background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-family: 'Inter', sans-serif;
    }
    
    .health-status {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        border-radius: 20px;
        margin: 1rem 0;
        font-size: 1.5rem;
        font-weight: 600;
        text-align: center;
    }
    
    .health-excellent {
        background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
        border: 2px solid #28a745;
        color: #155724;
    }
    
    .health-good {
        background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
        border: 2px solid #17a2b8;
        color: #0c5460;
    }
    
    .health-warning {
        background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
        border: 2px solid #ffc107;
        color: #856404;
    }
    
    .health-critical {
        background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
        border: 2px solid #dc3545;
        color: #721c24;
        animation: pulse-critical 2s infinite;
    }
    
    .metric-card-health {
        background: white;
        border-radius: 15px;
        padding: 1.5rem;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        border: 1px solid #e9ecef;
        margin: 0.5rem;
        transition: all 0.3s ease;
    }
    
    .metric-card-health:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.1);
    }
    
    .real-time-indicator {
        display: inline-block;
        width: 12px;
        height: 12px;
        background: #28a745;
        border-radius: 50%;
        margin-right: 0.5rem;
        animation: pulse 2s infinite;
    }
    
    .alert-container {
        background: linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%);
        color: white;
        padding: 1.5rem;
        border-radius: 15px;
        margin: 1rem 0;
        animation: shake 0.5s ease-in-out;
    }
    
    .uptime-badge {
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 25px;
        font-weight: 600;
        display: inline-block;
        margin: 0.5rem;
    }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
    
    @keyframes pulse-critical {
        0% { border-color: #dc3545; }
        50% { border-color: #ff6b6b; }
        100% { border-color: #dc3545; }
    }
    
    @keyframes shake {
        0%, 20%, 40%, 60%, 80% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
    }
</style>
""", unsafe_allow_html=True)

class HealthMetrics:
    """Coletor de métricas de saúde"""
    
    @staticmethod
    def get_system_metrics() -> Dict:
        """Obtém métricas do sistema"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                'cpu_usage': cpu_percent,
                'memory_usage': memory.percent,
                'memory_available': memory.available / (1024**3),  # GB
                'disk_usage': disk.percent,
                'disk_free': disk.free / (1024**3),  # GB
                'timestamp': datetime.now().isoformat()
            }
        except Exception:
            return {}
    
    @staticmethod
    def ping_api_endpoint(url: str, timeout: int = 5) -> Dict:
        """Testa conectividade com endpoint da API"""
        try:
            start_time = time.time()
            response = requests.get(url, timeout=timeout)
            response_time = (time.time() - start_time) * 1000
            
            return {
                'status_code': response.status_code,
                'response_time': round(response_time, 2),
                'is_healthy': response.status_code == 200,
                'timestamp': datetime.now().isoformat(),
                'content_length': len(response.content),
                'headers': dict(response.headers)
            }
        except requests.exceptions.ConnectionError:
            return {
                'status_code': 0,
                'response_time': timeout * 1000,
                'is_healthy': False,
                'error': 'Connection refused',
                'timestamp': datetime.now().isoformat()
            }
        except requests.exceptions.Timeout:
            return {
                'status_code': 0,
                'response_time': timeout * 1000,
                'is_healthy': False,
                'error': 'Timeout',
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'status_code': 0,
                'response_time': timeout * 1000,
                'is_healthy': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

class AlertManager:
    """Gerenciador de alertas de saúde"""
    
    @staticmethod
    def check_alert_conditions(metrics: Dict, thresholds: Dict) -> List[Dict]:
        """Verifica condições de alerta"""
        alerts = []
        
        # Alerta de latência
        if metrics.get('response_time', 0) > thresholds.get('response_time', 1000):
            alerts.append({
                'type': 'latency',
                'severity': 'warning',
                'message': f"Alta latência detectada: {metrics['response_time']}ms",
                'threshold': thresholds['response_time'],
                'current': metrics['response_time']
            })
        
        # Alerta de CPU
        if metrics.get('cpu_usage', 0) > thresholds.get('cpu_usage', 80):
            alerts.append({
                'type': 'cpu',
                'severity': 'critical',
                'message': f"Uso crítico de CPU: {metrics['cpu_usage']}%",
                'threshold': thresholds['cpu_usage'],
                'current': metrics['cpu_usage']
            })
        
        # Alerta de memória
        if metrics.get('memory_usage', 0) > thresholds.get('memory_usage', 85):
            alerts.append({
                'type': 'memory',
                'severity': 'critical',
                'message': f"Uso crítico de memória: {metrics['memory_usage']}%",
                'threshold': thresholds['memory_usage'],
                'current': metrics['memory_usage']
            })
        
        # Alerta de conectividade
        if not metrics.get('is_healthy', False):
            alerts.append({
                'type': 'connectivity',
                'severity': 'critical',
                'message': f"API inacessível: {metrics.get('error', 'Unknown error')}",
                'threshold': 'Online',
                'current': 'Offline'
            })
        
        return alerts

class HealthMonitorDashboard:
    def __init__(self):
        self.base_url = "http://localhost:8889"
        self.health_metrics = HealthMetrics()
        self.alert_manager = AlertManager()
        
        # Estado da aplicação
        if 'monitoring_active' not in st.session_state:
            st.session_state.monitoring_active = False
        if 'health_history' not in st.session_state:
            st.session_state.health_history = []
        if 'alert_thresholds' not in st.session_state:
            st.session_state.alert_thresholds = {
                'response_time': 1000,
                'cpu_usage': 80,
                'memory_usage': 85,
                'disk_usage': 90
            }
        if 'active_alerts' not in st.session_state:
            st.session_state.active_alerts = []
    
    def collect_health_data(self) -> Dict:
        """Coleta dados completos de saúde"""
        # Métricas da API
        api_health = self.health_metrics.ping_api_endpoint(f"{self.base_url}/health")
        
        # Métricas do sistema
        system_metrics = self.health_metrics.get_system_metrics()
        
        # Combinar métricas
        combined_metrics = {**api_health, **system_metrics}
        
        # Adicionar ao histórico
        st.session_state.health_history.append(combined_metrics)
        
        # Manter apenas últimas 100 entradas
        if len(st.session_state.health_history) > 100:
            st.session_state.health_history = st.session_state.health_history[-100:]
        
        return combined_metrics
    
    def calculate_uptime_percentage(self) -> float:
        """Calcula porcentagem de uptime"""
        if not st.session_state.health_history:
            return 0.0
        
        healthy_checks = sum(1 for check in st.session_state.health_history if check.get('is_healthy', False))
        total_checks = len(st.session_state.health_history)
        
        return (healthy_checks / total_checks) * 100 if total_checks > 0 else 0.0
    
    def render_main_health_status(self, current_metrics: Dict):
        """Renderiza status principal de saúde"""
        is_healthy = current_metrics.get('is_healthy', False)
        response_time = current_metrics.get('response_time', 0)
        
        # Determinar status geral
        if not is_healthy:
            status_class = "health-critical"
            status_text = "🔴 CRÍTICO - API Inacessível"
        elif response_time > 2000:
            status_class = "health-warning"
            status_text = "🟡 ATENÇÃO - Alta Latência"
        elif response_time > 500:
            status_class = "health-good"
            status_text = "🟢 BOM - Funcionando"
        else:
            status_class = "health-excellent"
            status_text = "💚 EXCELENTE - Ótima Performance"
        
        st.markdown(f"""
        <div class="health-status {status_class}">
            <span class="real-time-indicator"></span>
            {status_text}
        </div>
        """, unsafe_allow_html=True)
        
        # Métricas principais
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            uptime = self.calculate_uptime_percentage()
            uptime_color = "#28a745" if uptime > 95 else "#ffc107" if uptime > 90 else "#dc3545"
            
            st.markdown(f"""
            <div class="metric-card-health">
                <h4>⏰ Uptime</h4>
                <h2 style="color: {uptime_color}">{uptime:.1f}%</h2>
                <div class="uptime-badge">Últimas {len(st.session_state.health_history)} verificações</div>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            rt = current_metrics.get('response_time', 0)
            rt_color = "#28a745" if rt < 200 else "#ffc107" if rt < 1000 else "#dc3545"
            
            st.markdown(f"""
            <div class="metric-card-health">
                <h4>⚡ Latência</h4>
                <h2 style="color: {rt_color}">{rt:.0f}ms</h2>
                <small>Última verificação</small>
            </div>
            """, unsafe_allow_html=True)
        
        with col3:
            cpu = current_metrics.get('cpu_usage', 0)
            cpu_color = "#28a745" if cpu < 50 else "#ffc107" if cpu < 80 else "#dc3545"
            
            st.markdown(f"""
            <div class="metric-card-health">
                <h4>🖥️ CPU</h4>
                <h2 style="color: {cpu_color}">{cpu:.1f}%</h2>
                <small>Uso atual</small>
            </div>
            """, unsafe_allow_html=True)
        
        with col4:
            memory = current_metrics.get('memory_usage', 0)
            memory_color = "#28a745" if memory < 60 else "#ffc107" if memory < 85 else "#dc3545"
            
            st.markdown(f"""
            <div class="metric-card-health">
                <h4>💾 Memória</h4>
                <h2 style="color: {memory_color}">{memory:.1f}%</h2>
                <small>Uso atual</small>
            </div>
            """, unsafe_allow_html=True)
    
    def render_realtime_charts(self):
        """Renderiza gráficos em tempo real"""
        st.subheader("📈 Monitoramento em Tempo Real")
        
        if len(st.session_state.health_history) < 2:
            st.info("📊 Coletando dados... Execute o monitoramento por alguns segundos")
            return
        
        # Preparar dados para gráficos
        df = pd.DataFrame(st.session_state.health_history)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Gráfico de latência
        col1, col2 = st.columns(2)
        
        with col1:
            fig_latency = go.Figure()
            
            fig_latency.add_trace(go.Scatter(
                x=df['timestamp'],
                y=df['response_time'],
                mode='lines+markers',
                name='Latência (ms)',
                line=dict(color='#667eea', width=3),
                marker=dict(size=6)
            ))
            
            # Linha de threshold
            fig_latency.add_hline(
                y=st.session_state.alert_thresholds['response_time'],
                line_dash="dash",
                line_color="red",
                annotation_text="Threshold"
            )
            
            fig_latency.update_layout(
                title="⚡ Latência da API",
                xaxis_title="Tempo",
                yaxis_title="Latência (ms)",
                height=300
            )
            
            st.plotly_chart(fig_latency, use_container_width=True)
        
        with col2:
            # Gráfico de recursos do sistema
            fig_resources = go.Figure()
            
            fig_resources.add_trace(go.Scatter(
                x=df['timestamp'],
                y=df.get('cpu_usage', [0] * len(df)),
                mode='lines+markers',
                name='CPU %',
                line=dict(color='#ff6b6b', width=2)
            ))
            
            fig_resources.add_trace(go.Scatter(
                x=df['timestamp'],
                y=df.get('memory_usage', [0] * len(df)),
                mode='lines+markers',
                name='Memória %',
                line=dict(color='#4ecdc4', width=2)
            ))
            
            fig_resources.update_layout(
                title="💻 Recursos do Sistema",
                xaxis_title="Tempo",
                yaxis_title="Uso (%)",
                height=300
            )
            
            st.plotly_chart(fig_resources, use_container_width=True)
        
        # Gráfico de disponibilidade
        st.subheader("📊 Análise de Disponibilidade")
        
        # Calcular períodos de uptime/downtime
        availability_data = []
        for i, entry in enumerate(df.to_dict('records')):
            status = "Online" if entry.get('is_healthy', False) else "Offline"
            availability_data.append({
                'timestamp': entry['timestamp'],
                'status': status,
                'response_time': entry.get('response_time', 0)
            })
        
        if availability_data:
            avail_df = pd.DataFrame(availability_data)
            
            fig_availability = px.scatter(
                avail_df,
                x='timestamp',
                y='response_time',
                color='status',
                title="🔄 Disponibilidade vs Latência",
                color_discrete_map={'Online': '#28a745', 'Offline': '#dc3545'}
            )
            
            st.plotly_chart(fig_availability, use_container_width=True)
    
    def render_alert_system(self, current_metrics: Dict):
        """Renderiza sistema de alertas"""
        st.subheader("🚨 Sistema de Alertas")
        
        # Verificar condições de alerta
        alerts = self.alert_manager.check_alert_conditions(
            current_metrics, 
            st.session_state.alert_thresholds
        )
        
        # Atualizar alertas ativos
        st.session_state.active_alerts = alerts
        
        if alerts:
            for alert in alerts:
                severity_colors = {
                    'critical': '#dc3545',
                    'warning': '#ffc107',
                    'info': '#17a2b8'
                }
                
                severity_icons = {
                    'critical': '🚨',
                    'warning': '⚠️',
                    'info': 'ℹ️'
                }
                
                color = severity_colors.get(alert['severity'], '#6c757d')
                icon = severity_icons.get(alert['severity'], '❓')
                
                st.markdown(f"""
                <div class="alert-container" style="background: {color};">
                    <strong>{icon} ALERTA {alert['severity'].upper()}</strong><br>
                    {alert['message']}<br>
                    <small>Threshold: {alert['threshold']} | Atual: {alert['current']}</small>
                </div>
                """, unsafe_allow_html=True)
        else:
            st.markdown("""
            <div class="health-excellent">
                ✅ Nenhum alerta ativo - Sistema funcionando normalmente
            </div>
            """, unsafe_allow_html=True)
    
    def render_endpoint_testing(self):
        """Renderiza testador de endpoints"""
        st.subheader("🧪 Teste de Endpoints")
        
        # Endpoints padrão
        default_endpoints = [
            f"{self.base_url}/health",
            f"{self.base_url}/api/v1/tasks",
            f"{self.base_url}/api/v1/orchestrations"
        ]
        
        col1, col2 = st.columns([2, 1])
        
        with col1:
            custom_endpoint = st.text_input(
                "Endpoint customizado:",
                placeholder="http://localhost:8889/api/v1/custom",
                help="Digite URL completa para testar"
            )
        
        with col2:
            timeout = st.number_input(
                "Timeout (s):",
                min_value=1,
                max_value=30,
                value=5
            )
        
        # Testar endpoints
        st.markdown("**🎯 Endpoints Padrão:**")
        
        for endpoint in default_endpoints:
            col1, col2, col3 = st.columns([2, 1, 1])
            
            with col1:
                st.text(endpoint)
            
            with col2:
                if st.button(f"🧪 Testar", key=f"test_{hash(endpoint)}"):
                    with st.spinner("🔄 Testando..."):
                        result = self.health_metrics.ping_api_endpoint(endpoint, timeout)
                    
                    if result.get('is_healthy', False):
                        st.success(f"✅ {result['response_time']}ms")
                    else:
                        st.error(f"❌ {result.get('error', 'Failed')}")
            
            with col3:
                # Mostrar último resultado se disponível
                st.text("📊 Status")
        
        # Testar endpoint customizado
        if custom_endpoint:
            st.markdown("**🔧 Endpoint Customizado:**")
            
            if st.button("🧪 Testar Endpoint Customizado", use_container_width=True):
                with st.spinner("🔄 Testando endpoint customizado..."):
                    result = self.health_metrics.ping_api_endpoint(custom_endpoint, timeout)
                
                if result.get('is_healthy', False):
                    st.success(f"✅ Endpoint respondeu em {result['response_time']}ms")
                    
                    with st.expander("📋 Detalhes da Resposta"):
                        st.json(result)
                else:
                    st.error(f"❌ Falha: {result.get('error', 'Unknown error')}")
    
    def render_historical_analysis(self):
        """Renderiza análise histórica"""
        st.subheader("📚 Análise Histórica")
        
        if len(st.session_state.health_history) < 10:
            st.info("📊 Dados insuficientes para análise histórica (mín. 10 verificações)")
            return
        
        df = pd.DataFrame(st.session_state.health_history)
        
        # Estatísticas
        col1, col2, col3 = st.columns(3)
        
        with col1:
            avg_response_time = df['response_time'].mean()
            st.metric("⚡ Latência Média", f"{avg_response_time:.0f}ms")
        
        with col2:
            max_response_time = df['response_time'].max()
            st.metric("🔺 Pico de Latência", f"{max_response_time:.0f}ms")
        
        with col3:
            min_response_time = df['response_time'].min()
            st.metric("🔻 Melhor Latência", f"{min_response_time:.0f}ms")
        
        # Distribuição de latência
        fig_dist = px.histogram(
            df,
            x='response_time',
            title="📊 Distribuição de Latência",
            nbins=20
        )
        
        st.plotly_chart(fig_dist, use_container_width=True)
    
    def run_dashboard(self):
        """Interface principal do dashboard"""
        # Cabeçalho
        st.markdown('<h1 class="main-header">🏥 Monitor de Saúde Ultra</h1>', unsafe_allow_html=True)
        
        # Controles de monitoramento
        col1, col2, col3 = st.columns(3)
        
        with col1:
            monitoring_active = st.checkbox(
                "🔄 Monitoramento Ativo",
                value=st.session_state.monitoring_active,
                help="Ativa coleta automática de métricas"
            )
            st.session_state.monitoring_active = monitoring_active
        
        with col2:
            if monitoring_active:
                refresh_interval = st.slider(
                    "Intervalo (seg):",
                    5, 60, 10,
                    help="Frequência de coleta de métricas"
                )
        
        with col3:
            if st.button("🔄 Atualizar Agora", use_container_width=True):
                st.rerun()
        
        # Coletar métricas atuais
        current_metrics = self.collect_health_data()
        
        # Status principal
        self.render_main_health_status(current_metrics)
        
        # Sistema de alertas
        self.render_alert_system(current_metrics)
        
        # Gráficos em tempo real
        if st.session_state.health_history:
            self.render_realtime_charts()
        
        # Teste de endpoints
        st.markdown("---")
        self.render_endpoint_testing()
        
        # Análise histórica
        st.markdown("---")
        self.render_historical_analysis()
        
        # Auto-refresh se monitoramento ativo
        if monitoring_active:
            time.sleep(refresh_interval)
            st.rerun()
        
        # Sidebar com configurações
        with st.sidebar:
            st.subheader("⚙️ Configurações de Alerta")
            
            # Configurar thresholds
            st.markdown("**⚠️ Limites de Alerta:**")
            
            new_thresholds = {}
            
            new_thresholds['response_time'] = st.number_input(
                "⚡ Latência (ms):",
                min_value=100,
                max_value=5000,
                value=st.session_state.alert_thresholds['response_time'],
                step=100
            )
            
            new_thresholds['cpu_usage'] = st.slider(
                "🖥️ CPU (%):",
                0, 100, st.session_state.alert_thresholds['cpu_usage']
            )
            
            new_thresholds['memory_usage'] = st.slider(
                "💾 Memória (%):",
                0, 100, st.session_state.alert_thresholds['memory_usage']
            )
            
            new_thresholds['disk_usage'] = st.slider(
                "💽 Disco (%):",
                0, 100, st.session_state.alert_thresholds['disk_usage']
            )
            
            if st.button("💾 Salvar Configurações"):
                st.session_state.alert_thresholds = new_thresholds
                st.success("✅ Configurações salvas!")
            
            st.markdown("---")
            
            # Estatísticas rápidas
            st.subheader("📊 Estatísticas")
            
            if st.session_state.health_history:
                total_checks = len(st.session_state.health_history)
                failed_checks = sum(1 for check in st.session_state.health_history if not check.get('is_healthy', False))
                
                st.metric("🔍 Total Verificações", total_checks)
                st.metric("❌ Falhas", failed_checks)
                st.metric("🚨 Alertas Ativos", len(st.session_state.active_alerts))
            
            # Exportar dados
            st.markdown("---")
            st.subheader("📥 Exportar Dados")
            
            if st.button("📊 Exportar Métricas", use_container_width=True):
                if st.session_state.health_history:
                    df = pd.DataFrame(st.session_state.health_history)
                    csv_data = df.to_csv(index=False)
                    
                    st.download_button(
                        label="📥 Download CSV",
                        data=csv_data,
                        file_name=f"health_metrics_{datetime.now().strftime('%Y%m%d_%H%M')}.csv",
                        mime="text/csv",
                        use_container_width=True
                    )
            
            # Limpar histórico
            if st.button("🧹 Limpar Histórico", use_container_width=True):
                st.session_state.health_history = []
                st.success("🧹 Histórico limpo!")
            
            # Ações rápidas
            st.markdown("---")
            st.subheader("⚡ Ações Rápidas")
            
            if st.button("📋 Ver Tarefas", use_container_width=True):
                st.info("Redirecionando para List Tasks...")
            
            if st.button("➕ Nova Tarefa", use_container_width=True):
                st.info("Redirecionando para Create Task...")
            
            if st.button("🎼 Orquestrações", use_container_width=True):
                st.info("Redirecionando para Orchestrations...")

def main():
    """Função principal"""
    dashboard = HealthMonitorDashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()