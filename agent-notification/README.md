# 🔧 VSCode README Agent - Claude Edition

> **Extensão VSCode para gerar READMEs profissionais usando Claude Code SDK - SEM API KEY!**

## 📋 O que é?

Uma extensão VSCode que analisa qualquer pasta/projeto e gera automaticamente um README.md completo e profissional usando o poder do Claude AI através do Claude Code SDK.

## ✨ Características

- 🤖 **Sem API Key** - Usa o Claude do seu Claude Code SDK
- 📁 **Análise Inteligente** - Examina estrutura e conteúdo
- 🔄 **Atualização de READMEs** - Mantém suas customizações
- 🌐 **Multi-idioma** - Suporta vários idiomas
- ⚡ **Rápido** - Processamento via MCP local
- 🔒 **100% Privado** - Tudo roda localmente

## 🚀 Instalação

### Pré-requisitos
- VSCode 1.83+
- Python 3.8+
- Node.js 16+
- Claude Code SDK rodando

### Passos

1. **Clone o repositório:**
```bash
git clone https://github.com/claude-cto/vscode-readme-agent
cd vscode-readme-agent
```

2. **Instale as dependências:**
```bash
./install-mcp.sh
```

3. **Compile a extensão:**
```bash
npm run compile
```

4. **Instale no VSCode:**
```bash
code --install-extension readme-agent-claude-mcp-2.0.0.vsix
```

## 🎮 Como Usar

### No VSCode:

1. **Abra uma pasta/projeto**
2. **Clique com botão direito** na pasta no Explorer
3. **Escolha uma opção:**
   - `Claude: Gerar README` - Cria um README completo
   - `Claude: Analisar Projeto` - Análise detalhada em JSON
   - `Claude: Atualizar README` - Atualiza README existente

### Atalho de Teclado:
- `Ctrl+Alt+R` (Windows/Linux)
- `Cmd+Alt+R` (Mac)

## 🏗️ Arquitetura

```
vscode-readme-agent/
├── src/
│   ├── extension-mcp.ts      # Extensão VSCode principal
│   ├── mcp-server.py         # Servidor MCP (Python)
│   └── generate-readme.ts    # Lógica de geração
├── resources/
│   └── icon.png             # Ícone da extensão
├── package.json             # Configuração NPM
└── mcp-config.json         # Configuração MCP
```

## ⚙️ Configuração

No VSCode Settings (`settings.json`):

```json
{
  "readmeAgentMCP.language": "pt-br",
  "readmeAgentMCP.maxFiles": 30,
  "readmeAgentMCP.includeHidden": false,
  "readmeAgentMCP.autoOpen": true
}
```

## 🔌 Como Funciona (Sem API Key!)

```
VSCode Extension
      ↓
  MCP Server (Local)
      ↓
  Claude Code SDK (Já autenticado)
      ↓
  README.md gerado!
```

O segredo: usa o Claude que já está rodando no seu Claude Code, sem precisar de API key adicional!

## 📝 Exemplo de README Gerado

O Claude analisa:
- Estrutura de pastas
- Linguagens utilizadas
- Dependências
- Padrões de código
- Propósito do projeto

E gera seções como:
- Descrição
- Instalação
- Uso
- API/Documentação
- Contribuindo
- Licença

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| "MCP Server não inicia" | `pip install mcp --user` |
| "Comando não aparece" | Reload Window no VSCode |
| "README vazio" | Verifique se Claude Code está rodando |

## 🤝 Contribuindo

PRs são bem-vindos! Por favor:
1. Fork o projeto
2. Crie sua feature branch
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📜 Licença

MIT - Use livremente!

## 🙏 Créditos

- Baseado na ideia original com Gemini
- Adaptado para Claude Code SDK
- Powered by MCP Protocol

---

**Feito com 💜 usando Claude Code SDK - Sem API keys!**