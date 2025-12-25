
import React, { useState, useEffect, useRef } from 'react';
import { getGroundedKnowledge, getAudioFeedback } from '../services/geminiService';
import { GeminiResponse, AppMode, StoredConversation, LLMSoul } from '../types';
import { decode, decodeAudioData } from '../services/audioUtils';

interface TradingDashboardProps {
  onSave?: (entry: StoredConversation) => void;
  language: string;
}

const CANDLE_PATTERNS = [
  { name: 'Bullish Engulfing', desc: 'Powerful reversal sign after a period of selling.', signal: 'Strong Buy' },
  { name: 'Shooting Star', desc: 'Bearish reversal showing rejection of higher prices.', signal: 'Strong Sell' },
  { name: 'RSI Divergence', desc: 'Price and RSI moving in opposite directions.', signal: 'Trend Shift' },
  { name: 'Golden Cross', desc: '50-day moving average crosses above 200-day.', signal: 'Long Term Buy' },
];

const GLOBAL_SYMBOLS = [
  { label: 'S&P 500 (USA)', value: 'SPX', base: 5950, region: 'US' },
  { label: 'NASDAQ 100', value: 'NDX', base: 21200, region: 'US' },
  { label: 'NIFTY 50 (India)', value: 'NIFTY', base: 24500, region: 'IN' },
  { label: 'NIKKEI 225 (Japan)', value: 'NI225', base: 38500, region: 'JP' },
  { label: 'APPLE INC', value: 'AAPL', base: 228, region: 'US' },
  { label: 'BITCOIN', value: 'BTC', base: 96000, region: 'CRYPTO' },
  { label: 'GOLD (Spot)', value: 'GOLD', base: 2650, region: 'GLOBAL' },
];

