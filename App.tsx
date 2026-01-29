
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Label, ViewType, TimeRange, Priority } from './types';
import { INITIAL_LABELS, INITIAL_TASKS } from './constants';
import { isToday, isTomorrow, isPast, getLocalDateString } from './utils/dateUtils';
import TaskItem from './components/TaskItem';
import AgendaView from './components/AgendaView';
import NotesView from './components/NotesView';
import TaskModal from './components/TaskModal';
import LabelManager from './components/LabelManager';
import Button from './components/Button';

const App: React.FC = () => {
  // State
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks_v3');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });
  const [labels, setLabels] = useState<Label[]>(() => {
    const saved = localStorage.getItem('labels_v3');
    return saved ? JSON.parse(saved) : INITIAL_LABELS;
  });
  
  const [viewType, setViewType] = useState<ViewType>('list');
  const [activeRange, setActiveRange] = useState<TimeRange>('today');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isLabelManagerOpen, setIsLabelManagerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Persist data robustly
  useEffect(() => {
    localStorage.setItem('tasks_v3', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('labels_v3', JSON.stringify(labels));
  }, [labels]);

  // Filter Logic
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const titleLower = task.title.toLowerCase();
      const descLower = task.description.toLowerCase();
      const queryLower = searchQuery.toLowerCase();
      
      const matchesSearch = titleLower.includes(queryLower) || descLower.includes(queryLower);
      
      if (!matchesSearch) return false;

      if (activeRange === 'all') return true;

      switch (activeRange) {
        case 'today': return isToday(task.dueDate);
        case 'tomorrow': return isTomorrow(task.dueDate);
        case 'past': return isPast(task.dueDate);
        case 'upcoming': return !isPast(task.dueDate) && !isToday(task.dueDate) && !isTomorrow(task.dueDate);
        default: return true;
      }
    });
  }, [tasks, activeRange, searchQuery]);

  const getDefaultDate = () => {
    const d = new Date();
    if (activeRange === 'tomorrow') d.setDate(d.getDate() + 1);
    else if (activeRange === 'past') d.setDate(d.getDate() - 1);
    else if (activeRange === 'upcoming') d.setDate(d.getDate() + 2);
    return getLocalDateString(d);
  };

  const saveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
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

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } as Task : t));
  };

  const toggleTask = (id: string) => updateTask(id, { completed: !tasks.find(t => t.id === id)?.completed });
  const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 md:hidden animate-in fade-in duration-200" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-out md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase italic">TaskPro <span className="text-indigo-600 not-italic">AI</span></h1>
          </div>

          <nav className="space-y-1 flex-grow overflow-y-auto custom-scrollbar pr-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-4">Planejamento</h3>
            
            <SidebarItem 
              active={activeRange === 'past'} 
              onClick={() => { setActiveRange('past'); setViewType('list'); setMobileMenuOpen(false); }} 
              icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" /></svg>}
              label="Dias Passados" 
              count={tasks.filter(t => isPast(t.dueDate)).length}
            />
            
            <SidebarItem 
              active={activeRange === 'today'} 
              onClick={() => { setActiveRange('today'); setViewType('list'); setMobileMenuOpen(false); }} 
              icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg>}
              label="Hoje" 
              count={tasks.filter(t => isToday(t.dueDate)).length}
            />
            
            <SidebarItem 
              active={activeRange === 'tomorrow'} 
              onClick={() => { setActiveRange('tomorrow'); setViewType('list'); setMobileMenuOpen(false); }} 
              icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10h18" /><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><path d="M12 13v6" /><path d="M9 16h6" /></svg>}
              label="Amanhã" 
              count={tasks.filter(t => isTomorrow(t.dueDate)).length}
            />
            
            <SidebarItem 
              active={activeRange === 'upcoming'} 
              onClick={() => { setActiveRange('upcoming'); setViewType('agenda'); setMobileMenuOpen(false); }} 
              icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="m15 14 3 3-3 3" /></svg>}
              label="Próximos Dias" 
              count={tasks.filter(t => !isPast(t.dueDate) && !isToday(t.dueDate) && !isTomorrow(t.dueDate)).length}
            />

            <div className="pt-8 pb-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-4">Conteúdo</h3>
              <SidebarItem 
                active={viewType === 'notes'} 
                onClick={() => { setViewType('notes'); setActiveRange('all'); setMobileMenuOpen(false); }} 
                icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>}
                label="Notas & Detalhes" 
              />
            </div>
          </nav>

          <div className="pt-6 border-t border-slate-100">
            <button 
              onClick={() => setIsLabelManagerOpen(true)}
              className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors w-full px-4 group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </div>
              Etiquetas
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col min-w-0 h-full relative">
        <header className="bg-white border-b border-slate-200 px-4 md:px-10 py-5 md:py-7 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-6 flex-grow">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight hidden lg:block">
              {viewType === 'notes' ? 'Minhas Notas' : (activeRange === 'today' ? 'Hoje' : activeRange === 'tomorrow' ? 'Amanhã' : activeRange === 'past' ? 'Passados' : 'Próximos Dias')}
            </h2>
            <div className="max-w-xs md:max-w-md w-full relative group">
              <span className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar em tudo..."
                className="w-full pl-12 pr-6 py-3 bg-slate-100 border-none rounded-2xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5 ml-4">
            <div className="hidden sm:flex bg-slate-100 p-1.5 rounded-2xl">
              <button 
                onClick={() => setViewType('list')}
                className={`p-2 rounded-xl transition-all ${viewType === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                title="Lista"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <button 
                onClick={() => setViewType('agenda')}
                className={`p-2 rounded-xl transition-all ${viewType === 'agenda' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                title="Agenda"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </button>
            </div>
            <button 
              onClick={() => setIsTaskModalOpen(true)}
              className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              <span className="hidden sm:inline">NOVA TAREFA</span>
            </button>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto p-6 md:p-12 custom-scrollbar bg-[#fcfdfe]">
          {viewType === 'notes' ? (
            <NotesView tasks={filteredTasks} onUpdateTask={updateTask} />
          ) : viewType === 'list' ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
                  <TaskItem key={task.id} task={task} labels={labels} onToggle={toggleTask} onDelete={deleteTask} onEdit={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }} />
                ))
              ) : (
                <EmptyState />
              )}
            </div>
          ) : (
            <AgendaView tasks={filteredTasks} labels={labels} onToggle={toggleTask} onDelete={deleteTask} onEdit={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }} />
          )}
        </div>
      </main>

      {/* Modals */}
      {isTaskModalOpen && (
        <TaskModal task={editingTask} labels={labels} onSave={saveTask} defaultDate={getDefaultDate()} onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }} />
      )}

      {isLabelManagerOpen && (
        <LabelManager labels={labels} onAdd={(n, c) => setLabels([...labels, { id: `l-${Date.now()}`, name: n, color: c }])} onDelete={(id) => setLabels(labels.filter(l => l.id !== id))} onClose={() => setIsLabelManagerOpen(false)} />
      )}
    </div>
  );
};

const SidebarItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count?: number }> = ({ active, onClick, icon, label, count }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${active ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:pl-6'}`}>
    <span className={`${active ? 'text-indigo-600' : 'text-slate-400'} flex-shrink-0`}>{icon}</span>
    <span className="flex-grow text-left tracking-tight whitespace-nowrap">{label}</span>
    {count !== undefined && count > 0 && <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest ${active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{count}</span>}
  </button>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-24 text-slate-300">
    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
      <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
    </div>
    <p className="text-xl font-black text-slate-400 tracking-tight uppercase">Tudo limpo por aqui</p>
    <p className="text-sm font-medium mt-1">Sua mente agradece por uma lista vazia.</p>
  </div>
);

export default App;
