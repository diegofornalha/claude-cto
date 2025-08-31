# API Health Monitor Dashboard - Claude-CTO

Dashboard especializado para monitoramento da saúde e diagnóstico da API claude-cto.

## Funcionalidades

- 🏥 **Monitor de Saúde**: Verificação contínua do status da API
- 📊 **Métricas do Sistema**: CPU, memória, disco e processos
- 🔗 **Teste de Endpoints**: Validação de todos os endpoints da API
- 🔍 **Diagnóstico Automático**: Sugestões de solução para problemas
- 🧪 **Teste Completo**: Bateria abrangente de testes

## Como Usar

1. **Execute o dashboard:**
   ```bash
   cd /home/suthub/.claude/claude-cto/check_api_health-5507/
   streamlit run dashboard_mcp_integration.py
   ```

2. **Monitore em tempo real:**
   - Auto-refresh ativo por padrão (10s)
   - Visualização contínua do status

3. **Execute diagnósticos:**
   - Clique em "Teste Completo" para análise profunda
   - Siga as sugestões de correção

## Verificações Realizadas

### Conectividade API
- ✅ **Resposta HTTP**: Teste do endpoint /health
- ⏱️ **Tempo de Resposta**: Latência da API
- 🔗 **Endpoints**: Validação de rotas principais

### Processo do Sistema
- 🔍 **PID Detection**: Verifica se claude-cto está rodando
- 📊 **Contagem**: Número de instâncias ativas
- 🔄 **Status**: Estado do processo

### Métricas do Sistema
- 💻 **CPU**: Uso do processador
- 🧠 **Memória**: Consumo de RAM
- 💾 **Disco**: Espaço utilizado
- 🔢 **Processos**: Total de processos ativos

## Status e Indicadores

### Status da API
- 💚 **EXCELENTE**: < 100ms de resposta
- 💚 **BOM**: 100-500ms de resposta
- 💛 **LENTO**: > 500ms de resposta
- 💔 **OFFLINE**: API não responde

### Códigos de Cor
- 🟢 **Verde**: Funcionamento normal
- 🟡 **Amarelo**: Atenção necessária
- 🔴 **Vermelho**: Problema crítico

## Diagnóstico Automático

### Problemas Comuns
1. **API Offline**: Sugestões para iniciar o serviço
2. **Conectividade**: Testes de porta e rede
3. **Performance**: Identificação de gargalos
4. **Recursos**: Monitoramento de uso excessivo

### Soluções Sugeridas
- Comandos específicos para cada problema
- Scripts de diagnóstico
- Verificação de logs
- Restart de serviços

## Auto-Refresh

- **Intervalo**: 10 segundos
- **Controle**: Pode ser desabilitado
- **Performance**: Otimizado para não sobrecarregar
- **Feedback**: Timestamp da última verificação

## Integração MCP

Este dashboard não usa uma ferramenta MCP específica, mas monitora a saúde de todo o sistema claude-cto que suporta as ferramentas MCP.