export const TradingDashboard: React.FC<TradingDashboardProps> = ({ onSave, language }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [response, setResponse] = useState<GeminiResponse | null>(null);
  const [soul, setSoul] = useState<LLMSoul>(LLMSoul.GEMINI);
  
  // Indicator Parameters
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [macdConfig, setMacdConfig] = useState({ fast: 12, slow: 26, signal: 9 });
  const [showSettings, setShowSettings] = useState(false);

  const [selectedSymbol, setSelectedSymbol] = useState(GLOBAL_SYMBOLS[0]);
  const [currentPrice, setCurrentPrice] = useState<string | null>(null);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [rsi, setRsi] = useState<number>(50);
  
  const prevPriceRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported.");
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'English' ? 'en-US' : language === 'Español' ? 'es-ES' : language === 'हिन्दी' ? 'hi-IN' : 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      handleSubmit(transcript);
    };
    recognition.start();
  };

  const playAudioFeedback = async (text: string) => {
    const base64Audio = await getAudioFeedback(text, soul);
    if (base64Audio) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    }
  };

  useEffect(() => {
    let interval: number;
    const updateSimulatedPrice = () => {
      const volatility = selectedSymbol.base * 0.0008;
      const change = (Math.random() - 0.47) * volatility;
      const newPrice = (prevPriceRef.current || selectedSymbol.base) + change;
      
      if (prevPriceRef.current) {
        if (newPrice > prevPriceRef.current) setPriceDirection('up');
        else if (newPrice < prevPriceRef.current) setPriceDirection('down');
      }
      
      setRsi(prev => {
        const move = (newPrice - (prevPriceRef.current || selectedSymbol.base)) / volatility * 5;
        const target = Math.min(95, Math.max(5, prev + move));
        return parseFloat(target.toFixed(1));
      });

      setCurrentPrice(newPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      prevPriceRef.current = newPrice;
    };
    updateSimulatedPrice();
    interval = window.setInterval(updateSimulatedPrice, 3000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const handleSubmit = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const finalQuery = typeof e === 'string' ? e : query;
    if (!finalQuery.trim() && !currentPrice) return;

    setLoading(true);
    
    const enrichedQuery = `Provide a comprehensive Worldwide Investment Research and Analysis for ${selectedSymbol.label}. 
    Current simulated market price: ${currentPrice}. 
    USER PARAMETERS FOR ANALYSIS:
    - RSI Period: ${rsiPeriod}
    - Current RSI Value: ${rsi}
    - MACD Config: Fast(${macdConfig.fast}), Slow(${macdConfig.slow}), Signal(${macdConfig.signal})
    Analyze global sentiment, fundamental outlook, and technical entry points specifically using these calibrated indicator parameters.
    Communicate in ${language}.
    User Query: ${finalQuery}`;
    
    const res = await getGroundedKnowledge(enrichedQuery, AppMode.TRADING, soul, undefined, language);
    setResponse(res);
    setLoading(false);
    
    if (res.text) playAudioFeedback(res.text);
  };

  const rsiColor = rsi > 70 ? 'text-red-400' : rsi < 30 ? 'text-emerald-400' : 'text-cyan-400';

  return (
    <div className="max-w-7xl mx-auto w-full p-4 flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex flex-col gap-6">
        
        <div className="glass rounded-[3rem] p-8 border border-cyan-400/20 aurora-glow flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
          
          <div className="flex flex-col">
            <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-cyan-500/60 mb-2 serif flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
               Worldwide Oracle Terminal
            </label>
            <div className="flex items-center gap-4">
              <select 
                value={selectedSymbol.value}
                onChange={(e) => {
                  const s = GLOBAL_SYMBOLS.find(sym => sym.value === e.target.value);
                  if (s) {
                    setSelectedSymbol(s);
                    prevPriceRef.current = null;
                  }
                }}
                className="bg-transparent text-3xl font-bold serif text-white outline-none cursor-pointer hover:text-cyan-400 transition-colors appearance-none pr-8"
              >
                {GLOBAL_SYMBOLS.map(s => <option key={s.value} value={s.value} className="bg-[#050a14]">{s.label}</option>)}
              </select>
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${priceDirection === 'up' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {priceDirection === 'up' ? '▲ Global Uptrend' : '▼ Global Downtrend'}
              </div>
            </div>
          </div>

          <div className="flex items-end gap-12">
            <div className="hidden md:flex flex-col items-center">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="4" 
                    strokeDasharray={213} strokeDashoffset={213 - (rsi / 100 * 213)} 
                    className={`${rsiColor} transition-all duration-1000`} />
                </svg>
                <span className={`text-lg font-bold serif ${rsiColor}`}>{Math.round(rsi)}</span>
              </div>
              <span className="text-[8px] uppercase font-bold text-slate-500 mt-2 tracking-[0.2em]">RSI ({rsiPeriod})</span>
            </div>

            <div className="text-right">
              <p className={`text-6xl font-bold tabular-nums transition-all duration-700 serif tracking-tighter ${priceDirection === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                <span className="text-xl mr-2 opacity-40 font-sans italic">$</span>
                {currentPrice || "---"}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Grounding Real-time Value (USD)</p>
            </div>
          </div>
        </div>

        {/* Indicator Calibration Settings */}
        <div className="glass rounded-[2rem] p-6 border border-white/5 relative group">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-[10px] font-bold text-cyan-500 uppercase tracking-[0.4em] serif">Indicator Calibration</h4>
            <button onClick={() => setShowSettings(!showSettings)} className="text-[10px] text-slate-500 uppercase font-bold hover:text-cyan-400 transition-colors">
              {showSettings ? 'Close Config' : 'Adjust Parameters'}
            </button>
          </div>
          
          {showSettings && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col gap-2">
                <label className="text-[8px] uppercase text-slate-400 font-bold tracking-widest">RSI Period</label>
                <input 
                  type="number" 
                  value={rsiPeriod} 
                  onChange={(e) => setRsiPeriod(Number(e.target.value))}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-cyan-500/40"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[8px] uppercase text-slate-400 font-bold tracking-widest">MACD Fast</label>
                <input 
                  type="number" 
                  value={macdConfig.fast} 
                  onChange={(e) => setMacdConfig({...macdConfig, fast: Number(e.target.value)})}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-cyan-500/40"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[8px] uppercase text-slate-400 font-bold tracking-widest">MACD Slow</label>
                <input 
                  type="number" 
                  value={macdConfig.slow} 
                  onChange={(e) => setMacdConfig({...macdConfig, slow: Number(e.target.value)})}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-cyan-500/40"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[8px] uppercase text-slate-400 font-bold tracking-widest">MACD Signal</label>
                <input 
                  type="number" 
                  value={macdConfig.signal} 
                  onChange={(e) => setMacdConfig({...macdConfig, signal: Number(e.target.value)})}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-cyan-500/40"
                />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="relative group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Deep-dive into ${selectedSymbol.label} (${language})...`}
            className="w-full glass rounded-[2.5rem] py-8 px-10 outline-none border-2 border-white/5 focus:border-cyan-400/40 transition-all text-xl pr-44 placeholder:text-slate-700 shadow-xl"
          />
          <div className="absolute right-4 top-4 bottom-4 flex gap-2">
            <button
              type="button"
              onClick={startVoiceInput}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-white/5 hover:bg-white/10 text-cyan-400'}`}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" strokeWidth="2"/><path d="M19 10v2a7 7 0 01-14 0v-2m14 0h2m-16 0H3m3 8a7 7 0 0012 0" strokeWidth="2"/></svg>
            </button>
            <button
              disabled={loading || !currentPrice}
              className="px-8 rounded-2xl bg-cyan-600/60 hover:bg-cyan-500 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-cyan-500/30 border border-cyan-400/30"
            >
              {loading ? "..." : "Consult Oracle"}
            </button>
          </div>
        </form>

        {response && (
          <div className="glass p-12 rounded-[4rem] animate-in fade-in slide-in-from-bottom-8 duration-1000 border border-cyan-400/10 shadow-2xl relative overflow-hidden">
             <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-8">
               <div className="flex flex-col">
                  <span className="px-5 py-2 bg-cyan-500/10 text-cyan-400 rounded-full text-[10px] font-bold uppercase tracking-[0.4em] border border-cyan-400/20 w-fit mb-3">Global Revelation</span>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest px-2">{language} Analysis | Sources: {response.sources.length}</p>
               </div>
               <button onClick={() => playAudioFeedback(response.text)} className="w-14 h-14 flex items-center justify-center text-cyan-400 hover:bg-cyan-400/10 rounded-2xl transition-all border border-cyan-400/10 aurora-glow">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 9v6l-4-4H5V9h3l4-4v4z" strokeWidth="1.5"/></svg>
               </button>
             </div>
             <div className="prose prose-invert max-w-none">
                <p className="text-2xl leading-relaxed text-slate-100 serif whitespace-pre-wrap relative z-10 selection:bg-cyan-500/30 font-light">{response.text}</p>
             </div>
          </div>
        )}
      </div>

      {/* Global Patterns Sidebar */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        <div className="glass p-8 rounded-[3rem] border border-cyan-400/20 aurora-glow">
          <h3 className="text-cyan-400 font-bold mb-8 serif text-2xl uppercase tracking-tighter">Indicator Context</h3>
          <div className="space-y-8">
            <div className="group cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-bold text-slate-100 uppercase tracking-widest group-hover:text-cyan-400 transition-colors">RSI({rsiPeriod})</span>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2ff]"></div>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">Currently simulated at {rsi}. Your calibrated period of {rsiPeriod} is used for the AI analysis.</p>
            </div>
            <div className="group cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-bold text-slate-100 uppercase tracking-widest group-hover:text-cyan-400 transition-colors">MACD({macdConfig.fast}/{macdConfig.slow})</span>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2ff]"></div>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">Fast: {macdConfig.fast}, Slow: {macdConfig.slow}. Signal Line set to {macdConfig.signal}.</p>
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-[3rem] border border-white/5 flex-1 flex flex-col">
          <h3 className="text-slate-300 font-bold mb-8 serif text-xl uppercase tracking-widest">Global Grimoire</h3>
          <div className="flex flex-col gap-8">
            {CANDLE_PATTERNS.map((p, i) => (
              <div key={i} className="group cursor-pointer hover:translate-x-1 transition-all" 
                   onClick={() => handleSubmit(`Search for ${p.name} patterns in global indices including ${selectedSymbol.label}. Consider my calibrated indicators.`)}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition-colors uppercase tracking-widest">{p.name}</span>
                  <span className={`text-[8px] font-bold px-3 py-1 rounded-full ${p.signal.includes('Buy') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {p.signal}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-8 rounded-[3rem] border border-cyan-400/10 bg-cyan-400/5 relative overflow-hidden">
          <h4 className="text-cyan-400 font-bold text-[10px] mb-4 uppercase tracking-[0.4em] serif">Holistic Allocation</h4>
          <p className="text-xs text-slate-400 leading-relaxed italic opacity-80">
            "Investment is the seeding of the future. Just as we rotate crops, rotate your worldwide assets. Diversity is the soil of wealth. Your calibrated indicators guide the plow."
          </p>
        </div>
      </div>
    </div>
  );
};
