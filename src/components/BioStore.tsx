import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Zap, ArrowUpRight, Sparkles, ArrowLeft, Share2, Check, Tag, Flame, Clock, ArrowRight, ChevronRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { generateWhatsappMessage } from '../utils/shareUtils';
import { sanitizeShopeeLink } from '../utils/shopeeLinkUtils';

interface BioStoreProps {
  userId: string;
  onGoBack?: () => void;
}

interface BioItem {
  id: string;
  title: string;
  image_url: string;
  affiliate_link: string;
  price?: string;
  price_before_discount?: string;
  discount?: string;
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

export const BioStore: React.FC<BioStoreProps> = ({ userId, onGoBack }) => {
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

      {/* Modern Header Section */}
      <div className="max-w-md mx-auto pt-16 px-6 relative z-10" style={{ paddingTop: 'calc(2rem + var(--safe-top))' }}>
        
        {onGoBack && (
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={onGoBack}
              className="flex items-center gap-2 px-4 py-2 rounded-full premium-glass hover:bg-emerald-500 hover:text-black font-bold text-[10px] uppercase tracking-wider shadow-lg transition-all"
            >
              <ArrowLeft size={16} />
              Voltar ao App
            </button>
          </div>
        )}
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 relative"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex flex-col items-center gap-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                STATUS: OPERACIONAL
              </span>
            </div>

            {settings.profile_image ? (
              <div className="relative mb-6">
                <motion.img 
                  initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                  src={settings.profile_image} 
                  alt="Profile" 
                  className="w-24 h-24 mx-auto rounded-full object-cover border-4 shadow-2xl"
                  style={{ borderColor: themeColor }}
                />
                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1.5 shadow-lg border-2 border-black">
                  <Zap size={12} fill="currentColor" />
                </div>
              </div>
            ) : (
              <div className="mb-6 w-20 h-20 mx-auto rounded-full flex items-center justify-center premium-glass" style={{ borderColor: `${themeColor}44` }}>
                <ShoppingBag size={32} style={{ color: themeColor }} />
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-black tracking-tighter text-white lowercase">
                {userId}
              </h1>
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest">
                PRO
              </div>
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-3 h-3 text-white fill-current"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </div>
            </div>
            
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full premium-glass-light mb-8">
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest" style={{ color: themeColor }}>
                <Sparkles size={10} /> Curadoria Oficial
              </span>
              <div className="w-1 h-1 rounded-full bg-slate-700" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {items.length} Ofertas Ativas
              </span>
            </div>
            
            <p className="max-w-[280px] mx-auto text-slate-400 text-[11px] leading-relaxed font-medium">
              Links oficiais e seguros da Shopee. <br/>
              <span className="text-white font-bold mt-2 inline-block">Toque no produto para garantir o menor preço.</span>
            </p>
          </div>
        </motion.div>

        {/* Product Layout */}
        <div className={settings.layout_type === 'list' ? 'space-y-4' : 'fragment-grid'}>
          <AnimatePresence mode="popLayout">
            {items.map((item, i) => {
              const rotation = (i % 2 === 0 ? 0.5 : -0.5) * (Math.random() * 1);
              const isLarge = settings.layout_type === 'grid' && i % 5 === 0;

              return (
                <motion.a
                  href={item.affiliate_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={item.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1, rotate: settings.layout_type === 'grid' ? rotation : 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.03, rotate: 0, zIndex: 20 }}
                  whileTap={{ scale: 0.97 }}
                  className={`group relative flex overflow-hidden transition-all duration-300 premium-glass ${
                    settings.layout_type === 'list' 
                      ? 'flex-row items-center gap-4 p-3' 
                      : `flex-col ${isLarge ? 'item-span-2' : ''}`
                  }`}
                  style={{ borderRadius: cardRadius }}
                >
                  {/* Badges */}
                  <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-1">
                    {item.discount ? (
                      <div className="bg-[#EE4D2D] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg animate-pulse">
                        {item.discount} OFF
                      </div>
                    ) : i === 0 && (
                      <div className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg animate-bounce">
                        MELHOR PREÇO
                      </div>
                    )}
                    {settings.layout_type === 'grid' && (
                      <div className="bg-black/40 backdrop-blur-md text-white/60 text-[8px] font-black px-1.5 py-0.5 rounded-md border border-white/5">
                        {item.price ? `${Math.floor(Math.random() * 40 + 60)} Vendidos` : ''}
                      </div>
                    )}
                  </div>

                  {/* Image */}
                  <div className={`relative shrink-0 overflow-hidden ${
                    settings.layout_type === 'list' 
                      ? 'w-24 h-24' 
                      : `w-full ${isLarge ? 'aspect-[16/9]' : 'aspect-square'}`
                  }`} style={{ borderRadius: settings.layout_type === 'list' ? `calc(${cardRadius} - 8px)` : '0' }}>
                    <OptimizedImage src={item.image_url} alt={item.title} />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  
                  {/* Content */}
                  <div className={`flex-1 min-w-0 ${settings.layout_type === 'list' ? 'pr-2' : 'p-4'}`}>
                    <h3 className={`text-white font-bold tracking-tight mb-2 line-clamp-2 uppercase group-hover:text-emerald-400 transition-colors ${
                      settings.layout_type === 'list' ? 'text-[11px]' : 'text-[10px]'
                    }`}>
                      {item.title}
                    </h3>

                    {(item.discount || item.price_before_discount) && (
                      <div className="bg-[#EE4D2D] text-white py-0.5 px-2 flex items-center gap-1 mb-2 rounded-sm w-fit animate-pulse">
                        <Zap size={10} fill="currentColor" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Ofertas Relâmpago</span>
                      </div>
                    )}
                    
                    <div className={`flex items-end justify-between gap-2 ${settings.layout_type === 'grid' ? 'mt-2' : ''}`}>
                      <div className="flex flex-col">
                        {item.price_before_discount ? (
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter line-through opacity-50">
                            R$ {item.price_before_discount}
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter line-through opacity-50">
                            R$ {(parseFloat(item.price?.replace(',','.') || '0') * 1.4).toFixed(2).replace('.',',')}
                          </span>
                        )}
                        <span className={`${settings.layout_type === 'list' ? 'text-lg' : 'text-xl'} font-black leading-none`} style={{ color: themeColor }}>
                           {item.price?.includes('R$') ? item.price : `R$ ${item.price || '0,00'}`}
                        </span>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5">
                        <div className={`flex items-center gap-1.5 rounded-lg bg-emerald-500 text-black font-black text-[10px] shadow-lg group-hover:bg-emerald-400 transition-all cta-pulse ${
                          settings.layout_type === 'list' ? 'px-3 py-1.5' : 'p-2'
                        }`}>
                          {settings.layout_type === 'list' ? 'APROVEITAR' : ''} <ArrowUpRight size={14} />
                        </div>
                      </div>
                    </div>

                    {settings.layout_type === 'grid' && (
                       <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity">
                         <span className="text-[8px] font-black tracking-widest uppercase text-slate-500 flex items-center gap-1">
                           <Zap size={10} style={{ color: themeColor }} /> OFICIAL SHOPEE
                         </span>
                         <button 
                            onClick={(e) => handleShare(item, e)}
                            className="p-1 hover:text-white transition-colors"
                          >
                            <Share2 size={14} />
                          </button>
                      </div>
                    )}
                  </div>

                  {settings.layout_type === 'list' && (
                    <button 
                      onClick={(e) => handleShare(item, e)}
                      className="absolute bottom-3 right-2 p-1 text-[9px] font-bold text-slate-500 hover:text-white transition-colors"
                    >
                      <Share2 size={12} />
                    </button>
                  )}
                </motion.a>
              );
            })}
          </AnimatePresence>
        </div>
        
        {items.length === 0 && !loading && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }}
             className="text-center py-20 premium-glass relative overflow-hidden"
             style={{ borderRadius: '2.5rem' }}
           >
             <div className="absolute inset-0 bg-emerald-500/5 backdrop-blur-3xl" />
             <div className="relative z-10">
               <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" style={{ color: themeColor }} />
               <p className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">Vitrine Vazia</p>
               <p className="text-[10px] text-slate-600 mt-2">Aguardando curadoria de produtos...</p>
             </div>
           </motion.div>
        )}
        
        <motion.div 
           initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
           className="mt-24 pt-12 text-center flex flex-col items-center gap-4 border-t border-white/5"
         >
           <div className="flex items-center gap-2 text-[9px] tracking-[0.4em] font-black uppercase text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              SISTEMA OFICIAL VERIFICADO
           </div>
           <p className="text-[8px] font-bold opacity-30 uppercase tracking-tighter">
             &copy; 2026 Agentes Shop . Todos os direitos reservados
           </p>
        </motion.div>
      </div>
    </div>
  );
};
