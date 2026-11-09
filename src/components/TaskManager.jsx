// client/src/components/TaskManager.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, CheckCircle2, Circle, Trash2, Calendar, CheckSquare, ChevronDown, ChevronUp } from 'lucide-react';

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState('All');

  // Sub-task states for new task creation
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [currentSubtasks, setCurrentSubtasks] = useState([]);
  
  // Expanded task ID for viewing/adding subtasks
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [activeSubtaskInput, setActiveSubtaskInput] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubtaskDraft = () => {
    if (!newSubtaskText.trim()) return;
    setCurrentSubtasks([...currentSubtasks, { id: Date.now().toString(), title: newSubtaskText, completed: false }]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtaskDraft = (id) => {
    setCurrentSubtasks(currentSubtasks.filter(st => st.id !== id));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            user_id: user.id,
            title,
            priority,
            due_date: dueDate || null,
            status: 'To Do',
            subtasks: currentSubtasks
          }
        ])
        .select();

      if (error) throw error;

      if (data) {
        setTasks([data[0], ...tasks]);
        setTitle('');
        setDueDate('');
        setCurrentSubtasks([]);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const toggleTaskStatus = async (task) => {
    const newStatus = task.status === 'Completed' ? 'To Do' : 'Completed';
    
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', task.id);

      if (error) fetchTasks();
    } catch (err) {
      fetchTasks();
    }
  };

  const toggleSubtaskStatus = async (taskId, subtaskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = (task.subtasks || []).map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    setTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t));

    try {
      await supabase
        .from('tasks')
        .update({ subtasks: updatedSubtasks })
        .eq('id', taskId);
    } catch (err) {
      fetchTasks();
    }
  };

  const handleAddSubtaskToExisting = async (taskId) => {
    if (!activeSubtaskInput.trim()) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newSubtask = { id: Date.now().toString(), title: activeSubtaskInput, completed: false };
    const updatedSubtasks = [...(task.subtasks || []), newSubtask];

    setTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t));
    setActiveSubtaskInput('');

    try {
      await supabase
        .from('tasks')
        .update({ subtasks: updatedSubtasks })
        .eq('id', taskId);
    } catch (err) {
      fetchTasks();
    }
  };

  const handleDeleteTask = async (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) fetchTasks();
    } catch (err) {
      fetchTasks();
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'Completed') return t.status === 'Completed';
    if (filter === 'Active') return t.status !== 'Completed';
    return true;
  });

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 dark:border-slate-800 pb-5 gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Tasks & Projects 📋</h2>
          <p className="text-xs text-slate-500 mt-1">Maamul hawlahaaga muhiimka ah oo si habsami ah u fuli qorshayaashaada.</p>
        </div>
        <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          {['All', 'Active', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                filter === tab 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-semibold border border-slate-200/60 dark:border-slate-600' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Task Input Form */}
      <form onSubmit={handleCreateTask} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ku dar hawl cusub..."
            className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300"
          >
            <option value="Low">Low Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="High">High Priority</option>
            <option value="Urgent">Urgent Priority</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-500 transition-colors shadow-sm"
          >
            <Plus size={16} /> Add Task
          </button>
        </div>

        {/* Subtasks Builder for New Task */}
        <div className="border-t border-slate-100 dark:border-slate-700/60 pt-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              placeholder="Ku dar sub-task / checklist item..."
              className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddSubtaskDraft}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Add Subtask
            </button>
          </div>
          {currentSubtasks.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {currentSubtasks.map(st => (
                <span key={st.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] rounded-md">
                  {st.title}
                  <button type="button" onClick={() => handleRemoveSubtaskDraft(st.id)} className="text-slate-400 hover:text-rose-500">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </form>

      {/* Task List */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs text-slate-400">Ma jiraan hawlo la helay. Ku dar hawl cusub kore!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;
            const subtasks = task.subtasks || [];
            const completedSubtasksCount = subtasks.filter(st => st.completed).length;

            return (
              <div
                key={task.id}
                className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-blue-200 ${
                  task.status === 'Completed' ? 'opacity-60 bg-slate-50 dark:bg-slate-900/40' : ''
                }`}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleTaskStatus(task)}
                      className="text-blue-600 hover:text-blue-500 transition-colors"
                    >
                      {task.status === 'Completed' ? (
                        <CheckCircle2 size={20} className="fill-blue-50 text-blue-600" />
                      ) : (
                        <Circle size={20} className="text-slate-300 dark:text-slate-600" />
                      )}
                    </button>
                    <div>
                      <span className={`text-sm font-medium ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-3 mt-0.5">
                        {task.due_date && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Calendar size={12} /> Due: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                        {subtasks.length > 0 && (
                          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                            Checklist: {completedSubtasksCount}/{subtasks.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[11px] px-2.5 py-1 rounded-md font-medium ${
                        task.priority === 'Urgent' ? 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/40' :
                        task.priority === 'High' ? 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/40' :
                        task.priority === 'Medium' ? 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/40' :
                        'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-700 dark:border-slate-600'
                      }`}
                    >
                      {task.priority}
                    </span>

                    <button
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                      title="Toggle Subtasks"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-md"
                      title="Delete Task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Expanded Subtasks Section */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-700/60 p-4 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 rounded-b-xl">
                    <div className="space-y-2">
                      {subtasks.map(st => (
                        <div key={st.id} className="flex items-center justify-between text-xs">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={st.completed}
                              onChange={() => toggleSubtaskStatus(task.id, st.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className={st.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}>
                              {st.title}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={activeSubtaskInput}
                        onChange={(e) => setActiveSubtaskInput(e.target.value)}
                        placeholder="Kudar sub-task cusub..."
                        className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => handleAddSubtaskToExisting(task.id)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-500 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}