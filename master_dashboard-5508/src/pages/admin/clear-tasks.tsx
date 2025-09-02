import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trash2, 
  Filter, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  Calendar
} from 'lucide-react'
import BulkActionsBar from '@/components/admin/BulkActionsBar'
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

export default function ClearTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [recentlyClearedTasks, setRecentlyClearedTasks] = useState<Task[]>([])
  const [undoTimeLeft, setUndoTimeLeft] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    selected: 0
  })

  // Carregar tarefas
  useEffect(() => {
    loadTasks()
  }, [])

  // Timer para undo
  useEffect(() => {
    if (undoTimeLeft > 0) {
      const timer = setTimeout(() => setUndoTimeLeft(undoTimeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (recentlyClearedTasks.length > 0) {
      setRecentlyClearedTasks([])
    }
  }, [undoTimeLeft, recentlyClearedTasks.length])

  // Filtrar tarefas
  useEffect(() => {
    let filtered = tasks

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    // Filtro por data
    if (dateFilter !== 'all') {
      const now = new Date()
      const cutoff = new Date()
      
      switch (dateFilter) {
        case '1d':
          cutoff.setDate(now.getDate() - 1)
          break
        case '7d':
          cutoff.setDate(now.getDate() - 7)
          break
        case '30d':
          cutoff.setDate(now.getDate() - 30)
          break
      }
      
      filtered = filtered.filter(task => new Date(task.created_at) >= cutoff)
    }

    // Filtro por busca
    if (searchQuery) {
      filtered = filtered.filter(task => 
        task.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.execution_prompt.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredTasks(filtered)
    
    // Atualizar estatísticas
    setStats({
      total: filtered.length,
      completed: filtered.filter(t => t.status === 'completed').length,
      failed: filtered.filter(t => t.status === 'failed').length,
      selected: Array.from(selectedTasks).filter(id => 
        filtered.some(task => task.id === id)
      ).length
    })
  }, [tasks, statusFilter, dateFilter, searchQuery, selectedTasks])

  const loadTasks = async () => {
    try {
      setLoading(true)
      // Simular carregamento de tarefas da API
      // Em produção, substituir por chamada real à API
      const mockTasks: Task[] = [
        {
          id: '1',
          identifier: 'analyze_code',
          status: 'completed',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          finished_at: new Date(Date.now() - 86300000).toISOString(),
          execution_prompt: 'Analisar qualidade do código Python',
          model: 'opus',
          working_directory: '/app/src'
        },
        {
          id: '2',
          identifier: 'fix_bugs',
          status: 'failed',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          finished_at: new Date(Date.now() - 3500000).toISOString(),
          execution_prompt: 'Corrigir bugs encontrados na análise',
          model: 'sonnet',
          working_directory: '/app/src'
        },
        {
          id: '3',
          identifier: 'run_tests',
          status: 'completed',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          finished_at: new Date(Date.now() - 7000000).toISOString(),
          execution_prompt: 'Executar suite completa de testes',
          model: 'haiku',
          working_directory: '/app'
        }
      ]
      setTasks(mockTasks)
    } catch (error) {
      toast.error('Erro ao carregar tarefas')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks)
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId)
    } else {
      newSelected.add(taskId)
    }
    setSelectedTasks(newSelected)
  }

  const handleSelectAll = () => {
    const clearableTaskIds = filteredTasks
      .filter(task => task.status === 'completed' || task.status === 'failed')
      .map(task => task.id)
    setSelectedTasks(new Set(clearableTaskIds))
  }

  const handleDeselectAll = () => {
    setSelectedTasks(new Set())
  }

  const isAllSelected = () => {
    const clearableTaskIds = filteredTasks
      .filter(task => task.status === 'completed' || task.status === 'failed')
      .map(task => task.id)
    return clearableTaskIds.length > 0 && 
           clearableTaskIds.every(id => selectedTasks.has(id))
  }

  const handleClearSelected = () => {
    if (selectedTasks.size === 0) return
    setShowConfirmation(true)
  }

  const confirmClear = async () => {
    try {
      setClearing(true)
      
      // Simular chamada de API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const clearedTasks = tasks.filter(task => selectedTasks.has(task.id))
      setRecentlyClearedTasks(clearedTasks)
      setTasks(tasks.filter(task => !selectedTasks.has(task.id)))
      setSelectedTasks(new Set())
      setShowConfirmation(false)
      setUndoTimeLeft(30)
      
      toast.success(`${clearedTasks.length} tarefa(s) removida(s) com sucesso`)
    } catch (error) {
      toast.error('Erro ao limpar tarefas')
      console.error(error)
    } finally {
      setClearing(false)
    }
  }

  const handleUndo = () => {
    setTasks(prev => [...prev, ...recentlyClearedTasks])
    setRecentlyClearedTasks([])
    setUndoTimeLeft(0)
    toast.success('Tarefas restauradas com sucesso')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <Head>
        <title>Limpeza de Tarefas - Dashboard Admin</title>
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
              Limpeza de Tarefas
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie e limpe tarefas completadas ou falhadas do sistema
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Trash2 className="w-5 h-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completadas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Falhadas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.failed}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <CheckSquare className="w-5 h-5 text-purple-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Selecionadas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.selected}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filtros */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">Todos</option>
                  <option value="completed">Completadas</option>
                  <option value="failed">Falhadas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Período
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">Todos</option>
                  <option value="1d">Último dia</option>
                  <option value="7d">Última semana</option>
                  <option value="30d">Último mês</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buscar
                </label>
                <input
                  type="text"
                  placeholder="Buscar por identificador ou descrição..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                />
              </div>
            </div>
          </motion.div>

          {/* Bulk Actions Bar */}
          <BulkActionsBar
            selectedCount={stats.selected}
            onClearSelected={handleClearSelected}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            isAllSelected={isAllSelected()}
            onUndo={undoTimeLeft > 0 ? handleUndo : undefined}
            showUndo={undoTimeLeft > 0}
          />

          {/* Undo Banner */}
          <AnimatePresence>
            {undoTimeLeft > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="mb-6 p-4 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-green-800 dark:text-green-200">
                      {recentlyClearedTasks.length} tarefa(s) removida(s). 
                      Você pode desfazer esta ação em {undoTimeLeft} segundos.
                    </span>
                  </div>
                  <button
                    onClick={handleUndo}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  >
                    Desfazer
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tasks List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow"
          >
            <div className="p-6">
              <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhuma tarefa encontrada com os filtros aplicados
                    </p>
                  </div>
                ) : (
                  filteredTasks.map((task, index) => {
                    const StatusIcon = statusConfig[task.status].icon
                    const isSelectable = task.status === 'completed' || task.status === 'failed'
                    
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
                          border rounded-lg p-4 transition-all duration-200 hover:shadow-md
                          ${selectedTasks.has(task.id) 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-700'
                          }
                          ${!isSelectable ? 'opacity-60' : ''}
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            {isSelectable && (
                              <button
                                onClick={() => handleSelectTask(task.id)}
                                className="mt-1 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              >
                                {selectedTasks.has(task.id) ? (
                                  <CheckSquare className="w-5 h-5 text-blue-500" />
                                ) : (
                                  <Square className="w-5 h-5 text-gray-400" />
                                )}
                              </button>
                            )}
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className={`
                                  p-1 rounded-full ${statusConfig[task.status].bg}
                                `}>
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
                              </div>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {task.execution_prompt}
                              </p>
                              
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>Modelo: {task.model}</span>
                                <span>Diretório: {task.working_directory}</span>
                                <span>Criado: {formatDate(task.created_at)}</span>
                                {task.finished_at && (
                                  <span>Finalizado: {formatDate(task.finished_at)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            <Eye className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {showConfirmation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowConfirmation(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full mr-4">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Confirmar Limpeza
                  </h3>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Tem certeza de que deseja remover {selectedTasks.size} tarefa(s)? 
                  Esta ação pode ser desfeita nos próximos 30 segundos.
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmClear}
                    disabled={clearing}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {clearing ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        Limpando...
                      </>
                    ) : (
                      'Confirmar'
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