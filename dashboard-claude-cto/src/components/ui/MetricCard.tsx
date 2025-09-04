import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from './Card'
import { cn } from '@/utils/cn'

interface MetricCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  iconColor?: string
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  subtitle?: string
  loading?: boolean
  className?: string
  children?: ReactNode
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-primary-500',
  trend,
  subtitle,
  loading = false,
  className,
  children
}: MetricCardProps) {
  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div>
            <div className="h-10 w-10 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
          </div>
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-16 mb-2"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card hoverable className={className}>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {title}
          </h3>
          {Icon && (
            <div className={cn(
              'p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800',
              iconColor
            )}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
        
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {value}
            </p>
            {subtitle && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          
          {trend && (
            <div className={cn(
              'flex items-center text-sm font-medium',
              trend.positive 
                ? 'text-success-600 dark:text-success-400'
                : 'text-error-600 dark:text-error-400'
            )}>
              <span className={cn(
                'mr-1',
                trend.positive ? '↗' : '↘'
              )}>
                {trend.positive ? '↗' : '↘'}
              </span>
              {Math.abs(trend.value)}% {trend.label}
            </div>
          )}
        </div>
        
        {children}
      </CardContent>
    </Card>
  )
}