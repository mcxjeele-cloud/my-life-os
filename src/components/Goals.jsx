// client/src/components/Goals.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Target, Plus, Trash2, Calendar, CheckCircle2 } from 'lucide-react';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Personal');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) setGoals(data || []);
    }
    setLoading(false);
  };

  const addGoal = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('goals')
        .insert([{ 
          user_id: user.id, 
          title, 
          category, 
          progress: 0, 
          target_date: targetDate || null,
          status: 'In Progress' 
        }])
        .select();

      if (!error && data) {
        setGoals([data[0], ...goals]);
        setTitle('');
        setTargetDate('');
      }
    }
  };

  const updateProgress = async (id, currentProgress) => {
    const newProgress = currentProgress >= 100 ? 0 : currentProgress + 25;
    const newStatus = newProgress === 100 ? 'Completed' : 'In Progress';

    const { error } = await supabase
      .from('goals')
      .update({ progress: newProgress, status: newStatus })
      .eq('id', id);

    if (!error) {
      setGoals(goals.map(g => g.id === id ? { ...g, progress: newProgress, status: newStatus } : g));
    }
  };

  const deleteGoal = async (id) => {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (!error) {
      setGoals(goals.filter(g => g.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Goals & Milestones 🎯</h2>
        <p className="text-xs text-slate-500 mt-1">Deji yiriddo muddo-dheer ah oo la soco horumarkaaga.</p>
      </div>

      {/* Add Goal Form */}
      <form onSubmit={addGoal} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Goal title (e.g., Master Full-Stack Dev)..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:outline-none focus:border-blue-500"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
        >
          <option value="Personal">Personal</option>
          <option value="Career">Career & Work</option>
          <option value="Health">Health & Fitness</option>
          <option value="Education">Education</option>
        </select>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-2 bg-blue-600 text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-blue-500 transition-colors shrink-0"
        >
          <Plus size={16} /> Add Goal
        </button>
      </form>

      {/* Goals List */}
      {loading ? (
        <p className="text-xs text-slate-400">Loading goals...</p>
      ) : goals.length === 0 ? (
        <p className="text-xs text-slate-400">No goals set yet. Define your first target above!</p>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target size={20} className="text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{goal.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">{goal.category}</span>
                      {goal.target_date && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Calendar size={12} /> Target: {new Date(goal.target_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateProgress(goal.id, goal.progress)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <CheckCircle2 size={14} />
                    {goal.progress}%
                  </button>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}