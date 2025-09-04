import { Card, CardHeader, CardBody } from './Card'
import { cn } from '@/utils/cn'

interface SystemHealthData {
  cpu: number
  memory: number
  uptime: string
  status: 'healthy' | 'warning' | 'critical'
}

interface SystemHealthCardProps {
  data: SystemHealthData
  loading?: boolean
  className?: string
}

const statusConfig = {
  healthy: {
    color: 'text-success-600 dark:text-success-400',
    bgColor: 'bg-success-100 dark:bg-success-900/20',
    label: 'Saudável'
  },
  warning: {
    color: 'text-warning-600 dark:text-warning-400',
    bgColor: 'bg-warning-100 dark:bg-warning-900/20',
    label: 'Atenção'
  },
  critical: {
    color: 'text-error-600 dark:text-error-400',
    bgColor: 'bg-error-100 dark:bg-error-900/20',
    label: 'Crítico'
  }
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
      <div
        className={cn('h-2 rounded-full transition-all duration-300', color)}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}

export function SystemHealthCard({ data, loading = false, className }: SystemHealthCardProps) {
  const config = statusConfig[data.status]
  
  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-40"></div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-12 mx-auto mb-2"></div>
                <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-16 mx-auto mb-2"></div>
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Status do Sistema
          </h3>
          <div className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            config.bgColor,
            config.color
          )}>
            {config.label}
          </div>
        </div>
      </CardHeader>
      
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CPU */}
          <div className="text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">CPU</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              {data.cpu}%
            </p>
            <ProgressBar 
              value={data.cpu} 
              color={data.cpu > 80 ? 'bg-error-500' : data.cpu > 60 ? 'bg-warning-500' : 'bg-success-500'} 
            />
          </div>
          
          {/* Memory */}
          <div className="text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Memória</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              {data.memory}%
            </p>
            <ProgressBar 
              value={data.memory} 
              color={data.memory > 80 ? 'bg-error-500' : data.memory > 60 ? 'bg-warning-500' : 'bg-success-500'} 
            />
          </div>
          
          {/* Uptime */}
          <div className="text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Uptime</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              {data.uptime}
            </p>
            <div className="h-2 bg-success-200 dark:bg-success-800 rounded-full">
              <div className="h-2 bg-success-500 rounded-full w-full"></div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}