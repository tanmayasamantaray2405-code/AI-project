import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, Moon, User, Settings, Shield, Keyboard, LogOut, CheckCircle2, Circle } from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  category: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  dueDate?: string;
  completedAt?: string;
  createdAt?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onToggleTask: (task: any) => void | Promise<void>;
  onCreateTask: (title: string) => void;
  onNavigateAction: (action: 'profile' | 'password' | 'settings' | 'shortcuts' | 'logout') => void;
  onToggleTheme: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  tasks,
  onToggleTask,
  onCreateTask,
  onNavigateAction,
  onToggleTheme,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter commands and tasks
  const isCommandAction = query.startsWith('>');
  const normalizedQuery = query.replace('>', '').trim().toLowerCase();

  const systemActions = [
    { id: 'theme', label: 'Toggle Dark/Light Theme', icon: <Moon className="h-4 w-4 text-violet-500" />, action: () => { onToggleTheme(); onClose(); } },
    { id: 'profile', label: 'Go to Profile Settings', icon: <User className="h-4 w-4 text-indigo-500" />, action: () => { onNavigateAction('profile'); onClose(); } },
    { id: 'password', label: 'Change Account Password', icon: <Shield className="h-4 w-4 text-emerald-500" />, action: () => { onNavigateAction('password'); onClose(); } },
    { id: 'settings', label: 'Configure Preferences', icon: <Settings className="h-4 w-4 text-amber-500" />, action: () => { onNavigateAction('settings'); onClose(); } },
    { id: 'shortcuts', label: 'View Keyboard Shortcuts', icon: <Keyboard className="h-4 w-4 text-cyan-500" />, action: () => { onNavigateAction('shortcuts'); onClose(); } },
    { id: 'logout', label: 'Sign Out of Workspace', icon: <LogOut className="h-4 w-4 text-rose-500" />, action: () => { onNavigateAction('logout'); onClose(); } },
  ];

  const filteredActions = systemActions.filter(act => 
    act.label.toLowerCase().includes(normalizedQuery)
  );

  const filteredTasks = isCommandAction 
    ? [] 
    : tasks.filter(t => t.title.toLowerCase().includes(query.toLowerCase()));

  const showCreateOption = query.trim().length > 0 && !isCommandAction && !tasks.some(t => t.title.toLowerCase() === query.trim().toLowerCase());

  const totalItems = (isCommandAction ? filteredActions.length : (filteredActions.length + filteredTasks.length)) + (showCreateOption ? 1 : 0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeSelectedItem();
    }
  };

  const executeSelectedItem = () => {
    let currentIdx = 0;

    // 1. Check Create Option
    if (showCreateOption) {
      if (selectedIndex === currentIdx) {
        onCreateTask(query.trim());
        onClose();
        return;
      }
      currentIdx++;
    }

    // 2. Check System Actions
    for (const act of filteredActions) {
      if (selectedIndex === currentIdx) {
        act.action();
        return;
      }
      currentIdx++;
    }

    // 3. Check Tasks
    for (const t of filteredTasks) {
      if (selectedIndex === currentIdx) {
        onToggleTask(t);
        onClose();
        return;
      }
      currentIdx++;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 bg-slate-950/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -10 }}
        className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden text-xs font-semibold text-slate-700 dark:text-slate-200"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/10">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a task title or '>' to run workspace commands..."
            className="w-full bg-transparent text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400"
          />
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-[10px] text-slate-400 hover:text-slate-600 transition"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[350px] overflow-y-auto p-2 space-y-0.5">
          {totalItems === 0 && (
            <div className="text-center py-8 text-slate-400 font-medium">
              No matching commands or workspace tasks found.
            </div>
          )}

          {/* Create Option */}
          {showCreateOption && (
            <button
              onClick={() => { onCreateTask(query.trim()); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                selectedIndex === 0
                  ? 'bg-violet-500 text-white'
                  : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-900 dark:text-slate-200'
              }`}
            >
              <Sparkles className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold">Create new task: &quot;{query.trim()}&quot;</p>
                <p className={`text-[10px] ${selectedIndex === 0 ? 'text-violet-200' : 'text-slate-400'}`}>
                  Press Enter to launch this task on your board
                </p>
              </div>
            </button>
          )}

          {/* System Actions */}
          {filteredActions.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-black">
                Workspace Actions
              </div>
              {filteredActions.map((act, index) => {
                const idx = (showCreateOption ? 1 : 0) + index;
                const isSelected = selectedIndex === idx;

                return (
                  <button
                    key={act.id}
                    onClick={act.action}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      isSelected
                        ? 'bg-violet-500 text-white'
                        : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-800 dark:text-slate-250'
                    }`}
                  >
                    <span className={isSelected ? 'text-white' : ''}>{act.icon}</span>
                    <span className="font-bold">{act.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Filtered Tasks */}
          {filteredTasks.length > 0 && (
            <div className="mt-1.5">
              <div className="px-3 py-1.5 text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-black">
                Workspace Tasks
              </div>
              {filteredTasks.map((t, index) => {
                const idx = (showCreateOption ? 1 : 0) + filteredActions.length + index;
                const isSelected = selectedIndex === idx;

                return (
                  <button
                    key={t._id}
                    onClick={() => { onToggleTask(t); onClose(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      isSelected
                        ? 'bg-violet-500 text-white'
                        : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {t.status === 'completed' ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Circle className="h-4.5 w-4.5 text-slate-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold truncate ${t.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                        {t.title}
                      </p>
                      <div className="flex gap-1.5 mt-0.5 text-[9px] font-black uppercase">
                        <span className={isSelected ? 'text-violet-200' : 'text-slate-400'}>{t.category}</span>
                        <span className={isSelected ? 'text-violet-200' : 'text-slate-400'}>•</span>
                        <span className={isSelected ? 'text-violet-200' : 'text-slate-400'}>{t.priority}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
