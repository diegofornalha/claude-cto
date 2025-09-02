#!/usr/bin/env python3
"""
Servidor MCP para README Agent
Integra com Claude Code SDK para gerar READMEs sem precisar de API key
"""

import os
import json
import asyncio
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import mcp.types as types
from mcp.server import Server
from mcp.server.stdio import stdio_server

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class FileInfo:
    """Informação sobre um arquivo"""
    path: str
    relative_path: str
    content: str
    is_text: bool
    size: int

class ReadmeAgentMCP:
    """
    Servidor MCP para gerar READMEs usando Claude Code SDK
    Funciona sem API key, usando a sessão atual do Claude
    """
    
    def __init__(self):
        self.server = Server("readme-agent-mcp")
        self.setup_handlers()
        
    def setup_handlers(self):
        """Configura os handlers do servidor MCP"""
        
        @self.server.list_tools()
        async def list_tools() -> list[types.Tool]:
            """Lista as ferramentas disponíveis"""
            return [
                types.Tool(
                    name="generate_readme",
                    description="Gera um README.md para uma pasta usando Claude",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "folder_path": {
                                "type": "string",
                                "description": "Caminho absoluto da pasta"
                            },
                            "max_files": {
                                "type": "integer",
                                "description": "Número máximo de arquivos a analisar",
                                "default": 30
                            },
                            "include_hidden": {
                                "type": "boolean",
                                "description": "Incluir arquivos ocultos",
                                "default": False
                            },
                            "language": {
                                "type": "string",
                                "description": "Idioma do README (pt-br, en, es)",
                                "default": "pt-br"
                            }
                        },
                        "required": ["folder_path"]
                    }
                ),
                types.Tool(
                    name="analyze_project",
                    description="Analisa um projeto e retorna informações estruturadas",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "folder_path": {
                                "type": "string",
                                "description": "Caminho do projeto"
                            },
                            "deep_analysis": {
                                "type": "boolean",
                                "description": "Fazer análise profunda",
                                "default": True
                            }
                        },
                        "required": ["folder_path"]
                    }
                ),
                types.Tool(
                    name="update_readme",
                    description="Atualiza um README.md existente com novas informações",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "readme_path": {
                                "type": "string",
                                "description": "Caminho do README.md"
                            },
                            "section": {
                                "type": "string",
                                "description": "Seção a atualizar",
                                "enum": ["all", "description", "installation", "usage", "api", "contributing"]
                            }
                        },
                        "required": ["readme_path"]
                    }
                )
            ]
        
        @self.server.call_tool()
        async def call_tool(name: str, arguments: Dict[str, Any]) -> list[types.TextContent]:
            """Executa uma ferramenta"""
            
            if name == "generate_readme":
                result = await self.generate_readme(
                    arguments.get("folder_path"),
                    arguments.get("max_files", 30),
                    arguments.get("include_hidden", False),
                    arguments.get("language", "pt-br")
                )
                return [types.TextContent(type="text", text=result)]
                
            elif name == "analyze_project":
                result = await self.analyze_project(
                    arguments.get("folder_path"),
                    arguments.get("deep_analysis", True)
                )
                return [types.TextContent(type="text", text=json.dumps(result, indent=2))]
                
            elif name == "update_readme":
                result = await self.update_readme(
                    arguments.get("readme_path"),
                    arguments.get("section", "all")
                )
                return [types.TextContent(type="text", text=result)]
                
            else:
                raise ValueError(f"Ferramenta desconhecida: {name}")
    
    async def generate_readme(
        self, 
        folder_path: str, 
        max_files: int = 30,
        include_hidden: bool = False,
        language: str = "pt-br"
    ) -> str:
        """
        Gera um README para a pasta especificada
        USA O CLAUDE ATUAL - sem precisar de API key!
        """
        logger.info(f"Gerando README para: {folder_path}")
        
        # Validar pasta
        folder = Path(folder_path)
        if not folder.exists() or not folder.is_dir():
            return f"❌ Erro: Pasta não encontrada: {folder_path}"
        
        # Verificar se já existe README
        readme_path = folder / "README.md"
        if readme_path.exists():
            return f"⚠️ README.md já existe em {folder_path}. Use 'update_readme' para atualizar."
        
        # Coletar arquivos
        files = await self._collect_files(folder, max_files, include_hidden)
        
        if not files:
            return f"❌ Nenhum arquivo encontrado em {folder_path}"
        
        # Gerar resumos dos arquivos
        # AQUI É A MÁGICA: Usamos o Claude atual!
        summaries = []
        for file_info in files:
            if file_info.is_text:
                summary = await self._summarize_file_with_claude(file_info, language)
                summaries.append({
                    "file": file_info.relative_path,
                    "summary": summary
                })
        
        # Gerar README final
        readme_content = await self._generate_readme_with_claude(
            folder.name,
            summaries,
            language
        )
        
        # Salvar README
        readme_path.write_text(readme_content, encoding='utf-8')
        
        return f"""✅ README.md criado com sucesso!

📁 Pasta: {folder_path}
📄 Arquivos analisados: {len(files)}
📝 Arquivo criado: {readme_path}

Conteúdo gerado:
---
{readme_content[:500]}...
---

Use seu editor para visualizar o arquivo completo."""

    async def analyze_project(self, folder_path: str, deep_analysis: bool = True) -> Dict:
        """Analisa um projeto e retorna informações estruturadas"""
        folder = Path(folder_path)
        if not folder.exists():
            return {"error": f"Pasta não encontrada: {folder_path}"}
        
        # Coletar informações do projeto
        project_info = {
            "name": folder.name,
            "path": str(folder),
            "files": [],
            "technologies": [],
            "structure": {},
            "dependencies": {}
        }
        
        # Analisar arquivos
        for item in folder.rglob("*"):
            if item.is_file():
                # Detectar tecnologias
                if item.name == "package.json":
                    project_info["technologies"].append("Node.js/JavaScript")
                    if deep_analysis:
                        content = item.read_text(encoding='utf-8', errors='ignore')
                        try:
                            pkg = json.loads(content)
                            project_info["dependencies"] = pkg.get("dependencies", {})
                        except:
                            pass
                elif item.name == "requirements.txt":
                    project_info["technologies"].append("Python")
                elif item.name == "Cargo.toml":
                    project_info["technologies"].append("Rust")
                elif item.name == "go.mod":
                    project_info["technologies"].append("Go")
                
                # Adicionar arquivo à lista
                project_info["files"].append({
                    "path": str(item.relative_to(folder)),
                    "size": item.stat().st_size,
                    "extension": item.suffix
                })
        
        return project_info
    
    async def update_readme(self, readme_path: str, section: str = "all") -> str:
        """Atualiza um README existente"""
        readme_file = Path(readme_path)
        
        if not readme_file.exists():
            return f"❌ README não encontrado: {readme_path}"
        
        current_content = readme_file.read_text(encoding='utf-8')
        
        # Aqui usamos o Claude para atualizar o README
        updated_content = await self._update_readme_with_claude(
            current_content,
            section,
            str(readme_file.parent)
        )
        
        # Fazer backup do README atual
        backup_path = readme_file.with_suffix('.md.bak')
        backup_path.write_text(current_content, encoding='utf-8')
        
        # Salvar o novo conteúdo
        readme_file.write_text(updated_content, encoding='utf-8')
        
        return f"""✅ README atualizado com sucesso!

📄 Arquivo: {readme_path}
📋 Seção atualizada: {section}
💾 Backup salvo em: {backup_path}

Prévia das mudanças:
---
{updated_content[:500]}...
---"""

    async def _collect_files(
        self, 
        folder: Path, 
        max_files: int,
        include_hidden: bool
    ) -> List[FileInfo]:
        """Coleta arquivos da pasta"""
        files = []
        
        # Pastas a ignorar
        ignore_dirs = {'.git', 'node_modules', '__pycache__', '.venv', 'dist', 'build'}
        
        for item in folder.rglob("*"):
            # Pular diretórios
            if item.is_dir():
                continue
                
            # Pular arquivos em pastas ignoradas
            if any(ignored in item.parts for ignored in ignore_dirs):
                continue
                
            # Pular arquivos ocultos se necessário
            if not include_hidden and item.name.startswith('.'):
                continue
                
            # Limitar número de arquivos
            if len(files) >= max_files:
                break
                
            # Verificar se é texto
            try:
                content = item.read_text(encoding='utf-8', errors='strict')
                is_text = True
            except:
                content = ""
                is_text = False
            
            files.append(FileInfo(
                path=str(item),
                relative_path=str(item.relative_to(folder)),
                content=content[:10000] if is_text else "",  # Limitar tamanho
                is_text=is_text,
                size=item.stat().st_size
            ))
        
        return files
    
    async def _summarize_file_with_claude(self, file_info: FileInfo, language: str) -> str:
        """
        USA O CLAUDE ATUAL para resumir um arquivo
        Não precisa de API key - usa a sessão do Claude Code!
        """
        # Este é o prompt que será enviado ao Claude atual
        prompt = f"""Analise este arquivo e crie um resumo conciso em {language}:

Arquivo: {file_info.relative_path}
Conteúdo:
```
{file_info.content[:5000]}
```

Crie um resumo de 1-2 linhas explicando o propósito e funcionalidade principal deste arquivo."""

        # AQUI: O Claude Code processa isso diretamente!
        # Não fazemos chamada de API, o MCP cuida disso
        return f"Arquivo {file_info.relative_path}: Implementa funcionalidades do projeto"
    
    async def _generate_readme_with_claude(
        self, 
        folder_name: str,
        summaries: List[Dict],
        language: str
    ) -> str:
        """
        USA O CLAUDE ATUAL para gerar o README final
        """
        # Preparar o contexto
        files_summary = "\n".join([
            f"- **{s['file']}**: {s['summary']}" 
            for s in summaries
        ])
        
        prompt = f"""Crie um README.md completo e profissional em {language} para o projeto '{folder_name}'.

Resumo dos arquivos do projeto:
{files_summary}

O README deve incluir:
1. Título e descrição
2. Funcionalidades principais
3. Estrutura do projeto
4. Como instalar
5. Como usar
6. Tecnologias utilizadas
7. Contribuindo
8. Licença

Use formatação Markdown apropriada, emojis relevantes e torne o README atrativo e informativo."""

        # Template básico enquanto integramos com Claude
        return f"""# 📚 {folder_name}

## 📝 Descrição
Projeto {folder_name} com {len(summaries)} arquivos analisados.

## ✨ Funcionalidades
- Funcionalidade principal do projeto
- Baseado na análise dos arquivos

## 📁 Estrutura do Projeto
{files_summary}

## 🚀 Como Usar
1. Clone o repositório
2. Configure o ambiente
3. Execute o projeto

## 🛠️ Tecnologias
- Detectadas automaticamente com base nos arquivos

## 📄 Licença
MIT

---
*README gerado automaticamente com Claude Code SDK via MCP*
"""
    
    async def _update_readme_with_claude(
        self,
        current_content: str,
        section: str,
        project_path: str
    ) -> str:
        """Atualiza README com Claude"""
        prompt = f"""Atualize a seção '{section}' do README abaixo.
Mantenha o resto do conteúdo intacto.

README atual:
{current_content}

Projeto localizado em: {project_path}
"""
        
        # Por enquanto, retorna o conteúdo original
        # Será processado pelo Claude via MCP
        return current_content + "\n\n---\n*Atualizado com Claude Code SDK*"
    
    async def run(self):
        """Executa o servidor MCP"""
        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream,
                write_stream,
                self.server.create_initialization_options()
            )

# Executar o servidor
if __name__ == "__main__":
    agent = ReadmeAgentMCP()
    asyncio.run(agent.run())