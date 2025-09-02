import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactFlow, { 
  Node, 
  Edge, 
  MiniMap, 
  Controls, 
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FiPlay, FiPause, FiRefreshCw, FiZap, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { toast, Toaster } from 'react-hot-toast';
import axios from 'axios';

interface Task {
  identifier: string;
  prompt: string;
  model: 'opus' | 'sonnet' | 'haiku';
  dependencies: string[];
  estimated_duration?: number;
  complexity_score?: number;
}

interface OrchestrationGroup {
  name: string;
  tasks: Task[];
  status: 'draft' | 'simulating' | 'submitted' | 'running' | 'completed';
}

const SubmitOrchestrationPage: React.FC = () => {
  const [orchestrationGroup, setOrchestrationGroup] = useState<OrchestrationGroup>({
    name: '',
    tasks: [],
    status: 'draft'
  });
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [simulationMode, setSimulationMode] = useState(false);
  const [taskForm, setTaskForm] = useState<Task>({
    identifier: '',
    prompt: '',
    model: 'opus',
    dependencies: []
  });

  // Função para converter tasks em nodes e edges do ReactFlow
  const updateDAG = useCallback(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    // Calcular posições usando layout hierárquico
    const tasksByLevel: { [key: number]: Task[] } = {};
    const taskLevels: { [key: string]: number } = {};
    
    // Função para calcular nível de cada task
    const calculateLevel = (task: Task, visited: Set<string> = new Set()): number => {
      if (visited.has(task.identifier)) return taskLevels[task.identifier] || 0;
      visited.add(task.identifier);
      
      if (task.dependencies.length === 0) {
        taskLevels[task.identifier] = 0;
        return 0;
      }
      
      const depLevels = task.dependencies
        .map(dep => {
          const depTask = orchestrationGroup.tasks.find(t => t.identifier === dep);
          return depTask ? calculateLevel(depTask, visited) : -1;
        })
        .filter(level => level >= 0);
      
      const level = depLevels.length > 0 ? Math.max(...depLevels) + 1 : 0;
      taskLevels[task.identifier] = level;
      return level;
    };
    
    // Calcular níveis
    orchestrationGroup.tasks.forEach(task => calculateLevel(task));
    
    // Agrupar tasks por nível
    orchestrationGroup.tasks.forEach(task => {
      const level = taskLevels[task.identifier] || 0;
      if (!tasksByLevel[level]) tasksByLevel[level] = [];
      tasksByLevel[level].push(task);
    });
    
    // Criar nodes
    Object.entries(tasksByLevel).forEach(([level, tasks]) => {
      const levelNum = parseInt(level);
      tasks.forEach((task, index) => {
        const complexityColor = task.complexity_score 
          ? task.complexity_score > 75 ? '#ef4444' 
          : task.complexity_score > 50 ? '#f59e0b'
          : '#10b981'
          : '#6b7280';
        
        newNodes.push({
          id: task.identifier,
          data: { 
            label: (
              <div className="text-center">
                <div className="font-bold text-sm">{task.identifier}</div>
                <div className="text-xs text-gray-500 mt-1">{task.model}</div>
                {task.estimated_duration && (
                  <div className="text-xs text-blue-500 mt-1">~{task.estimated_duration}s</div>
                )}
              </div>
            )
          },
          position: { 
            x: 200 + levelNum * 300, 
            y: 100 + index * 150 
          },
          style: {
            background: `linear-gradient(135deg, ${complexityColor}22, ${complexityColor}44)`,
            border: `2px solid ${complexityColor}`,
            borderRadius: '12px',
            padding: '10px',
            width: 180,
            fontSize: '12px'
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left
        });
      });
    });
    
    // Criar edges
    orchestrationGroup.tasks.forEach(task => {
      task.dependencies.forEach(dep => {
        newEdges.push({
          id: `${dep}-${task.identifier}`,
          source: dep,
          target: task.identifier,
          type: 'smoothstep',
          animated: simulationMode,
          style: {
            stroke: simulationMode ? '#8b5cf6' : '#94a3b8',
            strokeWidth: 2
          }
        });
      });
    });
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, [orchestrationGroup.tasks, simulationMode, setNodes, setEdges]);

  useEffect(() => {
    updateDAG();
  }, [updateDAG]);

  const addTask = () => {
    if (!taskForm.identifier || !taskForm.prompt) {
      toast.error('Identificador e prompt são obrigatórios');
      return;
    }
    
    const newTask: Task = {
      ...taskForm,
      estimated_duration: Math.floor(Math.random() * 60) + 10,
      complexity_score: Math.floor(Math.random() * 100)
    };
    
    setOrchestrationGroup(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
    
    setTaskForm({
      identifier: '',
      prompt: '',
      model: 'opus',
      dependencies: []
    });
    
    toast.success(`Task ${newTask.identifier} adicionada!`);
  };

  const removeTask = (identifier: string) => {
    setOrchestrationGroup(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.identifier !== identifier)
    }));
    
    // Remover dependências para esta task
    setOrchestrationGroup(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => ({
        ...t,
        dependencies: t.dependencies.filter(d => d !== identifier)
      }))
    }));
    
    toast.success(`Task ${identifier} removida`);
  };

  const submitOrchestration = async () => {
    if (!orchestrationGroup.name || orchestrationGroup.tasks.length === 0) {
      toast.error('Nome do grupo e pelo menos uma task são necessários');
      return;
    }
    
    try {
      const response = await axios.post('/api/orchestration/submit', {
        group: orchestrationGroup.name,
        tasks: orchestrationGroup.tasks
      });
      
      if (response.data.success) {
        toast.success('Orquestração submetida com sucesso!');
        setOrchestrationGroup(prev => ({ ...prev, status: 'submitted' }));
      }
    } catch (error) {
      toast.error('Erro ao submeter orquestração');
      console.error(error);
    }
  };

  const runSimulation = () => {
    setSimulationMode(true);
    toast.success('Modo simulação ativado - visualize o fluxo de execução');
    
    // Simular execução sequencial
    let delay = 0;
    orchestrationGroup.tasks.forEach(task => {
      setTimeout(() => {
        toast.success(`Simulando execução: ${task.identifier}`, {
          duration: 2000,
          icon: '🚀'
        });
      }, delay);
      delay += 2000;
    });
    
    setTimeout(() => {
      setSimulationMode(false);
      toast.success('Simulação concluída!', { icon: '✅' });
    }, delay + 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Toaster position="top-right" />
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Submit Orchestration
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Crie e visualize orquestrações com DAG interativo
              </p>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={runSimulation}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                <FiPlay /> Simular
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={submitOrchestration}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                <FiZap /> Submeter
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                Configurar Orquestração
              </h2>
              
              {/* Group Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Grupo
                </label>
                <input
                  type="text"
                  value={orchestrationGroup.name}
                  onChange={(e) => setOrchestrationGroup(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="my-orchestration"
                />
              </div>
              
              {/* Add Task Form */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Adicionar Task
                </h3>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    value={taskForm.identifier}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, identifier: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="task-identifier"
                  />
                  
                  <textarea
                    value={taskForm.prompt}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, prompt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Task prompt..."
                    rows={3}
                  />
                  
                  <select
                    value={taskForm.model}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, model: e.target.value as 'opus' | 'sonnet' | 'haiku' }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="opus">Opus (Complex)</option>
                    <option value="sonnet">Sonnet (Balanced)</option>
                    <option value="haiku">Haiku (Fast)</option>
                  </select>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Dependências
                    </label>
                    <select
                      multiple
                      value={taskForm.dependencies}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                        setTaskForm(prev => ({ ...prev, dependencies: selected }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      size={3}
                    >
                      {orchestrationGroup.tasks.map(task => (
                        <option key={task.identifier} value={task.identifier}>
                          {task.identifier}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addTask}
                    className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium shadow hover:shadow-lg transition-all"
                  >
                    Adicionar Task
                  </motion.button>
                </div>
              </div>
              
              {/* Task List */}
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Tasks ({orchestrationGroup.tasks.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {orchestrationGroup.tasks.map(task => (
                    <motion.div
                      key={task.identifier}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-800 dark:text-gray-200">
                          {task.identifier}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {task.model} • {task.dependencies.length} deps
                        </div>
                      </div>
                      <button
                        onClick={() => removeTask(task.identifier)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all"
                      >
                        ✕
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* DAG Visualization */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 h-[600px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  DAG Visualization
                </h2>
                {simulationMode && (
                  <div className="flex items-center gap-2 text-purple-600">
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Simulando...</span>
                  </div>
                )}
              </div>
              
              <div className="h-[500px] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                {orchestrationGroup.tasks.length > 0 ? (
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                    attributionPosition="bottom-left"
                  >
                    <Background gap={12} size={1} />
                    <Controls />
                    <MiniMap 
                      nodeColor={(node) => {
                        const task = orchestrationGroup.tasks.find(t => t.identifier === node.id);
                        return task?.complexity_score && task.complexity_score > 75 ? '#ef4444' : '#8b5cf6';
                      }}
                      style={{
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #e5e7eb'
                      }}
                    />
                  </ReactFlow>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <FiAlertCircle className="w-12 h-12 mx-auto mb-3" />
                      <p>Adicione tasks para visualizar o DAG</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Metrics Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {orchestrationGroup.tasks.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white">
                📋
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Complexidade Média</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {orchestrationGroup.tasks.length > 0
                    ? Math.round(
                        orchestrationGroup.tasks.reduce((acc, t) => acc + (t.complexity_score || 0), 0) /
                        orchestrationGroup.tasks.length
                      )
                    : 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white">
                ⚡
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tempo Estimado</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {orchestrationGroup.tasks.reduce((acc, t) => acc + (t.estimated_duration || 0), 0)}s
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white">
                ⏱️
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <p className="text-lg font-bold capitalize text-gray-800 dark:text-gray-200">
                  {orchestrationGroup.status}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-white">
                {orchestrationGroup.status === 'completed' ? <FiCheckCircle /> : <FiRefreshCw className="animate-spin" />}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SubmitOrchestrationPage;