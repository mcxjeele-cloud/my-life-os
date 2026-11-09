import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FileText, Plus, Trash2 } from 'lucide-react';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) setNotes(data || []);
    }
    setLoading(false);
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('notes')
        .insert([{ user_id: user.id, title, content }])
        .select();

      if (!error && data) {
        setNotes([data[0], ...notes]);
        setTitle('');
        setContent('');
      }
    }
  };

  const deleteNote = async (id) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (!error) {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-semibold text-slate-900">Notes & Quick Capture 📝</h2>
        <p className="text-xs text-slate-500 mt-1">Keydi fikradahaaga, qoraallada degdegga ah, iyo xusuus-qorkaada.</p>
      </div>

      {/* Add Note Form */}
      <form onSubmit={addNote} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <input
          type="text"
          placeholder="Note Title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
        />
        <textarea
          placeholder="Write your note content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="3"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors"
        >
          <Plus size={16} /> Add Note
        </button>
      </form>

      {/* Notes Grid */}
      {loading ? (
        <p className="text-xs text-slate-400">Loading notes...</p>
      ) : notes.length === 0 ? (
        <p className="text-xs text-slate-400">No notes captured yet. Create your first note above!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    <FileText size={16} className="text-blue-600" />
                    {note.title}
                  </h3>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{note.content}</p>
              </div>
              <span className="text-[10px] text-slate-400 mt-4 block">
                {new Date(note.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}