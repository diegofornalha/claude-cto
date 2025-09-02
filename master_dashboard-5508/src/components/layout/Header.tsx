import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap, Moon, Sun, Menu, X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const [darkMode, setDarkMode] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Effect para hidratação e detecção de dark mode
  useEffect(() => {
    setIsHydrated(true)
    const isDark = document.documentElement.classList.contains('dark')
    setDarkMode(isDark)
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', !darkMode ? 'dark' : 'light')
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const navigationItems = [
    { label: 'Dashboard', href: '/', active: true },
    { label: 'Tasks', href: '/tasks' },
    { label: 'Analytics', href: '/analytics' },
    { label: 'Configurações', href: '/settings' },
  ]

  return (
    <header className={cn(
      'bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50',
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Título */}
          <div className="flex items-center">
            <motion.div 
              className="flex items-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-600 rounded-lg flex items-center justify-center mr-3">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Dashboard Master
              </h1>
            </motion.div>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <motion.a
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200',
                  item.active
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {item.label}
              </motion.a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            {isHydrated && (
              <motion.button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700" />
                )}
              </motion.button>
            )}

            {/* Status Indicator */}
            <div className="hidden sm:flex items-center space-x-2">
              <motion.div 
                className="w-2 h-2 rounded-full bg-success-500"
                animate={{ 
                  opacity: [1, 0.5, 1],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Sistema Online
              </span>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{
            height: isMobileMenuOpen ? 'auto' : 0,
            opacity: isMobileMenuOpen ? 1 : 0
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="md:hidden overflow-hidden"
        >
          <div className="py-4 border-t border-gray-200 dark:border-gray-700">
            <nav className="flex flex-col space-y-2">
              {navigationItems.map((item) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200',
                    item.active
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                  whileHover={{ x: 4 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </motion.a>
              ))}
            </nav>
            
            {/* Mobile Status */}
            <div className="flex items-center space-x-2 px-3 py-2 mt-4">
              <div className="w-2 h-2 rounded-full bg-success-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Sistema Online
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </header>
  )
}