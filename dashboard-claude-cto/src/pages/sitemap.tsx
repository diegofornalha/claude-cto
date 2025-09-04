import React from 'react';
import Link from 'next/link';

const Sitemap: React.FC = () => {
  const pages = [
    // Principal
    { path: '/', name: '🏠 Home', category: 'Principal' },
    { path: '/sitemap', name: '🗺️ Sitemap (esta página)', category: 'Principal' },
    { path: '/settings', name: '⚙️ Configurações', category: 'Principal' },
    
    // Tasks
    { path: '/tasks/list', name: '📝 Lista de Tasks', category: 'Tasks' },
    
    // Orchestration
    { path: '/orchestration', name: '🎭 Orchestration Dashboard', category: 'Orchestration' },
    
    // Monitor
    { path: '/monitor', name: '📍 Monitor Dashboard', category: 'Monitor' },
    { path: '/monitor/activities', name: '📊 Feed de Atividades', category: 'Monitor' },
    { path: '/monitor/notifications', name: '🔔 Configurações de Notificações', category: 'Monitor' },
    
    // Analytics
    { path: '/analytics', name: '📊 Analytics Dashboard', category: 'Analytics' },
    
    // API Test (útil para desenvolvimento)
    { path: '/test_tasks_api.html', name: '🧪 Teste da API', category: 'Desenvolvimento' },
  ];

  // Agrupar páginas por categoria
  const categories = pages.reduce((acc, page) => {
    const category = page.category || 'Outros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(page);
    return acc;
  }, {} as Record<string, typeof pages>);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          🗺️ Sitemap Completo
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Todas as rotas disponíveis no Dashboard Master
        </p>
        
        {Object.entries(categories).map(([category, categoryPages]) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 px-2">
              {category}
            </h2>
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {categoryPages.map((page) => (
                  <li key={page.path}>
                    <Link href={page.path}>
                      <div className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-base font-medium text-indigo-600 dark:text-indigo-400 truncate">
                              {page.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {page.path}
                            </p>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <svg
                              className="h-5 w-5 text-gray-400"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        <div className="mt-8 text-center">
          <Link href="/">
            <span className="text-indigo-600 hover:text-indigo-500 cursor-pointer">
              ← Voltar para Home
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sitemap;