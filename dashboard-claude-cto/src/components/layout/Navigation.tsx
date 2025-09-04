import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavigationProps {
  items?: NavItem[];
  logo?: React.ReactNode;
  className?: string;
}

const defaultNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'Tasks', href: '/tasks' },
  { label: 'Orchestration', href: '/orchestration' }
];

export const Navigation: React.FC<NavigationProps> = ({
  items = defaultNavItems,
  logo,
  className = ''
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(href);
  };

  return (
    <nav className={`
      bg-white dark:bg-gray-800 
      shadow-sm 
      border-b border-gray-200 dark:border-gray-700
      transition-all duration-200
      ${className}
    `}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            {logo && (
              <Link href="/" className="flex items-center mr-8">
                {logo}
              </Link>
            )}
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex sm:space-x-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    inline-flex items-center 
                    px-4 py-2 
                    text-sm font-medium 
                    rounded-md 
                    transition-all duration-200
                    ${isActive(item.href)
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {item.icon && (
                    <span className="mr-2">{item.icon}</span>
                  )}
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="
                inline-flex items-center justify-center 
                p-2 
                rounded-md 
                text-gray-600 dark:text-gray-400 
                hover:text-gray-900 dark:hover:text-white 
                hover:bg-gray-100 dark:hover:bg-gray-700 
                focus:outline-none 
                focus:ring-2 
                focus:ring-inset 
                focus:ring-blue-500
                transition-all duration-200
              "
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Abrir menu principal</span>
              {/* Hamburger icon */}
              <svg
                className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Close icon */}
              <svg
                className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className={`
          sm:hidden 
          overflow-hidden
          transition-all duration-300 ease-in-out
          ${mobileMenuOpen ? 'max-h-96' : 'max-h-0'}
        `}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`
                block 
                px-3 py-2 
                rounded-md 
                text-base font-medium
                transition-all duration-200
                ${isActive(item.href)
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
            >
              <div className="flex items-center">
                {item.icon && (
                  <span className="mr-3">{item.icon}</span>
                )}
                {item.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;