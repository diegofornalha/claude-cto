#!/usr/bin/env python3
"""
Dashboard Delete Task - Ferramenta MCP Claude-CTO
Interface para remoção específica de tarefas individuais
"""

import streamlit as st
import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# Configuração da página
st.set_page_config(
    page_title="Delete Task - Claude-CTO",
    page_icon="🗑️",
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
        background: linear-gradient(90deg, #dc3545 0%, #e74c3c 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    .delete-container {
        background: white;
        padding: 2rem;
        border-radius: 15px;
        border: 2px solid #dc3545;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        margin: 1rem 0;
    }
    
    .task-card {
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 12px;
        padding: 1.5rem;
        margin: 0.5rem 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        transition: all 0.3s ease;
    }
    
    .task-card:hover {
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        transform: translateY(-2px);
    }
    
    .task-selectable {
        cursor: pointer;
        border: 2px solid transparent;
    }
    
    .task-selectable:hover {
        border-color: #dc3545;
    }
    
    .task-selected {
        border: 2px solid #dc3545 !important;
        background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%) !important;
    }
    
    .status-badge {
        padding: 0.3rem 0.8rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: bold;
        display: inline-block;
        margin: 0.2rem;
    }
    
    .status-completed { background: #28a745; color: white; }
    .status-running { background: #007bff; color: white; }
    .status-failed { background: #dc3545; color: white; }
    .status-pending { background: #6c757d; color: white; }
    
    .danger-zone {
        background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
        border: 2px solid #dc3545;
        border-radius: 15px;
        padding: 2rem;
        margin: 1rem 0;
        text-align: center;
    }
    
    .protected-zone {
        background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
        border: 2px solid #ffc107;
        border-radius: 15px;
        padding: 1.5rem;
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
    
    .error-message {
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 5px;
        padding: 1rem;
        color: #721c24;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

class DeleteTaskDashboard:
    def __init__(self):
        self.base_url = "http://localhost:8889/api/v1"
        
    def check_api_health(self) -> bool:
        """Verifica se a API claude-cto está funcionando"""
        try:
            response = requests.get("http://localhost:8889/health", timeout=5)
            return response.status_code == 200
        except Exception:
            return False
    
    def get_all_tasks(self) -> List[Dict]:
        """Busca todas as tarefas"""
        try:
            response = requests.get(f"{self.base_url}/tasks?limit=1000", timeout=10)
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list):
                    return result
                return result.get('tasks', [])
            return []
        except Exception:
            return []
    
    def extract_task_id(self, identifier_or_id: str) -> Optional[int]:
        """Extrai o ID numérico de diferentes formatos de identificadores com melhor precisão"""
        try:
            # Se já é um número puro
            if identifier_or_id.isdigit():
                return int(identifier_or_id)
            
            # Se é no formato "#ID - identifier - status" (dropdown format)
            if '#' in identifier_or_id and ' - ' in identifier_or_id:
                parts = identifier_or_id.split(' - ')[0].replace('#', '').strip()
                if parts.isdigit():
                    return int(parts)
            
            # Se é no formato "#ID" simples
            if identifier_or_id.startswith('#'):
                parts = identifier_or_id[1:].strip()
                if parts.isdigit():
                    return int(parts)
            
            # Se é no formato "task_ID" 
            if identifier_or_id.startswith('task_') and '_' in identifier_or_id:
                id_part = identifier_or_id.split('_')[1]
                if id_part.isdigit():
                    return int(id_part)
            
            # Se nenhum formato reconhecido, buscar nas tarefas existentes
            tasks = self.get_all_tasks()
            for task in tasks:
                # Comparar com diferentes campos da tarefa
                if (task.get('identifier') == identifier_or_id or 
                    task.get('task_identifier') == identifier_or_id):
                    return task.get('id')
                
                # Comparar com identifier construído
                constructed_id = task.get('task_identifier', f"task_{task.get('id', 'N/A')}")
                if constructed_id == identifier_or_id:
                    return task.get('id')
            
            return None
            
        except (ValueError, IndexError, TypeError):
            return None
    
    def delete_task(self, task_identifier: str) -> Optional[Dict]:
        """Remove uma tarefa específica usando ID numérico"""
        try:
            # Extrair o ID numérico da tarefa
            task_id = self.extract_task_id(task_identifier.strip())
            
            if task_id is None:
                return {"error": f"Não foi possível extrair ID numérico de: {task_identifier}"}
            
            # Fazer a requisição com o ID numérico
            response = requests.delete(f"{self.base_url}/tasks/{task_id}", timeout=15)
            
            if response.status_code == 200:
                result = response.json()
                result['deleted_id'] = task_id
                return result
            elif response.status_code == 404:
                return {"error": f"Tarefa com ID {task_id} não encontrada"}
            elif response.status_code == 400:
                return {"error": f"Tarefa com ID {task_id} não pode ser removida (pode estar executando)"}
            elif response.status_code == 422:
                return {"error": f"Erro de validação: ID {task_id} é inválido"}
            else:
                try:
                    error_detail = response.json()
                    return {"error": f"Erro {response.status_code}: {error_detail}"}
                except:
                    return {"error": f"Erro {response.status_code}: {response.text}"}
                
        except requests.exceptions.ConnectionError:
            return {"error": "Conexão com API falhou"}
        except Exception as e:
            return {"error": f"Erro inesperado: {e}"}
    
    def can_delete_task(self, task: Dict) -> Tuple[bool, str]:
        """Verifica se uma tarefa pode ser deletada com razões detalhadas"""
        status = task.get('status', '').upper()
        
        if status in ['RUNNING']:
            return False, "Tarefa em execução - não pode ser interrompida"
        elif status in ['PENDING'] and task.get('depends_on'):
            return False, "Tarefa pendente com dependências ativas"
        elif status == 'COMPLETED':
            return True, "Tarefa concluída - pode ser removida com segurança"
        elif status == 'FAILED':
            return True, "Tarefa com falha - pode ser removida"
        elif status == 'PENDING':
            return True, "Tarefa pendente - pode ser removida (cuidado)"
        else:
            return True, "Status desconhecido - remoção possível"
    
    def render_task_card(self, task: Dict, selectable: bool = True):
        """Renderiza card de tarefa"""
        # Usar o identifier se existir, senão construir um baseado no ID
        identifier = task.get('identifier') or task.get('task_identifier') or f"task_{task.get('id', 'N/A')}"
        status = task.get('status', 'UNKNOWN').upper()
        task_id = task.get('id', 'N/A')
        created_at = task.get('created_at', '')
        execution_prompt = task.get('execution_prompt', 'Sem descrição')
        
        # Criar identificador único para seleção (formato: #ID - identifier)
        selection_id = f"#{task_id} - {identifier}"
        
        # Truncar descrição
        if len(execution_prompt) > 120:
            execution_prompt = execution_prompt[:117] + "..."
        
        # Verificar se pode deletar
        can_delete, delete_reason = self.can_delete_task(task)
        
        # Calcular tempo
        try:
            if created_at:
                dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                time_str = dt.strftime("%d/%m %H:%M")
            else:
                time_str = "N/A"
        except:
            time_str = "N/A"
        
        # CSS class baseado na capacidade de deletar
        card_class = "task-card"
        if selectable and can_delete:
            card_class += " task-selectable"
            if st.session_state.get('selected_for_deletion') == selection_id:
                card_class += " task-selected"
        
        # Ícone de proteção
        protection_icon = "🚫" if not can_delete else "🗑️"
        
        task_html = f"""
        <div class="{card_class}" onclick="selectTask('{selection_id}')" 
             title="{delete_reason if not can_delete else 'Clique para selecionar'}">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span style="font-size: 1.2rem;">{protection_icon}</span>
                    <strong>{identifier}</strong>
                    <span style="color: #666;">#{task_id}</span>
                </div>
                <div style="text-align: right;">
                    <span class="status-badge status-{status.lower()}">{status}</span><br>
                    <small style="color: #666;">{time_str}</small>
                </div>
            </div>
            <div style="color: #666; font-size: 0.9rem; margin-top: 0.5rem;">
                {execution_prompt}
            </div>
            {f'<div style="color: #dc3545; font-size: 0.8rem; margin-top: 0.5rem;"><strong>⚠️ {delete_reason}</strong></div>' if not can_delete else ''}
        </div>
        """
        
        st.markdown(task_html, unsafe_allow_html=True)
        
        # JavaScript para seleção (simulado com botão)
        if selectable and can_delete:
            if st.button(f"Selecionar {identifier}", key=f"select_{task_id}"):
                st.session_state.selected_for_deletion = selection_id
                st.rerun()
    
    def format_task_option(self, task: Dict) -> str:
        """Formata uma tarefa para exibição no dropdown"""
        identifier = task.get('identifier') or task.get('task_identifier') or f"task_{task.get('id', 'N/A')}"
        status = task.get('status', 'UNKNOWN').upper()
        task_id = task.get('id', 'N/A')
        return f"#{task_id} - {identifier} - {status}"
    
    def parse_task_from_option(self, option: str, all_tasks: List[Dict]) -> Optional[Dict]:
        """Extrai a tarefa selecionada da opção do dropdown"""
        if not option or option.startswith("Selecione"):
            return None
        
        try:
            # Extrair ID da opção (formato: "#ID - identifier - status")
            task_id = option.split(" - ")[0].replace("#", "")
            
            # Buscar tarefa correspondente
            for task in all_tasks:
                if str(task.get('id')) == task_id:
                    return task
        except:
            pass
        
        return None
    
    def run_dashboard(self):
        """Interface principal para remoção de tarefas"""
        # Inicializar session state
        if 'selected_for_deletion' not in st.session_state:
            st.session_state.selected_for_deletion = None
        if 'last_refresh' not in st.session_state:
            st.session_state.last_refresh = time.time()
        if 'selected_task_data' not in st.session_state:
            st.session_state.selected_task_data = None
        
        # Cabeçalho
        st.markdown('<h1 class="main-header">🗑️ Remover Tarefa Específica</h1>', unsafe_allow_html=True)
        
        # Verificar saúde da API
        if not self.check_api_health():
            st.markdown("""
            <div class="error-message">
                <strong>❌ API claude-cto não está disponível</strong><br>
                Verifique se o serviço está rodando na porta 8889
            </div>
            """, unsafe_allow_html=True)
            return
        
        # Buscar tarefas disponíveis
        with st.spinner("🔄 Carregando tarefas..."):
            all_tasks = self.get_all_tasks()
        
        if not all_tasks:
            st.info("🤔 Nenhuma tarefa encontrada no sistema")
            return
        
        # DROPDOWN LIST PRINCIPAL
        st.markdown('<div class="delete-container">', unsafe_allow_html=True)
        
        st.subheader("📋 Seleção de Tarefa para Deleção")
        
        col1, col2, col3 = st.columns([5, 1, 1])
        
        with col1:
            # Separar tarefas deletáveis das protegidas
            deletable_tasks = []
            protected_tasks = []
            
            for task in all_tasks:
                can_delete, _ = self.can_delete_task(task)
                if can_delete:
                    deletable_tasks.append(task)
                else:
                    protected_tasks.append(task)
            
            # Criar opções para o dropdown
            task_options = ["Selecione uma tarefa para deletar..."]
            
            # Adicionar tarefas deletáveis
            for task in deletable_tasks:
                task_options.append(self.format_task_option(task))
            
            # Dropdown principal
            selected_option = st.selectbox(
                "Escolha a tarefa que deseja deletar:",
                options=task_options,
                help=f"Tarefas disponíveis: {len(deletable_tasks)} | Protegidas: {len(protected_tasks)}",
                key="task_selector"
            )
            
            # Buscar tarefa selecionada
            selected_task = self.parse_task_from_option(selected_option, all_tasks)
            
            # Armazenar dados da tarefa selecionada
            if selected_task:
                st.session_state.selected_task_data = selected_task
                st.session_state.selected_for_deletion = self.format_task_option(selected_task)
            else:
                st.session_state.selected_task_data = None
                if selected_option.startswith("Selecione"):
                    st.session_state.selected_for_deletion = None
        
        with col2:
            if st.button("🔄 Refresh", help="Atualizar lista de tarefas"):
                st.session_state.last_refresh = time.time()
                st.rerun()
        
        with col3:
            # Contador de tempo desde último refresh
            time_since_refresh = int(time.time() - st.session_state.last_refresh)
            st.caption(f"Atualizado há {time_since_refresh}s")
        
        # Busca manual (método alternativo)
        with st.expander("🔍 Busca Manual (Método Alternativo)", expanded=False):
            st.info("📝 Use esta opção se você souber o identificador exato da tarefa")
            
            manual_identifier = st.text_input(
                "Identificador ou ID da Tarefa",
                placeholder="Ex: analisar_codigo_auth ou 123 ou task_123",
                help="Digite o task_identifier, ID numérico, ou formato task_ID"
            )
            
            if st.button("Buscar e Selecionar", disabled=not manual_identifier.strip()):
                if manual_identifier.strip():
                    # Buscar tarefa pelo identificador
                    manual_task = None
                    search_term = manual_identifier.strip()
                    
                    # Tentar localizar a tarefa
                    task_id = self.extract_task_id(search_term)
                    if task_id is not None:
                        for task in all_tasks:
                            if task.get('id') == task_id:
                                manual_task = task
                                break
                    
                    if manual_task:
                        st.session_state.selected_task_data = manual_task
                        st.session_state.selected_for_deletion = self.format_task_option(manual_task)
                        st.success(f"✅ Tarefa '{search_term}' encontrada e selecionada!")
                        st.rerun()
                    else:
                        st.error(f"❌ Tarefa '{search_term}' não encontrada!")
        
        st.markdown('</div>', unsafe_allow_html=True)
        
        # PREVIEW DA TAREFA SELECIONADA
        if st.session_state.selected_task_data:
            selected_task_data = st.session_state.selected_task_data
            
            st.markdown("---")
            st.subheader("👁️ Preview da Tarefa Selecionada")
            
            can_delete, delete_reason = self.can_delete_task(selected_task_data)
            
            if can_delete:
                # Mostrar detalhes da tarefa
                identifier = selected_task_data.get('identifier') or selected_task_data.get('task_identifier') or f"task_{selected_task_data.get('id', 'N/A')}"
                status = selected_task_data.get('status', 'UNKNOWN').upper()
                task_id = selected_task_data.get('id', 'N/A')
                created_at = selected_task_data.get('created_at', '')
                execution_prompt = selected_task_data.get('execution_prompt', 'Sem descrição')
                
                # Formatação de tempo
                try:
                    if created_at:
                        dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                        formatted_time = dt.strftime("%d/%m/%Y às %H:%M:%S")
                    else:
                        formatted_time = "N/A"
                except:
                    formatted_time = "N/A"
                
                # Card da tarefa selecionada
                st.markdown(f"""
                <div class="task-card" style="border: 2px solid #dc3545; background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <div>
                            <h4 style="margin: 0; color: #dc3545;">🗑️ {identifier}</h4>
                            <span style="color: #666;">ID: #{task_id}</span>
                        </div>
                        <div style="text-align: right;">
                            <span class="status-badge status-{status.lower()}">{status}</span><br>
                            <small style="color: #666;">{formatted_time}</small>
                        </div>
                    </div>
                    <div style="background: white; padding: 1rem; border-radius: 8px; margin: 0.5rem 0;">
                        <strong>Descrição da Tarefa:</strong><br>
                        <span style="color: #333;">{execution_prompt}</span>
                    </div>
                    <div style="background: #d1ecf1; padding: 0.8rem; border-radius: 8px; border-left: 4px solid #17a2b8;">
                        <strong style="color: #0c5460;">✅ {delete_reason}</strong>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
            else:
                # Tarefa protegida
                st.markdown(f"""
                <div class="error-message">
                    <strong>🚫 Tarefa Protegida</strong><br>
                    Esta tarefa não pode ser deletada: {delete_reason}
                </div>
                """, unsafe_allow_html=True)
                st.session_state.selected_for_deletion = None
        
        # Mostrar resumo de tarefas
        st.markdown("---")
        with st.expander(f"📊 Resumo das Tarefas ({len(all_tasks)} total)", expanded=False):
            # Estatísticas rápidas
            status_counts = {}
            for task in all_tasks:
                status = task.get('status', 'UNKNOWN').upper()
                status_counts[status] = status_counts.get(status, 0) + 1
            
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                st.metric("Total", len(all_tasks))
            with col2:
                st.metric("Deletáveis", len(deletable_tasks))
            with col3:
                st.metric("Protegidas", len(protected_tasks))
            with col4:
                st.metric("Concluídas", status_counts.get('COMPLETED', 0))
            
            # Lista simplificada
            if len(all_tasks) <= 20:
                st.markdown("**Lista Completa:**")
                for task in all_tasks:
                    identifier = task.get('identifier') or task.get('task_identifier') or f"task_{task.get('id', 'N/A')}"
                    status = task.get('status', 'UNKNOWN').upper()
                    task_id = task.get('id', 'N/A')
                    can_delete, _ = self.can_delete_task(task)
                    
                    icon = "🗑️" if can_delete else "🛡️"
                    st.markdown(f"- {icon} #{task_id} - {identifier} - {status}")
            else:
                st.info(f"Muitas tarefas para exibir ({len(all_tasks)}). Use o dropdown acima para seleção.")
        
        # ZONA DE CONFIRMAÇÃO E EXECUÇÃO DE DELEÇÃO
        if st.session_state.selected_for_deletion and st.session_state.selected_task_data:
            selected_task_info = st.session_state.selected_for_deletion
            current_task = st.session_state.selected_task_data
            
            # Verificar novamente se pode deletar (double-check)
            can_delete, delete_reason = self.can_delete_task(current_task)
            
            if not can_delete:
                st.markdown(f"""
                <div class="error-message">
                    <strong>🚫 Estado da tarefa mudou</strong><br>
                    A tarefa não pode mais ser deletada: {delete_reason}
                </div>
                """, unsafe_allow_html=True)
                st.session_state.selected_for_deletion = None
                st.session_state.selected_task_data = None
                if st.button("🔙 Voltar à Seleção"):
                    st.rerun()
                return
            
            st.markdown("---")
            
            # Zona de perigo com confirmação dupla
            st.markdown(f"""
            <div class="danger-zone">
                <h3>⚠️ CONFIRMAÇÃO DE DELEÇÃO</h3>
                <p>Você está prestes a deletar permanentemente:</p>
                <p><strong>{selected_task_info}</strong></p>
                <p style="color: #721c24; font-weight: bold;">⚠️ ESTA AÇÃO NÃO PODE SER DESFEITA!</p>
            </div>
            """, unsafe_allow_html=True)
            
            # Checkboxes de segurança
            col1, col2, col3 = st.columns([1, 2, 1])
            
            with col2:
                # Primeira confirmação
                confirm1 = st.checkbox(
                    f"✅ Entendo que vou deletar permanentemente esta tarefa",
                    help="Primeira confirmação de segurança"
                )
                
                # Segunda confirmação (só aparece se primeira for marcada)
                confirm2 = False
                if confirm1:
                    confirm2 = st.checkbox(
                        "✅ Confirmo que esta ação é irreversível e definitiva",
                        help="Confirmação final de segurança"
                    )
                    
                    # Aviso adicional se a tarefa tiver dependências
                    if current_task.get('depends_on'):
                        st.warning("⚠️ Esta tarefa possui dependências. Outras tarefas podem ser afetadas.")
                
                st.markdown("<br>", unsafe_allow_html=True)
                
                # Botões de ação
                col_a, col_b = st.columns(2)
                
                with col_a:
                    delete_enabled = confirm1 and confirm2
                    
                    if st.button(
                        "🗑️ DELETAR TAREFA", 
                        use_container_width=True, 
                        type="primary",
                        disabled=not delete_enabled
                    ):
                        if delete_enabled:
                            # Executar deleção
                            task_identifier = current_task.get('identifier') or current_task.get('task_identifier') or str(current_task.get('id', ''))
                            
                            with st.spinner("🔄 Deletando tarefa... Não feche esta página!"):
                                result = self.delete_task(task_identifier)
                            
                            if result and "error" not in result:
                                deleted_id = result.get('deleted_id', 'N/A')
                                st.markdown(f"""
                                <div class="success-message">
                                    <strong>✅ TAREFA DELETADA COM SUCESSO!</strong><br>
                                    <strong>Identificador:</strong> {task_identifier}<br>
                                    <strong>ID Removido:</strong> #{deleted_id}<br>
                                    <strong>Status Anterior:</strong> {current_task.get('status', 'N/A')}<br>
                                    <strong>Horário:</strong> {datetime.now().strftime('%d/%m/%Y às %H:%M:%S')}
                                </div>
                                """, unsafe_allow_html=True)
                                
                                # Limpar seleção e aguardar antes de recarregar
                                st.session_state.selected_for_deletion = None
                                st.session_state.selected_task_data = None
                                st.session_state.last_refresh = time.time()
                                
                                # Auto-refresh após sucesso
                                time.sleep(1.5)
                                st.rerun()
                            
                            elif result and "error" in result:
                                st.markdown(f"""
                                <div class="error-message">
                                    <strong>❌ FALHA NA DELEÇÃO:</strong><br>
                                    {result['error']}<br><br>
                                    <strong>Possíveis causas:</strong><br>
                                    • Tarefa foi iniciada entre a seleção e deleção<br>
                                    • Problemas de conectividade com a API<br>
                                    • Tarefa possui dependências ativas<br>
                                    • ID da tarefa não encontrado no sistema
                                </div>
                                """, unsafe_allow_html=True)
                            else:
                                st.markdown("""
                                <div class="error-message">
                                    <strong>❌ ERRO DESCONHECIDO</strong><br>
                                    Falha na comunicação com a API. Verifique a conexão e tente novamente.
                                </div>
                                """, unsafe_allow_html=True)
                
                with col_b:
                    if st.button("❌ Cancelar Deleção", use_container_width=True):
                        st.session_state.selected_for_deletion = None
                        st.session_state.selected_task_data = None
                        st.rerun()
        
        # MOSTRAR TAREFAS PROTEGIDAS (INFORMATIVO)
        if protected_tasks:
            st.markdown("---")
            with st.expander(f"🛡️ Tarefas Protegidas ({len(protected_tasks)})", expanded=False):
                st.markdown("""
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 1rem; margin: 0.5rem 0;">
                    <strong>ℹ️ Estas tarefas não podem ser deletadas no momento:</strong>
                </div>
                """, unsafe_allow_html=True)
                
                for task in protected_tasks[:10]:  # Máximo 10 para não sobrecarregar
                    identifier = task.get('identifier') or task.get('task_identifier') or f"task_{task.get('id', 'N/A')}"
                    status = task.get('status', 'UNKNOWN').upper()
                    task_id = task.get('id', 'N/A')
                    _, reason = self.can_delete_task(task)
                    
                    st.markdown(f"- 🚫 #{task_id} - {identifier} - {status} ({reason})")
                
                if len(protected_tasks) > 10:
                    st.info(f"... e mais {len(protected_tasks) - 10} tarefas protegidas.")
        
        # SEÇÃO DE INFORMAÇÕES E AJUDA
        st.markdown("---")
        with st.expander("ℹ️ Ajuda e Informações sobre Deleção", expanded=False):
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown("""
                **🔒 Regras de Proteção:**
                - ✅ **COMPLETED**: Podem ser deletadas
                - ✅ **FAILED**: Podem ser deletadas
                - ⚠️ **PENDING**: Podem ser deletadas (cuidado)
                - 🚫 **RUNNING**: Protegidas (não podem ser deletadas)
                
                **⚡ Como Usar:**
                1. Selecione uma tarefa no dropdown principal
                2. Visualize o preview detalhado da tarefa
                3. Confirme a deleção (dupla confirmação obrigatória)
                4. Aguarde a conclusão da operação
                """)
            
            with col2:
                st.markdown("""
                **⚠️ Avisos Importantes:**
                - Deleção é **permanente e irreversível**
                - Outras tarefas podem **depender** desta
                - Para limpeza em lote, use **clear_tasks**
                - Sempre verifique **dependências** antes de deletar
                
                **🎯 Casos de Uso Recomendados:**
                - Remover tarefa com erro específico
                - Limpar tarefa experimental mal configurada
                - Corrigir tarefas duplicadas
                - Remover testes que falharam
                """)
            
            # Estatísticas detalhadas
            if all_tasks:
                st.markdown("**📊 Estatísticas Detalhadas do Sistema:**")
                
                status_counts = {}
                for task in all_tasks:
                    status = task.get('status', 'UNKNOWN').upper()
                    status_counts[status] = status_counts.get(status, 0) + 1
                
                stats_col1, stats_col2, stats_col3, stats_col4 = st.columns(4)
                
                with stats_col1:
                    st.metric("📋 Total", len(all_tasks))
                with stats_col2:
                    st.metric("🗑️ Deletáveis", len(deletable_tasks))
                with stats_col3:
                    st.metric("🛡️ Protegidas", len(protected_tasks))
                with stats_col4:
                    st.metric("✅ Concluídas", status_counts.get('COMPLETED', 0))
                
                # Gráfico de distribuição de status (se houver pandas disponível)
                try:
                    import pandas as pd
                    
                    if len(status_counts) > 1:
                        df_status = pd.DataFrame([
                            {"Status": status, "Quantidade": count} 
                            for status, count in status_counts.items()
                        ])
                        
                        st.markdown("**Distribuição por Status:**")
                        st.bar_chart(df_status.set_index("Status"))
                except ImportError:
                    # Se pandas não estiver disponível, mostrar lista simples
                    st.markdown("**Distribuição por Status:**")
                    for status, count in status_counts.items():
                        st.markdown(f"- {status}: {count} tarefa(s)")

def main():
    """Função principal"""
    dashboard = DeleteTaskDashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()