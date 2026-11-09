// client/src/components/Pomodoro.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Play, Pause, RotateCcw, CheckCircle } from 'lucide-react';

export default function Pomodoro() {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('work'); // 'work' ama 'break'

  useEffect(() => {
    let interval = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      clearInterval(interval);
      setIsActive(false);
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  // Suraagalinta kaydinta marka session uu dhameystirmo
  const handleTimerComplete = async () => {
    if (mode === 'work') {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('pomodoro_logs').insert([
            {
              user_id: user.id,
              duration_minutes: 25,
              completed_at: new Date().toISOString()
            }
          ]);
        }
      } catch (err) {
        console.error('Error logging pomodoro session:', err);
      }
      alert('Focus session completed! Take a 5-minute break.');
      setMode('break');
      setSecondsLeft(5 * 60);
    } else {
      alert('Break finished! Ready to focus again?');
      setMode('work');
      setSecondsLeft(25 * 60);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto text-center pt-8">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-semibold text-slate-900">Pomodoro Focus Timer ⏱️</h2>
        <p className="text-xs text-slate-500 mt-1">Dhiirrigeli diirad-gelintaada (25 min Focus / 5 min Break).</p>
      </div>

      {/* Mode Switcher */}
      <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
        <button
          onClick={() => { setMode('work'); setSecondsLeft(25 * 60); setIsActive(false); }}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            mode === 'work' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
          }`}
        >
          25m Focus
        </button>
        <button
          onClick={() => { setMode('break'); setSecondsLeft(5 * 60); setIsActive(false); }}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            mode === 'break' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
          }`}
        >
          5m Break
        </button>
      </div>

      {/* Timer Display Card */}
      <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <span className="text-6xl font-extrabold text-slate-900 tracking-tight font-mono">
          {formatTime(secondsLeft)}
        </span>

        {/* Timer Control Buttons */}
        <div className="flex justify-center items-center gap-4 pt-2">
          <button
            onClick={toggleTimer}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-500 transition-colors shadow-sm"
          >
            {isActive ? <Pause size={16} /> : <Play size={16} />}
            {isActive ? 'Pause' : 'Start Focus'}
          </button>
          <button
            onClick={resetTimer}
            className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
            title="Reset Timer"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}