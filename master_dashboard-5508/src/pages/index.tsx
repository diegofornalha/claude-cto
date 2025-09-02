import React from 'react';
import Link from 'next/link';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🚀 Dashboard Master ULTRATHINK
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Hub Central Premium - Claude CTO Management System
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tasks Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              📋 Tasks
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Gerencie e monitore tarefas do Claude CTO
            </p>
            <div className="space-y-2">
              <Link href="/tasks" className="block text-blue-600 hover:text-blue-700">
                → Listar Tasks
              </Link>
              <Link href="/tasks/create" className="block text-blue-600 hover:text-blue-700">
                → Criar Nova Task
              </Link>
            </div>
          </div>

          {/* Orchestration Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              🎭 Orchestration
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Orquestre múltiplas tarefas em paralelo
            </p>
            <div className="space-y-2">
              <Link href="/orchestration" className="block text-blue-600 hover:text-blue-700">
                → Ver Orquestrações
              </Link>
              <Link href="/orchestration/submit" className="block text-blue-600 hover:text-blue-700">
                → Criar Orquestração
              </Link>
            </div>
          </div>

          {/* Admin Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              ⚙️ Admin
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Configurações e monitoramento do sistema
            </p>
            <div className="space-y-2">
              <Link href="/admin" className="block text-blue-600 hover:text-blue-700">
                → Dashboard Admin
              </Link>
              <Link href="/admin/health" className="block text-blue-600 hover:text-blue-700">
                → System Health
              </Link>
            </div>
          </div>

          {/* Sitemap Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              🗺️ Navigation
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Explore todas as rotas disponíveis
            </p>
            <Link href="/sitemap" className="block text-blue-600 hover:text-blue-700">
              → Ver Sitemap
            </Link>
          </div>

          {/* Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              📊 Status
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Sistema operacional em porta 5508
            </p>
            <div className="mt-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ● Online
              </span>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              ⚡ Ações Rápidas
            </h2>
            <div className="space-y-2">
              <button 
                onClick={() => window.location.reload()}
                className="block w-full text-left px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                🔄 Atualizar Dashboard
              </button>
              <button 
                onClick={() => fetch('http://localhost:8888/api/v1/tasks')}
                className="block w-full text-left px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                📡 Testar API
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Claude CTO Dashboard v1.0.0 | Porta: 5508</p>
          <p className="mt-2">Conectado ao Claude CTO API em localhost:8888</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;