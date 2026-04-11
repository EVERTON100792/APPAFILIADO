import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Zap, ArrowUpRight, Sparkles, ArrowLeft, Share2, Check, Tag, Flame, Clock, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { generateWhatsappMessage } from '../utils/shareUtils';
import { sanitizeShopeeLink } from '../utils/shopeeLinkUtils';

interface BioItem {
  id: string;
  title: string;
  image_url: string;
  affiliate_link: string;
  price?: string;
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
  profile_image: string;
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
  profile_image: '',
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
        src={error ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'%3E%3Crect width='160' height='160' rx='24' fill='%23070b16'/%3E%3Crect x='16' y='16' width='128' height='128' rx='22' fill='%2311172a' stroke='%2322c55e' stroke-opacity='.22'/%3E%3Cpath d='M54 102h52' stroke='%2322c55e' stroke-width='8' stroke-linecap='round'/%3E%3Cpath d='M80 52c-11 0-20 9-20 20v9h40v-9c0-11-9-20-20-20Z' fill='none' stroke='%23e5e7eb' stroke-width='8' stroke-linejoin='round'/%3E%3Ccircle cx='80' cy='81' r='6' fill='%2322c55e'/%3E%3C/svg%3E" : src}
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cleanId = userId.trim().toLowerCase();
    console.log('[BioStore] Loading for user_id:', cleanId);
    setError(null);
    
    const fetchData = async () => {
      const { data: itemsData, error: itemsError } = await supabase
        .from('bio_store')
        .select('*')
        .eq('user_id', cleanId)
        .order('created_at', { ascending: false });
      
      let settingsData: any = null;
      try {
        const { data } = await supabase
          .from('bio_store_settings')
          .select('*')
          .eq('user_id', cleanId)
          .maybeSingle();
        settingsData = data;
      } catch (e) {
        console.log('[BioStore] Table bio_store_settings not available yet');
      }
      
      console.log('[BioStore] Fetch result:', { 
        items: itemsData?.length || 0, 
        settings: settingsData,
        cleanId 
      });
      
      if (itemsError) {
        setError(itemsError.message);
      }
      if (itemsData) {
        setItems(itemsData.map((item: BioItem) => ({
          ...item,
          affiliate_link: sanitizeShopeeLink(item.affiliate_link, undefined),
        })));
      }
      
      if (settingsData) {
        setSettings(prev => ({ ...prev, ...settingsData }));
      }
      setLoading(false);
    };
    
    fetchData();

    const channel = supabase
      .channel('bio_store_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bio_store',
        filter: `user_id=eq.${cleanId}` 
      }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: storeData } = await supabase
          .from('bio_store')
          .select('settings')
          .eq('user_id', userId)
          .single();
        
