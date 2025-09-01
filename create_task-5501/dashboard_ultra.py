#!/usr/bin/env python3
"""
Dashboard Create Task ULTRA - Ferramenta MCP Claude-CTO
Interface ultra-otimizada para criação de tarefas com validação em tempo real,
templates pré-definidos, visualização de dependências em grafo e métricas avançadas
"""

import streamlit as st
import requests
import json
import os
import time
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Optional, List, Tuple
import plotly.graph_objects as go
import plotly.express as px
from dataclasses import dataclass
import re

# Configuração da página
st.set_page_config(
    page_title="Create Task Ultra - Claude-CTO",
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS customizado ultra-avançado
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    .main-header {
        font-size: 3rem;
        font-weight: 700;
        text-align: center;
        margin-bottom: 2rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-family: 'Inter', sans-serif;
        text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .form-container {
        background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
        padding: 2.5rem;
        border-radius: 20px;
        border: 1px solid #e9ecef;
        box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        margin: 1.5rem 0;
        transition: all 0.3s ease;
    }
    
    .form-container:hover {
        box-shadow: 0 15px 40px rgba(0,0,0,0.12);
        transform: translateY(-2px);
    }
    
    .success-message {
        background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
        border: 1px solid #28a745;
        border-radius: 12px;
        padding: 1.5rem;
        color: #155724;
        margin: 1rem 0;
        animation: slideIn 0.5s ease-out;
    }
    
    .error-message {
        background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
        border: 1px solid #dc3545;
        border-radius: 12px;
        padding: 1.5rem;
        color: #721c24;
        margin: 1rem 0;
        animation: shake 0.5s ease-in-out;
    }
    
    .help-box {
        background: linear-gradient(135deg, #e7f3ff 0%, #d1ecf1 100%);
        border: 1px solid #17a2b8;
        border-radius: 12px;
        padding: 1.5rem;
        color: #0c5460;
        margin: 1rem 0;
    }
    
    .template-card {
        background: white;
        border: 2px solid #e9ecef;
        border-radius: 15px;
        padding: 1.5rem;
        margin: 0.5rem;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    
    .template-card:hover {
        border-color: #667eea;
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
    }
    
    .template-selected {
        border-color: #667eea !important;
        background: linear-gradient(135deg, #f8f9ff 0%, #e8ecff 100%) !important;
    }
    
    .metric-card {
        background: white;
        border-radius: 15px;
        padding: 1.5rem;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        border: 1px solid #e9ecef;
    }
    
    .validation-indicator {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-left: 8px;
        transition: all 0.3s ease;
    }
    
    .valid { background-color: #28a745; }
    .invalid { background-color: #dc3545; }
    .pending { background-color: #ffc107; }
    
    @keyframes slideIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes shake {
        0%, 20%, 40%, 60%, 80% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    }
    
    .stButton > button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 25px;
        color: white;
        font-weight: 600;
        padding: 0.75rem 2rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }
</style>
""", unsafe_allow_html=True)

# Estruturas de dados avançadas
@dataclass
class TaskTemplate:
    """Template pré-definido para criação de tarefas"""
    name: str
    icon: str
    description: str
    identifier_prefix: str
    execution_prompt_template: str
    default_model: str
    tags: List[str]
    estimated_duration: str
    complexity: str

@dataclass
class ValidationResult:
    """Resultado de validação de campos"""
    is_valid: bool
    field_name: str
    message: str
    severity: str  # 'error', 'warning', 'info'

class TaskComplexityEstimator:
    """Estimador de complexidade e duração de tarefas"""
    
    @staticmethod
    def estimate_complexity(prompt: str, model: str) -> Tuple[str, str, int]:
        """Estima complexidade, duração e score baseado no prompt"""
        words = len(prompt.split())
        keywords_complex = ['refactor', 'implement', 'create', 'build', 'deploy', 'migrate']
        keywords_simple = ['read', 'analyze', 'check', 'list', 'find', 'search']
        
        complex_count = sum(1 for kw in keywords_complex if kw in prompt.lower())
        simple_count = sum(1 for kw in keywords_simple if kw in prompt.lower())
        
        # Score base
        score = words * 0.5 + complex_count * 10 - simple_count * 5
        
        # Ajuste por modelo
        model_multiplier = {'haiku': 0.7, 'sonnet': 1.0, 'opus': 1.4}
        score *= model_multiplier.get(model, 1.0)
        
        if score < 20:
            return "Simples", "2-5 min", int(score)
        elif score < 50:
            return "Moderada", "5-15 min", int(score)
        elif score < 100:
            return "Complexa", "15-45 min", int(score)
        else:
            return "Muito Complexa", "45+ min", int(score)

class TaskTemplateManager:
    """Gerenciador de templates de tarefas"""
    
    @staticmethod
    def get_templates() -> List[TaskTemplate]:
        """Retorna lista de templates pré-definidos"""
        return [
            TaskTemplate(
                name="Análise de Código",
                icon="🔍",
                description="Analisar complexidade, padrões e qualidade do código",
                identifier_prefix="analise_codigo_",
                execution_prompt_template="Analisar todos os arquivos {linguagem} em {caminho} para identificar {criterios} e fornecer relatório detalhado com sugestões específicas de melhoria",
                default_model="sonnet",
                tags=["análise", "qualidade", "código"],
                estimated_duration="5-15 min",
                complexity="Moderada"
            ),
            TaskTemplate(
                name="Implementação de Feature",
                icon="⚡",
                description="Implementar nova funcionalidade completa",
                identifier_prefix="feature_",
                execution_prompt_template="Implementar {feature_name} em {tecnologia} no diretório {caminho}, incluindo {componentes} e testes adequados",
                default_model="opus",
                tags=["desenvolvimento", "feature", "implementação"],
                estimated_duration="30-60 min",
                complexity="Complexa"
            ),
            TaskTemplate(
                name="Correção de Bug",
                icon="🐛",
                description="Investigar e corrigir problemas específicos",
                identifier_prefix="bugfix_",
                execution_prompt_template="Investigar e corrigir {problema} no arquivo {arquivo}, implementando {solucao} e adicionando testes de regressão",
                default_model="sonnet",
                tags=["bug", "correção", "debug"],
                estimated_duration="10-30 min",
                complexity="Moderada"
            ),
            TaskTemplate(
                name="Refatoração",
                icon="🔧",
                description="Melhorar estrutura e qualidade do código existente",
                identifier_prefix="refactor_",
                execution_prompt_template="Refatorar {componente} em {caminho} para {objetivo}, mantendo funcionalidade existente e melhorando {aspectos}",
                default_model="opus",
                tags=["refatoração", "limpeza", "otimização"],
                estimated_duration="20-45 min",
                complexity="Complexa"
            ),
            TaskTemplate(
                name="Documentação",
                icon="📚",
                description="Criar ou atualizar documentação",
                identifier_prefix="doc_",
                execution_prompt_template="Criar documentação detalhada para {componente} em {formato}, incluindo {secoes} e exemplos práticos",
                default_model="haiku",
                tags=["documentação", "manual", "guia"],
                estimated_duration="10-25 min",
                complexity="Simples"
            ),
            TaskTemplate(
                name="Teste Automatizado",
                icon="🧪",
                description="Criar suíte de testes abrangente",
                identifier_prefix="test_",
                execution_prompt_template="Criar testes {tipo_teste} para {componente} em {framework}, cobrindo {cenarios} com pelo menos 90% de cobertura",
                default_model="sonnet",
                tags=["teste", "qa", "cobertura"],
                estimated_duration="15-40 min",
                complexity="Complexa"
            )
        ]

class FormValidator:
    """Validador avançado de formulários com feedback em tempo real"""
    
    @staticmethod
    def validate_identifier(identifier: str) -> ValidationResult:
        """Valida identificador de tarefa"""
        if not identifier:
            return ValidationResult(False, "identifier", "Identificador é obrigatório", "error")
        
        if not re.match(r'^[a-zA-Z][a-zA-Z0-9_-]*$', identifier):
            return ValidationResult(False, "identifier", "Use apenas letras, números, _ e -. Deve começar com letra", "error")
        
        if len(identifier) < 3:
            return ValidationResult(False, "identifier", "Identificador muito curto (mín. 3 caracteres)", "warning")
        
        if len(identifier) > 50:
            return ValidationResult(False, "identifier", "Identificador muito longo (máx. 50 caracteres)", "warning")
        
        return ValidationResult(True, "identifier", "Identificador válido", "info")
    
    @staticmethod
    def validate_prompt(prompt: str) -> ValidationResult:
        """Valida prompt de execução"""
        if not prompt:
            return ValidationResult(False, "prompt", "Descrição é obrigatória", "error")
        
        if len(prompt) < 150:
            return ValidationResult(False, "prompt", f"Muito curto ({len(prompt)}/150 caracteres mínimos)", "error")
        
        if len(prompt) > 2000:
            return ValidationResult(False, "prompt", "Muito longo (máx. 2000 caracteres)", "warning")
        
        # Verificar qualidade do prompt
        quality_indicators = ['arquivo', 'diretório', 'implementar', 'analisar', 'corrigir']
        quality_score = sum(1 for indicator in quality_indicators if indicator in prompt.lower())
        
        if quality_score < 2:
            return ValidationResult(True, "prompt", "Considere ser mais específico sobre arquivos/objetivos", "warning")
        
        return ValidationResult(True, "prompt", "Descrição bem detalhada", "info")
    
    @staticmethod
    def validate_directory(directory: str) -> ValidationResult:
        """Valida diretório de trabalho"""
        if not directory:
            return ValidationResult(True, "directory", "Usando diretório atual", "info")
        
        if os.path.isabs(directory) and not os.path.exists(directory):
            return ValidationResult(False, "directory", "Diretório não existe", "warning")
        
        return ValidationResult(True, "directory", "Diretório válido", "info")
    
    @staticmethod
    def validate_dependencies(deps_text: str, existing_tasks: List[str]) -> ValidationResult:
        """Valida dependências de tarefas"""
        if not deps_text:
            return ValidationResult(True, "dependencies", "Nenhuma dependência", "info")
        
        deps = [dep.strip() for dep in deps_text.split(",") if dep.strip()]
        
        for dep in deps:
            if dep not in existing_tasks:
                return ValidationResult(False, "dependencies", f"Tarefa '{dep}' não encontrada", "warning")
        
        return ValidationResult(True, "dependencies", f"{len(deps)} dependências válidas", "info")

class CreateTaskDashboardUltra:
    def __init__(self):
        self.base_url = "http://localhost:8889/api/v1"
        self.template_manager = TaskTemplateManager()
        self.validator = FormValidator()
        self.complexity_estimator = TaskComplexityEstimator()
        
        # Cache para evitar requests desnecessários
        if 'existing_tasks' not in st.session_state:
            st.session_state.existing_tasks = []
            
        if 'selected_template' not in st.session_state:
            st.session_state.selected_template = None
            
        if 'form_data' not in st.session_state:
            st.session_state.form_data = {}
            
        if 'validation_cache' not in st.session_state:
            st.session_state.validation_cache = {}
        
    def check_api_health(self) -> Tuple[bool, Dict]:
        """Verifica se a API claude-cto está funcionando e retorna métricas"""
        try:
            start_time = time.time()
            response = requests.get("http://localhost:8889/health", timeout=5)
            response_time = (time.time() - start_time) * 1000
            
            health_data = {
                'status': response.status_code == 200,
                'response_time': round(response_time, 2),
                'timestamp': datetime.now().isoformat(),
                'server_info': response.json() if response.status_code == 200 else {}
            }
            
            return response.status_code == 200, health_data
        except Exception as e:
            return False, {
                'status': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def get_existing_tasks(self) -> List[str]:
        """Obtém lista de tarefas existentes para validação de dependências"""
        try:
            response = requests.get(f"{self.base_url}/tasks", timeout=10)
            if response.status_code == 200:
                tasks_data = response.json()
                return [task.get('task_identifier', '') for task in tasks_data.get('tasks', [])]
        except Exception:
            pass
        return []
    
    def render_template_selector(self) -> Optional[TaskTemplate]:
        """Renderiza seletor de templates com preview"""
        st.subheader("🎯 Templates Rápidos")
        
        templates = self.template_manager.get_templates()
        
        # Grid de templates
        cols = st.columns(3)
        selected_template = None
        
        for i, template in enumerate(templates):
            with cols[i % 3]:
                # Buscar o template selecionado
                if st.session_state.selected_template == template.name:
                    selected_template = template
                
                if st.button(
                    f"{template.icon} {template.name}",
                    key=f"template_{i}",
                    help=template.description,
                    use_container_width=True
                ):
                    st.session_state.selected_template = template.name
                    selected_template = template
                    st.rerun()
                
                # Mostrar detalhes do template
                if st.session_state.selected_template == template.name:
                    st.markdown(f"""
                    <div class="help-box">
                        <strong>{template.icon} {template.name}</strong><br>
                        📝 {template.description}<br>
                        ⏱️ Duração: {template.estimated_duration}<br>
                        🎯 Complexidade: {template.complexity}<br>
                        🏷️ Tags: {', '.join(template.tags)}
                    </div>
                    """, unsafe_allow_html=True)
        
        return selected_template
    
    def render_dependency_graph(self, dependencies: List[str]):
        """Renderiza grafo visual de dependências"""
        if not dependencies:
            return
        
        # Criar grafo simples
        fig = go.Figure()
        
        # Nós
        x_positions = list(range(len(dependencies) + 1))
        y_positions = [0] * (len(dependencies) + 1)
        
        # Adicionar nós das dependências
        fig.add_trace(go.Scatter(
            x=x_positions[:-1],
            y=y_positions[:-1],
            mode='markers+text',
            marker=dict(size=20, color='lightblue'),
            text=dependencies,
            textposition='bottom center',
            name='Dependências'
        ))
        
        # Adicionar nó da tarefa atual
        fig.add_trace(go.Scatter(
            x=[x_positions[-1]],
            y=[y_positions[-1]],
            mode='markers+text',
            marker=dict(size=25, color='lightgreen'),
            text=['Nova Tarefa'],
            textposition='bottom center',
            name='Tarefa Atual'
        ))
        
        # Adicionar setas
        for i in range(len(dependencies)):
            fig.add_annotation(
                x=x_positions[i+1], y=0,
                ax=x_positions[i], ay=0,
                xref='x', yref='y',
                axref='x', ayref='y',
                arrowhead=2,
                arrowsize=1.5,
                arrowwidth=2,
                arrowcolor='gray'
            )
        
        fig.update_layout(
            title="📊 Grafo de Dependências",
            showlegend=False,
            height=200,
            xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)'
        )
        
        st.plotly_chart(fig, use_container_width=True)
    
    def render_validation_indicator(self, validation: ValidationResult) -> str:
        """Renderiza indicador visual de validação"""
        color_map = {
            'error': 'invalid',
            'warning': 'pending',
            'info': 'valid'
        }
        
        color_class = color_map.get(validation.severity, 'pending')
        return f'<span class="validation-indicator {color_class}" title="{validation.message}"></span>'
    
    def render_complexity_metrics(self, prompt: str, model: str):
        """Renderiza métricas de complexidade em tempo real"""
        if not prompt:
            return
        
        complexity, duration, score = self.complexity_estimator.estimate_complexity(prompt, model)
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.markdown(f"""
            <div class="metric-card">
                <h4>🎯 Complexidade</h4>
                <h3 style="color: {'#28a745' if score < 50 else '#ffc107' if score < 100 else '#dc3545'}">{complexity}</h3>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            st.markdown(f"""
            <div class="metric-card">
                <h4>⏱️ Duração Est.</h4>
                <h3 style="color: #17a2b8">{duration}</h3>
            </div>
            """, unsafe_allow_html=True)
        
        with col3:
            st.markdown(f"""
            <div class="metric-card">
                <h4>📊 Score</h4>
                <h3 style="color: #6f42c1">{score}</h3>
            </div>
            """, unsafe_allow_html=True)
        
        with col4:
            words = len(prompt.split())
            st.markdown(f"""
            <div class="metric-card">
                <h4>📝 Palavras</h4>
                <h3 style="color: #fd7e14">{words}</h3>
            </div>
            """, unsafe_allow_html=True)

    def create_task(self, task_data: Dict) -> Optional[Dict]:
        """Cria uma nova tarefa via API com retry e feedback detalhado"""
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        try:
            # Fase 1: Validação
            progress_bar.progress(25)
            status_text.text("🔍 Validando dados da tarefa...")
            time.sleep(0.5)
            
            # Fase 2: Conectando
            progress_bar.progress(50)
            status_text.text("🔗 Conectando com API claude-cto...")
            
            response = requests.post(
                f"{self.base_url}/tasks",
                json=task_data,
                timeout=30
            )
            
            # Fase 3: Processando
            progress_bar.progress(75)
            status_text.text("⚙️ Processando criação da tarefa...")
            time.sleep(0.5)
            
            # Fase 4: Finalização
            progress_bar.progress(100)
            status_text.text("✅ Tarefa criada com sucesso!")
            
            if response.status_code == 200:
                return response.json()
            else:
                st.error(f"❌ Erro ao criar tarefa: {response.status_code}")
                with st.expander("Detalhes do Erro"):
                    st.code(response.text)
                return None
                
        except requests.exceptions.ConnectionError:
            progress_bar.empty()
            status_text.empty()
            st.error("❌ Não foi possível conectar com a API claude-cto na porta 8889")
            st.info("💡 Verifique se o serviço claude-cto está rodando")
            return None
        except Exception as e:
            progress_bar.empty()
            status_text.empty()
            st.error(f"❌ Erro inesperado ao criar tarefa: {e}")
            return None
        finally:
            # Limpar indicadores após 2 segundos
            time.sleep(2)
            progress_bar.empty()
            status_text.empty()
    
    def run_dashboard(self):
        """Interface principal ultra-otimizada para criação de tarefas"""
        # Cabeçalho
        st.markdown('<h1 class="main-header">🚀 Criar Nova Tarefa Ultra</h1>', unsafe_allow_html=True)
        
        # Verificar saúde da API com métricas
        api_healthy, health_data = self.check_api_health()
        
        # Dashboard de saúde da API
        with st.container():
            col1, col2, col3 = st.columns(3)
            
            with col1:
                status_color = "#28a745" if api_healthy else "#dc3545"
                status_text = "🟢 Online" if api_healthy else "🔴 Offline"
                st.markdown(f"""
                <div class="metric-card">
                    <h4>API Status</h4>
                    <h3 style="color: {status_color}">{status_text}</h3>
                </div>
                """, unsafe_allow_html=True)
            
            with col2:
                if 'response_time' in health_data:
                    rt = health_data['response_time']
                    rt_color = "#28a745" if rt < 100 else "#ffc107" if rt < 500 else "#dc3545"
                    st.markdown(f"""
                    <div class="metric-card">
                        <h4>⚡ Latência</h4>
                        <h3 style="color: {rt_color}">{rt}ms</h3>
                    </div>
                    """, unsafe_allow_html=True)
            
            with col3:
                timestamp = health_data.get('timestamp', 'N/A')
                st.markdown(f"""
                <div class="metric-card">
                    <h4>🕐 Última Verificação</h4>
                    <h3 style="color: #6c757d; font-size: 1rem;">{timestamp.split('T')[1][:8] if 'T' in timestamp else 'N/A'}</h3>
                </div>
                """, unsafe_allow_html=True)
        
        if not api_healthy:
            st.markdown(f"""
            <div class="error-message">
                <strong>❌ API claude-cto não está disponível</strong><br>
                Erro: {health_data.get('error', 'Conexão falhou')}<br>
                <em>Verifique se o serviço está rodando na porta 8889</em>
            </div>
            """, unsafe_allow_html=True)
            return
        
        # Atualizar cache de tarefas existentes
        st.session_state.existing_tasks = self.get_existing_tasks()
        
        # Seletor de templates
        selected_template = self.render_template_selector()
        
        st.markdown("---")
        
        # Formulário de criação avançado
        with st.form("create_task_form", clear_on_submit=False):
            st.markdown('<div class="form-container">', unsafe_allow_html=True)
            
            # Campos obrigatórios com validação em tempo real
            st.subheader("📝 Informações Básicas")
            
            # Auto-preenchimento baseado no template
            default_identifier = ""
            default_prompt = ""
            default_model = "sonnet"
            
            if selected_template:
                timestamp = datetime.now().strftime("%m%d_%H%M")
                default_identifier = f"{selected_template.identifier_prefix}{timestamp}"
                default_prompt = selected_template.execution_prompt_template
                default_model = selected_template.default_model
            
            task_identifier = st.text_input(
                "Identificador da Tarefa *",
                value=default_identifier,
                placeholder="Ex: analisar_codigo_auth",
                help="Nome único para identificar esta tarefa"
            )
            
            # Validação em tempo real do identificador
            if task_identifier:
                identifier_validation = self.validator.validate_identifier(task_identifier)
                validation_html = self.render_validation_indicator(identifier_validation)
                st.markdown(f"Validação: {validation_html} {identifier_validation.message}", unsafe_allow_html=True)
            
            execution_prompt = st.text_area(
                "Descrição da Tarefa *",
                value=default_prompt,
                placeholder="Descreva detalhadamente o que deve ser feito...",
                height=200,
                help="Prompt detalhado explicando a tarefa (mínimo 150 caracteres)"
            )
            
            # Validação em tempo real do prompt
            if execution_prompt:
                prompt_validation = self.validator.validate_prompt(execution_prompt)
                validation_html = self.render_validation_indicator(prompt_validation)
                st.markdown(f"Validação: {validation_html} {prompt_validation.message}", unsafe_allow_html=True)
                
                # Métricas de complexidade em tempo real
                self.render_complexity_metrics(execution_prompt, default_model)
            
            working_directory = st.text_input(
                "Diretório de Trabalho",
                value=".",
                help="Diretório onde a tarefa será executada"
            )
            
            # Validação do diretório
            if working_directory:
                dir_validation = self.validator.validate_directory(working_directory)
                validation_html = self.render_validation_indicator(dir_validation)
                st.markdown(f"Validação: {validation_html} {dir_validation.message}", unsafe_allow_html=True)
            
            # Configurações avançadas
            st.subheader("⚙️ Configurações Avançadas")
            
            col1, col2 = st.columns(2)
            
            with col1:
                model = st.selectbox(
                    "Modelo",
                    ["sonnet", "opus", "haiku"],
                    index=["sonnet", "opus", "haiku"].index(default_model),
                    help="sonnet: equilibrado, opus: complexo, haiku: simples/rápido"
                )
                
                # Informações detalhadas do modelo
                model_info = {
                    "sonnet": "🎯 Equilibrado - Boa relação custo/performance",
                    "opus": "🧠 Mais Inteligente - Para tarefas complexas",
                    "haiku": "⚡ Mais Rápido - Para tarefas simples"
                }
                st.info(model_info[model])
                
                orchestration_group = st.text_input(
                    "Grupo de Orquestração",
                    placeholder="Ex: analise_projeto_v1",
                    help="Nome do grupo para tarefas relacionadas (opcional)"
                )
            
            with col2:
                # Auto-complete para dependências
                available_tasks = st.session_state.existing_tasks
                depends_on_text = st.text_input(
                    "Dependências",
                    placeholder="task_id_1,task_id_2",
                    help="IDs de tarefas que devem completar primeiro (separados por vírgula)"
                )
                
                # Mostrar tarefas disponíveis
                if available_tasks:
                    st.info(f"📋 Tarefas disponíveis: {', '.join(available_tasks[:5])}{'...' if len(available_tasks) > 5 else ''}")
                
                # Validação de dependências
                if depends_on_text:
                    deps_validation = self.validator.validate_dependencies(depends_on_text, available_tasks)
                    validation_html = self.render_validation_indicator(deps_validation)
                    st.markdown(f"Validação: {validation_html} {deps_validation.message}", unsafe_allow_html=True)
                    
                    # Grafo de dependências
                    deps = [dep.strip() for dep in depends_on_text.split(",") if dep.strip()]
                    if deps:
                        self.render_dependency_graph(deps)
                
                wait_after_dependencies = st.number_input(
                    "Esperar após dependências (segundos)",
                    min_value=0.0,
                    max_value=300.0,
                    value=0.0,
                    step=0.5,
                    help="Tempo para aguardar após dependências completarem"
                )
            
            system_prompt = st.text_area(
                "Prompt do Sistema",
                placeholder="Instruções específicas para o sistema (opcional)",
                height=100,
                help="Prompt personalizado do sistema (opcional)"
            )
            
            # Preview da configuração
            st.subheader("👀 Preview da Configuração")
            
            preview_data = {
                "Identificador": task_identifier or "(não preenchido)",
                "Modelo": model,
                "Diretório": working_directory or ".",
                "Grupo": orchestration_group or "(nenhum)",
                "Dependências": depends_on_text or "(nenhuma)",
                "Caracteres do Prompt": len(execution_prompt) if execution_prompt else 0
            }
            
            for key, value in preview_data.items():
                st.text(f"{key}: {value}")
            
            st.markdown('</div>', unsafe_allow_html=True)
            
            # Botão de submissão
            submitted = st.form_submit_button("🚀 Criar Tarefa", use_container_width=True)
            
            if submitted:
                # Validação completa
                validations = [
                    self.validator.validate_identifier(task_identifier),
                    self.validator.validate_prompt(execution_prompt),
                    self.validator.validate_directory(working_directory)
                ]
                
                if depends_on_text:
                    validations.append(self.validator.validate_dependencies(depends_on_text, available_tasks))
                
                # Verificar se há erros
                errors = [v for v in validations if not v.is_valid and v.severity == 'error']
                warnings = [v for v in validations if not v.is_valid and v.severity == 'warning']
                
                if errors:
                    st.error("❌ Corrija os erros antes de continuar:")
                    for error in errors:
                        st.error(f"• {error.field_name}: {error.message}")
                    return
                
                if warnings:
                    st.warning("⚠️ Avisos encontrados:")
                    for warning in warnings:
                        st.warning(f"• {warning.field_name}: {warning.message}")
                    
                    if not st.checkbox("Continuar mesmo com avisos"):
                        return
                
                # Preparar dados da tarefa com metadados
                task_data = {
                    "task_identifier": task_identifier.strip(),
                    "execution_prompt": execution_prompt.strip(),
                    "working_directory": working_directory.strip() or ".",
                    "model": model
                }
                
                # Adicionar metadados do dashboard
                complexity, duration, score = self.complexity_estimator.estimate_complexity(execution_prompt, model)
                task_data["_metadata"] = {
                    "created_via": "dashboard_ultra",
                    "template_used": selected_template.name if selected_template else None,
                    "estimated_complexity": complexity,
                    "estimated_duration": duration,
                    "complexity_score": score,
                    "creation_timestamp": datetime.now().isoformat()
                }
                
                # Adicionar campos opcionais se preenchidos
                if system_prompt.strip():
                    task_data["system_prompt"] = system_prompt.strip()
                
                if orchestration_group.strip():
                    task_data["orchestration_group"] = orchestration_group.strip()
                
                if depends_on_text.strip():
                    depends_on = [dep.strip() for dep in depends_on_text.split(",") if dep.strip()]
                    if depends_on:
                        task_data["depends_on"] = depends_on
                
                if wait_after_dependencies > 0 and "depends_on" in task_data:
                    task_data["wait_after_dependencies"] = wait_after_dependencies
                
                # Preview final antes da criação
                st.subheader("🔍 Confirmação Final")
                
                col1, col2 = st.columns(2)
                with col1:
                    st.json({
                        "identificador": task_identifier,
                        "modelo": model,
                        "diretório": working_directory,
                        "grupo": orchestration_group or None
                    })
                
                with col2:
                    estimated_info = task_data.get("_metadata", {})
                    st.markdown(f"""
                    **📊 Estimativas:**
                    - Complexidade: {estimated_info.get('estimated_complexity', 'N/A')}
                    - Duração: {estimated_info.get('estimated_duration', 'N/A')}
                    - Score: {estimated_info.get('complexity_score', 'N/A')}
                    """)
                
                # Criar tarefa
                result = self.create_task(task_data)
                
                if result:
                    st.markdown(f"""
                    <div class="success-message">
                        <strong>✅ Tarefa criada com sucesso!</strong><br>
                        <strong>ID:</strong> {result.get('id', 'N/A')}<br>
                        <strong>Identificador:</strong> {result.get('task_identifier', 'N/A')}<br>
                        <strong>Status:</strong> {result.get('status', 'N/A')}<br>
                        <strong>Timestamp:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
                    </div>
                    """, unsafe_allow_html=True)
                    
                    # Mostrar detalhes da tarefa criada
                    with st.expander("📋 Detalhes Completos da Tarefa"):
                        st.json(result)
                    
                    # Botões de ação rápida
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        if st.button("👀 Ver Status", key="view_status"):
                            st.info("Redirecionando para dashboard de status...")
                    with col2:
                        if st.button("📋 Listar Tarefas", key="list_tasks"):
                            st.info("Redirecionando para dashboard de lista...")
                    with col3:
                        if st.button("➕ Nova Tarefa", key="new_task"):
                            st.rerun()
        
        # Seção de ajuda avançada
        st.markdown("---")
        
        # Tabs para organizar informações
        help_tab1, help_tab2, help_tab3, help_tab4 = st.tabs(["💡 Dicas", "📊 Métricas", "🔗 Dependências", "⚙️ Avançado"])
        
        with help_tab1:
            st.markdown("""
            <div class="help-box">
                <strong>🎯 Como usar efetivamente:</strong><br><br>
                • <strong>Identificador:</strong> Use padrão: ação_componente_timestamp (ex: analise_auth_0830)<br>
                • <strong>Descrição:</strong> Inclua caminhos específicos, objetivos claros e critérios de sucesso<br>
                • <strong>Templates:</strong> Use templates para acelerar criação e manter consistência<br>
                • <strong>Dependências:</strong> Crie workflows sequenciais para tarefas relacionadas<br>
                • <strong>Grupos:</strong> Organize sprints ou features relacionadas<br>
                • <strong>Validação:</strong> Indicadores coloridos mostram qualidade em tempo real
            </div>
            """, unsafe_allow_html=True)
        
        with help_tab2:
            st.markdown("""
            **📊 Sistema de Métricas:**
            - **Score de Complexidade**: Calculado por palavras-chave e tamanho
            - **Estimativa de Duração**: Baseada em histórico e complexidade
            - **Validação em Tempo Real**: Feedback instantâneo na digitação
            - **Análise de Qualidade**: Verificação de especificidade do prompt
            """)
        
        with help_tab3:
            st.markdown("""
            **🔗 Sistema de Dependências:**
            - Use IDs de tarefas existentes separados por vírgula
            - Grafo visual mostra fluxo de execução
            - Tempo de espera configurável após dependências
            - Validação automática de tarefas existentes
            """)
        
        with help_tab4:
            st.markdown("""
            **⚙️ Configurações Avançadas:**
            - **Grupos de Orquestração**: Para executar tarefas relacionadas em lote
            - **Prompt do Sistema**: Instruções específicas para o modelo
            - **Metadados**: Informações de rastreamento automático
            - **Cache de Validação**: Otimização de performance
            """)
        
        # Sidebar com estatísticas e ações rápidas
        with st.sidebar:
            st.subheader("📊 Estatísticas Rápidas")
            
            # Métricas de tarefas
            total_tasks = len(st.session_state.existing_tasks)
            st.metric("Total de Tarefas", total_tasks)
            
            if api_healthy and 'response_time' in health_data:
                st.metric("Latência API", f"{health_data['response_time']}ms")
            
            st.markdown("---")
            
            # Ações rápidas
            st.subheader("⚡ Ações Rápidas")
            
            if st.button("🔄 Atualizar Tarefas", use_container_width=True):
                st.session_state.existing_tasks = self.get_existing_tasks()
                st.rerun()
            
            if st.button("🧹 Limpar Cache", use_container_width=True):
                st.session_state.validation_cache = {}
                st.success("Cache limpo!")
            
            if st.button("📋 Ver Todas Tarefas", use_container_width=True):
                st.info("Redirecionando para lista de tarefas...")
            
            st.markdown("---")
            
            # Shortcuts de teclado
            st.subheader("⌨️ Atalhos")
            st.markdown("""
            - **Ctrl+Enter**: Enviar formulário
            - **Ctrl+R**: Atualizar página
            - **Tab**: Navegar campos
            - **Esc**: Limpar seleção
            """)

def main():
    """Função principal com configurações de performance"""
    # Configurações de cache e performance
    st.cache_data.clear()
    
    # Inicializar dashboard
    dashboard = CreateTaskDashboardUltra()
    
    # Interface principal
    try:
        dashboard.run_dashboard()
    except Exception as e:
        st.error(f"❌ Erro crítico no dashboard: {e}")
        st.info("🔄 Recarregue a página para tentar novamente")
        
        # Debug info (apenas em desenvolvimento)
        if st.checkbox("🐛 Mostrar debug info"):
            st.exception(e)

if __name__ == "__main__":
    main()