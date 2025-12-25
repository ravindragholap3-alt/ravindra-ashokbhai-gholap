
import React, { useState, useEffect, useRef } from 'react';
import { getGroundedKnowledge, getAudioFeedback } from '../services/geminiService';
import { AppMode, LLMSoul, Reminder } from '../types';
import { decode, decodeAudioData } from '../services/audioUtils';
import { MayaPersona } from './MayaPersona';

export const AssistantHub: React.FC<{ language: string }> = ({ language }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'maya', text: string}[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [weatherAlert, setWeatherAlert] = useState<string | null>(null);
  const [pulseData, setPulseData] = useState({ global: 'S&P 500: 5,950.45', change: '▲ 1.2%' });
  
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        console.warn("Location access denied", err);
        setLocation({ lat: 28.6139, lng: 77.2090 });
      }
    );
  }, []);

  useEffect(() => {
    if (location) {
      const fetchInitialBriefing = async () => {
        try {
          const res = await getGroundedKnowledge(
            "Give me a one-sentence urgent weather alert or forecast for my current location. If no severe alerts, give a short pleasant forecast.",
            AppMode.ASSISTANT,
            LLMSoul.GEMINI,
            { latitude: location.lat, longitude: location.lng },
            language
          );
          setWeatherAlert(res.text);
          
          const pulses = [
            { global: 'S&P 500: 5,950', change: '▲ 1.2%' },
            { global: 'BTC: $96,400', change: '▼ 0.5%' },
            { global: 'Gold: $2,654', change: '▲ 0.8%' },
            { global: 'Nikkei: 38,500', change: '▲ 0.4%' }
          ];
          let i = 0;
          const interval = setInterval(() => {
            setPulseData(pulses[i % pulses.length]);
            i++;
          }, 8000);
          return () => clearInterval(interval);
        } catch (e) {
          console.error("Briefing fetch error:", e);
        }
      };
      fetchInitialBriefing();
    }
  }, [location, language]);

  const handleSpeak = async (text: string) => {
    const audioData = await getAudioFeedback(text, LLMSoul.GEMINI);
    if (audioData) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      try {
        const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        setIsSpeaking(true);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } catch (e) {
        console.error("Audio playback error:", e);
        setIsSpeaking(false);
      }
    }
  };

  const processCommands = (text: string) => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes("google play store") || lowerText.includes("launch play store") || lowerText.includes("open play store")) {
      setTimeout(() => {
        window.open("https://play.google.com/store/games", "_blank");
      }, 2000);
      return language === "English" ? "I am navigating to the Google Play Store for you. Opening the portal now." : `Opening Play Store in ${language}...`;
    }

    if (lowerText.includes("remind me to") || lowerText.includes("set a reminder for") || lowerText.includes("add intention")) {
      let task = "";
      if (lowerText.includes("remind me to")) task = text.split(/remind me to/i)[1].trim();
      else if (lowerText.includes("set a reminder for")) task = text.split(/set a reminder for/i)[1].trim();
      else task = text.split(/add intention/i)[1].trim();

      if (task) {
        const newReminder: Reminder = {
          id: Date.now().toString(),
          text: task.charAt(0).toUpperCase() + task.slice(1),
          time: Date.now(),
          completed: false
        };
        setReminders(prev => [newReminder, ...prev]);
        return `I've added "${task}" to your intentions.`;
      }
    }
    return null;
  };

  const handleQuery = async (e?: React.FormEvent, overrideText?: string) => {
    e?.preventDefault();
    const activeText = overrideText || query;
    if (!activeText.trim()) return;

    setLoading(true);
    const userMsg = activeText;
    setQuery('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);

    const commandResponse = processCommands(userMsg);
    
    const res = await getGroundedKnowledge(userMsg, AppMode.ASSISTANT, LLMSoul.GEMINI, 
      location ? { latitude: location.lat, longitude: location.lng } : undefined,
      language
    );

    const finalMayaText = commandResponse || res.text;
    setChatHistory(prev => [...prev, { role: 'maya', text: finalMayaText }]);
    setLoading(false);
    handleSpeak(finalMayaText);
  };

  const startListening = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Speech recognition not supported.");
      return;
    }
    const rec = new SpeechRec();
    rec.lang = language === 'English' ? 'en-US' : language === 'Español' ? 'es-ES' : language === 'हिन्दी' ? 'hi-IN' : 'en-US';
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setQuery(text);
      handleQuery(undefined, text);
    };
    rec.start();
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-8 min-h-[80vh] animate-in fade-in duration-1000">
      <div className="flex-1 flex flex-col gap-6">
        <div className="glass rounded-[3rem] p-8 h-[550px] overflow-y-auto flex flex-col gap-6 custom-scrollbar border border-cyan-400/10 shadow-inner relative">
          
          <div className="sticky top-0 z-10 flex flex-col items-center mb-10 transition-all">
             <MayaPersona 
               isListening={isListening} 
               isProcessing={loading} 
               isSpeaking={isSpeaking} 
               size="md" 
             />
             <div className="mt-4 text-center">
               <h2 className="serif text-xl text-white tracking-widest uppercase">Maya</h2>
               <div className="flex items-center gap-2 justify-center mt-1">
                 <div className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#00ff88]' : isListening ? 'bg-red-400 animate-ping' : 'bg-cyan-400'}`}></div>
                 <span className="text-[8px] uppercase tracking-[0.3em] text-slate-500 font-bold">
                   {isSpeaking ? 'Speaking' : isListening ? 'Listening' : loading ? 'Thinking' : 'Awaiting Connection'}
                 </span>
               </div>
             </div>
          </div>

          {chatHistory.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center opacity-40 text-center">
               <p className="serif text-2xl text-white tracking-wide">The Oracle Awaits</p>
               <p className="text-[10px] uppercase tracking-[0.4em] mt-3 text-cyan-500 font-bold">Communicating in {language}</p>
               <div className="mt-8 flex gap-3 flex-wrap justify-center">
                  {[
                    "Worldwide Investment Research",
                    "Analyze S&P 500 potential",
                    "Launch Google Play Store", 
                    "What's the weather today?"
                  ].map(tip => (
                    <button key={tip} onClick={() => { setQuery(tip); handleQuery(undefined, tip); }} className="text-[10px] uppercase font-bold tracking-widest px-4 py-2 border border-white/10 rounded-full hover:bg-cyan-400/20 transition-all">"{tip}"</button>
                  ))}
               </div>
            </div>
          )}
          
          <div className="space-y-6">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-7 py-5 rounded-[2rem] border ${msg.role === 'user' ? 'bg-white/5 text-white border-white/10 rounded-br-none' : 'glass border-cyan-400/20 text-cyan-50 rounded-bl-none shadow-xl'}`}>
                  <p className="text-base leading-relaxed serif">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleQuery} className="relative group">
          <input 
            type="text" 
            value={query} 
            onChange={e => setQuery(e.target.value)}
            placeholder={isListening ? "Listening..." : "Whisper your request to Maya..."}
            className={`w-full glass rounded-[2.5rem] py-8 px-10 outline-none border-2 transition-all text-xl pr-44 shadow-2xl ${isListening ? 'border-cyan-400/60 ring-2 ring-cyan-400/20' : 'border-white/5 focus:border-cyan-400/40'}`}
          />
          <div className="absolute right-4 top-4 bottom-4 flex gap-2">
            <button 
              type="button" 
              onClick={startListening} 
              disabled={isListening}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-white/5 text-cyan-400 hover:bg-white/10 border border-white/5'}`}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" strokeWidth="2"/><path d="M19 10v2a7 7 0 01-14 0v-2m14 0h2m-16 0H3m3 8a7 7 0 0012 0" strokeWidth="2"/></svg>
            </button>
            <button disabled={loading || isListening} className="px-8 rounded-2xl bg-cyan-600/60 hover:bg-cyan-500 text-white font-bold transition-all border border-cyan-400/40">
              Invoke
            </button>
          </div>
        </form>
      </div>

      <div className="w-full lg:w-96 flex flex-col gap-6">
        <div className="glass p-8 rounded-[3rem] border border-cyan-400/20 aurora-glow">
          <h3 className="serif text-2xl text-cyan-400 mb-6 tracking-tight">Worldwide Pulse</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 transition-all">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{pulseData.global.split(':')[0]}</span>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-400">{pulseData.global.split(':')[1]}</p>
                <p className="text-[8px] text-emerald-500/60 font-bold">{pulseData.change}</p>
              </div>
            </div>
            {weatherAlert && (
              <div className="bg-cyan-500/10 border border-cyan-400/20 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block mb-1">Local Brief</span>
                <p className="text-xs text-slate-200 leading-relaxed italic">"{weatherAlert}"</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass p-8 rounded-[3rem] border border-white/5 flex-1 shadow-2xl flex flex-col">
          <h3 className="serif text-2xl text-white mb-6">Intentions</h3>
          <div className="space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
            {reminders.map(r => (
              <div key={r.id} className="flex items-center gap-4 p-3 rounded-2xl border border-white/5">
                <button onClick={() => toggleReminder(r.id)} className={`w-5 h-5 rounded-full border ${r.completed ? 'bg-emerald-500 border-emerald-400' : 'border-white/20'}`}></button>
                <span className={`text-xs ${r.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{r.text}</span>
              </div>
            ))}
          </div>
          <button onClick={() => { const t = prompt("Task?"); if(t) setReminders([...reminders, {id: Date.now().toString(), text: t, time: Date.now(), completed: false}]) }} className="mt-6 w-full py-3 rounded-2xl border border-white/5 text-[10px] uppercase font-bold text-cyan-500 tracking-[0.3em] hover:bg-cyan-400/5 transition-all">
            + New Intention
          </button>
        </div>
      </div>
    </div>
  );
};
