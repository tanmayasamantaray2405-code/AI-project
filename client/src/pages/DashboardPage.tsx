import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../utils/api';
import GlassCard from '../components/GlassCard';
import ThemeToggle from '../components/ThemeToggle';
import { 
  Cpu, LogOut, CheckCircle2, Circle, Trash2, Plus, Edit3,
  Sparkles, Flame, Check, TrendingUp, CircleAlert, Search,
  User, Shield, Settings, Sliders, Calendar, Download,
  Bell, History, Award, X, Keyboard, FileText, CheckCircle
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface Task {
  _id: string;
  title: string;
  category: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  avatarColor?: string;
  settings?: {
    theme: string;
  };
}

interface DashboardPageProps {
  user: User;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

interface InsightsData {
  productivityScore: number;
  focusScore: number;
  consistencyScore: number;
  learningScore: number;
  weeklyGrowthScore: number;
  insights: string[];
  predictedWorkingHours: string;
}

export default function DashboardPage({ user: initialUser, onLogout, onNavigate }: DashboardPageProps) {
  const [user, setUser] = useState<User>(initialUser);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Task form inputs
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('coding');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskDifficulty, setTaskDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Search, Filter and Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'dueDate' | 'priority' | 'difficulty'>('newest');

  // AI recommendations & insights
  const [recommendations, setRecommendations] = useState<{
    topCategory: string;
    recommendedTasks: string[];
    explanation: string;
  } | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Modals & Popovers UI states
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'profile' | 'password' | 'settings' | 'shortcuts' | 'edit-task' | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Profile form edits
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Tour / Onboarding
  const [tourStep, setTourStep] = useState<number | null>(null);
  
  // Interactive activity timeline logs (Client state logging)
  const [activityLogs, setActivityLogs] = useState<Array<{ id: string; text: string; time: string }>>([]);

  // Feedback Messages
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [error, setError] = useState('');

  // References
  const searchInputRef = useRef<HTMLInputElement>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial tasks, recommendations and metrics
  const fetchData = async () => {
    try {
      setLoading(true);
      const taskRes = await apiRequest(`/tasks/${user._id}`);
      if (taskRes.success) {
        setTasks(taskRes.data);
      }
      await Promise.all([
        fetchRecommendations(),
        fetchInsights()
      ]);
    } catch (err: any) {
      showNotice('error', err.message || 'Error loading dashboard metadata');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setRecLoading(true);
      const recRes = await apiRequest(`/recommendations/${user._id}`);
      if (recRes.success) {
        setRecommendations(recRes.data);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setRecLoading(false);
    }
  };

  const fetchInsights = async () => {
    try {
      setInsightsLoading(true);
      const insightsRes = await apiRequest(`/recommendations/${user._id}/insights`);
      if (insightsRes.success) {
        setInsights(insightsRes.data);
      }
    } catch (err) {
      console.error('Error fetching productivity insights:', err);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Check if onboarding tour is completed
    const tourCompleted = localStorage.getItem(`tour_completed_${user._id}`);
    if (!tourCompleted) {
      setTourStep(1); // Auto launch tour
    }

    // Load initial activity logs
    setActivityLogs([
      { id: '1', text: 'Workspace session initialized successfully.', time: new Date().toLocaleTimeString() }
    ]);
  }, [user._id]);

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when in text inputs or textareas
      const activeEl = document.activeElement;
      const isInput = activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement || activeEl instanceof HTMLSelectElement;

      if (isInput) {
        if (e.key === 'Escape') {
          activeEl.blur();
        }
        return;
      }

      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        taskInputRef.current?.focus();
        showNotice('success', 'Focusing task creation title');
      } else if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        const docRoot = window.document.documentElement;
        const currentDark = docRoot.classList.contains('dark');
        if (currentDark) {
          docRoot.classList.remove('dark');
          localStorage.setItem('darkMode', 'false');
          showNotice('success', 'Theme set to Light');
        } else {
          docRoot.classList.add('dark');
          localStorage.setItem('darkMode', 'true');
          showNotice('success', 'Theme set to Dark');
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setActiveModal(null);
        setProfileMenuOpen(false);
        setNotificationsOpen(false);
        setTourStep(null);
      } else if (e.key === '?') {
        e.preventDefault();
        setActiveModal('shortcuts');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const addLog = (text: string) => {
    setActivityLogs((prev) => [
      { id: Math.random().toString(), text, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 14) // Cap timeline log at 15 items
    ]);
  };

  // Add Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    try {
      const res = await apiRequest('/tasks', {
        method: 'POST',
        body: {
          title: taskTitle.trim(),
          category: taskCategory,
          priority: taskPriority,
          difficulty: taskDifficulty,
          dueDate: taskDueDate || undefined,
          userId: user._id,
        },
      });

      if (res.success) {
        setTasks([res.data, ...tasks]);
        setTaskTitle('');
        setTaskDueDate('');
        showNotice('success', 'Task added successfully');
        addLog(`Created task: "${res.data.title}" (${res.data.priority} priority)`);
        
        // Refresh recommendation parameters
        fetchRecommendations();
        fetchInsights();
      }
    } catch (err: any) {
      showNotice('error', err.message || 'Error creating task');
    }
  };

  // Toggle complete / incomplete
  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const res = await apiRequest(`/tasks/${task._id}`, {
        method: 'PUT',
        body: { status: nextStatus },
      });

      if (res.success) {
        setTasks(tasks.map((t) => (t._id === task._id ? res.data : t)));
        showNotice('success', nextStatus === 'completed' ? 'Task completed! Keep it up!' : 'Task set to pending');
        addLog(`${nextStatus === 'completed' ? 'Completed' : 'Reopened'} task: "${task.title}"`);
        
        // Update charts & insights
        fetchRecommendations();
        fetchInsights();
      }
    } catch (err: any) {
      showNotice('error', err.message || 'Error updating task');
    }
  };

  // Edit Task
  const handleUpdateTaskDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) return;

    try {
      const res = await apiRequest(`/tasks/${editingTask._id}`, {
        method: 'PUT',
        body: {
          title: editingTask.title,
          category: editingTask.category,
          priority: editingTask.priority,
          difficulty: editingTask.difficulty,
          dueDate: editingTask.dueDate || undefined,
        },
      });

      if (res.success) {
        setTasks(tasks.map((t) => (t._id === editingTask._id ? res.data : t)));
        setActiveModal(null);
        showNotice('success', 'Task details updated');
        addLog(`Updated details of task: "${res.data.title}"`);
        
        fetchRecommendations();
        fetchInsights();
      }
    } catch (err: any) {
      showNotice('error', err.message || 'Error updating task details');
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: string) => {
    const taskToDelete = tasks.find((t) => t._id === id);
    try {
      const res = await apiRequest(`/tasks/${id}`, {
        method: 'DELETE',
      });

      if (res.success) {
        setTasks(tasks.filter((t) => t._id !== id));
        showNotice('success', 'Task deleted');
        if (taskToDelete) addLog(`Deleted task: "${taskToDelete.title}"`);
        
        fetchRecommendations();
        fetchInsights();
      }
    } catch (err: any) {
      showNotice('error', err.message || 'Error deleting task');
    }
  };

  // Adopt AI suggestion
  const handleAddRecommendedTask = async (title: string) => {
    try {
      const res = await apiRequest('/tasks', {
        method: 'POST',
        body: {
          title,
          category: recommendations?.topCategory || 'coding',
          priority: 'medium',
          difficulty: 'beginner',
          userId: user._id,
        },
      });

      if (res.success) {
        setTasks([res.data, ...tasks]);
        showNotice('success', `Adopted AI recommendation`);
        addLog(`Adopted AI suggestion: "${title}"`);
        fetchRecommendations();
        fetchInsights();
      }
    } catch (err: any) {
      showNotice('error', err.message || 'Error adding task');
    }
  };

  // Profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await apiRequest('/users/profile', {
        method: 'PUT',
        body: {
          name: editName,
          email: editEmail,
        },
      });

      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        showNotice('success', 'Profile updated successfully');
        addLog(`Updated profile details (Name: ${editName}, Email: ${editEmail})`);
        setActiveModal(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      showNotice('error', err.message || 'Profile update failed');
    }
  };

  // Password update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await apiRequest('/users/profile', {
        method: 'PUT',
        body: {
          currentPassword,
          newPassword,
        },
      });

      if (response.success) {
        showNotice('success', 'Password changed successfully');
        addLog('Password changed securely.');
        setActiveModal(null);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    }
  };

  // Settings / Theme Update
  const handleSaveThemeSettings = async (themeMode: string) => {
    try {
      const response = await apiRequest('/users/settings', {
        method: 'PUT',
        body: { theme: themeMode },
      });

      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        
        // Apply class to HTML tag
        const docRoot = window.document.documentElement;
        if (themeMode === 'dark') {
          docRoot.classList.add('dark');
          localStorage.setItem('darkMode', 'true');
        } else {
          docRoot.classList.remove('dark');
          localStorage.setItem('darkMode', 'false');
        }

        showNotice('success', `Theme updated to ${themeMode}`);
        addLog(`Updated theme configuration to: ${themeMode}`);
      }
    } catch (err: any) {
      showNotice('error', 'Failed to update settings');
    }
  };

  // General CSV download helper
  const handleExportCSV = () => {
    try {
      if (tasks.length === 0) {
        showNotice('error', 'No tasks available to export');
        return;
      }

      const headers = ['Task ID', 'Title', 'Category', 'Status', 'Priority', 'Difficulty', 'Due Date', 'Created At', 'Completed At'];
      const rows = tasks.map((t) => [
        t._id,
        `"${t.title.replace(/"/g, '""')}"`,
        t.category,
        t.status,
        t.priority,
        t.difficulty,
        t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A',
        new Date(t.createdAt).toLocaleString(),
        t.completedAt ? new Date(t.completedAt).toLocaleString() : 'N/A'
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `smartflow_task_report_${user.name.replace(/\s+/g, '_').toLowerCase()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotice('success', 'Task spreadsheet report downloaded');
      addLog('Exported sprint task board to CSV.');
    } catch (error) {
      showNotice('error', 'Failed to generate CSV export');
    }
  };

  // Print vector PDF trigger
  const handleExportPDF = () => {
    addLog('Triggered PDF report print dialogue.');
    window.print();
  };

  // Onboarding Skip
  const handleFinishTour = () => {
    localStorage.setItem(`tour_completed_${user._id}`, 'true');
    setTourStep(null);
    showNotice('success', 'Onboarding walkthrough complete!');
  };

  // Dynamic calculations for completed stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Streak Calculation
  const calculateStreak = (): number => {
    if (completedTasks === 0) return 0;
    const dates = tasks
      .filter((t) => t.status === 'completed' && t.completedAt)
      .map((t) => new Date(t.completedAt!).toLocaleDateString())
      .reduce((acc: string[], d) => {
        if (!acc.includes(d)) acc.push(d);
        return acc;
      }, []);

    if (dates.length === 0) return 0;
    
    // Sort descending
    const sorted = dates.map((d) => new Date(d)).sort((a, b) => b.getTime() - a.getTime());
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0,0,0,0);

    const latest = sorted[0];
    latest.setHours(0,0,0,0);

    if (latest.getTime() !== today.getTime() && latest.getTime() !== yesterday.getTime()) {
      return 0;
    }

    let streak = 1;
    let checkDate = latest;
    
    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      next.setHours(0,0,0,0);
      const diff = checkDate.getTime() - next.getTime();
      const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        streak++;
        checkDate = next;
      } else if (diffDays > 1) {
        break;
      }
    }
    return streak;
  };
  const streakCount = calculateStreak();

  // Badge Unlocks logic
  const badges = [
    { id: '1', title: 'Sprint Beginner', desc: 'Add your first task to the board', unlocked: totalTasks > 0, icon: '🚀' },
    { id: '2', title: 'Streak Starter', desc: 'Maintain a 2-day activity streak', unlocked: streakCount >= 2, icon: '🔥' },
    { id: '3', title: 'Night Owl', desc: 'Complete tasks after 9 PM', unlocked: tasks.some((t) => t.status === 'completed' && t.completedAt && (new Date(t.completedAt).getHours() >= 21 || new Date(t.completedAt).getHours() < 6)), icon: '🦉' },
    { id: '4', title: 'Focus Wizard', desc: 'Complete 3 tasks in one category', unlocked: Object.values(tasks.filter((t)=>t.status==='completed').reduce((acc: Record<string, number>, t)=>{ acc[t.category] = (acc[t.category] || 0) + 1; return acc; }, {})).some(count => count >= 3), icon: '🧙‍♂️' },
    { id: '5', title: 'Velocity Master', desc: 'Complete 10 tasks total in workspace', unlocked: completedTasks >= 10, icon: '⚡' },
  ];

  // Filtering and Sorting operations
  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchesDifficulty = filterDifficulty === 'all' || task.difficulty === filterDifficulty;
      return matchesSearch && matchesStatus && matchesCategory && matchesPriority && matchesDifficulty;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'priority') {
        const pWeight = { high: 3, medium: 2, low: 1 };
        return pWeight[b.priority] - pWeight[a.priority];
      }
      if (sortBy === 'difficulty') {
        const dWeight = { advanced: 3, intermediate: 2, beginner: 1 };
        return dWeight[b.difficulty] - dWeight[a.difficulty];
      }
      return 0;
    });

  // Category visual tokens
  const categoryColors: Record<string, string> = {
    coding: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25',
    design: 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/25',
    study: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25',
    fitness: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
    business: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
    health: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25',
    other: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25',
  };

  const priorityColors = {
    high: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20',
    medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
    low: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20',
  };

  const difficultyColors = {
    advanced: 'bg-purple-600/15 text-purple-600 dark:text-purple-400 border-purple-600/20',
    intermediate: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20',
    beginner: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  };

  // Chart data setup
  const categoryCounts = tasks.reduce((acc: Record<string, number>, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  const doughnutData = {
    labels: Object.keys(categoryCounts).map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)),
    datasets: [
      {
        data: Object.values(categoryCounts),
        backgroundColor: [
          'rgba(99, 102, 241, 0.65)',   // Indigo (coding)
          'rgba(236, 72, 153, 0.65)',   // Pink (design)
          'rgba(139, 92, 246, 0.65)',   // Violet (study)
          'rgba(16, 185, 129, 0.65)',   // Emerald (fitness)
          'rgba(245, 158, 11, 0.65)',   // Amber (business)
          'rgba(6, 182, 212, 0.65)',    // Cyan (health)
          'rgba(100, 116, 139, 0.65)',  // Slate (other)
        ],
        borderColor: [
          'rgba(99, 102, 241, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(6, 182, 212, 1)',
          'rgba(100, 116, 139, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const barData = {
    labels: ['Completed', 'Pending'],
    datasets: [
      {
        data: [completedTasks, pendingTasks],
        backgroundColor: ['rgba(16, 185, 129, 0.65)', 'rgba(244, 63, 94, 0.65)'],
        borderColor: ['rgba(16, 185, 129, 1)', 'rgba(244, 63, 94, 1)'],
        borderWidth: 1,
      },
    ],
  };

  // Monogram Avatar Gradient
  const userInitials = (user.name || 'U').charAt(0).toUpperCase();
  const avatarGradient = user.avatarColor || 'from-violet-600 to-indigo-650';

  // Heatmap helper calculations
  // Renders a grid of 16 weeks (columns) x 7 days (rows)
  const renderHeatmap = () => {
    const totalCells = 16 * 7;
    const cells = [];
    const now = new Date();

    // Map completed dates
    const completedDatesMap: Record<string, number> = {};
    tasks.forEach((t) => {
      if (t.status === 'completed' && t.completedAt) {
        const key = new Date(t.completedAt).toDateString();
        completedDatesMap[key] = (completedDatesMap[key] || 0) + 1;
      }
    });

    for (let i = totalCells - 1; i >= 0; i--) {
      const cellDate = new Date();
      cellDate.setDate(now.getDate() - i);
      const keyStr = cellDate.toDateString();
      const count = completedDatesMap[keyStr] || 0;

      // Determine level colors
      let colorClass = 'bg-slate-200 dark:bg-slate-800/80';
      if (count === 1) colorClass = 'bg-violet-350 dark:bg-violet-850';
      else if (count === 2) colorClass = 'bg-violet-400 dark:bg-violet-700';
      else if (count === 3) colorClass = 'bg-violet-600 dark:bg-violet-500';
      else if (count >= 4) colorClass = 'bg-violet-800 dark:bg-violet-300';

      cells.push(
        <div 
          key={i} 
          className={`h-3 w-3 rounded-[3px] transition-all hover:scale-125 cursor-help ${colorClass}`}
          title={`${cellDate.toLocaleDateString()}: ${count} task${count !== 1 ? 's' : ''} completed`}
        />
      );
    }
    return cells;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 font-sans text-slate-800 dark:text-slate-100 pb-16 relative">
      
      {/* Dynamic gradients decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/5 dark:bg-violet-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-600/5 dark:bg-cyan-600/10 blur-[150px] pointer-events-none" />

      {/* HEADER SECTION */}
      <header className="sticky top-0 z-45 w-full bg-white/50 dark:bg-slate-950/50 border-b border-white/20 dark:border-white/5 backdrop-blur-md print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <Cpu className="h-4.5 w-4.5" />
            </div>
            <span className="font-display font-extrabold text-lg tracking-tight">
              Smart<span className="text-violet-600 dark:text-violet-400">Flow</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            
            {/* Shortcuts Guide Help */}
            <button
              onClick={() => setActiveModal('shortcuts')}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition cursor-pointer"
              title="Keyboard Shortcuts Guide (?)"
            >
              <Keyboard className="h-5 w-5" />
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition cursor-pointer"
                title="Workspace Updates"
              >
                <Bell className="h-5 w-5" />
                {streakCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl p-4 z-50 text-xs"
                  >
                    <div className="flex justify-between items-center pb-3 border-b border-slate-150 dark:border-white/5 mb-3">
                      <span className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Alert Center</span>
                      <button onClick={() => setNotificationsOpen(false)} className="text-slate-400 hover:text-slate-650"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="space-y-3">
                      <div className="p-2 rounded-xl bg-violet-500/5 border border-violet-500/10">
                        <p className="font-bold text-slate-800 dark:text-slate-200">System Connected</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">You are running on a local SaaS-grade framework.</p>
                      </div>
                      {streakCount > 0 && (
                        <div className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-2">
                          <Flame className="h-4 w-4 text-amber-500 mt-0.5" />
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">Active Streak! ({streakCount} days)</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Keep completing tasks daily to lock in achievements.</p>
                          </div>
                        </div>
                      )}
                      <div className="p-2 rounded-xl bg-slate-500/5 border border-slate-200/10">
                        <p className="font-bold text-slate-800 dark:text-slate-200">Keyboard Shortcuts active</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Press <span className="font-bold">?</span> anywhere to open quick mapping controls.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ThemeToggle />

            {/* Profile Avatar Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                id="avatar-menu-trigger"
                className={`h-9 w-9 rounded-full bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-white font-black text-sm shadow cursor-pointer border border-white/30 hover:brightness-105 active:scale-95 transition-all`}
              >
                {userInitials}
              </button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-56 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl p-2 z-50 text-sm font-semibold"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1.5 flex flex-col">
                      <span className="text-xs text-slate-450 dark:text-slate-500 font-medium">Logged in as</span>
                      <span className="font-extrabold text-slate-900 dark:text-white truncate">{user.name}</span>
                    </div>

                    <button
                      onClick={() => { setProfileMenuOpen(false); setActiveModal('profile'); }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-350 flex items-center gap-2 transition cursor-pointer"
                    >
                      <User className="h-4 w-4 text-slate-400" />
                      My Profile
                    </button>

                    <button
                      onClick={() => { setProfileMenuOpen(false); setActiveModal('password'); }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-350 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Shield className="h-4 w-4 text-slate-400" />
                      Change Password
                    </button>

                    <button
                      onClick={() => { setProfileMenuOpen(false); setActiveModal('settings'); }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-350 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Settings className="h-4 w-4 text-slate-400" />
                      Account Settings
                    </button>

                    <div className="border-t border-slate-100 dark:border-white/5 my-1" />

                    <button
                      onClick={() => { setProfileMenuOpen(false); onLogout(); }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </header>

      {/* TOAST SYSTEM */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-bounce print:hidden">
          <div className={`px-4 py-3 rounded-xl border shadow-xl flex items-center gap-2 text-xs font-bold ${
            notification.type === 'success' 
              ? 'border-emerald-500/25 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
              : 'border-red-500/25 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
          }`}>
            {notification.type === 'success' ? <Check className="h-4.5 w-4.5" /> : <CircleAlert className="h-4.5 w-4.5" />}
            {notification.text}
          </div>
        </div>
      )}

      {/* MAIN SPRINT INTERFACE */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        
        {/* PDF REPORT CONTAINER (Hidden in screen browser mode, visible on window print) */}
        <div className="hidden print:block space-y-6 p-4">
          <div className="flex items-center justify-between pb-6 border-b">
            <div>
              <h1 className="text-3xl font-extrabold font-display text-slate-900">SmartFlow Productivity Report</h1>
              <p className="text-xs text-slate-500">Analytics export for user: {user.name} ({user.email})</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold">Generated Date</p>
              <p className="text-xs text-slate-500">{new Date().toLocaleString()}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 border rounded-xl">
              <p className="text-xs font-semibold text-slate-405">Total Tasks</p>
              <p className="text-2xl font-black">{totalTasks}</p>
            </div>
            <div className="p-4 border rounded-xl">
              <p className="text-xs font-semibold text-slate-405">Completions</p>
              <p className="text-2xl font-black text-emerald-650">{completedTasks}</p>
            </div>
            <div className="p-4 border rounded-xl">
              <p className="text-xs font-semibold text-slate-405">Completion Rate</p>
              <p className="text-2xl font-black">{completionRate}%</p>
            </div>
            <div className="p-4 border rounded-xl">
              <p className="text-xs font-semibold text-slate-405">Current Streak</p>
              <p className="text-2xl font-black">{streakCount} days</p>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold mb-3">Tasks Breakdown</h2>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Task Title</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Priority</th>
                  <th className="py-2">Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t._id} className="border-b">
                    <td className="py-2 font-medium">{t.title}</td>
                    <td className="py-2 uppercase">{t.category}</td>
                    <td className="py-2 capitalize">{t.status}</td>
                    <td className="py-2 capitalize">{t.priority}</td>
                    <td className="py-2 capitalize">{t.difficulty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BROWSER DASHBOARD RENDER */}
        <div className="print:hidden space-y-6">

          {/* AI INSIGHTS BAR DIALS PANEL */}
          <div id="tour-step-insights" className="relative">
            <GlassCard className="p-6 border border-violet-500/20 bg-gradient-to-r from-violet-600/5 to-cyan-500/5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5.5 w-5.5 text-violet-500" />
                    <h2 className="font-display text-xl font-extrabold text-slate-900 dark:text-white">Heuristic AI Productivity Insights</h2>
                  </div>
                  <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">Adaptive performance telemetry based on task priority weights & difficulty levels.</p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={fetchInsights}
                    disabled={insightsLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition cursor-pointer"
                  >
                    {insightsLoading ? 'Recalculating...' : 'Re-Score metrics'}
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-350 cursor-pointer"
                      title="Export Spreadsheet CSV"
                    >
                      <Download className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-350 cursor-pointer"
                      title="Print Productivity Report (PDF)"
                    >
                      <FileText className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Metric Dials */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                
                <div className="p-4 rounded-2xl border border-white/40 dark:border-white/5 bg-white/20 dark:bg-black/10 text-center">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block mb-2">Productivity</span>
                  <div className="text-3xl font-black font-display text-violet-600 dark:text-violet-400">
                    {insightsLoading ? '...' : `${insights?.productivityScore || 75}%`}
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-violet-500 h-full transition-all duration-1000" style={{ width: `${insights?.productivityScore || 75}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-white/40 dark:border-white/5 bg-white/20 dark:bg-black/10 text-center">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block mb-2">Focus Score</span>
                  <div className="text-3xl font-black font-display text-cyan-600 dark:text-cyan-400">
                    {insightsLoading ? '...' : `${insights?.focusScore || 68}%`}
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-cyan-500 h-full transition-all duration-1000" style={{ width: `${insights?.focusScore || 68}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-white/40 dark:border-white/5 bg-white/20 dark:bg-black/10 text-center">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block mb-2">Consistency</span>
                  <div className="text-3xl font-black font-display text-emerald-600 dark:text-emerald-400">
                    {insightsLoading ? '...' : `${insights?.consistencyScore || 80}%`}
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${insights?.consistencyScore || 80}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-white/40 dark:border-white/5 bg-white/20 dark:bg-black/10 text-center">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block mb-2">Learning Score</span>
                  <div className="text-3xl font-black font-display text-amber-600 dark:text-amber-400">
                    {insightsLoading ? '...' : `${insights?.learningScore || 60}%`}
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-amber-500 h-full transition-all duration-1000" style={{ width: `${insights?.learningScore || 60}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-white/40 dark:border-white/5 bg-white/20 dark:bg-black/10 text-center col-span-2 md:col-span-1">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block mb-2">Growth Score</span>
                  <div className="text-3xl font-black font-display text-pink-600 dark:text-pink-400">
                    {insightsLoading ? '...' : `${insights?.weeklyGrowthScore || 72}%`}
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-pink-500 h-full transition-all duration-1000" style={{ width: `${insights?.weeklyGrowthScore || 72}%` }} />
                  </div>
                </div>

              </div>

              {/* Dynamic generated Insight text items */}
              {insights && insights.insights.length > 0 && (
                <div className="mt-6 pt-5 border-t border-slate-200/50 dark:border-white/5">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2.5">Dynamic Observations:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {insights.insights.map((insText, index) => (
                      <div key={index} className="flex items-start gap-2 text-slate-650 dark:text-slate-350">
                        <CheckCircle className="h-4 w-4 text-violet-500 mt-0.5 flex-shrink-0" />
                        <span className="font-semibold">{insText}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* AI RECOMMENDATION BOX */}
          <div id="tour-step-recommendations">
            <GlassCard className="p-6 border border-violet-500/25 bg-gradient-to-r from-violet-600/5 to-cyan-500/5 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10 text-violet-500 pointer-events-none">
                <Sparkles className="h-32 w-32" />
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-500" />
                  <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white">Next-Level Task Recommendations</h3>
                </div>
                <button
                  onClick={fetchRecommendations}
                  disabled={recLoading}
                  className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition cursor-pointer"
                >
                  {recLoading ? 'Recalculating...' : 'Recalculate Pool'}
                </button>
              </div>

              {recommendations ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                    {recommendations.explanation}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recommendations.recommendedTasks.map((titleStr, index) => (
                      <div 
                        key={index}
                        className="p-4 rounded-xl border border-white/30 dark:border-white/5 bg-white/30 dark:bg-black/20 hover:border-violet-500/30 dark:hover:bg-black/30 transition flex flex-col justify-between items-start gap-4 group"
                      >
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/15">
                            {recommendations.topCategory}
                          </span>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2">{titleStr}</h4>
                        </div>
                        <button
                          onClick={() => handleAddRecommendedTask(titleStr)}
                          className="text-[10px] font-extrabold text-violet-600 dark:text-violet-400 hover:text-violet-750 flex items-center gap-1 group-hover:translate-x-0.5 transition-all cursor-pointer"
                        >
                          Adopt Task
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No task recommendations available. Complete tasks to initiate heuristical updates.</p>
              )}
            </GlassCard>
          </div>

          {/* KPI STATS ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <GlassCard className="p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Board Sprint Items</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black">{totalTasks}</span>
                <span className="text-[10px] text-slate-400">total active</span>
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Completions</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-emerald-650 dark:text-emerald-450">{completedTasks}</span>
                <span className="text-[10px] text-slate-400">/{totalTasks} completed</span>
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Sprint Velocity</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black">{completionRate}%</span>
                <TrendingUp className="h-4 w-4 text-violet-500 inline ml-1" />
              </div>
            </GlassCard>

            <GlassCard className="p-4 flex items-center justify-between relative overflow-hidden group">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Sprint Streak</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black">{streakCount}</span>
                  <span className="text-[10px] text-slate-400">days active</span>
                </div>
              </div>
              <Flame className={`h-8 w-8 transition-all duration-300 group-hover:scale-110 ${streakCount > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-350 dark:text-slate-700'}`} />
            </GlassCard>

          </div>

          {/* DASHBOARD COLUMNS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: CREATION & ANALYTICS CHARTS (5 COLS) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Task Creation form */}
              <div id="tour-step-create-task">
                <GlassCard className="p-6">
                  <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white mb-4">Launch New Task</h3>
                  <form onSubmit={handleAddTask} className="space-y-4 text-xs">
                    
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 uppercase tracking-wider">Task Title</label>
                      <input
                        ref={taskInputRef}
                        type="text"
                        required
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        placeholder="E.g., Design database schema..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/10 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-violet-500 transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 uppercase tracking-wider">Category</label>
                        <select
                          value={taskCategory}
                          onChange={(e) => setTaskCategory(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/10 outline-none cursor-pointer focus:border-violet-505"
                        >
                          <option value="coding" className="dark:bg-slate-900">Coding</option>
                          <option value="design" className="dark:bg-slate-900">Design</option>
                          <option value="study" className="dark:bg-slate-900">Study</option>
                          <option value="fitness" className="dark:bg-slate-900">Fitness</option>
                          <option value="business" className="dark:bg-slate-900">Business</option>
                          <option value="health" className="dark:bg-slate-900">Health</option>
                          <option value="other" className="dark:bg-slate-900">Other</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 uppercase tracking-wider">Priority</label>
                        <select
                          value={taskPriority}
                          onChange={(e) => setTaskPriority(e.target.value as any)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/10 outline-none cursor-pointer focus:border-violet-505"
                        >
                          <option value="high" className="dark:bg-slate-900 text-rose-600 font-bold">High</option>
                          <option value="medium" className="dark:bg-slate-900 text-amber-600 font-bold">Medium</option>
                          <option value="low" className="dark:bg-slate-900 text-slate-500 font-bold">Low</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 uppercase tracking-wider">Difficulty</label>
                        <select
                          value={taskDifficulty}
                          onChange={(e) => setTaskDifficulty(e.target.value as any)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/10 outline-none cursor-pointer focus:border-violet-505"
                        >
                          <option value="beginner" className="dark:bg-slate-900">Beginner</option>
                          <option value="intermediate" className="dark:bg-slate-900">Intermediate</option>
                          <option value="advanced" className="dark:bg-slate-900">Advanced</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 uppercase tracking-wider">Due Date</label>
                        <div className="relative">
                          <input
                            type="date"
                            value={taskDueDate}
                            onChange={(e) => setTaskDueDate(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/10 outline-none cursor-pointer focus:border-violet-505"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:brightness-105 transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                    >
                      <Plus className="h-4 w-4" />
                      Create Workspace Task
                    </button>

                  </form>
                </GlassCard>
              </div>

              {/* Chart distributions */}
              {totalTasks > 0 && (
                <GlassCard className="p-6 space-y-6">
                  <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white">Workspace Analytics</h3>
                  
                  <div className="space-y-4">
                    {/* Category dough */}
                    <div className="p-4 rounded-xl border border-white/30 dark:border-white/5 bg-white/10 dark:bg-black/10">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">Category Distribution</h4>
                      <div className="h-44 flex justify-center">
                        <Doughnut
                          data={doughnutData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'bottom',
                                labels: { boxWidth: 6, font: { size: 9 }, color: 'currentColor' }
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Status ratios bar */}
                    <div className="p-4 rounded-xl border border-white/30 dark:border-white/5 bg-white/10 dark:bg-black/10">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">Completion Ratio</h4>
                      <div className="h-32 flex justify-center">
                        <Bar
                          data={barData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: { y: { ticks: { precision: 0 } } }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* Achievements Badges */}
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-amber-500" />
                  <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white">Unlocked Achievements</h3>
                </div>
                <div className="space-y-3">
                  {badges.map((badge) => (
                    <div 
                      key={badge.id}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition ${
                        badge.unlocked 
                          ? 'border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10' 
                          : 'border-slate-200 dark:border-white/5 bg-slate-100/30 dark:bg-white/5 opacity-40'
                      }`}
                    >
                      <span className="text-2xl flex-shrink-0">{badge.icon}</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{badge.title}</h4>
                        <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5">{badge.desc}</p>
                      </div>
                      {badge.unlocked && (
                        <CheckCircle className="h-4.5 w-4.5 text-amber-500 ml-auto flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </GlassCard>

            </div>

            {/* RIGHT COLUMN: TASK BOARD LISTINGS & TIMELINE (7 COLS) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Contribution Heatmap */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4.5 w-4.5 text-violet-500" />
                    <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white">Workspace Heatmap</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">Past 16 Weeks</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  {/* Heatmap Grid */}
                  <div className="flex flex-wrap gap-[3px] justify-center max-w-full p-2 bg-slate-100/50 dark:bg-black/10 rounded-xl border border-slate-200/50 dark:border-white/5">
                    {renderHeatmap()}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 self-end mt-1 font-bold">
                    <span>Less</span>
                    <div className="h-2.5 w-2.5 rounded-[2px] bg-slate-200 dark:bg-slate-800" />
                    <div className="h-2.5 w-2.5 rounded-[2px] bg-violet-350 dark:bg-violet-850" />
                    <div className="h-2.5 w-2.5 rounded-[2px] bg-violet-400 dark:bg-violet-700" />
                    <div className="h-2.5 w-2.5 rounded-[2px] bg-violet-600 dark:bg-violet-500" />
                    <div className="h-2.5 w-2.5 rounded-[2px] bg-violet-800 dark:bg-violet-350" />
                    <span>More</span>
                  </div>
                </div>
              </GlassCard>

              {/* Task Board Sprint Board Filter Cards */}
              <div id="tour-step-task-board">
                <GlassCard className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white">Task Sprint Board</h3>
                    
                    {/* Search Title */}
                    <div className="relative w-full sm:w-64">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-405">
                        <Search className="h-4 w-4" />
                      </div>
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search title... (Press /)"
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/10 text-slate-950 dark:text-white outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>

                  {/* Filters list row */}
                  <div className="flex flex-wrap gap-4 pt-3 border-t border-slate-200/50 dark:border-white/5 items-center justify-between text-xs">
                    
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/50 dark:bg-white/5 border border-slate-200/10">
                      {(['all', 'pending', 'completed'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(status)}
                          className={`px-3 py-1.5 rounded-lg font-bold capitalize transition cursor-pointer ${
                            filterStatus === status 
                              ? 'bg-white dark:bg-slate-900 text-violet-650 dark:text-violet-400 shadow-sm' 
                              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>

                    {/* Additional Select Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Sort Dropdown */}
                      <div className="flex items-center gap-1.5">
                        <Sliders className="h-3.5 w-3.5 text-slate-400" />
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/10 outline-none cursor-pointer text-[11px] font-semibold"
                        >
                          <option value="newest">Sort: Newest</option>
                          <option value="dueDate">Sort: Due Date</option>
                          <option value="priority">Sort: Priority</option>
                          <option value="difficulty">Sort: Difficulty</option>
                        </select>
                      </div>

                      {/* Category select filter */}
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/10 outline-none cursor-pointer text-[11px] font-semibold"
                      >
                        <option value="all">All Categories</option>
                        <option value="coding">Coding</option>
                        <option value="design">Design</option>
                        <option value="study">Study</option>
                        <option value="fitness">Fitness</option>
                        <option value="business">Business</option>
                        <option value="health">Health</option>
                        <option value="other">Other</option>
                      </select>

                      {/* Priority select filter */}
                      <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/10 outline-none cursor-pointer text-[11px] font-semibold"
                      >
                        <option value="all">All Priorities</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>

                      {/* Difficulty select filter */}
                      <select
                        value={filterDifficulty}
                        onChange={(e) => setFilterDifficulty(e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/10 outline-none cursor-pointer text-[11px] font-semibold"
                      >
                        <option value="all">All Difficulties</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                  </div>
                </GlassCard>
              </div>

              {/* Task Cards List */}
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-12 text-sm text-slate-400">Syncing sprint boards...</div>
                ) : filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <GlassCard 
                      key={task._id} 
                      className={`p-4 border transition duration-300 ${
                        task.status === 'completed' 
                          ? 'border-emerald-500/10 dark:border-emerald-500/5 bg-emerald-500/5 dark:bg-emerald-950/5 opacity-80' 
                          : 'border-white/20 dark:border-white/5 hover:border-violet-500/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          
                          <button
                            onClick={() => handleToggleTask(task)}
                            className={`flex-shrink-0 cursor-pointer transition ${
                              task.status === 'completed' 
                                ? 'text-emerald-500 dark:text-emerald-450' 
                                : 'text-slate-400 hover:text-slate-650 dark:hover:text-slate-200'
                            }`}
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle2 className="h-5.5 w-5.5" />
                            ) : (
                              <Circle className="h-5.5 w-5.5" />
                            )}
                          </button>
                          
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-semibold truncate ${
                              task.status === 'completed' ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'
                            }`}>
                              {task.title}
                            </p>
                            
                            {/* Badges and metadata */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[9px] font-black uppercase">
                              <span className={`px-2 py-0.5 rounded border ${
                                categoryColors[task.category] || categoryColors.other
                              }`}>
                                {task.category}
                              </span>

                              <span className={`px-2 py-0.5 rounded border ${priorityColors[task.priority]}`}>
                                {task.priority}
                              </span>

                              <span className={`px-2 py-0.5 rounded border ${difficultyColors[task.difficulty]}`}>
                                {task.difficulty}
                              </span>

                              {task.dueDate && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium lowercase flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  due {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>

                          </div>
                        </div>

                        {/* Edit and delete operations */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => {
                              setEditingTask({ ...task });
                              setActiveModal('edit-task');
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-450 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
                            title="Edit Task Details"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="p-1.5 rounded-lg border border-red-500/10 hover:border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                      </div>
                    </GlassCard>
                  ))
                ) : (
                  <div className="text-center py-12 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                    <p className="text-xs text-slate-400 font-bold">No tasks found matching board filters.</p>
                  </div>
                )}
              </div>

              {/* Dynamic activity timeline log */}
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History className="h-4.5 w-4.5 text-slate-450" />
                  <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white">Activity Log Timeline</h3>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex justify-between items-start gap-4 text-xs font-semibold">
                      <p className="text-slate-600 dark:text-slate-400">{log.text}</p>
                      <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">{log.time}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>

            </div>

          </div>

        </div>

      </main>

      {/* OVERLAY MODALS */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm print:hidden">
            
            {/* Backdrop close */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 cursor-pointer"
              onClick={() => setActiveModal(null)}
            />

            {/* Modal Body Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-2xl relative z-10 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              
              {/* Close Button */}
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              {/* PROFILE EDIT MODAL */}
              {activeModal === 'profile' && (
                <div className="space-y-4">
                  <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">Update Profile Details</h3>
                  
                  {error && (
                    <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-650 dark:text-red-450 font-bold">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 uppercase tracking-wider">Name</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-black/20 outline-none text-slate-900 dark:text-white focus:border-violet-505"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                      <input
                        type="email"
                        required
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-black/20 outline-none text-slate-900 dark:text-white focus:border-violet-505"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-violet-605 text-white font-bold bg-violet-600 hover:bg-violet-750 transition cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </form>
                </div>
              )}

              {/* CHANGE PASSWORD MODAL */}
              {activeModal === 'password' && (
                <div className="space-y-4">
                  <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">Update Password Credentials</h3>
                  
                  {error && (
                    <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-650 dark:text-red-450 font-bold">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-black/20 outline-none text-slate-900 dark:text-white focus:border-violet-505"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-black/20 outline-none text-slate-900 dark:text-white focus:border-violet-505"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-black/20 outline-none text-slate-900 dark:text-white focus:border-violet-505"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-violet-650 text-white font-bold bg-violet-600 hover:bg-violet-750 transition cursor-pointer"
                    >
                      Save Password
                    </button>
                  </form>
                </div>
              )}

              {/* ACCOUNT SETTINGS MODAL */}
              {activeModal === 'settings' && (
                <div className="space-y-4">
                  <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">Workspace Configuration</h3>
                  
                  <div className="space-y-3.5 pt-2">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                      <div>
                        <p className="font-bold">Dark Theme Swapper</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Toggle global appearance settings.</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSaveThemeSettings('light')}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                            !window.document.documentElement.classList.contains('dark')
                              ? 'bg-violet-500/10 text-violet-600 border-violet-550'
                              : 'border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'
                          }`}
                        >
                          Light
                        </button>
                        <button
                          onClick={() => handleSaveThemeSettings('dark')}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                            window.document.documentElement.classList.contains('dark')
                              ? 'bg-violet-500/10 text-violet-400 border-violet-550'
                              : 'border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'
                          }`}
                        >
                          Dark
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                      <div>
                        <p className="font-bold">SaaS Onboarding Tour</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Reset workspace walk guides.</p>
                      </div>
                      <button
                        onClick={() => {
                          localStorage.removeItem(`tour_completed_${user._id}`);
                          setActiveModal(null);
                          setTourStep(1);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold cursor-pointer"
                      >
                        Reset Guide
                      </button>
                    </div>

                    <div className="pt-2 text-center text-[10px] text-slate-400 font-medium">
                      SmartFlow Framework Version 2.1.0-SaaS
                    </div>
                  </div>
                </div>
              )}

              {/* KEYBOARD SHORTCUTS GUIDE */}
              {activeModal === 'shortcuts' && (
                <div className="space-y-4">
                  <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <Keyboard className="h-5 w-5 text-violet-500" />
                    Keyboard Shortcuts
                  </h3>
                  <div className="space-y-2.5 pt-2">
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/5">
                      <span className="text-slate-500 dark:text-slate-400">Launch New Task Field</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-black border dark:border-white/15 font-mono text-[10px]">N</kbd>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/5">
                      <span className="text-slate-500 dark:text-slate-400">Focus Sprint Search</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-black border dark:border-white/15 font-mono text-[10px]">/</kbd>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/5">
                      <span className="text-slate-500 dark:text-slate-400">Toggle Dark / Light Theme</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-black border dark:border-white/15 font-mono text-[10px]">T</kbd>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/5">
                      <span className="text-slate-500 dark:text-slate-400">Close Modals / Walkthroughs</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-black border dark:border-white/15 font-mono text-[10px]">ESC</kbd>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/5">
                      <span className="text-slate-500 dark:text-slate-400">Open Hotkeys Guide</span>
                      <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-black border dark:border-white/15 font-mono text-[10px]">?</kbd>
                    </div>
                  </div>
                </div>
              )}

              {/* EDIT TASK DETAILS MODAL */}
              {activeModal === 'edit-task' && editingTask && (
                <div className="space-y-4">
                  <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">Modify Task Parameters</h3>
                  
                  <form onSubmit={handleUpdateTaskDetails} className="space-y-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500 uppercase tracking-wider">Task Title</label>
                      <input
                        type="text"
                        required
                        value={editingTask.title}
                        onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-black/20 outline-none text-slate-900 dark:text-white focus:border-violet-505"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 uppercase tracking-wider">Category</label>
                        <select
                          value={editingTask.category}
                          onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-black/20 outline-none cursor-pointer"
                        >
                          <option value="coding">Coding</option>
                          <option value="design">Design</option>
                          <option value="study">Study</option>
                          <option value="fitness">Fitness</option>
                          <option value="business">Business</option>
                          <option value="health">Health</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 uppercase tracking-wider">Priority</label>
                        <select
                          value={editingTask.priority}
                          onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-black/20 outline-none cursor-pointer"
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 uppercase tracking-wider">Difficulty</label>
                        <select
                          value={editingTask.difficulty}
                          onChange={(e) => setEditingTask({ ...editingTask, difficulty: e.target.value as any })}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-black/20 outline-none cursor-pointer"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 uppercase tracking-wider">Due Date</label>
                        <input
                          type="date"
                          value={editingTask.dueDate ? editingTask.dueDate.substring(0, 10) : ''}
                          onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-black/20 outline-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-violet-650 text-white font-bold bg-violet-600 hover:bg-violet-750 transition cursor-pointer"
                    >
                      Save Task Settings
                    </button>
                  </form>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ONBOARDING TOUR OVERLAYS */}
      <AnimatePresence>
        {tourStep !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm print:hidden">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl relative text-xs text-slate-650 dark:text-slate-350 flex flex-col gap-4"
            >
              
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/5">
                <Sparkles className="h-5 w-5 text-violet-500" />
                <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white">SmartFlow Tour ({tourStep}/5)</h3>
              </div>

              {tourStep === 1 && (
                <div>
                  <p className="leading-relaxed font-semibold">
                    Welcome to your new SaaS-grade Workspace! Let's take a 60-second walkthrough tour of the platform features.
                  </p>
                  <p className="mt-2 text-[10px] text-slate-400">Learn how dynamic metrics, progression boards, and safety settings operate.</p>
                </div>
              )}

              {tourStep === 2 && (
                <div>
                  <p className="leading-relaxed font-semibold">
                    Use the <span className="font-extrabold text-slate-900 dark:text-white">Launch New Task</span> block on the left panel to add workflow items. 
                  </p>
                  <p className="mt-2 leading-relaxed">
                    Set Custom Priorities (High/Medium/Low) and Difficulties (Beginner/Intermediate/Advanced) alongside target calendar dates.
                  </p>
                </div>
              )}

              {tourStep === 3 && (
                <div>
                  <p className="leading-relaxed font-semibold">
                    Our <span className="font-extrabold text-slate-900 dark:text-white">Heuristic AI Engine</span> generates dynamic progressive recommendations.
                  </p>
                  <p className="mt-2 leading-relaxed">
                    If you complete beginner tasks, the AI adapts and promotes recommendations to intermediate or advanced exercises, avoiding stagnant counting algorithms.
                  </p>
                </div>
              )}

              {tourStep === 4 && (
                <div>
                  <p className="leading-relaxed font-semibold">
                    Review your <span className="font-extrabold text-slate-900 dark:text-white">Heatmap Grid</span> and dials. We measure Productivity (weighted by priority), Focus, Streak Consistency, and Learning progression scores.
                  </p>
                </div>
              )}

              {tourStep === 5 && (
                <div>
                  <p className="leading-relaxed font-semibold">
                    Click on your <span className="font-extrabold text-slate-900 dark:text-white">monogram initials avatar</span> in the top right header.
                  </p>
                  <p className="mt-2 leading-relaxed">
                    This reveals profile editors, password toggles, global light/dark theme preference saving, and system sign out controls.
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-white/5">
                <button
                  onClick={handleFinishTour}
                  className="text-slate-400 hover:text-slate-650 cursor-pointer font-bold"
                >
                  Skip Tour
                </button>
                <div className="flex gap-2">
                  {tourStep > 1 && (
                    <button
                      onClick={() => setTourStep(tourStep - 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 font-bold cursor-pointer"
                    >
                      Back
                    </button>
                  )}
                  {tourStep < 5 ? (
                    <button
                      onClick={() => setTourStep(tourStep + 1)}
                      className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold cursor-pointer"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={handleFinishTour}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                    >
                      Finish
                    </button>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
