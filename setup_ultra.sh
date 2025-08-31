#!/bin/bash
# Setup Ultra - Claude-CTO Dashboards
# Script de instalação e configuração automática

set -e

echo "🚀 Claude-CTO Ultra Dashboards Setup"
echo "======================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar Python
log_info "Verificando Python..."
if ! command -v python3 &> /dev/null; then
    log_error "Python3 não encontrado. Instale Python 3.8+ primeiro."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
log_success "Python $PYTHON_VERSION encontrado"

# Verificar pip
log_info "Verificando pip..."
if ! command -v pip &> /dev/null && ! command -v pip3 &> /dev/null; then
    log_error "pip não encontrado. Instale pip primeiro."
    exit 1
fi

PIP_CMD="pip3"
if command -v pip &> /dev/null; then
    PIP_CMD="pip"
fi

log_success "pip encontrado"

# Instalar dependências
log_info "Instalando dependências ultra..."
$PIP_CMD install -r requirements_ultra.txt

if [ $? -eq 0 ]; then
    log_success "Dependências instaladas com sucesso"
else
    log_error "Erro ao instalar dependências"
    exit 1
fi

# Verificar se a API claude-cto está rodando
log_info "Verificando API claude-cto..."
if curl -s -f http://localhost:8889/health > /dev/null 2>&1; then
    log_success "API claude-cto está online (porta 8889)"
else
    log_warning "API claude-cto não está respondendo na porta 8889"
    log_warning "Certifique-se de que o serviço claude-cto está rodando"
fi

# Criar script de inicialização
log_info "Criando scripts de inicialização..."

cat > start_all_dashboards.sh << 'EOF'
#!/bin/bash
# Iniciar todos os dashboards Ultra

echo "🚀 Iniciando todos os dashboards Ultra..."

# Array de dashboards
declare -A dashboards=(
    ["create_task-5501"]="8501"
    ["submit_orchestration-5502"]="8502"
    ["get_task_status-5503"]="8503"
    ["list_tasks-5504"]="8504"
    ["clear_tasks-5505"]="8505"
    ["delete_task-5506"]="8506"
    ["check_api_health-5507"]="8507"
)

# Função para iniciar dashboard
start_dashboard() {
    local dir=$1
    local port=$2
    local file=$3
    
    echo "🔄 Iniciando $dir na porta $port..."
    
    cd "$dir"
    nohup streamlit run "$file" --server.port "$port" --server.headless true --browser.gatherUsageStats false > "../logs/${dir}.log" 2>&1 &
    
    # Aguardar inicialização
    sleep 3
    
    # Verificar se está rodando
    if curl -s -f "http://localhost:$port" > /dev/null 2>&1; then
        echo "✅ $dir iniciado com sucesso na porta $port"
    else
        echo "❌ Erro ao iniciar $dir na porta $port"
    fi
    
    cd ..
}

# Criar diretório de logs
mkdir -p logs

# Iniciar launcher principal
echo "🎯 Iniciando launcher principal na porta 8500..."
nohup streamlit run launcher_ultra.py --server.port 8500 --server.headless true --browser.gatherUsageStats false > logs/launcher.log 2>&1 &
sleep 3

# Iniciar cada dashboard
for dir in "${!dashboards[@]}"; do
    port=${dashboards[$dir]}
    
    if [ "$dir" = "create_task-5501" ]; then
        file="dashboard_ultra.py"
    elif [ "$dir" = "submit_orchestration-5502" ]; then
        file="dashboard_ultra_orchestration.py"
    elif [ "$dir" = "get_task_status-5503" ]; then
        file="dashboard_ultra_status.py"
    elif [ "$dir" = "list_tasks-5504" ]; then
        file="dashboard_ultra_list.py"
    elif [ "$dir" = "clear_tasks-5505" ]; then
        file="dashboard_ultra_clear.py"
    elif [ "$dir" = "delete_task-5506" ]; then
        file="dashboard_ultra_delete.py"
    elif [ "$dir" = "check_api_health-5507" ]; then
        file="dashboard_ultra_health.py"
    fi
    
    start_dashboard "$dir" "$port" "$file"
done

echo ""
echo "🎉 Todos os dashboards foram iniciados!"
echo ""
echo "📊 URLs dos Dashboards:"
echo "🚀 Launcher Principal:        http://localhost:8500"
echo "➕ Create Task Ultra:         http://localhost:8501"
echo "🎼 Submit Orchestration:      http://localhost:8502"
echo "📊 Task Status:               http://localhost:8503"
echo "📋 List Tasks:                http://localhost:8504"
echo "🧹 Clear Tasks:               http://localhost:8505"
echo "🗑️ Delete Task:               http://localhost:8506"
echo "🏥 API Health:                http://localhost:8507"
echo ""
echo "💡 Acesse o Launcher Principal para controlar todos: http://localhost:8500"
EOF

chmod +x start_all_dashboards.sh

# Criar script de parada
cat > stop_all_dashboards.sh << 'EOF'
#!/bin/bash
# Parar todos os dashboards Ultra

echo "⏹️ Parando todos os dashboards Ultra..."

# Portas dos dashboards
ports=(8500 8501 8502 8503 8504 8505 8506 8507)

for port in "${ports[@]}"; do
    # Encontrar processo na porta
    PID=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$PID" ]; then
        echo "⏹️ Parando processo na porta $port (PID: $PID)..."
        kill -TERM $PID
        
        # Aguardar término gracioso
        sleep 2
        
        # Forçar se necessário
        if kill -0 $PID 2>/dev/null; then
            echo "🔥 Forçando término do processo $PID..."
            kill -KILL $PID
        fi
        
        echo "✅ Processo na porta $port parado"
    else
        echo "ℹ️ Nenhum processo rodando na porta $port"
    fi
done

echo "✅ Todos os dashboards foram parados!"
EOF

chmod +x stop_all_dashboards.sh

log_success "Scripts de inicialização criados:"
log_info "  • start_all_dashboards.sh - Iniciar todos os dashboards"
log_info "  • stop_all_dashboards.sh - Parar todos os dashboards"

# Verificar dependências críticas
log_info "Verificando dependências críticas..."

critical_deps=("streamlit" "requests" "plotly" "pandas")
missing_deps=()

for dep in "${critical_deps[@]}"; do
    if ! python3 -c "import $dep" 2>/dev/null; then
        missing_deps+=("$dep")
    fi
done

if [ ${#missing_deps[@]} -eq 0 ]; then
    log_success "Todas as dependências críticas estão instaladas"
else
    log_warning "Dependências em falta: ${missing_deps[*]}"
    log_info "Execute: $PIP_CMD install ${missing_deps[*]}"
fi

echo ""
echo "🎉 Setup Ultra concluído com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. 🚀 Iniciar dashboards: ./start_all_dashboards.sh"
echo "2. 🌐 Acessar launcher: http://localhost:8500"
echo "3. 📊 Usar dashboards individuais conforme necessário"
echo "4. ⏹️ Parar quando terminar: ./stop_all_dashboards.sh"
echo ""
echo "📚 Documentação completa: README_ULTRA_DASHBOARDS.md"
echo ""
log_success "Sistema pronto para uso! 🚀"