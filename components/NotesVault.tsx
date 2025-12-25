
import React, { useState, useEffect } from 'react';
import { Note, AppMode } from '../types';
import { getGroundedKnowledge } from '../services/geminiService';

const STORAGE_KEY = 'maya_notes_vault';

export const NotesVault: React.FC<{ language: string }> = ({ language }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [expandingId, setExpandingId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setNotes(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    if (!newNote.title.trim() && !newNote.content.trim()) return;
    const note: Note = {
      id: crypto.randomUUID(),
      title: newNote.title || 'Untitled Insight',
      content: newNote.content,
      timestamp: Date.now(),
      color: ['#00f2ff', '#00ff88', '#f472b6', '#a78bfa'][Math.floor(Math.random() * 4)]
    };
    setNotes([note, ...notes]);
    setNewNote({ title: '', content: '' });
    setIsAdding(false);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const expandWithAI = async (note: Note) => {
    setExpandingId(note.id);
    const prompt = `User wrote this note: "${note.title}: ${note.content}". Please expand on this idea with holistic wisdom, providing more detail and connecting it to larger systems. Keep it concise but profound. Language: ${language}`;
    const res = await getGroundedKnowledge(prompt, AppMode.NOTES, undefined, undefined, language);
    
    setNotes(notes.map(n => n.id === note.id ? { ...n, content: n.content + "\n\n--- Maya's Expansion ---\n" + res.text } : n));
    setExpandingId(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-10 px-4">
        <div>
          <h2 className="serif text-3xl text-white tracking-widest uppercase">Notes Vault</h2>
          <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-500 font-bold">Archives of Intent and Wisdom</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-8 py-3 bg-cyan-600/40 hover:bg-cyan-500 text-white rounded-full font-bold transition-all border border-cyan-400/30 aurora-glow"
        >
          + Scribe New
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-xl p-8 rounded-[3rem] border border-cyan-400/30 animate-in zoom-in duration-300">
            <h3 className="serif text-xl text-white mb-6 uppercase tracking-widest">Capture Insight</h3>
            <input 
              type="text" 
              placeholder="Title of Intention..."
              value={newNote.title}
              onChange={e => setNewNote({ ...newNote, title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 mb-4 outline-none focus:border-cyan-400/40 text-white serif"
            />
            <textarea 
              placeholder="Detailed whispers of the soul..."
              rows={6}
              value={newNote.content}
              onChange={e => setNewNote({ ...newNote, content: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 mb-6 outline-none focus:border-cyan-400/40 text-white resize-none"
            />
            <div className="flex gap-4">
              <button onClick={addNote} className="flex-1 py-4 bg-cyan-600 rounded-2xl text-white font-bold hover:bg-cyan-500 transition-all">Scribe</button>
              <button onClick={() => setIsAdding(false)} className="px-8 py-4 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center opacity-30">
            <p className="serif text-2xl text-white tracking-widest">The Vault is Hollow</p>
            <p className="text-xs uppercase tracking-[0.3em] mt-2">Begin scribing your journey</p>
          </div>
        )}
        {notes.map(note => (
          <div key={note.id} className="glass p-8 rounded-[2.5rem] border border-white/5 hover:border-white/20 transition-all group flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="w-2 h-10 rounded-full" style={{ backgroundColor: note.color }}></div>
              <div className="flex gap-2">
                <button 
                  onClick={() => expandWithAI(note)}
                  disabled={!!expandingId}
                  className="p-2 text-cyan-400 hover:bg-cyan-400/10 rounded-xl transition-all"
                  title="Expand with Maya's Wisdom"
                >
                  {expandingId === note.id ? <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2"/></svg>}
                </button>
                <button 
                  onClick={() => deleteNote(note.id)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2"/></svg>
                </button>
              </div>
            </div>
            <h4 className="serif text-xl text-white mb-3 tracking-wide">{note.title}</h4>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 whitespace-pre-wrap flex-1 italic">
              {note.content}
            </p>
            <div className="pt-4 border-t border-white/5 text-[8px] uppercase tracking-[0.3em] text-slate-600 font-bold">
              {new Date(note.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
