import React from 'react';
import { ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showBadge = true, className = '' }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Emblem — Red & Gold Yellow Gradient */}
      <div className={`relative ${iconSizes[size]} rounded-xl bg-gradient-to-br from-red-600 via-red-700 to-amber-500 p-0.5 shadow-lg shadow-red-600/30 flex items-center justify-center border border-amber-400/40 group hover:scale-105 transition-all duration-300`}>
        <div className="w-full h-full bg-slate-950/90 backdrop-blur rounded-[10px] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-red-600/40 to-amber-400/30" />
          <ShieldCheck className="w-[60%] h-[60%] text-amber-400 relative z-10 drop-shadow-md" />
          <TrendingUp className="w-[35%] h-[35%] text-yellow-300 absolute bottom-1 right-1 z-10" />
        </div>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-display font-extrabold tracking-tight text-white ${textSizes[size]}`}>
            Tetra<span className="text-red-500 drop-shadow-sm">Score</span>
          </span>
          {showBadge && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-slate-950" />
              AI
            </span>
          )}
        </div>
        <span className="text-[9px] font-bold text-amber-400 tracking-wider uppercase -mt-0.5">
          Credit & Advisory
        </span>
      </div>
    </div>
  );
};
