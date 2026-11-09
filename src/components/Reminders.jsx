// client/src/components/Reminders.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Bell, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';

export default function Reminders() {
  const [dueTasks, setDueTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Soo qaado tasks-ka aan weli la dhammeystirin oo leh due_date
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'Completed')
        .not('due_date', 'is', null)
        .lte('due_date', today)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setDueTasks(data || []);
    } catch (err) {
      console.error('Error fetching reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (id) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'Completed' })
      .eq('id', id);

    if (!error) {
      setDueTasks(dueTasks.filter(t => t.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Reminders & Alerts 🔔</h2>
        <p className="text-xs text-slate-500 mt-1">Ogaysiisyada hawlaha maanta ku eg ama wakhtigoodu dhaafay.</p>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400">Loading reminders...</p>
      ) : dueTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
          <Bell size={28} className="mx-auto text-emerald-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Wax xasuusin ah ma jiraan!</h3>
          <p className="text-xs text-slate-400">Dhammaan hawlahaagu waa kuwo waqtigooda la hayo ama la dhammeystiray.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dueTasks.map((task) => (
            <div key={task.id} className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} className="text-rose-600 dark:text-rose-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{task.title}</h4>
                  <span className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 font-medium">
                    <Calendar size={12} /> Due Date: {task.due_date}
                  </span>
                </div>
              </div>

              <button
                onClick={() => markAsCompleted(task.id)}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-500 transition-colors shadow-sm"
              >
                <CheckCircle2 size={14} /> Mark Done
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}