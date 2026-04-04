import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Terminal,
  Activity,
  Sparkles,
  Cpu,
  Server,
  UserCheck
} from 'lucide-react';

interface AgentScoutingProps {
  onComplete: () => void;
}

export const AgentScouting: React.FC<AgentScoutingProps> = ({ onComplete }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing Multi-Agent Framework...');
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const sequence = [
      { msg: 'Iniciando protocolo Creative_Top_V6...', delay: 700, prog: 8 },
      { msg: 'Conectando aos agentes de elite...', delay: 1800, prog: 22 },
      { msg: '> Agente "Viral_Hunter" ONLINE', delay: 2900, prog: 34 },
      { msg: '> Agente "Trend_Analyzer" ONLINE', delay: 4100, prog: 46 },
      { msg: 'Escaneando tendencias globais (TikTok/Shopee)...', delay: 5600, prog: 63 },
      { msg: 'Filtrando produtos com alta taxa de conversao...', delay: 7200, prog: 78 },
      { msg: 'Validando sinais de engajamento e vendas...', delay: 8700, prog: 91 },
      { msg: 'Sincronizacao concluida. Bem-vindo, Operador.', delay: 10100, prog: 100 },
    ];

    const timers = sequence.map((step, i) =>
      setTimeout(() => {
        setLogs(prev => [...prev, step.msg].slice(-6));
        setProgress(step.prog);
        setStatus(step.msg);
        
        if (i === sequence.length - 1) {
          setTimeout(() => onCompleteRef.current(), 1200);
        }
      }, step.delay)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden font-inter">
      {/* Abstract Tech Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full decoration-emerald-500/10" />
      </div>

      <div className="relative z-10 w-full max-w-lg space-y-12">
        {/* Central Core UI */}
        <div className="flex flex-col items-center space-y-8">
           <div className="relative">
              {/* Outer Rings */}
                 <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
                 className="absolute -inset-16 border border-white/5 rounded-full border-dashed"
               />
               <motion.div 
                 animate={{ rotate: -360 }}
                 transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                 className="absolute -inset-10 border border-accent/10 rounded-full"
               />
              
              {/* Main Icon */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.025, 1],
                  boxShadow: [
                    '0 0 20px rgba(6,182,212,0.2)',
                    '0 0 38px rgba(6,182,212,0.32)',
                    '0 0 20px rgba(6,182,212,0.2)'
                  ]
                }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-32 h-32 rounded-[3.5rem] bg-slate-900 border-2 border-accent/30 flex items-center justify-center relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Activity size={64} className="text-accent group-hover:scale-110 transition-transform" />
                
                {/* Internal Scanline */}
                <motion.div 
                  animate={{ top: ['-10%', '110%'] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-0.5 bg-accent/50 shadow-[0_0_15px_#06b6d4] z-20"
                />
              </motion.div>
           </div>

           <div className="text-center space-y-3">
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-black italic tracking-tighter uppercase leading-none bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent"
              >
                SQUAD_V6 <span className="text-accent">AGENT_OS</span>
              </motion.h1>
              <div className="flex items-center justify-center gap-3">
                 <div className="h-[1px] w-12 bg-white/10" />
                 <span className="text-[10px] text-accent font-black uppercase tracking-[0.5em]">
                    Creative & Top Mode Active
                  </span>
                 <div className="h-[1px] w-12 bg-white/10" />
              </div>
           </div>
        </div>

        {/* Status & Progress */}
        <div className="space-y-4">
           <div className="flex justify-between items-end mb-2">
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Protocolo de Escaneamento</span>
                <p className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                   <Sparkles size={12} className="text-accent" /> {status}
                </p>
              </div>
              <span className="text-2xl font-mono font-black text-accent">{progress}%</span>
           </div>
           
           <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-accent shadow-[0_0_10px_#06b6d4]"
              />
           </div>
        </div>

        {/* Console Live */}
        <div className="bg-black/60 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-6 font-mono text-[10px] space-y-2.5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2 opacity-50 border-b border-white/5 pb-2">
             <Terminal size={12} className="text-accent" />
             <span className="text-[8px] font-black uppercase tracking-[0.3em]">Scanners_Output_Direct</span>
          </div>
          <div className="space-y-1.5">
            {logs.map((log, i) => (
              <motion.div 
                key={i + log}
                initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                className={log.startsWith('>') ? 'text-slate-500' : 'text-accent font-black'}
              >
                {log}
              </motion.div>
            ))}
          </div>
          {/* Scanline Effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,128,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
        </div>
      </div>

      {/* Footer System Info */}
      <div className="absolute bottom-6 flex items-center gap-6 opacity-30 group">
         <div className="flex items-center gap-2">
            <Cpu size={14} />
            <span className="text-[8px] font-black uppercase tracking-widest text-white">Neural Load: 12%</span>
         </div>
         <div className="flex items-center gap-2">
            <Server size={14} />
            <span className="text-[8px] font-black uppercase tracking-widest text-white">Proxies: Active</span>
         </div>
         <div className="flex items-center gap-2 text-emerald-400">
            <UserCheck size={14} />
            <span className="text-[8px] font-black uppercase tracking-widest">SQUAD PRO ACCESS</span>
         </div>
      </div>
    </div>
  );
};
