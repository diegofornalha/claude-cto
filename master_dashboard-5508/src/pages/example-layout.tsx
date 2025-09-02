import React from 'react';
import {
  PageLayout,
  PageHeader,
  Navigation,
  Sidebar,
  Breadcrumbs,
  Footer,
  BreadcrumbItem
} from '@/components/layout';

const ExampleLayout = () => {
  // Exemplo de itens de navegação
  const navItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Tasks', href: '/tasks' },
    { label: 'Orchestration', href: '/orchestration' },
    { label: 'Admin', href: '/admin' }
  ];

  // Exemplo de itens da sidebar com sub-itens
  const sidebarItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      label: 'Tasks',
      href: '/tasks',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      badge: '12',
      children: [
        { label: 'All Tasks', href: '/tasks/all' },
        { label: 'Active', href: '/tasks/active' },
        { label: 'Completed', href: '/tasks/completed' },
        { label: 'Create New', href: '/tasks/create' }
      ]
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      children: [
        { label: 'General', href: '/settings/general' },
        { label: 'Security', href: '/settings/security' },
        { label: 'API Keys', href: '/settings/api-keys' },
        { label: 'Billing', href: '/settings/billing' }
      ]
    }
  ];

  // Exemplo de breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Pages', href: '/pages' },
    { label: 'Example Layout' }
  ];

  // Exemplo de ações do header
  const headerActions = (
    <div className="flex gap-2">
      <button className="
        px-4 py-2 
        text-sm font-medium 
        text-gray-700 dark:text-gray-300 
        bg-white dark:bg-gray-800 
        border border-gray-300 dark:border-gray-600 
        rounded-md 
        hover:bg-gray-50 dark:hover:bg-gray-700 
        transition-colors duration-200
      ">
        Export
      </button>
      <button className="
        px-4 py-2 
        text-sm font-medium 
        text-white 
        bg-blue-600 
        border border-transparent 
        rounded-md 
        hover:bg-blue-700 
        transition-colors duration-200
      ">
        Create New
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Bar */}
      <Navigation items={navItems} />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar items={sidebarItems} />
        
        {/* Main Content Area */}
        <div className="flex-1">
          <PageLayout>
            {/* Page Header with Breadcrumbs */}
            <PageHeader
              title="Example Layout Page"
              description="This page demonstrates all the layout components working together in a cohesive design."
              breadcrumbs={<Breadcrumbs items={breadcrumbs} />}
              actions={headerActions}
            />
            
            {/* Page Content */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Content Cards */}
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="
                    bg-white dark:bg-gray-800 
                    rounded-lg 
                    shadow-sm 
                    border border-gray-200 dark:border-gray-700
                    p-6
                    transition-all duration-200
                    hover:shadow-md
                  "
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Card Title {item}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    This is a sample card demonstrating the layout components with consistent styling and dark mode support.
                  </p>
                  <div className="mt-4">
                    <button className="
                      text-sm font-medium 
                      text-blue-600 dark:text-blue-400 
                      hover:text-blue-700 dark:hover:text-blue-300
                      transition-colors duration-200
                    ">
                      Learn more →
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Additional Content Section */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Additional Content Section
              </h2>
              <div className="
                bg-white dark:bg-gray-800 
                rounded-lg 
                shadow-sm 
                border border-gray-200 dark:border-gray-700
                p-8
              ">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  This example page demonstrates how all the layout components work together:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                  <li><strong>PageLayout:</strong> Provides consistent padding and max-width container</li>
                  <li><strong>PageHeader:</strong> Standardized header with title, description, and actions</li>
                  <li><strong>Navigation:</strong> Top navigation bar with mobile menu support</li>
                  <li><strong>Sidebar:</strong> Collapsible sidebar with nested items and badges</li>
                  <li><strong>Breadcrumbs:</strong> Navigation path indicator</li>
                  <li><strong>Footer:</strong> Consistent footer with links and social icons</li>
                </ul>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  All components support dark mode, are mobile-responsive, and use smooth transitions.
                </p>
              </div>
            </div>
          </PageLayout>
          
          {/* Footer */}
          <Footer showSystemStatus={true} />
        </div>
      </div>
    </div>
  );
};

export default ExampleLayout;