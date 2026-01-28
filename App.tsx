
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Label, ViewType, TimeRange, Priority } from './types';
import { INITIAL_LABELS, INITIAL_TASKS } from './constants';
import { isToday, isTomorrow, isPast, getLocalDateString } from './utils/dateUtils';
import TaskItem from './components/TaskItem';
import AgendaView from './components/AgendaView';
import TaskModal from './components/TaskModal';
import LabelManager from './components/LabelManager';
import Button from './components/Button';

const App: React.FC = () => {
  // State
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });
  const [labels, setLabels] = useState<Label[]>(() => {
    const saved = localStorage.getItem('labels');
    return saved ? JSON.parse(saved) : INITIAL_LABELS;
  });
  
  const [viewType, setViewType] = useState<ViewType>('list');
  const [activeRange, setActiveRange] = useState<TimeRange>('today');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isLabelManagerOpen, setIsLabelManagerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Persist data
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('labels', JSON.stringify(labels));
  }, [labels]);

  // Derived state
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           task.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      switch (activeRange) {
        case 'today': return isToday(task.dueDate);
        case 'tomorrow': return isTomorrow(task.dueDate);
        case 'past': return isPast(task.dueDate);
        case 'upcoming': return !isPast(task.dueDate) && !isToday(task.dueDate) && !isTomorrow(task.dueDate);
        default: return true;
      }
    });
  }, [tasks, activeRange, searchQuery]);

  // Calculate default date for new tasks based on active view
  const getDefaultDate = () => {
    const d = new Date();
    if (activeRange === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    } else if (activeRange === 'upcoming') {
      d.setDate(d.getDate() + 2);
    } else if (activeRange === 'past') {
      d.setDate(d.getDate() - 1);
    }
    return getLocalDateString(d);
  };

  // Handlers
  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const saveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } as Task : t));
    } else {
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title: taskData.title || '',
        description: taskData.description || '',
        dueDate: taskData.dueDate || getLocalDateString(),
        completed: false,
        priority: taskData.priority || Priority.MEDIUM,
        labelIds: taskData.labelIds || [],
        createdAt: new Date().toISOString(),
      };
      setTasks(prev => [newTask, ...prev]);
    }
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const addLabel = (name: string, color: string) => {
    const newLabel: Label = { id: `l-${Date.now()}`, name, color };
    setLabels(prev => [...prev, newLabel]);
  };

  const deleteLabel = (id: string) => {
    setLabels(prev => prev.filter(l => l.id !== id));
    setTasks(prev => prev.map(t => ({ ...t, labelIds: t.labelIds.filter(lid => lid !== id) })));
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">TaskPro <span className="text-indigo-600">AI</span></h1>
          </div>

          <nav className="space-y-1">
            <SidebarItem 
              active={activeRange === 'past'} 
              onClick={() => setActiveRange('past')} 
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              label="Dias Passados" 
              count={tasks.filter(t => isPast(t.dueDate)).length}
            />
            <SidebarItem 
              active={activeRange === 'today'} 
              onClick={() => setActiveRange('today')} 
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              label="Hoje" 
              count={tasks.filter(t => isToday(t.dueDate)).length}
            />
            <SidebarItem 
              active={activeRange === 'tomorrow'} 
              onClick={() => setActiveRange('tomorrow')} 
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              label="Amanhã" 
              count={tasks.filter(t => isTomorrow(t.dueDate)).length}
            />
            <SidebarItem 
              active={activeRange === 'upcoming'} 
              onClick={() => setActiveRange('upcoming')} 
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>}
              label="Próximos" 
              count={tasks.filter(t => !isPast(t.dueDate) && !isToday(t.dueDate) && !isTomorrow(t.dueDate)).length}
            />
          </nav>

          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Etiquetas</h3>
              <button onClick={() => setIsLabelManagerOpen(true)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            <div className="space-y-1">
              {labels.map(l => (
                <div key={l.id} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-900 font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="flex-grow">{l.name}</span>
                  <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 font-normal">
                    {tasks.filter(t => t.labelIds.includes(l.id)).length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6 flex-grow">
            <h2 className="text-2xl font-bold text-slate-800 capitalize">
              {activeRange === 'today' ? 'Hoje' : activeRange === 'tomorrow' ? 'Amanhã' : activeRange === 'past' ? 'Passados' : 'Próximos'}
            </h2>
            <div className="max-w-md w-full relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar tarefas..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setViewType('list')}
                className={`p-1.5 rounded-lg transition-all ${viewType === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button 
                onClick={() => setViewType('agenda')}
                className={`p-1.5 rounded-lg transition-all ${viewType === 'agenda' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <Button 
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
              onClick={() => setIsTaskModalOpen(true)}
            >
              Nova Tarefa
            </Button>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
          {viewType === 'list' ? (
            <div className="max-w-4xl mx-auto space-y-4">
              {filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    labels={labels} 
                    onToggle={toggleTask} 
                    onDelete={deleteTask}
                    onEdit={(t) => {
                      setEditingTask(t);
                      setIsTaskModalOpen(true);
                    }}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-lg font-medium">Tudo limpo por aqui!</p>
                  <p className="text-sm">Você não tem tarefas nesta visualização.</p>
                </div>
              )}
            </div>
          ) : (
            <AgendaView 
              tasks={filteredTasks} 
              labels={labels} 
              onToggle={toggleTask} 
              onDelete={deleteTask}
              onEdit={(t) => {
                setEditingTask(t);
                setIsTaskModalOpen(true);
              }}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      {isTaskModalOpen && (
        <TaskModal 
          task={editingTask}
          labels={labels}
          onSave={saveTask}
          defaultDate={getDefaultDate()}
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
        />
      )}

      {isLabelManagerOpen && (
        <LabelManager 
          labels={labels}
          onAdd={addLabel}
          onDelete={deleteLabel}
          onClose={() => setIsLabelManagerOpen(false)}
        />
      )}
    </div>
  );
};

interface SidebarItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ active, onClick, icon, label, count }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      active 
        ? 'bg-indigo-50 text-indigo-700' 
        : 'text-slate-600 hover:bg-slate-50'
    }`}
  >
    <span className={`${active ? 'text-indigo-600' : 'text-slate-400'}`}>{icon}</span>
    <span className="flex-grow text-left">{label}</span>
    {count !== undefined && count > 0 && (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${active ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>
        {count}
      </span>
    )}
  </button>
);

export default App;
