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

interface StoreSettings {
  theme_color: string;
  accent_color: string;
  bg_color: string;
  text_color: string;
  layout_type: string;
  font_style: string;
  header_style: string;
  show_watermark: boolean;
  card_radius: string;
}

const defaultSettings: StoreSettings = {
  theme_color: '#10b981',
  accent_color: '#10b981',
  bg_color: '#050505',
  text_color: '#e2e8f0',
  layout_type: 'grid',
  font_style: 'sans',
  header_style: 'default',
  show_watermark: true,
  card_radius: '1.5rem',
};

const fontMap: Record<string, string> = {
  sans: 'font-sans',
  mono: 'font-mono',
  serif: 'font-serif',
};

const OptimizedImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
      {!loaded && !error && (
        <div className="absolute inset-0 shimmer-effect animate-pulse" style={{ backgroundColor: 'rgba(15,23,42,0.5)' }} />
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: '#0f172a' }}>
          <Sparkles className="scale-150" style={{ color: '#334155' }} />
        </div>
      )}

      <motion.img
        src={src}
        alt={alt}
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        loading="lazy"
      />
    </div>
  );
};

export const BioStore: React.FC<{ userId: string }> = ({ userId }) => {
  const [items, setItems] = useState<BioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);

  useEffect(() => {
    const cleanId = userId.trim().toLowerCase();
    
    supabase.from('bio_store').select('*')
      .eq('user_id', cleanId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
         if (data) setItems(data);
         setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.user_metadata?.store_settings) {
          setSettings(prev => ({ ...prev, ...session.user.user_metadata.store_settings }));
        }
      } catch (e) {
        console.warn('Erro ao carregar settings da vitrine:', e);
      }
    };
    loadSettings();
  }, [userId]);

  const fontClass = fontMap[settings.font_style] || 'font-sans';
  const themeColor = settings.theme_color;
  const bgColor = settings.bg_color;
  const cardRadius = settings.card_radius;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: bgColor }}>
        <div className="animate-pulse flex flex-col items-center gap-4" style={{ color: themeColor }}>
          <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: themeColor, borderTopColor: 'transparent' }} />
          <span className="font-black tracking-[0.3em] text-[10px] uppercase">Sincronizando Vitrine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen text-slate-200 ${fontClass} pb-32 relative overflow-y-auto overflow-x-hidden`} style={{ backgroundColor: bgColor, color: settings.text_color }}>
      <div className="noise-overlay" />
      
      {settings.show_watermark && (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-[0.03] flex items-center justify-center select-none">
          <h1 className="text-[40vw] text-display leading-none rotate-12">SHOPEE</h1>
        </div>
      )}

      <div className="max-w-md mx-auto pt-16 px-6 relative z-10" style={{ paddingTop: 'calc(4rem + var(--safe-top))' }}>
        
        {/* Header */}
        {settings.header_style === 'minimal' ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-12 text-center"
          >
            <h1 className="text-white font-black text-3xl tracking-tighter">
              @{userId}
            </h1>
            <div className="w-12 h-0.5 mx-auto my-3" style={{ backgroundColor: themeColor }} />
          </motion.div>
        ) : settings.header_style === 'bold' ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="mb-16 p-6 rounded-3xl text-center"
            style={{ background: `linear-gradient(135deg, ${themeColor}22, ${themeColor}11)`, border: `1px solid ${themeColor}33` }}
          >
            <h1 className="text-white font-black text-4xl tracking-tighter uppercase">
              LOJA <span style={{ color: themeColor }}>@{userId}</span>
            </h1>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
            className="mb-16 relative"
          >
            <div className="flex items-end gap-2 mb-2">
              <span className="text-display text-5xl leading-none" style={{ color: themeColor }}>LOJA</span>
              <div className="h-0.5 w-12 mb-2" style={{ backgroundColor: `${themeColor}33` }} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-white font-black text-2xl tracking-tighter uppercase leading-none flex flex-wrap gap-2">
                 {userId.includes('_') ? (
                   <>
                     {userId.split('_')[0]} <span style={{ color: themeColor }} className="italic font-mono">_{userId.split('_').slice(1).join('_')}</span>
                   </>
                 ) : userId.includes('-') ? (
                   <>
                     {userId.split('-')[0]} <span style={{ color: themeColor }} className="italic font-mono">-{userId.split('-').slice(1).join('-')}</span>
                   </>
                 ) : (
                   <>
                     LOJA <span style={{ color: themeColor }} className="italic font-mono">@{userId}</span>
                   </>
                 )}
              </h1>
              <p className="text-slate-500 mt-4 text-[11px] font-bold uppercase tracking-widest leading-relaxed max-w-[200px]">
                Seleção exclusiva de produtos virais testados.
              </p>
            </div>

            <div className="absolute top-0 right-0">
               <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: `${themeColor}15`, border: `1px solid ${themeColor}33`, boxShadow: `0 0 40px ${themeColor}22` }}>
                  <Sparkles size={20} style={{ color: themeColor }} className="animate-pulse" />
               </div>
            </div>
          </motion.div>
        )}

        {/* Grid */}
        {settings.layout_type === 'list' ? (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => (
                <motion.a
                  href={item.affiliate_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15, delay: i * 0.05 }}
                  whileHover={{ scale: 1.02, zIndex: 20 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative flex flex-row items-center gap-4 overflow-hidden transition-all duration-300 p-3"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.06)`, borderRadius: cardRadius }}
                >
                  <div className="relative w-20 h-20 shrink-0 overflow-hidden" style={{ borderRadius: cardRadius }}>
                    <OptimizedImage src={item.image_url} alt={item.title} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold leading-tight text-[13px] uppercase tracking-tight line-clamp-2">{item.title}</h3>
                    <div className="flex items-center gap-1 mt-2 text-[11px] font-black" style={{ color: themeColor }}>
                      RESGATAR <ArrowUpRight size={12} />
                    </div>
                  </div>
                </motion.a>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className={settings.layout_type === 'masonry' ? 'columns-2 gap-3 space-y-3' : 'fragment-grid'}>
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => {
                const isLarge = settings.layout_type === 'grid' && i % 5 === 0;
                const rotation = (i % 2 === 0 ? 1 : -1) * (Math.random() * 2);

                return (
                  <motion.a
                    href={item.affiliate_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={item.id}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotate: rotation }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15, delay: i * 0.05 }}
                    whileHover={{ scale: 1.05, rotate: 0, zIndex: 20 }}
                    whileTap={{ scale: 0.95 }}
                    className={`group relative flex flex-col overflow-hidden transition-all duration-300 ${isLarge ? 'item-span-2' : ''} ${settings.layout_type === 'masonry' ? 'break-inside-avoid mb-3' : ''}`}
                    style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.06)`, borderRadius: cardRadius }}
                  >
                    <div className={`relative w-full ${isLarge ? 'aspect-[16/9]' : 'aspect-square'} overflow-hidden`} style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      <OptimizedImage src={item.image_url} alt={item.title} />
                      <div className="absolute inset-0" style={{ background: `linear-gradient(to top, rgba(0,0,0,0.8), transparent, transparent)`, opacity: 0.6 }} />
                      
                      <div className="absolute top-3 left-3 px-2 py-1 text-black text-[8px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 shadow-xl" style={{ backgroundColor: themeColor }}>
                        <Zap size={8} fill="currentColor" /> Viral Info
                      </div>
                    </div>
                    
                    <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                      <h3 className="text-white font-bold leading-tight line-clamp-2 text-[13px] opacity-90 group-hover:opacity-100 transition-opacity uppercase tracking-tight">
                         {item.title}
                      </h3>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1 text-[11px] font-black group-hover:opacity-80 transition-colors" style={{ color: themeColor }}>
                          RESGATAR <ArrowUpRight size={12} />
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:text-black" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <ShoppingBag size={14} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute inset-0 transition-all duration-500" style={{ border: `1px solid transparent` }} />
                  </motion.a>
                );
              })}
            </AnimatePresence>
          </div>
        )}
        
        {items.length === 0 && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }}
             className="text-center py-20 border-dashed opacity-40"
             style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px dashed rgba(255,255,255,0.08)`, borderRadius: '2.5rem' }}
           >
             <ShoppingBag size={48} className="mx-auto mb-4" style={{ color: themeColor }} />
             <p className="font-black text-[10px] uppercase tracking-[0.2em]">Vitrine Vazia</p>
             <p className="text-[10px] text-slate-500 mt-2">Aguardando curadoria de produtos...</p>
           </motion.div>
        )}
        
        {/* Footer */}
        <motion.div 
           initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
           className="mt-24 pt-12 text-center flex flex-col items-center gap-4"
           style={{ borderTop: `1px solid rgba(255,255,255,0.04)` }}
        >
           <div className="flex items-center gap-2 text-[9px] tracking-[0.4em] font-black uppercase" style={{ color: `${themeColor}44` }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: `${themeColor}44` }} />
              SISTEMA CRIPTOGRAFADO
           </div>
           <p className="text-[8px] font-medium tracking-tighter opacity-50 uppercase" style={{ color: '#334155' }}>
             &copy; 2026 AGENTES SHOP . TODOS OS DIREITOS RESERVADOS
           </p>
        </motion.div>
      </div>
    </div>
  );
};
