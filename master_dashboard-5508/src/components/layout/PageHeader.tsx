import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface PageHeaderProps {
  title: string
  description?: string
  subtitle?: string
  actions?: ReactNode
  breadcrumbs?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: {
    title: 'text-2xl',
    description: 'text-sm',
    spacing: 'mb-6'
  },
  md: {
    title: 'text-3xl',
    description: 'text-base', 
    spacing: 'mb-8'
  },
  lg: {
    title: 'text-4xl',
    description: 'text-lg',
    spacing: 'mb-10'
  }
}

export function PageHeader({
  title,
  description,
  subtitle,
  actions,
  breadcrumbs,
  className,
  size = 'md'
}: PageHeaderProps) {
  const { title: titleSize, description: descSize, spacing } = sizeClasses[size]

  return (
    <div className={cn(spacing, className)}>
      {breadcrumbs && (
        <div className="mb-4">
          {breadcrumbs}
        </div>
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h1 className={cn(
            titleSize,
            'font-bold text-gray-900 dark:text-white leading-tight'
          )}>
            {title}
          </h1>
          
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
          
          {description && (
            <p className={cn(
              descSize,
              'mt-2 text-gray-600 dark:text-gray-400 max-w-3xl'
            )}>
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="ml-4 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}