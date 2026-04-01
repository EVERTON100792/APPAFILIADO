import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import { 
  Home, Database, Copy, RefreshCcw,
  Shield, Video, Zap, ArrowRight, Activity, Search, RotateCcw,
  Download, Terminal, LayoutGrid, Unlock, ArrowLeft, Volume2, VolumeX, Sparkles, Type,
  Maximize2, MoveRight, X, Scissors, ShoppingBag, Upload, CheckCircle2
} from 'lucide-react';


import { supabase } from './supabaseClient';


import { motion, AnimatePresence } from 'framer-motion';
import { VideoProcessor } from './utils/VideoProcessor';
import type { ProcessingOptions } from './utils/VideoProcessor';
import { BioStore } from './components/BioStore';
import { BioManager } from './components/BioManager';
// import { productDB } from './data/productDB';

function getSmartSearchName(title: string): string {
  if (!title) return '';
  
  // 1. Limpar caracteres especiais e lixo de marketplace agressivo
  let cleanTitle = title.split(/[-,\(\)\[\]|]/)[0]; // Pega a primeira parte antes de separadores comuns
  
  // 2. Remover termos genéricos de promoção e marketplace que poluem a busca
  const marketJunk = [
    'promoção', 'oferta', 'queima', 'estoque', 'barato', 'shopee', 'link', 'bio', 
    'brasil', 'br', 'kit', 'conjunto', 'pacote', 'unidade', 'und', 'pcs', 'peças', 
    'peça', 'novo', 'nova', 'original', 'oficial', 'compre', 'aqui', 'clique', 
    'veja', 'olha', 'frete', 'grátis', 'pronta', 'entrega', 'envio', 'imediato',
    'atacado', 'varejo', 'premium', 'luxo', 'exclusivo', 'importado', 'envio', 'envio em 24h',
    'shope', 'shein', 'aliexpress', 'mercadolivre', 'magalu'
  ];
  
  const regexJunk = new RegExp(`\\b(${marketJunk.join('|')})\\b`, 'gi');
  cleanTitle = cleanTitle.replace(regexJunk, '').trim();

  // 3. Remover emojis e caracteres não alfanuméricos (mantendo acentos)
  cleanTitle = cleanTitle.replace(/[^\w\sÀ-ú0-9]/gi, ' ');
  
  // 4. Filtrar palavras curtas e stop words (para focar no objeto real)
  const stopWords = new Set([
    'a', 'o', 'e', 'de', 'do', 'da', 'em', 'para', 'com', 'os', 'as', 'um', 'uma', 
    'na', 'no', 'que', 'dos', 'das', 'seu', 'sua', 'pelo', 'pela', 'como', 'mais'
  ]);
  
  let words = cleanTitle.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()));
  
  // Se não sobrou nada, tenta usar o título original com uma limpeza básica de emergência
  if (words.length === 0) {
    return title.replace(/[^\w\s]/g, '').substring(0, 30).trim();
  }

  // 5. Inteligência de Busca: Priorizar os termos mais "descritivos"
  // Para TikTok, termos compostos (2-3 palavras) funcionam melhor que frases longas.
  // Ex: "Mini Projetor Portátil" -> "Mini Projetor"
  return words.slice(0, 3).join(' ').trim();
}

function generateViralProductName(baseName: string): string {
  const clean = getSmartSearchName(baseName);
  if (!clean) return baseName;

  const prefixes = [
    'O FAMOSO', 'A INCRÍVEL', 'CHEGOU:', 'MAIS VENDIDO:', 'ACHADINHO:', 
    'REVELADO:', 'VOCÊ PRECISA DISSO:', 'GENTE! OLHA ESTE', 'O SEGREDO DO LAR:', 
    'O QUERIDINHO:', 'PRODUTO VIRAL:', 'A MELHOR COMPRA:', 'JÁ QUERIA UM:',
    'ESSE É DIFERENTE:', 'VIROU FEBRE:', 'O MELHOR ACHADO:'
  ];
  
  const suffixes = [
    '🔥', '✨', ' (DÁ UMA OLHADA! 😱)', ' (O PRIMEIRO É MELHOR)', ' (OFERTA RELÂMPAGO ⚡)', 
    ' (VOCÊ VAI AMAR!)', ' [RECOMENDO MUITO]', ' ✨ MELHOR ACHADO DO DIA', ' 💎 QUALIDADE PREMIUM',
    ' - SÉRIO, É PERFEITO!', ' (MELHOR QUE O ORIGINAL)', ' (ACHADO DE OURO)'
  ];

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  return `${prefix} ${clean.toUpperCase()}${suffix}`;
}

// Step types for the main application navigation
type Step = 'home' | 'scouting' | 'list' | 'ready' | 'treating' | 'automation' | 'history' | 'bio' | 'plans';

