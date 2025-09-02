import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Trash2, 
  AlertTriangle, 
  Eye,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  GitBranch,
  Database,
  FileText
} from 'lucide-react'
import AuditLog from '@/components/admin/AuditLog'
import AdminLayout from '@/components/admin/AdminLayout'
import toast from 'react-hot-toast'
import Head from 'next/head'

interface Task {
  id: string
  identifier: string
  status: 'completed' | 'failed' | 'running' | 'pending'
  created_at: string
  finished_at?: string
  execution_prompt: string
  model: string
  working_directory: string
  dependencies?: string[]
  dependents?: string[] // Tarefas que dependem desta
  result?: any
}

interface AuditEntry {
  id: string
  timestamp: Date
  action: 'delete' | 'clear' | 'restore' | 'create' | 'update'
  user: string
  target: string
  details: string
  status: 'success' | 'error' | 'warning'
  metadata?: Record<string, any>
}

const statusConfig = {
  completed: {
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-100 dark:bg-green-900',
    label: 'Completada'
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-100 dark:bg-red-900',
    label: 'Falhou'
  },
  running: {
    icon: Clock,
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900',
    label: 'Em execução'
  },
  pending: {
    icon: Clock,
    color: 'text-yellow-500',
    bg: 'bg-yellow-100 dark:bg-yellow-900',
    label: 'Pendente'
  }
}

