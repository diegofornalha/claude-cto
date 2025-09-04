import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
  showHome?: boolean;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  separator,
  className = '',
  showHome = true
}) => {
  const router = useRouter();
  
  // Auto-generate breadcrumbs from URL if items not provided
  const breadcrumbItems = React.useMemo(() => {
    if (items) return items;
    
    const pathSegments = router.pathname.split('/').filter(Boolean);
    const generatedItems: BreadcrumbItem[] = [];
    
    pathSegments.forEach((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      generatedItems.push({ label, href });
    });
    
    return generatedItems;
  }, [items, router.pathname]);
  
  const allItems = React.useMemo(() => {
    const result = [...breadcrumbItems];
    
    if (showHome && router.pathname !== '/') {
      result.unshift({ label: 'Home', href: '/' });
    }
    
    return result;
  }, [breadcrumbItems, showHome, router.pathname]);
  
  if (allItems.length === 0) return null;
  
  const defaultSeparator = (
    <svg 
      className="w-4 h-4 text-gray-400" 
      fill="currentColor" 
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path 
        fillRule="evenodd" 
        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
        clipRule="evenodd" 
      />
    </svg>
  );
  
  return (
    <nav 
      className={`flex items-center space-x-2 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 select-none">
                  {separator || defaultSeparator}
                </span>
              )}
              
              {item.icon && (
                <span className="mr-1.5 text-gray-400">
                  {item.icon}
                </span>
              )}
              
              {isLast || !item.href ? (
                <span 
                  className="
                    font-medium text-gray-700 dark:text-gray-300
                    transition-colors duration-200
                  "
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="
                    text-gray-500 dark:text-gray-400 
                    hover:text-gray-700 dark:hover:text-gray-200
                    transition-colors duration-200
                  "
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;