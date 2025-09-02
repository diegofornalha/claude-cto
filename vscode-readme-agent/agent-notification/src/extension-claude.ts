import * as vscode from 'vscode';
import { createFolderReadme } from './generate-readme';
import { createFolderReadmeClaude, validateClaudeConfig } from './generate-readme-claude';

export function activate(context: vscode.ExtensionContext) {
  // Comando original com Gemini
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'readmeagent.createFolderReadme',
      async (folder?: vscode.Uri) => {
        if (!folder) {
          folder = await selectFolder();
          if (!folder) return;
        }
        await createFolderReadme(folder);
      }
    )
  );

  // Novo comando com Claude
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'readmeagent.createFolderReadmeClaude',
      async (folder?: vscode.Uri) => {
        // Validar configuração do Claude primeiro
        const isValid = await validateClaudeConfig();
        if (!isValid) {
          const action = await vscode.window.showErrorMessage(
            'Claude não está configurado. Deseja usar Gemini como alternativa?',
            'Usar Gemini',
            'Cancelar'
          );
          
          if (action === 'Usar Gemini') {
            vscode.commands.executeCommand('readmeagent.createFolderReadme', folder);
          }
          return;
        }

        if (!folder) {
          folder = await selectFolder();
          if (!folder) return;
        }
        
        await createFolderReadmeClaude(folder);
      }
    )
  );

  // Comando para escolher qual AI usar
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'readmeagent.chooseAI',
      async (folder?: vscode.Uri) => {
        if (!folder) {
          folder = await selectFolder();
          if (!folder) return;
        }

        const choice = await vscode.window.showQuickPick(
          [
            {
              label: '🤖 Claude (Anthropic)',
              description: 'Usar Claude AI para gerar README',
              value: 'claude'
            },
            {
              label: '🔷 Gemini (Google)',
              description: 'Usar Gemini AI para gerar README',
              value: 'gemini'
            }
          ],
          {
            placeHolder: 'Escolha qual AI usar para gerar o README',
            title: 'Seletor de AI'
          }
        );

        if (!choice) return;

        if (choice.value === 'claude') {
          vscode.commands.executeCommand('readmeagent.createFolderReadmeClaude', folder);
        } else {
          vscode.commands.executeCommand('readmeagent.createFolderReadme', folder);
        }
      }
    )
  );

  // Comando para configurar Claude API Key
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'readmeagent.configureClaude',
      async () => {
        const apiKey = await vscode.window.showInputBox({
          prompt: 'Digite sua Claude API Key',
          placeHolder: 'sk-ant-...',
          password: true,
          ignoreFocusOut: true
        });

        if (apiKey) {
          // Salvar nas configurações do workspace
          await vscode.workspace.getConfiguration('readmeAgent').update(
            'claudeApiKey',
            apiKey,
            vscode.ConfigurationTarget.Global
          );
          
          vscode.window.showInformationMessage('Claude API Key configurada com sucesso!');
        }
      }
    )
  );
}

/**
 * Helper para selecionar uma pasta
 */
async function selectFolder(): Promise<vscode.Uri | undefined> {
  const options: vscode.OpenDialogOptions = {
    openLabel: 'Selecione uma pasta',
    canSelectMany: false,
    canSelectFiles: false,
    canSelectFolders: true
  };

  const folders = await vscode.window.showOpenDialog(options);
  if (!folders?.length) {
    vscode.window.showInformationMessage('Selecione uma pasta para gerar o README.md');
    return undefined;
  }

  return folders[0];
}

export function deactivate() {}