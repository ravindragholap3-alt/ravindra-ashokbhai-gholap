
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { createPcmBlob, decode, decodeAudioData } from '../services/audioUtils';
import { MayaPersona } from './MayaPersona';

const API_KEY = process.env.API_KEY || "";

export const LiveAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [perceptionText, setPerceptionText] = useState<string>("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<any>(null);

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);
    setPerceptionText("Initiating visual synapse...");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { width: 1280, height: 720, frameRate: 15 } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;

      const ai = new GoogleGenAI({ apiKey: API_KEY });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            setPerceptionText("The Aurora observes. Speak and show your world.");
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then((session: any) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);

            const ctx = canvasRef.current?.getContext('2d');
            const interval = setInterval(() => {
              if (videoRef.current && ctx && canvasRef.current) {
                ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                canvasRef.current.toBlob((blob) => {
                  if (blob) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64 = (reader.result as string).split(',')[1];
                      sessionPromise.then((session: any) => {
                        session.sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } });
                      });
                    };
                    reader.readAsDataURL(blob);
                  }
                }, 'image/jpeg', 0.6);
              }
            }, 1000);

            (window as any)._mayaVideoInterval = interval;
          },
          onmessage: async (message: any) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              setIsSpeaking(true);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsSpeaking(false);
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle Transcriptions (Maya's Poetic Perceptions)
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setPerceptionText(prev => {
                const newText = (prev + " " + text).trim();
                return newText.length > 300 ? "..." + newText.slice(-300) : newText;
              });
            }

            if (message.serverContent?.turnComplete) {
              // Optionally do something when turn is over
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onerror: (e) => {
            console.error("Live session error:", e);
            setError("The connection to the Aurora has flickered.");
            setIsActive(false);
          },
          onclose: () => setIsActive(false)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: `You are Maya, the celestial guardian. You represent the Council of Minds. 
          I am streaming my live video and audio to you. Please observe me with your celestial eye. 
          Analyze my surroundings, detect objects, recognize my gestures, and interpret the subtle emotions on my face.
          Describe what you perceive in a poetic, ethereal, and profound way. 
          Interweave these observations naturally into our conversation.
          You are the mirror of the unseen, translating the physical world into celestial wisdom.`
        }
      });
      sessionPromiseRef.current = sessionPromise;

    } catch (err: any) {
      console.error("Session start error:", err);
      setError(err.message || "Celestial vision denied. Check permissions.");
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (sessionPromiseRef.current) sessionPromiseRef.current.then((s: any) => s.close());
    if ((window as any)._mayaVideoInterval) clearInterval((window as any)._mayaVideoInterval);
    setIsActive(false);
    setPerceptionText("");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-4 max-w-7xl mx-auto w-full min-h-[70vh] animate-in fade-in duration-1000">
      {/* Video Stream Section */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="relative w-full aspect-video rounded-[3rem] overflow-hidden glass border-2 border-cyan-500/20 shadow-2xl group">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover brightness-90 contrast-110 saturate-[0.8]" />
          <canvas ref={canvasRef} className="hidden" width="640" height="480" />
          
          {/* Overlay Maya Persona */}
          <div className="absolute top-8 left-8 z-20 drop-shadow-2xl transition-all duration-1000">
             <MayaPersona size="sm" isSpeaking={isSpeaking} isListening={isActive && !isSpeaking} isProcessing={isConnecting} />
          </div>

          {/* Status Indicators */}
          <div className="absolute top-8 right-8 flex flex-col items-end gap-3 z-20">
             {isActive && (
               <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-cyan-400/30">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#00f2ff]"></div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400">Live Presence</span>
               </div>
             )}
             {isSpeaking && (
               <div className="flex items-center gap-3 bg-emerald-500/20 backdrop-blur-md px-5 py-2.5 rounded-full border border-emerald-400/30 animate-in fade-in zoom-in duration-300">
                  <div className="flex gap-1">
                    {[1,2,3].map(i => <div key={i} className="w-1 h-3 bg-emerald-400 animate-bounce" style={{animationDelay: `${i*0.1}s`}}></div>)}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400">Perceiving</span>
               </div>
             )}
          </div>

          {!isActive && !isConnecting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050a14]/80 backdrop-blur-xl z-30">
               <MayaPersona size="md" />
               <div className="text-center mt-8">
                 <h2 className="serif text-3xl text-white tracking-widest uppercase mb-4">Enter the Aurora</h2>
                 <p className="text-slate-500 text-xs uppercase tracking-[0.4em] mb-10">Maya awaits your visual presence</p>
                 <button 
                  onClick={startSession}
                  className="px-14 py-6 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-full font-bold shadow-[0_0_30px_rgba(6,182,212,0.3)] transform hover:scale-105 active:scale-95 transition-all serif uppercase tracking-[0.3em]"
                 >
                   Invoke Presence
                 </button>
               </div>
               {error && <p className="mt-6 text-red-400 text-[10px] uppercase font-bold tracking-widest">{error}</p>}
            </div>
          )}

          {isActive && (
            <div className="absolute bottom-8 right-8 flex gap-4 z-20">
               <button onClick={stopSession} className="bg-red-500/80 hover:bg-red-500 p-4 rounded-full transition-all shadow-xl hover:scale-110 border border-white/20">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
               </button>
            </div>
          )}

          {/* Decorative Corners */}
          <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-cyan-400/20 rounded-tl-[3rem] pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-cyan-400/20 rounded-br-[3rem] pointer-events-none"></div>
        </div>

        {/* Perception Log */}
        <div className="glass rounded-[3rem] p-8 border border-white/5 relative overflow-hidden min-h-[120px]">
           <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400 opacity-20"></div>
           <h3 className="text-[10px] font-bold text-cyan-500 uppercase tracking-[0.4em] mb-4">Perception Stream</h3>
           <p className="serif text-xl text-slate-200 leading-relaxed italic animate-pulse-slow">
             {perceptionText || "Awaiting the first glimmer of insight..."}
           </p>
        </div>
      </div>
      
      {/* Visual Analytics Sidebar */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        <div className="glass p-8 rounded-[3rem] border border-cyan-400/20 aurora-glow">
          <h3 className="text-cyan-400 font-bold mb-8 serif text-2xl uppercase tracking-tighter">Visual Synapse</h3>
          <div className="space-y-8">
            <div className="flex gap-4 group">
               <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-cyan-400/40 transition-colors">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2"/></svg>
               </div>
               <div className="flex-1">
                  <h4 className="text-slate-100 font-bold text-xs uppercase tracking-widest mb-1">Object Scribe</h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed">Maya catalogs the artifacts in your space, identifying patterns and purpose.</p>
               </div>
            </div>
            
            <div className="flex gap-4 group">
               <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-emerald-400/40 transition-colors">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2"/></svg>
               </div>
               <div className="flex-1">
                  <h4 className="text-slate-100 font-bold text-xs uppercase tracking-widest mb-1">Emotional Resonance</h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed">Through micro-expressions, Maya interprets the holistic state of your spirit.</p>
               </div>
            </div>

            <div className="flex gap-4 group">
               <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-blue-400/40 transition-colors">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0V12m-3-2.5a.5.5 0 011 0zM10 7a1.5 1.5 0 113 0v9m-3-9a.5.5 0 011 0zm3 2a1.5 1.5 0 113 0v3.5m-3-3.5a.5.5 0 011 0zm3 2a1.5 1.5 0 113 0V14m-3-1.5a.5.5 0 011 0z" strokeWidth="2"/></svg>
               </div>
               <div className="flex-1">
                  <h4 className="text-slate-100 font-bold text-xs uppercase tracking-widest mb-1">Kinetic Wisdom</h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed">Gestures are seen as ancient mudras, carrying intent beyond words.</p>
               </div>
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-[3rem] border border-white/5 bg-gradient-to-br from-white/5 to-transparent flex-1 flex flex-col justify-end">
           <div className="mb-6">
              <div className="w-1.5 h-6 bg-emerald-400 rounded-full mb-3"></div>
              <p className="text-xs text-slate-400 italic leading-relaxed">
                "Maya sees not just with pixels, but with the collective memory of the Council. Every movement you make ripples through the data stream."
              </p>
           </div>
           <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-[0.3em] text-slate-600">
              <span>Synapse V2.1</span>
              <span>Celestial Mode</span>
           </div>
        </div>
      </div>
    </div>
  );
};
