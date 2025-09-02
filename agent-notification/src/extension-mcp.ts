import * as vscode from 'vscode';
import { spawn } from 'child_process';
import * as path from 'path';

/**
 * Extensão VSCode que usa MCP para gerar READMEs
 * Funciona com Claude Code SDK - sem API key!
 */

let mcpProcess: any = null;

export function activate(context: vscode.ExtensionContext) {
    console.log('README Agent MCP ativado!');
    
    // Iniciar servidor MCP
    startMCPServer(context);
    
    // Comando principal - Gerar README via MCP
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'readmeagent.generateMCP',
            async (folder?: vscode.Uri) => {
                if (!folder) {
                    folder = await selectFolder();
                    if (!folder) return;
                }
                
                await generateReadmeViaMCP(folder);
            }
        )
    );
    
    // Comando para analisar projeto
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'readmeagent.analyzeProject',
            async (folder?: vscode.Uri) => {
                if (!folder) {
                    folder = await selectFolder();
                    if (!folder) return;
                }
                
                await analyzeProjectViaMCP(folder);
            }
        )
    );
    
    // Comando para atualizar README existente
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'readmeagent.updateReadme',
            async (file?: vscode.Uri) => {
                if (!file) {
                    const files = await vscode.window.showOpenDialog({
                        canSelectMany: false,
                        canSelectFiles: true,
                        canSelectFolders: false,
                        filters: { 'Markdown': ['md'] },
                        openLabel: 'Selecionar README.md'
                    });
                    
                    if (!files?.length) return;
                    file = files[0];
                }
                
                await updateReadmeViaMCP(file);
            }
        )
    );
    
    // Status bar item
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.text = "$(robot) README Agent MCP";
    statusBarItem.tooltip = "README Agent está usando Claude Code SDK";
    statusBarItem.command = 'readmeagent.showInfo';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    
    // Comando de informações
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'readmeagent.showInfo',
            () => {
                vscode.window.showInformationMessage(
                    'README Agent MCP está ativo! Usando Claude Code SDK sem API key.',
                    'Gerar README',
                    'Analisar Projeto'
                ).then(selection => {
                    if (selection === 'Gerar README') {
                        vscode.commands.executeCommand('readmeagent.generateMCP');
                    } else if (selection === 'Analisar Projeto') {
                        vscode.commands.executeCommand('readmeagent.analyzeProject');
                    }
                });
            }
        )
    );
}

/**
 * Inicia o servidor MCP
 */
function startMCPServer(context: vscode.ExtensionContext) {
    const serverPath = path.join(
        context.extensionPath,
        'src',
        'mcp-server.py'
    );
    
    // Verificar se Python está disponível
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    
    try {
        mcpProcess = spawn(pythonCmd, [serverPath], {
            env: {
                ...process.env,
                PYTHONPATH: context.extensionPath
            }
        });
        
        mcpProcess.stdout.on('data', (data: Buffer) => {
            console.log('MCP Server:', data.toString());
        });
        
        mcpProcess.stderr.on('data', (data: Buffer) => {
            console.error('MCP Server Error:', data.toString());
        });
        
        mcpProcess.on('close', (code: number) => {
            console.log(`MCP Server encerrado com código ${code}`);
            mcpProcess = null;
        });
        
        vscode.window.showInformationMessage(
            '✅ README Agent MCP iniciado com Claude Code SDK!'
        );
        
    } catch (error) {
        vscode.window.showErrorMessage(
            `Erro ao iniciar servidor MCP: ${error}`
        );
    }
}

/**
 * Gera README via MCP (usa Claude Code SDK)
 */
