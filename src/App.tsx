import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import { 
  ShoppingBag, 
  Search, 
  Video, 
  CheckCircle2, 
  LogOut,
  Zap,
  Activity,
  Shield,
  Download,
  RefreshCcw,
  Sparkles,
  Maximize2,
  X,
  ArrowRight,
  ArrowLeft,
  Copy,
  Upload,
  RotateCcw,
  Volume2,
  VolumeX,
  Scissors,
  MoveRight,
  Terminal,
  LayoutGrid,
  Database,
  Unlock,
  Home,
  Type,
  Clock
} from 'lucide-react';


import { supabase } from './supabaseClient';


import { motion, AnimatePresence } from 'framer-motion';
import { VideoProcessor } from './utils/VideoProcessor';
import type { ProcessingOptions } from './utils/VideoProcessor';
import { BioStore } from './components/BioStore';
import { BioManager } from './components/BioManager';
import { LoginScreen } from './components/LoginScreen';
import { HotmartService } from './services/HotmartService';
import { TrialCountdown } from './components/TrialCountdown';
import { AgentScouting } from './components/AgentScouting';
// import { productDB } from './data/productDB';

const STRIPE_PRICE_ID = 'price_1TIZKzKYzfLaHvnki5ZXmNG9';
const STORE_PLACEHOLDER_SLUGS = ['', 'meu-link', 'admin', 'null', 'undefined', 'default', 'escolha-seu-link'];

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

