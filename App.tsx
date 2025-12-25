
import React, { useState, useEffect } from 'react';
import { AppMode, StoredConversation, Language } from './types';
import { LiveAssistant } from './components/LiveAssistant';
import { KnowledgeDashboard } from './components/KnowledgeDashboard';
import { ChroniclesView } from './components/ChroniclesView';
import { TradingDashboard } from './components/TradingDashboard';
import { AssistantHub } from './components/AssistantHub';
import { NotesVault } from './components/NotesVault';
import { VisionNexus } from './components/VisionNexus';
import { MayaChat } from './components/MayaChat';

const STORAGE_KEY = 'maya_chronicles_history';

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' }
];

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.ASSISTANT);
  const [history, setHistory] = useState<StoredConversation[]>([]);
  const [user, setUser] = useState<{ name: string; email: string; provider: string } | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [language, setLanguage] = useState<Language>(LANGUAGES[0]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) { console.error(e); }
    }
    const storedUser = localStorage.getItem('maya_user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const handleSocialLogin = (provider: string) => {
    const mockUser = {
      name: 'Celestial Guardian',
      email: `guardian@${provider}.com`,
      provider: provider
    };
    localStorage.setItem('maya_user', JSON.stringify(mockUser));
    setUser(mockUser);
    setShowLogin(false);
  };

  const logout = () => {
    localStorage.removeItem('maya_user');
    setUser(null);
  };

  const saveToHistory = (entry: StoredConversation) => setHistory(prev => [entry, ...prev]);
  const deleteFromHistory = (id: string) => setHistory(prev => prev.filter(item => item.id !== id));
  const clearHistory = () => setHistory([]);

  const NavButton = ({ target, label, icon }: { target: AppMode, label: string, icon: React.ReactNode }) => (
    <button 
      onClick={() => setMode(target)}
      className={`flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-700 ${mode === target ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-400/40 shadow-[0_0_20px_rgba(0,242,255,0.1)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
    >
      <span className={`transition-transform duration-500 ${mode === target ? 'scale-110' : ''}`}>{icon}</span>
      <span className="font-bold tracking-[0.2em] text-[9px] uppercase">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#050a14]">
      <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] opacity-20 pointer-events-none" style={{
        background: 'radial-gradient(circle at 30% 30%, #00ff88 0%, transparent 40%), radial-gradient(circle at 70% 70%, #00f2ff 0%, transparent 40%)',
        filter: 'blur(100px)'
      }}></div>

      <header className="sticky top-0 z-50 glass border-b border-white/5 px-6 md:px-10 py-6 flex flex-col xl:flex-row justify-between items-center gap-6 backdrop-blur-3xl">
        <div className="flex items-center gap-5 cursor-pointer group" onClick={() => setMode(AppMode.ASSISTANT)}>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-white to-emerald-400 p-[1px] shadow-2xl shadow-cyan-500/30 transition-transform duration-500 group-hover:scale-105">
            <div className="w-full h-full rounded-2xl bg-[#050a14] flex items-center justify-center font-bold text-cyan-400 serif text-3xl">M</div>
          </div>
          <div>
            <h1 className="text-3xl font-bold serif text-white tracking-[0.2em] uppercase">Maya AI</h1>
            <p className="text-[10px] uppercase tracking-[0.5em] text-cyan-500 font-bold opacity-80">Celestial Nexus</p>
          </div>
        </div>

        <nav className="flex flex-wrap justify-center gap-1.5">
          <NavButton target={AppMode.ASSISTANT} label="Home" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeWidth="2"/></svg>} />
          <NavButton target={AppMode.CHAT} label="Oracle" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeWidth="2"/></svg>} />
          <NavButton target={AppMode.LIVE} label="Presence" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth="2"/></svg>} />
          <NavButton target={AppMode.VISION} label="Nexus" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2"/></svg>} />
          <NavButton target={AppMode.TRADING} label="Market" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4" strokeWidth="2"/></svg>} />
          <NavButton target={AppMode.NOTES} label="Vault" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2"/></svg>} />
        </nav>

        <div className="flex items-center gap-6">
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 hover:border-cyan-400/40 transition-all">
              <span className="text-lg">{language.flag}</span>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hidden lg:block">{language.name}</span>
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 glass rounded-2xl p-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all transform translate-y-2 group-hover:translate-y-0 z-[100] border border-white/10">
              {LANGUAGES.map(lang => (
                <button key={lang.code} onClick={() => setLanguage(lang)} className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${language.code === lang.code ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/5 text-slate-400'}`}>
                  <span>{lang.flag}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
          {user ? (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-white uppercase tracking-widest">{user.name}</p>
                <button onClick={logout} className="text-[8px] text-cyan-500 font-bold uppercase tracking-[0.2em] hover:text-white transition-colors">Sign Out</button>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-emerald-400 flex items-center justify-center font-bold text-white border-2 border-white/10">{user.name.charAt(0)}</div>
            </div>
          ) : (
            <button onClick={() => setShowLogin(true)} className="px-6 py-2.5 bg-cyan-600/20 hover:bg-cyan-500 text-white rounded-full font-bold text-[10px] uppercase tracking-[0.2em] transition-all border border-cyan-400/30">Sign In</button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 z-10 custom-scrollbar">
        <div className="pt-10">
          {mode === AppMode.ASSISTANT && <AssistantHub language={language.name} />}
          {mode === AppMode.CHAT && <MayaChat language={language.name} />}
          {mode === AppMode.LIVE && <LiveAssistant />}
          {mode === AppMode.VISION && <VisionNexus />}
          {mode === AppMode.TRADING && <TradingDashboard onSave={saveToHistory} language={language.name} />}
          {mode === AppMode.AGRICULTURE && <KnowledgeDashboard mode={AppMode.AGRICULTURE} onSave={saveToHistory} language={language.name} />}
          {mode === AppMode.CHRONICLES && <ChroniclesView history={history} onDelete={deleteFromHistory} onClear={clearHistory} />}
          {mode === AppMode.NOTES && <NotesVault language={language.name} />}
        </div>
      </main>

      {showLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#050a14]/90 backdrop-blur-xl">
           <div className="glass w-full max-w-md p-10 rounded-[3rem] border border-white/10 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400"></div>
             <div className="mb-8">
               <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10"><span className="serif text-2xl text-cyan-400">M</span></div>
               <h2 className="serif text-2xl text-white tracking-widest uppercase">Maya Sync</h2>
               <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mt-2">Connect your soul to the Aurora</p>
             </div>
             <div className="space-y-4">
                <button onClick={() => handleSocialLogin('Google')} className="w-full py-4 glass border border-white/5 hover:border-white/20 rounded-2xl flex items-center justify-center gap-4 transition-all group">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Sync with Google</span>
                </button>
                <button onClick={() => handleSocialLogin('Apple')} className="w-full py-4 glass border border-white/5 hover:border-white/20 rounded-2xl flex items-center justify-center gap-4 transition-all group">
                   <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.96.95-2.04 2.15-3.41 2.15-1.34 0-1.78-.81-3.34-.81-1.57 0-2.06.81-3.34.81-1.33 0-2.58-1.38-3.43-2.62-1.72-2.52-2.63-7.14-.94-9.61 1.1-1.6 2.76-2.6 4.54-2.6 1.34 0 2.61.93 3.43.93.81 0 2.33-1.12 3.94-1.12 1.69 0 3.2 1.05 4.19 2.52-3.41 2.05-2.86 6.3 1.12 8.04-1.01 2.37-2.04 4.16-3.07 5.16zM13.4 3.19c.74-.91 1.24-2.17 1.1-3.19-1.02.04-2.26.68-2.99 1.54-.66.75-1.14 1.83-1 2.81 1.14.09 2.22-.41 2.89-1.16z"/></svg>
                   <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Sync with Apple</span>
                </button>
             </div>
             <button onClick={() => setShowLogin(false)} className="mt-8 text-[8px] text-slate-600 hover:text-white uppercase font-bold tracking-[0.4em]">Return to Void</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
