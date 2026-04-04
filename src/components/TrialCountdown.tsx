import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ShieldCheck } from 'lucide-react';

interface TrialCountdownProps {
  remainingMs: number | null;
  isPro: boolean;
  variant?: 'compact' | 'large';
}

export const TrialCountdown: React.FC<TrialCountdownProps> = ({ remainingMs, isPro, variant = 'compact' }) => {
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const isExpiringSoon = Boolean(isPro && remainingMs !== null && remainingMs > 0 && remainingMs <= 3 * 24 * 60 * 60 * 1000);

  useEffect(() => {
    const updateTime = () => {
      if (!remainingMs || remainingMs <= 0) {
        setTimeLeft('00:00:00');
        return;
      }

      if (isPro) {
        const totalDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
        const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remainingMs / (1000 * 60 * 60)) % 24);
        setTimeLeft(`${Math.max(totalDays, days)}d ${hours.toString().padStart(2, '0')}h`);
        return;
      }

      const seconds = Math.floor((remainingMs / 1000) % 60);
      const minutes = Math.floor((remainingMs / (1000 * 60)) % 60);
      const hours = Math.floor((remainingMs / (1000 * 60 * 60)) % 24);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [remainingMs, isPro]);

  if (isPro) {
    return (
      <div className={`relative overflow-hidden flex items-center gap-3 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.12)] ${isExpiringSoon ? 'bg-[linear-gradient(135deg,rgba(245,158,11,0.16)_0%,rgba(251,191,36,0.1)_100%)] border border-amber-400/22' : 'bg-[linear-gradient(135deg,rgba(16,185,129,0.14)_0%,rgba(6,182,212,0.1)_100%)] border border-emerald-400/18'} ${variant === 'large' ? 'px-8 py-4' : 'px-4 py-2'}`}>
        <div className={`absolute inset-0 pointer-events-none ${isExpiringSoon ? 'bg-[radial-gradient(circle_at_left,rgba(251,191,36,0.14),transparent_32%)]' : 'bg-[radial-gradient(circle_at_left,rgba(52,211,153,0.14),transparent_32%)]'}`} />
        <div className="relative w-8 h-8 rounded-xl bg-emerald-400/10 border border-emerald-300/15 flex items-center justify-center">
          <ShieldCheck size={variant === 'large' ? 22 : 14} className={`${isExpiringSoon ? 'text-amber-300 fill-amber-300' : 'text-emerald-300 fill-emerald-300'}`} />
        </div>
        <div className="relative flex flex-col">
          <span className={`${variant === 'large' ? 'text-sm' : 'text-[10px]'} font-black uppercase tracking-[0.22em] ${isExpiringSoon ? 'text-amber-200' : 'text-emerald-300'}`}>{isExpiringSoon ? 'PRO VENCE EM BREVE' : 'STATUS: PERFIL PRO'}</span>
          <span className={`${variant === 'large' ? 'text-[11px]' : 'text-[9px]'} ${isExpiringSoon ? 'text-amber-100/90' : 'text-emerald-200/80'} font-bold uppercase tracking-widest`}>Renova em {timeLeft}</span>
        </div>
      </div>
    );
  }

  if (!remainingMs || remainingMs <= 0) {
    return (
      <div className={`flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl ${variant === 'large' ? 'px-8 py-4' : 'px-4 py-2'}`}>
        <Clock size={variant === 'large' ? 24 : 14} className="text-red-400" />
        <span className={`${variant === 'large' ? 'text-lg' : 'text-[10px]'} font-black uppercase tracking-[0.2em] text-red-400`}>TESTE EXPIRADO</span>
      </div>
    );
  }

  if (variant === 'large') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-50" />
        <div className="relative flex flex-col items-center gap-2">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={20} className="text-accent animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 italic">Teste em andamento</span>
          </div>
          <div className="flex items-baseline gap-2">
             <span className="text-6xl font-mono font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
               {timeLeft}
             </span>
          </div>
          <p className="text-[10px] font-bold text-accent uppercase tracking-[0.3em] mt-2">Sua licença de teste está ativa</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 bg-slate-900/60 backdrop-blur-xl border border-white/5 px-5 py-2.5 rounded-2xl shadow-xl"
    >
      <div className="flex items-center gap-2 border-r border-white/10 pr-4">
        <div className="relative">
          <Clock size={14} className="text-accent animate-pulse" />
          <div className="absolute inset-0 bg-accent blur-md opacity-10 animate-pulse" />
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">TESTE</span>
      </div>
      
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-mono font-black text-white tracking-tighter tabular-nums">
          {timeLeft}
        </span>
      </div>
    </motion.div>
  );
};
