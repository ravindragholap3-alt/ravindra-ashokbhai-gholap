
import React, { useState } from 'react';
import { getGroundedKnowledge } from '../services/geminiService';
import { AppMode, LLMSoul } from '../types';

export const MayaChat: React.FC<{ language: string }> = ({ language }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'maya', text: string, thinking?: boolean }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useThinking, setUseThinking] = useState(false);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const res = await getGroundedKnowledge(userMsg, AppMode.CHAT, LLMSoul.GEMINI, undefined, language, useThinking);
    setMessages(prev => [...prev, { role: 'maya', text: res.text, thinking: useThinking }]);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col h-[80vh] gap-6">
      <div className="glass flex-1 rounded-[3rem] p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center">
            <h2 className="serif text-3xl mb-2">Consult the Oracle</h2>
            <p className="text-xs uppercase tracking-widest">Gemini 3 Pro Intelligence</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-6 rounded-[2rem] ${m.role === 'user' ? 'bg-white/5 border border-white/10' : 'glass border-cyan-400/20'}`}>
              {m.thinking && <p className="text-[8px] text-cyan-400 uppercase font-bold mb-2 tracking-widest">Maya pondered deeply on this...</p>}
              <p className="serif leading-relaxed text-slate-100">{m.text}</p>
            </div>
          </div>
        ))}
        {loading && <div className="text-cyan-400 animate-pulse text-[10px] font-bold uppercase tracking-widest px-8">Maya is channeling wisdom...</div>}
      </div>

      <form onSubmit={onSend} className="relative">
        <div className="absolute -top-12 left-6 flex items-center gap-4">
          <button 
            type="button"
            onClick={() => setUseThinking(!useThinking)}
            className={`flex items-center gap-2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${useThinking ? 'bg-cyan-500 text-white' : 'bg-white/5 text-slate-500 border border-white/10'}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeWidth="2"/></svg>
            Deep Thinking Mode
          </button>
        </div>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a complex question..."
          className="w-full glass rounded-[2rem] py-6 px-10 outline-none border-2 border-white/5 focus:border-cyan-400/40 text-xl pr-40"
        />
        <button className="absolute right-4 top-4 bottom-4 px-8 bg-cyan-600 rounded-2xl text-white font-bold hover:bg-cyan-500 transition-all border border-cyan-400/20">Send</button>
      </form>
    </div>
  );
};
