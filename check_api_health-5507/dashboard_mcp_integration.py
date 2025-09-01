#!/usr/bin/env python3
"""
Dashboard Check API Health - Ferramenta MCP Claude-CTO
Monitor de saúde e diagnóstico da API claude-cto
"""

import streamlit as st
import requests
import json
import time
import psutil
import subprocess
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

# Configuração da página
st.set_page_config(
    page_title="API Health Monitor - Claude-CTO",
    page_icon="🏥",
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
        background: linear-gradient(90deg, #6f42c1 0%, #e83e8c 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    .health-container {
        background: white;
        padding: 2rem;
        border-radius: 15px;
        border: 2px solid #6f42c1;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        margin: 1rem 0;
    }
    
    .status-healthy {
        background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
        border: 2px solid #28a745;
        border-radius: 15px;
        padding: 2rem;
        text-align: center;
        margin: 1rem 0;
    }
    
    .status-unhealthy {
        background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
        border: 2px solid #dc3545;
        border-radius: 15px;
        padding: 2rem;
        text-align: center;
        margin: 1rem 0;
    }
    
    .status-warning {
        background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
        border: 2px solid #ffc107;
        border-radius: 15px;
        padding: 2rem;
        text-align: center;
        margin: 1rem 0;
    }
    
    .metric-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin: 1rem 0;
    }
    
    .metric-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        border: 1px solid #e9ecef;
    }
    
    .metric-value {
        font-size: 2rem;
        font-weight: bold;
        margin: 0.5rem 0;
    }
    
    .metric-label {
        color: #666;
        font-size: 0.9rem;
    }
    
    .health-indicator {
        display: inline-block;
        width: 15px;
        height: 15px;
        border-radius: 50%;
        margin-right: 8px;
        animation: pulse 2s infinite;
    }
    
    .health-good { background-color: #28a745; }
    .health-bad { background-color: #dc3545; }
    .health-warning { background-color: #ffc107; }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
    
    .log-container {
        background: #1a1a1a;
        color: #00ff00;
        font-family: 'Courier New', monospace;
        padding: 1rem;
        border-radius: 8px;
        max-height: 300px;
        overflow-y: auto;
        margin: 1rem 0;
    }
    
    .diagnostic-section {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 10px;
        padding: 1.5rem;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

class HealthMonitorDashboard:
    def __init__(self):
        self.base_url = "http://localhost:8889"
        self.api_url = f"{self.base_url}/api/v1"
        
    def check_api_health(self) -> Tuple[bool, Dict]:
        """Verifica saúde completa da API"""
        health_data = {
            "api_responsive": False,
            "response_time": None,
            "endpoints_status": {},
            "system_info": {},
            "error": None
        }
        
        try:
            # Teste de conectividade básica
            start_time = time.time()
            response = requests.get(f"{self.base_url}/health", timeout=5)
            response_time = (time.time() - start_time) * 1000  # ms
            
            health_data["response_time"] = response_time
            health_data["api_responsive"] = response.status_code == 200
            
            if response.status_code == 200:
                try:
                    health_data["system_info"] = response.json()
                except:
                    health_data["system_info"] = {"status": "healthy"}
            
        except requests.exceptions.ConnectionError:
            health_data["error"] = "Conexão recusada - API não está rodando"
        except requests.exceptions.Timeout:
            health_data["error"] = "Timeout - API não está respondendo"
        except Exception as e:
            health_data["error"] = f"Erro inesperado: {e}"
        
        return health_data["api_responsive"], health_data
    
    def test_api_endpoints(self) -> Dict[str, bool]:
        """Testa endpoints principais da API"""
        endpoints = {
            "tasks": f"{self.api_url}/tasks",
            "health": f"{self.base_url}/health",
            "orchestration": f"{self.api_url}/orchestration/groups"
        }
        
        results = {}
        
        for name, url in endpoints.items():
            try:
                response = requests.get(url, timeout=3)
                results[name] = response.status_code in [200, 404]  # 404 pode ser normal
            except:
                results[name] = False
        
        return results
    
    def get_system_metrics(self) -> Dict:
        """Coleta métricas do sistema"""
        try:
            return {
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory_percent": psutil.virtual_memory().percent,
                "disk_percent": psutil.disk_usage('/').percent,
                "processes": len(psutil.pids()),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {"error": f"Erro ao coletar métricas: {e}"}
    
    def check_claude_cto_process(self) -> Dict:
        """Verifica se processo claude-cto está rodando"""
        try:
            result = subprocess.run(
                ["pgrep", "-f", "claude-cto"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                pids = result.stdout.strip().split('\n')
                return {
                    "running": True,
                    "process_count": len([p for p in pids if p]),
                    "pids": pids
                }
            else:
                return {"running": False, "process_count": 0}
                
        except Exception as e:
            return {"running": False, "error": f"Erro ao verificar processo: {e}"}
    
    def render_health_status(self, is_healthy: bool, health_data: Dict):
        """Renderiza status geral de saúde"""
        if is_healthy:
            response_time = health_data.get("response_time", 0)
            
            if response_time < 100:
                status_class = "status-healthy"
                status_icon = "💚"
                status_text = "EXCELENTE"
            elif response_time < 500:
                status_class = "status-healthy"
                status_icon = "💚"
                status_text = "BOM"
            else:
                status_class = "status-warning"
                status_icon = "💛"
                status_text = "LENTO"
            
            st.markdown(f"""
            <div class="{status_class}">
                <h2>{status_icon} API ONLINE - {status_text}</h2>
                <p><strong>Tempo de resposta:</strong> {response_time:.0f}ms</p>
                <p><strong>Status:</strong> Operacional</p>
            </div>
            """, unsafe_allow_html=True)
            
        else:
            error_msg = health_data.get("error", "Erro desconhecido")
            
            st.markdown(f"""
            <div class="status-unhealthy">
                <h2>💔 API OFFLINE</h2>
                <p><strong>Erro:</strong> {error_msg}</p>
                <p><strong>Status:</strong> Não operacional</p>
            </div>
            """, unsafe_allow_html=True)
    
    def render_endpoints_status(self, endpoints: Dict[str, bool]):
        """Renderiza status dos endpoints"""
        st.subheader("🔗 Status dos Endpoints")
        
        for endpoint, status in endpoints.items():
            indicator_class = "health-good" if status else "health-bad"
            status_text = "✅ OK" if status else "❌ FALHA"
            
            st.markdown(f"""
            <div style="display: flex; align-items: center; margin: 0.5rem 0;">
                <span class="health-indicator {indicator_class}"></span>
                <strong>{endpoint}:</strong> {status_text}
            </div>
            """, unsafe_allow_html=True)
    
    def render_system_metrics(self, metrics: Dict):
        """Renderiza métricas do sistema"""
        if "error" in metrics:
            st.error(f"❌ {metrics['error']}")
            return
        
        st.subheader("📊 Métricas do Sistema")
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            cpu = metrics.get("cpu_percent", 0)
            cpu_color = "#28a745" if cpu < 70 else "#ffc107" if cpu < 90 else "#dc3545"
            
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-value" style="color: {cpu_color};">{cpu:.1f}%</div>
                <div class="metric-label">CPU</div>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            memory = metrics.get("memory_percent", 0)
            mem_color = "#28a745" if memory < 70 else "#ffc107" if memory < 90 else "#dc3545"
            
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-value" style="color: {mem_color};">{memory:.1f}%</div>
                <div class="metric-label">Memória</div>
            </div>
            """, unsafe_allow_html=True)
        
        with col3:
            disk = metrics.get("disk_percent", 0)
            disk_color = "#28a745" if disk < 80 else "#ffc107" if disk < 95 else "#dc3545"
            
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-value" style="color: {disk_color};">{disk:.1f}%</div>
                <div class="metric-label">Disco</div>
            </div>
            """, unsafe_allow_html=True)
        
        with col4:
            processes = metrics.get("processes", 0)
            
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-value" style="color: #007bff;">{processes}</div>
                <div class="metric-label">Processos</div>
            </div>
            """, unsafe_allow_html=True)
    
    def render_process_info(self, process_info: Dict):
        """Renderiza informações do processo claude-cto"""
        st.subheader("🔍 Processo Claude-CTO")
        
        if process_info.get("running"):
            process_count = process_info.get("process_count", 0)
            pids = process_info.get("pids", [])
            
            st.markdown(f"""
            <div class="status-healthy">
                <h4>✅ Processo Ativo</h4>
                <p><strong>Instâncias:</strong> {process_count}</p>
                <p><strong>PIDs:</strong> {', '.join(pids)}</p>
            </div>
            """, unsafe_allow_html=True)
            
        else:
            error = process_info.get("error", "Processo não encontrado")
            
            st.markdown(f"""
            <div class="status-unhealthy">
                <h4>❌ Processo Inativo</h4>
                <p>{error}</p>
            </div>
            """, unsafe_allow_html=True)
    
    def render_diagnostic_suggestions(self, is_healthy: bool, health_data: Dict, process_info: Dict):
        """Renderiza sugestões de diagnóstico"""
        st.subheader("🔧 Diagnóstico e Soluções")
        
        suggestions = []
        
        if not is_healthy:
            if not process_info.get("running"):
                suggestions.append({
                    "icon": "🚀",
                    "title": "Iniciar Claude-CTO",
                    "commands": [
                        "cd /home/suthub/.claude/claude-cto/",
                        "python -m claude_cto.server --port 8889"
                    ],
                    "description": "O processo claude-cto não está rodando"
                })
            
            suggestions.append({
                "icon": "🔌", 
                "title": "Verificar Conectividade",
                "commands": [
                    "curl -I http://localhost:8889/health",
                    "netstat -tulpn | grep 8889"
                ],
                "description": "Testar conectividade com a porta 8889"
            })
            
            suggestions.append({
                "icon": "📋",
                "title": "Verificar Logs",
                "commands": [
                    "journalctl -u claude-cto --since '1 hour ago'",
                    "tail -f /var/log/claude-cto.log"
                ],
                "description": "Verificar logs para erros"
            })
        
        else:
            response_time = health_data.get("response_time", 0)
            
            if response_time > 500:
                suggestions.append({
                    "icon": "⚡",
                    "title": "Otimizar Performance",
                    "commands": [
                        "systemctl status claude-cto",
                        "top -p $(pgrep claude-cto)"
                    ],
                    "description": f"API está lenta ({response_time:.0f}ms)"
                })
        
        # Renderizar sugestões
        for suggestion in suggestions:
            st.markdown(f"""
            <div class="diagnostic-section">
                <h4>{suggestion['icon']} {suggestion['title']}</h4>
                <p>{suggestion['description']}</p>
                <div class="log-container">
                    <code>{'<br>'.join(suggestion['commands'])}</code>
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        if not suggestions:
            st.markdown("""
            <div class="status-healthy">
                <h4>🎉 Sistema Funcionando Perfeitamente</h4>
                <p>Nenhum problema detectado</p>
            </div>
            """, unsafe_allow_html=True)
    
    def run_dashboard(self):
        """Interface principal do monitor de saúde"""
        # Cabeçalho
        st.markdown('<h1 class="main-header">🏥 Monitor de Saúde API</h1>', unsafe_allow_html=True)
        
        # Controles
        col1, col2, col3 = st.columns([2, 1, 1])
        
        with col1:
            auto_refresh = st.checkbox("🔄 Auto-refresh (10s)", value=True)
        
        with col2:
            if st.button("🔄 Atualizar Agora"):
                st.rerun()
        
        with col3:
            if st.button("🧪 Teste Completo"):
                st.session_state.run_full_test = True
        
        # Container principal
        main_container = st.container()
        
        # Loop de monitoramento
        while True:
            with main_container:
                # Timestamp
                now = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
                st.markdown(f'<div style="text-align: right; color: #666; margin: 1rem 0;">Última verificação: {now}</div>', 
                          unsafe_allow_html=True)
                
                # Verificação de saúde principal
                with st.spinner("🔍 Verificando saúde da API..."):
                    is_healthy, health_data = self.check_api_health()
                
                # Status principal
                self.render_health_status(is_healthy, health_data)
                
                # Testes detalhados
                col1, col2 = st.columns(2)
                
                with col1:
                    st.markdown('<div class="health-container">', unsafe_allow_html=True)
                    
                    # Teste de endpoints
                    with st.spinner("🔗 Testando endpoints..."):
                        endpoints_status = self.test_api_endpoints()
                    
                    self.render_endpoints_status(endpoints_status)
                    
                    st.markdown('</div>', unsafe_allow_html=True)
                
                with col2:
                    st.markdown('<div class="health-container">', unsafe_allow_html=True)
                    
                    # Verificação de processo
                    with st.spinner("🔍 Verificando processo..."):
                        process_info = self.check_claude_cto_process()
                    
                    self.render_process_info(process_info)
                    
                    st.markdown('</div>', unsafe_allow_html=True)
                
                # Métricas do sistema
                with st.spinner("📊 Coletando métricas do sistema..."):
                    system_metrics = self.get_system_metrics()
                
                self.render_system_metrics(system_metrics)
                
                # Diagnóstico e sugestões
                self.render_diagnostic_suggestions(is_healthy, health_data, process_info)
                
                # Teste completo se solicitado
                if st.session_state.get('run_full_test', False):
                    st.markdown("---")
                    st.subheader("🧪 Teste Completo da API")
                    
                    with st.spinner("🔄 Executando bateria de testes..."):
                        # Simular testes mais profundos
                        time.sleep(2)
                        
                        test_results = {
                            "Conectividade": is_healthy,
                            "Endpoints": all(endpoints_status.values()),
                            "Processo": process_info.get("running", False),
                            "Performance": health_data.get("response_time", 1000) < 500,
                            "Recursos": system_metrics.get("memory_percent", 100) < 90
                        }
                        
                        for test_name, result in test_results.items():
                            status_icon = "✅" if result else "❌"
                            st.text(f"{status_icon} {test_name}: {'OK' if result else 'FALHA'}")
                    
                    st.session_state.run_full_test = False
                
                # Informações adicionais
                st.markdown("---")
                st.subheader("ℹ️ Informações do Sistema")
                
                with st.expander("📄 Dados Completos da Saúde"):
                    st.json({
                        "health_check": health_data,
                        "endpoints": endpoints_status,
                        "process": process_info,
                        "system": system_metrics
                    })
            
            # Controle de refresh
            if not auto_refresh:
                break
                
            time.sleep(10)
            st.rerun()

def main():
    """Função principal"""
    dashboard = HealthMonitorDashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()