
import React from 'react';

interface MayaPersonaProps {
  isListening?: boolean;
  isProcessing?: boolean;
  isSpeaking?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const MayaPersona: React.FC<MayaPersonaProps> = ({ 
  isListening, 
  isProcessing, 
  isSpeaking, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-64 h-64'
  };

  return (
    <div className={`relative ${sizeClasses[size]} group`}>
      {/* Background Glows */}
      <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 transition-all duration-1000 ${
        isSpeaking ? 'bg-emerald-400 scale-125' : 
        isListening ? 'bg-red-400 scale-110' : 
        'bg-cyan-400 scale-100'
      }`}></div>
      
      {/* Aurora Hair/Energy Effect */}
      <div className={`absolute -inset-4 rounded-full opacity-30 blur-xl animate-pulse bg-gradient-to-tr from-cyan-500 via-emerald-500 to-blue-600 transition-opacity duration-700 ${
        isProcessing ? 'opacity-60' : 'opacity-20'
      }`}></div>

      {/* Main Stylized Female Portrait SVG */}
      <div className="relative w-full h-full rounded-full border-2 border-white/10 overflow-hidden glass p-1 shadow-2xl">
        <svg viewBox="0 0 200 200" className="w-full h-full text-white">
          <defs>
            <linearGradient id="auroraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f2ff" />
              <stop offset="100%" stopColor="#00ff88" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Silhouette / Portrait Art */}
          <path 
            d="M100 30 C 60 30, 40 80, 40 120 C 40 160, 160 160, 160 120 C 160 80, 140 30, 100 30 Z" 
            fill="rgba(5, 10, 20, 0.8)" 
          />
          
          {/* Facial Features (Abstract/Celestial) */}
          <g className={`transition-all duration-500 ${isListening ? 'translate-y-[-2px]' : ''}`}>
             {/* Eyes */}
             <circle cx="75" cy="100" r="3" fill={isListening ? "#ff4444" : "url(#auroraGrad)"} filter="url(#glow)">
               {isProcessing && <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />}
             </circle>
             <circle cx="125" cy="100" r="3" fill={isListening ? "#ff4444" : "url(#auroraGrad)"} filter="url(#glow)">
               {isProcessing && <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />}
             </circle>
             
             {/* Third Eye / Mark of Wisdom */}
             <path d="M100 85 L102 90 L100 95 L98 90 Z" fill="url(#auroraGrad)" opacity="0.8" filter="url(#glow)" />
          </g>
          
          {/* Hair/Flow lines */}
          <g stroke="url(#auroraGrad)" strokeWidth="0.5" fill="none" opacity="0.4">
            <path d="M60 40 Q 30 80 50 140" />
            <path d="M140 40 Q 170 80 150 140" />
            <path d="M100 30 Q 80 60 100 90" />
            {isSpeaking && (
              <animateTransform 
                attributeName="transform" 
                type="translate" 
                values="0 0; 0 -2; 0 0" 
                dur="2s" 
                repeatCount="indefinite" 
              />
            )}
          </g>
        </svg>
      </div>

      {/* Reactive Orbitals */}
      {isProcessing && (
        <div className="absolute inset-0 border border-cyan-400/20 rounded-full animate-[spin_4s_linear_infinite]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#00f2ff]"></div>
        </div>
      )}
    </div>
  );
};