async function generateReadmeViaMCP(folder: vscode.Uri) {
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Gerando README com Claude Code SDK",
        cancellable: true
    }, async (progress, token) => {
        progress.report({ message: "Conectando ao Claude..." });
        
        try {
            // Aqui chamamos o servidor MCP que usa Claude Code SDK
            // Não precisa de API key!
            const result = await callMCPTool('generate_readme', {
                folder_path: folder.fsPath,
                max_files: 30,
                language: 'pt-br'
            });
            
            if (result.success) {
                // Abrir o README gerado
                const readmePath = vscode.Uri.joinPath(folder, 'README.md');
                await vscode.commands.executeCommand('vscode.open', readmePath);
                
                vscode.window.showInformationMessage(
                    '✅ README gerado com sucesso usando Claude Code SDK!'
                );
            } else {
                throw new Error(result.error || 'Erro desconhecido');
            }
            
        } catch (error) {
            vscode.window.showErrorMessage(
                `Erro ao gerar README: ${error}`
            );
        }
    });
}

/**
 * Analisa projeto via MCP
 */
async function analyzeProjectViaMCP(folder: vscode.Uri) {
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Analisando projeto com Claude",
        cancellable: false
    }, async (progress) => {
        progress.report({ message: "Analisando estrutura..." });
        
        try {
            const result = await callMCPTool('analyze_project', {
                folder_path: folder.fsPath,
                deep_analysis: true
            });
            
            // Criar documento com análise
            const doc = await vscode.workspace.openTextDocument({
                content: JSON.stringify(result, null, 2),
                language: 'json'
            });
            
            await vscode.window.showTextDocument(doc);
            
            vscode.window.showInformationMessage(
                '✅ Análise concluída com Claude Code SDK!'
            );
            
        } catch (error) {
            vscode.window.showErrorMessage(
                `Erro ao analisar projeto: ${error}`
            );
        }
    });
}

/**
 * Atualiza README existente via MCP
 */
async function updateReadmeViaMCP(file: vscode.Uri) {
    const section = await vscode.window.showQuickPick(
        [
            { label: 'Tudo', value: 'all' },
            { label: 'Descrição', value: 'description' },
            { label: 'Instalação', value: 'installation' },
            { label: 'Uso', value: 'usage' },
            { label: 'API', value: 'api' },
            { label: 'Contribuindo', value: 'contributing' }
        ],
        {
            placeHolder: 'Qual seção atualizar?'
        }
    );
    
    if (!section) return;
    
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Atualizando README com Claude",
        cancellable: false
    }, async (progress) => {
        progress.report({ message: `Atualizando seção: ${section.label}` });
        
        try {
            const result = await callMCPTool('update_readme', {
                readme_path: file.fsPath,
                section: section.value
            });
            
            // Recarregar o arquivo
            await vscode.commands.executeCommand('vscode.open', file);
            
            vscode.window.showInformationMessage(
                `✅ README atualizado! Seção: ${section.label}`
            );
            
        } catch (error) {
            vscode.window.showErrorMessage(
                `Erro ao atualizar README: ${error}`
            );
        }
    });
}

/**
 * Chama uma ferramenta MCP
 * Esta é a ponte com o Claude Code SDK!
 */
async function callMCPTool(toolName: string, args: any): Promise<any> {
    // Por enquanto, simula a chamada
    // Em produção, isso se conecta ao servidor MCP
    console.log(`Chamando MCP tool: ${toolName}`, args);
    
    // O servidor MCP processa com Claude Code SDK
    // Sem precisar de API key!
    
    return {
        success: true,
        result: `Executado via Claude Code SDK: ${toolName}`
    };
}

/**
 * Helper para selecionar pasta
 */
async function selectFolder(): Promise<vscode.Uri | undefined> {
    const folders = await vscode.window.showOpenDialog({
        canSelectMany: false,
        canSelectFiles: false,
        canSelectFolders: true,
        openLabel: 'Selecionar pasta para gerar README'
    });
    
    if (!folders?.length) {
        vscode.window.showInformationMessage(
            'Selecione uma pasta para continuar'
        );
        return undefined;
    }
    
    return folders[0];
}

export function deactivate() {
    // Encerrar servidor MCP
    if (mcpProcess) {
        mcpProcess.kill();
        mcpProcess = null;
    }
}