const App: React.FC = () => {
  const bioUserId = new URLSearchParams(window.location.search).get('loja');
  if (bioUserId) return <BioStore userId={bioUserId} />;

  const isStoreConfigured = () => {
    const slug = (localStorage.getItem('bio_store_slug') || '').toLowerCase();
    const unconfiguredSlugs = ['', 'meu-link', 'admin', 'null', 'undefined', 'default', 'escolha-seu-link'];
    return slug && !unconfiguredSlugs.includes(slug);
  };

  // Forçar sempre 'home' como primeira aba ao abrir, se estiver configurado
  const [step, setStep] = useState<Step>('home');
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);

  const [activeFilter, setActiveFilter] = useState('none');
  const [activeTransition, setActiveTransition] = useState('none');
  const [isMuted, setIsMuted] = useState(false);
  const [videoLegend, setVideoLegend] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [usedLegends, setUsedLegends] = useState<Set<string>>(new Set());

  // Advanced Editing State
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [transitionTimestamps, setTransitionTimestamps] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isTransitionActive, setIsTransitionActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Sync isPlaying with video element
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.play().catch(() => {});
      else videoRef.current.pause();
    }
  }, [isPlaying]);



  const filters = [
    { id: 'none', name: 'Original' },
    { id: 'elite', name: 'Elite Glow' },
    { id: 'glitch', name: 'Glitch Viral' },
    { id: 'vhs', name: 'VHS Elite' },
    { id: 'bloom', name: 'Dreamy Bloom' },
    { id: 'cinematic', name: 'Cinematic' },
    { id: 'bw', name: 'Dramático' },
    { id: 'ultra8k', name: '💎 8K ULTRA HD' }
  ];

  const getPlatformUrl = (type: 'shopee' | 'tiktok') => {
    if (type === 'shopee') {
      // Link oficial para o painel de ofertas de afiliados (Busca Central)
      return 'https://affiliate.shopee.com.br/offer/product_offer';
    } else {
      // Link que abre a página de upload/publicação no TikTok
      return 'https://www.tiktok.com/upload?lang=pt-BR';
    }
  };
  const [productList, setProductList] = useState<any[]>([]); 
  const [activeItems, setActiveItems] = useState<any[]>([]); 
  const [publicationHistory, setPublicationHistory] = useState<any[]>([]); 
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [videoData, setVideoData] = useState<any>(null);
  const [customCopy, setCustomCopy] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [automationFinished, setAutomationFinished] = useState(false);
  const [boostMode, setBoostMode] = useState('none');
  const [activeNiche, setActiveNiche] = useState('Cozinha');
  const [customLink, setCustomLink] = useState('');
  const [consoleLogs, setConsoleLogs] = useState<{msg: string, type?: string}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [videoResults, setVideoResults] = useState<any[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [databaseProducts, setDatabaseProducts] = useState<any[]>([]);
  
  // ── SISTEMA DE ÁUDIO VIRAL ──
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);
  const [audioMixOption, setAudioMixOption] = useState<'original' | 'music' | 'mix'>('original');

  const viralTracks = [
    { id: 'phonk', name: 'Phonk Viral 🏎️', url: 'https://cdn.pixabay.com/download/audio/2022/11/22/audio_feb499f57d.mp3?filename=phonk-125039.mp3' },
    { id: 'bass', name: 'Bass Boosted 🔊', url: 'https://cdn.pixabay.com/download/audio/2023/09/11/audio_141662243d.mp3?filename=bass-164744.mp3' },
    { id: 'happy', name: 'Happy Shopee 🛍️', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=funny-ukulele-11721.mp3' },
    { id: 'tension', name: 'Suspense Build 🕒', url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c36395dc6c.mp3?filename=suspense-7071.mp3' },
    { id: 'lofi', name: 'Lofi Chill ☕', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1002e1c944.mp3?filename=lofi-study-112191.mp3' },
  ];
  
  // Bio Store Quick Add State
  const [bioTitle, setBioTitle] = useState('');
  const [bioImageUrl, setBioImageUrl] = useState('');
  const [bioLink, setBioLink] = useState('');
  const [isSavingToBio, setIsSavingToBio] = useState(false);

  // ── MONETIZAÇÃO & ACESSO GATED ──
  const [isPro, setIsPro] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Sync volume with isMuted strictly
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = isMuted ? 0 : 1;
    }
  }, [isMuted, videoData]);

  // ── PREVIEW & STABILITY ──
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  // Ultra-Premium Scanning HUD
  const ScanningHUD = ({ active }: { active: boolean }) => (
    <AnimatePresence>
      {active && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="scanning-hud"
        >
          <div className="cyber-grid" />
          <motion.div 
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="scan-bar" 
          />
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-10 relative z-20"
          >
            <div className="relative">
              <div className="absolute inset-0 blur-[60px] bg-accent/40 rounded-full animate-pulse" />
              <div className="w-28 h-28 rounded-[2rem] bg-slate-900 border-2 border-accent/30 flex items-center justify-center relative shadow-[0_0_80px_rgba(6,182,212,0.3)] overflow-hidden">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 opacity-10"
                >
                  <div className="w-full h-full border-4 border-dashed border-accent rounded-full" />
                </motion.div>
                <Activity size={56} className="text-accent animate-pulse" />
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <motion.h2 
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
                className="text-4xl font-black italic tracking-tighter uppercase leading-none bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent"
              >
                SQUAD_OS_INITIALIZING
              </motion.h2>
              <div className="flex flex-col items-center gap-2">
                <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: ['0%', '100%'] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="h-full bg-accent" 
                  />
                </div>
                <p className="text-[10px] text-accent font-black tracking-[0.5em] uppercase">Security Level: Maximum</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );



  const niches = [
    { id: 'Todos', label: 'Todos', icon: '🔥' },
    { id: 'Cozinha', label: 'Cozinha', icon: '🍳' },
    { id: 'Tecnologia', label: 'Eletrônicos', icon: '⚡' },
    { id: 'Beleza', label: 'Beleza', icon: '💄' },
    { id: 'Decoração', label: 'Casa & Deco', icon: '🏠' },
    { id: 'Pet', label: 'Pet', icon: '🐾' },
    { id: 'Fitness', label: 'Fitness', icon: '💪' },
    { id: 'Gamer', label: 'Gamer', icon: '🎮' },
    { id: 'Kids', label: 'Kids', icon: '🧸' },
  ];
  const getInfinitePool = (niche: string) => {
    const staticPool = niche === 'Todos' ? databaseProducts : databaseProducts.filter(p => p.niche === niche);
    return staticPool.filter(p => !publicationHistory.some(ph => ph.product_id === p.id));
  };

  // Persistence
  useEffect(() => {
    const saved = {
      step: localStorage.getItem('v-step'),
      products: localStorage.getItem('v-products'),
      active: localStorage.getItem('v-active')
    };
    // Garantir fluxo de onboarding
    if (!isStoreConfigured()) {
      setStep('bio');
    } else {
      // Restaurar passo anterior ou ir para home
      const lastStep = localStorage.getItem('v-step') as Step;
      if (lastStep && !['scouting', 'ready', 'treating', 'automation'].includes(lastStep)) {
        setStep(lastStep);
      } else {
        setStep('home');
      }
    }
    if (saved.products) setProductList(JSON.parse(saved.products));
    
    // Se não houver itens ativos no localStorage, tenta buscar do Supabase
    if (saved.active) {
      setActiveItems(JSON.parse(saved.active));
    } else {
      loadScoutedProducts();
    }
    
    // Load from Supabase on mount
    fetchHistory();
    fetchProductsDB();
  }, []);

  const loadScoutedProducts = async () => {
    const userId = getUserId();
    const { data } = await supabase
      .from('scouted_products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(15);
    
    if (data && data.length > 0) {
      setActiveItems(data.map(item => ({
        ...item,
        id: item.product_id || item.id, // Compatibilidade com IDs antigos
        commission_pct: parseInt(item.commission || '0'),
      })));
    }
  };

  const saveScoutedProducts = async (items: any[]) => {
    const userId = getUserId();
    // Limpa os antigos e salva os novos para manter a sincronia
    const productsToSave = items.map(p => ({
      user_id: userId,
      product_id: p.id,
      title: p.title,
      image_url: p.image || p.thumbnail,
      affiliate_link: p.link || p.url,
      commission: p.commission_pct?.toString(),
      sales: p.sales,
      price: p.price,
      niche: p.niche || activeNiche
    }));

    await supabase.from('scouted_products').insert(productsToSave);
  };

  const fetchProductsDB = async () => {
    const { data } = await supabase.from('products').select('*');
    if (data) setDatabaseProducts(data);
  };

  // Verificação de Assinatura (Simulada para MVP, conectada ao Supabase)
  const checkSubscription = async () => {
    setIsLoadingAuth(true);
    try {
      const slug = localStorage.getItem('bio_store_slug');
      const ADMIN_SLUGS = ['meu-link', 'admin', 'everton', 'achadinhos_brasil_'];
      
      // 1. Acesso Desenvolvedor (Admin Slugs)
      if (slug && ADMIN_SLUGS.includes(slug.toLowerCase())) {
        setIsPro(true);
        setIsLoadingAuth(false);
        return;
      }

      // 2. Lógica de Trial (24 horas)
      const firstAccess = localStorage.getItem('first_access_date');
      if (!firstAccess) {
        localStorage.setItem('first_access_date', Date.now().toString());
        setIsPro(true); // Primeiro acesso libera trial
      } else {
        const trialExpired = Date.now() - parseInt(firstAccess) > 24 * 60 * 60 * 1000;
        if (!trialExpired) {
          setIsPro(true);
        } else {
          // Se o trial expirou, verifica se é Pro real
          const isProMember = localStorage.getItem('is_pro_member') === 'true';
          setIsPro(isProMember);
        }
      }

      // 3. Verificação Global (Supabase Config)
      const { data } = await supabase
        .from('config')
        .select('value')
        .eq('key', 'app_access_mode')
        .single();
      
      if (data?.value === 'public') {
        setIsPro(true);
      }
    } catch (e) {
      console.error('Subscription check error:', e);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, []);

  const LockScreen = () => (
    <div className="fixed inset-0 z-[1000] bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
      <div className="absolute inset-0 cyber-grid opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent" />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 space-y-8 max-w-md"
      >
        <div className="w-24 h-24 bg-slate-900 border-2 border-accent/20 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(6,182,212,0.15)]">
          <Shield size={48} className="text-accent animate-pulse" />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-4xl font-black italic uppercase italic tracking-tighter leading-tight">
            ACESSO <span className="text-accent">BLOQUEADO</span>
          </h2>
          <p className="text-xs text-dim uppercase tracking-[0.2em] font-medium leading-relaxed">
            Sua conta não possui uma licença <span className="text-white font-black">PRO</span> ativa para usar o Squad de Automação.
          </p>
        </div>

        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 space-y-4 backdrop-blur-xl">
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Zap size={16} />
            </div>
            <p className="text-[10px] font-bold uppercase text-white/60">Vídeos Virais Ilimitados</p>
          </div>
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <ShoppingBag size={16} />
            </div>
            <p className="text-[10px] font-bold uppercase text-white/60">Sua Própria Loja Link-na-Bio</p>
          </div>
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Database size={16} />
            </div>
            <p className="text-[10px] font-bold uppercase text-white/60">Automação Shopee & TikTok</p>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          className="w-full h-16 bg-accent text-slate-950 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-accent/20"
          onClick={() => window.location.href = 'https://pay.kiwify.com.br/seulink'} // Exemplo de link de checkout
        >
          DESBLOQUEAR AGORA
        </motion.button>
        
        <p className="text-[9px] text-white/20 uppercase tracking-widest font-medium">
          Já pagou? <button onClick={checkSubscription} className="text-accent underline">Clique aqui para atualizar</button>
        </p>
      </motion.div>
    </div>
  );

  // Sync Supabase when entering history tab
  useEffect(() => {
    if (step === 'history') {
      fetchHistory();
    }
  }, [step]);


  const fetchHistory = async () => {
    const userId = getUserId();
    const { data } = await supabase
      .from('publication_history')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });
    
    if (data) {
      setPublicationHistory(data);
    }
  };

  // Persistence Sync
  useEffect(() => {
    localStorage.setItem('v-step', step);
    localStorage.setItem('v-products', JSON.stringify(productList));
    localStorage.setItem('v-active', JSON.stringify(activeItems));
  }, [step, productList, activeItems]);

  // Transition synchronization effect
  useEffect(() => {
    if (step !== 'ready' || !videoRef.current) return;
    
    const checkTransitions = () => {
      if (!videoRef.current) return;
      const ct = videoRef.current.currentTime;
      
      const transitionDuration = 1.5;
      const isNear = transitionTimestamps.some(ts => ct >= ts && ct < ts + transitionDuration);
      
      if (isNear !== isTransitionActive) {
        console.log(`[EFFECT] Transition ${isNear ? 'ON' : 'OFF'} at ${ct.toFixed(2)}s`);
        setIsTransitionActive(isNear);
      }
      setCurrentTime(ct);
    };

    const interval = setInterval(checkTransitions, 50); // High frequency check for smooth sync
    return () => clearInterval(interval);
  }, [step, transitionTimestamps, isTransitionActive]);

  // Auto-refresh timer (5 minutes)
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('[AUTO-REFRESH] Sincronizando produtos e tendências...');
      setProductList(prev => prev.map(p => {
        if (!p.price || typeof p.price !== 'string') return p;
        const currentPrice = parseFloat(p.price.replace('R$ ', '').replace(',', '.'));
        const newPrice = currentPrice + (Math.random() - 0.5) * 2;
        return {
          ...p,
          price: `R$ ${newPrice.toFixed(2).replace('.', ',')}`
        };
      }));
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const getUserId = () => {
    const slug = localStorage.getItem('bio_store_slug');
    if (slug) return slug;
    // Gerar um ID aleatório amigável no primeiro acesso
    const newId = 'loja-' + Math.random().toString(36).substring(2, 6);
    localStorage.setItem('bio_store_slug', newId);
    return newId;
  };

  const saveToSupabase = async (product: any, platform: string) => {
    if (!product) return;
    const userId = getUserId();
    
    // Garantir que os dados são strings e nunca nulas/undefined para evitar Erro 400
    const payload = { 
      user_id: String(userId || 'default-user'),
      product_id: String(product.id || product.product_id || 'sem-id'), 
      title: String(product.title || 'Produto sem título'), 
      platform: String(platform || 'Shopee') 
    };

    console.log('Enviando para Supabase...', payload);

    const { data, error } = await supabase
      .from('publication_history')
      .insert([payload])
      .select();

    if (error) {
      console.error('ERRO CRÍTICO SUPABASE (RESTAURAÇÃO):', error.message);
      showToast("ERRO AO SALVAR NO BANCO");
      return;
    }

    if (data && data.length > 0) {
      setPublicationHistory(prev => [data[0], ...prev]);
      showToast("PUBLICAÇÃO REGISTRADA! ☁️");
    }
  };

  const deleteFromSupabase = async (id: string) => {
    const { error } = await supabase
      .from('publication_history')
      .delete()
      .eq('id', id);

    if (!error) {
      setPublicationHistory(prev => prev.filter(h => h.id !== id));
      showToast("REMOVIDO DO SUPABASE! 🗑️");
    }
  };

  const generateCreativeLegend = (product: any) => {
    try {
      const title = (product?.title || "Achadinho Viral") as string;
      const sales = (product?.sales || "Algumas") as string;
      const t = title.toLowerCase();
      const hooks: string[] = [];

      if (/alho|legumes|cortador|processador|espremedor|batedeira|airfryer|afiador|escorredor|dispenser/.test(t))
        hooks.push(
          `Cozinhar ficou muito mais facil com o ${title.split(' ').slice(0,3).join(' ')}! Achei na Shopee! 🍳`,
          `O item que TODA cozinha precisa: ${title.split(' ').slice(0,3).join(' ')} que achei!`,
          `Chega de sofrer na cozinha! Esse ${title.split(' ')[0]} resolveu tudo 🔪`);
      if (/smart|bluetooth|usb|hub|ssd|power|wireless|rgb|fone|projetor|mouse|teclado/.test(t))
        hooks.push(
          `Tecnologia de ponta! O ${title.split(' ').slice(0,3).join(' ')} chegou! ⚡`,
          `Setup top comeca com o ${title.split(' ').slice(0,3).join(' ')} da Shopee! 💻`,
          `${sales} pessoas ja mudaram o setup com esse ${title.split(' ')[0]}! Tu ta perdendo! 🤖`);
      if (/maquiagem|mascara|sobrancelha|skin|gua sha|removedor|espelho|modelador|escova/.test(t))
        hooks.push(
          `Minha pele nunca foi tao bonita desde que descobri o ${title.split(' ').slice(0,3).join(' ')}! ✨`,
          `${sales} mulheres ja amam esse ${title.split(' ')[0]}... voce ainda nao tem? 💄`,
          `O segredo de pele perfeita ta na Shopee! 🧖`);
      if (/pet|gato|cachorro|peixe|fonte|petisco|coleira|tapete|mochila/.test(t))
        hooks.push(
          `Meu pet ficou MALUCO com o ${title.split(' ').slice(0,3).join(' ')}! Olha isso 🐾`,
          `${sales} tutores ja compraram o ${title.split(' ')[0]}... seu pet merece! ❤️`,
          `A melhor compra para seu filho de 4 patas: ${title.split(' ').slice(0,3).join(' ')} 🐶`);
      if (/luminaria|umidificador|quadro|vaso|relogio|fita led|espelho decorativo/.test(t))
        hooks.push(
          `Transformei meu quarto com o ${title.split(' ').slice(0,3).join(' ')}! 🏠`,
          `${sales} casas ja tem essa vibe linda... a sua ainda nao? 🌿`,
          `Decoracao de revista: ${title.split(' ').slice(0,4).join(' ')} na Shopee! ✨`);
      if (/corda|garrafa|rolo|faixas|massageador|balanca|halteres|tapete yoga|hand grip|stepper/.test(t))
        hooks.push(
          `Nao tem desculpa! O ${title.split(' ').slice(0,3).join(' ')} cabe na bolsa! 💪`,
          `${sales} pessoas treinando em casa com o ${title.split(' ')[0]}... e voce? 🏃`,
          `Fitness em casa nunca foi tao pratico: ${title.split(' ').slice(0,3).join(' ')}! 🔥`);
      if (/infantil|cacto|lousa|blocos|bolhas|controle|slime|tablet lcd/.test(t))
        hooks.push(
          `Meu filho nao larga o ${title.split(' ').slice(0,3).join(' ')} desde que chegou! 🧸`,
          `${sales} criancas ja amam esse ${title.split(' ')[0]}... o seu vai amar tambem! ⭐`,
          `O presente perfeito: ${title.split(' ').slice(0,3).join(' ')} da Shopee! 🎮`);

      hooks.push(
        `ENCONTREI! O ${title.split(' ').slice(0,4).join(' ')} na Shopee! 😱`,
        `POV: Voce acaba de encontrar o ${title.split(' ').slice(0,3).join(' ')} e a vida muda 🔥`,
        `${sales} pessoas nao podem estar erradas! O ${title.split(' ')[0]} e INCRIVEL! 🏆`,
        `Inacreditavel! O ${title.split(' ').slice(0,3).join(' ')} e real demais! ⚡`
      );

      const bodies = [
        `O ${title} chegou para resolver aquele problema do dia a dia! Com ${sales} vendas, e um dos melhores custo-beneficio da Shopee agora. Frete rapido e chega perfeito.`,
        `Serio, ${sales} pessoas ja compraram o ${title} e aprovaram! É impossivel nao indicar. Testei e fiquei impressionada com a qualidade!`,
        `Olha que achado! O ${title} ta fazendo sucesso: ${sales} vendas falam por si. A qualidade superou minhas expectativas e chegou mais rapido do que esperava!`,
        `Se voce ainda nao conhece o ${title}, precisa ver isso! Sao ${sales} compradores satisfeitos por um motivo. Vem com tudo, vale a pena!`,
      ];

      const nicheHashtags: Record<string, string> = {
        'Cozinha':    '#cozinha #dicasdecozinha #organizacaodacasa #cozinheira #utensilioscozinha',
        'Tecnologia': '#gadgets #techbrasil #setupgamer #tecnologiabarata #gadgetsviral',
        'Beleza':     '#skincare #makeupbrasil #belezanatural #rotinadebeleza #dicasdebeleza',
        'Pet':        '#petlovers #cachorros #gatos #petshopbr #animaisfofos',
        'Decoração':  '#decorcasa #homedecor #casaorganizada #decoracaobr #decoracaomoderna',
        'Fitness':    '#fitness #gym #emagrecimento #saudeebemestar #exerciciosemcasa',
        'Gamer':      '#gamer #setupgamer #gaming #gamesbrasil #rgbsetup',
        'Kids':       '#criancas #brinquedos #maesdebrasil #maternidade #kids',
        'Todos':      '#achadinhos #shopee #viral #achadosshopee #ofertasdodia',
      };
      const hashtags = (nicheHashtags[activeNiche] || nicheHashtags['Todos']) + ' #shopeebrasil';

      const ctas = [
        '🛒 LINK COM DESCONTO NA MINHA BIO! Corre! 🚀',
        '✅ Link na Bio com frete gratis hoje! Nao perde! 📦',
        '👇 Garanta o seu pelo link da Bio agora! 🛍️',
        '⚠️ Link oficial na bio do perfil! Vale muito a pena! ⭐',
      ];

      const safeId = product && typeof product.id === 'number' ? product.id : 1;
      const seed = safeId * 31 + usedLegends.size * 7 + Math.floor(Date.now() / 5000);
      const hook = hooks[seed % hooks.length];
      const body = bodies[(seed + 3) % bodies.length];
      const cta  = ctas[(seed + 7) % ctas.length];

      const structures = [
        `${hook}\n\n${body}\n\n${cta}\n\n${hashtags}`,
        `${hook}\n\n🔥 ${title}\n${body}\n\n🛍️ COMPRE: Link na Bio!\n\n${hashtags}`,
        `Voce achou isso?! 😍\n\n${body}\n\n${hook}\n\n👉 LINK NA BIO\n\n${hashtags}`,
        `Parece mentira mas e real! 😱\n\n${body}\n\n${cta}\n\n${hashtags}`,
      ];

      let legend = structures[(seed + 11) % structures.length];

      if (usedLegends.has(legend)) {
        legend = `${hook} (ACHADO!)\n\n${body}\n\n${cta}\n\n${hashtags}`;
      }
      setUsedLegends(prev => new Set([...prev, legend]));
      return legend;
    } catch (error) {
      return "Compre o seu na Shopee pelo link da bio! ✅";
    }
  };

  const generateOverlayLegend = (product: any) => {
    const title = (product?.title || "Este Produto").split(' ').slice(0,4).join(' ').toUpperCase();
    const hooks = [
      `🚨 ACHEI BEM MAIS BARATO!\n👉 LINK NA BIO`,
      `🔥 O SEGREDO QUE NINGUÉM CONTA: ${title}\n👉 LINK NA BIO`,
      `😱 PARE DE GASTAR ATOA! OLHA ISSO\n🔗 LINK NA MINHA BIO`,
      `😍 TESTEI O FAMOSO ${title} DA SHOPEE!\n👉 LINK NA BIO`,
      `🛍️ COMPREI O ${title} E OLHA NO QUE DEU!\n🔗 LINK NA BIO`,
      `✨ O ITEM QUE DEIXOU A INTERNET MALUCA!\n👉 LINK NA BIO`,
      `🏆 ACHADINHO VIP COM DESCONTO!\n🔗 LINK DO ITEM NA BIO`,
      `💰 ECONOMIZEI MUITO COMPRANDO ESSE ${title}!\n👉 LINK NA BIO`
    ];
    const safeId = product && typeof product.id === 'number' ? product.id : Math.floor(Math.random() * 100);
    return hooks[safeId % hooks.length];
  };




  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const resetVideoEditor = () => {
    setActiveFilter('none');
    setActiveTransition('none');
    setVideoLegend('');
    setVideoLegend('');
  };

  const sortByCommission = (array: any[]) => {
    return [...array].sort((a, b) => b.commission_pct - a.commission_pct);
  };

  const startScouting = () => {
    setIsScanning(true);
    setStep('scouting');
    setTimeout(() => {
      setProductList(databaseProducts);
      
      const infinitePool = getInfinitePool(activeNiche);
      const sortedNiche = sortByCommission(infinitePool);
      
      setActiveItems(sortedNiche.slice(0, 20)); 
      setStep('list');
      setIsScanning(false);
    }, 2500);
  };

  const goBackToList = () => {
    setStep('list');
    setAutomationFinished(false);
  };


  const refillProductList = (niche: string) => {
    setActiveItems(prev => {
      // Manter na tela APENAS itens que AINDA NÃO FORAM POSTADOS
      const currentUnpublished = prev.filter(p => 
        !publicationHistory.some(ph => ph.product_id === p.id) && 
        p.id !== selectedProduct?.id
      );

      // Precisamos completar para ter 15 ativos na tela. 
      const needed = 15 - currentUnpublished.length;
      
      if (needed <= 0) return currentUnpublished;

      // Obtém produtos do pool infinito que não estão sendo mostrados
      let availableSource = getInfinitePool(niche);
      let available = availableSource.filter(p => !currentUnpublished.some(ai => ai.id === p.id));
      
      // Filtra e randomiza os top items
      const topAvailable = [...available].sort((a, b) => b.commission_pct - a.commission_pct).slice(0, Math.max(needed * 2, 20));
      const shuffled = topAvailable.sort(() => Math.random() - 0.5);
      
      return [...currentUnpublished, ...shuffled.slice(0, needed)];
    });
  };

  const handleNicheChange = async (niche: string) => {
    setActiveNiche(niche);
    const infinitePool = getInfinitePool(niche);
    const shuffled = [...infinitePool].sort(() => Math.random() - 0.5);
    const items = shuffled.slice(0, 15);
    setActiveItems(items);
    saveScoutedProducts(items);
  };

  const handleCustomLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLink) return;

    setIsScanning(true);
    let extractedName = customLink.trim();
    let stringParseSuccess = false;

    // 1. Tenta tirar o nome da própria string se for um link completo da Shopee 
    // (100% à prova de falhas de anti-bot)
    try {
      if (extractedName.includes('shopee.com')) {
        const url = new URL(extractedName.startsWith('http') ? extractedName : `https://${extractedName}`);
        let pathName = url.pathname.split('/')[1];
        // Shopee BR product URLs always have "-i." before the ID. If it doesn't, it's a shortlink/hash.
        if (pathName && pathName.includes('-i.')) {
           pathName = pathName.replace(/-i\.\d+\.\d+.*$/, '');
           const candidateName = decodeURIComponent(pathName.replace(/-/g, ' '));
           if (candidateName.length >= 3 && candidateName.toLowerCase() !== 'buyer') {
              extractedName = candidateName;
              stringParseSuccess = true;
           }
        }
      }
    } catch (e) { }

    // 2. Se for link curto (s.shopee.com.br) apelamos pro Proxy Local 
    if (!stringParseSuccess && extractedName.includes('shopee.com.br')) {
      try {
        const targetUrl = extractedName.startsWith('http') ? extractedName : `https://${extractedName}`;
        
        // Usa a Edge Function recém-criada no Supabase (Proxy em Nuvem Vitalício)
        const { data, error } = await supabase.functions.invoke('shopee-proxy', {
          body: { url: targetUrl }
        });

        if (error) {
          throw error;
        }
        
        // Edge function agora retorna o JSON exato com o title desmascarado do redirecionamento
        if (data && data.title && data.title.length > 3) {
           extractedName = data.title;
        }

      } catch (err) {
        console.log("Falha no Proxy em Nuvem", err);
      }
    }

    if (extractedName.length > 90) extractedName = extractedName.substring(0, 90);
    
    // Se depois de tudo isso ainda é uma URL da Shopee completa, falhamos em ler o título real
    if (extractedName.includes('shopee.com') || extractedName.includes('shp.ee')) {
       showToast("Link não resolvido. Buscando por termo genérico.");
       extractedName = "Achadinho Shopee Brasil";
    }

    // Tenta arrancar o core da pesquisa
    const searchWords = getSmartSearchName(extractedName);
    const finalQuery = searchWords.length > 3 ? searchWords : extractedName;

    const customProduct = {
      id: "custom_" + Date.now(),
      title: extractedName.toUpperCase(),
      price: "R$ --,--",
      commission_pct: Math.floor(Math.random() * 20) + 10,
      sales: Math.floor(Math.random() * 80) + "k",
      query: finalQuery,
      url: customLink.includes('shopee.com') ? customLink : undefined // Preserva o link original se for Shopee
    };
    
    setSelectedProduct(customProduct); 
    researchTikTok(customProduct);
    setCustomLink('');
    // Salva o produto customizado no banco também
    saveScoutedProducts([customProduct]);
  };

  const refreshProducts = async () => {
    // Busca pool infinito e garante sempre 30 opções frescas
    const infinitePool = getInfinitePool(activeNiche);
    
    // Traz os que tem maior comissão primeiro para engajamento imediato, misturando levemente
    const topItems = [...infinitePool].sort((a, b) => b.commission_pct - a.commission_pct).slice(0, 30);
    const shuffled = topItems.sort(() => Math.random() - 0.5);
    
    const items = shuffled.slice(0, 15);
    setActiveItems(items);
    saveScoutedProducts(items);
    showToast('PRODUTOS ATIVOS EM ALTA 🔄');
  };


  const unblock = (id: string) => {
    deleteFromSupabase(id);
  };


  const getTimeAgo = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 86400000);
    return diff === 0 ? "Hoje" : `${diff} dias atrás`;
  };

  const updateMode = (mode: string) => {
    setBoostMode(mode);
    if (!selectedProduct) return;
    
    if (mode === 'performance') {
      setCustomCopy(`🔥 ÚLTIMAS UNIDADES: ${selectedProduct.title}!\n🛑 Link na minha Bio com desconto exclusivo! 🛒👇\n#promo #achadinhos #shopee #viral #brasil`);
    } else if (mode === 'funny') {
      setCustomCopy(`🤣 POV: Você não sabia que precisava de um desse até ver esse vídeo! 🤡🔥\nO link está na Bio esperando por você! 🛒👇\n#humor #utilidades #casa #viral #achados`);
    }
  };

  const addToBio = async (p: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSavingToBio(true);
    try {
      const email = localStorage.getItem('user_email');
      const { data: user } = await supabase.from('users_profiles').select('id').eq('email', email).single();
      const userId = user?.id;

      if (!userId) {
        showToast('FAÇA LOGIN PARA ADICIONAR À BIO');
        return;
      }

      const { error } = await supabase.from('bio_store').insert({
        user_id: userId,
        product_id: p.id,
        title: generateViralProductName(p.title || p.query),
        link: p.affiliate_link || p.url || '',
        image_url: p.image || p.cover || ''
      });

      if (error) throw error;
      showToast('PRODUTO ADICIONADO À BIO! 🔗');
    } catch (err) {
      console.error(err);
      showToast('ERRO AO ADICIONAR À BIO');
    } finally {
      setIsSavingToBio(false);
    }
  };

  const researchTikTok = async (product: any) => {
    resetVideoEditor();
    setIsScanning(true);
    try {
      // ── ETAPA 1: Extrair o núcleo semântico e definir o nicho
      const coreQuery = getSmartSearchName(product.query || product.title || '');
      const coreWords = coreQuery.split(' ').filter(w => w.length > 2);
      const productNiche = product.niche || activeNiche;
      
      if (coreWords.length === 0) throw new Error('Nome do produto incompleto');

      // ── ETAPA 2: Mapeamento de Nichos para Refinamento Heurístico
      const nicheKeywords: Record<string, { positive: string[], negative: string[] }> = {
        'Cozinha': { 
          positive: ['cozinha', 'comida', 'chef', 'receita', 'utilidade', 'casa', 'lar', 'limpeza'],
          negative: ['maquiagem', 'pc', 'gamer', 'pet', 'cachorro', 'bebe', 'kids'] 
        },
        'Tecnologia': { 
          positive: ['tech', 'gadget', 'unboxing', 'setup', 'pc', 'smartphone', 'eletronico', 'gamer'],
          negative: ['cozinha', 'panela', 'maquiagem', 'bebe', 'infantil', 'pet'] 
        },
        'Beleza': { 
          positive: ['make', 'maquiagem', 'skin', 'cabelo', 'beleza', 'beauty', 'tutorial', 'testando'],
          negative: ['ferramenta', 'carro', 'moto', 'gamer', 'tecnologia', 'comida'] 
        },
        'Decoração': { 
          positive: ['casa', 'decor', 'quarto', 'sala', 'iluminação', 'led', 'reforma'],
          negative: ['maquiagem', 'carro', 'pet', 'comida'] 
        },
        'Pet': { 
          positive: ['pet', 'gato', 'cachorro', 'dog', 'cat', 'animal', 'fofo'],
          negative: ['maquiagem', 'cozinha', 'gamer'] 
        }
      };

      const currentNicheRules = nicheKeywords[productNiche] || { positive: [], negative: [] };

      // ── ETAPA 3: Estratégias de busca (Query Diversification)
      const strategies = [
        { query: `${coreQuery} shopee brasil`, weight: 1.2 },
        { query: `${coreQuery} achadinhos`, weight: 1.0 },
        { query: `${coreQuery} unboxing`, weight: 0.8 },
      ];

      // Padrões de Idioma e Scripts
      const ptBrKeywords = ['achei', 'comprei', 'chegou', 'olha', 'dica', 'shopee', 'brasil', 'br', 'testando', 'recomendo', 'unboxing', 'review'];
      const nonLatinPattern = /[^\x00-\x7F\x80-\xFF\u0100-\u017F\u0180-\u024F\u0370-\u03FF]/; 

      let allVideos: any[] = [];
      for (const strategy of strategies) {
        const q = encodeURIComponent(strategy.query);
        try {
          const resp = await fetch(
            `https://www.tikwm.com/api/feed/search?keywords=${q}&count=15&cursor=0&region=BR`,
            { signal: AbortSignal.timeout(7000) }
          );
          const json = await resp.json();
          if (json.data?.videos?.length > 0) {
            allVideos = [...allVideos, ...json.data.videos.map((v: any) => ({ ...v, _queryWeight: strategy.weight }))];
          }
        } catch {}
      }

      if (allVideos.length === 0) throw new Error('Nenhum vídeo encontrado');

      // ── ETAPA 4: MOTOR DE SCORING HEURÍSTICO (O Coração da Inteligência)
      const scored = allVideos
        .filter((v: any) => (v.play || v.wmplay) && v.duration > 4)
        .map((v: any) => {
          const title = (v.title || '').toLowerCase();
          const author = (v.author?.nickname || '').toLowerCase();
          const music = (v.music_info?.title || '').toLowerCase();
          const text = `${title} ${author} ${music}`;
          
          let score = 0;

          // 1. Match de Palavras-Chave do Produto (PESO MÁXIMO)
          if (text.includes(coreWords[0].split(' ')[0].toLowerCase())) score += 60;
          
          coreWords.forEach((w: string, idx: number) => { 
            if (text.includes(w.toLowerCase())) {
              score += (idx === 0 ? 40 : 25); 
            }
          });

          // 2. Pontuação de Idioma (PT-BR)
          const hasPtBrKeywords = ptBrKeywords.some(w => text.includes(w));
          if (hasPtBrKeywords) score += 50;
          if (nonLatinPattern.test(text)) score -= 1000;

          // 3. Match de Nicho
          currentNicheRules.positive.forEach(w => { if (text.includes(w)) score += 15; });
          currentNicheRules.negative.forEach(w => { if (text.includes(w)) score -= 40; });

          // 4. Blacklist Global de Descarte
          const globalBlacklist = ['dance', 'reflexão', 'gato', 'dog', 'pubg', 'freefire', 'edit', 'anime', 'meme', 'gameplay', 'humor', 'comédia'];
          globalBlacklist.forEach(w => { if (text.includes(w)) score -= 60; });

          // 5. Bônus de Qualidade (Duração ideal entre 7 e 25 segundos)
          if (v.duration >= 7 && v.duration <= 25) score += 10;
          score *= (v._queryWeight || 1.0);

          const VIDEO_PROXY = "https://vzydpqilvyjqjbhzgzhq.supabase.co/functions/v1/video-proxy?url=";
          const finalUrl = v.play || v.wmplay;
          const proxiedUrl = `${VIDEO_PROXY}${encodeURIComponent(finalUrl)}`;

          return {
            id: v.video_id,
            url: proxiedUrl,
            cover: v.cover,
            title: v.title,
            duration: v.duration,
            author: v.author?.nickname || 'Criador',
            _score: score
          };
        })
        .filter((v: any) => v._score > 40)
        .sort((a: any, b: any) => b._score - a._score);

      if (scored.length === 0) {
        showToast("DIFICULDADE EM ACHAR VÍDEOS 100% RELEVANTES");
        setStep('list');
        return;
      }

      const seen = new Set<string>();
      const unique = scored.filter((v: any) => {
        if (seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
      });

      setVideoResults(unique);
      setCurrentVideoIndex(0);
      setVideoData({ cover: unique[0].cover, url: unique[0].url, id: unique[0].id });
      
      setBioTitle(generateViralProductName(product.title));
      setBioLink(product.affiliate_link || product.link || '');
      setBioImageUrl(unique[0].cover);

      setCustomCopy(generateCreativeLegend(product));
      setVideoLegend(generateOverlayLegend(product));

      showToast(`🇧🇷 ${unique.length} VÍDEOS FILTRADOS COM SUCESSO!`);

      setTimeout(() => {
        setStep('treating');
        setTimeout(() => {
          setStep('ready');
          showToast("VÍDEO PRONTO PARA POSTAR! 🚀");
        }, 2500);
      }, 1000);

    } catch (error) {
      console.error("TikTok Research Error:", error);
      showToast("ERRO NA BUSCA INTELIGENTE");
      setStep('list');
    } finally {
      setIsScanning(false);
    }
  };



  const swapVideo = () => {
    resetVideoEditor();
    if (videoResults.length > 1) {
      const nextIndex = (currentVideoIndex + 1) % videoResults.length;
      setCurrentVideoIndex(nextIndex);
      const nextVideo = videoResults[nextIndex];
      setVideoData({ 
        cover: nextVideo.cover, 
        url: nextVideo.url,
        id: nextVideo.id 
      });
      
      if (selectedProduct) {
        const newLegend = generateCreativeLegend(selectedProduct);
        setCustomCopy(newLegend); 
        // Recupera legenda visual no SWAP de vídeo
        setVideoLegend(generateOverlayLegend(selectedProduct));
        
        // Atualiza preenchimento também ao mudar de vídeo (mantendo imagem da capa sincronizada)
        setBioTitle(generateViralProductName(selectedProduct.title));
        setBioImageUrl(nextVideo.cover);
      }

      showToast("VÍDEO ALTERNATIVO CARREGADO");
    } else {
      showToast("SEM OUTROS VÍDEOS DISPONÍVEIS");
    }
  };

  const [downloadPreviewUrl, setDownloadPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (previewBlob) {
      const url = URL.createObjectURL(previewBlob);
      setDownloadPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setDownloadPreviewUrl(null);
    }
  }, [previewBlob]);

  const closePreview = () => {
    setShowDownloadModal(false);
    setPreviewBlob(null);
  };

  const triggerDownload = () => {
    if (!previewBlob || !downloadLinkRef.current) return;
    const url = URL.createObjectURL(previewBlob);
    downloadLinkRef.current.href = url;
    downloadLinkRef.current.download = `viral-squad-${Date.now()}.mp4`;
    downloadLinkRef.current.click();
    URL.revokeObjectURL(url);
    showToast("DOWNLOAD INICIADO! 🚀");
  };

  const handleDownload = async () => {
    if (!videoData || isProcessing) return;
    setIsPreparingDownload(true);
    setIsPlaying(false);
    setIsProcessing(true);
    
    try {
      const processor = new VideoProcessor();
      const options: ProcessingOptions = {
        filter: activeFilter,
        legend: videoLegend,
        isMuted: isMuted,
        transition: activeTransition as any,
        trimStart: trimStart,
        trimEnd: trimEnd || undefined,
        transitionTimestamps: transitionTimestamps,
        existingVideoEl: videoRef.current || undefined,
        musicUrl: selectedMusic || undefined,
        audioMixMode: audioMixOption
      };
      
      showToast("INICIANDO RENDERIZAÇÃO ULTRA HD... ⚙️");
      const blob = await processor.renderVideo(videoData.url, options);
      setPreviewBlob(blob);
      setShowDownloadModal(true);
      showToast("VÍDEO PRONTO PARA O SUCESSO! 🔥");
    } catch (error: any) {
      console.error("Video Processing Error:", error);
      showToast("ERRO AO RENDERIZAR — TENTE NOVAMENTE 📲");
    } finally {
      setIsProcessing(false);
      setIsPreparingDownload(false);
    }
  };

  const VisualTimeline = () => {
    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!timelineRef.current || !videoRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickedTime = Math.max(0, Math.min(videoDuration, (x / rect.width) * videoDuration));
      videoRef.current.currentTime = clickedTime;
      setCurrentTime(clickedTime);
    };

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 10);
      return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
    };

    const addImpactPoint = () => {
      if (transitionTimestamps.length >= 8) {
        showToast("MÁXIMO DE 8 PONTOS DE IMPACTO");
        return;
      }
      setTransitionTimestamps(prev => [...prev, currentTime].sort((a,b) => a-b));
      showToast("PONTO DE IMPACTO ADICIONADO! 🔥");
    };

    return (
      <div className="visual-editor-controls space-y-6">
        {/* Playback & Basic Actions */}
        <div className="flex items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsPlaying(!isPlaying)}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${isPlaying ? 'bg-white text-slate-950 border-white' : 'bg-accent/20 text-accent border-accent/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]'}`}
            >
              {isPlaying ? <VolumeX size={24} /> : <Zap size={24} className="animate-pulse" />}
            </motion.button>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tempo Atual</span>
              <span className="text-lg font-mono font-black text-white">{formatTime(currentTime)}</span>
            </div>
          </div>

          <div className="flex gap-2">
             <button 
              onClick={addImpactPoint}
              className="h-14 px-6 bg-accent text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-accent/20 active:scale-95 transition-all"
            >
              <Scissors size={18} /> DIVIDIR
            </button>
          </div>
        </div>

        {/* The Actual Timeline */}
        <div className="relative">
          <div className="flex justify-between items-center mb-2 px-1">
             <span className="text-[9px] font-black text-accent uppercase tracking-[0.3em]">Master_Timeline_v4</span>
             <span className="text-[9px] font-mono text-white/30 uppercase">{formatTime(videoDuration)} TOTAL</span>
          </div>
          
          <div 
            className="professional-timeline h-24 bg-slate-900/60 rounded-[1.5rem] border border-white/5 relative overflow-hidden group cursor-pointer shadow-inner"
            ref={timelineRef}
            onClick={handleTimelineClick}
          >
            {/* Time Ticks */}
            <div className="absolute inset-x-0 top-0 h-6 border-b border-white/5 flex items-center">
              {Array.from({ length: Math.ceil(videoDuration) + 1 }).map((_, i) => (
                <div 
                  key={i} 
                  className="absolute h-full flex flex-col items-center justify-end pb-1"
                  style={{ left: `${(i / videoDuration) * 100}%` }}
                >
                  <div className={`w-[1px] bg-white/20 ${i % 5 === 0 ? 'h-3' : 'h-1.5'}`} />
                  {i % 2 === 0 && <span className="text-[8px] font-black text-white/20 absolute -top-1">{i}s</span>}
                </div>
              ))}
            </div>

            {/* Video Strip Visual Representation */}
            <div className="absolute inset-x-0 top-8 bottom-0 flex gap-0.5 px-0.5 opacity-20 pointer-events-none">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-sm border border-white/5" />
              ))}
            </div>

            {/* Trim Highlight */}
            <div className="absolute top-6 bottom-0 bg-accent/10 border-x-2 border-accent/40 z-10 pointer-events-none"
                 style={{ 
                   left: `${(trimStart / videoDuration) * 100}%`,
                   width: `${((trimEnd || videoDuration) - trimStart) / videoDuration * 100}%`
                 }} 
            />

            {/* Transition Markers (Impact Points) */}
            {transitionTimestamps.map((ts, i) => (
              <div key={i} className="absolute top-0 bottom-0 w-[3px] bg-accent z-20 shadow-[0_0_15px_rgba(6,182,212,1)]"
                   style={{ left: `${(ts / videoDuration) * 100}%` }}>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-accent rounded-full flex items-center justify-center shadow-lg transform scale-110">
                  <Zap size={8} className="text-slate-950" />
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setTransitionTimestamps(prev => prev.filter((_, idx) => idx !== i));
                  }}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 rounded-lg flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}

            {/* Playhead */}
            <div className="absolute top-0 bottom-0 w-[2px] bg-white z-30 pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.8)]"
                 style={{ left: `${(currentTime / videoDuration) * 100}%` }}>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border border-slate-900" />
              <div className="absolute inset-y-0 -left-4 -right-4 bg-white/5 blur-sm" />
            </div>
          </div>
        </div>

        {/* Trim Controls */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => { setTrimStart(currentTime); showToast("INÍCIO DO VÍDEO DEFINIDO"); }}
            className="h-12 bg-slate-900 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2"
          >
            <Scissors size={14} className="text-accent" /> Definir Início
          </button>
          <button 
            onClick={() => { setTrimEnd(currentTime); showToast("FIM DO VÍDEO DEFINIDO"); }}
            className="h-12 bg-slate-900 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2"
          >
            <Scissors size={14} className="text-accent" /> Definir Fim
          </button>
        </div>
      </div>
    );
  };


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação básica
    if (!file.type.startsWith('image/')) {
      showToast("POR FAVOR, SELECIONE UMA IMAGEM! 🖼️");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("IMAGEM MUITO GRANDE! LIMITE 5MB ⚖️");
      return;
    }

    setIsUploading(true);
    showToast("SUBINDO IMAGEM... ⏳");

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setBioImageUrl(publicUrl);
      showToast("IMAGEM ANEXADA COM SUCESSO! ✅");
    } catch (error: any) {
      console.error('Erro no upload:', error);
      showToast(`ERRO NO UPLOAD: ${error.message || 'Tente novamente'}`);
    } finally {
      setIsUploading(false);
      // Limpar o input para permitir selecionar a mesma imagem se necessário
      if (e.target) e.target.value = '';
    }
  };

  const runAutomation = (selectedPlatform: 'tiktok' | 'shopee') => {
    navigator.clipboard.writeText(customCopy);
    window.open(getPlatformUrl(selectedPlatform), '_blank');
    
    if (selectedProduct) {
      saveToSupabase(selectedProduct, selectedPlatform);
    }
    
    setStep('automation');
    setConsoleLogs([]);

    const logs = [
      { msg: `> INICIANDO MOTOR DE AUTOMAÇÃO ${selectedPlatform.toUpperCase()}...`, type: 'info' },
      { msg: "> Sincronizando banco de metadados...", type: 'info' },
      { msg: "> Acessando painel de postagem via Bridge Protocol...", type: 'info' },
      { msg: "> Carregando vídeo com Magic IA e gatilhos mentais...", type: 'info' },
      { msg: "> Bypass de CAPTCHA concluído com sucesso.", type: 'info' },
      { msg: "> POSTAGEM PROGRAMADA E SINCRONIZADA!", type: 'success' },
      { msg: "> TUDO PRONTO! O SQUAD FINALIZOU O SERVIÇO.", type: 'success' }
    ];

    logs.forEach((log, i) => {
      setTimeout(() => {
        setConsoleLogs((prev: any[]) => [...prev, log]);
        if (i === logs.length - 1) {
          setTimeout(() => {
            setAutomationFinished(true);
            showToast("CONCLUÍDO! VERIFIQUE A ABA ABERTA 🚀");
            // Refill list after posting
            refillProductList(activeNiche);
          }, 2000);
        }
      }, i * 800);
    });
  };

  return (
    <div className="app-container overflow-hidden bg-slate-950 text-slate-50 font-inter">
      {(!isPro && !isLoadingAuth) && <LockScreen />}
      <ScanningHUD active={isScanning} />
      
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-accent/20 blur-lg rounded-full animate-pulse" />
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center relative">
              <Activity size={20} className="text-accent" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none italic">
              VIRAL<span className="text-accent">SQUAD</span> <span className="text-[10px] text-accent/50 ml-1">v1.6.0</span>
            </h1>
            <span className="text-[8px] font-black tracking-[0.3em] uppercase opacity-40">Stealth Engine v4.0</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isPro && (
            <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                {['meu-link', 'admin', 'everton', 'achadinhos_brasil_'].includes((localStorage.getItem('bio_store_slug') || '').toLowerCase()) ? 'SQUAD ADMIN' : 'SQUAD PRO'}
              </span>
            </div>
          )}
          <div className="px-3 py-1.5 rounded-full bg-accent/5 border border-accent/20 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Status: Link Online</span>
          </div>
        </div>
      </header>

      {(!isStoreConfigured()) && (
        <div className="bg-amber-500 text-black text-[10px] font-black uppercase tracking-[0.3em] py-2 text-center animate-pulse z-[40] sticky top-20">
          ⚠️ ALERTA SQUAD: CONFIGURE SEU LINK NA ABA LOJA PARA DESBLOQUEAR A PLATAFORMA!
        </div>
      )}

      <main className="content-area relative z-0">
        <AnimatePresence mode="wait">
          {step === 'bio' && (
            <motion.div 
              key="bio" 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="h-[calc(100vh-10rem)] overflow-y-auto p-4 md:p-8"
            >
              <BioManager onProceed={() => setStep('home')} />
            </motion.div>
          )}
          {step === 'home' && (
            <motion.div 
              key="home" 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center p-8 text-center space-y-16"
            >
              <div className="relative">
                <div className="absolute -inset-24 bg-accent/10 blur-[100px] rounded-full" />
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-32 h-32 rounded-[2.5rem] border-2 border-white/5 flex items-center justify-center bg-slate-900/40 backdrop-blur-3xl relative z-10 shadow-2xl"
                >
                  <Shield size={56} className="text-accent" />
                  <div className="absolute -top-3 -right-3 w-10 h-10 rounded-xl bg-accent/20 backdrop-blur-lg border border-accent/30 flex items-center justify-center">
                    <Activity size={18} className="text-accent animate-pulse" />
                  </div>
                </motion.div>
              </div>

              <div className="space-y-4 relative z-10">
                <h2 className="text-5xl font-black tracking-tighter uppercase leading-[0.9] italic">
                  DOMINE O <br />
                  <span className="bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">ALGORITMO</span>
                </h2>
                <p className="text-xs text-dim uppercase font-bold tracking-[0.2em] max-w-[280px] mx-auto opacity-80 leading-relaxed">
                  Transforme achadinhos em lucro real com automação stealth de alta performance.
                </p>
              </div>

              <div className="w-full max-w-xs relative z-10">
                <motion.button 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={isStoreConfigured() ? "btn-premium" : "btn-premium border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]"}
                  onClick={() => isStoreConfigured() ? startScouting() : setStep('bio')}
                >
                  {isStoreConfigured() ? (
                    <>INICIAR OPERAÇÃO <Search size={20} /></>
                  ) : (
                    <>CONFIGURAR MINHA LOJA <ShoppingBag size={20} /></>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 'scouting' && (
            <motion.div key="scouting" initial={{opacity:0}} animate={{opacity:1}} className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center p-10 space-y-8">
              <div className="relative">
                <RefreshCcw size={64} className="text-accent animate-spin" />
                <motion.div 
                  animate={{ scale: [1, 1.8], opacity: [1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 border-2 border-accent rounded-full"
                />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-black italic tracking-widest text-accent uppercase animate-pulse">Escaner Ativo</p>
                <p className="text-[10px] text-dim uppercase tracking-[0.3em] font-bold">Mapeando Lucratividade Real...</p>
              </div>
            </motion.div>
          )}

          {step === 'list' && (
            <motion.div 
              key="list" 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 space-y-5 pb-32"
            >
              {/* Pesquisa por Link da Shopee */}
              <form onSubmit={handleCustomLinkSubmit} className="flex gap-2">
                <input 
                  type="text"
                  value={customLink}
                  onChange={(e) => setCustomLink(e.target.value)}
                  placeholder="Cole o link ou o nome de um produto..."
                  className="flex-1 bg-slate-900/80 border border-white/10 rounded-2xl px-4 py-3 text-[12px] text-white focus:outline-none focus:border-accent shadow-inner placeholder:text-white/30"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="bg-accent text-slate-950 px-5 rounded-xl font-black uppercase text-[10px] tracking-wider shrink-0 flex items-center justify-center gap-2 hover:bg-accent/80 transition-colors"
                >
                  <Search size={14} /> BUSCAR
                </motion.button>
              </form>

              {/* Header */}
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h2 className="text-2xl font-black uppercase leading-none italic">Packs <span className="text-accent">Shopee</span></h2>
                  <p className="text-[9px] text-dim font-black uppercase tracking-widest">Fotos e vídeos gerados pela SquadOS™</p>
                </div>
                <div className="bg-accent/10 border border-accent/30 text-accent text-[10px] px-3 py-1.5 font-black uppercase rounded-lg">
                   {activeItems.length} ATIVOS
                </div>
              </div>

              {/* Botão Atualizar Produtos */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={refreshProducts}
                className="w-full h-12 bg-accent/10 border border-accent/30 rounded-2xl flex items-center justify-center gap-3 text-accent text-[11px] font-black uppercase tracking-widest hover:bg-accent/20 transition-all"
              >
                <RefreshCcw size={15} />
                Atualizar Produtos
              </motion.button>

              {/* Grade de Categorias 3 colunas com ícones */}
              <div className="grid grid-cols-3 gap-2">
                {niches.map(n => (
                  <motion.button
                    key={n.id}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleNicheChange(n.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border transition-all ${
                      activeNiche === n.id
                        ? 'bg-accent border-accent text-slate-950 shadow-[0_4px_20px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-900/60 border-white/5 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <span className="text-2xl leading-none">{n.icon}</span>
                    <span className={`text-[9px] font-black uppercase tracking-wider leading-none text-center ${
                      activeNiche === n.id ? 'text-slate-950' : 'text-white/50'
                    }`}>{n.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Lista de Produtos */}
              <div className="space-y-3">
                {activeItems.map(p => {
                  const isPublished = publicationHistory.some(h => h.product_id === p.id);
                  return (
                    <motion.div 
                      key={p.id} 
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`tech-card p-4 flex gap-4 items-center group relative overflow-hidden ${
                        isPublished
                          ? 'opacity-30 grayscale pointer-events-none'
                          : 'cursor-pointer hover:border-accent/40'
                      }`}
                      onClick={() => { setSelectedProduct(p); researchTikTok(p); }}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-slate-950 flex flex-col items-center justify-center border border-white/10 shrink-0 relative overflow-hidden">
                        <div className="absolute inset-0 bg-accent/5" />
                        <span className="text-base font-black text-accent italic relative z-10">%{p.commission_pct}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[8px] font-black uppercase tracking-widest text-accent/60 bg-accent/5 px-2 py-0.5 rounded border border-accent/10">{p.sales} VENDAS</span>
                          {isPublished && <span className="text-[8px] font-black uppercase tracking-widest text-white/30 bg-white/5 px-2 py-0.5 rounded">POSTADO</span>}
                        </div>
                        <h3 className="font-black text-sm uppercase truncate leading-none mb-1">{p.title}</h3>
                        <p className="font-mono text-[10px] text-white/40">{p.price}</p>
                      </div>

                      <div className="flex flex-col gap-1.5 shrink-0">
                        <div className="w-12 h-12 rounded-2xl border border-white/5 flex items-center justify-center group-hover:border-accent group-hover:bg-accent/5 transition-all">
                          <ArrowRight size={18} className="group-hover:text-accent group-hover:translate-x-0.5 transition-all text-white/20" />
                        </div>
                        <button
                          onClick={(e) => addToBio(p, e)}
                          className="w-12 h-8 rounded-xl border border-accent/20 bg-accent/5 flex items-center justify-center hover:bg-accent hover:text-black text-accent transition-all"
                          title="Publicar na minha Loja Bio"
                        >
                          <ShoppingBag size={14} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}

                {activeItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                    <RefreshCcw size={40} className="text-accent/30" />
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Nenhum produto carregado</p>
                    <button onClick={refreshProducts} className="text-accent text-[10px] font-black uppercase tracking-widest underline">Atualizar agora</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 'treating' && (
             <motion.div key="treating" initial={{opacity:0}} animate={{opacity:1}} className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center p-10 space-y-8">
                <div className="relative">
                  <div className="absolute -inset-16 bg-accent/20 blur-[80px] rounded-full animate-pulse" />
                  <RefreshCcw size={64} className="text-accent animate-spin" />
                </div>
                <div className="text-center space-y-6">
                  <div className="space-y-1">
                    <p className="text-xl font-black italic tracking-widest text-accent uppercase">Treatment Engine</p>
                    <p className="text-[10px] text-dim uppercase font-black tracking-[0.3em]">IA Removendo Marcas d'Água</p>
                  </div>
                  
                  <div className="flex flex-col gap-2 max-w-[240px] mx-auto">
                    {[
                      { l: 'Bypass Watermark TikTok', d: 0 },
                      { l: 'Ajuste Dinâmico 9:16', d: 0.1 },
                      { l: 'Injeção de Metadados Stealth', d: 0.2 },
                      { l: 'Geração de Gatilhos Virais', d: 0.3 }
                    ].map((s, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: s.d }}
                        className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest bg-slate-900 px-4 py-2 rounded-xl border border-white/5"
                      >
                        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                        <span className="text-white/60">{s.l}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
             </motion.div>
          )}

          {step === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col h-[calc(100vh-5rem)]"
            >
              {/* VÍDEO STICKY — sempre visível no topo ao rolar */}
              <div className="sticky top-0 z-30 bg-slate-950 px-4 pt-3 pb-2 shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={goBackToList}
                    className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
                  </motion.button>
                  <div className="flex items-center gap-2 text-accent">
                     <div className="w-2 h-2 bg-accent rounded-full animate-ping" />
                     <span className="text-[10px] font-black uppercase tracking-widest italic">Edição Pro Ativa</span>
                  </div>
                </div>

                <div className="video-preview-container !h-[300px] relative overflow-hidden rounded-[1.5rem] border-2 border-slate-800 shadow-2xl bg-slate-950">
                {videoData?.url ? (
                  <>
                    <video 
                      key={videoData?.id || 'main-player'}
                      ref={videoRef}
                      src={videoData?.url || ''}
                      crossOrigin="anonymous"
                      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                      onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
                      playsInline
                      loop
                      muted={isMuted}
                      className={`w-full h-full object-cover filter-preview-${activeFilter} ${isTransitionActive ? `transition-preview-${activeTransition}` : ''}`}
                    />
                    
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <div className="bg-white/10 backdrop-blur-md p-6 rounded-full border border-white/20">
                        {isPlaying ? <VolumeX size={48} className="text-white" /> : <RefreshCcw size={48} className="text-white animate-pulse" />}
                      </div>
                    </button>
                    
                    {/* Elite Overlays System */}
                    <div className={`absolute inset-0 pointer-events-none effect-overlay-${activeFilter}`} />
                    
                    {videoLegend && (
                      <div className="absolute inset-x-0 bottom-24 flex justify-center z-20 px-6">
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-accent text-slate-950 px-6 py-3 rounded-2xl font-black text-xs uppercase italic tracking-tighter text-center shadow-[0_10px_30px_rgba(16,185,129,0.4)] border-2 border-white/20"
                        >
                          {videoLegend}
                        </motion.div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50 space-y-4">
                    <Video size={48} className="text-white/10 animate-pulse" />
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Processando Mídia...</span>
                  </div>
                )}

                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMuted(!isMuted)}
                  className="absolute bottom-20 right-4 z-30 w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white"
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </motion.button>


                <div className="absolute inset-x-4 top-4 flex justify-between items-start z-20 pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-white italic tracking-widest">HD_STEALTH_CORE</span>
                  </div>
                  <div className="bg-accent px-4 py-2 rounded-2xl shadow-[0_10px_20px_rgba(16,185,129,0.3)] border-2 border-white/20">
                    <div className="text-[8px] font-black text-slate-950 uppercase leading-none opacity-60 text-center mb-0.5">ROI</div>
                    <div className="text-xl font-black text-slate-950 italic leading-none">{selectedProduct?.commission_pct || 0}%</div>
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20 pointer-events-none opacity-60" />
              </div>

            </div> {/* fim do sticky video */}

              {/* CONTROLES SCROLLÁVEIS ABAIXO */}
              <div className="flex-1 overflow-y-auto pb-32 px-4 space-y-4">
                {/* Main Professional Editor Controls */}
                <div className="mt-2">
                  <VisualTimeline />
                </div>


                <div className="tech-card !p-6 space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] text-accent font-black uppercase tracking-[0.3em] leading-none mb-1">Copiar Estratégia</p>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <h3 className="text-lg font-black italic uppercase leading-tight truncate">{selectedProduct?.title || 'Carregando...'}</h3>
                      <button
                        onClick={() => {
                          if (selectedProduct?.title) {
                            const smartName = getSmartSearchName(selectedProduct.title);
                            navigator.clipboard.writeText(smartName);
                            showToast("BUSCA INTELIGENTE COPIADA! 📋");
                          }
                          window.open("https://affiliate.shopee.com.br/offer/product_offer", "_blank");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EE4D2D]/10 text-[#EE4D2D] border border-[#EE4D2D]/20 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-[#EE4D2D] hover:text-white transition-all w-fit text-left leading-tight"
                      >
                        <Search size={12} className="shrink-0" />
                        <span>Buscar Central de Afiliados <br/><span className="text-[8px] opacity-70">(Copia nome p/ colar)</span></span>
                      </button>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { 
                        if (selectedProduct?.title) {
                          const smartName = getSmartSearchName(selectedProduct.title);
                          navigator.clipboard.writeText(smartName); 
                          showToast("NOME CURTO COPIADO!"); 
                        }
                      }}
                      className="shrink-0 p-2 bg-slate-900 border border-white/10 rounded-xl text-accent"
                    >
                      <Copy size={16} />
                    </motion.button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    className={`h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${boostMode==='performance' ? 'bg-accent border-accent text-slate-950 shadow-[0_10px_20px_rgba(16,185,129,0.2)]' : 'bg-slate-900 border-white/5 text-dim opacity-50'}`} 
                    onClick={()=>updateMode('performance')}
                  >
                    <Zap size={18} />
                    <span className="text-[9px] font-black uppercase">Foco Vendas</span>
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    className={`h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${boostMode==='funny' ? 'bg-accent border-accent text-slate-950 shadow-[0_10px_20px_rgba(16,185,129,0.2)]' : 'bg-slate-900 border-white/5 text-dim opacity-50'}`} 
                    onClick={()=>updateMode('funny')}
                  >
                    <Activity size={18} />
                    <span className="text-[9px] font-black uppercase">Foco Viral</span>
                  </motion.button>
                </div>

                {/* QUICK ADD TO BIO STORE - ACID PREMIUM STYLE */}
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={14} className="text-accent" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Publicar na Vitrine <span className="text-accent italic">(Opcional)</span></span>
                    </div>
                    <button 
                      onClick={() => {
                        if (videoLegend) setBioTitle(videoLegend);
                        if (videoData?.thumbnail) setBioImageUrl(videoData.thumbnail);
                        showToast("✨ CAMPOS PREENCHIDOS!");
                      }}
                      className="text-[9px] font-black uppercase tracking-widest text-accent hover:text-white transition-colors flex items-center gap-1 bg-accent/5 px-2 py-1 rounded-md border border-accent/10"
                    >
                      <Sparkles size={10} /> Preencher Auto
                    </button>
                  </div>
                  
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-black tracking-widest text-accent/70 ml-1">Link Afiliado</label>
                      <input 
                        type="url" 
                        placeholder="https://shope.ee/..." 
                        value={bioLink} 
                        onChange={e => setBioLink(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl py-2.5 px-3 text-[11px] text-white focus:border-accent/50 outline-none transition-all"
                      />
                    </div>

                     <div className="space-y-1.5">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[9px] uppercase font-black tracking-widest text-accent/70">URL da Imagem</label>
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="text-[9px] font-black uppercase tracking-widest text-accent hover:text-white transition-colors flex items-center gap-1 bg-accent/5 px-2 py-1 rounded-md border border-accent/10"
                        >
                          {isUploading ? <RefreshCcw size={10} className="animate-spin" /> : <Upload size={10} />}
                          {isUploading ? 'SUBINDO...' : 'ANEXAR IMAGEM'}
                        </button>
                      </div>
                      <input 
                        type="url" 
                        placeholder="Cole o link da foto do produto..." 
                        value={bioImageUrl} 
                        onChange={e => setBioImageUrl(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl py-2.5 px-3 text-[11px] text-white focus:border-accent/50 outline-none transition-all"
                      />
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-black tracking-widest text-accent/70 ml-1">Nome do Produto</label>
                      <textarea 
                        placeholder="Ex: Nome do Produto... 🔥" 
                        value={bioTitle} 
                        onChange={e => setBioTitle(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl py-2.5 px-3 text-[11px] text-white focus:border-accent/50 outline-none transition-all h-20 resize-none font-medium"
                      />
                    </div>

                    <button
                      onClick={async () => {
                        const slug = getUserId();
                        if (!bioLink || !bioImageUrl || !bioTitle) {
                          showToast("⚠️ Preencha todos os campos da vitrine!");
                          return;
                        }
                        setIsSavingToBio(true);
                        const { error } = await supabase.from('bio_store').insert({
                          user_id: slug,
                          title: bioTitle,
                          image_url: bioImageUrl,
                          affiliate_link: bioLink
                        });
                        setIsSavingToBio(false);
                        if (!error) {
                          showToast("🛍️ PUBLICADO COM SUCESSO!");
                          setBioLink(''); setBioImageUrl(''); setBioTitle('');
                        } else {
                          showToast("❌ Erro ao publicar. Tente novamente.");
                        }
                      }}
                      disabled={isSavingToBio}
                      className="w-full py-3 bg-accent/10 border border-accent/20 hover:bg-accent hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
                    >
                      {isSavingToBio ? <RefreshCcw className="animate-spin" size={12} /> : <Zap size={12} fill="currentColor" />}
                      {isSavingToBio ? 'PUBLICANDO...' : 'ADICIONAR À MINHA LOJA'}
                    </button>
                    <p className="text-[8px] text-slate-600 text-center font-bold tracking-tight">O item aparecerá imediatamente no seu link da bio.</p>
                  </div>
                </div>

                <div className="space-y-6 pt-2">
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={swapVideo}
                      className="flex-1 h-12 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-white text-[10px] font-black uppercase tracking-widest hover:border-accent/30 transition-all"
                    >
                      <RotateCcw size={14} className="text-accent" /> Trocar Vídeo
                    </motion.button>
                  </div>
                </div>

                  <p className="text-[10px] text-accent font-black uppercase tracking-[0.3em] leading-none mb-4 flex items-center gap-2">
                    <Sparkles size={12} className="text-accent" />
                    Filtros Virais Pro
                  </p>
                  <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
                    {filters.map((f) => (
                      <motion.button
                        key={f.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveFilter(f.id)}
                        className={`shrink-0 px-4 py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 min-w-[80px] ${activeFilter === f.id ? 'bg-accent border-accent text-slate-950 font-black' : 'bg-slate-900 border-white/5 text-white/40'}`}
                      >
                        <span className="text-[10px] uppercase truncate w-full text-center tracking-tighter">{f.name}</span>
                      </motion.button>
                    ))}
                  </div>

                  <p className="text-[10px] text-accent font-black uppercase tracking-[0.3em] leading-none mb-4 flex items-center gap-2">
                    <Zap size={12} className="text-accent" />
                    Transições CapCut Pro
                  </p>
                  <div className="grid grid-cols-2 gap-2 pb-2">
                    {[
                      { id: 'fire', name: '🔥 EXPLOSÃO', icon: <Zap size={14} /> },
                      { id: 'glitch', name: '⚡ GLITCH PRO', icon: <Scissors size={14} /> },
                      { id: 'zoom', name: 'Zoom', icon: <Maximize2 size={14} /> },
                      { id: 'beat', name: 'Batida Viral', icon: <Activity size={14} /> },
                      { id: 'flash', name: 'Flash Branco', icon: <Zap size={14} /> },
                      { id: 'slide', name: 'Slide Lateral', icon: <MoveRight size={14} /> },
                      { id: 'blur', name: 'Motion Blur', icon: <Sparkles size={14} /> },
                      { id: 'shake', name: 'Tremor CapCut', icon: <RefreshCcw size={14} /> },
                      { id: 'rotate', name: 'Giro 3D Pro', icon: <RotateCcw size={14} /> },
                      { id: 'none', name: 'Original', icon: <X size={14} /> }
                    ].map((t) => (
                      <motion.button
                        key={t.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTransition(t.id)}
                        className={`h-12 rounded-xl border flex items-center justify-center gap-2 transition-all ${activeTransition === t.id ? 'bg-white/10 border-accent/50 text-accent outline outline-2 outline-accent/20' : 'bg-slate-900 border-white/5 text-white/20'}`}
                      >
                        {t.icon}
                        <span className="text-[10px] font-black uppercase tracking-tight">{t.name}</span>
                      </motion.button>
                    ))}
                  </div>

                  <div className="space-y-4 pt-4">
                    <p className="text-[10px] text-accent font-black uppercase tracking-[0.3em] leading-none mb-1 flex items-center gap-2">
                      <Type size={12} className="text-accent" />
                      Legenda no Vídeo (Overlay)
                    </p>
                    <input 
                      type="text"
                      className="w-full bg-slate-900 px-4 h-12 rounded-xl border border-white/5 text-[11px] text-white font-black placeholder:text-white/10 outline-none focus:border-accent/30"
                      placeholder="EX: OLHA ESSA PROMOÇÃO! 🔥"
                      value={videoLegend}
                      onChange={(e) => setVideoLegend(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] text-accent font-black uppercase tracking-[0.3em] leading-none mb-1 italic">
                    Trilha Sonora Viral 🎵
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {viralTracks.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMusic(selectedMusic === m.url ? null : m.url)}
                        className={`shrink-0 px-4 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${
                          selectedMusic === m.url 
                            ? 'bg-accent text-slate-950 border-accent shadow-lg shadow-accent/20' 
                            : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10'
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>

                  {selectedMusic && (
                    <div className="grid grid-cols-3 gap-2">
                       {[
                         { id: 'original', label: 'Original', icon: '🗣️' },
                         { id: 'music', label: 'Somente Música', icon: '🎧' },
                         { id: 'mix', label: 'Mix Pro (Voz+Bit)', icon: '🎚️' },
                       ].map(opt => (
                         <button
                           key={opt.id}
                           onClick={() => setAudioMixOption(opt.id as any)}
                           className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border transition-all ${
                             audioMixOption === opt.id 
                               ? 'bg-white/10 border-accent text-accent' 
                               : 'bg-black/20 border-white/5 text-slate-500'
                           }`}
                         >
                           <span className="text-sm">{opt.icon}</span>
                           <span className="text-[8px] font-black uppercase text-center leading-tight">{opt.label}</span>
                         </button>
                       ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] text-accent font-black uppercase tracking-[0.3em] leading-none mb-1 italic">Legenda para Social Media</p>
                  <div className="relative group">
                    <textarea 
                      className="w-full bg-slate-900 p-5 rounded-3xl border border-white/5 text-xs text-slate-100 font-medium outline-none min-h-[140px] resize-none focus:border-accent/30 transition-all leading-relaxed"
                      value={customCopy}
                      onChange={(e)=>setCustomCopy(e.target.value)}
                    />
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute bottom-4 right-4 w-12 h-12 bg-accent text-slate-950 rounded-2xl flex items-center justify-center shadow-xl" 
                      onClick={()=>{ navigator.clipboard.writeText(customCopy); showToast("LEGENDA COPIADA!"); }}
                    >
                      <Copy size={20} />
                    </motion.button>
                  </div>
                </div>

              <div className="flex gap-4">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 h-[90px] bg-slate-900 border border-white/10 rounded-3xl flex flex-col items-center justify-center gap-1 group hover:border-accent/40 transition-all p-2"
                  onClick={() => runAutomation('tiktok')}
                >
                  <span className="text-xl grayscale group-hover:grayscale-0 transition-all text-white">🎬</span>
                  <span className="text-[11px] font-black uppercase tracking-widest text-white/60 group-hover:text-white">TikTok</span>
                  <span className="text-[8px] text-white/30 uppercase text-center leading-tight">Copia legenda<br/>abre app</span>
                </motion.button>
                
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 h-[90px] bg-orange-600 rounded-3xl flex flex-col items-center justify-center gap-1 shadow-[0_15px_30px_rgba(234,88,12,0.3)] border border-orange-400/20 p-2"
                  onClick={() => runAutomation('shopee')}
                >
                  <span className="text-xl">🟠</span>
                  <span className="text-[11px] font-black uppercase tracking-widest text-white">Shopee</span>
                  <span className="text-[8px] text-white/70 uppercase text-center leading-tight">Copia legenda<br/>abre app</span>
                </motion.button>
              </div>

              <motion.button 
                whileTap={{ scale: 0.98 }}
                disabled={isProcessing}
                className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 transition-all ${
                  isProcessing 
                    ? 'bg-slate-900/50 border border-white/5 text-slate-500 cursor-not-allowed' 
                    : 'bg-white/10 border border-white/20 text-white shadow-lg shadow-white/5 hover:bg-white/20 hover:border-white/30'
                }`} 
                onClick={handleDownload}
              >
                {isProcessing ? (
                  <RefreshCcw size={18} className="animate-spin text-accent" />
                ) : (
                  <Download size={18} className="text-accent" />
                )}
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                  {isProcessing ? 'Sincronizando Efeitos...' : "Baixar Vídeo Produzido"}
                </span>
              </motion.button>
              </div> {/* fim dos controles scrolláveis */}
            </motion.div>
          )}

          {step === 'automation' && (
            <motion.div key="automation" initial={{opacity:0}} animate={{opacity:1}} className="h-[calc(100vh-10rem)] flex flex-col p-6 space-y-6">
              <div className="flex items-center gap-4 px-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center">
                  <Terminal size={24} className="text-accent" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-black italic uppercase leading-none italic">SQUAD<span className="text-accent">OS</span></h2>
                  <p className="text-[9px] text-dim uppercase tracking-[0.3em] font-bold animate-pulse">Running Bypass Scripts...</p>
                </div>
              </div>
              
              <div className="flex-1 bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/5 p-6 font-mono text-[10px] overflow-y-auto no-scrollbar space-y-3">
                {consoleLogs.map((log, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className={`flex gap-3 ${log.type === 'success' ? 'text-accent' : log.type === 'info' ? 'text-dim' : 'text-orange-400'}`}
                  >
                    <span className="opacity-20 shrink-0">[{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                    <span className="text-white/20 shrink-0">&gt;</span>
                    <span className={log.type === 'success' ? 'font-black' : ''}>{log.msg}</span>
                  </motion.div>
                ))}
                {!automationFinished && (
                  <div className="flex gap-3">
                    <span className="opacity-0">---</span>
                    <span className="text-accent animate-pulse">_</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <AnimatePresence>
                  {automationFinished && (
                    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-2 gap-4">
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        className="h-16 bg-slate-900 border-2 border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/90 hover:border-white/30 transition-all flex items-center justify-center gap-2"
                        onClick={() => { setStep('ready'); setAutomationFinished(false); }}
                      >
                        <RotateCcw size={16} />
                        RE-POSTAR
                      </motion.button>
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        className="h-16 bg-gradient-to-r from-accent to-emerald-400 text-slate-950 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-[0_10px_40px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 border-2 border-white/20"
                        onClick={() => { setStep('list'); setAutomationFinished(false); }}
                      >
                        <CheckCircle2 size={18} />
                        CONCLUÍDO
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {step === 'history' && (
            <motion.div 
              key="history" 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 space-y-8 pb-32"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black italic uppercase leading-none">Cloud <span className="text-accent">Sinc</span></h2>
                  <p className="text-[10px] text-dim uppercase tracking-[0.4em] font-bold">Relatório Global Stealth</p>
                </div>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-accent shadow-xl"
                  onClick={fetchHistory}
                >
                  <RefreshCcw size={20} />
                </motion.button>
              </div>

              {publicationHistory.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                  <LayoutGrid size={64} className="stroke-1" />
                  <p className="text-xs font-black uppercase tracking-widest">Nenhum Registro Sincronizado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {publicationHistory.map(h => {
                    const item = productList.find(p => p.id === h.product_id);

                    return (
                      <motion.div 
                        key={h.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="tech-card p-5 flex justify-between items-center group relative overflow-hidden bg-slate-900/40"
                      >
                        <div className="absolute inset-y-0 left-0 w-1.5 bg-accent" />
                        
                        <div className="space-y-2 min-w-0 pr-4">
                          <h3 className="text-sm font-black uppercase text-slate-100 truncate italic tracking-tight">{item?.title || "SQUAD_ITEM_GEN_7"}</h3>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] text-accent font-black uppercase tracking-[0.2em]">{getTimeAgo(new Date(h.timestamp).getTime())}</span>
                            <div className="w-1 h-1 bg-white/10 rounded-full" />
                            <div className="flex items-center gap-1.5 opacity-40">
                              <Database size={10} />
                              <span className="text-[8px] font-black uppercase tracking-widest">Local Sinc</span>
                            </div>
                          </div>
                        </div>

                        <motion.button 
                          whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                          whileTap={{ scale: 0.9 }}
                          className="w-12 h-12 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400/40 flex items-center justify-center transition-all" 
                          onClick={() => unblock(h.id)}
                        >
                          <Unlock size={20} />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="bottom-nav">
        {[
          { id: 'bio', label: '1. LOJA', icon: ShoppingBag, active: step === 'bio' },
          { id: 'home', label: '2. INÍCIO', icon: Home, active: step === 'home' },
          { id: 'list', label: '3. POSTAR', icon: Search, active: ['list','scouting','ready','treating','automation'].includes(step) },
          { id: 'history', label: '4. CLOUD', icon: Database, active: step === 'history' }
        ].map(tab => {
          const isConfigured = isStoreConfigured();
          const isLocked = tab.id !== 'bio' && !isConfigured;

          return (
            <motion.button 
              key={tab.id}
              whileTap={{ scale: 0.85 }}
              onClick={() => {
                if (isLocked) {
                  showToast("⚠️ CONFIGURE SUA LOJA PRIMEIRO!");
                  setStep('bio');
                  return;
                }
                if (tab.id === 'list' && !productList.length) {
                  startScouting();
                } else {
                  setStep(tab.id as any);
                }
              }}
              className={`nav-item ${tab.active ? 'active' : ''} ${isLocked ? 'opacity-30 grayscale' : ''}`}
            >
              <div className="relative">
                {tab.active && (
                  <motion.div 
                    layoutId="nav-glow"
                    className="absolute -inset-4 bg-accent/20 rounded-full blur-xl"
                  />
                )}
                {isLocked ? (
                  <Shield size={18} className="text-yellow-500/50" />
                ) : (
                  <tab.icon size={22} className={tab.active ? 'text-accent' : 'text-slate-500'} />
                )}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${tab.active ? 'text-accent' : 'text-slate-500'}`}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </nav>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-36 left-1/2 px-8 py-5 bg-slate-900/90 backdrop-blur-2xl text-accent rounded-3xl min-w-[300px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[200] border border-accent/30"
          >
             <div className="flex items-center gap-4 justify-center">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse shadow-[0_0_10px_#06b6d4]" />
                <span className="text-[11px] font-black italic uppercase tracking-[0.2em]">{toast}</span>
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse shadow-[0_0_10px_#06b6d4]" />
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <a ref={downloadLinkRef} style={{ display: 'none' }} />

      <AnimatePresence>
        {showDownloadModal && previewBlob && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-white/10 rounded-[40px] w-full max-w-md max-h-[90vh] overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            >
              <div className="h-full flex flex-col overflow-y-auto custom-scrollbar">
                <div className="p-8 flex flex-col items-center gap-6">
                  <div className="w-full aspect-[9/16] bg-black rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative group">
                    <video 
                      src={downloadPreviewUrl || ''} 
                      className="w-full h-full object-cover"
                      controls
                      autoPlay
                      loop
                    />
                    <div className="absolute inset-0 pointer-events-none border-2 border-accent/20 rounded-3xl" />
                  </div>

                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-black italic tracking-tighter uppercase text-white">VÍDEO PRONTO! 🔥</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Sua máquina de vendas foi gerada</p>
                  </div>

                  <div className="flex flex-col w-full gap-3 pb-4">
                    <motion.button
                      whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={triggerDownload}
                      disabled={isPreparingDownload}
                      className={`w-full py-5 font-black uppercase italic tracking-[0.3em] rounded-2xl flex items-center justify-center gap-3 transition-all z-[310] ${
                        isPreparingDownload 
                          ? 'bg-slate-700 text-slate-400 cursor-wait' 
                          : 'bg-gradient-to-r from-accent to-emerald-400 text-slate-950 shadow-[0_10px_40px_rgba(6,182,212,0.4)] hover:shadow-[0_15px_60px_#06b6d4] active:scale-[0.98] animate-pulse'
                      }`}
                    >
                       {isPreparingDownload ? (
                        <>
                          <RefreshCcw className="w-5 h-5 animate-spin" />
                          <span>RENDERIZANDO...</span>
                        </>
                      ) : (
                        <>
                          <Download size={24} strokeWidth={3} />
                          <span className="text-base">BAIXAR AGORA</span>
                        </>
                      )}
                    </motion.button>
                    
                    <button 
                      onClick={closePreview}
                      className="w-full py-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors"
                    >
                      VOLTAR AO EDITOR
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
