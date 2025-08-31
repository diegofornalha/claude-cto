#!/usr/bin/env python3
"""
Dashboard de Monitoramento Claude-CTO com Integração MCP Real
Usa as funções MCP reais do claude-cto para monitoramento em tempo real
"""

import streamlit as st
import pandas as pd
import json
import time
import requests
import os
import sys
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

# CSS customizado
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
    
    .metric-container {
        display: flex;
        justify-content: space-around;
        margin: 1rem 0;
    }
    
    .metric-card {
        background: white;
        padding: 1rem;
        border-radius: 10px;
        border-left: 4px solid #667eea;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        text-align: center;
        min-width: 120px;
    }
    
    .metric-number {
        font-size: 2rem;
        font-weight: bold;
        margin: 0;
    }
    
    .metric-label {
        color: #666;
        font-size: 0.9rem;
        margin-top: 0.5rem;
    }
    
    .status-badge {
        padding: 0.3rem 0.8rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: bold;
        text-align: center;
        display: inline-block;
        margin: 0.2rem;
    }
    
    .status-completed { background-color: #28a745; color: white; }
    .status-running { background-color: #007bff; color: white; }
    .status-failed { background-color: #dc3545; color: white; }
    .status-pending { background-color: #6c757d; color: white; }
    
    .task-card {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        padding: 1rem;
        margin: 0.5rem 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .task-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }
    
    .task-id {
        font-weight: bold;
        color: #007bff;
    }
    
    .task-time {
        color: #666;
        font-size: 0.9rem;
    }
    
    .progress-container {
        margin: 0.5rem 0;
    }
    
    .last-update {
        text-align: right;
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 1rem;
    }
    
    .error-message {
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 5px;
        padding: 1rem;
        color: #721c24;
        margin: 1rem 0;
    }
    
    .success-message {
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        border-radius: 5px;
        padding: 1rem;
        color: #155724;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

class ClaudeCTOMCPDashboard:
    def __init__(self):
        self.status_colors = {
            'completed': '#28a745',
            'running': '#007bff', 
            'failed': '#dc3545',
            'pending': '#6c757d',
            'COMPLETED': '#28a745',
            'RUNNING': '#007bff', 
            'FAILED': '#dc3545',
            'PENDING': '#6c757d'
        }
        self.last_tasks = []
        
    def check_api_health(self) -> bool:
        """Verifica se a API claude-cto está funcionando"""
        try:
            response = requests.get("http://localhost:8889/health", timeout=5)
            return response.status_code == 200
        except Exception:
            return False
    
    def execute_api_request(self, endpoint: str, method: str = "GET", data: dict = None) -> Optional[dict]:
        """Executa requisição para API REST do claude-cto"""
        try:
            base_url = "http://localhost:8889/api/v1"
            url = f"{base_url}/{endpoint}"
            
            if method.upper() == "GET":
                response = requests.get(url, timeout=10)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, timeout=10)
            elif method.upper() == "DELETE":
                response = requests.delete(url, timeout=10)
            else:
                st.error(f"Método HTTP não suportado: {method}")
                return None
            
            if response.status_code == 200:
                try:
                    return response.json()
                except json.JSONDecodeError:
                    return {"success": True, "data": response.text}
            else:
                st.error(f"Erro API: {response.status_code} - {response.text}")
                return None
                
        except requests.exceptions.ConnectionError:
            st.error("❌ Não foi possível conectar com a API claude-cto na porta 8889")
            return None
        except requests.exceptions.Timeout:
            st.error("⏱️ Timeout ao conectar com a API claude-cto")
            return None
        except Exception as e:
            st.error(f"❌ Erro ao executar requisição API: {e}")
            return None
    
    def fetch_tasks_real(self) -> Optional[List[Dict]]:
        """Busca tarefas usando API REST do claude-cto"""
        # Primeiro verificar se a API está funcionando
        if not self.check_api_health():
            st.warning("⚠️ API claude-cto não está respondendo na porta 8889")
            return self.get_sample_tasks()  # Fallback para dados de exemplo
        
        result = self.execute_api_request("tasks?limit=50")
        
        if result and isinstance(result, list):
            return result
        elif result and isinstance(result, dict) and 'tasks' in result:
            return result['tasks']
        elif result and isinstance(result, dict) and 'data' in result:
            return result['data'] if isinstance(result['data'], list) else []
        else:
            # Fallback para dados de exemplo se API falhar
            st.warning("⚠️ Usando dados de exemplo - API não disponível")
            return self.get_sample_tasks()
    
    def get_task_status(self, task_identifier: str) -> Optional[Dict]:
        """Busca status específico de uma tarefa"""
        return self.execute_api_request(f"tasks/{task_identifier}")
    
    def get_sample_tasks(self) -> List[Dict]:
        """Retorna dados de exemplo quando API não está disponível"""
        return [
            {
                "id": "1",
                "task_identifier": "exemplo_analise_codigo",
                "status": "COMPLETED",
                "execution_prompt": "Analisar complexidade do código em /projeto/src para identificar funções que precisam ser refatoradas",
                "created_at": (datetime.now() - timedelta(hours=2)).isoformat() + "Z",
                "progress": 100
            },
            {
                "id": "2",
                "task_identifier": "exemplo_refatoracao",
                "status": "RUNNING",
                "execution_prompt": "Refatorar funções complexas identificadas na análise anterior para melhorar legibilidade",
                "created_at": (datetime.now() - timedelta(minutes=30)).isoformat() + "Z",
                "progress": 65
            },
            {
                "id": "3",
                "task_identifier": "exemplo_testes",
                "status": "PENDING",
                "execution_prompt": "Executar suite completa de testes após refatoração para garantir que nada quebrou",
                "created_at": (datetime.now() - timedelta(minutes=5)).isoformat() + "Z",
                "progress": 0
            }
        ]
    
    def calculate_elapsed_time(self, start_time: str) -> str:
        """Calcula tempo decorrido"""
        try:
            if not start_time:
                return "N/A"
            
            # Tentar vários formatos de data
            formats = [
                "%Y-%m-%dT%H:%M:%S.%fZ",
                "%Y-%m-%dT%H:%M:%SZ", 
                "%Y-%m-%dT%H:%M:%S",
                "%Y-%m-%d %H:%M:%S"
            ]
            
            start = None
            for fmt in formats:
                try:
                    start = datetime.strptime(start_time, fmt)
                    break
                except ValueError:
                    continue
            
            if not start:
                return "N/A"
                
            elapsed = datetime.utcnow() - start
            
            if elapsed.total_seconds() < 60:
                return f"{int(elapsed.total_seconds())}s"
            elif elapsed.total_seconds() < 3600:
                return f"{int(elapsed.total_seconds() / 60)}m"
            else:
                hours = int(elapsed.total_seconds() / 3600)
                minutes = int((elapsed.total_seconds() % 3600) / 60)
                return f"{hours}h {minutes}m"
                
        except Exception as e:
            return "N/A"
    
    def render_status_badge(self, status: str) -> str:
        """Renderiza badge de status"""
        status_clean = status.upper().strip()
        class_name = f"status-{status_clean.lower()}"
        return f'<span class="status-badge {class_name}">{status_clean}</span>'
    
    def render_progress_bar(self, progress: float, status: str) -> str:
        """Renderiza barra de progresso"""
        if status.upper() == 'COMPLETED':
            progress = 100
            color = self.status_colors['completed']
        elif status.upper() == 'FAILED':
            color = self.status_colors['failed']
        elif status.upper() == 'RUNNING':
            color = self.status_colors['running']
            if progress == 0:
                progress = 10  # Mostrar progresso mínimo para tarefas em execução
        else:
            color = self.status_colors['pending']
            
        width = min(max(progress, 0), 100)
        
        return f"""
        <div style="background-color: #e9ecef; border-radius: 10px; height: 20px; overflow: hidden; margin: 0.5rem 0;">
            <div style="background-color: {color}; height: 100%; width: {width}%; 
                        border-radius: 10px; transition: width 0.5s ease;"></div>
        </div>
        <div style="text-align: center; font-size: 0.8rem; color: #666;">
            {width:.0f}%
        </div>
        """
    
    def render_metrics(self, tasks: List[Dict]):
        """Renderiza métricas no topo"""
        total = len(tasks)
        completed = len([t for t in tasks if t.get('status', '').upper() == 'COMPLETED'])
        running = len([t for t in tasks if t.get('status', '').upper() == 'RUNNING'])
        failed = len([t for t in tasks if t.get('status', '').upper() == 'FAILED'])
        pending = len([t for t in tasks if t.get('status', '').upper() == 'PENDING'])
        
        # Calcular taxas
        success_rate = (completed / total * 100) if total > 0 else 0
        
        col1, col2, col3, col4, col5, col6 = st.columns(6)
        
        with col1:
            st.metric("Total", total)
        with col2:
            st.metric("✅ Completadas", completed)
        with col3:
            st.metric("🔄 Executando", running)  
        with col4:
            st.metric("❌ Falharam", failed)
        with col5:
            st.metric("⏳ Pendentes", pending)
        with col6:
            st.metric("📊 Taxa Sucesso", f"{success_rate:.1f}%")
    
    def render_task_card(self, task: Dict):
        """Renderiza card individual de tarefa"""
        task_id = task.get('id', 'N/A')
        identifier = task.get('task_identifier') or task.get('identifier') or f"task_{task_id}"
        status = task.get('status', 'UNKNOWN').upper()
        created_at = task.get('created_at', '')
        execution_prompt = task.get('execution_prompt') or task.get('final_summary') or 'Sem descrição'
        progress = task.get('progress', 0)
        
        # Calcular progresso baseado no status se não estiver definido
        if progress == 0:
            if status == 'COMPLETED':
                progress = 100
            elif status == 'RUNNING':
                progress = 50
            elif status == 'FAILED':
                progress = 0
        
        # Truncar descrição se muito longa - garantir que não seja None
        if execution_prompt and len(execution_prompt) > 150:
            execution_prompt = execution_prompt[:147] + "..."
        
        elapsed_time = self.calculate_elapsed_time(created_at)
        
        with st.container():
            st.markdown(f"""
            <div class="task-card">
                <div class="task-header">
                    <div>
                        <span class="task-id">#{task_id}</span>
                        <strong>{identifier}</strong>
                    </div>
                    <div class="task-time">
                        {elapsed_time}
                    </div>
                </div>
                
                <div style="margin: 0.5rem 0;">
                    {self.render_status_badge(status)}
                </div>
                
                <div style="color: #666; font-size: 0.9rem; margin: 0.5rem 0;">
                    {execution_prompt}
                </div>
                
                <div class="progress-container">
                    {self.render_progress_bar(progress, status)}
                </div>
            </div>
            """, unsafe_allow_html=True)
    
    def render_tasks_list(self, tasks: List[Dict], status_filter: str):
        """Renderiza lista de tarefas"""
        if not tasks:
            st.info("🤔 Nenhuma tarefa encontrada")
            return
            
        # Filtrar por status
        if status_filter != "Todos":
            tasks = [t for t in tasks if t.get('status', '').upper() == status_filter.upper()]
        
        if not tasks:
            st.info(f"🔍 Nenhuma tarefa encontrada com status: {status_filter}")
            return
        
        # Ordenar por data de criação (mais recentes primeiro)
        try:
            tasks = sorted(tasks, key=lambda x: x.get('created_at', ''), reverse=True)
        except:
            pass
        
        # Renderizar cada tarefa
        for task in tasks:
            self.render_task_card(task)
    
    def render_status_chart(self, tasks: List[Dict]):
        """Renderiza gráfico de distribuição por status"""
        if not tasks:
            return
            
        status_counts = {}
        for task in tasks:
            status = task.get('status', 'UNKNOWN').upper()
            status_counts[status] = status_counts.get(status, 0) + 1
        
        if status_counts:
            fig = px.pie(
                values=list(status_counts.values()),
                names=list(status_counts.keys()),
                color=list(status_counts.keys()),
                color_discrete_map=self.status_colors,
                title="Distribuição por Status"
            )
            
            fig.update_traces(textposition='inside', textinfo='percent+label')
            fig.update_layout(height=400, showlegend=True)
            
            st.plotly_chart(fig, use_container_width=True)
    
    def clear_completed_tasks(self):
        """Limpar tarefas completadas"""
        try:
            # Verificar se API está disponível
            if not self.check_api_health():
                st.error("❌ API claude-cto não está disponível na porta 8889")
                return
            
            # Fazer requisição POST para o endpoint correto
            response = requests.post(f"{self.base_url}/tasks/clear", timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                deleted_count = result.get('deleted', 0)
                st.success(f"✅ {deleted_count} tarefas completadas/falhadas foram removidas com sucesso!")
            else:
                st.error(f"❌ Erro ao limpar tarefas: {response.status_code} - {response.text}")
            
        except requests.exceptions.ConnectionError:
            st.error("❌ Não foi possível conectar com a API claude-cto na porta 8889")
        except Exception as e:
            st.error(f"❌ Erro: {e}")
    
    def run_dashboard(self):
        """Executa o dashboard principal"""
        # Cabeçalho
        st.markdown('<h1 class="main-header">🤖 Claude-CTO Monitor</h1>', unsafe_allow_html=True)
        
        # Controles superiores
        col1, col2, col3, col4 = st.columns([2, 1, 1, 1])
        
        with col1:
            auto_refresh = st.checkbox("🔄 Auto-refresh (5s)", value=True)
        
        with col2:
            status_filter = st.selectbox("Filtrar Status", 
                                       ["Todos", "Running", "Completed", "Failed", "Pending"])
        
        with col3:
            if st.button("🔄 Atualizar"):
                st.rerun()
        
        with col4:
            if st.button("🗑️ Limpar Concluídas"):
                self.clear_completed_tasks()
                time.sleep(1)
                st.rerun()
        
        # Container principal
        main_container = st.container()
        
        # Loop de atualização
        while True:
            with main_container:
                # Timestamp
                now = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
                st.markdown(f'<div class="last-update">Última atualização: {now}</div>', 
                          unsafe_allow_html=True)
                
                # Buscar tarefas
                with st.spinner("🔄 Carregando tarefas..."):
                    tasks = self.fetch_tasks_real()
                
                if tasks is not None and len(tasks) > 0:
                    # Métricas
                    self.render_metrics(tasks)
                    
                    st.markdown("---")
                    
                    # Lista de tarefas
                    st.subheader("📋 Tarefas Ativas")
                    self.render_tasks_list(tasks, status_filter)
                    
                    # Gráfico
                    if len(tasks) > 1:
                        st.markdown("---")
                        col1, col2 = st.columns([2, 1])
                        
                        with col2:
                            self.render_status_chart(tasks)
                            
                        with col1:
                            st.subheader("📈 Timeline de Atividade")
                            if tasks:
                                df = pd.DataFrame(tasks)
                                if 'created_at' in df.columns and 'status' in df.columns:
                                    # Mostrar tarefas por hora
                                    try:
                                        df['hour'] = pd.to_datetime(df['created_at']).dt.hour
                                        hourly_counts = df.groupby(['hour', 'status']).size().unstack(fill_value=0)
                                        st.bar_chart(hourly_counts)
                                    except:
                                        st.info("Dados insuficientes para timeline")
                
                elif tasks is not None and len(tasks) == 0:
                    st.info("🎉 Nenhuma tarefa ativa encontrada")
                    
                else:
                    st.error("❌ Erro ao conectar com API claude-cto")
                    st.markdown("""
                    <div class="error-message">
                        <strong>Possíveis soluções:</strong><br>
                        • Verifique se o claude-cto está rodando na porta 8889<br>
                        • Teste a conectividade: <code>curl http://localhost:8889/health</code><br>
                        • Verifique se o serviço claude-cto foi iniciado corretamente<br>
                        • Confirme que a porta 8889 não está bloqueada por firewall
                    </div>
                    """, unsafe_allow_html=True)
            
            # Controle de refresh
            if not auto_refresh:
                break
                
            time.sleep(5)
            st.rerun()

def main():
    """Função principal"""
    dashboard = ClaudeCTOMCPDashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()