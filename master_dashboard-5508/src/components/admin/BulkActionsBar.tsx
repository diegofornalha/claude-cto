import { motion } from 'framer-motion'
import { Trash2, RotateCcw, CheckSquare, Square } from 'lucide-react'
import { useState } from 'react'

interface BulkActionsBarProps {
  selectedCount: number
  onClearSelected: () => void
  onSelectAll: () => void
  onDeselectAll: () => void
  isAllSelected: boolean
  onUndo?: () => void
  showUndo?: boolean
  disabled?: boolean
}

export default function BulkActionsBar({ 
  selectedCount, 
  onClearSelected, 
  onSelectAll,
  onDeselectAll,
  isAllSelected,
  onUndo,
  showUndo = false,
  disabled = false
}: BulkActionsBarProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClear = async () => {
    setIsLoading(true)
    await onClearSelected()
    setIsLoading(false)
  }

  if (selectedCount === 0 && !showUndo) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 mb-4"
    >
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          {showUndo && onUndo ? (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={onUndo}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Desfazer Limpeza</span>
            </motion.button>
          ) : (
            <div className="w-full">
              <button
                onClick={isAllSelected ? onDeselectAll : onSelectAll}
                className="flex items-center justify-center w-full space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
                disabled={disabled}
              >
                {isAllSelected ? (
                  <CheckSquare className="w-4 h-4 text-blue-500" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span>{isAllSelected ? 'Desmarcar' : 'Selecionar'}</span>
              </button>
              
            </div>
          )}
        </div>
        
        {selectedCount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {selectedCount} selecionada{selectedCount !== 1 ? 's' : ''}
            </span>
            {!showUndo && (
              <button
                onClick={handleClear}
                disabled={isLoading || disabled}
                className="flex items-center space-x-2 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                <span>{isLoading ? 'Limpando...' : 'Limpar'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isLoading && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="bg-red-500 h-1 rounded-full"
          />
        </motion.div>
      )}
    </motion.div>
  )
}