        if (storeData?.settings) {
          setSettings(prev => ({ ...prev, ...storeData.settings }));
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.user_metadata?.store_settings) {
            setSettings(prev => ({ ...prev, ...session.user.user_metadata.store_settings }));
          }
        }
      } catch (e) {
        console.warn('Erro ao carregar settings da vitrine:', e);
      }
    };
    loadSettings();
    return () => {};
  }, [userId]);

  const handleShare = async (item: BioItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareTitle = `🔥 ${item.title.toUpperCase()} 🔥`;
    const shareText = generateWhatsappMessage(item, userId);

    if (navigator.share) {
      try {
        const response = await fetch(item.image_url);
        const blob = await response.blob();
        const file = new File([blob], 'produto.jpg', { type: 'image/jpeg' });

        await navigator.share({
          title: shareTitle,
          text: shareText,
          files: [file],
        });
      } catch (err) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: item.affiliate_link
          });
        } catch (shareErr) {
          console.error('Share failed', shareErr);
          const encodedText = encodeURIComponent(`${shareTitle}\n\n${shareText}`);
          window.open(`https://wa.me/?text=${encodedText}`, '_blank');
        }
      }
    } else {
      const encodedText = encodeURIComponent(`${shareTitle}\n\n${shareText}`);
      window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    }
  };

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: bgColor }}>
        <div className="text-center p-8">
          <p className="text-red-500 font-bold mb-2">Erro ao carregar:</p>
          <p className="text-slate-400 text-sm">{error}</p>
          <p className="text-slate-500 text-xs mt-4">userId: {userId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen text-slate-200 ${fontClass} pb-32 relative overflow-y-auto overflow-x-hidden`} style={{ backgroundColor: '#000000', color: settings.text_color }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[150px] opacity-30" style={{ backgroundColor: themeColor }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-[120px] opacity-20" style={{ backgroundColor: themeColor }} />
      </div>
      
      {settings.show_watermark && (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-[0.015] flex items-center justify-center select-none">
          <h1 className="text-[40vw] text-display leading-none rotate-12">SHOPEE</h1>
        </div>
      )}

      <div className="max-w-md mx-auto pt-12 px-5 relative z-10" style={{ paddingTop: 'calc(3rem + var(--safe-top))' }}>
        
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider backdrop-blur-xl transition-all border border-white/10"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
        </div>
        
        {settings.profile_image && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="mb-8 text-center"
          >
            <img 
              src={settings.profile_image} 
              alt="Foto de perfil" 
              className="w-24 h-24 mx-auto rounded-full object-cover border-4"
              style={{ borderColor: themeColor }}
            />
          </motion.div>
        )}

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
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="mb-10 relative"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-4 py-2 rounded-full" style={{ backgroundColor: `${themeColor}20`, border: `1px solid ${themeColor}40` }}>
                  <span className="w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_currentColor]" style={{ backgroundColor: themeColor, boxShadow: `0 0 10px ${themeColor}` }} />
                  <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: themeColor }}>Ao Vivo</span>
                </div>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <ShoppingBag size={12} className="text-white/60" />
                <span className="text-[8px] font-bold text-white/60 uppercase">{items.length} produtos</span>
              </div>
            </div>

            <h1 className="text-white font-black text-4xl tracking-tighter uppercase leading-[0.9] mb-3">
               {userId.includes('_') ? (
                  <>
                    <span>{userId.split('_')[0]}</span>
                    <span className="italic" style={{ color: themeColor }}>_{userId.split('_').slice(1).join('_')}</span>
                  </>
               ) : userId.includes('-') ? (
                  <>
                    <span>{userId.split('-')[0]}</span>
                    <span className="italic" style={{ color: themeColor }}>-{userId.split('-').slice(1).join('-')}</span>
                  </>
               ) : (
                  <span style={{ color: themeColor }}>@{userId}</span>
               )}
            </h1>

            <p className="text-white/50 text-xs font-medium leading-relaxed mb-6">
              ⚡ Seleção <span className="font-bold text-white" style={{ color: themeColor }}>exclusiva</span> de produtos virais testados e approvalados pela nossa triagem rigorosa.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-white/50 text-[9px] font-bold uppercase tracking-wider">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${themeColor}20` }}>
                  <Check size={10} style={{ color: themeColor }} />
                </div>
                <span>Originais</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2 text-white/50 text-[9px] font-bold uppercase tracking-wider">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${themeColor}20` }}>
                  <Zap size={10} style={{ color: themeColor }} />
                </div>
                <span>Flash</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2 text-white/50 text-[9px] font-bold uppercase tracking-wider">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${themeColor}20` }}>
                  <Sparkles size={10} style={{ color: themeColor }} />
                </div>
                <span>Premium</span>
              </div>
            </div>
          </motion.div>
        )}

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
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-white font-black uppercase text-[10px] tracking-wider truncate group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h3>
                      {item.price && (
                        <span className="shrink-0 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">
                          {item.price}
                        </span>
                      )}
                    </div>
                    <p className="text-white/40 text-[8px] font-mono truncate">shope.ee/link_oficial</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-[11px] font-black" style={{ color: themeColor }}>
                        RESGATAR <ArrowUpRight size={12} />
                      </div>
                      <button 
                        onClick={(e) => handleShare(item, e)}
                        className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
                      >
                        <Share2 size={14} /> COMPARTILHAR
                      </button>
                    </div>
                  </div>
                </motion.a>
              ))}
            </AnimatePresence>
          </div>
        ) : (
<div className="grid grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => {
                const priceValue = item.price ? parseFloat(item.price.replace('R$', '').replace(',', '.')) : 0;
                const hasDiscount = priceValue > 0;
                const originalPrice = hasDiscount ? priceValue * 1.5 : priceValue;
                const discountPercent = hasDiscount ? 30 : 0;
 
                return (
                  <motion.a
                    href={item.affiliate_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15, delay: i * 0.08 }}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative flex flex-col overflow-hidden transition-all duration-300"
                    style={{ backgroundColor: '#0a0a0a', borderRadius: '1.25rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)' }}
                  >
                    <div className="relative w-full aspect-[3/4] overflow-hidden" style={{ backgroundColor: '#080808' }}>
                      <OptimizedImage src={item.image_url} alt={item.title} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      
                      <div className="absolute top-2 left-2">
                        <div className="px-2.5 py-1 text-white text-[7px] font-black uppercase tracking-widest rounded-md flex items-center gap-1" style={{ backgroundColor: themeColor, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                          <Zap size={8} className="fill-current" /> SELEÇÃO
                        </div>
                      </div>

                      {hasDiscount && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-[7px] font-black uppercase tracking-widest rounded-md flex items-center gap-1 animate-pulse">
                          <Tag size={8} /> -{ discountPercent }%
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                        <div className="flex items-center gap-1.5 text-white/70 text-[8px] font-medium">
                          <Flame size={10} className="animate-pulse" />
                          <span className="tracking-wide">Estoque LIMITADO</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 flex flex-col gap-2">
                      <h3 className="text-white font-semibold text-[9px] uppercase tracking-wide line-clamp-2 leading-tight">
                        {item.title}
                      </h3>

                      <div className="flex items-end justify-between">
                        <div className="flex flex-col">
                          {hasDiscount && (
                            <span className="text-white/40 text-[8px] line-through font-medium">
                              R$ {originalPrice.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                          <span className="text-white text-lg font-black tracking-tight">
                            {item.price || 'R$ 0,00'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <div className="flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-white text-[9px] font-black uppercase tracking-wider transition-all" style={{ backgroundColor: themeColor }}>
                          Comprar <ArrowRight size={11} />
                        </div>
                      </div>

                      <button 
                        onClick={(e) => handleShare(item, e)}
                        className="w-full py-2 rounded-lg flex items-center justify-center gap-1.5 text-white/40 text-[8px] font-bold uppercase tracking-wider hover:text-white transition-colors"
                        style={{ border: '1px dashed rgba(255,255,255,0.08)' }}
                      >
                        <Share2 size={12} /> Indicar
                      </button>
                    </div>
                  </motion.a>
                );
              })}
            </AnimatePresence>
          </div>
        )}
        
        {items.length === 0 && !loading && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }}
             className="text-center py-20 border-dashed opacity-40"
             style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px dashed rgba(255,255,255,0.08)`, borderRadius: '2.5rem' }}
           >
             <ShoppingBag size={48} className="mx-auto mb-4" style={{ color: themeColor }} />
             <p className="font-black text-[10px] uppercase tracking-[0.2em]">Vitrine Vazia</p>
             <p className="text-[10px] text-slate-500 mt-2">Aguardando curadoria de produtos...</p>
             <p className="text-[8px] text-slate-600 mt-4 font-mono">userId: {userId}</p>
           </motion.div>
        )}
        
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
