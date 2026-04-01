import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Zap, ArrowUpRight, Sparkles } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface BioItem {
  id: string;
  title: string;
  image_url: string;
  affiliate_link: string;
}

export const BioStore: React.FC<{ userId: string }> = ({ userId }) => {
  const [items, setItems] = useState<BioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Garantir que o userId esteja limpo e em minúsculas para a busca
    const cleanId = userId.trim().toLowerCase();
    
    supabase.from('bio_store').select('*')
      .eq('user_id', cleanId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
         if (data) setItems(data);
         setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
        <div className="noise-overlay" />
        <div className="animate-pulse flex flex-col items-center gap-4 text-emerald-500">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span className="font-black tracking-[0.3em] text-[10px] uppercase">Sincronizando Vitrine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-400 pb-32 relative overflow-y-auto overflow-x-hidden">
      <div className="noise-overlay" />
      
      {/* Background Decor (Watermark) */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-[0.03] flex items-center justify-center select-none">
        <h1 className="text-[40vw] text-display leading-none rotate-12">SHOPEE</h1>
      </div>

      <div className="max-w-md mx-auto pt-20 px-6 relative z-10">
        
        {/* Header da Loja - Assimetria Radical */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
          className="mb-16 relative"
        >
          <div className="flex items-end gap-2 mb-2">
            <span className="text-display text-5xl text-emerald-500 leading-none">LOJA</span>
            <div className="h-0.5 w-12 bg-white/20 mb-2" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-white font-black text-2xl tracking-tighter uppercase leading-none flex flex-wrap gap-2">
               {userId.includes('_') ? (
                 <>
                   {userId.split('_')[0]} <span className="text-emerald-400 italic font-mono">_{userId.split('_').slice(1).join('_')}</span>
                 </>
               ) : userId.includes('-') ? (
                 <>
                   {userId.split('-')[0]} <span className="text-emerald-400 italic font-mono">-{userId.split('-').slice(1).join('-')}</span>
                 </>
               ) : (
                 <>
                   LOJA <span className="text-emerald-400 italic font-mono">@{userId}</span>
                 </>
               )}
            </h1>
            <p className="text-slate-500 mt-4 text-[11px] font-bold uppercase tracking-widest leading-relaxed max-w-[200px]">
              Seleção exclusiva de produtos virais testados.
            </p>
          </div>

          <div className="absolute top-0 right-0">
             <div className="w-16 h-16 rounded-full glass-acid flex items-center justify-center border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                <Sparkles size={20} className="text-emerald-400 animate-pulse" />
             </div>
          </div>
        </motion.div>

        {/* Fragment Grid Strategy */}
        <div className="fragment-grid">
          <AnimatePresence>
            {items.map((item, i) => {
              // Algoritmo de assimetria visual baseada no index
              const isLarge = i % 5 === 0; // O primeiro e a cada 5 são grandes (span 2)
              const rotation = (i % 2 === 0 ? 1 : -1) * (Math.random() * 2);

              return (
                <motion.a
                  href={item.affiliate_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={item.id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1, rotate: rotation }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 100,
                    damping: 15,
                    delay: i * 0.1 
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    rotate: 0,
                    zIndex: 20
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`group relative flex flex-col glass-acid rounded-3xl overflow-hidden transition-all duration-300 ${isLarge ? 'item-span-2' : ''}`}
                >
                  {/* Image Container */}
                  <div className={`relative w-full ${isLarge ? 'aspect-[16/9]' : 'aspect-square'} overflow-hidden bg-[#080808]`}>
                    <img 
                      src={item.image_url} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                    
                    {/* Badge Viral */}
                    <div className="absolute top-3 left-3 px-2 py-1 bg-emerald-500 text-black text-[8px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 shadow-xl">
                      <Zap size={8} fill="currentColor" /> Viral Info
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                    <h3 className="text-white font-bold leading-tight line-clamp-2 text-[13px] opacity-90 group-hover:opacity-100 transition-opacity uppercase tracking-tight">
                       {item.title}
                    </h3>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1 text-[11px] font-black text-emerald-400 group-hover:text-emerald-300 transition-colors">
                        RESGATAR <ArrowUpRight size={12} />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black group-hover:border-emerald-500 transition-all duration-300">
                        <ShoppingBag size={14} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Scanning Glow Effect */}
                  <div className="absolute inset-0 border border-emerald-500/0 group-hover:border-emerald-500/40 transition-all duration-500" />
                </motion.a>
              );
            })}
          </AnimatePresence>
          
          {items.length === 0 && (
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
               className="item-span-2 text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] opacity-40"
             >
               <ShoppingBag size={48} className="mx-auto mb-4 text-emerald-500" />
               <p className="font-black text-[10px] uppercase tracking-[0.2em]">Vitrine Vazia</p>
               <p className="text-[10px] text-slate-500 mt-2">Aguardando curadoria de produtos...</p>
             </motion.div>
          )}
        </div>
        
        {/* Footer Minimal Brutalist */}
        <motion.div 
           initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
           className="mt-24 pt-12 border-t border-white/5 text-center flex flex-col items-center gap-4"
        >
           <div className="flex items-center gap-2 text-slate-600 text-[9px] tracking-[0.4em] font-black uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500/30 animate-pulse" />
              SISTEMA CRIPTOGRAFADO
           </div>
           <p className="text-slate-700 text-[8px] font-medium tracking-tighter opacity-50 uppercase">
             &copy; 2026 AGENTES SHOP . TODOS OS DIREITOS RESERVADOS
           </p>
        </motion.div>
      </div>
    </div>
  );
};
