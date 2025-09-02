import React from 'react';
import Link from 'next/link';

const Sitemap: React.FC = () => {
  const pages = [
    { path: '/', name: 'Home' },
    { path: '/tasks', name: 'Tasks' },
    { path: '/tasks/list', name: 'Task List' },
    { path: '/tasks/create', name: 'Create Task' },
    { path: '/orchestration', name: 'Orchestration' },
    { path: '/orchestration/submit', name: 'Submit Orchestration' },
    { path: '/admin', name: 'Admin Dashboard' },
    { path: '/admin/health', name: 'System Health' },
    { path: '/admin/clear-tasks', name: 'Clear Tasks' },
    { path: '/admin/delete-task', name: 'Delete Task' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Sitemap</h1>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {pages.map((page) => (
              <li key={page.path}>
                <Link href={page.path}>
                  <div className="px-6 py-4 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {page.name}
                        </p>
                        <p className="text-sm text-gray-500">
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