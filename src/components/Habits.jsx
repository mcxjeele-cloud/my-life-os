import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Flame, Plus, CheckCircle, Circle, Trash2 } from 'lucide-react';

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) setHabits(data || []);
    }
    setLoading(false);
  };

  const addHabit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('habits')
        .insert([{ user_id: user.id, title, streak: 0, completed_today: false }])
        .select();

      if (!error && data) {
        setHabits([data[0], ...habits]);
        setTitle('');
      }
    }
  };

  const toggleHabit = async (id, currentStatus, currentStreak) => {
    const newStatus = !currentStatus;
    const newStreak = newStatus ? currentStreak + 1 : Math.max(0, currentStreak - 1);

    const { error } = await supabase
      .from('habits')
      .update({ completed_today: newStatus, streak: newStreak })
      .eq('id', id);

    if (!error) {
      setHabits(habits.map(h => h.id === id ? { ...h, completed_today: newStatus, streak: newStreak } : h));
    }
  };

  const deleteHabit = async (id) => {
    const { error } = await supabase.from('habits').delete().eq('id', id);
    if (!error) {
      setHabits(habits.filter(h => h.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-semibold text-slate-900">Habits & Daily Tracker 🔥</h2>
        <p className="text-xs text-slate-500 mt-1">Dhis caadooyin waxtar leh oo ilaali joogtayntaada maalinlaha ah.</p>
      </div>

      {/* Add Habit Form */}
      <form onSubmit={addHabit} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex gap-3">
        <input
          type="text"
          placeholder="New habit name (e.g., Read 20 pages)..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-blue-500 transition-colors shrink-0"
        >
          <Plus size={16} /> Add Habit
        </button>
      </form>

      {/* Habits List */}
      {loading ? (
        <p className="text-xs text-slate-400">Loading habits...</p>
      ) : habits.length === 0 ? (
        <p className="text-xs text-slate-400">No habits added yet. Start building your daily routine above!</p>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => (
            <div key={habit.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleHabit(habit.id, habit.completed_today, habit.streak)}
                  className="text-blue-600 hover:text-blue-500 transition-colors"
                >
                  {habit.completed_today ? <CheckCircle size={22} className="fill-blue-50 text-blue-600" /> : <Circle size={22} className="text-slate-300" />}
                </button>
                <span className={`text-sm font-medium ${habit.completed_today ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                  {habit.title}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-md text-amber-600 text-xs font-semibold">
                  <Flame size={15} />
                  <span>{habit.streak} Day Streak</span>
                </div>
                <button
                  onClick={() => deleteHabit(habit.id)}
                  className="text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}