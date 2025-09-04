"""
Configuração global de fixtures para testes.
"""
import pytest
import asyncio
from typing import Generator, AsyncGenerator
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
import sys
import os

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from claude_cto.server.main import app
from claude_cto.server.database import get_session


# Configurar event loop para testes assíncronos
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(name="session")
def session_fixture():
    """
    Cria uma sessão de banco de dados em memória para testes.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """
    Cria um cliente de teste com banco de dados em memória.
    """
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_orchestration_data():
    """
    Dados de exemplo para criar uma orquestração.
    """
    return {
        "tasks": [
            {
                "identifier": "test_task_1",
                "execution_prompt": "This is a test task for unit testing purposes",
                "working_directory": "/tmp/test",
                "model": "haiku",
                "system_prompt": "You are a helpful test assistant"
            }
        ]
    }


@pytest.fixture
def sample_orchestration_with_dependencies():
    """
    Dados de exemplo para criar uma orquestração com dependências.
    """
    return {
        "tasks": [
            {
                "identifier": "task_1",
                "execution_prompt": "First task in the orchestration workflow",
                "working_directory": "/tmp/test",
                "model": "haiku"
            },
            {
                "identifier": "task_2",
                "execution_prompt": "Second task that depends on the first",
                "working_directory": "/tmp/test",
                "model": "sonnet",
                "depends_on": ["task_1"],
                "initial_delay": 2.0
            },
            {
                "identifier": "task_3",
                "execution_prompt": "Third task that depends on both previous tasks",
                "working_directory": "/tmp/test",
                "model": "opus",
                "depends_on": ["task_1", "task_2"]
            }
        ]
    }


@pytest.fixture
def auth_headers():
    """
    Headers de autenticação para testes (se necessário).
    """
    return {"Authorization": "Bearer test-token"}