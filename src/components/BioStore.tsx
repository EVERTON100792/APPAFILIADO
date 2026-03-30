import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, ShoppingBag, Zap } from 'lucide-react';
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
    supabase.from('bio_store').select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
         if (data) setItems(data);
         setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-accent">
        <div className="animate-pulse flex items-center gap-3 font-black tracking-widest text-sm">
          <ShoppingBag size={20} />
          CARREGANDO VITRINE...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-accent/30 selection:text-accent pb-20">
      <div className="max-w-md mx-auto pt-16 px-4">
        
        {/* Header da Loja */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="relative w-28 h-28 mx-auto mb-6">
            <div className="absolute inset-0 bg-accent rounded-full blur-2xl opacity-20 animate-pulse" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-tr from-accent to-red-500 p-1 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
               <div className="w-full h-full bg-[#0a0a0a] rounded-full flex items-center justify-center overflow-hidden">
                  <ShoppingBag size={38} className="text-accent" />
               </div>
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Meus Achadinhos</h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">Os melhores produtos virais testados e aprovados!</p>
        </motion.div>

        {/* Lista de Produtos */}
        <div className="space-y-4">
          <AnimatePresence>
            {items.map((item, i) => (
               <motion.a
                 href={item.affiliate_link}
                 target="_blank"
                 rel="noopener noreferrer"
                 key={item.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 transition={{ delay: i * 0.05 }}
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 className="group relative flex items-center gap-4 p-3 pr-5 bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden hover:border-accent/50 hover:bg-[#111] transition-all"
               >
                 <div className="absolute inset-0 bg-gradient-to-r from-accent/0 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                 
                 <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#151515] flex-shrink-0 border border-white/5 group-hover:border-accent/30 transition-colors">
                    <img 
                      src={item.image_url} 
                      alt={item.title} 
                      className="w-full h-full object-cover" 
                      loading="lazy"
                    />
                 </div>
                 
                 <div className="flex-1 min-w-0 py-1">
                   <h3 className="text-white font-bold leading-snug line-clamp-3 text-sm mb-2 opacity-90 group-hover:opacity-100 transition-opacity">
                      {item.title}
                   </h3>
                   <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-[10px] uppercase font-black tracking-wider border border-accent/20 group-hover:bg-accent group-hover:text-black transition-colors">
                     COMPRAR AGORA <ExternalLink size={12} />
                   </div>
                 </div>
               </motion.a>
            ))}
          </AnimatePresence>
          
          {items.length === 0 && (
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
               className="text-center text-slate-500 py-16 opacity-50 border border-dashed border-white/10 rounded-3xl"
             >
               <ShoppingBag size={48} className="mx-auto mb-4" />
               <p className="font-medium text-sm">Nenhum produto cadastrado ainda.</p>
             </motion.div>
          )}
        </div>
        
        {/* Footer */}
        <motion.div 
           initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
           className="mt-20 text-center text-slate-600 text-[10px] tracking-widest font-black uppercase flex items-center justify-center w-full gap-2 opacity-50"
        >
           <Zap size={10} className="text-accent" />
           Powered by Agentes Shop
        </motion.div>
      </div>
    </div>
  );
};