export default function DeleteTaskPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([])
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [showDependencies, setShowDependencies] = useState(false)

  // Carregar audit log inicial
  useEffect(() => {
    loadAuditLog()
  }, [])

  // Buscar tarefas conforme usuário digita
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchTasks(searchQuery.trim())
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const loadAuditLog = () => {
    // Simular carregamento do audit log
    const mockEntries: AuditEntry[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 300000),
        action: 'delete',
        user: 'Admin',
        target: 'task_analyze_code',
        details: 'Tarefa deletada via interface admin',
        status: 'success',
        metadata: { taskId: 'task_analyze_code', reason: 'Limpeza manual' }
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 600000),
        action: 'restore',
        user: 'Admin',
        target: 'task_fix_bugs',
        details: 'Tarefa restaurada após soft delete',
        status: 'success',
        metadata: { taskId: 'task_fix_bugs', reason: 'Restauração solicitada' }
      }
    ]
    setAuditEntries(mockEntries)
  }

  const searchTasks = async (query: string) => {
    try {
      setLoading(true)
      
      // Simular busca na API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockTasks: Task[] = [
        {
          id: '1',
          identifier: 'analyze_code_quality',
          status: 'completed' as const,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          finished_at: new Date(Date.now() - 86300000).toISOString(),
          execution_prompt: 'Analisar qualidade do código Python utilizando ferramentas estáticas',
          model: 'opus',
          working_directory: '/app/src',
          dependencies: [],
          dependents: ['fix_code_issues', 'generate_report']
        },
        {
          id: '2',
          identifier: 'fix_code_issues',
          status: 'failed' as const,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          finished_at: new Date(Date.now() - 3500000).toISOString(),
          execution_prompt: 'Corrigir issues encontrados na análise de qualidade',
          model: 'sonnet',
          working_directory: '/app/src',
          dependencies: ['analyze_code_quality'],
          dependents: ['run_final_tests']
        },
        {
          id: '3',
          identifier: 'generate_detailed_report',
          status: 'completed' as const,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          finished_at: new Date(Date.now() - 7000000).toISOString(),
          execution_prompt: 'Gerar relatório detalhado da análise de código',
          model: 'haiku',
          working_directory: '/app/reports',
          dependencies: ['analyze_code_quality'],
          dependents: []
        }
      ].filter(task => 
        task.identifier.toLowerCase().includes(query.toLowerCase()) ||
        task.execution_prompt.toLowerCase().includes(query.toLowerCase())
      )

      setSearchResults(mockTasks)
    } catch (error) {
      toast.error('Erro ao buscar tarefas')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task)
    setShowDependencies(true)
  }

  const canDeleteTask = (task: Task): { canDelete: boolean, reason?: string } => {
    if (task.status === 'running') {
      return { canDelete: false, reason: 'Tarefa em execução não pode ser deletada' }
    }
    
    if (task.dependents && task.dependents.length > 0) {
      return { 
        canDelete: false, 
        reason: `Esta tarefa possui ${task.dependents.length} dependente(s) que serão afetados` 
      }
    }
    
    return { canDelete: true }
  }

  const handleDeleteTask = () => {
    if (!selectedTask) return
    
    const { canDelete, reason } = canDeleteTask(selectedTask)
    if (!canDelete) {
      toast.error(reason || 'Não é possível deletar esta tarefa')
      return
    }
    
    setShowConfirmation(true)
  }

  const confirmDelete = async () => {
    if (!selectedTask) return

    try {
      setDeleting(true)
      
      // Simular soft delete
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Adicionar ao histórico de deletadas
      setDeletedTasks(prev => [selectedTask, ...prev])
      
      // Adicionar ao audit log
      const newAuditEntry: AuditEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        action: 'delete',
        user: 'Admin',
        target: selectedTask.identifier,
        details: `Tarefa deletada via interface admin - ${selectedTask.execution_prompt.substring(0, 50)}...`,
        status: 'success',
        metadata: { 
          taskId: selectedTask.id,
          reason: 'Deleção manual',
          softDelete: true,
          restoreUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias para restore
        }
      }
      
      setAuditEntries(prev => [newAuditEntry, ...prev])
      
      // Remover das results de busca
      setSearchResults(prev => prev.filter(task => task.id !== selectedTask.id))
      
      setSelectedTask(null)
      setShowConfirmation(false)
      setShowDependencies(false)
      
      toast.success('Tarefa deletada com sucesso. Pode ser restaurada nos próximos 7 dias.')
      
    } catch (error) {
      toast.error('Erro ao deletar tarefa')
      console.error(error)
    } finally {
      setDeleting(false)
    }
  }

  const handleRestoreTask = async (task: Task) => {
    try {
      // Simular restore da API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Remover da lista de deletadas
      setDeletedTasks(prev => prev.filter(t => t.id !== task.id))
      
      // Adicionar ao audit log
      const newAuditEntry: AuditEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        action: 'restore',
        user: 'Admin',
        target: task.identifier,
        details: `Tarefa restaurada após soft delete`,
        status: 'success',
        metadata: { 
          taskId: task.id,
          reason: 'Restauração manual'
        }
      }
      
      setAuditEntries(prev => [newAuditEntry, ...prev])
      
      toast.success('Tarefa restaurada com sucesso')
      
    } catch (error) {
      toast.error('Erro ao restaurar tarefa')
      console.error(error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  return (
    <AdminLayout>
      <Head>
        <title>Deletar Tarefa - Dashboard Admin</title>
      </Head>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Gerenciar Tarefas
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Busque, visualize e gerencie tarefas individuais com controle de dependências
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search and Results */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar tarefa por ID ou descrição..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                  />
                  {loading && (
                    <div className="absolute right-3 top-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full"
                      />
                    </div>
                  )}
                </div>
                
                {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
                  <p className="mt-2 text-sm text-gray-500">
                    Digite pelo menos 2 caracteres para buscar
                  </p>
                )}
              </motion.div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Resultados da Busca ({searchResults.length})
                    </h3>
                    
                    <div className="space-y-4">
                      {searchResults.map((task, index) => {
                        const StatusIcon = statusConfig[task.status].icon
                        const { canDelete, reason } = canDeleteTask(task)
                        
                        return (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`
                              border rounded-lg p-4 transition-all duration-200 hover:shadow-md cursor-pointer
                              ${selectedTask?.id === task.id 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                : 'border-gray-200 dark:border-gray-700'
                              }
                            `}
                            onClick={() => handleSelectTask(task)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className={`p-1 rounded-full ${statusConfig[task.status].bg}`}>
                                    <StatusIcon className={`w-4 h-4 ${statusConfig[task.status].color}`} />
                                  </div>
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {task.identifier}
                                  </span>
                                  <span className={`
                                    px-2 py-1 text-xs font-medium rounded-full
                                    ${statusConfig[task.status].bg} ${statusConfig[task.status].color}
                                  `}>
                                    {statusConfig[task.status].label}
                                  </span>
                                  {!canDelete && (
                                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                  )}
                                </div>
                                
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {task.execution_prompt}
                                </p>
                                
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span>Modelo: {task.model}</span>
                                  <span>Criado: {formatDate(task.created_at)}</span>
                                  {task.dependencies && task.dependencies.length > 0 && (
                                    <span className="flex items-center">
                                      <GitBranch className="w-3 h-3 mr-1" />
                                      {task.dependencies.length} dep.
                                    </span>
                                  )}
                                  {task.dependents && task.dependents.length > 0 && (
                                    <span className="flex items-center text-yellow-600">
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      {task.dependents.length} afetadas
                                    </span>
                                  )}
                                </div>
                                
                                {!canDelete && (
                                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-800 dark:text-yellow-200">
                                    ⚠️ {reason}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // View task details
                                  }}
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                  <Eye className="w-4 h-4 text-gray-400" />
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleSelectTask(task)
                                    if (canDelete) handleDeleteTask()
                                  }}
                                  disabled={!canDelete}
                                  className={`
                                    p-2 rounded-lg transition-colors
                                    ${canDelete 
                                      ? 'hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500' 
                                      : 'text-gray-300 cursor-not-allowed'
                                    }
                                  `}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Deleted Tasks Recovery */}
              {deletedTasks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Database className="w-5 h-5 mr-2 text-blue-500" />
                      Tarefas Deletadas (Recuperáveis)
                    </h3>
                    
                    <div className="space-y-3">
                      {deletedTasks.map((task, index) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {task.identifier}
                            </span>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-md">
                              {task.execution_prompt}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => handleRestoreTask(task)}
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Restaurar</span>
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Audit Log Sidebar */}
            <div className="space-y-6">
              <AuditLog 
                entries={auditEntries}
                maxEntries={20}
                autoRefresh={true}
              />
            </div>
          </div>
        </div>

        {/* Dependencies Modal */}
        <AnimatePresence>
          {showDependencies && selectedTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowDependencies(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Detalhes da Tarefa
                  </h3>
                  <button
                    onClick={() => setShowDependencies(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                {/* Task Info */}
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className={`p-2 rounded-full ${statusConfig[selectedTask.status].bg}`}>
                      {(() => {
                        const StatusIcon = statusConfig[selectedTask.status].icon
                        return <StatusIcon className={`w-5 h-5 ${statusConfig[selectedTask.status].color}`} />
                      })()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {selectedTask.identifier}
                      </h4>
                      <span className={`
                        px-2 py-1 text-xs font-medium rounded-full
                        ${statusConfig[selectedTask.status].bg} ${statusConfig[selectedTask.status].color}
                      `}>
                        {statusConfig[selectedTask.status].label}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {selectedTask.execution_prompt}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Modelo:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{selectedTask.model}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Diretório:</span>
                      <span className="ml-2 text-gray-900 dark:text-white font-mono text-xs">
                        {selectedTask.working_directory}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Criado:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {formatDate(selectedTask.created_at)}
                      </span>
                    </div>
                    {selectedTask.finished_at && (
                      <div>
                        <span className="text-gray-500">Finalizado:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {formatDate(selectedTask.finished_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dependencies */}
                {(selectedTask.dependencies?.length || selectedTask.dependents?.length) && (
                  <div className="mb-6">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <GitBranch className="w-4 h-4 mr-2" />
                      Dependências
                    </h5>
                    
                    {selectedTask.dependencies && selectedTask.dependencies.length > 0 && (
                      <div className="mb-4">
                        <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Depende de:
                        </h6>
                        <div className="space-y-1">
                          {selectedTask.dependencies.map((dep, index) => (
                            <div key={index} className="text-sm text-gray-600 dark:text-gray-400 pl-4 border-l-2 border-green-200 dark:border-green-800">
                              {dep}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedTask.dependents && selectedTask.dependents.length > 0 && (
                      <div>
                        <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1 text-yellow-500" />
                          Tarefas afetadas pela deleção:
                        </h6>
                        <div className="space-y-1">
                          {selectedTask.dependents.map((dep, index) => (
                            <div key={index} className="text-sm text-yellow-700 dark:text-yellow-300 pl-4 border-l-2 border-yellow-200 dark:border-yellow-800">
                              {dep}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDependencies(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  
                  {(() => {
                    const { canDelete, reason } = canDeleteTask(selectedTask)
                    return canDelete ? (
                      <button
                        onClick={() => {
                          setShowDependencies(false)
                          handleDeleteTask()
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Deletar Tarefa
                      </button>
                    ) : (
                      <div className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Não Permitido
                      </div>
                    )
                  })()}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showConfirmation && selectedTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full mr-4">
                    <Trash2 className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Confirmar Deleção
                  </h3>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Tem certeza de que deseja deletar a tarefa <strong>{selectedTask.identifier}</strong>? 
                  Esta é uma deleção suave - a tarefa pode ser restaurada nos próximos 7 dias.
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {deleting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        Deletando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Confirmar
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  )
}