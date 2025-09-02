"""
SOLE RESPONSIBILITY: Sistema de logging estruturado para atividades do sistema.
Registra eventos importantes de forma consistente para feed de atividades e monitoramento.
"""

import json
from typing import Optional, Dict, Any
from sqlmodel import Session

from .database import get_session, engine
from . import crud, models


def log_activity(event_type: str, message: str, task_id: Optional[int] = None, 
                orchestration_id: Optional[int] = None, details: Optional[Dict[str, Any]] = None):
    """
    Registra uma atividade de forma assíncrona no banco de dados.
    Usado para capturar eventos importantes do sistema.
    """
    try:
        with Session(engine) as session:
            crud.log_activity(
                session=session,
                event_type=event_type,
                message=message,
                task_id=task_id,
                orchestration_id=orchestration_id,
                details=details or {}
            )
    except Exception as e:
        # Não queremos que falha no logging afete operações principais
        print(f"Erro ao registrar atividade: {e}")


def log_task_created(task_id: int, working_directory: str, model: str):
    """Log de criação de tarefa."""
    log_activity(
        event_type="task_created",
        message=f"Nova tarefa criada (ID: {task_id})",
        task_id=task_id,
        details={
            "working_directory": working_directory,
            "model": model
        }
    )


def log_task_started(task_id: int):
    """Log de início de execução de tarefa."""
    log_activity(
        event_type="task_started",
        message=f"Tarefa {task_id} iniciada",
        task_id=task_id
    )


def log_task_completed(task_id: int, duration_seconds: Optional[float] = None):
    """Log de conclusão de tarefa."""
    details = {}
    if duration_seconds is not None:
        details["duration_seconds"] = duration_seconds
        
    log_activity(
        event_type="task_completed",
        message=f"Tarefa {task_id} concluída com sucesso",
        task_id=task_id,
        details=details
    )


def log_task_failed(task_id: int, error_message: str):
    """Log de falha de tarefa."""
    log_activity(
        event_type="task_failed",
        message=f"Tarefa {task_id} falhou: {error_message[:100]}...",
        task_id=task_id,
        details={"error": error_message}
    )


def log_orchestration_created(orchestration_id: int, total_tasks: int):
    """Log de criação de orquestração."""
    log_activity(
        event_type="orchestration_created",
        message=f"Nova orquestração criada (ID: {orchestration_id}) com {total_tasks} tarefas",
        orchestration_id=orchestration_id,
        details={"total_tasks": total_tasks}
    )


def log_orchestration_started(orchestration_id: int):
    """Log de início de orquestração."""
    log_activity(
        event_type="orchestration_started",
        message=f"Orquestração {orchestration_id} iniciada",
        orchestration_id=orchestration_id
    )


def log_orchestration_completed(orchestration_id: int, completed_tasks: int, failed_tasks: int):
    """Log de conclusão de orquestração."""
    log_activity(
        event_type="orchestration_completed",
        message=f"Orquestração {orchestration_id} concluída: {completed_tasks} sucesso, {failed_tasks} falhas",
        orchestration_id=orchestration_id,
        details={
            "completed_tasks": completed_tasks,
            "failed_tasks": failed_tasks
        }
    )


def log_system_event(event_type: str, message: str, details: Optional[Dict[str, Any]] = None):
    """Log genérico para eventos do sistema."""
    log_activity(
        event_type=event_type,
        message=message,
        details=details
    )