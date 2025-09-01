# Submit Orchestration Dashboard - Claude-CTO

Dashboard especializado para submissão de grupos de orquestração usando a ferramenta MCP `submit_orchestration`.

## Funcionalidades

- 🚀 **Lançamento de Grupos**: Interface para submeter orquestrações
- 📋 **Prévia de Tarefas**: Visualização das tarefas antes da submissão
- 🔍 **Listagem de Grupos**: Descoberta automática de grupos disponíveis
- ✅ **Validação**: Verificação de tarefas e dependências

## Como Usar

1. **Execute o dashboard:**
   ```bash
   cd /home/suthub/.claude/claude-cto/submit_orchestration-5502/
   streamlit run dashboard_mcp_integration.py
   ```

2. **Selecione um grupo:**
   - Escolha entre os grupos disponíveis
   - Visualize as tarefas que serão executadas

3. **Submeta a orquestração:**
   - Clique em "Submeter Orquestração"
   - Acompanhe o resultado da submissão

## Fluxo de Trabalho

### Preparação
1. Crie tarefas com o mesmo `orchestration_group`
2. Configure dependências entre tarefas se necessário
3. Verifique que todas as tarefas estão prontas

### Submissão
1. Selecione o grupo no dashboard
2. Revise as tarefas que serão executadas
3. Submeta para execução em lote

### Monitoramento
- Use o dashboard `list_tasks-5504` para acompanhar progresso
- Monitore logs e resultados das tarefas

## Integração MCP

Este dashboard usa a ferramenta MCP `mcp__claude-cto__submit_orchestration` para lançar grupos de tarefas no sistema claude-cto.