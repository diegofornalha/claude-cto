#!/bin/bash

echo "🚀 Instalando README Agent com Claude Code SDK (MCP)"
echo "=================================================="
echo ""
echo "Este agent NÃO precisa de API key!"
echo "Usa o Claude Code SDK via MCP"
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar Python
echo -e "${BLUE}📦 Verificando Python...${NC}"
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}✅ Python3 encontrado${NC}"
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    echo -e "${GREEN}✅ Python encontrado${NC}"
    PYTHON_CMD="python"
else
    echo -e "${YELLOW}❌ Python não encontrado. Instale Python 3.8+${NC}"
    exit 1
fi

# Instalar dependências Python
echo -e "${BLUE}📦 Instalando dependências Python...${NC}"
$PYTHON_CMD -m pip install mcp anthropic-sdk-python --user

# Verificar Node.js
echo -e "${BLUE}📦 Verificando Node.js...${NC}"
if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js encontrado${NC}"
else
    echo -e "${YELLOW}⚠️ Node.js não encontrado. Instale para compilar a extensão${NC}"
fi

# Instalar dependências Node
if [ -f "package-mcp.json" ]; then
    echo -e "${BLUE}📦 Instalando dependências Node...${NC}"
    mv package.json package-gemini.json.bak
    mv package-mcp.json package.json
    npm install
fi

# Compilar extensão
echo -e "${BLUE}🔨 Compilando extensão...${NC}"
npm run compile

# Configurar MCP
echo -e "${BLUE}⚙️ Configurando MCP...${NC}"
cat > ~/.claude/mcp-configs/readme-agent.json << EOF
{
  "name": "readme-agent",
  "command": "$PYTHON_CMD",
  "args": [
    "$(pwd)/src/mcp-server.py"
  ],
  "env": {
    "PYTHONPATH": "$(pwd)"
  }
}
EOF

echo -e "${GREEN}✅ Configuração MCP salva em ~/.claude/mcp-configs/readme-agent.json${NC}"

# Testar servidor MCP
echo -e "${BLUE}🧪 Testando servidor MCP...${NC}"
$PYTHON_CMD src/mcp-server.py --test 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Servidor MCP funcionando!${NC}"
else
    echo -e "${YELLOW}⚠️ Servidor MCP precisa de ajustes${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Instalação concluída!${NC}"
echo ""
echo "Como usar:"
echo "1. Abra o VS Code"
echo "2. Instale a extensão: code --install-extension readme-agent-claude-mcp-2.0.0.vsix"
echo "3. Clique com botão direito em uma pasta"
echo "4. Escolha 'Claude: Gerar README'"
echo ""
echo "🚀 Não precisa de API key!"
echo "🤖 Usa o Claude do seu Claude Code SDK!"
echo ""