function getSmartSearchName(title: string): string {
  if (!title) return '';
  
  // 1. Limpar caracteres especiais e lixo de marketplace agressivo
  let cleanTitle = title.split(/[-,\(\)\[\]|]/)[0]; 
  
  // 2. Termos técnicos que NÃO podem ser removidos (Power Words)
  const powerWords = ['levitação', 'magnética', 'magnético', 'usb', 'led', 'bluetooth', 'portátil', 'mini', 'inteligente', 'smart', 'flutuante', 'gamer', 'rgb'];
  
  // 3. Remover termos que poluem a busca e trazem resultados de baixa qualidade
  const marketJunk = [
    'promoção', 'oferta', 'queima', 'estoque', 'barato', 'shopee', 'link', 'bio', 
    'brasil', 'br', 'kit', 'conjunto', 'pacote', 'unidade', 'und', 'pcs', 'peças', 
    'peça', 'novo', 'nova', 'original', 'oficial', 'compre', 'aqui', 'clique', 
    'veja', 'olha', 'frete', 'grátis', 'pronta', 'entrega', 'envio', 'imediato',
    'atacado', 'varejo', 'premium', 'luxo', 'exclusivo', 'importado', 'envio em 24h',
    'shope', 'shein', 'aliexpress', 'mercadolivre', 'magalu'
  ];
  
  const regexJunk = new RegExp(`\\b(${marketJunk.join('|')})\\b`, 'gi');
  cleanTitle = cleanTitle.replace(regexJunk, ' ').trim();

  // 4. Remover emojis e caracteres não alfanuméricos
  cleanTitle = cleanTitle.replace(/[^\w\sÀ-ú0-9]/gi, ' ');
  
  // 5. Filtrar palavras curtas e stop words, mas MANTER as power words
  const stopWords = new Set([
    'a', 'o', 'e', 'de', 'do', 'da', 'em', 'para', 'com', 'os', 'as', 'um', 'uma', 
    'na', 'no', 'que', 'dos', 'das', 'seu', 'sua', 'pelo', 'pela', 'como', 'mais'
  ]);
  
  let words = cleanTitle.split(/\s+/).filter(w => {
    const low = w.toLowerCase();
    return (w.length > 2 && !stopWords.has(low)) || powerWords.includes(low);
  });
  
  if (words.length === 0) return title.substring(0, 30).trim();

  // 6. Retornar até 5 palavras para precisão máxima em gadgets, em vez de apenas 3
  return words.slice(0, 5).join(' ').trim();
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
type Step = 'home' | 'scouting' | 'list' | 'ready' | 'treating' | 'automation' | 'history' | 'bio' | 'plans' | 'agents_scouting' | 'onboarding_start' | 'onboarding_config' | 'onboarding_filtering';

const App: React.FC = () => {
  const bioUserId = new URLSearchParams(window.location.search).get('loja');
  if (bioUserId) return <BioStore userId={bioUserId} />;

  const [storeSlug, setStoreSlug] = useState('meu-link');
  const [storeReady, setStoreReady] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');

  const isStoreConfigured = () => {
    const normalizedSlug = (storeSlug || '').toLowerCase();
    return Boolean(storeReady && normalizedSlug && !STORE_PLACEHOLDER_SLUGS.includes(normalizedSlug));
  };

  // Forçar sempre 'home' como primeira aba ao abrir, se estiver configurado
  const [step, setStep] = useState<Step>('home');
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [trialRemaining, setTrialRemaining] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const hasActivePro = isPro || (trialRemaining !== null && trialRemaining > 0);
  const isProExpiringSoon = Boolean(hasActivePro && trialRemaining !== null && trialRemaining <= 3 * 24 * 60 * 60 * 1000);

  const [activeFilter, setActiveFilter] = useState('none');
  const [activeTransition, setActiveTransition] = useState('none');
  const [isMuted, setIsMuted] = useState(false);
  const [videoLegend, setVideoLegend] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'tiktok' | 'shopee'>('tiktok');
  const userMetadataRef = useRef<Record<string, any>>({});
  const metadataUpdateInFlightRef = useRef(false);
  const pendingMetadataRef = useRef<Record<string, any> | null>(null);
  const lastPersistedStepRef = useRef<Step | null>(null);

  const updateUserMetadata = async (patch: Record<string, any>) => {
    if (!user) return null;

    const currentMetadata = userMetadataRef.current || user.user_metadata || {};
    const nextMetadata = {
      ...currentMetadata,
      ...patch,
    };

    if (JSON.stringify(currentMetadata) === JSON.stringify(nextMetadata)) {
      return user;
    }

    userMetadataRef.current = nextMetadata;
    pendingMetadataRef.current = nextMetadata;
    setUser((prev: any) => (prev ? { ...prev, user_metadata: nextMetadata } : prev));

    if (metadataUpdateInFlightRef.current) {
      return user;
    }

    metadataUpdateInFlightRef.current = true;

    try {
      while (pendingMetadataRef.current) {
        const payload = pendingMetadataRef.current;
        pendingMetadataRef.current = null;

        const { data, error } = await supabase.auth.updateUser({ data: payload });

        if (error) {
          return null;
        }

        if (data.user) {
          userMetadataRef.current = data.user.user_metadata || payload;
          lastPersistedStepRef.current = (data.user.user_metadata?.last_step as Step | undefined) || null;
          setUser(data.user);
        }
      }
    } finally {
      metadataUpdateInFlightRef.current = false;
    }

    return user;
  };

  const applyUserAppState = async (authUser: any) => {
    if (!authUser) return;

    const metadata = authUser.user_metadata || {};
    const legacySlug = (localStorage.getItem('bio_store_slug') || '').toLowerCase();
    const legacyReady = localStorage.getItem('bio_store_ready') === 'true';
    const metadataSlug = typeof metadata.store_slug === 'string' ? metadata.store_slug.toLowerCase() : '';
    const metadataReady = metadata.store_ready === true;
    let inferredSlug = metadataSlug || legacySlug || '';
    let inferredReady = Boolean(metadataReady || (legacyReady && inferredSlug && !STORE_PLACEHOLDER_SLUGS.includes(inferredSlug)));

    if (!inferredReady && authUser.id) {
      if (metadataSlug && !STORE_PLACEHOLDER_SLUGS.includes(metadataSlug)) {
        const { data: slugStoreRows } = await supabase
          .from('bio_store')
          .select('user_id')
          .eq('user_id', metadataSlug)
          .limit(1);

        if (slugStoreRows && slugStoreRows.length > 0) {
          inferredSlug = metadataSlug;
          inferredReady = true;
        }
      }
    }

    const nextSlug = inferredSlug || 'meu-link';
    const nextReady = inferredReady;

    setStoreSlug(nextSlug || 'meu-link');
    setStoreReady(nextReady);

    if ((!metadataSlug && nextReady) || (!metadataReady && nextReady) || (!metadataSlug && legacySlug) || (!metadataReady && legacyReady)) {
      await updateUserMetadata({
        store_slug: nextSlug,
        store_ready: nextReady,
      });
      localStorage.removeItem('bio_store_slug');
      localStorage.removeItem('bio_store_ready');
    }
  };

  const handleStoreConfigured = async (slug: string) => {
    setStoreSlug(slug);
    setStoreReady(true);
    await updateUserMetadata({
      store_slug: slug,
      store_ready: true,
      last_step: 'bio',
    });
  };

  const handleUpgradeToPro = async () => {
    if (!user) {
      showToast('FAÇA LOGIN PARA ATIVAR O PRO');
      return;
    }

    // URL do Checkout da Hotmart real
    const url = "https://pay.hotmart.com/S105263156D?checkoutMode=10"; 
    
    setCheckoutUrl(url);
    setIsCheckoutOpen(true);
    showToast('ABRINDO CHECKOUT SEGURO...');
  };

  const handleManageSubscription = async () => {
    window.location.href = "https://purchase.hotmart.com/";
    showToast('ABRINDO PORTAL DE COMPRAS HOTMART...');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setStoreSlug('meu-link');
    setStoreReady(false);
    setStep('home');
    window.location.reload();
  };

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
      return 'https://affiliate.shopee.com.br/offer/product_offer';
    } else {
      // No mobile, abrimos o app do TikTok diretamente para evitar o TikTok Studio web.
      if (isMobile) {
        // snssdk1233 é o protocolo global do TikTok. 1128 era o Douyin (China).
        return 'snssdk1233://'; 
      }
      return 'https://www.tiktok.com/tiktokstudio/upload?from=creator_center';
    }
  };
 
  const [publicationHistory, setPublicationHistory] = useState<any[]>([]); 
  const [activeItems, setActiveItems] = useState<any[]>([]);
  const [_productList, setProductList] = useState<any[]>([]);
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
  const [treatingStatus, setTreatingStatus] = useState('Preparando pipeline viral...');
  const [treatingProgress, setTreatingProgress] = useState(8);
  const [treatingChecklist, setTreatingChecklist] = useState<string[]>([]);

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
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isHydratingApp, setIsHydratingApp] = useState(true);

  const checkAccess = async (currentUser?: any) => {
    setIsHydratingApp(true);
    try {
      // 0. Bypass de Desenvolvedor via URL
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('admin') === 'true') {
        await updateUserMetadata({ store_slug: 'everton', store_ready: true, last_step: 'home' });
        window.location.replace(window.location.origin + window.location.pathname);
        return;
      }

      const slug = (currentUser?.user_metadata?.store_slug || user?.user_metadata?.store_slug || '').toLowerCase();
      
      // 1. Check if Admin (mas continua para configurar o estado)
      const adminSlugs = ['admin', 'everto', 'everton', 'squad-pro', 'achadinhos_brasil_'];
      const isAdmin = adminSlugs.includes(slug);
      if (isAdmin) {
        setIsPro(true);
        setTrialExpired(false);
        setTrialRemaining(null);
      }

      // 2. Check Use provided user or fallback to auth
      const activeUser = currentUser || (await supabase.auth.getUser()).data.user;
      
      if (activeUser) {
        userMetadataRef.current = activeUser.user_metadata || {};
        lastPersistedStepRef.current = (activeUser.user_metadata?.last_step as Step | undefined) || null;
        setUser(activeUser);
        await applyUserAppState(activeUser);
        if (!isAdmin) {
          const status = await HotmartService.checkSubscriptionStatus(supabase, activeUser.id);
          setIsPro(status.isPro);
          setTrialExpired(status.trialExpired);
          setTrialRemaining(status.trialRemainingMs ?? null);
        }
      } else {
        // No anonymous trial anymore, user must log in
        setIsPro(false);
        setTrialExpired(false);
        setTrialRemaining(null);
        setStoreSlug('meu-link');
        setStoreReady(false);
      }
    } catch (err) {
      console.error('Erro ao verificar acesso');
    } finally {
      setIsHydratingApp(false);
      setIsLoadingAuth(false);
    }
  };

  const startScouting = async () => {
    setStep('agents_scouting');
  };

  // ── INTERVALO DE TRIAL EM TEMPO REAL ──
  useEffect(() => {
    if (!user || isPro || !trialRemaining) return;

    const interval = setInterval(() => {
      setTrialRemaining(prev => {
        if (prev === null || prev <= 0) {
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user, isPro, trialRemaining]);

  useEffect(() => {
    if (trialRemaining !== null && trialRemaining <= 0 && !isPro) {
      setTrialExpired(true);
    }
  }, [trialRemaining, isPro]);

  useEffect(() => {
    // Initial check
    checkAccess();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        userMetadataRef.current = session.user.user_metadata || {};
        void checkAccess(session.user);
      } else {
        setUser(null);
        setIsPro(false);
        void checkAccess(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ── PREVIEW & STABILITY ──
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  // Sincronização do vídeo com o estado da aplicação — Correção Definitiva de Áudio Duplicado
  useEffect(() => {
    if (videoRef.current) {
      // O vídeo DEVE pausar se: modal de download aberto, preparando download, processando ou fora da aba 'ready'
      const shouldPause = showDownloadModal || isPreparingDownload || isProcessing || step !== 'ready';
      
      if (isPlaying && !shouldPause) {
        // Tenta dar play apenas se as condições de exibição forem seguras
        videoRef.current.play().catch(() => {
          setIsPlaying(false);
        });
      } else {
        videoRef.current.pause();
        // Garantir que o volume do vídeo principal seja zero durante o processamento para evitar vazamento de áudio
        if (shouldPause) videoRef.current.muted = true;
        else videoRef.current.muted = isMuted;
      }
    }
  }, [isPlaying, showDownloadModal, isPreparingDownload, isProcessing, step, isMuted]);

  // Ultra-Premium Scanning HUD
  const ScanningHUD = ({ active }: { active: boolean }) => (
    <AnimatePresence>
      {active && (
        <motion.div 
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="scanning-hud"
        >
          <div className="cyber-grid" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(6,182,212,0.12),transparent_32%),linear-gradient(180deg,rgba(2,6,23,0.74)_0%,rgba(2,6,23,0.92)_100%)]" />
          
          <motion.div 
            initial={{ scale: 0.94, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col items-center gap-8 relative z-20"
          >
            <div className="relative">
              <div className="absolute inset-0 blur-[70px] bg-accent/20 rounded-full" />
              <div className="absolute -inset-8 rounded-full border border-white/10 opacity-40" />
              <div className="w-28 h-28 rounded-[2rem] bg-slate-900/95 border-2 border-white/70 flex items-center justify-center relative shadow-[0_0_80px_rgba(6,182,212,0.18)] overflow-hidden">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 opacity-[0.06]"
                >
                  <div className="w-full h-full border-4 border-dashed border-accent rounded-full" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Activity size={52} className="text-slate-100" />
                </motion.div>
                <div className="absolute inset-x-4 top-1/2 h-px bg-gradient-to-r from-transparent via-accent/35 to-transparent" />
              </div>
            </div>
            
            <div className="text-center space-y-4 max-w-[340px]">
              <motion.h2 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="text-[2.1rem] font-black italic tracking-[-0.05em] uppercase leading-[0.92] bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-transparent"
              >
                SQUAD_OS_INITIALIZING
              </motion.h2>
              <div className="mx-auto w-full max-w-[280px] rounded-2xl border border-white/8 bg-slate-900/45 px-5 py-4 backdrop-blur-xl">
                <div className="flex flex-col items-center gap-3">
                  <p className="text-[10px] text-slate-300/90 font-black tracking-[0.45em] uppercase">Security Level: Maximum</p>
                  <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ x: ['-65%', '165%'] }}
                    transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: '38%' }}
                    className="h-full rounded-full bg-gradient-to-r from-transparent via-accent to-transparent" 
                  />
                </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Sincronizando sinais de demanda, criativos virais e produtos com maior potencial de conversao.</p>
                </div>
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
  ];
  const getInfinitePool = (niche: string) => {
    const staticPool = niche === 'Todos' ? databaseProducts : databaseProducts.filter(p => p.niche === niche);
    return staticPool.filter(p => !publicationHistory.some(ph => ph.product_id === p.id));
  };

  // Persistence
  useEffect(() => {
    if (isLoadingAuth || isHydratingApp || !user) return;

    fetchHistory();
    fetchProductsDB();
    loadScoutedProducts();

    if (storeSlug === 'meu-link' && !storeReady) {
      if (step !== 'bio') {
        setStep('home');
      }
      return;
    }

    const lastStep = user.user_metadata?.last_step as Step | undefined;
    if (lastStep && !['scouting', 'ready', 'treating', 'automation'].includes(lastStep)) {
      setStep(lastStep);
    } else {
      setStep('home');
    }
  }, [user?.id]);

  const loadScoutedProducts = async () => {
    const userId = getUserId();
    if (!userId) return;
    const { data } = await supabase
      .from('scouted_products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('created_at', { ascending: false });
    
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
    if (!userId) return;
    await supabase.from('scouted_products').delete().eq('user_id', userId);
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

    const { error } = await supabase.from('scouted_products').insert(productsToSave);
    if (error) console.error('Erro ao salvar scouted_products:', error);
  };

  const fetchProductsDB = async () => {
    const { data } = await supabase.from('products').select('*');
    if (data) setDatabaseProducts(data);
  };

  // Componente de Checkout Integrado
  const CheckoutOverlay = () => {
    const [iframeLoading, setIframeLoading] = useState(true);

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] bg-slate-950 flex flex-col overflow-hidden"
      >
        {/* Header do Checkout Otimizado */}
        <div className="h-16 md:h-20 bg-slate-900/90 backdrop-blur-2xl border-b border-white/10 px-4 md:px-6 flex items-center justify-between shadow-2xl relative z-20">
          <div className="flex items-center gap-2 md:gap-4">
            <motion.button
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="flex items-center gap-2 px-3 py-2 md:px-5 md:py-3 bg-white/5 border border-white/10 rounded-xl text-white font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-white/10 transition-all group"
            >
              <ArrowLeft size={16} className="text-accent group-hover:-translate-x-1 transition-transform" />
              <span className="hidden xs:inline">VOLTAR</span>
              <span className="inline xs:hidden">VOLTAR</span>
            </motion.button>

            {!iframeLoading && (
              <button 
                onClick={() => window.open(checkoutUrl, '_blank')}
                className="flex items-center gap-1 text-[8px] md:text-[9px] font-black uppercase tracking-tighter text-slate-400 hover:text-accent transition-colors border-l border-white/10 pl-4 h-8"
              >
                <Maximize2 size={12} />
                <span className="hidden sm:inline">Problema ao carregar? Abrir em nova aba</span>
                <span className="inline sm:hidden">ABRIR FORA</span>
              </button>
            )}
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-accent italic">Checkout Seguro</span>
            <span className="text-[7px] md:text-[8px] font-bold text-slate-500 uppercase tracking-widest">Hotmart</span>
          </div>
        </div>

        {/* Container do Iframe com Scroll Suave */}
        <div className="flex-1 relative bg-white overflow-auto touch-pan-y">
          {iframeLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-30 gap-4">
              <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Protegendo sua conexão...</p>
            </div>
          )}
          
          <iframe 
            src={checkoutUrl}
            className="w-full h-full min-h-screen border-none"
            onLoad={() => setIframeLoading(false)}
            title="Hotmart Checkout"
            allow="payment"
            scrolling="yes"
          />
        </div>
      </motion.div>
    );
  };

  // Componente de Bloqueio Premium (Paywall)
  const LockScreen = () => {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[600] bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center"
      >
        <div className="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center border border-accent/20 mb-8 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
          <Shield size={40} className="text-accent animate-pulse" />
        </div>
        
        <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">
          Sua "Palhinha" <span className="text-accent underline decoration-accent/30 decoration-8 underline-offset-4">Acabou!</span>
        </h2>
        
        <p className="text-slate-400 text-sm font-medium mb-8 max-w-xs uppercase tracking-tight leading-relaxed">
          Você aproveitou suas 24h de teste gratuito. Agora, para continuar criando vídeos virais e lucrando com automação, desbloqueie o <span className="text-white font-black italic">SQUAD PRO</span>.
        </p>
        
        <div className="w-full max-w-sm space-y-4">
          {user ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpgradeToPro}
              className="w-full py-5 bg-gradient-to-r from-accent to-emerald-400 text-slate-950 font-black uppercase italic tracking-[0.2em] rounded-2xl shadow-[0_15px_40px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3"
            >
              <Zap size={20} fill="currentColor" />
              LIBERAR ACESSO PRO: R$ 19,90/mês
            </motion.button>
          ) : (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] text-red-500 font-bold uppercase tracking-widest text-center">
              ⚠️ ERRO DE AUTENTICAÇÃO: POR FAVOR, REINICIE O APP.
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            {user && (
              <button 
                onClick={() => checkAccess()}
                className="text-[10px] font-black text-accent uppercase tracking-widest hover:brightness-125 transition-all"
              >
                Já pagou? Clique para Sincronizar
              </button>
            )}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep('home')}
              className="w-full py-4 bg-white/5 border border-white/10 text-white/60 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              Voltar ao Início
            </motion.button>
            {trialRemaining !== null && !isPro && (
              <div className="flex justify-center mt-4">
                <TrialCountdown 
                  remainingMs={trialRemaining} 
                  isPro={false} 
                  variant="compact" 
                  onRefresh={checkAccess} 
                />
              </div>
            )}
          </div>
        </div>

        {trialRemaining !== null && trialRemaining > 0 && !isPro && (
          <div className="mt-8 px-4 py-2 bg-white/5 border border-white/10 rounded-full inline-flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse shadow-[0_0_8px_#06b6d4]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Tempo de Teste Restante: <span className="text-accent">{Math.floor(trialRemaining / (60 * 60 * 1000))}h {Math.floor((trialRemaining % (60 * 60 * 1000)) / (60 * 1000))}m</span>
            </span>
          </div>
        )}

        <div className="mt-12 flex items-center gap-6 opacity-30">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest italic text-white/50">Pagamento Seguro via Hotmart</span>
           </div>
           <div className="w-px h-4 bg-white/10" />
           <span className="text-[10px] font-black uppercase tracking-widest italic text-white/30">Aesso Pro Vitalício*</span>
        </div>
      </motion.div>
    );
  };

  // Sync Supabase when entering history tab
  useEffect(() => {
    if (step === 'history') {
      fetchHistory();
    }
  }, [step]);


  const fetchHistory = async () => {
    const userId = getUserId();
    if (!userId) return;
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
    if (!user || ['scouting', 'ready', 'treating', 'automation'].includes(step)) return;
    if (lastPersistedStepRef.current === step) return;

    const timer = setTimeout(() => {
      lastPersistedStepRef.current = step;
      void updateUserMetadata({
        last_step: step,
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [step, user]);

  // Transition synchronization effect
  useEffect(() => {
    if (step !== 'ready' || !videoRef.current) return;
    
    const checkTransitions = () => {
      if (!videoRef.current) return;
      const ct = videoRef.current.currentTime;
      
      const transitionDuration = 1.5;
      const isNear = transitionTimestamps.some(ts => ct >= ts && ct < ts + transitionDuration);
      
      if (isNear !== isTransitionActive) {
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
    if (user?.id) return user.id;
    return null;
  };

  const saveToSupabase = async (product: any, platform: string) => {
    if (!product) return false;
    const userId = getUserId();
    if (!userId) return false;
    
    const payload = { 
      user_id: String(userId),
      product_id: String(product.id || product.product_id || 'sem-id'), 
      title: String(product.title || 'Produto sem título'), 
      platform: String(platform || 'Shopee') 
    };

    const { data, error } = await supabase
      .from('publication_history')
      .insert([payload])
      .select();

    if (error) {
      showToast("ERRO AO SALVAR NO BANCO");
      return false;
    }

    if (data && data.length > 0) {
      setPublicationHistory(prev => [data[0], ...prev]);
      showToast("PUBLICAÇÃO REGISTRADA! ☁️");
    }
    return true;
  };

  const deleteFromSupabase = async (id: string) => {
    const { error } = await supabase
      .from('publication_history')
      .delete()
      .eq('id', id);

    if (!error) {
      setPublicationHistory(prev => prev.filter(h => h.id !== id));
      showToast("REMOVIDO DO SUPABASE! 🗑️");
    } else {
      showToast("ERRO AO REMOVER: " + error.message);
    }
  };

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      const isLargeScreen = window.innerWidth > 1024;
      setIsMobile((/iPhone|iPad|iPod|Android/i.test(userAgent) || isTouch) && !isLargeScreen);
    };
    checkMobile();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const generateCreativeLegend = (product: any) => {
    try {
      const title = (product?.title || "Achadinho Viral") as string;
      const sales = (product?.sales || "Várias") as string;

      
      const hooks = [
        `ENCONTREI! 😱 O ${title} que todo mundo tava procurando!`,
        `POV: Você acaba de achar o melhor item da Shopee hoje. ✨`,
        `Gente, olha esse achadinho! É o ${title} e eu tô chocada!`,
        `Não acredito que vivi tanto tempo sem esse ${title}! 😍`,
        `UTILIDADE PÚBLICA: Esse ${title} na Shopee é vida! 🏆`,
        `Para de rolar o feed e olha essa maravilha! 🛑`,
        `Meu Deus, a Shopee não para de me surpreender! Olha isso:`,
        `Sério, ${sales} pessoas já compraram... e eu entendi o porquê!`,
        `O segredo para facilitar sua rotina tá nesse vídeo! 🔥`,
        `Achado VIP! 💎 O ${title} com o melhor preço que já vi.`,
        `Dica de amiga: Você PRECISA desse ${title} na sua casa!`,
        `Eu não sabia que precisava disso até ver esse vídeo... 😳`,
        `Preço de banana e qualidade de milhões! Shopee arrasou.`,
        `Terapia de compras: Começando com esse ${title} incrível! 🛍️`,
        `O item que faltava no seu dia a dia acabou de aparecer!`,
      ];

      const benefits = [
        `Facilita demais a vida e tem uma qualidade surreal pelo preço!`,
        `O custo-benefício é imbatível, chegou super rápido e bem embalado.`,
        `Já é tendência lá fora e agora chegou com tudo no Brasil!`,
        `Todo mundo que vê pergunta de onde é. É simplesmente perfeito!`,
        `É aquele tipo de achado que a gente guarda a sete chaves... mas eu compartilho!`,
        `Prático, moderno e resolve aquele problema chato que a gente tem.`,
        `Sério, as ${sales} vendas não mentem: é sucesso absoluto!`,
        `Economiza tempo e ainda deixa tudo mais organizado e bonito.`,
        `Gostei tanto que já quero comprar mais um de reserva! 😂`,
        `Design premium com preço de achadinho. Shopee sendo Shopee!`,
      ];

      const ctas = [
        `🛒 O LINK COM DESCONTO tá fixado na minha BIO! Corre! 🚀`,
        `✅ Quer o link? Ele tá lá na minha BIO do perfil! 🛍️`,
        `👇 Garanta o seu pelo link oficial na minha Bio agora!`,
        `⚠️ Aproveite a promoção no link que deixei na Bio! Vale muito!`,
        `📦 Frete grátis hoje? Confere no link da minha Bio! ⭐`,
        `Aperte no link da Bio e já garanta o seu antes que acaba!`,
      ];

      const growth = [
        `👉 Siga meu perfil para mais achadinhos virais todos os dias! ✨`,
        `💡 Me siga para transformar sua casa com as melhores dicas!`,
        `Eu posto achados assim todo dia, me segue pra não perder! 🔥`,
        `Quer mais dicas assim? Já me segue aqui! 💖`,
        `Não esquece de seguir para receber as melhores ofertas em primeira mão!`,
      ];

      const hashtags = [
        '#shopee #achadinhos #shopeebrasil #viral #compras #dicas #casa #utilidades #promoção #oferta',
        '#achadosshopee #shopeebr #comprinhas #organização #tecnologia #beleza #achadinhosshopee',
        '#shopeefinds #viralvideos #dicasdecasa #utilidadedomestica #achadosdasemana',
      ];

      const seed = Math.floor(Math.random() * 1000);
      const h = hooks[seed % hooks.length];
      const b = benefits[(seed + 7) % benefits.length];
      const c = ctas[(seed + 13) % ctas.length];
      const g = growth[(seed + 19) % growth.length];
      const hash = hashtags[seed % hashtags.length];

      const variations = [
        `${h}\n\n${b}\n\n${c}\n\n${g}\n\n${hash}`,
        `✨ ${title} ✨\n\n${h}\n${b}\n\n👉 LINK NA BIO!\n\n${g}\n\n${hash}`,
        `Você não vai acreditar nesse achado! 😍\n\n${h}\n\n${c}\n\n${g}\n\n${hash}`,
        `${h} 🔥\n\n${b}\n\n🛍️ COMPRE NO LINK DA BIO!\n\n${g}\n\n${hash}`,
      ];

      return variations[seed % variations.length];
    } catch (error) {
      return "Encontrei o link perfeito na Shopee! ✅ Confira na minha bio agora e aproveite o desconto!";
    }
  };

  const generateOverlayLegend = (product: any) => {
    const title = (product?.title || "ESSE ITEM").split(' ').slice(0,3).join(' ').toUpperCase();
    
    const parts1 = [
        "🚨 ACHEI NA SHOPEE!",
        "🔥 O MAIS VENDIDO!",
        "😱 NÃO ACREDITO!",
        "😍 EU PRECISO DISSO!",
        "✨ OLHA ESSE ACHADO!",
        "🎁 PRESENTE PERFEITO!",
        "🏆 QUALIDADE PREMIUM!",
        "💎 EDIÇÃO LIMITADA!",
        "💸 PREÇO DE BANANA!",
        "📦 FRETE GRÁTIS!"
    ];
    
    const parts2 = [
        `ESTE ${title}`,
        "É UM MILAGRE!",
        "MUDOU MINHA VIDA!",
        "TODO MUNDO QUER!",
        "VENDI MEU RIM!",
        "MELHOR COMPRA!",
        "SUCESSO TOTAL!",
        "ACHADO VIP!"
    ];
    
    const seed = Math.floor(Math.random() * 1000);
    return `${parts1[seed % parts1.length]}\n${parts2[seed % parts2.length]}`;
  };

  const resetVideoEditor = () => {
    setActiveFilter('none');
    setActiveTransition('none');
    setVideoLegend('');
  };




  const goBackToList = () => {
    setStep('list');
    setAutomationFinished(false);
  };


  const refillProductList = (niche: string) => {
    setActiveItems(prev => {
      // Manter na tela APENAS itens que AINDA NÃO FORAM POSTADOS
      // e o item que não é o selecionado atualmente se estivermos no meio de um processo (opcional)
      const currentUnpublished = prev.filter(p => 
        !publicationHistory.some(ph => ph.product_id === p.id)
      );

      // Precisamos completar para ter 15 ativos na tela. 
      const needed = 15 - currentUnpublished.length;
      
      if (needed <= 0) return currentUnpublished;

      // Obtém produtos do pool infinito que não estão sendo mostrados
      const infinitePool = getInfinitePool(niche);
      const currentlyShownIds = new Set(currentUnpublished.map(p => p.id));
      const available = infinitePool.filter(p => !currentlyShownIds.has(p.id));
      
      // Filtra e randomiza os top items
      const topAvailable = [...available]
        .sort((a, b) => (b.commission_pct || 0) - (a.commission_pct || 0))
        .slice(0, Math.max(needed * 3, 30));
        
      const shuffled = topAvailable.sort(() => Math.random() - 0.5);
      
      const newItems = [...currentUnpublished, ...shuffled.slice(0, needed)];
      
      // Persistir o novo estado no Supabase para usuários logados
      if (user?.id) {
        saveScoutedProducts(newItems);
      }
      
      return newItems;
    });
  };

  const handleNicheChange = async (niche: string) => {
    setActiveNiche(niche);
    const infinitePool = getInfinitePool(niche);
    const shuffled = [...infinitePool].sort(() => Math.random() - 0.5);
    // Se for "Todos", mostra 50 itens para performance. Se for nicho específico, mostra 15.
    const items = niche === 'Todos' ? shuffled.slice(0, 50) : shuffled.slice(0, 15);
    
    setActiveItems(items);
    await saveScoutedProducts(items);
  };

  const handleCustomLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLink) return;

    setIsScanning(true);
    try {
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
        console.error("Falha no Proxy em Nuvem");
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
      setStep('list');
      void researchTikTok(customProduct);
      setCustomLink('');
      await saveScoutedProducts([customProduct]);
    } catch (err: any) {
      showToast(err.message || 'ERRO AO BUSCAR LINK');
    } finally {
      setIsScanning(false);
    }
  };

  const refreshProducts = async () => {
    // Busca pool infinito e garante sempre 30 opções frescas
    const infinitePool = getInfinitePool(activeNiche);
    
    // Traz os que tem maior comissão primeiro para engajamento imediato, misturando levemente
    const topItems = [...infinitePool].sort((a, b) => b.commission_pct - a.commission_pct).slice(0, 30);
    const shuffled = topItems.sort(() => Math.random() - 0.5);
    
    const items = shuffled.slice(0, 15);
    setActiveItems(items);
    await saveScoutedProducts(items);
    showToast('PRODUTOS ATIVOS EM ALTA 🔄');
  };


  const unblock = async (id: string) => {
    await deleteFromSupabase(id);
    // Após deletar do histórico, o item fica elegível novamente.
    // Damos um pequeno delay para o state do publicationHistory atualizar antes de dar o refill
    setTimeout(() => {
      refillProductList(activeNiche);
    }, 500);
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
      const metadataSlug = user?.user_metadata?.store_slug || '';
      const urlSlug = new URLSearchParams(window.location.search).get('loja') || '';
      const targetSlug = (metadataSlug && metadataSlug !== 'meu-link')
        ? metadataSlug.toLowerCase()
        : (urlSlug && urlSlug !== 'meu-link')
          ? urlSlug.toLowerCase()
          : (storeSlug && storeSlug !== 'meu-link')
            ? storeSlug.toLowerCase()
            : '';

      console.log('[addToBio] metadataSlug:', metadataSlug, 'urlSlug:', urlSlug, 'localSlug:', storeSlug, 'targetSlug:', targetSlug);

      if (!targetSlug) {
        showToast('CONFIGURE SUA LOJA PRIMEIRO!');
        setStep('bio');
        setIsSavingToBio(false);
        return;
      }

      const payload = {
        user_id: targetSlug,
        title: generateViralProductName(p.title || p.query),
        image_url: p.image || p.cover || '',
        affiliate_link: p.affiliate_link || p.url || ''
      };

      console.log('[addToBio] Inserting:', payload);

      const { data, error } = await supabase.from('bio_store').insert(payload).select();

      if (error) {
        console.error('[addToBio] Supabase error:', JSON.stringify(error));
        throw error;
      }

      console.log('[addToBio] Success! Inserted:', JSON.stringify(data));
      showToast('PRODUTO ADICIONADO À BIO! 🔗');
    } catch (err: any) {
      console.error('[addToBio] Error:', err?.message || err);
      showToast('ERRO: ' + (err?.message || 'Falha ao adicionar'));
    } finally {
      setIsSavingToBio(false);
    }
  };

  async function researchTikTok(product: any) {
    if (trialExpired && !hasActivePro) {
      showToast('SEU TRIAL EXPIROU. FAÇA UPGRADE PARA PRO.');
      return;
    }
    resetVideoEditor();
    setStep('treating');
    setTreatingStatus('Mapeando sinais de demanda e criativos virais...');
    setTreatingProgress(12);
    setTreatingChecklist([
      'Lendo palavras-chave do produto',
      'Consultando tendencias TikTok + Shopee',
      'Preparando filtros de relevancia',
    ]);
    try {
      const coreQuery = getSmartSearchName(product.query || product.title || '');
      const coreWords = coreQuery.split(' ').filter(w => w.length > 2);
      const productNiche = product.niche || activeNiche;
      
      if (coreWords.length === 0) throw new Error('Nome do produto incompleto');

      // 1. Identificar Âncoras Técnicas (Power Words) que definem o produto
      const powerWords = ['levitação', 'magnética', 'magnético', 'usb', 'led', 'bluetooth', 'portátil', 'mini', 'inteligente', 'smart', 'flutuante', 'gamer', 'rgb', 'projetor'];
      const productAnchors = coreWords.filter(w => powerWords.includes(w.toLowerCase()));

      const nicheKeywords: Record<string, { positive: string[], negative: string[] }> = {
        'Cozinha': { 
          positive: ['cozinha', 'comida', 'chef', 'receita', 'utilidade', 'casa', 'lar', 'utensilio', 'preparo', 'fritadeira', 'airfryer', 'organizador'],
          negative: ['maquiagem', 'pc', 'gamer', 'pet', 'cachorro', 'bebe', 'kids', 'fitness', 'cosplay'] 
        },
        'Tecnologia': { 
          positive: ['tech', 'gadget', 'unboxing', 'setup', 'pc', 'smartphone', 'eletronico', 'acessorio', 'inteligente', 'smart', 'bluetooth'],
          negative: ['cozinha', 'panela', 'maquiagem', 'bebe', 'infantil', 'pet', 'limpeza'] 
        },
        'Beleza': { 
          positive: ['make', 'maquiagem', 'skin', 'cabelo', 'beleza', 'beauty', 'tutorial', 'cuidado', 'pele', 'rosto', 'cosmetico'],
          negative: ['ferramenta', 'carro', 'moto', 'gamer', 'tecnologia', 'comida', 'pesca'] 
        },
        'Decoração': { 
          positive: ['casa', 'decor', 'quarto', 'sala', 'iluminação', 'led', 'reforma', 'estilo', 'design', 'ambiente'],
          negative: ['maquiagem', 'carro', 'pet', 'comida', 'eletronico'] 
        },
        'Pet': { 
          positive: ['pet', 'gato', 'cachorro', 'dog', 'cat', 'animal', 'fofo', 'rastreador', 'brinquedo', 'coleira'],
          negative: ['maquiagem', 'cozinha', 'gamer', 'carro'] 
        }
      };

      const currentNicheRules = nicheKeywords[productNiche] || { positive: [], negative: [] };
      
      // 2. Estratégias de Busca (Máxima Precisão: Título literal primeiro)
      const strategies = [
        { query: product.title?.substring(0, 50) || coreQuery, weight: 4.0 }, 
        { query: coreQuery, weight: 3.5 },
        { query: `${coreQuery} shopee`, weight: 3.0 },
        { query: `${coreQuery} achadinho`, weight: 2.0 },
      ];

      const ptBrKeywords = ['achei', 'comprei', 'chegou', 'olha', 'dica', 'shopee', 'brasil', 'br', 'testando', 'recomendo', 'unboxing', 'review', 'achadinho', 'oferta', 'promo', 'loja', 'casa', 'cozinha', 'comprinhas', 'melhor', 'perfeito', 'utilidades', 'organização', 'organizando', 'lar', 'recebidos', 'testei'];
      const ptBrMustHave = ['shopee', 'brasil', 'achadinho', 'comprinha', 'link', 'bio', 'utilidade', 'loja', 'br', 'achei', 'achado', 'comprei'];

      let rawVideos: any[] = [];
      setTreatingStatus('Buscando em larga escala (Equilíbrio Perfeito)...');
      setTreatingProgress(28);
      
      for (const strategy of strategies) {
        const q = encodeURIComponent(strategy.query);
        try {
          const resp = await fetch(
            `https://www.tikwm.com/api/feed/search?keywords=${q}&count=50&cursor=0&region=BR`,
            { signal: AbortSignal.timeout(15000) }
          );
          const json = await resp.json();
          if (json.data?.videos?.length > 0) {
            rawVideos = [...rawVideos, ...json.data.videos.map((v: any) => ({ ...v, _queryWeight: strategy.weight }))];
          }
        } catch {}
      }

      // Remover duplicatas
      const uniqueVideosMap = new Map();
      rawVideos.forEach(v => {
        if (!uniqueVideosMap.has(v.video_id)) uniqueVideosMap.set(v.video_id, v);
      });
      const allVideos = Array.from(uniqueVideosMap.values());

      if (allVideos.length === 0) throw new Error('Nenhum vídeo nacional encontrado');
      
      setTreatingStatus('Aferindo relevância e idioma local...');
      setTreatingProgress(56);

      const scored = allVideos
        .filter((v: any) => (v.play || v.wmplay) && v.duration > 3 && v.duration < 180)
        .map((v: any) => {
          const title = (v.title || '').toLowerCase();
          const author = (v.author?.nickname || '').toLowerCase();
          const music = (v.music_info?.title || '').toLowerCase();
          const text = `${title} ${author} ${music}`;
          
          let score = 100;

          // 0. Filtro Técnico Obrigatório (Technical Anchor)
          if (productAnchors.length > 0) {
            const hasAnyAnchor = productAnchors.some(anchor => text.includes(anchor.toLowerCase()));
            if (!hasAnyAnchor) return null; 
          }

          // 1. Ancoragem de Substantivos (Noun Anchor)
          const anchorWord = coreWords[0]?.toLowerCase();
          const hasAnchor = anchorWord && text.includes(anchorWord);
          if (!hasAnchor) return null; 

          // 2. Relevância de Palavras-Chave (Density Match)
          let matchCount = 0;
          coreWords.forEach((word) => {
            if (text.includes(word.toLowerCase())) matchCount++;
          });

          const matchRatio = coreWords.length > 0 ? matchCount / coreWords.length : 0;
          if (matchRatio < 0.25) return null; // Tolerância um pouco maior para ganhar volume
          
          if (matchRatio >= 0.8) score += 600;
          else if (matchRatio >= 0.4) score += 300;

          // 3. Trava de Idioma Brasileira (PT-BR) de Elite
          const hasPtBrKeywords = ptBrKeywords.some(w => text.includes(w));
          const hasMustHave = ptBrMustHave.some(w => text.includes(w));
          const hasAccents = /[ãéíóúç]/i.test(text); 
          
          // Detecção de Inglês (Stop Words comuns)
          const englishStopWords = ['the', 'and', 'for', 'with', 'your', 'this', 'that', 'from', 'best', 'finds', 'must', 'buy', 'now'];
          const countsEnglish = englishStopWords.filter(w => text.includes(` ${w} `) || text.startsWith(`${w} `)).length;
          
          const foreignTerms = ['amazon find', 'link in bio', 'shop now', 'available on', 'aliexpress', 'temu', 'worldwide'];
          const isForeign = foreignTerms.some(w => text.includes(w)) || (countsEnglish >= 2 && !hasAccents);

          if (hasMustHave || (hasPtBrKeywords && hasAccents)) {
            score *= 6.0; // Bônus massivo para criativos brasileiros (x6)
          } else if (isForeign || (!hasPtBrKeywords && !hasAccents)) {
            score /= 15.0; // Penalidade extrema para vídeos gringos
          }

          // 4. Qualidade e Viralização (Engajamento Mínimo de 8%)
          const views = v.play_count || v.play || 0;
          const diggs = v.digg_count || 0;
          const comments = v.comment_count || 0;
          const shares = v.share_count || 0;
          const engagementRatio = views > 0 ? ((diggs + (comments * 6) + (shares * 10)) / views) * 100 : 0;

          if (engagementRatio < 8) return null; 

          if (v.width && v.width >= 1080) score += 300;
          if (engagementRatio > 20) score += 400; 

          // 5. Niche match
          currentNicheRules.positive.forEach(w => { if (text.includes(w)) score += 50; });
          currentNicheRules.negative.forEach(w => { if (text.includes(w)) return null; });

          score *= (v._queryWeight || 1.0);
          
          return {
            id: v.video_id,
            originalUrl: v.play || v.wmplay,
            cover: v.cover,
            title: v.title,
            duration: v.duration,
            author: v.author?.nickname || 'Criador',
            stats: { likes: diggs, shares: shares, comments: comments },
            _score: score
          };
        })
        .filter((v: any) => v !== null && v._score >= 400) // Threshold equilibrado
        .sort((a: any, b: any) => b._score - a._score);

      if (scored.length === 0) throw new Error('Não encontramos vídeos brasileiros de alta qualidade para este produto. Tente um termo mais simples.');

      // Pool de 10 vídeos para garantir variedade no Swap
      const topScored = scored.slice(0, 10);
      setVideoResults(topScored);
      setCurrentVideoIndex(0);

      setTreatingStatus('Processando melhor criativo selecionado...');
      setTreatingProgress(75);
      setTreatingChecklist(prev => [...prev, `Encontrados ${topScored.length} criativos de alto potencial`]);

      const bestVideo = topScored[0];
      if (!bestVideo) throw new Error('Falha ao carregar o melhor vídeo do pool');
      
      const videoUrl = bestVideo.originalUrl;
      const VIDEO_PROXY = "https://vzydpqilvyjqjbhzgzhq.supabase.co/functions/v1/video-proxy?url=";
      const proxiedUrl = `${VIDEO_PROXY}${encodeURIComponent(videoUrl)}`;

      const videoBlob = await fetch(videoUrl).then(r => r.blob()).catch(() => null);
      if (!videoBlob) throw new Error('Falha ao baixar video inicial');
      const videoObjectUrl = URL.createObjectURL(videoBlob);
      
      setVideoData({
        id: bestVideo.id,
        url: videoObjectUrl, // Usamos o blob local para performance e estabilidade no editor
        thumbnail: bestVideo.cover || '',
        title: bestVideo.title || product.title,
        author: bestVideo.author,
        stats: bestVideo.stats,
        proxiedUrl: proxiedUrl // Mantemos o proxy se necessário
      });

      if (product) {
        setCustomCopy(generateCreativeLegend(product));
        setVideoLegend(generateOverlayLegend(product));
      }

      setTreatingStatus('Finalizando pipeline viral...');
      setTreatingProgress(100);
      setTreatingChecklist(prev => [...prev, 'Ecossistema pronto']);
      
      await new Promise(r => setTimeout(r, 600));
      setStep('ready');
      showToast(`${topScored.length} VÍDEOS ENCONTRADOS! 🎬`);
      
    } catch (err: any) {
      console.error('Erro ao buscar TikTok:', err);
      showToast(err.message || 'TENTE NOVAMENTE COM OUTRO PRODUTO');
      setStep('list');
    }
  }

  async function swapVideo() {
    if (!videoResults || videoResults.length <= 1) {
      showToast("NÃO HÁ OUTROS VÍDEOS DISPONÍVEIS");
      return;
    }

    const nextIndex = (currentVideoIndex + 1) % videoResults.length;
    setCurrentVideoIndex(nextIndex);
    const nextVideo = videoResults[nextIndex];
    
    setIsProcessing(true);
    showToast(`Trocando para vídeo ${nextIndex + 1}/${videoResults.length}...`);
    
    try {
      resetVideoEditor();
      
      // Carregar novo blob para o editor
      const videoBlob = await fetch(nextVideo.originalUrl).then(r => r.blob()).catch(() => null);
      if (!videoBlob) throw new Error('Falha ao baixar novo vídeo');
      
      const videoObjectUrl = URL.createObjectURL(videoBlob);
      const VIDEO_PROXY = "https://vzydpqilvyjqjbhzgzhq.supabase.co/functions/v1/video-proxy?url=";

      setVideoData({
        id: nextVideo.id,
        url: videoObjectUrl,
        thumbnail: nextVideo.cover || '',
        title: nextVideo.title || selectedProduct?.title || 'Novo Vídeo',
        author: nextVideo.author,
        stats: nextVideo.stats,
        proxiedUrl: `${VIDEO_PROXY}${encodeURIComponent(nextVideo.originalUrl)}`
      });

      if (selectedProduct) {
        setCustomCopy(generateCreativeLegend(selectedProduct));
        setVideoLegend(generateOverlayLegend(selectedProduct));
      }
      
      showToast("VÍDEO ATUALIZADO! ✨");
    } catch (err) {
      showToast("ERRO AO TROCAR VÍDEO");
    } finally {
      setIsProcessing(false);
    }
  }

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
    // Silencia o vídeo do modal após o download para evitar som duplicado se o navegador abrir o vídeo
    if (downloadPreviewUrl) {
      const modalVideo = document.querySelector('video[src^="blob:"]') as HTMLVideoElement;
      if (modalVideo) modalVideo.pause();
    }
    
    URL.revokeObjectURL(url);
    setShowSuccessOverlay(true);
    showToast("VÍDEO BAIXADO COM SUCESSO! ✅");
    
    setTimeout(() => {
      setShowSuccessOverlay(false);
      setShowDownloadModal(false);
    }, 4000);
  };

  const handleDownload = async (isAutoOrEvent?: boolean | React.MouseEvent) => {
    const isAuto = typeof isAutoOrEvent === 'boolean' ? isAutoOrEvent : false;
    if (!videoData || isProcessing) return null;
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
      
      showToast("RENDERIZANDO VÍDEO... ⚙️");
      const blob = await processor.renderVideo(videoData.url, options);
      setPreviewBlob(blob);
      
      if (!isAuto) {
        setShowDownloadModal(true);
      }
      
      return blob;
    } catch (error: any) {
      console.error("Video Processing Error");
      showToast("ERRO AO RENDERIZAR — TENTE NOVAMENTE 📲");
      return null;
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
      console.error('Erro no upload');
      showToast(`ERRO NO UPLOAD: ${error.message || 'Tente novamente'}`);
    } finally {
      setIsUploading(false);
      // Limpar o input para permitir selecionar a mesma imagem se necessário
      if (e.target) e.target.value = '';
    }
  };

  const runAutomation = async (selectedPlatform: 'tiktok' | 'shopee') => {
    setStep('automation');
    setActivePlatform(selectedPlatform);
    setConsoleLogs([]);
    setAutomationFinished(false);

    const addLog = (msg: string, type: string = 'info') => {
      setConsoleLogs(prev => [...prev, { msg, type }]);
    };

    addLog(`INICIANDO PROTOCOLO [${selectedPlatform.toUpperCase()}]`, 'success');
    addLog('Analisando arquitetura do dispositivo...', 'info');
    addLog(`Ambiente detectado: ${isMobile ? 'MOBILE/PWA' : 'DESKTOP/PC'}`, 'info');
    
    try {
      await navigator.clipboard.writeText(customCopy);
      addLog('Bypass de Clipboard: LEGENDA COPIADA ✅', 'success');
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = customCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      addLog('LEGENDA COPIADA (fallback) ✅', 'success');
    }

    if (selectedProduct) {
      const saved = await saveToSupabase(selectedProduct, selectedPlatform);
      if (saved) {
        addLog('Histórico sincronizado com nuvem.', 'success');
      } else {
        addLog('Falha ao sincronizar com nuvem.', 'error');
      }
    }

    const openPublishingDestination = () => {
      const target = getPlatformUrl(selectedPlatform);
      if (isMobile && selectedPlatform === 'tiktok') {
        // No mobile, usamos href para disparar o deep link do app com máxima prioridade
        window.location.href = target;
      } else {
        window.open(target, '_blank', 'noopener,noreferrer');
      }
    };

    const createMp4File = (blob: Blob) => {
      const fileName = `viral_squad_${Date.now()}.mp4`;
      return new File([blob], fileName, { type: 'video/mp4' });
    };

    // 2. Render and Process Video
    addLog('Renderizando vídeo ultra-HD para postagem...', 'info');
    const finalBlob = await handleDownload(true);
    
    if (!finalBlob) {
      addLog('FALHA NA RENDERIZAÇÃO. Retornando ao editor...', 'error');
      setStep('ready');
      return;
    }
    
    addLog('VÍDEO RENDERIZADO COM SUCESSO! ✅', 'success');

    if (isMobile && navigator.share) {
      addLog('Disparando Menu de Compartilhamento...', 'info');
      
      const triggerManualDownload = () => {
        addLog('Bypass: Download Manual Forçado...', 'warn');
        const a = document.createElement('a');
        const downloadFile = createMp4File(finalBlob);
        const url = URL.createObjectURL(downloadFile);
        a.href = url;
        a.download = downloadFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      };

      try {
        const fileToShare = createMp4File(finalBlob);

        if (navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
          await navigator.share({
            files: [fileToShare],
            title: 'Bot de Postagem Viral Squad',
            text: customCopy
          });
          addLog('Compartilhamento disparado! Poste agora no App.', 'success');
        } else {
          triggerManualDownload();
          setTimeout(() => {
            openPublishingDestination();
          }, 1500);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          addLog('Erro no Share API. Tentando Download Forçado...', 'error');
          triggerManualDownload();
          setTimeout(() => {
            openPublishingDestination();
          }, 1500);
        } else {
          addLog('Operação cancelada pelo usuário.', 'warn');
        }
      }
    } else {
      // 2. PC ONE-CLICK MACRO
      addLog('EXECUTANDO MACRO DE UM CLIQUE [PC MODE]', 'success');
      
      // Step A: Trigger Download (Robust PCA Style)
      const a = document.createElement('a');
      const downloadFile = createMp4File(finalBlob);
      const blobUrl = URL.createObjectURL(downloadFile);
      a.href = blobUrl;
      a.download = downloadFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      addLog('DOWNLOAD INICIADO AUTOMATICAMENTE! ✅', 'success');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      
      // Step B: Wait slightly and Open
      addLog(`Abrindo portal de upload do ${selectedPlatform.toUpperCase()}...`, 'info');
      setTimeout(() => {
        openPublishingDestination();
        addLog('PIPELINE CONCLUÍDO. COLE A LEGENDA NO SITE!', 'success');
      }, 1500);
    }

    setTimeout(() => {
      addLog('PROTOCOLO DE POSTAGEM FINALIZADO.', 'success');
      setAutomationFinished(true);
      showToast("CONCLUÍDO! VERIFIQUE A ABA ABERTA 🚀");
      
      // Forçar atualização do inventário para remover o item postado e trazer um novo
      refillProductList(activeNiche);
    }, 2500);
  };

  if (isLoadingAuth || isHydratingApp) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <ScanningHUD active={true} />
      </div>
    );
  }
  if (!user) {
    return (
      <LoginScreen 
        onLoginSuccess={(loggedUser) => {
          setUser(loggedUser);
          checkAccess(loggedUser);
        }} 
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-50 font-inter overflow-hidden">
      <ScanningHUD active={isScanning} />
      
      <header className="header border-b border-white/5 bg-slate-950/50 backdrop-blur-3xl z-[50] px-3 py-3 sm:px-4 md:px-8">
        <div className="flex items-start justify-between gap-3 sm:items-center">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-xl font-black tracking-tighter uppercase leading-none italic whitespace-nowrap">
              VIRAL<span className="text-accent">SQUAD</span> <span className="text-[10px] text-accent/50 ml-1">v1.6.0</span>
            </h1>
            <span className="text-[8px] font-black tracking-[0.3em] uppercase opacity-40">Stealth Engine v4.0</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex-col items-end mr-2 hidden md:flex">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-white px-2 py-1 bg-white/5 rounded-lg border border-white/5 uppercase tracking-tighter truncate max-w-[100px]">
                {user?.email?.split('@')[0]}
              </span>
              {hasActivePro ? (
                <span className="px-2 py-1 bg-[linear-gradient(135deg,rgba(16,185,129,0.92)_0%,rgba(6,182,212,0.82)_100%)] text-slate-950 text-[8px] font-black uppercase rounded-lg border border-emerald-300/20 tracking-tighter italic shadow-[0_0_15px_rgba(16,185,129,0.18)]">
                  SQUAD PRO
                </span>
              ) : (
                <button
                  onClick={handleUpgradeToPro}
                  className="px-2 py-1 bg-white/5 text-slate-400 text-[8px] font-black uppercase rounded-lg border border-white/5 tracking-tighter italic hover:border-emerald-400/40 hover:text-emerald-300 transition-all"
                  title="Ativar SQUAD PRO"
                >
                  TESTE GRÁTIS
                </button>
              )}
              {!hasActivePro && (
                <button
                  onClick={handleUpgradeToPro}
                  className="px-2 py-1 bg-gradient-to-r from-emerald-400 to-accent text-slate-950 text-[8px] font-black uppercase rounded-lg border border-emerald-300/40 tracking-tighter shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:brightness-110 transition-all"
                  title="Ativar SQUAD PRO"
                >
                  PRO
                </button>
              )}
            </div>
            <span className="text-[7px] font-bold text-accent uppercase tracking-[0.2em] mt-1 opacity-70">Operação em curso</span>
          </div>

          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="h-10 w-10 sm:w-auto sm:px-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 transition-all group"
            title="Encerrar Sessão"
          >
            <LogOut size={16} className="text-red-500 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest hidden sm:inline">SAIR</span>
          </motion.button>
        </div>
        </div>

        <div className="mt-3 flex items-center gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <TrialCountdown remainingMs={trialRemaining} isPro={hasActivePro} onRefresh={checkAccess} />
          </div>
          {hasActivePro ? (
            <div className="flex items-center gap-2 shrink-0">
              {isProExpiringSoon && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleUpgradeToPro}
                  className="h-10 px-3 sm:px-4 bg-gradient-to-r from-amber-300 to-orange-400 text-slate-950 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-[0.14em] border border-amber-200/30 shadow-[0_10px_24px_rgba(251,191,36,0.18)] whitespace-nowrap"
                  title="Renovar agora"
                >
                  RENOVAR
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleManageSubscription}
                className="h-10 px-3 sm:px-4 bg-white/5 text-white rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-[0.14em] border border-white/10 shadow-[0_10px_24px_rgba(15,23,42,0.18)] whitespace-nowrap"
                title="Gerenciar assinatura"
              >
                GERENCIAR
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleUpgradeToPro}
              className="h-10 px-3 sm:px-4 bg-gradient-to-r from-emerald-400 to-accent text-slate-950 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-[0.14em] border border-emerald-300/30 shadow-[0_10px_24px_rgba(16,185,129,0.18)] whitespace-nowrap shrink-0"
              title="Quero ser PRO agora"
            >
              <span className="hidden xs:inline">QUERO SER PRO</span>
              <span className="xs:hidden">SER PRO</span>
            </motion.button>
          )}
        </div>
      </header>

      {(!isStoreConfigured() && step !== 'bio' && !['onboarding_start', 'onboarding_config', 'onboarding_filtering'].includes(step)) && (
        <div className="bg-amber-500 text-black text-[10px] font-black uppercase tracking-[0.3em] py-2 text-center animate-pulse z-[40] sticky" style={{ top: 'var(--safe-top)' }}>
          ⚠️ ALERTA SQUAD: CONFIGURE SEU LINK NA ABA LOJA PARA DESBLOQUEAR A PLATAFORMA!
        </div>
      )}

      <main className="flex-1 overflow-hidden flex flex-col relative">
        <AnimatePresence mode="wait">
          {step === 'bio' && (
            <motion.div 
              key="bio" 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full overflow-y-auto p-2 md:p-8"
            >
              <BioManager
                user={user}
                initialStoreSlug={storeSlug}
                initialStoreReady={storeReady}
                onStoreConfigured={handleStoreConfigured}
                onProceed={() => setStep('agents_scouting')}
              />
            </motion.div>
          )}
          {step === 'home' && (
            <motion.div 
              key="home" 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center p-8 text-center space-y-12"
            >
              <div className="relative">
                <div className="absolute -inset-24 bg-accent/10 blur-[100px] rounded-full" />
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-28 h-28 rounded-[2.5rem] border-2 border-white/5 flex items-center justify-center bg-slate-900/40 backdrop-blur-3xl relative z-10 shadow-2xl"
                >
                  <Shield size={48} className="text-accent" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-accent/20 backdrop-blur-lg border border-accent/30 flex items-center justify-center">
                    <Activity size={14} className="text-accent animate-pulse" />
                  </div>
                </motion.div>
              </div>

              <div className="space-y-4 relative z-10">
                <h2 className="text-5xl font-black tracking-tighter uppercase leading-[0.9] italic">
                  DOMINE O <br />
                  <span className="bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">ALGORITMO</span>
                </h2>
                <div className="flex flex-col items-center gap-2">
                   <p className="text-[10px] text-dim uppercase font-black tracking-[0.4em] max-w-[280px] mx-auto opacity-70">
                    SQUAD V6.0 STEALTH ENGINE
                  </p>
                  <div className="h-[2px] w-12 bg-accent/20 rounded-full" />
                </div>
              </div>

              {/* Large Countdown for Trial Users */}
              {!hasActivePro && trialRemaining !== null && (
                <div className="relative z-10 scale-90 space-y-4">
                  <TrialCountdown remainingMs={trialRemaining} isPro={false} variant="large" onRefresh={checkAccess} />
                  <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleUpgradeToPro}
                    className="w-full max-w-sm mx-auto py-4 px-6 rounded-2xl border border-emerald-400/20 bg-gradient-to-r from-emerald-400 to-accent text-slate-950 text-[11px] font-black uppercase tracking-[0.24em] shadow-[0_16px_40px_rgba(16,185,129,0.22)]"
                  >
                    QUERO SER PRO AGORA
                  </motion.button>
                </div>
              )}

              {isProExpiringSoon && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-sm relative z-10 rounded-[2rem] border border-amber-300/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.14)_0%,rgba(251,191,36,0.08)_100%)] px-5 py-4 shadow-[0_20px_60px_rgba(245,158,11,0.12)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-200">Vence em breve</p>
                      <p className="mt-1 text-sm text-amber-50/90 leading-relaxed">Sua assinatura PRO esta nos ultimos dias. Renove agora para nao perder o acesso.</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={handleUpgradeToPro}
                      className="shrink-0 rounded-xl bg-amber-300 px-3 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-950"
                    >
                      Renovar
                    </motion.button>
                  </div>
                </motion.div>
              )}

              <div className="w-full max-w-xs relative z-10 space-y-4">
                <motion.button
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full py-6 rounded-3xl flex items-center justify-center gap-4 text-sm font-black uppercase italic tracking-[0.2em] shadow-2xl border-b-4 transition-all ${
                    isStoreConfigured() 
                    ? 'btn-premium border-slate-950/20' 
                    : 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 border-orange-900/20'
                  }`}
                  onClick={() => {
                    if (isStoreConfigured()) {
                      setStep('agents_scouting');
                    } else {
                      setStep('bio');
                    }
                  }}
                >
                  <motion.span className="flex items-center gap-4">
                    {isStoreConfigured() ? 'INICIAR BUSCAS DE PRODUTOS E VÍDEOS VIRAIS' : 'CRIAR MINHA LOJA'} 
                    {isStoreConfigured() ? <Zap size={20} fill="currentColor" /> : <ArrowRight size={20} />}
                  </motion.span>
                </motion.button>
                
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                   {isStoreConfigured() 
                     ? "Sua loja está pronta. Agora vamos buscar produtos e vídeos virais" 
                     : "Crie sua loja primeiro para liberar a busca automática"}
                 </p>
              </div>
            </motion.div>
          )}

          {step === 'onboarding_start' && (
            <motion.div 
              key="onboarding_start" 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center p-8 text-center space-y-8"
            >
              <div className="relative">
                <div className="absolute -inset-12 bg-accent/20 blur-[60px] rounded-full animate-pulse" />
                <div className="w-24 h-24 rounded-[2rem] bg-slate-900 border border-white/10 flex items-center justify-center relative z-10">
                  <ShoppingBag size={40} className="text-accent" />
                </div>
              </div>
              <div className="space-y-4 relative z-10">
                <h2 className="text-4xl font-black italic uppercase leading-tight italic">
                  BEM-VINDO AO <br />
                  <span className="text-accent underline decoration-accent/30 decoration-8 underline-offset-8">VIRAL SQUAD</span>
                </h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[280px] mx-auto">
                  Para começar a lucrar, precisamos configurar sua <span className="text-white">VITRINE DE VENDAS</span>. É por lá que seus clientes vão comprar!
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-premium px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl relative z-10"
                onClick={() => setStep('onboarding_config')}
              >
                CRIAR MINHA LOJA AGORA
              </motion.button>
            </motion.div>
          )}

          {step === 'onboarding_config' && (
            <motion.div 
              key="onboarding_config" 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="h-full flex flex-col overflow-y-auto custom-scrollbar p-4 md:p-8"
            >
              <div className="max-w-md mx-auto w-full space-y-10 pb-32">
                <div className="text-center space-y-3">
                  <h3 className="text-2xl font-black italic uppercase italic tracking-tighter">CONFIGURAÇÃO DE <span className="text-accent underline decoration-accent/20">LINK</span></h3>
                  <p className="text-[10px] text-dim uppercase font-black tracking-[0.3em]">Defina seu slug único no ecossistema</p>
                </div>
                <BioManager
                  user={user}
                  initialStoreSlug={storeSlug}
                  initialStoreReady={storeReady}
                  onStoreConfigured={handleStoreConfigured}
                  onProceed={() => setStep('onboarding_filtering')}
                />
              </div>
            </motion.div>
          )}

          {step === 'onboarding_filtering' && (
            <motion.div 
              key="onboarding_filtering"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center p-8 text-center space-y-12 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#020617_80%)] z-10" />
              
              <div className="relative z-20 space-y-12 w-full max-w-sm">
                <div className="relative mx-auto w-32 h-32">
                   <motion.div 
                     animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                     transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                     className="absolute inset-0 border-2 border-t-accent border-r-emerald-500 border-b-purple-500 border-l-transparent rounded-full shadow-[0_0_60px_rgba(6,182,212,0.4)]"
                   />
                   <div className="absolute inset-0 flex items-center justify-center">
                     <Activity size={40} className="text-accent animate-pulse" />
                   </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter italic">RECRUTANDO AGENTES...</h2>
                    <p className="text-[10px] text-dim uppercase tracking-[0.4em] font-bold animate-pulse text-accent">Status: Sincronizando Database Viral</p>
                  </div>

                  <div className="bg-slate-950/80 backdrop-blur-3xl border border-white/5 p-6 rounded-[2rem] font-mono text-[9px] text-left space-y-2 h-44 overflow-hidden relative shadow-2xl">
                    <motion.div 
                      animate={{ y: [0, -220] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                      className="space-y-2"
                    >
                      <p className="text-accent">&gt; INICIALIZANDO_NÚCLEO_V6</p>
                      <p>&gt; MAPEANDO_TENDÊNCIAS_TTC</p>
                      <p className="text-emerald-400">&gt; CONEXÃO_SHOPEE_ESTABELECIDA</p>
                      <p>&gt; CARREGANDO_SCRIPTS_DE_VENDAS</p>
                      <p className="text-purple-400">&gt; ATIVANDO_PROXY_ANTIBAN</p>
                      <p>&gt; GERANDO_CRIAÇÃO_ESTRATÉGICA</p>
                      <p className="text-accent">&gt; SINCRONIZANDO_LOJA_SQUAD...</p>
                      <p className="text-white font-black">&gt; PROCESSO_CONCLUÍDO_COM_SUCESSO</p>
                      <p className="text-dim">&gt; AGUARDANDO_COMANDO_MESTRE</p>
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950 pointer-events-none" />
                  </div>
                </div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 3.5 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full h-16 bg-gradient-to-r from-accent to-emerald-400 text-slate-950 rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(6,182,212,0.4)] border-b-4 border-slate-950/20 active:border-b-0"
                  onClick={() => setStep('agents_scouting')}
                >
                  LOJA CRIADA! ATIVAR AGENTES VIRIAIS 🚀
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 'agents_scouting' && (
            <AgentScouting onComplete={() => {
              setStep('list');
              refreshProducts();
            }} />
          )}

          {/* Tela de scouting removida - redireciona direto para list */}

          {step === 'list' && (
            <motion.div 
              key="list" 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6 pb-40"
            >
              {/* Pesquisa por Link da Shopee */}
              <form onSubmit={handleCustomLinkSubmit} className="relative group shrink-0 space-y-2">
                <div className="absolute -inset-1 bg-accent/20 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center">
                  <div className="flex-1 relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-accent transition-colors z-20" />
                    <input 
                      type="text"
                      value={customLink}
                      onChange={(e) => setCustomLink(e.target.value)}
                      placeholder="Qual produto deseja buscar?"
                      className="w-full bg-slate-950/80 border border-white/5 rounded-2xl pl-10 pr-24 py-3.5 text-[12px] text-white focus:outline-none focus:border-accent/40 shadow-2xl placeholder:text-white/20 transition-all font-medium relative z-10"
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        className="bg-accent text-slate-950 h-9 px-4 rounded-xl font-black uppercase text-[10px] tracking-tighter hover:brightness-110 shadow-xl shadow-accent/10 transition-all flex items-center justify-center gap-1.5"
                      >
                        BUSCAR
                      </motion.button>
                    </div>
                  </div>
                </div>
                {/* Texto de Auxílio */}
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-1 opacity-60"
                >
                  <div className="w-1 h-1 bg-accent rounded-full animate-pulse" />
                  <p className="text-[9px] font-black text-accent uppercase tracking-widest italic">
                    DICA: DIGITE E CLIQUE NO BOTÃO BUSCAR
                  </p>
                </motion.div>
              </form>

              {/* Header */}
              <div className="flex justify-between items-center px-1">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black uppercase leading-none italic tracking-tighter">Packs <span className="text-accent">Shopee</span></h2>
                  <p className="text-[10px] text-dim font-black uppercase tracking-[0.3em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                    FOTOS E VÍDEOS GERAIS
                  </p>
                </div>
                <div className="glass-acid px-4 py-2 border border-accent/20 text-accent text-[11px] font-black uppercase tracking-widest rounded-xl">
                   {activeItems.length} ATIVOS
                </div>
              </div>

              {/* Botão Atualizar Produtos */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={refreshProducts}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:border-accent/30 hover:text-accent transition-all group"
              >
                <RefreshCcw size={16} className="group-hover:rotate-180 transition-transform duration-700" />
                Sincronizar Acervo Viral
              </motion.button>

              {/* Grade de Categorias Premium */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {niches.map(n => (
                  <motion.button
                    key={n.id}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleNicheChange(n.id)}
                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-[1.5rem] border transition-all duration-300 relative group overflow-hidden ${
                      activeNiche === n.id
                        ? 'bg-accent/10 border-accent/50 text-accent shadow-[0_8px_30px_rgba(6,182,212,0.15)] bg-gradient-to-br from-accent/5 to-transparent'
                        : 'bg-slate-900/40 border-white/5 text-white/40 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    {activeNiche === n.id && (
                      <motion.div layoutId="niche-glow" className="absolute inset-0 bg-accent/5 rounded-[1.5rem] pointer-events-none" />
                    )}
                    <span className={`text-2xl transition-transform duration-300 ${activeNiche === n.id ? 'scale-110' : 'group-hover:scale-110 grayscale-[0.5] group-hover:grayscale-0 opacity-60 group-hover:opacity-100'}`}>
                      {n.icon}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest leading-none text-center transition-colors ${
                      activeNiche === n.id ? 'text-accent' : 'text-slate-600'
                    }`}>
                      {n.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Lista de Produtos */}
              <div className="space-y-3">
                {activeItems.map((p, i) => {
                  const isPublished = publicationHistory.some(h => h.product_id === p.id);
                  return (
                    <motion.div 
                      key={p.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      whileHover={{ x: 6 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative group ${isPublished ? 'opacity-40 grayscale pointer-events-none' : 'cursor-pointer'}`}
                      onClick={() => { setSelectedProduct(p); researchTikTok(p); }}
                    >
                      <div className="absolute -inset-[1px] bg-gradient-to-r from-accent/20 via-transparent to-accent/5 rounded-[2.2rem] opacity-0 group-hover:opacity-100 transition-opacity blur-[1px]" />
                      
                      <div className="relative bg-slate-900/60 border border-white/5 rounded-[2rem] p-4 flex gap-5 items-center backdrop-blur-3xl transition-all group-hover:border-accent/30 group-hover:bg-slate-900/80 shadow-2xl shadow-black/40">
                        {/* Badge de Comissão */}
                        <div className="relative w-16 h-16 shrink-0">
                          <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative w-full h-full rounded-2xl bg-black/60 border border-accent/20 flex flex-col items-center justify-center overflow-hidden">
                            <span className="text-[10px] font-black text-accent/60 uppercase leading-none mb-0.5 tracking-tighter">COM</span>
                            <span className="text-xl font-black text-accent italic leading-none">{p.commission_pct}%</span>
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-accent/30" />
                          </div>
                        </div>

                        {/* Info do Produto */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2">
                             <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                               <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                               <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">{p.sales} VENDAS</span>
                             </div>
                             {isPublished && <span className="text-[8px] font-black uppercase tracking-widest text-white/30 bg-white/5 px-2 py-0.5 rounded border border-white/5">POSTADO</span>}
                          </div>
                          
                          <h3 className="font-black text-[13px] text-white/90 uppercase truncate leading-tight group-hover:text-white transition-colors">{p.title}</h3>
                          
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-black text-emerald-400/80">{p.price}</span>
                            <div className="w-1 h-1 rounded-full bg-slate-700" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">SQUAD SELECTION</span>
                          </div>
                        </div>

                        {/* Ações Rápidas */}
                        <div className="flex flex-col gap-2 shrink-0">
                          <motion.div 
                            whileHover={{ scale: 1.1 }}
                            className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-slate-950 transition-all shadow-lg shadow-accent/5"
                          >
                            <ArrowRight size={20} />
                          </motion.div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); addToBio(p, e); }}
                            className="w-11 h-9 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all active:scale-95"
                            title="Publicar na minha Vitrine"
                          >
                            <ShoppingBag size={15} />
                          </motion.button>
                        </div>
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
             <motion.div
               key="treating"
               initial={{ opacity: 0, y: 18 }}
               animate={{ opacity: 1, y: 0 }}
               className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center p-6"
             >
               <div className="w-full max-w-md rounded-[2.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.94)_0%,rgba(2,6,23,0.98)_100%)] p-7 shadow-[0_30px_120px_rgba(2,6,23,0.8)] backdrop-blur-3xl">
                 <div className="flex flex-col items-center text-center gap-6">
                   <div className="relative">
                     <div className="absolute -inset-10 rounded-full bg-accent/12 blur-[60px]" />
                     <motion.div
                       animate={{ rotate: 360 }}
                       transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                       className="absolute -inset-6 rounded-full border border-accent/10 border-dashed"
                     />
                     <div className="relative w-24 h-24 rounded-[2rem] border border-white/15 bg-slate-900/90 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.12)]">
                       <RefreshCcw size={40} className="text-accent animate-spin" style={{ animationDuration: '3.2s' }} />
                     </div>
                   </div>

                   <div className="space-y-2">
                     <p className="text-[10px] font-black uppercase tracking-[0.45em] text-accent/80">Pipeline Viral</p>
                     <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none text-white">
                       Curando o melhor criativo
                     </h2>
                     <p className="text-sm text-slate-400 leading-relaxed">
                       {treatingStatus}
                     </p>
                   </div>

                   <div className="w-full space-y-3">
                     <div className="flex items-end justify-between">
                       <span className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-500">Progresso da analise</span>
                       <span className="text-2xl font-mono font-black text-accent">{treatingProgress}%</span>
                     </div>
                     <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                       <motion.div
                         initial={{ width: 0 }}
                         animate={{ width: `${treatingProgress}%` }}
                         transition={{ duration: 0.7, ease: 'easeOut' }}
                         className="h-full rounded-full bg-gradient-to-r from-accent via-cyan-300 to-emerald-400 shadow-[0_0_18px_rgba(6,182,212,0.35)]"
                       />
                     </div>
                   </div>

                   <div className="w-full space-y-3 text-left">
                     {treatingChecklist.map((item, index) => (
                       <motion.div
                         key={`${index}-${item}`}
                         initial={{ opacity: 0, x: -12 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: index * 0.08 }}
                         className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3"
                       >
                         <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                         <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-200">{item}</span>
                       </motion.div>
                     ))}
                   </div>
                 </div>
               </div>
             </motion.div>
          )}

          {step === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.08),transparent_30%),linear-gradient(180deg,#020617_0%,#020617_100%)]"
            >
              {/* VÍDEO STICKY — sempre visível no topo ao rolar */}
              <div className="z-30 px-3 pt-safe shrink-0 bg-gradient-to-b from-slate-950 via-slate-950/94 to-transparent backdrop-blur-xl lg:sticky lg:top-0 sm:px-4">
                <div className="mt-2 mb-2 rounded-[1.35rem] border border-white/6 bg-white/[0.025] px-3 py-3 shadow-[0_14px_40px_rgba(2,6,23,0.28)] sm:px-4">
                <div className="flex items-center justify-between mb-2">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={goBackToList}
                    className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
                  </motion.button>
                  <div className={`flex items-center gap-2 rounded-full px-2.5 py-1.5 sm:px-3 ${hasActivePro ? 'border border-emerald-400/16 bg-emerald-400/7 text-emerald-300' : 'border border-amber-400/16 bg-amber-400/7 text-amber-300'}`}>
                     <div className={`w-2 h-2 rounded-full ${hasActivePro ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.8)]'}`} />
                     <span className="text-[10px] font-black uppercase tracking-[0.22em]">{hasActivePro ? 'Edição Pro Ativa' : 'Modo Teste Ativo'}</span>
                  </div>
                </div>

                <div className="mb-2 space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.42em] text-accent/70">Central de postagem</p>
                  <div className="space-y-2 sm:flex sm:items-start sm:justify-between sm:gap-3 sm:space-y-0">
                    <div className="min-w-0 max-w-none sm:max-w-[240px]">
                      <h2 className="text-[1.15rem] font-black italic uppercase leading-[0.92] tracking-tighter text-white sm:text-[1.8rem]">
                        Criativo pronto para publicar
                      </h2>
                      <p className="mt-1 text-[11px] text-slate-400 leading-relaxed sm:text-[13px] sm:max-w-[220px]">
                        Ajuste o estilo e publique sua oferta.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-white/6 bg-slate-900/55 px-2 py-1.5 shrink-0 self-start w-fit sm:text-right">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
                      <div>
                        <p className="text-[7px] font-black uppercase tracking-[0.28em] text-slate-500 leading-none">Modo</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white">Creative V6</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="video-preview-container !h-[190px] sm:!h-[260px] relative overflow-hidden rounded-[1.45rem] sm:rounded-[1.7rem] border border-white/8 shadow-[0_20px_50px_rgba(2,6,23,0.42)] bg-slate-950">
                {videoData?.url ? (
                  <>
                    <video 
                      key={videoData?.id || 'main-player'}
                      ref={videoRef}
                      src={videoData?.url || undefined}
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
                      className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <div className="bg-slate-950/55 backdrop-blur-md p-5 rounded-full border border-white/12">
                        {isPlaying ? <VolumeX size={48} className="text-white" /> : <RefreshCcw size={48} className="text-white animate-pulse" />}
                      </div>
                    </button>
                    
                    {/* Elite Overlays System */}
                    <div className={`absolute inset-0 pointer-events-none effect-overlay-${activeFilter}`} />
                    
                    {videoLegend && (
                      <div className="absolute inset-x-0 bottom-14 sm:bottom-16 flex justify-center z-20 px-4 sm:px-5">
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-gradient-to-r from-accent to-emerald-400 text-slate-950 px-4 py-2 rounded-2xl font-black text-[10px] sm:text-[11px] uppercase italic tracking-tight text-center shadow-[0_10px_24px_rgba(16,185,129,0.22)] border border-white/16 max-w-[88%] sm:max-w-[82%]"
                        >
                          {videoLegend}
                        </motion.div>
                      </div>
                    )}
                  </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50 space-y-4">
                      <Video size={48} className="text-white/10" />
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Processando Mídia...</span>
                    </div>
                  )}

                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMuted(!isMuted)}
                  className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-30 w-10 h-10 bg-slate-950/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white"
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </motion.button>                {/* Editor Header with Notch Support */}
                <div 
                  className="absolute inset-x-0 top-0 z-30 px-4 flex justify-between items-center pointer-events-none"
                  style={{ paddingTop: 'calc(var(--safe-top) + 0.5rem)' }}
                >
                  <div className="w-10 h-10" />

                    <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]" />
                      <span className="text-[8px] font-black text-white italic tracking-[0.2em]">LIVE_PREVIEW_V4</span>
                    </div>
                  </div>



                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/10 pointer-events-none opacity-45" />
              </div>
              </div>

            </div> {/* fim do sticky video */}

              {/* CONTROLES SCROLLÁVEIS ABAIXO */}
               <div className="flex-1 overflow-y-auto pb-32 px-3 space-y-4 sm:px-4">
                {/* Main Professional Editor Controls */}
                <div className="mt-2">
                  <VisualTimeline />
                </div>


                <div className="tech-card !p-4 sm:!p-5 !bg-white/[0.02] !border-white/6 space-y-5 shadow-[0_10px_30px_rgba(2,6,23,0.18)]">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-accent/80 font-black uppercase tracking-[0.3em] leading-none mb-1">Copiar Estratégia</p>
                      <p className="text-[11px] text-slate-500">Use o nome curto para buscar mais rapido na central de afiliados.</p>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-black italic uppercase leading-tight text-white/95 line-clamp-3">{selectedProduct?.title || 'Carregando...'}</h3>
                      <button
                        onClick={() => {
                          if (selectedProduct?.title) {
                            const smartName = getSmartSearchName(selectedProduct.title);
                            copyToClipboard(smartName);
                            showToast("BUSCA INTELIGENTE COPIADA! 📋");
                          }
                          window.open("https://affiliate.shopee.com.br/offer/product_offer", "_blank");
                        }}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#EE4D2D]/8 text-[#ff8b73] border border-[#EE4D2D]/16 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#EE4D2D]/14 hover:text-white transition-all w-fit text-left leading-tight"
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
                          copyToClipboard(smartName); 
                          showToast("NOME CURTO COPIADO!"); 
                        }
                      }}
                      className="shrink-0 p-2.5 sm:p-3 bg-slate-900/70 border border-white/8 rounded-xl text-accent"
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
                  <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2">
                      <ShoppingBag size={14} className="text-accent" />
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Publicar na Vitrine <span className="text-accent italic">(Opcional)</span></span>
                        <p className="text-[11px] text-slate-500 mt-1">Adicione o item direto no seu link da bio com imagem, titulo e link afiliado.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (videoLegend) setBioTitle(videoLegend);
                        if (videoData?.thumbnail) setBioImageUrl(videoData.thumbnail);
                        showToast("✨ CAMPOS PREENCHIDOS!");
                      }}
                      className="text-[9px] font-black uppercase tracking-widest text-accent hover:text-white transition-colors flex items-center justify-center gap-1 bg-accent/5 px-2.5 py-1.5 rounded-lg border border-accent/10 shrink-0 w-full sm:w-auto"
                    >
                      <Sparkles size={10} /> Preencher Auto
                    </button>
                  </div>
                  
                  <div className="bg-black/25 border border-white/5 rounded-2xl p-4 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase font-black tracking-widest text-accent/70 ml-1">Link Afiliado</label>
                      <input 
                        type="url" 
                        placeholder="https://shope.ee/..." 
                        value={bioLink} 
                        onChange={e => setBioLink(e.target.value)}
                        className="w-full bg-[#0a0a0a]/90 border border-white/5 rounded-xl py-2.5 px-3 text-[11px] text-white focus:border-accent/40 outline-none transition-all"
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
                        className="w-full bg-[#0a0a0a]/90 border border-white/5 rounded-xl py-2.5 px-3 text-[11px] text-white focus:border-accent/40 outline-none transition-all"
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
                        className="w-full bg-[#0a0a0a]/90 border border-white/5 rounded-xl py-2.5 px-3 text-[11px] text-white focus:border-accent/40 outline-none transition-all h-20 resize-none font-medium"
                      />
                    </div>

                    <button
                      onClick={async () => {
                        const metadataSlug = user?.user_metadata?.store_slug || '';
                        const urlSlug = new URLSearchParams(window.location.search).get('loja') || '';
                        const targetSlug = (metadataSlug && metadataSlug !== 'meu-link')
                          ? metadataSlug.toLowerCase()
                          : (urlSlug && urlSlug !== 'meu-link')
                            ? urlSlug.toLowerCase()
                            : (storeSlug && storeSlug !== 'meu-link')
                              ? storeSlug.toLowerCase()
                              : '';

                        if (!targetSlug) {
                          showToast("CONFIGURE SUA LOJA PRIMEIRO!");
                          setStep('bio');
                          return;
                        }
                        if (!bioLink || !bioImageUrl || !bioTitle) {
                          showToast("⚠️ Preencha todos os campos da vitrine!");
                          return;
                        }
                        setIsSavingToBio(true);
                        const { error } = await supabase.from('bio_store').insert({
                          user_id: targetSlug,
                          title: bioTitle,
                          image_url: bioImageUrl,
                          affiliate_link: bioLink
                        });
                        setIsSavingToBio(false);
                        if (!error) {
                          showToast("🛍️ PUBLICADO COM SUCESSO!");
                          setBioLink(''); setBioImageUrl(''); setBioTitle('');
                        } else {
                          showToast("❌ Erro ao publicar: " + error.message);
                        }
                      }}
                      disabled={isSavingToBio}
                      className="w-full py-3 bg-accent/8 border border-accent/16 hover:bg-accent hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
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
                      onClick={()=>{ copyToClipboard(customCopy).then(()=>showToast("LEGENDA COPIADA!")); }}
                    >
                      <Copy size={20} />
                    </motion.button>
                  </div>
                </div>

              <div className="flex flex-col gap-4">
                <div className="space-y-2 text-center">
                  <p className="text-[10px] text-accent font-black uppercase tracking-[0.34em] leading-none italic">Ação final</p>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Escolha onde publicar</h3>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">Os atalhos abaixo ja levam seu criativo para o fluxo ideal de postagem, com copia e video prontos para uso.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => runAutomation('tiktok')}
                    className="group relative overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(226,232,240,0.94)_52%,rgba(186,230,253,0.98)_100%)] px-5 py-5 text-left shadow-[0_20px_60px_rgba(6,182,212,0.16)]"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.18),transparent_36%)] opacity-80" />
                    <div className="relative flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-lg shadow-slate-950/20 group-hover:scale-105 transition-transform">
                          <Zap size={20} fill="currentColor" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-[0.28em] text-slate-500">Publicar agora</p>
                          <span className="block text-sm font-black uppercase tracking-[0.18em] text-slate-950">TikTok</span>
                          <span className="block text-[10px] text-slate-600 font-bold uppercase tracking-[0.14em]">
                            {isMobile ? 'Abre app e anexa o video' : 'Download + upload guiado'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="px-2.5 py-1 rounded-full bg-slate-950 text-white text-[7px] font-black uppercase tracking-[0.24em]">
                          {isMobile ? 'NATIVO' : 'AUTO'}
                        </div>
                        <ArrowRight size={16} className="text-slate-950/60 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => runAutomation('shopee')}
                    className="group relative overflow-hidden rounded-[2rem] border border-orange-400/20 bg-[linear-gradient(135deg,rgba(154,52,18,0.94)_0%,rgba(234,88,12,0.96)_55%,rgba(251,146,60,0.95)_100%)] px-5 py-5 text-left shadow-[0_20px_60px_rgba(249,115,22,0.18)]"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_36%)] opacity-90" />
                    <div className="relative flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white text-orange-600 flex items-center justify-center shadow-lg shadow-orange-950/20 group-hover:scale-105 transition-transform">
                          <ShoppingBag size={20} fill="currentColor" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-[0.28em] text-orange-100/70">Publicar agora</p>
                          <span className="block text-sm font-black uppercase tracking-[0.18em] text-white">Shopee Videos</span>
                          <span className="block text-[10px] text-orange-50/80 font-bold uppercase tracking-[0.14em]">
                            {isMobile ? 'Abre app e anexa o video' : 'Download + upload guiado'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="px-2.5 py-1 rounded-full bg-white text-orange-600 text-[7px] font-black uppercase tracking-[0.24em]">
                          {isMobile ? 'NATIVO' : 'AUTO'}
                        </div>
                        <ArrowRight size={16} className="text-white/70 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </motion.button>
                </div>

                <div className="bg-white/5 p-5 rounded-[2.5rem] border border-white/5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-accent rounded-full shadow-[0_0_10px_#06b6d4]" />
                    <p className="text-[9px] font-black uppercase text-accent tracking-tighter">PROTOCOLO DE POSTAGEM:</p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    {isMobile ? (
                      <>Ao clicar em postar, seu celular abrirá o Compartilhamento Nativo. O vídeo será anexado e a legenda viral já foi <span className="text-white font-black italic">copiada!</span></>
                    ) : (
                      <>No computador, iniciaremos o <span className="text-white font-black italic">Macro de Automação</span>: faremos o download do vídeo, copiaremos a legenda e abriremos a página de postagem para você.</>
                    )}
                  </p>
                </div>
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
                    <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="space-y-4">
                      {!isMobile && (
                        <div className="bg-accent/10 border-2 border-accent/20 p-5 rounded-[2.5rem] space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-accent text-slate-950 flex items-center justify-center shadow-lg shadow-accent/20">
                              <Zap size={22} fill="currentColor" />
                            </div>
                            <h3 className="text-xs font-black italic uppercase tracking-tighter">PROTOCOLO FINALIZADO</h3>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3">
                            <div className="bg-slate-900/50 p-5 rounded-3xl border border-white/5 space-y-3">
                              <div className="flex items-center gap-2 text-accent">
                                <Download size={16} className="animate-bounce" />
                                <p className="text-[11px] font-black uppercase tracking-widest">COMO POSTAR NO PC:</p>
                              </div>
                              <div className="space-y-4">
                                <div className="flex gap-4">
                                  <span className="w-6 h-6 bg-white text-slate-950 rounded-full flex items-center justify-center text-xs font-black shrink-0">1</span>
                                  <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                                    O vídeo já foi <span className="text-accent font-black">BAIXADO</span> para o seu computador.
                                  </p>
                                </div>
                                <div className="flex gap-4">
                                  <span className="w-6 h-6 bg-white text-slate-950 rounded-full flex items-center justify-center text-xs font-black shrink-0">2</span>
                                  <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                                    Na aba do TikTok que abrimos, clique em <span className="text-white font-black italic">"SELECIONAR ARQUIVO"</span> e escolha o vídeo que acabou de baixar.
                                  </p>
                                </div>
                                <div className="flex gap-4">
                                  <span className="w-6 h-6 bg-white text-slate-950 rounded-full flex items-center justify-center text-xs font-black shrink-0">3</span>
                                  <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                                    Clique no campo de legenda e aperte <span className="text-green-400 font-black">CTRL + V</span>. A legenda viral já está copiada!
                                  </p>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-white/5 mt-2">
                                <p className="text-[9px] text-dim italic">
                                  * Por segurança, nenhuma plataforma permite que sites externos anexem arquivos 100% sozinhos. Este é o fluxo mais rápido possível permitido.
                                </p>
                              </div>
                            </div>
                          </div>

                          <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full h-12 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-accent hover:text-white transition-colors bg-accent/5"
                            onClick={() => window.open(getPlatformUrl(activePlatform), '_blank')}
                          >
                            O PORTAL NÃO ABRIU? CLIQUE AQUI
                          </motion.button>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
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
                      </div>
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
              className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-40"
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
                    const item = activeItems.find(p => p.id === h.product_id);

                    return (
                      <motion.div 
                        key={h.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="tech-card p-5 flex justify-between items-center group relative overflow-hidden bg-slate-900/40"
                      >
                        <div className="absolute inset-y-0 left-0 w-1.5 bg-accent" />
                        
                        <div className="space-y-2 min-w-0 pr-4">
                          <h3 className="text-sm font-black uppercase text-slate-100 truncate italic tracking-tight">{h.title || item?.title || "PRODUTO SINC"}</h3>
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

      {/* Bloqueio de Acesso Se o Trial Expirou e Não é PRO */}
      {trialExpired && !hasActivePro && !isLoadingAuth && ['list', 'scouting', 'ready', 'treating', 'automation'].includes(step) && (
        <LockScreen />
      )}

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
                if (tab.id === 'list' && !activeItems.length) {
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
            className="fixed bottom-24 left-1/2 px-8 py-4 bg-slate-900/95 backdrop-blur-3xl text-accent rounded-[2rem] min-w-[320px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-[500] border border-white/10"
          >
             <div className="flex items-center gap-4 justify-between">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
                  <div className="w-2 h-2 bg-accent rounded-full animate-ping" />
                </div>
                <span className="text-[10px] font-black italic uppercase tracking-[0.25em] text-white flex-1">{toast}</span>
                <div className="w-2 h-2 bg-white/10 rounded-full" />
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
              <div className="h-full flex flex-col overflow-y-auto custom-scrollbar relative">
                {/* Botão de Fechar Rápido para Mobile */}
                <button 
                  onClick={closePreview}
                  className="absolute top-6 right-6 z-[320] w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all active:scale-95 border border-white/5"
                >
                  <X size={20} />
                </button>

                <div className="p-8 pb-12 flex flex-col items-center gap-6">
                  <div className="w-full aspect-[9/16] bg-black rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative group">
                    <video 
                      src={downloadPreviewUrl || undefined} 
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

      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-2xl px-8 text-center"
          >
            <div className="relative mb-12">
               <motion.div 
                 animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                 transition={{ repeat: Infinity, duration: 4 }}
                 className="w-32 h-32 rounded-full border-2 border-accent/20 border-t-accent shadow-[0_0_50px_rgba(6,182,212,0.3)]"
               />
               <div className="absolute inset-0 flex items-center justify-center">
                 <Terminal size={32} className="text-accent animate-pulse" />
               </div>
            </div>
            
            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2 italic">
              PROCESSANDO <span className="text-accent underline decoration-accent/30 decoration-8 underline-offset-4">VÍDEO VIRAL</span>
            </h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mb-12">Renderizando Sincronização de Transições</p>
            
            <div className="w-full max-w-[200px] h-1.5 bg-white/5 rounded-full overflow-hidden mb-4 pr-[1px]">
               <motion.div 
                 initial={{ x: '-100%' }}
                 animate={{ x: '0%' }}
                 transition={{ duration: 15, ease: "linear" }}
                 className="h-full bg-gradient-to-r from-accent to-emerald-400 rounded-full"
               />
            </div>
            
            <div className="space-y-2 opacity-30 font-mono text-[8px] uppercase tracking-widest text-center">
               <p>Mapeando Batidas de Áudio...</p>
               <p>Aplicando Filtro Cinematic...</p>
               <p>Otimizando Compressão 4K...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSuccessOverlay && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-[1100] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-2xl p-8 text-center"
          >
            <motion.div 
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="w-24 h-24 bg-accent rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.5)] mb-6"
            >
              <CheckCircle2 size={48} className="text-slate-950" />
            </motion.div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2">VÍDEO BAIXADO!</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-8">Agora é só subir no TikTok/Shopee e lucrar! 🚀</p>
            <button 
              onClick={() => {
                setShowSuccessOverlay(false);
                setShowDownloadModal(false);
              }}
              className="px-10 py-5 bg-gradient-to-r from-accent to-emerald-400 text-slate-950 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] shadow-xl"
            >
              CONCLUÍDO
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LockScreen unificado é gerenciado próximo à bottom-nav para melhor controle de UX */}

      <AnimatePresence>
        {isCheckoutOpen && <CheckoutOverlay />}
      </AnimatePresence>
  </div>
);
};

export default App;
