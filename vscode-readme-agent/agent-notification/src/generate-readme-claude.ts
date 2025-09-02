import { isText } from 'istextorbinary';
import * as path from 'path';
import * as vscode from 'vscode';
import { GENERATE_README_PROMPT, SUMMARIZE_FILE_PROMPT } from './prompts';
import Anthropic from '@anthropic-ai/sdk';

// Configuração do Claude
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';
const claude = new Anthropic({
  apiKey: CLAUDE_API_KEY,
});

const MAX_TEXT_FILES = 30;

// Modelos disponíveis do Claude
const CLAUDE_MODELS = {
  OPUS: "claude-3-opus-20240229",
  SONNET: "claude-3-5-sonnet-20241022", 
  HAIKU: "claude-3-haiku-20240307"
};

/**
 * Agent que gera README.md usando Claude AI
 * Versão adaptada do agent original que usava Gemini
 */
export async function createFolderReadmeClaude(folder: vscode.Uri) {
  let readmeUri = vscode.Uri.joinPath(folder, 'README.md');

  // Coletar arquivos
  let allFiles = await collectTargetFiles(folder);

  // Verificar se já existe README
  if (allFiles.find(f => f.path === readmeUri.path)) {
    vscode.commands.executeCommand('vscode.open', readmeUri);
    vscode.window.showInformationMessage('Este diretório já possui um arquivo README.md');
    return;
  }

  // Operação com progresso visual
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    cancellable: true,
    title: `Criando README com Claude para "${path.basename(folder.path)}"`,
  }, async (progress, token) => {
    // Filtrar apenas arquivos de texto
    let textFiles = await filterOnlyTextFiles(allFiles);

    // Limitar número de arquivos
    if (textFiles.length > MAX_TEXT_FILES) {
      throw new Error(`Máximo de ${MAX_TEXT_FILES} arquivos por pasta é suportado`);
    }

    let errors: string[] = [];
    let fileSummaries: { filename: string, summary: string }[] = [];

    // Resumir cada arquivo iterativamente
    for (let [index, file] of textFiles.entries()) {
      if (token.isCancellationRequested) throw new Error('Cancelado');
      
      let relativePath = path.relative(folder.path, file.path);
      let bytes = await vscode.workspace.fs.readFile(file);
      let textContent = new TextDecoder().decode(bytes);
      
      progress.report({ 
        message: `Claude analisando arquivo ${index + 1} de ${textFiles.length}: ${relativePath}` 
      });
      
      try {
        let summary = await generateTextWithClaude(
          SUMMARIZE_FILE_PROMPT({
            filename: relativePath,
            content: textContent
          }),
          CLAUDE_MODELS.HAIKU // Usar Haiku para resumos (mais rápido e barato)
        );
        fileSummaries.push({ filename: relativePath, summary });
      } catch (error) {
        errors.push(`Arquivo ${relativePath} não pôde ser resumido: ${error}`);
      }
    }

    if (token.isCancellationRequested) throw new Error('Cancelado');
    progress.report({ message: 'Claude gerando README final...' });

    // Gerar README com os resumos
    let readmeContent = '';
    try {
      readmeContent = await generateTextWithClaude(
        GENERATE_README_PROMPT({
          folderName: path.basename(folder.path),
          fileSummaries,
        }),
        CLAUDE_MODELS.SONNET // Usar Sonnet para o README final (melhor qualidade)
      );
      readmeContent = readmeContent.trim();
    } catch (e) {
      vscode.window.showErrorMessage(`Erro ao gerar README com Claude: ${e}`);
      return;
    }

    if (token.isCancellationRequested) throw new Error('Cancelado');
    
    // Salvar o README
    await vscode.workspace.fs.writeFile(readmeUri, new TextEncoder().encode(readmeContent));

    // Abrir o arquivo gerado
    await vscode.commands.executeCommand('vscode.open', readmeUri);
    vscode.window.showInformationMessage(
      `README gerado com Claude para: ${path.basename(folder.path)}`
    );

    // Mostrar estatísticas se houver erros
    if (errors.length > 0) {
      vscode.window.showWarningMessage(
        `README criado, mas ${errors.length} arquivo(s) não puderam ser processados`
      );
    }
  });
}

/**
 * Lista recursivamente todos os arquivos na pasta
 */
async function collectTargetFiles(folder: vscode.Uri): Promise<vscode.Uri[]> {
  let files: vscode.Uri[] = [];
  
  for (let [name, type] of await vscode.workspace.fs.readDirectory(folder)) {
    // Ignorar pastas comuns que não devem ser analisadas
    if (name === 'node_modules' || name === '.git' || name === 'dist' || name === 'build') {
      continue;
    }
    
    let itemUri = vscode.Uri.joinPath(folder, name);
    
    if (type === vscode.FileType.Directory) {
      files = [...files, ...await collectTargetFiles(itemUri)];
    } else if (type === vscode.FileType.File) {
      files.push(itemUri);
    }
    // Ignorar links simbólicos
  }

  return files;
}

/**
 * Filtra apenas arquivos de texto (não binários)
 */
async function filterOnlyTextFiles(files: vscode.Uri[]): Promise<vscode.Uri[]> {
  let textFiles: vscode.Uri[] = [];
  
  for (let file of files) {
    let bytes = await vscode.workspace.fs.readFile(file);
    if (isText(file.path, Buffer.from(bytes))) {
      textFiles.push(file);
    }
  }
  
  return textFiles;
}

/**
 * Gera texto usando Claude API
 */
async function generateTextWithClaude(
  prompt: string, 
  model: string = CLAUDE_MODELS.SONNET
): Promise<string> {
  console.log(`Gerando texto com Claude (modelo: ${model})...`);
  
  try {
    // Verificar se a API key está configurada
    if (!CLAUDE_API_KEY) {
      throw new Error(
        'Claude API key não configurada. Configure CLAUDE_API_KEY nas variáveis de ambiente.'
      );
    }

    // Fazer a chamada para Claude
    const response = await claude.messages.create({
      model: model,
      max_tokens: 4096,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      system: `Você é um assistente especializado em documentação de código e projetos de software.
Sempre responda em português brasileiro.
Crie documentações claras, objetivas e bem estruturadas.
Use markdown para formatar o conteúdo.
Inclua seções relevantes como: Descrição, Funcionalidades, Estrutura, Como Usar, etc.`
    });

    // Extrair o texto da resposta
    const textContent = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    console.log(`Claude gerou resposta com sucesso (${textContent.length} caracteres)`);
    return textContent;
    
  } catch (error) {
    console.error('Erro ao chamar Claude API:', error);
    
    // Tentar fallback para outro modelo se houver erro
    if (model === CLAUDE_MODELS.SONNET && error instanceof Error) {
      console.log('Tentando fallback para Claude Haiku...');
      return generateTextWithClaude(prompt, CLAUDE_MODELS.HAIKU);
    }
    
    throw error;
  }
}

/**
 * Verifica se a configuração do Claude está válida
 */
export async function validateClaudeConfig(): Promise<boolean> {
  if (!CLAUDE_API_KEY) {
    vscode.window.showErrorMessage(
      'Claude API key não configurada. Configure CLAUDE_API_KEY nas configurações.'
    );
    return false;
  }

  try {
    // Fazer uma chamada simples para validar a API key
    await claude.messages.create({
      model: CLAUDE_MODELS.HAIKU,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'test' }]
    });
    return true;
  } catch (error) {
    vscode.window.showErrorMessage(
      `Claude API key inválida ou erro de conexão: ${error}`
    );
    return false;
  }
}