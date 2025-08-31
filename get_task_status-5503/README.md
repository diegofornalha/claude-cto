# Get Task Status Dashboard - Claude-CTO

Dashboard especializado para consulta de status específico de tarefas usando a ferramenta MCP `get_task_status`.

## Funcionalidades

- 🔍 **Busca por Identificador**: Consulta específica por task_identifier
- 🕒 **Tarefas Recentes**: Acesso rápido às tarefas mais recentes
- 📋 **Detalhes Completos**: Visualização completa dos dados da tarefa
- 🔄 **Atualização em Tempo Real**: Status atualizado dinamicamente

## Como Usar

1. **Execute o dashboard:**
   ```bash
   cd /home/suthub/.claude/claude-cto/get_task_status-5503/
   streamlit run dashboard_mcp_integration.py
   ```

2. **Busque uma tarefa:**
   - Digite o task_identifier no campo de busca
   - Ou clique em uma tarefa recente

3. **Visualize detalhes:**
   - Status atual e tempo decorrido
   - Configurações e dependências
   - Resultados e logs (se disponível)

## Informações Exibidas

### Status da Tarefa
- Status atual (PENDING/RUNNING/COMPLETED/FAILED)
- Tempo decorrido desde criação
- Progresso (quando disponível)

### Configurações
- Modelo utilizado (sonnet/opus/haiku)
- Diretório de trabalho
- Grupo de orquestração

### Dependências
- Lista de tarefas prerequisito
- Tempo de espera após dependências

### Resultados
- Resumo final da execução
- Logs e outputs (quando disponível)
- Dados completos em formato JSON

## Integração MCP

Este dashboard usa a ferramenta MCP `mcp__claude-cto__get_task_status` para consultar o status específico de tarefas no sistema claude-cto.