
import React from 'react';
import { Task, Label, Priority } from '../types';
import { formatDate } from '../utils/dateUtils';

interface TaskItemProps {
  task: Task;
  labels: Label[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, labels, onToggle, onDelete, onEdit }) => {
  const taskLabels = labels.filter(l => task.labelIds.includes(l.id));

  const priorityColors = {
    [Priority.LOW]: 'bg-blue-50 text-blue-600',
    [Priority.MEDIUM]: 'bg-amber-50 text-amber-600',
    [Priority.HIGH]: 'bg-red-50 text-red-600',
  };

  return (
    <div className={`group flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all ${task.completed ? 'opacity-60' : ''}`}>
      <button 
        onClick={() => onToggle(task.id)}
        className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          task.completed ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 hover:border-indigo-400'
        }`}
      >
        {task.completed && (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-grow">
        <div className="flex items-center justify-between mb-1">
          <h3 className={`text-sm font-semibold text-slate-800 ${task.completed ? 'line-through decoration-slate-400' : ''}`}>
            {task.title}
          </h3>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(task)} className="p-1 text-slate-400 hover:text-indigo-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button onClick={() => onDelete(task.id)} className="p-1 text-slate-400 hover:text-red-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">
          {task.description || "Sem descrição"}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
          <div className="flex items-center text-[11px] text-slate-400 font-medium">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(task.dueDate)}
          </div>
          <div className="flex gap-1">
            {taskLabels.map(l => (
              <span 
                key={l.id} 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: l.color }}
                title={l.name}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
