
import React, { useState, useEffect } from 'react';
import { getGroundedKnowledge } from '../services/geminiService';
import { GeminiResponse, AppMode, StoredConversation, LLMSoul } from '../types';

interface DashboardProps {
  mode: AppMode.MARKET | AppMode.AGRICULTURE;
  onSave?: (entry: StoredConversation) => void;
  language: string;
}

interface NewsItem {
  title: string;
  link: string;
  source: string;
  og?: string;
}

export const KnowledgeDashboard: React.FC<DashboardProps> = ({ mode, onSave, language }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<GeminiResponse | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [soul, setSoul] = useState<LLMSoul>(LLMSoul.GEMINI);

  useEffect(() => {
    const fetchNews = async () => {
      setNewsLoading(true);
      try {
        const res = await fetch('https://ok.surf/api/v1/cors/news-feed');
        const data = await res.json();
        const section = mode === AppMode.MARKET ? data.Business : (data.Science || data.World);
        setNews(section?.slice(0, 5) || []);
      } catch (err) {
        console.error("Failed to fetch news feed:", err);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 300000);
    return () => clearInterval(interval);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setIsSaved(false);
    const res = await getGroundedKnowledge(query, mode, soul, undefined, language);
    setResponse(res);
    setLoading(false);
  };

  const handleSave = () => {
    if (response && onSave) {
      const entry: StoredConversation = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        mode,
        soul,
        query,
        response
      };
      onSave(entry);
      setIsSaved(true);
    }
  };

  const getSoulStyles = () => {
    switch (soul) {
      case LLMSoul.GPT: return { primary: 'bg-sky-500', text: 'text-sky-400', border: 'border-sky-500/30', glow: 'shadow-sky-500/20' };
      case LLMSoul.DEEPSEEK: return { primary: 'bg-violet-600', text: 'text-violet-400', border: 'border-violet-500/30', glow: 'shadow-violet-500/20' };
      default: return { primary: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' };
    }
  };

  const modeStyles = getSoulStyles();

  return (
    <div className="max-w-4xl mx-auto w-full p-4 flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 px-2">Council of Minds ({language})</label>
        <div className="glass p-1 rounded-2xl flex gap-1 border border-white/5">
          {[
            { id: LLMSoul.GEMINI, name: 'Gemini', desc: 'The Guardian', icon: '✨', color: 'bg-emerald-500' },
            { id: LLMSoul.GPT, name: 'ChatGPT', desc: 'The Strategist', icon: '🎯', color: 'bg-sky-500' },
            { id: LLMSoul.DEEPSEEK, name: 'DeepSeek', desc: 'The Analyst', icon: '🧬', color: 'bg-violet-600' }
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setSoul(m.id)}
              className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${soul === m.id ? `${m.color} text-white shadow-lg` : 'hover:bg-white/5 text-slate-400'}`}
            >
              <span className="text-xl">{m.icon}</span>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold leading-none">{m.name}</p>
                <p className={`text-[9px] uppercase tracking-tighter mt-1 opacity-70 ${soul === m.id ? 'text-white' : ''}`}>{m.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Deep-dive with ${soul} in ${language}...`}
          className={`w-full glass rounded-2xl py-5 px-6 outline-none border-2 border-white/5 focus:border-white/20 transition-all text-lg pr-16 group-hover:border-white/10`}
        />
        <button
          disabled={loading}
          className={`absolute right-3 top-3 bottom-3 px-6 rounded-xl ${modeStyles.primary} ${modeStyles.glow} text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center`}
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            "Consult"
          )}
        </button>
      </form>

      <div className="glass rounded-2xl p-4 border border-white/5">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className={`text-[10px] font-bold uppercase tracking-widest ${modeStyles.text}`}>
            Current Realities
          </h3>
          {newsLoading && <div className="w-3 h-3 border border-white/20 border-t-white rounded-full animate-spin"></div>}
        </div>
        <div className="flex flex-col gap-3">
          {news.length > 0 ? (
            news.map((item, idx) => (
              <a 
                key={idx} 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-all group"
              >
                <div className={`w-1 h-8 rounded-full ${modeStyles.primary} opacity-20 group-hover:opacity-100 transition-opacity`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 font-medium truncate group-hover:text-white transition-colors">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{item.source}</p>
                </div>
              </a>
            ))
          ) : !newsLoading && (
            <p className="text-center py-4 text-xs text-slate-600 italic">The news is quiet.</p>
          )}
        </div>
      </div>

      {response && (
        <div className={`glass p-8 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 border ${modeStyles.border} ${modeStyles.glow}`}>
          <div className="flex justify-between items-start mb-4">
             <span className={`text-[10px] font-bold uppercase tracking-widest ${modeStyles.text}`}>{soul}'s Perception ({language})</span>
             {onSave && (
               <button 
                onClick={handleSave}
                disabled={isSaved}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isSaved ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
               >
                 {isSaved ? "Wisdom Scribed" : "Scribe Insight"}
               </button>
             )}
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-lg leading-relaxed text-slate-200 serif whitespace-pre-wrap">{response.text}</p>
          </div>
        </div>
      )}
    </div>
  );
};
