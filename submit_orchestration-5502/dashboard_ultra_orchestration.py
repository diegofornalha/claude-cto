#!/usr/bin/env python3
"""
Dashboard Submit Orchestration ULTRA - Claude-CTO
Interface ultra-avançada para submissão de orquestrações com visualização DAG interativa,
preview completo, estimativas de tempo e simulation mode
"""

import streamlit as st
import requests
import json
import time
import networkx as nx
import plotly.graph_objects as go
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import pandas as pd

# Configuração da página
st.set_page_config(
    page_title="Submit Orchestration Ultra - Claude-CTO",
    page_icon="🎼",
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
    
    .dag-container {
        background: white;
        border-radius: 20px;
        padding: 2rem;
        box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        margin: 1rem 0;
    }
    
    .task-node {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem;
        border-radius: 15px;
        margin: 0.5rem;
        text-align: center;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
    
    .phase-indicator {
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 25px;
        font-size: 0.9rem;
        font-weight: 600;
        display: inline-block;
        margin: 0.25rem;
    }
    
    .warning-box {
        background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
        border: 1px solid #ffc107;
        border-radius: 12px;
        padding: 1.5rem;
        color: #856404;
        margin: 1rem 0;
    }
    
    .info-box {
        background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
        border: 1px solid #17a2b8;
        border-radius: 12px;
        padding: 1.5rem;
        color: #0c5460;
        margin: 1rem 0;
    }
    
    .simulation-mode {
        background: linear-gradient(135deg, #e2e3e5 0%, #d6d8db 100%);
        border: 2px dashed #6c757d;
        border-radius: 15px;
        padding: 1.5rem;
        margin: 1rem 0;
    }
    
    .execution-timeline {
        background: white;
        border-radius: 15px;
        padding: 1.5rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

@dataclass
class TaskInfo:
    """Informações de uma tarefa"""
    identifier: str
    prompt: str
    model: str
    dependencies: List[str]
    estimated_duration: int
    complexity_score: int
    status: str

@dataclass
class OrchestrationPreview:
    """Preview de uma orquestração"""
    group_id: str
    total_tasks: int
    total_estimated_time: int
    phases: List[List[str]]
    dependency_graph: Dict
    risk_level: str

class DAGAnalyzer:
    """Analisador de DAG para orquestrações"""
    
    @staticmethod
    def analyze_dependencies(tasks: List[TaskInfo]) -> Tuple[List[List[str]], int, str]:
        """Analisa dependências e retorna fases, tempo total e nível de risco"""
        # Criar grafo direcionado
        G = nx.DiGraph()
        
        # Adicionar nós
        for task in tasks:
            G.add_node(task.identifier)
        
        # Adicionar arestas (dependências)
        for task in tasks:
            for dep in task.dependencies:
                if dep in [t.identifier for t in tasks]:
                    G.add_edge(dep, task.identifier)
        
        # Verificar se há ciclos
        if not nx.is_directed_acyclic_graph(G):
            return [], 0, "CRÍTICO - Dependências circulares detectadas"
        
        # Calcular fases (topological sort levels)
        phases = []
        remaining_nodes = set(G.nodes())
        
        while remaining_nodes:
            # Encontrar nós sem dependências pendentes
            current_phase = []
            for node in remaining_nodes:
                if all(pred not in remaining_nodes for pred in G.predecessors(node)):
                    current_phase.append(node)
            
            if not current_phase:
                break
                
            phases.append(current_phase)
            remaining_nodes -= set(current_phase)
        
        # Calcular tempo total estimado
        total_time = 0
        for phase in phases:
            phase_max_time = max([
                task.estimated_duration for task in tasks 
                if task.identifier in phase
            ], default=0)
            total_time += phase_max_time
        
        # Calcular nível de risco
        total_tasks = len(tasks)
        complex_tasks = sum(1 for task in tasks if task.complexity_score > 75)
        dependency_ratio = sum(len(task.dependencies) for task in tasks) / max(total_tasks, 1)
        
        if complex_tasks > total_tasks * 0.7 or dependency_ratio > 3:
            risk_level = "ALTO"
        elif complex_tasks > total_tasks * 0.4 or dependency_ratio > 1.5:
            risk_level = "MÉDIO"
        else:
            risk_level = "BAIXO"
        
        return phases, total_time, risk_level

class SubmitOrchestrationDashboard:
    def __init__(self):
        self.base_url = "http://localhost:8889/api/v1"
        self.dag_analyzer = DAGAnalyzer()
        
        # Inicializar estado
        if 'orchestration_groups' not in st.session_state:
            st.session_state.orchestration_groups = []
        if 'selected_group' not in st.session_state:
            st.session_state.selected_group = None
        if 'simulation_mode' not in st.session_state:
            st.session_state.simulation_mode = False
    
    def get_orchestration_groups(self) -> List[str]:
        """Obtém lista de grupos de orquestração disponíveis"""
        try:
            response = requests.get(f"{self.base_url}/orchestrations", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return list(set([orch.get('group_id', '') for orch in data.get('orchestrations', [])]))
        except Exception:
            pass
        return []
    
    def get_tasks_in_group(self, group_id: str) -> List[TaskInfo]:
        """Obtém tarefas de um grupo específico"""
        try:
            response = requests.get(f"{self.base_url}/tasks?group={group_id}", timeout=10)
            if response.status_code == 200:
                tasks_data = response.json()
                tasks = []
                
                for task_data in tasks_data.get('tasks', []):
                    tasks.append(TaskInfo(
                        identifier=task_data.get('task_identifier', ''),
                        prompt=task_data.get('execution_prompt', ''),
                        model=task_data.get('model', 'sonnet'),
                        dependencies=task_data.get('depends_on', []),
                        estimated_duration=task_data.get('_metadata', {}).get('complexity_score', 30),
                        complexity_score=task_data.get('_metadata', {}).get('complexity_score', 50),
                        status=task_data.get('status', 'pending')
                    ))
                
                return tasks
        except Exception:
            pass
        return []
    
    def render_dag_visualization(self, tasks: List[TaskInfo]):
        """Renderiza visualização DAG interativa"""
        if not tasks:
            st.warning("📭 Nenhuma tarefa encontrada no grupo")
            return
        
        # Criar grafo NetworkX
        G = nx.DiGraph()
        
        # Adicionar nós com posições
        for task in tasks:
            G.add_node(task.identifier, 
                      complexity=task.complexity_score,
                      duration=task.estimated_duration,
                      status=task.status)
        
        # Adicionar arestas
        for task in tasks:
            for dep in task.dependencies:
                if dep in [t.identifier for t in tasks]:
                    G.add_edge(dep, task.identifier)
        
        # Layout hierárquico
        try:
            pos = nx.spring_layout(G, k=3, iterations=50)
        except:
            pos = {task.identifier: (i, 0) for i, task in enumerate(tasks)}
        
        # Criar figura Plotly
        fig = go.Figure()
        
        # Adicionar arestas
        edge_x, edge_y = [], []
        for edge in G.edges():
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
        
        # Adicionar nós
        node_x = [pos[node][0] for node in G.nodes()]
        node_y = [pos[node][1] for node in G.nodes()]
        node_text = list(G.nodes())
        
        # Cores baseadas na complexidade
        node_colors = []
        for task in tasks:
            if task.complexity_score < 30:
                node_colors.append('#28a745')
            elif task.complexity_score < 60:
                node_colors.append('#ffc107')
            else:
                node_colors.append('#dc3545')
        
        fig.add_trace(go.Scatter(
            x=node_x, y=node_y,
            mode='markers+text',
            hovertemplate='<b>%{text}</b><br>Complexidade: %{customdata}<extra></extra>',
            customdata=[task.complexity_score for task in tasks],
            text=node_text,
            textposition="middle center",
            marker=dict(
                size=30,
                color=node_colors,
                line=dict(width=2, color='white')
            ),
            name='Tarefas'
        ))
        
        fig.update_layout(
            title="🎼 Visualização DAG da Orquestração",
            showlegend=False,
            height=500,
            xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            hovermode='closest'
        )
        
        st.plotly_chart(fig, use_container_width=True)
    
    def render_execution_timeline(self, phases: List[List[str]], tasks: List[TaskInfo]):
        """Renderiza timeline de execução"""
        st.subheader("⏰ Timeline de Execução")
        
        current_time = 0
        timeline_data = []
        
        for phase_idx, phase in enumerate(phases):
            phase_start = current_time
            phase_duration = max([
                task.estimated_duration for task in tasks 
                if task.identifier in phase
            ], default=5)
            
            timeline_data.append({
                'Fase': f"Fase {phase_idx + 1}",
                'Início': phase_start,
                'Duração': phase_duration,
                'Tarefas': ', '.join(phase),
                'Fim': phase_start + phase_duration
            })
            
            current_time += phase_duration
        
        # Criar gráfico Gantt
        fig = go.Figure()
        
        colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe']
        
        for i, row in enumerate(timeline_data):
            fig.add_trace(go.Scatter(
                x=[row['Início'], row['Fim']],
                y=[row['Fase'], row['Fase']],
                mode='lines+markers',
                line=dict(width=20, color=colors[i % len(colors)]),
                marker=dict(size=10),
                name=row['Fase'],
                hovertemplate=f"<b>{row['Fase']}</b><br>Duração: {row['Duração']}min<br>Tarefas: {row['Tarefas']}<extra></extra>"
            ))
        
        fig.update_layout(
            title="📊 Timeline de Execução por Fases",
            xaxis_title="Tempo (minutos)",
            yaxis_title="Fases",
            height=400,
            showlegend=False
        )
        
        st.plotly_chart(fig, use_container_width=True)
        
        # Tabela de resumo
        df = pd.DataFrame(timeline_data)
        st.dataframe(df, use_container_width=True)
    
    def render_risk_assessment(self, risk_level: str, tasks: List[TaskInfo]):
        """Renderiza avaliação de riscos"""
        st.subheader("⚠️ Avaliação de Riscos")
        
        risk_colors = {
            'BAIXO': '#28a745',
            'MÉDIO': '#ffc107', 
            'ALTO': '#dc3545',
            'CRÍTICO': '#6f42c1'
        }
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.markdown(f"""
            <div style="text-align: center; padding: 1rem; background: white; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <h4>🎯 Nível de Risco</h4>
                <h2 style="color: {risk_colors.get(risk_level, '#6c757d')}">{risk_level}</h2>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            complex_tasks = sum(1 for task in tasks if task.complexity_score > 75)
            st.markdown(f"""
            <div style="text-align: center; padding: 1rem; background: white; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <h4>🧠 Tarefas Complexas</h4>
                <h2 style="color: #dc3545">{complex_tasks}/{len(tasks)}</h2>
            </div>
            """, unsafe_allow_html=True)
        
        with col3:
            total_deps = sum(len(task.dependencies) for task in tasks)
            st.markdown(f"""
            <div style="text-align: center; padding: 1rem; background: white; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <h4>🔗 Total Dependências</h4>
                <h2 style="color: #17a2b8">{total_deps}</h2>
            </div>
            """, unsafe_allow_html=True)
        
        # Recomendações baseadas no risco
        if risk_level == "ALTO" or risk_level == "CRÍTICO":
            st.markdown("""
            <div class="warning-box">
                <strong>⚠️ Recomendações para Alto Risco:</strong><br>
                • Considere quebrar tarefas complexas em subtarefas menores<br>
                • Revise dependências para reduzir acoplamento<br>
                • Execute em modo simulação primeiro<br>
                • Monitore de perto durante execução
            </div>
            """, unsafe_allow_html=True)
    
    def submit_orchestration(self, group_id: str, simulation: bool = False) -> Optional[Dict]:
        """Submete orquestração para execução"""
        try:
            endpoint = f"{self.base_url}/orchestrations/submit"
            if simulation:
                endpoint += "?simulation=true"
            
            response = requests.post(
                endpoint,
                json={"orchestration_group": group_id},
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                st.error(f"❌ Erro ao submeter orquestração: {response.status_code}")
                return None
                
        except Exception as e:
            st.error(f"❌ Erro ao submeter orquestração: {e}")
            return None
    
    def run_dashboard(self):
        """Interface principal do dashboard"""
        # Cabeçalho
        st.markdown('<h1 class="main-header">🎼 Submeter Orquestração Ultra</h1>', unsafe_allow_html=True)
        
        # Obter grupos disponíveis
        groups = self.get_orchestration_groups()
        
        if not groups:
            st.markdown("""
            <div class="warning-box">
                <strong>📭 Nenhum grupo de orquestração encontrado</strong><br>
                Crie tarefas com grupos de orquestração primeiro usando o dashboard Create Task
            </div>
            """, unsafe_allow_html=True)
            return
        
        # Seletor de grupo
        st.subheader("🎯 Selecionar Grupo de Orquestração")
        
        selected_group = st.selectbox(
            "Grupo:",
            options=groups,
            help="Selecione o grupo de orquestração para submeter"
        )
        
        if not selected_group:
            return
        
        # Obter tarefas do grupo
        tasks = self.get_tasks_in_group(selected_group)
        
        if not tasks:
            st.warning(f"📭 Nenhuma tarefa encontrada no grupo '{selected_group}'")
            return
        
        # Análise do DAG
        phases, total_time, risk_level = self.dag_analyzer.analyze_dependencies(tasks)
        
        # Métricas principais
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("📊 Total de Tarefas", len(tasks))
        with col2:
            st.metric("🏗️ Fases de Execução", len(phases))
        with col3:
            st.metric("⏱️ Tempo Estimado", f"{total_time} min")
        with col4:
            st.metric("⚠️ Nível de Risco", risk_level)
        
        # Visualização DAG
        st.markdown("---")
        with st.container():
            st.markdown('<div class="dag-container">', unsafe_allow_html=True)
            self.render_dag_visualization(tasks)
            st.markdown('</div>', unsafe_allow_html=True)
        
        # Timeline de execução
        if phases:
            self.render_execution_timeline(phases, tasks)
        
        # Avaliação de riscos
        self.render_risk_assessment(risk_level, tasks)
        
        # Modo simulação
        st.markdown("---")
        st.subheader("🧪 Modo Simulação")
        
        simulation_mode = st.checkbox(
            "Executar em modo simulação (dry-run)",
            value=st.session_state.simulation_mode,
            help="Simula a execução sem realmente executar as tarefas"
        )
        st.session_state.simulation_mode = simulation_mode
        
        if simulation_mode:
            st.markdown("""
            <div class="simulation-mode">
                <strong>🧪 MODO SIMULAÇÃO ATIVADO</strong><br>
                A orquestração será simulada sem executar as tarefas reais.
                Útil para testar dependências e timing antes da execução real.
            </div>
            """, unsafe_allow_html=True)
        
        # Preview detalhado
        st.subheader("👀 Preview Detalhado")
        
        with st.expander("📋 Detalhes das Tarefas", expanded=True):
            for i, task in enumerate(tasks):
                st.markdown(f"""
                **{i+1}. {task.identifier}**
                - Modelo: {task.model}
                - Score: {task.complexity_score}
                - Dependências: {', '.join(task.dependencies) if task.dependencies else 'Nenhuma'}
                - Status: {task.status}
                """)
        
        # Botões de ação
        col1, col2 = st.columns(2)
        
        with col1:
            if st.button("🎼 Submeter Orquestração", use_container_width=True, type="primary"):
                with st.spinner("🔄 Submetendo orquestração..."):
                    result = self.submit_orchestration(selected_group, simulation_mode)
                
                if result:
                    mode_text = "simulada" if simulation_mode else "executada"
                    st.success(f"✅ Orquestração {mode_text} com sucesso!")
                    
                    with st.expander("📊 Resultado da Submissão"):
                        st.json(result)
        
        with col2:
            if st.button("🔄 Atualizar Dados", use_container_width=True):
                st.session_state.orchestration_groups = []
                st.rerun()
        
        # Sidebar com informações adicionais
        with st.sidebar:
            st.subheader("📊 Estatísticas do Grupo")
            
            if tasks:
                # Distribuição por modelo
                model_counts = {}
                for task in tasks:
                    model_counts[task.model] = model_counts.get(task.model, 0) + 1
                
                st.markdown("**🤖 Distribuição por Modelo:**")
                for model, count in model_counts.items():
                    st.text(f"{model}: {count}")
                
                # Distribuição por complexidade
                complexity_levels = {'Baixa': 0, 'Média': 0, 'Alta': 0}
                for task in tasks:
                    if task.complexity_score < 30:
                        complexity_levels['Baixa'] += 1
                    elif task.complexity_score < 60:
                        complexity_levels['Média'] += 1
                    else:
                        complexity_levels['Alta'] += 1
                
                st.markdown("**🎯 Distribuição por Complexidade:**")
                for level, count in complexity_levels.items():
                    st.text(f"{level}: {count}")
            
            st.markdown("---")
            
            # Ações rápidas
            st.subheader("⚡ Ações Rápidas")
            
            if st.button("➕ Criar Nova Tarefa", use_container_width=True):
                st.info("Redirecionando para Create Task...")
            
            if st.button("📋 Listar Todas Tarefas", use_container_width=True):
                st.info("Redirecionando para List Tasks...")
            
            if st.button("🏥 Health Check", use_container_width=True):
                st.info("Redirecionando para Health Monitor...")

def main():
    """Função principal"""
    dashboard = SubmitOrchestrationDashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()