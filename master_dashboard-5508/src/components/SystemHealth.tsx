import { motion } from 'framer-motion'
import { Server } from 'lucide-react'
import { memo } from 'react'

interface SystemHealthData {
  cpu: number
  memory: number
  uptime: string
  status: 'healthy' | 'warning' | 'critical'
}

interface SystemHealthProps {
  data: SystemHealthData
}

const SystemHealth = memo(({ data }: SystemHealthProps) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Server className="w-5 h-5 mr-2" />
          Saúde do Sistema
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          data.status === 'healthy' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        }`}>
          {data.status === 'healthy' ? 'Saudável' : 'Atenção'}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">CPU</p>
          <div className="flex items-center">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
              <motion.div 
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${data.cpu}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{data.cpu}%</span>
          </div>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Memória</p>
          <div className="flex items-center">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
              <motion.div 
                className="bg-green-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${data.memory}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{data.memory}%</span>
          </div>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Uptime</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{data.uptime}</p>
        </div>
      </div>
    </motion.div>
  )
})

SystemHealth.displayName = 'SystemHealth'

export default SystemHealth