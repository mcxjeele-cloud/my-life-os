// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import TaskManager from './components/TaskManager';
import Pomodoro from './components/Pomodoro';
import Notes from './components/Notes';
import Habits from './components/Habits';
import Goals from './components/Goals';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import Reminders from './components/Reminders';
import CalendarView from './components/CalendarView';
import { 
  CheckSquare, 
  Timer, 
  LayoutDashboard, 
  FileText, 
  Flame, 
  Target, 
  BarChart3,
  Settings as SettingsIcon,
  Bell,
  CalendarDays,
  LogOut, 
  User, 
  CheckCircle2, 
  Clock, 
  Search, 
  Sun, 
  Moon 
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ completed: 0, pending: 0, pomodoros: 0 });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ tasks: [], notes: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchDashboardStats(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchDashboardStats(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchDashboardStats = async (userId) => {
    try {
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('status')
        .eq('user_id', userId);

      if (!tasksError && tasks) {
        const completed = tasks.filter(t => t.status === 'Completed').length;
        const pending = tasks.length - completed;

        const { count: pomoCount, error: pomoError } = await supabase
          .from('pomodoro_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        setStats({
          completed,
          pending,
          pomodoros: pomoError ? 0 : (pomoCount || 0)
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  };

  useEffect(() => {
    const handleGlobalSearch = async () => {
      if (!searchQuery.trim() || !session) {
        setIsSearching(false);
        setSearchResults({ tasks: [], notes: [] });
        return;
      }

      setIsSearching(true);
      const userId = session.user.id;

      try {
        const { data: matchedTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .ilike('title', `%${searchQuery}%`);

        const { data: matchedNotes } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);

        setSearchResults({
          tasks: matchedTasks || [],
          notes: matchedNotes || []
        });
      } catch (err) {
        console.error('Search error:', err);
      }
    };

    const delayDebounce = setTimeout(handleGlobalSearch, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, session]);

  if (!session) {
    return <Auth />;
  }

  return (
    <div className={`flex h-screen w-full font-sans overflow-hidden transition-colors ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-[#F8FAFC] text-slate-800'}`}>
      {/* Sidebar Navigation */}
      <aside className={`w-64 border-r flex flex-col justify-between p-4 select-none shrink-0 transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div>
          {/* Workspace Branding */}
          <div className={`flex items-center gap-3 px-3 py-2 mb-6 rounded-lg cursor-pointer transition-colors ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-sm shadow-sm">
              L
            </div>
            <div>
              <h1 className={`text-sm font-semibold tracking-wide leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>MY LIFE OS</h1>
              <span className="text-[11px] text-slate-400">Personal Workspace</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
              { id: 'tasks', label: 'Tasks & Projects', icon: CheckSquare },
              { id: 'calendar', label: 'Calendar & Planner', icon: CalendarDays },
              { id: 'pomodoro', label: 'Pomodoro Timer', icon: Timer },
              { id: 'notes', label: 'Notes & Quick Capture', icon: FileText },
              { id: 'habits', label: 'Habits & Tracker', icon: Flame },
              { id: 'goals', label: 'Goals & Milestones', icon: Target },
              { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
              { id: 'reminders', label: 'Reminders & Alerts', icon: Bell },
              { id: 'settings', label: 'Settings & Backup', icon: SettingsIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                    isActive
                      ? darkMode ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30' : 'bg-blue-50 text-blue-600 font-semibold border border-blue-100'
                      : darkMode ? 'text-slate-300 hover:bg-slate-700 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer: Theme Toggle & User Profile */}
        <div className={`border-t pt-3 space-y-2 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
              darkMode ? 'bg-slate-700 text-amber-400 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className="flex items-center gap-2">
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          <div className={`flex items-center justify-between px-2 py-1.5 rounded-md ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                <User size={14} />
              </div>
              <span className="text-xs text-slate-400 font-medium truncate">
                {session.user.email}
              </span>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-md"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 overflow-y-auto p-10 transition-colors ${darkMode ? 'bg-slate-900' : 'bg-[#F8FAFC]'}`}>
        <div className="w-full max-w-5xl mx-auto space-y-6">
          
          {/* Global Search Bar Header */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Raadi dhammaan Tasks-ka iyo Notes-ka..."
              className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border outline-none transition-all ${
                darkMode 
                  ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' 
                  : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500 shadow-sm'
              }`}
            />
          </div>

          {/* Search Results View */}
          {isSearching ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400">Natiijooyinka Raadinta ({searchResults.tasks.length + searchResults.notes.length})</h3>
              
              {searchResults.tasks.length === 0 && searchResults.notes.length === 0 ? (
                <p className="text-xs text-slate-400">Wax natiijo ah looma helin "{searchQuery}".</p>
              ) : (
                <div className="space-y-3">
                  {searchResults.tasks.map(task => (
                    <div key={task.id} className={`p-4 rounded-xl border flex justify-between items-center ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
                      <div>
                        <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider block mb-1">Task</span>
                        <p className="text-sm font-medium">{task.title}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-500 rounded">{task.status}</span>
                    </div>
                  ))}

                  {searchResults.notes.map(note => (
                    <div key={note.id} className={`p-4 rounded-xl border space-y-1 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
                      <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider block mb-1">Note</span>
                      <h4 className="text-sm font-semibold">{note.title}</h4>
                      <p className="text-xs text-slate-400">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className={`border-b pb-5 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Ku soo dhawaaw Space-kaaga 👋</h2>
                    <p className="text-xs text-slate-400 mt-1">Halkan ka maamul dhamaan ajandahaaga, hawlaha kuu dhimman, iyo waqtigaaga focus-ka.</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[
                      { label: 'Completed Tasks', val: stats.completed, icon: CheckCircle2, bg: 'bg-blue-500/10 text-blue-500' },
                      { label: 'Pending Tasks', val: stats.pending, icon: Clock, bg: 'bg-sky-500/10 text-sky-500' },
                      { label: 'Pomodoro Sessions', val: stats.pomodoros, icon: Flame, bg: 'bg-indigo-500/10 text-indigo-500' },
                    ].map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div key={idx} className={`p-5 rounded-xl border shadow-sm flex items-center gap-4 transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                          <div className={`p-3 rounded-lg ${item.bg}`}>
                            <Icon size={20} />
                          </div>
                          <div>
                            <span className="text-xs text-slate-400 font-medium">{item.label}</span>
                            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.val}</h3>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Access Modules Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    {[
                      { id: 'tasks', title: 'Task Manager', desc: 'Kudar oo maamul hawlahaaga.', icon: CheckSquare },
                      { id: 'calendar', title: 'Calendar & Planner', desc: 'Eeg kalandarka iyo ajandaha.', icon: CalendarDays },
                      { id: 'pomodoro', title: 'Pomodoro Timer', desc: 'Kordhi diirad-gelintaada.', icon: Timer },
                      { id: 'notes', title: 'Notes', desc: 'Keydi fikradahaaga degdegga ah.', icon: FileText },
                      { id: 'habits', title: 'Habits Tracker', desc: 'Dhis caadooyin wanaagsan.', icon: Flame },
                      { id: 'goals', title: 'Goals & Milestones', desc: 'Deji yiriddo muddo-dheer ah.', icon: Target },
                      { id: 'analytics', title: 'Analytics & Reports', desc: 'Eeg horumarkaaga toddobaadkan.', icon: BarChart3 },
                      { id: 'reminders', title: 'Reminders & Alerts', desc: 'Eeg hawlaha waqtigoodu ku dhow yahay.', icon: Bell },
                    ].map((mod) => {
                      const Icon = mod.icon;
                      return (
                        <div 
                          key={mod.id}
                          onClick={() => setActiveTab(mod.id)}
                          className={`p-5 rounded-xl border shadow-sm transition-all cursor-pointer group ${
                            darkMode 
                              ? 'bg-slate-800 border-slate-700 hover:border-blue-500' 
                              : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={`font-semibold text-sm transition-colors ${darkMode ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'}`}>{mod.title}</h3>
                            <Icon className="text-slate-400 group-hover:text-blue-500 transition-colors" size={18} />
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{mod.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'tasks' && <TaskManager />}
              {activeTab === 'calendar' && <CalendarView />}
              {activeTab === 'pomodoro' && <Pomodoro />}
              {activeTab === 'notes' && <Notes />}
              {activeTab === 'habits' && <Habits />}
              {activeTab === 'goals' && <Goals />}
              {activeTab === 'analytics' && Analytics()}
              {activeTab === 'reminders' && <Reminders />}
              {activeTab === 'settings' && <Settings />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}