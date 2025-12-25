
import React from 'react';
import { StoredConversation, AppMode, LLMSoul } from '../types';

interface ChroniclesViewProps {
  history: StoredConversation[];
  onDelete: (id: string) => void;
  onClear: () => void;
}

export const ChroniclesView: React.FC<ChroniclesViewProps> = ({ history, onDelete, onClear }) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
        <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h3 className="text-2xl serif text-slate-300 mb-2">The Archive is Silent</h3>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-8">
      <div className="flex justify-between items-center px-4">
        <h3 className="text-xl serif text-emerald-400 font-bold uppercase tracking-widest">Recorded Chronicles</h3>
        <button onClick={onClear} className="text-[10px] text-red-400 font-bold uppercase tracking-widest hover:text-red-300">Clear All</button>
      </div>

      <div className="flex flex-col gap-6">
        {[...history].sort((a, b) => b.timestamp - a.timestamp).map((entry) => (
          <div key={entry.id} className="glass p-6 rounded-3xl border border-white/5 group relative">
            <button onClick={() => onDelete(entry.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-500 hover:text-red-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${entry.soul === LLMSoul.GPT ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : entry.soul === LLMSoul.DEEPSEEK ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                {entry.soul} Soul
              </span>
              <span className="text-[10px] text-slate-600 uppercase tracking-widest">{new Date(entry.timestamp).toLocaleDateString()}</span>
            </div>
            <h4 className="text-lg font-bold text-slate-100 mb-2 serif italic">"{entry.query}"</h4>
            <p className="text-slate-300 leading-relaxed text-sm opacity-90 line-clamp-4">{entry.response.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
