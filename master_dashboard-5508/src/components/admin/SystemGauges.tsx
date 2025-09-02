import { motion } from 'framer-motion'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import { Cpu, HardDrive, Thermometer, Zap } from 'lucide-react'

interface SystemGaugesProps {
  cpu: number
  memory: number
  disk: number
  temperature: number
  className?: string
}

interface GaugeProps {
  value: number
  label: string
  icon: React.ComponentType<any>
  color: string
  unit: string
  maxValue?: number
}

function AnimatedGauge({ value, label, icon: Icon, color, unit, maxValue = 100 }: GaugeProps) {
  const getStatusColor = (value: number, thresholds = { warning: 70, danger: 90 }) => {
    if (value >= thresholds.danger) return '#EF4444'
    if (value >= thresholds.warning) return '#F59E0B'
    return color
  }

  const statusColor = getStatusColor(value)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${statusColor}20` }}>
            <Icon className="w-5 h-5" style={{ color: statusColor }} />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        </div>
        <span className="text-xs text-gray-500">{unit}</span>
      </div>

      <div className="relative w-24 h-24 mx-auto mb-4">
        <CircularProgressbar
          value={value}
          maxValue={maxValue}
          text={`${Math.round(value)}${unit}`}
          styles={buildStyles({
            rotation: 0.25,
            strokeLinecap: 'round',
            textSize: '16px',
            pathTransitionDuration: 1,
            pathColor: statusColor,
            textColor: statusColor,
            trailColor: '#374151',
            backgroundColor: '#F3F4F6',
          })}
        />
        
        {/* Pulse animation para valores críticos */}
        {value >= 90 && (
          <motion.div
            animate={{ 
              boxShadow: [
                `0 0 0 0 ${statusColor}40`,
                `0 0 0 10px ${statusColor}00`
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full"
          />
        )}
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-center space-x-2">
        <div 
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: statusColor }}
        />
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {value >= 90 ? 'Crítico' : value >= 70 ? 'Atenção' : 'Normal'}
        </span>
      </div>

      {/* Trend indicator */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-3 text-center"
      >
        <div className="text-xs text-gray-500">
          Limite recomendado: {maxValue === 100 ? '80%' : '85°C'}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function SystemGauges({ 
  cpu, 
  memory, 
  disk, 
  temperature, 
  className = '' 
}: SystemGaugesProps) {
  const gauges = [
    {
      value: cpu,
      label: 'CPU',
      icon: Cpu,
      color: '#3B82F6',
      unit: '%',
      maxValue: 100
    },
    {
      value: memory,
      label: 'Memória',
      icon: HardDrive,
      color: '#10B981',
      unit: '%',
      maxValue: 100
    },
    {
      value: disk,
      label: 'Disco',
      icon: HardDrive,
      color: '#F59E0B',
      unit: '%',
      maxValue: 100
    },
    {
      value: temperature,
      label: 'Temperatura',
      icon: Thermometer,
      color: '#EF4444',
      unit: '°C',
      maxValue: 100
    }
  ]

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {gauges.map((gauge, index) => (
        <motion.div
          key={gauge.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <AnimatedGauge {...gauge} />
        </motion.div>
      ))}

      {/* Sistema de alertas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="sm:col-span-2 lg:col-span-4"
      >
        {[cpu, memory, disk, temperature].some(value => value >= 90) && (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-4"
          >
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                Sistema sob alta carga - considere otimizações
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}