// client/src/components/Analytics.jsx (Cusboonaysiinta PDF Export)
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BarChart3, TrendingUp, CheckCircle2, Clock, Flame, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function Analytics() {
  const [weeklyStats, setWeeklyStats] = useState({
    completedTasks: 0,
    totalPomodoroMinutes: 0,
    activeHabits: 0,
    completedGoals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyAnalytics();
  }, []);

  const fetchWeeklyAnalytics = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const isoWeekAgo = oneWeekAgo.toISOString();

      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'Completed')
        .gte('created_at', isoWeekAgo);

      const { data: pomodoros } = await supabase
        .from('pomodoro_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', isoWeekAgo);

      const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'Completed');

      const totalPomoMinutes = (pomodoros || []).reduce((acc, curr) => acc + (curr.duration_minutes || 25), 0);

      setWeeklyStats({
        completedTasks: tasks?.length || 0,
        totalPomodoroMinutes: totalPomoMinutes,
        activeHabits: habits?.length || 0,
        completedGoals: goals?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function-ka soo saaraya PDF-ka warbixinta
  const downloadPDFReport = () => {
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("MY LIFE OS - Weekly Productivity Report", 20, 20);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 20, 30);

    doc.line(20, 35, 190, 35);

    doc.setFont("helvetica", "bold");
    doc.text("Summary Metrics (Last 7 Days):", 20, 45);

    doc.setFont("helvetica", "normal");
    doc.text(`- Completed Tasks: ${weeklyStats.completedTasks}`, 25, 55);
    doc.text(`- Focus Time: ${Math.floor(weeklyStats.totalPomodoroMinutes / 60)} hours ${weeklyStats.totalPomodoroMinutes % 60} minutes`, 25, 65);
    doc.text(`- Active Habits Tracked: ${weeklyStats.activeHabits}`, 25, 75);
    doc.text(`- Completed Goals: ${weeklyStats.completedGoals}`, 25, 85);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text("Keep up the great work! Powered by MY LIFE OS & Supabase.", 20, 110);

    doc.save(`MyLifeOS_Weekly_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Analytics & Weekly Report 📊</h2>
          <p className="text-xs text-slate-500 mt-1">Eeg warbixinta guud iyo horumarkaaga 7-dii maalmood ee ugu dambeysay.</p>
        </div>
        <button
          onClick={downloadPDFReport}
          className="flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-blue-500 transition-colors shadow-sm"
        >
          <Download size={15} /> Download PDF Report
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400">Loading weekly report...</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Tasks Completed</span>
                <CheckCircle2 size={18} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{weeklyStats.completedTasks}</h3>
              <p className="text-[11px] text-slate-400">7 days period</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Focus Time</span>
                <Clock size={18} className="text-sky-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {Math.floor(weeklyStats.totalPomodoroMinutes / 60)}h {weeklyStats.totalPomodoroMinutes % 60}m
              </h3>
              <p className="text-[11px] text-slate-400">Pomodoro focus time</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Tracked Habits</span>
                <Flame size={18} className="text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{weeklyStats.activeHabits}</h3>
              <p className="text-[11px] text-slate-400">Active daily routines</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Completed Goals</span>
                <TrendingUp size={18} className="text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{weeklyStats.completedGoals}</h3>
              <p className="text-[11px] text-slate-400">Milestones hit</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}