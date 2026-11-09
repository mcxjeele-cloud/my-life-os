// client/src/components/CalendarView.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckSquare, Target } from 'lucide-react';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthData();
  }, [currentDate]);

  const fetchMonthData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: fetchedTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .not('due_date', 'is', null);

      const { data: fetchedGoals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .not('target_date', 'is', null);

      setTasks(fetchedTasks || []);
      setGoals(fetchedGoals || []);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Calendar & Daily Planner 📅</h2>
          <p className="text-xs text-slate-500 mt-1">Eeg ajandahaaga iyo taariikhda uu ku beegan yahay task ama goal kasta.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 w-32 text-center">
            {monthNames[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400">Loading planner grid...</p>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-400 mb-2">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstDay }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-24 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              
              const dayTasks = tasks.filter(t => t.due_date === formattedDate);
              const dayGoals = goals.filter(g => g.target_date === formattedDate);

              return (
                <div key={day} className="h-24 p-1.5 border border-slate-100 dark:border-slate-700/50 rounded-xl bg-slate-50/30 dark:bg-slate-800/50 overflow-y-auto space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">{day}</span>
                  
                  {dayTasks.map(t => (
                    <div key={t.id} className="text-[10px] p-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded flex items-center gap-1 truncate" title={t.title}>
                      <CheckSquare size={10} className="shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}

                  {dayGoals.map(g => (
                    <div key={g.id} className="text-[10px] p-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded flex items-center gap-1 truncate" title={g.title}>
                      <Target size={10} className="shrink-0" />
                      <span className="truncate">{g.title}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}