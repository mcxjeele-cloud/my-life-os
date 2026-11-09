// client/src/components/Settings.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Download, FileJson, FileSpreadsheet, ShieldCheck, Database } from 'lucide-react';

export default function Settings() {
  const [exporting, setExporting] = useState(false);

  // Soo jiidashada dhammaan xogta isticmaalaha
  const fetchAllUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const [tasksRes, notesRes, habitsRes, goalsRes, pomodoroRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id),
      supabase.from('notes').select('*').eq('user_id', user.id),
      supabase.from('habits').select('*').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('pomodoro_logs').select('*').eq('user_id', user.id)
    ]);

    return {
      exported_at: new Date().toISOString(),
      user_email: user.email,
      tasks: tasksRes.data || [],
      notes: notesRes.data || [],
      habits: habitsRes.data || [],
      goals: goalsRes.data || [],
      pomodoro_logs: pomodoroRes.data || []
    };
  };

  // Export ahaan JSON
  const handleExportJSON = async () => {
    try {
      setExporting(true);
      const data = await fetchAllUserData();
      if (!data) return;

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `MyLifeOS_Backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Error exporting JSON:', err);
    } finally {
      setExporting(false);
    }
  };

  // Export ahaan CSV (Tasks)
  const handleExportTasksCSV = async () => {
    try {
      setExporting(true);
      const data = await fetchAllUserData();
      if (!data || !data.tasks.length) {
        alert('Ma jiraan hawlo (Tasks) la soo saari karo!');
        return;
      }

      const headers = ['ID', 'Title', 'Priority', 'Status', 'Due Date', 'Created At'];
      const rows = data.tasks.map(t => [
        t.id,
        `"${t.title.replace(/"/g, '""')}"`,
        t.priority || '',
        t.status || '',
        t.due_date || '',
        t.created_at || ''
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `MyLifeOS_Tasks_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting CSV:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Settings & Data Backup 💾</h2>
        <p className="text-xs text-slate-500 mt-1">Soo deji ama kaydi nuqul ka mid ah dhammaan xogtaada MY LIFE OS.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Full Backup Card (JSON) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileJson size={22} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Full Backup (JSON)</h3>
              <p className="text-[11px] text-slate-400">Dhammaan Tasks, Notes, Habits, Goals iyo Pomodoro Logs.</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Kani wuxuu soo dejinayaa dhammaan xogtaada oo u qaabaysan JSON. Waa mid ku habboon xafidaad (Backup) dhameystiran.
          </p>
          <button
            onClick={handleExportJSON}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-blue-500 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download size={16} />
            {exporting ? 'Downloading...' : 'Export Full Backup (.JSON)'}
          </button>
        </div>

        {/* Tasks Export Card (CSV) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Tasks Export (CSV)</h3>
              <p className="text-[11px] text-slate-400">Ku habboon Excel iyo Google Sheets.</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Soo deji hawlahaaga oo u qaabaysan shaqo-xaashi (Spreadsheet CSV) si aad ugu furaan kartid Microsoft Excel.
          </p>
          <button
            onClick={handleExportTasksCSV}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-emerald-500 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download size={16} />
            {exporting ? 'Downloading...' : 'Export Tasks (.CSV)'}
          </button>
        </div>
      </div>

      {/* Security & Ownership Info Banner */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-5 rounded-xl flex items-center gap-3">
        <ShieldCheck size={20} className="text-blue-600 dark:text-blue-400 shrink-0" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Xogtaada dhammaanteed waxaa lagu xifdiyay Supabase Database oo leh Row Level Security (RLS). Nuqulada aad soo degsato adiga oo keliya ayaa awood u leh akhrintooda.
        </p>
      </div>
    </div>
  );
}