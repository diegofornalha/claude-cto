"""
Sistema de autenticação simples para o Claude CTO
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, Security, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import hashlib
import secrets
import json
from pathlib import Path

# Configurações padrão
DEFAULT_USERNAME = "admin"
DEFAULT_PASSWORD = "admin"
TOKEN_EXPIRY_HOURS = 24

# Armazenamento simples de tokens em arquivo
TOKENS_FILE = Path("/tmp/cto_auth_tokens.json")

# Security scheme
security = HTTPBearer()

class SimpleAuth:
    """Sistema de autenticação simples com tokens"""
    
    def __init__(self):
        self.tokens = self._load_tokens()
    
    def _load_tokens(self) -> dict:
        """Carrega tokens do arquivo"""
        if TOKENS_FILE.exists():
            try:
                with open(TOKENS_FILE, 'r') as f:
                    return json.load(f)
            except:
                return {}
        return {}
    
    def _save_tokens(self):
        """Salva tokens no arquivo"""
        with open(TOKENS_FILE, 'w') as f:
            json.dump(self.tokens, f)
    
    def _hash_password(self, password: str) -> str:
        """Hash simples da senha"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def login(self, username: str, password: str) -> dict:
        """Realiza login e retorna token"""
        # Verifica credenciais
        if username != DEFAULT_USERNAME or password != DEFAULT_PASSWORD:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciais inválidas"
            )
        
        # Gera token
        token = secrets.token_urlsafe(32)
        expiry = (datetime.now() + timedelta(hours=TOKEN_EXPIRY_HOURS)).isoformat()
        
        # Salva token
        self.tokens[token] = {
            "username": username,
            "expiry": expiry
        }
        self._save_tokens()
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": TOKEN_EXPIRY_HOURS * 3600,
            "username": username
        }
    
    def verify_token(self, token: str) -> Optional[dict]:
        """Verifica se o token é válido"""
        if token not in self.tokens:
            return None
        
        token_data = self.tokens[token]
        expiry = datetime.fromisoformat(token_data["expiry"])
        
        if datetime.now() > expiry:
            # Token expirado, remove
            del self.tokens[token]
            self._save_tokens()
            return None
        
        return token_data
    
    def logout(self, token: str):
        """Remove o token (logout)"""
        if token in self.tokens:
            del self.tokens[token]
            self._save_tokens()

# Instância global
auth_manager = SimpleAuth()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """Dependency para verificar autenticação"""
    token = credentials.credentials
    user_data = auth_manager.verify_token(token)
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user_data

# Dependency opcional - permite acesso sem autenticação
def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> Optional[dict]:
    """Dependency para autenticação opcional"""
    if not credentials:
        return None
    
    try:
        return get_current_user(credentials)
    except:
        return None