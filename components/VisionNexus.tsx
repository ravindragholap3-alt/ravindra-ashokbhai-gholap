
import React, { useState, useRef } from 'react';
import { analyzeImage, editImage, generateVideo } from '../services/geminiService';

export const VisionNexus: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState('Maya');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setVideoUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const onAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setStatus('Maya is peering into the pixels...');
    try {
      const base64 = image.split(',')[1];
      const desc = await analyzeImage(base64, `Analyze this image named ${name}. Describe its soul and content.`);
      setResult(desc);
    } catch (err) { setStatus('The vision blurred.'); }
    setLoading(false);
  };

  const onAnimate = async () => {
    if (!image) return;
    setLoading(true);
    setStatus('Veo is breathing life into the frame...');
    try {
      const base64 = image.split(',')[1];
      const url = await generateVideo(base64, prompt);
      setVideoUrl(url);
    } catch (err) { setStatus('The animation failed to manifest.'); }
    setLoading(false);
  };

  const onEdit = async () => {
    if (!image || !prompt) return;
    setLoading(true);
    setStatus('Flash is reshaping reality...');
    try {
      const base64 = image.split(',')[1];
      const edited = await editImage(base64, prompt);
      setImage(edited);
    } catch (err) { setStatus('The transformation was rejected.'); }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 flex flex-col lg:flex-row gap-8 animate-in fade-in duration-1000">
      <div className="flex-1 flex flex-col gap-6">
        <div className="glass rounded-[3rem] p-8 border border-white/10 shadow-2xl overflow-hidden relative group">
          {image ? (
            <div className="relative aspect-[9/16] max-h-[600px] w-full mx-auto rounded-3xl overflow-hidden border border-white/5">
              <img src={image} className="w-full h-full object-cover" alt="Vision Upload" />
              <button onClick={() => setImage(null)} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/80">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2"/></svg>
              </button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[9/16] max-h-[600px] w-full mx-auto rounded-3xl border-2 border-dashed border-cyan-500/20 flex flex-col items-center justify-center cursor-pointer hover:bg-cyan-500/5 transition-all"
            >
              <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2"/></svg>
              </div>
              <p className="serif text-xl text-slate-300">Upload Old Picture</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-2">GIF, PNG, JPEG</p>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
        </div>

        <div className="glass rounded-[2rem] p-6 border border-white/5">
          <input 
            type="text" 
            value={prompt} 
            onChange={e => setPrompt(e.target.value)}
            placeholder="Prompt for animation or editing... (e.g. 'Add a retro filter')"
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none text-white serif"
          />
        </div>
      </div>

      <div className="w-full lg:w-96 flex flex-col gap-6">
        <div className="glass p-8 rounded-[3rem] border border-cyan-400/20">
          <h3 className="serif text-2xl text-cyan-400 mb-6">Nexus Identity</h3>
          <div className="space-y-4">
            <input 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white font-bold"
              placeholder="Give it a name..."
            />
            <div className="grid grid-cols-1 gap-3">
              <button disabled={!image || loading} onClick={onAnalyze} className="py-4 bg-cyan-600/40 rounded-2xl text-white font-bold hover:bg-cyan-600 transition-all border border-cyan-400/20">Analyze with Pro</button>
              <button disabled={!image || loading} onClick={onAnimate} className="py-4 bg-emerald-600/40 rounded-2xl text-white font-bold hover:bg-emerald-600 transition-all border border-emerald-400/20">Animate with Veo</button>
              <button disabled={!image || loading || !prompt} onClick={onEdit} className="py-4 bg-violet-600/40 rounded-2xl text-white font-bold hover:bg-violet-600 transition-all border border-violet-400/20">Edit with Flash</button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="glass p-8 rounded-[3rem] border border-cyan-400/20 animate-pulse text-center">
            <p className="text-cyan-400 font-bold text-xs uppercase tracking-widest">{status}</p>
          </div>
        )}

        {result && (
          <div className="glass p-8 rounded-[3rem] border border-white/10 overflow-y-auto max-h-[400px]">
            <h4 className="serif text-emerald-400 mb-2">Maya's Insight</h4>
            <p className="text-slate-300 text-sm italic leading-relaxed whitespace-pre-wrap">{result}</p>
          </div>
        )}

        {videoUrl && (
          <div className="glass p-4 rounded-[3rem] border border-emerald-400/20 overflow-hidden">
            <h4 className="serif text-emerald-400 mb-4 px-4 uppercase text-[10px] tracking-widest">Veo Generation</h4>
            <video src={videoUrl} controls className="w-full rounded-2xl" autoPlay loop />
          </div>
        )}
      </div>
    </div>
  );
};
