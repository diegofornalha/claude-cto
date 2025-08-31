# Delete Task Dashboard - Claude-CTO

Dashboard especializado para remoção específica de tarefas individuais usando a ferramenta MCP `delete_task`.

## Funcionalidades

- 🗑️ **Remoção Específica**: Remove tarefas individuais por identificador
- 🔍 **Busca Manual**: Digite o task_identifier para busca direta
- 👆 **Seleção Visual**: Clique em tarefas da lista para seleção
- 🛡️ **Proteção Automática**: Impede remoção de tarefas em execução

## Como Usar

1. **Execute o dashboard:**
   ```bash
   cd /home/suthub/.claude/claude-cto/delete_task-5506/
   streamlit run dashboard_mcp_integration.py
   ```

2. **Selecione uma tarefa:**
   - Digite o identificador no campo de busca, OU
   - Clique em uma tarefa da lista de disponíveis

3. **Confirme a remoção:**
   - Marque a confirmação
   - Clique em "Confirmar Remoção"

## Regras de Remoção

### Podem ser Removidas
- ✅ **Tarefas Completadas**: Status COMPLETED
- ❌ **Tarefas Falhadas**: Status FAILED  
- ⏳ **Tarefas Pendentes**: Status PENDING (com cuidado)

### Não Podem ser Removidas
- 🚫 **Tarefas em Execução**: Status RUNNING
- 🔗 **Tarefas com Dependentes**: Outras tarefas dependem dela

### Garantias de Segurança
- **Confirmação Obrigatória**: Checkbox de confirmação necessário
- **Proteção Automática**: Sistema impede remoção de tarefas ativas
- **Feedback Claro**: Explicação do motivo quando remoção não é possível
- **Operação Atômica**: Remoção completa ou falha total

## Casos de Uso

### Limpeza Específica
- Remover tarefa experimental que falhou
- Corrigir tarefa mal configurada
- Limpar tarefa duplicada

### Gestão de Dependências
- Remover tarefa que está bloqueando outras
- Limpar tarefa obsoleta
- Corrigir cadeia de dependências

### Manutenção do Sistema
- Remover tarefas órfãs
- Limpar workspace específico
- Corrigir problemas de configuração

## Diferenças do Clear Tasks

| Clear Tasks | Delete Task |
|-------------|-------------|
| Remove em lote | Remove individual |
| Apenas COMPLETED/FAILED | Mais flexível |
| Operação segura | Requer mais cuidado |
| Manutenção geral | Correção específica |

## Integração MCP

Este dashboard usa a ferramenta MCP `mcp__claude-cto__delete_task` para remover tarefas específicas do sistema claude-cto.