import React, { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface SidebarItem {
  href: string;
  label: string;
  icon?: ReactNode;
  badge?: string;
  children?: SidebarItem[];
}

interface SidebarProps {
  items: SidebarItem[];
  className?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  className = '',
  collapsible = true,
  collapsed: controlledCollapsed,
  onToggle
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const router = useRouter();

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    const newState = !isCollapsed;
    if (onToggle) {
      onToggle(newState);
    } else {
      setInternalCollapsed(newState);
    }
  };

  const isActiveRoute = (href: string) => {
    return router.pathname === href || router.pathname.startsWith(href + '/');
  };

  const toggleExpanded = (href: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(href)) {
      newExpanded.delete(href);
    } else {
      newExpanded.add(href);
    }
    setExpandedItems(newExpanded);
  };

  // Auto-expand active items
  useEffect(() => {
    const newExpanded = new Set<string>();
    items.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => isActiveRoute(child.href));
        if (hasActiveChild) {
          newExpanded.add(item.href);
        }
      }
    });
    setExpandedItems(newExpanded);
  }, [router.pathname]);

  return (
    <div 
      className={`
        bg-white dark:bg-gray-800
        border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Admin
          </h2>
        )}
        
        {collapsible && (
          <button
            onClick={handleToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          >
            <svg 
              className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-2">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = isActiveRoute(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.has(item.href);
            
            return (
              <li key={item.href}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleExpanded(item.href)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-lg
                        transition-all duration-200
                        ${isActive 
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' 
                          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                        }
                      `}
                      title={isCollapsed ? item.label : undefined}
                    >
                      {item.icon && (
                        <span className="w-5 h-5 flex-shrink-0">
                          {item.icon}
                        </span>
                      )}
                      
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left truncate">
                            {item.label}
                          </span>
                          
                          {item.badge && (
                            <span className="
                              bg-gray-100 text-gray-600 
                              dark:bg-gray-600 dark:text-gray-300
                              text-xs px-2 py-1 rounded-full
                              min-w-0 flex-shrink-0
                            ">
                              {item.badge}
                            </span>
                          )}
                          
                          <svg
                            className={`
                              w-4 h-4 flex-shrink-0
                              transition-transform duration-200
                              ${isExpanded ? 'rotate-90' : ''}
                            `}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </>
                      )}
                    </button>
                    
                    {!isCollapsed && isExpanded && item.children && (
                      <ul className="mt-1 ml-8 space-y-1">
                        {item.children.map((child) => {
                          const childActive = isActiveRoute(child.href);
                          
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={`
                                  flex items-center gap-2 px-3 py-2 rounded-lg
                                  transition-all duration-200
                                  ${childActive 
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' 
                                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                                  }
                                `}
                              >
                                {child.icon && (
                                  <span className="w-4 h-4 flex-shrink-0">
                                    {child.icon}
                                  </span>
                                )}
                                <span className="text-sm truncate">
                                  {child.label}
                                </span>
                                {child.badge && (
                                  <span className="
                                    bg-gray-100 text-gray-600 
                                    dark:bg-gray-600 dark:text-gray-300
                                    text-xs px-1.5 py-0.5 rounded-full
                                    ml-auto flex-shrink-0
                                  ">
                                    {child.badge}
                                  </span>
                                )}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg
                      transition-all duration-200
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' 
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                      }
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {item.icon && (
                      <span className="w-5 h-5 flex-shrink-0">
                        {item.icon}
                      </span>
                    )}
                    
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 truncate">
                          {item.label}
                        </span>
                        
                        {item.badge && (
                          <span className="
                            bg-gray-100 text-gray-600 
                            dark:bg-gray-600 dark:text-gray-300
                            text-xs px-2 py-1 rounded-full
                            min-w-0 flex-shrink-0
                          ">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;