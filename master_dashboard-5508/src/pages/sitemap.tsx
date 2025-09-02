import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Home, 
  ListTodo, 
  PlusCircle, 
  List, 
  GitBranch, 
  Activity, 
  Trash2, 
  Database,
  Map,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  FileText,
  Clock,
  Server,
  Layers
} from 'lucide-react';

interface RouteNode {
  path: string;
  title: string;
  description: string;
  icon: React.ElementType;
  priority: number;
  changefreq: string;
  children?: RouteNode[];
  color?: string;
}

const siteStructure: RouteNode[] = [
  {
    path: '/',
    title: 'Home',
    description: 'Hub central com visão geral do sistema e métricas',
    icon: Home,
    priority: 1.0,
    changefreq: 'daily',
    color: 'blue'
  },
  {
    path: '/tasks',
    title: 'Tarefas',
    description: 'Gerenciamento completo de tarefas',
    icon: ListTodo,
    priority: 0.9,
    changefreq: 'daily',
    color: 'green',
    children: [
      {
        path: '/tasks',
        title: 'Dashboard de Tarefas',
        description: 'Visão geral de todas as tarefas',
        icon: Layers,
        priority: 0.9,
        changefreq: 'daily'
      },
      {
        path: '/tasks/create',
        title: 'Criar Tarefa',
        description: 'Formulário para criação de novas tarefas',
        icon: PlusCircle,
        priority: 0.8,
        changefreq: 'daily'
      },
      {
        path: '/tasks/list',
        title: 'Listar Tarefas',
        description: 'Listagem completa com filtros e busca',
        icon: List,
        priority: 0.9,
        changefreq: 'hourly'
      }
    ]
  },
  {
    path: '/orchestration',
    title: 'Orquestração',
    description: 'Gerenciamento de orquestrações',
    icon: GitBranch,
    priority: 0.8,
    changefreq: 'daily',
    color: 'purple',
    children: [
      {
        path: '/orchestration/submit',
        title: 'Submeter Orquestração',
        description: 'Interface para submeter e gerenciar orquestrações',
        icon: GitBranch,
        priority: 0.8,
        changefreq: 'daily'
      }
    ]
  },
  {
    path: '/admin',
    title: 'Administração',
    description: 'Ferramentas administrativas do sistema',
    icon: Server,
    priority: 0.7,
    changefreq: 'weekly',
    color: 'red',
    children: [
      {
        path: '/admin/health',
        title: 'Saúde do Sistema',
        description: 'Monitoramento em tempo real da API',
        icon: Activity,
        priority: 0.7,
        changefreq: 'hourly'
      },
      {
        path: '/admin/clear-tasks',
        title: 'Limpeza de Tarefas',
        description: 'Limpar tarefas completadas ou falhadas',
        icon: Trash2,
        priority: 0.6,
        changefreq: 'weekly'
      },
      {
        path: '/admin/delete-task',
        title: 'Deletar Tarefa',
        description: 'Remover tarefas específicas',
        icon: Database,
        priority: 0.6,
        changefreq: 'weekly'
      }
    ]
  }
];

const Sitemap: React.FC = () => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(['/tasks', '/orchestration', '/admin'])
  );

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'green':
        return 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'purple':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'red':
        return 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 0.9) return 'text-green-600 dark:text-green-400';
    if (priority >= 0.7) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const renderNode = (node: RouteNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.path);
    const Icon = node.icon;

    return (
      <div key={node.path} className={`${level > 0 ? 'ml-6' : ''}`}>
        <div 
          className={`
            group flex items-start p-4 mb-2 rounded-lg border transition-all duration-200
            hover:shadow-md hover:scale-[1.01]
            ${getColorClasses(node.color)}
          `}
        >
          <div className="flex-1">
            <div className="flex items-center mb-2">
              {hasChildren && (
                <button
                  onClick={() => toggleNode(node.path)}
                  className="mr-2 p-1 rounded hover:bg-white/20 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              )}
              <Icon className="w-5 h-5 mr-2" />
              <Link href={node.path} className="text-lg font-semibold hover:underline flex items-center">
                {node.title}
                <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
            
            <p className="text-sm mb-2 opacity-90">{node.description}</p>
            
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center">
                <FileText className="w-3 h-3 mr-1" />
                {node.path}
              </span>
              <span className={`flex items-center ${getPriorityColor(node.priority)}`}>
                <Server className="w-3 h-3 mr-1" />
                Prioridade: {node.priority}
              </span>
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {node.changefreq}
              </span>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Map className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Mapa do Site
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Dashboard Master ULTRATHINK - Estrutura Completa de Navegação
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Rotas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
              </div>
              <Layers className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Seções Principais</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">4</p>
              </div>
              <Server className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rotas Admin</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
              </div>
              <Database className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Atualização</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">Diária</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Árvore de Navegação */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <Layers className="w-6 h-6 mr-2" />
            Estrutura de Navegação
          </h2>
          
          <div className="space-y-2">
            {siteStructure.map(node => renderNode(node))}
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Arquivos do Sitemap
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/sitemap.xml" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  /sitemap.xml (XML para SEO)
                </Link>
              </li>
              <li>
                <Link href="/sitemap" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  /sitemap (Visualização Interativa)
                </Link>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Tecnologias Utilizadas
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm">
                Next.js 14
              </span>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full text-sm">
                TypeScript
              </span>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full text-sm">
                Tailwind CSS
              </span>
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 rounded-full text-sm">
                React 18
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          <p className="mt-1">Dashboard Master ULTRATHINK v1.0.0 - Porta 5508</p>
        </div>
      </div>
    </div>
  );
};

export default Sitemap;