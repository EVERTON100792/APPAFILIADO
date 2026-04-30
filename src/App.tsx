import React, { useState, useEffect, useRef, useMemo } from "react";
import "./index.css";
import {
  Globe,
  Music,
  ShoppingBag,
  ShoppingCart,
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
  Clock,
  Mic,
  Cpu,
  MessageCircle,
  Music2,
  Plus,
  Check,
  Play,
  Images,
  ExternalLink
} from "lucide-react";

import { supabase, isSupabaseConfigured } from "./supabaseClient";

import { motion, AnimatePresence } from "framer-motion";
import { VideoProcessor } from "./utils/VideoProcessor";
import type { ProcessingOptions } from "./utils/VideoProcessor";
import { BioStore } from "./components/BioStore";
import { BioManager } from "./components/BioManager";
import { LoginScreen } from "./components/LoginScreen";
import { HotmartService } from "./services/HotmartService";
import { TrialCountdown } from "./components/TrialCountdown";
import { AgentScouting } from "./components/AgentScouting";
import { ShopeeHub } from "./components/ShopeeHub";
import { ShopeeService } from "./services/shopeeService";
import { productDB } from './data/productDB';
import { TikTokPublisher } from "./components/TikTokPublisher";

import { generateViralScripts } from "./utils/viralScriptGenerator";
import { sanitizeShopeeLink } from "./utils/shopeeLinkUtils";
import { generateWhatsappMessage } from "./utils/shareUtils";
import {
  generateViralProductName,
  getSmartSearchName,
} from "./utils/viralNaming";
import { Copywriter } from "./utils/Copywriter";
import { VIRAL_MUSIC, TRANSITIONS, FILTERS } from "./utils/MusicLibrary";

const STRIPE_PRICE_ID = "price_1TIZKzKYzfLaHvnki5ZXmNG9";
const HOTMART_CHECKOUT_URL = "https://pay.hotmart.com/S105263156D";

const NICHE_KEYWORDS: Record<string, { positive: string[]; negative: string[] }> = {
  Cozinha: {
    positive: ["cozinha", "utensílios criativos", "airfryer", "panelas", "potes herméticos", "organizador cozinha", "itens tiktok", "receita", "utilidade", "casa", "lar"],
    negative: ["maquiagem", "pc", "gamer", "pet", "cachorro", "bebe", "kids", "fitness", "cosplay"],
  },
  Tecnologia: {
    positive: ["tech", "gadget", "unboxing", "setup", "pc", "smartphone", "eletronico", "acessorio", "inteligente", "smart", "bluetooth", "gamer", "computador"],
    negative: ["cozinha", "panela", "maquiagem", "bebe", "infantil", "pet", "limpeza"],
  },
  Beleza: {
    positive: ["make", "maquiagem", "skin", "cabelo", "beleza", "beauty", "tutorial", "cuidado", "pele", "rosto", "cosmetico", "perfume", "saúde"],
    negative: ["ferramenta", "carro", "moto", "gamer", "tecnologia", "comida", "pesca"],
  },
  Kids: {
    positive: ["bebe", "baby", "infantil", "criança", "kids", "brinquedo", "maternidade", "enxoval", "drone", "slime", "popit", "educativo"],
    negative: ["cerveja", "maquiagem", "limpeza", "casa", "cozinha"],
  },
  Utilidades: {
    positive: ["utilidade", "viral", "achadinho", "diferente", "incrível", "gadget", "curiosidade", "ferramenta", "resolvido", "problema"],
    negative: ["comida", "roupa", "infantil"],
  },
};

// --- NOVOS COMPONENTES DE BRANDING ---
const ViralSquadLogo = ({ size = "md", className = "", showText = true }: { size?: "sm" | "md" | "lg", className?: string, showText?: boolean }) => {
  const dimensions = {
    sm: { w: 32, h: 32, icon: 18 },
    md: { w: 48, h: 48, icon: 28 },
    lg: { w: 80, h: 80, icon: 44 }
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative group">
        <div className="absolute -inset-4 bg-emerald-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        <motion.div 
          whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
          className="relative z-10 rounded-2xl bg-gradient-to-br from-slate-900 to-black border border-white/10 flex items-center justify-center logo-glow shadow-2xl overflow-hidden"
          style={{ width: dimensions.w, height: dimensions.h }}
        >
          {/* Fundo de circuito sutil */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 100 100">
              <path d="M0 20 H100 M0 50 H100 M0 80 H100 M20 0 V100 M50 0 V100 M80 0 V100" stroke="#10b981" strokeWidth="0.5" />
            </svg>
          </div>
          
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: dimensions.icon, height: dimensions.icon }}>
            <motion.path 
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              d="M13 2L3 14H12L11 22L21 10H12L13 2Z" 
              fill="url(#logo_grad_vs)" 
              stroke="#10b981" 
              strokeWidth="0.5" 
            />
            {/* Play Button Icon inside Lightning */}
            <path d="M10 10L14 12L10 14V10Z" fill="#020617" />
            <defs>
              <linearGradient id="logo_grad_vs" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl sm:text-2xl font-black italic tracking-tighter leading-none text-metallic uppercase">VIRAL SQUAD</span>
          <span className="text-[8px] sm:text-[10px] font-black tracking-[0.4em] text-emerald-400/60 leading-none mt-1 uppercase">V6.0 PRO ENGINE</span>
        </div>
      )}
    </div>
  );
};
const STORE_PLACEHOLDER_SLUGS = [
  "",
  "meu-link",
  "admin",
  "null",
  "undefined",
  "default",
  "escolha-seu-link",
];

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

// Viral naming utilities are now imported from ./utils/viralNaming

// Auth lock to prevent concurrent getUser calls causing "Lock broken" errors
const authLockRef = { current: null as Promise<any> | null };

const safeGetUser = async () => {
  if (authLockRef.current) {
    await authLockRef.current;
    await new Promise(r => setTimeout(r, 100));
  }
  authLockRef.current = supabase.auth.getUser();
  try {
    return await authLockRef.current;
  } finally {
    authLockRef.current = null;
  }
};

// Step types for the main application navigation
type Step =
  | "home"
  | "scouting"
  | "list"
  | "ready"
  | "treating"
  | "automation"
  | "history"
  | "bio"
  | "plans"
  | "agents_scouting"
  | "shopee"
  | "onboarding_start"
  | "onboarding_config"
  | "onboarding_filtering"
  | "video_selection";

interface CheckoutOverlayProps {
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  checkoutUrl: string;
}

const CheckoutOverlay: React.FC<CheckoutOverlayProps> = ({
  isCheckoutOpen,
  setIsCheckoutOpen,
  checkoutUrl,
}) => {
  const [iframeLoading, setIframeLoading] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8"
    >
      {/* Backdrop com Blur Chique */}
      <motion.div
        initial={{ backdropFilter: "blur(0px)" }}
        animate={{ backdropFilter: "blur(16px)" }}
        exit={{ backdropFilter: "blur(0px)" }}
        className="absolute inset-0 bg-slate-950/80"
        onClick={() => setIsCheckoutOpen(false)}
      />

      {/* Modal de Checkout */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full h-full max-w-5xl bg-slate-900 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/10 shadow-[0_32px_120px_rgba(0,0,0,0.8)] overflow-hidden relative z-10 flex flex-col"
      >
        <div className="h-16 md:h-20 border-b border-white/5 px-6 md:px-10 flex items-center justify-between bg-slate-900/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <ViralSquadLogo size="sm" showText={false} />
            <div className="flex flex-col">
              <h3 className="text-sm font-black italic uppercase italic">
                SQUAD <span className="text-emerald-400">PRO</span>
              </h3>
              <div className="flex items-center gap-1.5 opacity-40">
                <Shield size={10} className="text-emerald-400" />
                <span className="text-[8px] font-bold uppercase tracking-[0.2em]">
                  Pagamento 100% Seguro via Hotmart
                </span>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsCheckoutOpen(false)}
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
          >
            <X size={20} />
          </motion.button>
        </div>

        {/* Área do Iframe */}
        <div className="flex-1 relative bg-white">
          {iframeLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-30 gap-6">
              <div className="relative">
                <div className="absolute inset-0 blur-2xl bg-accent/20 animate-pulse rounded-full" />
                <div className="w-16 h-16 border-[3px] border-accent/10 border-t-accent rounded-full animate-spin" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-[12px] font-black uppercase tracking-[0.3em] text-white">
                  Sincronizando Gateway
                </p>
                <p className="text-[9px] text-dim uppercase font-bold tracking-[0.1em]">
                  Aguarde um instante...
                </p>
              </div>
            </div>
          )}

          <iframe
            src={checkoutUrl}
            className="w-full h-full border-none"
            onLoad={() => setIframeLoading(false)}
            title="Hotmart Checkout"
            allow="payment"
            scrolling="yes"
          />
        </div>

        {/* Footer de Suporte */}
        <div className="h-10 bg-slate-950/50 flex items-center justify-center border-t border-white/5">
          <p className="text-[8px] md:text-[9px] font-bold text-slate-600 uppercase tracking-widest">
            Precisa de ajuda? Entre em contato com o suporte do Squad
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Transição instantânea sem animação para evitar pulos
const stepVariants = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 1 },
};

const stepTransition = {
  duration: 0.01,
};

const App: React.FC = () => {
  const bioUserId = new URLSearchParams(window.location.search).get("loja");
  if (bioUserId) return <BioStore userId={bioUserId} />;

  const [storeSlug, setStoreSlug] = useState("meu-link");
  const [storeReady, setStoreReady] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");

  const isStoreConfigured = () => {
    const normalizedSlug = (storeSlug || "").toLowerCase();
    return Boolean(
      storeReady &&
      normalizedSlug &&
      !STORE_PLACEHOLDER_SLUGS.includes(normalizedSlug),
    );
  };

  // Forçar sempre 'home' como primeira aba ao abrir, se estiver configurado
  const [step, setStep] = useState<Step>("home");
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [trialRemaining, setTrialRemaining] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const hasAccessToPlatform =
    isPro || (trialRemaining !== null && trialRemaining > 0);
  const isTrialExpiringSoon =
    !isPro &&
    trialRemaining !== null &&
    trialRemaining > 0 &&
    trialRemaining <= 4 * 60 * 60 * 1000;
  const isProExpiringSoon =
    isPro &&
    trialRemaining !== null &&
    trialRemaining > 0 &&
    trialRemaining <= 48 * 60 * 60 * 1000;
  const showAccessBanner = isTrialExpiringSoon || isProExpiringSoon;

  const [activeFilter, setActiveFilter] = useState("none");
  const [activeTransition, setActiveTransition] = useState("none");
  const [isMuted, setIsMuted] = useState(false);
  const [videoLegend, setVideoLegend] = useState("");
  const [useNarration, setUseNarration] = useState(true);
  const [narrationVoice, setNarrationVoice] = useState<'M' | 'F'>('F');
  const [isProcessing, setIsProcessing] = useState(false);
  const [shopeeHubProducts, setShopeeHubProducts] = useState<any[]>([]);
  const [shopeeHubKeyword, setShopeeHubKeyword] = useState("");
  const [shopeeHubTab, setShopeeHubTab] = useState<any>("all");
  const [activePlatform, setActivePlatform] = useState<"tiktok" | "shopee">(
    "tiktok",
  );
  const [videoToPreview, setVideoToPreview] = useState<any>(null);
  const userMetadataRef = useRef<Record<string, any>>({});
  const metadataUpdateInFlightRef = useRef(false);
  const pendingMetadataRef = useRef<Record<string, any> | null>(null);
  const lastPersistedStepRef = useRef<Step | null>(null);

  const updateUserMetadata = async (patch: Record<string, any>, silent = false) => {
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

    // Se for silencioso, não chamamos setUser imediatamente para evitar flickering na UI
    if (!silent) {
      setUser((prev: any) =>
        prev ? { ...prev, user_metadata: nextMetadata } : prev,
      );
    }

    if (metadataUpdateInFlightRef.current) {
      return user;
    }

    metadataUpdateInFlightRef.current = true;

    try {
      while (pendingMetadataRef.current) {
        const payload = pendingMetadataRef.current;
        pendingMetadataRef.current = null;

        const { data, error } = await supabase.auth.updateUser({
          data: payload,
        });

        if (error) {
          return null;
        }

        if (data.user) {
          userMetadataRef.current = data.user.user_metadata || payload;
          lastPersistedStepRef.current =
            (data.user.user_metadata?.last_step as Step | undefined) || null;
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
    const legacySlug = (
      localStorage.getItem("bio_store_slug") || ""
    ).toLowerCase();
    const legacyReady = localStorage.getItem("bio_store_ready") === "true";
    const metadataSlug =
      typeof metadata.store_slug === "string"
        ? metadata.store_slug.toLowerCase()
        : "";
    const metadataReady = metadata.store_ready === true;
    let inferredSlug = metadataSlug || legacySlug || "";
    let inferredReady = Boolean(
      metadataReady ||
      (legacyReady &&
        inferredSlug &&
        !STORE_PLACEHOLDER_SLUGS.includes(inferredSlug)),
    );

    if (!inferredReady && authUser.id) {
      if (metadataSlug && !STORE_PLACEHOLDER_SLUGS.includes(metadataSlug)) {
        const { data: slugStoreRows } = await supabase
          .from("bio_store")
          .select("user_id")
          .eq("user_id", metadataSlug)
          .limit(1);

        if (slugStoreRows && slugStoreRows.length > 0) {
          inferredSlug = metadataSlug;
          inferredReady = true;
        }
      }
    }

    const nextSlug = inferredSlug || "meu-link";
    const nextReady = inferredReady;

    setStoreSlug(nextSlug || "meu-link");
    setStoreReady(nextReady);

    // Carregar ID do Shopee do perfil
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("shopee_id")
        .eq("id", authUser.id)
        .single();
      if (profile?.shopee_id) {
        setUserShopeeId(profile.shopee_id);
      }
    } catch (e) {}

    if (
      (!metadataSlug && nextReady) ||
      (!metadataReady && nextReady) ||
      (!metadataSlug && legacySlug) ||
      (!metadataReady && legacyReady)
    ) {
      await updateUserMetadata({
        store_slug: nextSlug,
        store_ready: nextReady,
      });
      localStorage.removeItem("bio_store_slug");
      localStorage.removeItem("bio_store_ready");
    }
  };

  const handleStoreConfigured = async (slug: string) => {
    setStoreSlug(slug);
    setStoreReady(true);
    await updateUserMetadata({
      store_slug: slug,
      store_ready: true,
      last_step: "bio",
    });
  };

  const handleUpgradeToPro = () => {
    if (isPro) {
      handleManageSubscription();
      return;
    }
    // Para Trial ou Expirados, abrimos o Checkout Premium
    setCheckoutUrl(HOTMART_CHECKOUT_URL);
    setIsCheckoutOpen(true);
  };

  const handleManageSubscription = async () => {
    // Portal de gerenciamento da Hotmart bloqueia iframes (X-Frame-Options)
    window.open("https://purchase.hotmart.com/", "_blank");
    showToast("ABRINDO PORTAL DE COMPRAS HOTMART...");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setStoreSlug("meu-link");
    setStoreReady(false);
    setStep("home");
    window.location.reload();
  };

  // Advanced Editing State
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [transitionTimestamps, setTransitionTimestamps] = useState<number[]>(
    [],
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isTransitionActive, setIsTransitionActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Sync isPlaying with video element

  const filters = [
    { id: "none", name: "Original" },
    { id: "elite", name: "Elite Glow" },
    { id: "glitch", name: "Glitch Viral" },
    { id: "vhs", name: "VHS Elite" },
    { id: "bloom", name: "Dreamy Bloom" },
    { id: "cinematic", name: "Cinematic" },
    { id: "bw", name: "Dramático" },
    { id: "ultra8k", name: "💎 8K ULTRA HD" },
  ];

  const getPlatformUrl = (type: "shopee" | "tiktok") => {
    if (type === "shopee") {
      // Deep Link para App Shopee (Brasil) ou fallback Web
      return isMobile ? "shopeebr://shopee-video" : "https://shopee.com.br/m/shopee-video";
    } else {
      if (isMobile) return "snssdk1233://";
      return "https://www.tiktok.com/upload";
    }
  };

  // Publicar na Vitrine
  const publishToVitrine = async () => {
    if (!selectedProduct) {
      showToast("SELECIONE UM PRODUTO PRIMEIRO!");
      return;
    }
    showToast("PUBLICANDO NA VITRINE...");
    await addToBio(selectedProduct, {} as any);
  };

  // Publicar no WhatsApp
  const publishToWhatsApp = async () => {
    if (!selectedProduct) {
      showToast("SELECIONE UM PRODUTO PRIMEIRO!");
      return;
    }

    const productName = selectedProduct.title || selectedProduct.query || "Produto";
    const productPrice = selectedProduct.price || "R$ 0,00";
    const affiliateLink = selectedProduct.affiliate_link || selectedProduct.url || "";

    const message = `🔥 *${productName.toUpperCase()}* 🔥

💰 *PREÇO:* ${productPrice}

✨ *DON'T MISS OUT!* Este produto está bombando! 

🛒 *COMPRE AGORA:* ${affiliateLink}

👉 *LINK DIRETO:* ${affiliateLink}

⚡ *OFERTA LIMITADA!* Corra antes que esgotar!`;

    try {
      await navigator.clipboard.writeText(message);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = message;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    showToast("MENSAGEM COPIADA! Abra o WhatsApp.");

    const waUrl = isMobile 
      ? `whatsapp://send?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(waUrl, "_blank");
  };

  const [publicationHistory, setPublicationHistory] = useState<any[]>([]);
  const [activeItems, setActiveItems] = useState<any[]>([]);
  const [_productList, setProductList] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [videoData, setVideoData] = useState<any>(null);
  const [customCopy, setCustomCopy] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [automationFinished, setAutomationFinished] = useState(false);
  const [boostMode, setBoostMode] = useState("none");
  const [activeNiche, setActiveNiche] = useState("Cozinha");
  const [customLink, setCustomLink] = useState("");
  const [consoleLogs, setConsoleLogs] = useState<
    { msg: string; type?: string }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [videoResults, setVideoResults] = useState<any[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [databaseProducts, setDatabaseProducts] = useState<any[]>([]);
  const [isFindingNewItems, setIsFindingNewItems] = useState(false);
  const [userShopeeId, setUserShopeeId] = useState<string | null>(null);
  const [pendingAutomationMode, setPendingAutomationMode] = useState<'original' | 'custom'>('custom');

  // ── SISTEMA DE ÁUDIO VIRAL ──
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);
  const [audioMixOption, setAudioMixOption] = useState<
    "original" | "music" | "mix" | "mute"
  >("original");
  const [treatingStatus, setTreatingStatus] = useState(
    "Preparando pipeline viral...",
  );
  const [treatingProgress, setTreatingProgress] = useState(8);
  const [treatingChecklist, setTreatingChecklist] = useState<string[]>([]);

  // Músicas da MusicLibrary — embaralhadas para sempre mostrar opções diferentes
  const viralTracks = useMemo(() => {
    return [...VIRAL_MUSIC]
      .sort(() => Math.random() - 0.5)
      .slice(0, 12)
      .map(m => ({ id: m.id, name: m.name, url: m.url }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Bio Store Quick Add State
  const [bioTitle, setBioTitle] = useState("");
  const [bioImageUrl, setBioImageUrl] = useState("");
  const [bioLink, setBioLink] = useState("");
  const [isSavingToBio, setIsSavingToBio] = useState(false);

  // ── MONETIZAÇÃO & ACESSO GATED ──
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isHydratingApp, setIsHydratingApp] = useState(true);

  const checkAccess = async (currentUser?: any) => {
    setIsHydratingApp(true);
    try {
      // 0. Bypass de Desenvolvedor via URL
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("admin") === "true") {
        await updateUserMetadata({
          store_slug: "everton",
          store_ready: true,
          last_step: "home",
        });
        window.location.replace(
          window.location.origin + window.location.pathname,
        );
        return;
      }

      const slug = (
        currentUser?.user_metadata?.store_slug ||
        user?.user_metadata?.store_slug ||
        ""
      ).toLowerCase();

      // 1. Check if Admin (mas continua para configurar o estado)
      const adminSlugs = [
        "admin",
        "everto",
        "everton",
        "squad-pro",
        "achadinhos_brasil_",
      ];
      const isAdmin = adminSlugs.includes(slug);
      if (isAdmin) {
        setIsPro(true);
        setTrialExpired(false);
        setTrialRemaining(null);
      }

      // 2. Check Use provided user or fallback to auth
      const activeUser =
        currentUser || (await safeGetUser()).data.user;

      if (activeUser) {
        userMetadataRef.current = activeUser.user_metadata || {};
        lastPersistedStepRef.current =
          (activeUser.user_metadata?.last_step as Step | undefined) || null;
        setUser(activeUser);
        await applyUserAppState(activeUser);
        if (!isAdmin) {
          const status = await HotmartService.checkSubscriptionStatus(
            supabase,
            activeUser.id,
          );
          setIsPro(status.isPro);
          setTrialExpired(status.trialExpired);
          setTrialRemaining(status.trialRemainingMs ?? null);
        }
      } else {
        // No anonymous trial anymore, user must log in
        setIsPro(false);
        setTrialExpired(false);
        setTrialRemaining(null);
        setStoreSlug("meu-link");
        setStoreReady(false);
      }
    } catch (err: any) {
      console.error("Erro ao verificar acesso:", err?.message || err);
      if (err?.name === "AbortError" || err?.message?.includes("Lock broken")) {
        await new Promise(r => setTimeout(r, 1000));
      }
    } finally {
      setIsHydratingApp(false);
      setIsLoadingAuth(false);
    }
  };

  const startScouting = async () => {
    setStep("agents_scouting");
  };

  // ── INTERVALO DE TRIAL EM TEMPO REAL ──
  useEffect(() => {
    if (!user || isPro || !trialRemaining) return;

    const interval = setInterval(() => {
      setTrialRemaining((prev) => {
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
      const shouldPause =
        showDownloadModal ||
        isPreparingDownload ||
        isProcessing ||
        step !== "ready";

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
  }, [
    isPlaying,
    showDownloadModal,
    isPreparingDownload,
    isProcessing,
    step,
    isMuted,
  ]);

  // Ultra-Premium Scanning HUD
  const ScanningHUD = ({ active }: { active: boolean }) => (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="scanning-hud"
        >
          <div className="cyber-grid" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(6,182,212,0.12),transparent_32%),linear-gradient(180deg,rgba(2,6,23,0.74)_0%,rgba(2,6,23,0.92)_100%)]" />

          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center gap-8 relative z-20"
          >
            <div className="relative">
              <div className="absolute inset-0 blur-[70px] bg-accent/20 rounded-full" />
              <div className="absolute -inset-8 rounded-full border border-white/10 opacity-40" />
              <div className="w-28 h-28 rounded-[2rem] bg-slate-900/95 border-2 border-white/70 flex items-center justify-center relative shadow-[0_0_80px_rgba(6,182,212,0.18)] overflow-hidden">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 24,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 opacity-[0.06]"
                >
                  <div className="w-full h-full border-4 border-dashed border-accent rounded-full" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{
                    duration: 4.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
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
                  <p className="text-[10px] text-slate-300/90 font-black tracking-[0.45em] uppercase">
                    Security Level: Maximum
                  </p>
                  <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ x: ["-65%", "165%"] }}
                      transition={{
                        duration: 4.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{ width: "38%" }}
                      className="h-full rounded-full bg-gradient-to-r from-transparent via-accent to-transparent"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Sincronizando sinais de demanda, criativos virais e produtos
                    com maior potencial de conversao.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const niches = [
    { id: "Todos", label: "Todos", icon: "🔥" },
    { id: "Cozinha", label: "Cozinha", icon: "🍳" },
    { id: "Tecnologia", label: "Eletrônicos", icon: "⚡" },
    { id: "Beleza", label: "Beleza", icon: "💄" },
    { id: "Kids", label: "Kids & Brinquedos", icon: "🧸" },
    { id: "Utilidades", label: "Utilidades", icon: "💡" },
  ];
  const getProductScore = (product: any) => {
    const salesStr = product.sales || "";
    const comm = product.commission_pct || 0;
    
    let salesValue = 0;
    if (typeof salesStr === 'number') {
      salesValue = salesStr;
    } else {
      const match = typeof salesStr === 'string' ? salesStr.match(/[\d.]+/) : null;
      if (match) {
        let num = parseFloat(match[0]);
        if (salesStr.toLowerCase().includes('k')) num *= 1000;
        if (salesStr.toLowerCase().includes('m')) num *= 1000000;
        salesValue = num;
      }
    }
    // A ideia visual solicitada: trazer produtos focados nos mais vendidos + boa comissão
    // Usamos um multiplicador: Vendas absolutas x Modificador de Comissão %
    return salesValue * (1 + (comm / 100));
  };

  const addLog = (msg: string, type: "info" | "success" | "error" | "warn" = "info") => {
    setConsoleLogs((prev) => [...prev.slice(-19), { msg, type }]);
  };

  const getInfinitePool = (niche: string) => {
    // O usuário solicitou 100% da base de dados (Supabase).
    // Nenhum fallback local de productDB deve ser usado aqui.
    
    const dbValid = databaseProducts && databaseProducts.length > 0 ? databaseProducts : [];

    // Os produtos que vêm da base de dados podem ter a coluna como string (ex: commission: "25%"). 
    // Precisamos normalizar para number (commission_pct) que a nossa lógica utiliza para o '.sort()'.
    const normalizedPool = dbValid.map(p => {
      let commissionValue = p.commission_pct;
      if (commissionValue === undefined && typeof p.commission === 'string') {
        const parsed = parseInt(p.commission.replace('%', ''), 10);
        commissionValue = isNaN(parsed) ? 0 : parsed;
      } else if (commissionValue === undefined) {
        commissionValue = 0;
      }
      return {
        ...p,
        commission_pct: commissionValue
      };
    });

    // Filtra pelo nicho ativo a partir apenas da base de dados real
    const staticPool =
      niche === "Todos"
        ? normalizedPool
        : normalizedPool.filter((p) => p.niche === niche);

    // Retira os que já estão no histórico de publicação
    const finalPool = staticPool.filter(
      (p) => !publicationHistory.some((ph) => ph.product_id === p.id),
    );

    return finalPool;
  };

  // Fetch central database independently ONCE on app load
  useEffect(() => {
    fetchProductsDB();
  }, []);

  // Persistence
  useEffect(() => {
    if (isLoadingAuth || isHydratingApp || !user) return;

    fetchHistory();
    loadScoutedProducts();

    if (storeSlug === "meu-link" && !storeReady) {
      if (step !== "bio") {
        setStep("home");
      }
      return;
    }

    const lastStep = user.user_metadata?.last_step as Step | undefined;
    if (
      lastStep &&
      !["scouting", "ready", "treating", "automation"].includes(lastStep)
    ) {
      setStep(lastStep);
    } else {
      setStep("home");
    }
  }, [user?.id]);

  const loadScoutedProducts = async () => {
    const userId = getUserId();
    if (!userId) return;
    const { data } = await supabase
      .from("scouted_products")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      setActiveItems(
        data.map((item) => ({
          ...item,
          id: item.product_id || item.id, // Compatibilidade com IDs antigos
          commission_pct: parseInt(item.commission || "0"),
        })),
      );
    }
  };

  const saveScoutedProducts = async (items: any[]) => {
    const userId = getUserId();
    if (!userId) return;
    await supabase.from("scouted_products").delete().eq("user_id", userId);
    const productsToSave = items.map((p) => ({
      user_id: userId,
      product_id: p.id,
      title: p.title,
      image_url: p.image || p.thumbnail,
      affiliate_link: p.link || p.url,
      commission: p.commission_pct?.toString(),
      sales: p.sales,
      price: p.price,
      niche: p.niche || activeNiche,
    }));

    const { error } = await supabase
      .from("scouted_products")
      .insert(productsToSave);
    if (error) console.error("Erro ao salvar scouted_products:", error);
  };

  const fetchProductsDB = async () => {
    const { data } = await supabase.from("products").select("*");
    if (data) setDatabaseProducts(data);
  };

  // Sync Supabase when entering history tab
  useEffect(() => {
    if (step === "history") {
      fetchHistory();
    }
  }, [step]);

  const fetchHistory = async () => {
    const userId = getUserId();
    if (!userId) return;
    const { data } = await supabase
      .from("publication_history")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false });

    if (data) {
      setPublicationHistory(data);
    }
  };

  // Persistence Sync
  useEffect(() => {
    if (!user || ["scouting", "ready", "treating", "automation"].includes(step))
      return;
    if (lastPersistedStepRef.current === step) return;

    const timer = setTimeout(() => {
      lastPersistedStepRef.current = step;
      // Usamos update silencioso para persistência de aba para evitar flickering
      void updateUserMetadata({
        last_step: step,
      }, true);
    }, 800);

    return () => clearTimeout(timer);
  }, [step, user]);

  // Transition synchronization effect
  useEffect(() => {
    if (step !== "ready" || !videoRef.current) return;

    const checkTransitions = () => {
      if (!videoRef.current) return;
      const ct = videoRef.current.currentTime;

      const transitionDuration = 1.5;
      const isNear = transitionTimestamps.some(
        (ts) => ct >= ts && ct < ts + transitionDuration,
      );

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
    const timer = setInterval(
      () => {
        setProductList((prev) =>
          prev.map((p) => {
            if (!p.price || typeof p.price !== "string") return p;
            const currentPrice = parseFloat(
              p.price.replace("R$ ", "").replace(",", "."),
            );
            const newPrice = currentPrice + (Math.random() - 0.5) * 2;
            return {
              ...p,
              price: `R$ ${newPrice.toFixed(2).replace(".", ",")}`,
            };
          }),
        );
      },
      5 * 60 * 1000,
    );
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
      product_id: String(product.id || product.itemid || product.item_id || product.product_id || "sem-id"),
      title: String(product.title || product.item_name || product.name || product.query || "Produto Sinc"),
      platform: String(platform || "Shopee"),
    };

    const { data, error } = await supabase
      .from("publication_history")
      .insert([payload])
      .select();

    if (error) {
      showToast("ERRO AO SALVAR NO BANCO");
      return false;
    }

    if (data && data.length > 0) {
      setPublicationHistory((prev) => [data[0], ...prev]);
      showToast("PUBLICAÇÃO REGISTRADA! ☁️");
    }
    return true;
  };

  const deleteFromSupabase = async (id: string) => {
    const { error } = await supabase
      .from("publication_history")
      .delete()
      .eq("id", id);

    if (!error) {
      setPublicationHistory((prev) => prev.filter((h) => h.id !== id));
      showToast("REMOVIDO DO SUPABASE! 🗑️");
    } else {
      showToast("ERRO AO REMOVER: " + error.message);
    }
  };

  const [isMobile, setIsMobile] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const checkMobile = () => {
      const userAgent =
        navigator.userAgent || navigator.vendor || (window as any).opera;
      const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isLargeScreen = window.innerWidth > 1024;
      setIsMobile(
        (/iPhone|iPad|iPod|Android/i.test(userAgent) || isTouch) &&
          !isLargeScreen,
      );
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isSmall = windowSize.width < 640;
  const isMedium = windowSize.width >= 640 && windowSize.width < 1024;
  const isLarge = windowSize.width >= 1024;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const generateCreativeLegend = (product: any) => {
    try {
      const title = (product?.title || "Achadinho Viral") as string;
      const sales = (product?.sales || "Várias") as string;

      const hooks = [
        `ENCONTREI! 😱 O ${title} que está viralizando no mundo todo!`,
        `POV: Você acaba de achar o segredo para facilitar sua rotina. ✨`,
        `Gente, olha esse achadinho! O ${title} é simplesmente genial!`,
        `Parece mentira, mas esse ${title} resolve a sua vida! 😍`,
        `UTILIDADE PÚBLICA: Se você busca praticidade, o ${title} é a escolha certa! 🏆`,
        `Para de rolar o feed e olha o que essa maravilha faz! 🛑`,
        `A Shopee não para de me surpreender! O ${title} superou todas as expectativas.`,
        `Sério, ${sales} unidades vendidas e eu entendi o porquê de tanto sucesso! 🔥`,
        `O segredo para um lar mais moderno e organizado tá nesse vídeo! 💎`,
        `Achado de Ouro! 💎 O ${title} com qualidade premium e preço de banana.`,
        `Dica de quem já testou: Você PRECISA ter o ${title} na sua casa!`,
        `Eu não sabia que minha vida seria tão melhor com o ${title}... 😳`,
        `Design impecável e funcionalidade nota 10. Shopee acertou demais!`,
        `Terapia de compras com propósito: Esse ${title} é puro investimento! 🛍️`,
        `O item que faltava na sua coleção acabou de aparecer na sua tela!`,
      ];

      const benefits = [
        `A tecnologia desse item é surreal pelo custo-benefício que ele entrega!`,
        `Material de alta resistência, acabamento premium e chega super rápido.`,
        `É aquele tipo de achado que esgota em minutos. Qualidade 10/10!`,
        `Um investimento pequeno que traz uma praticidade gigantesca pro dia a dia.`,
        `Se você quer modernidade e estilo, esse item foi feito pra você.`,
        `Resolve aquele problema chato com elegância e eficiência absoluta.`,
        `Não é à toa que virou febre entre os maiores influenciadores de casa!`,
        `Economize tempo e garanta um resultado profissional com esse ${title}.`,
        `Gostei tanto da experiência que já garanti mais um pra presentear! 😂`,
        `É o equilíbrio perfeito entre design minimalista e potência máxima.`,
      ];

      const ctas = [
        `🛒 O LINK COM DESCONTO EXCLUSIVO tá na minha BIO! Corre antes que acabe! 🚀`,
        `✅ Garanta o seu agora! O link oficial está liberado na minha BIO do perfil! 🛍️`,
        `👇 Link direto e seguro fixado na minha BIO para você aproveitar!`,
        `⚠️ Promoção por tempo limitado! Link na Bio esperando por você! Vale muito!`,
        `📦 Frete grátis e desconto especial apenas pelo link da minha Bio! ⭐`,
        `Aperte no link da Bio e adquira o seu ${title} com segurança total!`,
      ];

      const growth = [
        `👉 Siga meu perfil @AchadosVirais para não perder os melhores achados todos os dias! ✨`,
        `💡 Me siga para receber dicas diárias que facilitam sua vida!`,
        `Eu posto os melhores virais da internet todo dia aqui. Me segue pra acompanhar! 🔥`,
        `Quer ver mais vídeos como este? Já me segue para ficar por dentro de tudo! 💖`,
        `Não esquece de seguir para receber as ofertas VIP antes de todo mundo!`,
      ];

      const hashtags = [
        "#shopee #achadinhos #shopeebrasil #viral #compras #dicas #casa #utilidades #promoção #oferta #compraonline #achadosshopee #shopeefinds",
        "#achadosshopee #shopeebr #comprinhas #organização #tecnologia #beleza #achadinhosshopee #marketingdeafiliados #vendas #lucro",
        "#shopeefinds #viralvideos #dicasdecasa #utilidadedomestica #achadosdasemana #produtosvirais #casaorganizada #achadinhosbr",
      ];

      const seed = Math.floor(Math.random() * 1000);
      const h = hooks[seed % hooks.length];
      const b = benefits[(seed + 7) % benefits.length];
      const c = ctas[(seed + 13) % ctas.length];
      const g = growth[(seed + 19) % growth.length];
      const hash = hashtags[seed % hashtags.length];

      const variations = [
        `🔥 ${title.toUpperCase()} 🔥\n\n${h}\n\n✨ ${b}\n\n${c}\n\n${g}\n\n${hash}`,
        `💎 ACHADO EXCLUSIVO 💎\n\n${h}\n\n✅ ${b}\n\n🛍️ LINK NA BIO!\n\n${g}\n\n${hash}`,
        `Você não vai acreditar nesse achado! 😍\n\n${h}\n\n${c}\n\n${g}\n\n${hash}`,
        `🚀 ITEM IMPORTADO VIRAL 🚀\n\n${h}\n\n${b}\n\n🛍️ COMPRE NO LINK DA BIO!\n\n${g}\n\n${hash}`,
      ];

      return variations[seed % variations.length];
    } catch (error) {
      return "Encontrei o link perfeito na Shopee! ✅ Confira na minha bio agora e aproveite o desconto!";
    }
  };

  const generateOverlayLegend = (product: any) => {
    const title = (product?.title || "ESSE ITEM")
      .split(" ")
      .slice(0, 3)
      .join(" ")
      .toUpperCase();

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
      "📦 FRETE GRÁTIS!",
    ];

    const parts2 = [
      `ESTE ${title}`,
      "É UM MILAGRE!",
      "MUDOU MINHA VIDA!",
      "TODO MUNDO QUER!",
      "MELHOR COMPRA!",
      "SUCESSO TOTAL!",
      "ACHADO VIP!",
    ];

    const seed = Math.floor(Math.random() * 1000);
    return `${parts1[seed % parts1.length]}\n${parts2[seed % parts2.length]}`;
  };

  const optimizeCaptionForPlatform = (caption: string, platform: "tiktok" | "shopee") => {
    if (!caption) return "";
    
    if (platform === "tiktok") {
      return caption;
    }
    
    // Shopee: Estilo Focado em Vendas + Nicho Dinâmico (Limite 150 chars)
    const titles = [
      "💎 ACHADO EXCLUSIVO 💎", "✨ ACHADINHO DE HOJE ✨", "🔥 O MAIS VENDIDO 🔥",
      "😱 OLHA ESSE ACHADO 😱", "🏆 QUALIDADE PREMIUM 🏆", "🎁 PRESENTE PERFEITO 🎁",
      "💎 ACHADO DE OURO 💎", "⭐ RECOMENDADO ⭐", "🛒 DIRETO DA SHOPEE 🛒",
      "💥 PROMOÇÃO FLASH 💥", "🚀 ITEM MAIS VIRAL 🚀", "✅ TESTADO E APROVADO ✅"
    ];
    
    const seed = Math.floor(Math.random() * 1000);
    const selectedTitle = titles[seed % titles.length];
    
    // Lógica de Detecção de Nicho
    const productTitle = (selectedProduct?.item_name || selectedProduct?.title || "").toLowerCase();
    const nicheTags: string[] = [];
    
    if (productTitle.includes("cozinha") || productTitle.includes("detergente") || productTitle.includes("prato") || productTitle.includes("copo")) {
      nicheTags.push("#cozinha", "#utensilios", "#utilidadesdomesticas");
    } else if (productTitle.includes("limpeza") || productTitle.includes("banheiro") || productTitle.includes("faxina")) {
      nicheTags.push("#limpeza", "#casaorganizada", "#dicasdecasa");
    } else if (productTitle.includes("fone") || productTitle.includes("relogio") || productTitle.includes("smartwatch") || productTitle.includes("gamer")) {
      nicheTags.push("#tecnologia", "#eletronicos", "#gadgets");
    } else if (productTitle.includes("maquiagem") || productTitle.includes("beleza") || productTitle.includes("skincare")) {
      nicheTags.push("#beleza", "#maquiagem", "#autocuidado");
    } else if (productTitle.includes("organizador") || productTitle.includes("caixa") || productTitle.includes("suporte")) {
      nicheTags.push("#organização", "#casa", "#pessoalorganizer");
    } else {
      nicheTags.push("#utilidades", "#dicas", "#casa");
    }

    // Hashtags de Intenção de Compra Fixas
    const baseTags = [
      "#achadosshopee", "#comprinhas", "#shopeefinds", "#ofertas", 
      "#achadinhos", "#shopeevideo", "#shopeebr", "#promoção"
    ];
    
    const allTags = [...new Set([...nicheTags, ...baseTags])].join(" ");
    let result = `${selectedTitle}\n${allTags}`;
    
    if (result.length > 150) {
      const tagsArray = allTags.split(" ");
      while (tagsArray.length > 1 && `${selectedTitle}\n${tagsArray.join(" ")}`.length > 150) {
        tagsArray.pop();
      }
      result = `${selectedTitle}\n${tagsArray.join(" ")}`;
    }
    
    return result.substring(0, 150);
  };

  const resetVideoEditor = () => {
    setActiveFilter("none");
    setActiveTransition("none");
    setVideoLegend("");
  };

  const goBackToList = () => {
    setStep("shopee");
    setAutomationFinished(false);
  };

  const goBackToShopee = () => {
    setStep("shopee");
  };

  const refillProductList = (niche: string) => {
    setActiveItems((prev) => {
      // Manter na tela APENAS itens que AINDA NÃO FORAM POSTADOS
      // e o item que não é o selecionado atualmente se estivermos no meio de um processo (opcional)
      const currentUnpublished = prev.filter(
        (p) => !publicationHistory.some((ph) => ph.product_id === p.id),
      );

      // Precisamos completar para ter 15 ativos na tela.
      const needed = 15 - currentUnpublished.length;

      if (needed <= 0) return currentUnpublished;

      // Obtém produtos do pool infinito que não estão sendo mostrados
      const infinitePool = getInfinitePool(niche);
      const currentlyShownIds = new Set(currentUnpublished.map((p) => p.id));
      const available = infinitePool.filter(
        (p) => !currentlyShownIds.has(p.id),
      );

      // Filtra e randomiza os top items cruzando Vendas + Comissão
      const topAvailable = [...available]
        .sort((a, b) => getProductScore(b) - getProductScore(a))
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
    const items =
      niche === "Todos" ? shuffled.slice(0, 50) : shuffled.slice(0, 15);

    setActiveItems(items);
    await saveScoutedProducts(items);
  };

  const discoverNicheNews = async (nicheId: string) => {
    if (isFindingNewItems) return;
    
    setIsFindingNewItems(true);
    addLog(`INICIANDO BUSCA DE NOVIDADES PARA: ${nicheId.toUpperCase()}`, "info");
    
    try {
      const config = NICHE_KEYWORDS[nicheId];
      if (!config) throw new Error("Configuração de nicho não encontrada.");
      
      // Escolhe uma palavra-chave aleatória do nicho para variar os resultados
      const randomKeyword = config.positive[Math.floor(Math.random() * config.positive.length)];
      addLog(`EXPLORANDO TENDÊNCIAS: "${randomKeyword.toUpperCase()}"...`, "info");
      
      const newProducts = await ShopeeService.searchProducts({
        keyword: randomKeyword,
        sort_by: "sales", // Priorizar os mais vendidos
      }, userShopeeId || undefined);
      
      if (newProducts.length === 0) {
        showToast("Nenhuma novidade encontrada no momento.");
        return;
      }

      // Atribui o nicho aos produtos encontrados
      const taggedProducts = newProducts.map(p => ({
        ...p,
        niche: nicheId,
        id: p.item_id // Garantir que tenha ID para a lógica de filtro
      }));

      // Atualiza o pool global e os itens ativos
      setDatabaseProducts(prev => {
        const existingIds = new Set(prev.map(p => p.item_id || p.id));
        const nonDuplicates = taggedProducts.filter(p => !existingIds.has(p.item_id));
        return [...nonDuplicates, ...prev];
      });

      setActiveItems(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const freshOnes = taggedProducts.filter(p => !existingIds.has(p.id)).slice(0, 15);
        return [...freshOnes, ...prev].slice(0, 20); // Prioriza os novos no topo
      });

      addLog(`SUCESSO! ${taggedProducts.length} NOVOS ITENS ENCONTRADOS.`, "success");
      showToast(`${taggedProducts.length} NOVIDADES ENCONTRADAS! 💎`);
      
    } catch (err: any) {
      console.error("Erro na descoberta:", err);
      addLog("FALHA NA BUSCA DE NOVIDADES.", "error");
      showToast("ERRO AO BUSCAR NOVIDADES.");
    } finally {
      setIsFindingNewItems(false);
    }
  };

  const handleCustomLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLink) return;

    setIsScanning(true);
    try {
      let extractedName = customLink.trim();
      let stringParseSuccess = false;

      // ── OFFER ID DETECTION ────────────────────────────────────────────────────
      // Detecta padrão de ID de afiliado da Shopee: ex. BBX-GNA-ZFX
      const offerIdPattern = /^([A-Za-z0-9]{2,6}-[A-Za-z0-9]{2,6}-[A-Za-z0-9]{2,6})$/;
      const offerIdMatch = extractedName.match(offerIdPattern);

      if (offerIdMatch) {
        const offerId = offerIdMatch[1].toUpperCase();
        showToast(`🔍 Buscando produto: ${offerId}...`);

        // 1️⃣ Busca instantânea no banco local
        const allLocal = [...databaseProducts, ...activeItems];
        const localMatch = allLocal.find(p =>
          (p.product_link || "").toUpperCase().includes(offerId) ||
          (p.affiliate_link || "").toUpperCase().includes(offerId) ||
          String(p.item_id || "").toUpperCase() === offerId
        );

        if (localMatch) {
          setSelectedProduct(localMatch);
          setStep("list");
          void researchTikTok(localMatch);
          setCustomLink("");
          showToast("✅ Produto encontrado na sua biblioteca!");
          return;
        }

        // 2️⃣ Resolve o short link via API Shopee (urlGenerate):
        // CHW-MAL-YCR → s.shopee.com.br/CHW-MAL-YCR → originLink com shopId+itemId real
        try {
          showToast("🌐 Resolvendo ID via Shopee...");
          const product = await ShopeeService.resolveShortLinkToProduct(offerId, userShopeeId || undefined);
          if (product) {
            setActiveItems(prev => {
              const existingIds = new Set(prev.map(p => p.item_id));
              if (existingIds.has(product.item_id)) return prev;
              return [product, ...prev].slice(0, 30);
            });
            setSelectedProduct(product);
            setStep("list");
            void researchTikTok(product);
            setCustomLink("");
            showToast("✅ Produto encontrado!");
            return;
          }
        } catch (_) { /* fallback abaixo */ }

        // 3️⃣ Fallback: tenta link curto direto via proxy
        showToast("🌐 Tentando via link curto...");
        extractedName = `https://s.shopee.com.br/${offerId}`;
      }
      // ─────────────────────────────────────────────────────────────────────────


      // 1. Tenta tirar o nome da própria string se for um link completo da Shopee
      // (100% à prova de falhas de anti-bot)
      try {
        if (extractedName.includes("shopee.com")) {
          const url = new URL(
            extractedName.startsWith("http")
              ? extractedName
              : `https://${extractedName}`,
          );
          let pathName = url.pathname.split("/")[1];
          // Shopee BR product URLs always have "-i." before the ID. If it doesn't, it's a shortlink/hash.
          if (pathName && pathName.includes("-i.")) {
            pathName = pathName.replace(/-i\.\d+\.\d+.*$/, "");
            const candidateName = decodeURIComponent(
              pathName.replace(/-/g, " "),
            );
            if (
              candidateName.length >= 3 &&
              candidateName.toLowerCase() !== "buyer"
            ) {
              extractedName = candidateName;
              stringParseSuccess = true;
            }
          }
        }
      } catch (e) {}

      // 2. Se for link curto (s.shopee.com.br) apelamos pro Proxy Local
      if (!stringParseSuccess && extractedName.includes("shopee.com.br")) {
        try {
          const targetUrl = extractedName.startsWith("http")
            ? extractedName
            : `https://${extractedName}`;

          // Usa a Edge Function recém-criada no Supabase (Proxy em Nuvem Vitalício)
          const { data, error } = await supabase.functions.invoke(
            "shopee-proxy",
            {
              body: { url: targetUrl },
            },
          );

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

      if (extractedName.length > 90)
        extractedName = extractedName.substring(0, 90);

      // Se depois de tudo isso ainda é uma URL da Shopee completa, falhamos em ler o título real
      if (
        extractedName.includes("shopee.com") ||
        extractedName.includes("shp.ee")
      ) {
        showToast("Link não resolvido. Buscando por termo genérico.");
        extractedName = "Achadinho Shopee Brasil";
      }

      // 4️⃣ BUSCA POR PALAVRA-CHAVE (UNLOCKED)
      // Se não for link nem Offer ID, buscamos no catálogo real da Shopee
      showToast(`🔍 Buscando "${extractedName}" na Shopee...`);
      try {
        const results = await ShopeeService.searchProducts({ 
          keyword: extractedName,
          page_size: 20
        }, userShopeeId || undefined);

        if (results && results.length > 0) {
          setActiveItems(results);
          setStep("list");
          setCustomLink("");
          showToast(`✅ ${results.length} produtos encontrados!`);
          return;
        }
      } catch (err) {
        console.error("Erro na busca por palavra-chave:", err);
      }

      // 5️⃣ Fallback: Se tudo falhar, mantém o comportamento original de criar item genérico
      const searchWords = getSmartSearchName(extractedName);
      const finalQuery = searchWords.length > 3 ? searchWords : extractedName;

      const customProduct = {
        id: "custom_" + Date.now(),
        title: extractedName.toUpperCase(),
        price: "R$ --,--",
        commission_pct: Math.floor(Math.random() * 20) + 10,
        sales: Math.floor(Math.random() * 80) + "k",
        query: finalQuery,
        url: customLink.includes("shopee.com") ? customLink : undefined, // Preserva o link original se for Shopee
      };

      setSelectedProduct(customProduct);
      setStep("list");
      void researchTikTok(customProduct);
      setCustomLink("");
      await saveScoutedProducts([customProduct]);
    } catch (err: any) {
      showToast(err.message || "ERRO AO BUSCAR LINK");
    } finally {
      setIsScanning(false);
    }
  };

  const refreshProducts = async () => {
    // Busca pool infinito e garante sempre 30 opções frescas
    const infinitePool = getInfinitePool(activeNiche);

    // Seleciona os de ALTO IMPACTO (Mais Vendidos + Comissão Alta) de forma garantida
    const topItems = [...infinitePool]
      .sort((a, b) => getProductScore(b) - getProductScore(a))
      .slice(0, 30);
    const shuffled = topItems.sort(() => Math.random() - 0.5);

    const items = shuffled.slice(0, 15);
    setActiveItems(items);
    await saveScoutedProducts(items);
    showToast("PRODUTOS ATIVOS EM ALTA 🔄");
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

    if (mode === "performance") {
      setCustomCopy(
        `🔥 ÚLTIMAS UNIDADES: ${selectedProduct.title}!\n🛑 Link na minha Bio com desconto exclusivo! 🛒👇\n#promo #achadinhos #shopee #viral #brasil`,
      );
    } else if (mode === "funny") {
      setCustomCopy(
        `🤣 POV: Você não sabia que precisava de um desse até ver esse vídeo! 🤡🔥\nO link está na Bio esperando por você! 🛒👇\n#humor #utilidades #casa #viral #achados`,
      );
    }
  };

  const addToBio = async (p: any, e: React.MouseEvent) => {
    // Aceitar tanto evento quanto objeto vazio
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    setIsSavingToBio(true);
    try {
      const metadataSlug = user?.user_metadata?.store_slug || "";
      const urlSlug =
        new URLSearchParams(window.location.search).get("loja") || "";
      const targetSlug =
        metadataSlug && metadataSlug !== "meu-link"
          ? metadataSlug.toLowerCase()
          : urlSlug && urlSlug !== "meu-link"
            ? urlSlug.toLowerCase()
            : storeSlug && storeSlug !== "meu-link"
              ? storeSlug.toLowerCase()
              : "";

      console.log(
        "[addToBio] metadataSlug:",
        metadataSlug,
        "urlSlug:",
        urlSlug,
        "localSlug:",
        storeSlug,
        "targetSlug:",
        targetSlug,
      );

      if (!targetSlug) {
        showToast("CONFIGURE SUA LOJA PRIMEIRO!");
        setStep("bio");
        setIsSavingToBio(false);
        return;
      }

      // Buscar imagem de várias fontes possíveis (inclui item_image do Shopee)
      const productImage = p.image || p.cover || p.thumbnail || p.img_url || p.images?.[0] || p.item_image || "";
      
      // Usar nome original do produto (inclui item_name do Shopee)
      const productTitle = p.title || p.item_name || p.name || p.query || "Produto";
      
      // Buscar preço de várias fontes
      const productPrice = p.price || p.item_price || "";
      
      // Criar link de afiliado
      let rawLink = p.affiliate_link || p.url || p.link || "";
      
      // Se não tiver link, criar um link direto para o produto
      if (!rawLink && p.shop_id && p.item_id) {
        rawLink = `https://shopee.com.br/product/${p.shop_id}/${p.item_id}`;
      }
      
      // Se não tiver shop_id/item_id, mas tiver link direto
      if (!rawLink && p.url) {
        rawLink = p.url;
      }
      
      // Se ainda não tiver, tentar extrair do link
      if (!rawLink && p.item_url) {
        rawLink = p.item_url;
      }
      
      // Se ainda não tiver, usar o link original do produto
      if (!rawLink && p.link) {
        rawLink = p.link;
      }
      
      const affiliateLink = sanitizeShopeeLink(rawLink, userShopeeId || undefined);
      
      console.log("[addToBio] Produto:", { title: productTitle, image: productImage, link: affiliateLink, price: p.price });
      
      const payload = {
        user_id: targetSlug,
        title: productTitle,
        image_url: productImage,
        affiliate_link: affiliateLink,
        price: productPrice,
      };
      
      console.log("[addToBio] Payload:", payload);

      console.log("[addToBio] Inserting:", payload);

      const { data, error } = await supabase
        .from("bio_store")
        .insert(payload)
        .select();

      if (error) {
        console.error("[addToBio] Supabase error:", JSON.stringify(error));
        throw error;
      }

      console.log("[addToBio] Success! Inserted:", JSON.stringify(data));
      
      // Registrar no histórico global (Cloud Sinc)
      await saveToSupabase(p, "loja");
      
      showToast("PRODUTO ADICIONADO À BIO! 🔗");
    } catch (err: any) {
      console.error("[addToBio] Error:", err?.message || err);
      showToast("ERRO: " + (err?.message || "Falha ao adicionar"));
    } finally {
      setIsSavingToBio(false);
    }
  };

  async function selectVideoFromPool(video: any, index: number) {
    setCurrentVideoIndex(index);
    setTreatingProgress(10);
    setStep("treating");
    setTreatingStatus("Acessando criativo via Proxy...");

    try {
      const videoUrl = video.originalUrl;
      const VIDEO_PROXY = "https://vzydpqilvyjqjbhzgzhq.supabase.co/functions/v1/video-proxy?url=";
      const proxiedUrl = `${VIDEO_PROXY}${encodeURIComponent(videoUrl)}`;

      const videoBlob = await fetch(proxiedUrl)
        .then((r) => r.blob())
        .catch(() => fetch(videoUrl).then((r) => r.blob()));
      const videoObjectUrl = URL.createObjectURL(videoBlob);

      const newVideoData = {
        id: video.id,
        url: videoObjectUrl,
        thumbnail: video.cover || "",
        title: video.title || selectedProduct?.title || "Produto",
        author: video.author,
        stats: video.stats,
        proxiedUrl: proxiedUrl,
        isAutoral: false,
      };
      
      setVideoData(newVideoData);

      if (selectedProduct) {
        setCustomCopy(generateCreativeLegend(selectedProduct));
        setVideoLegend(generateOverlayLegend(selectedProduct));
      }

      if (pendingAutomationMode === 'custom') {
        // Modo Autoral: Inicia o Neural Hub de Processamento
        handleTransformToAutoral(selectedProduct, newVideoData, 'custom');
      } else {
        // Modo Viral: Vai para o Editor para revisão e publicação
        setStep("ready");
      }
    } catch (err) {
      showToast("ERRO DE REDE: Tente outro vídeo.");
      setStep("video_selection");
    }
  }

  async function researchTikTok(product: any, originStep: Step = "list", autoTransform: boolean = false, legendMode: 'original' | 'custom' = 'custom') {
    console.log("[researchTikTok] PRODUCT:", JSON.stringify(product).slice(0, 200));
    
    if (trialExpired && !hasAccessToPlatform) {
      showToast("SEU TRIAL EXPIROU. FAÇA UPGRADE PARA PRO.");
      return;
    }
    
    const title = product?.title || product?.item_name || product?.name || "";
    if (!product || !title) {
      console.error("[researchTikTok] Produto inválido:", product);
      showToast("Produto inválido. Tente outro.");
      if (originStep === "shopee") setStep("shopee");
      else setStep(originStep);
      return;
    }
    
    setSelectedProduct(product);
    const safeTitle = product?.title || product?.item_name || product?.name || "";
    
    resetVideoEditor();
    setStep("treating");
    setTreatingStatus("Mapeando sinais de demanda e criativos virais...");
    setTreatingProgress(12);
    
    const tiktokChecklistId = Date.now(); // Unique ID for this run
    const updateTikTokChecklist = (items: string[]) => {
      setTreatingChecklist(items.map((item, i) => `${tiktokChecklistId}-tiktok-${i}-${item}`));
    };
    
    updateTikTokChecklist([
      "Lendo palavras-chave do produto",
      "Consultando tendencias TikTok + Shopee",
      "Preparando filtros de relevancia",
    ]);
    try {
      const coreQuery = getSmartSearchName(
        product.query || product.title || "",
      );
      const coreWords = coreQuery.split(" ").filter((w) => w.length > 2);
      const productNiche = product.niche || activeNiche;

      if (coreWords.length === 0) throw new Error("Nome do produto incompleto");

      // 1. Identificar Âncoras Técnicas (Power Words) que definem o produto
      const powerWords = [
        "levitação", "magnética", "magnético", "usb", "led", "bluetooth",
        "portátil", "mini", "inteligente", "smart", "flutuante", "gamer",
        "rgb", "projetor",
      ];
      const productAnchors = coreWords.filter((w) =>
        powerWords.includes(w.toLowerCase()),
      );

      const currentNicheRules = NICHE_KEYWORDS[productNiche] || {
        positive: [],
        negative: [],
      };

      // 2. Estratégias de Busca - Mais variações para garantir resultado
      const strategies = [
        { query: product.title?.substring(0, 50) || coreQuery, weight: 4.0 },
        { query: coreQuery, weight: 3.5 },
        { query: `${coreQuery} shopee`, weight: 3.0 },
        { query: `${coreQuery} achadinho`, weight: 2.5 },
        { query: `${coreQuery} viral`, weight: 2.0 },
        { query: `${coreQuery} br`, weight: 1.5 },
        { query: coreQuery.split(" ")[0], weight: 1.0 }, // Primeira palavra só
      ];

      const ptBrKeywords = [
        "achei",
        "comprei",
        "chegou",
        "olha",
        "dica",
        "shopee",
        "brasil",
        "br",
        "testando",
        "recomendo",
        "unboxing",
        "review",
        "achadinho",
        "oferta",
        "promo",
        "loja",
        "casa",
        "cozinha",
        "comprinhas",
        "melhor",
        "perfeito",
        "utilidades",
        "organização",
        "organizando",
        "lar",
        "recebidos",
        "testei",
      ];
      const ptBrMustHave = [
        "shopee",
        "brasil",
        "achadinho",
        "comprinha",
        "link",
        "bio",
        "utilidade",
        "loja",
        "br",
        "achei",
        "achado",
        "comprei",
      ];

      let rawVideos: any[] = [];
      setTreatingStatus("Buscando em larga escala (Equilíbrio Perfeito)...");
      setTreatingProgress(28);

      // PERFORMANCE FIX: Executar buscas em paralelo usando Promise.all
      const results = await Promise.all(
        strategies.map(async (strategy) => {
          const q = encodeURIComponent(strategy.query);
          try {
            const resp = await fetch(
              `https://www.tikwm.com/api/feed/search?keywords=${q}&count=50&cursor=0&region=BR`,
              { signal: AbortSignal.timeout(15000) },
            );
            const json = await resp.json();
            if (json.data?.videos?.length > 0) {
              return json.data.videos.map((v: any) => ({
                ...v,
                _queryWeight: strategy.weight,
              }));
            }
          } catch (e) {
            console.warn(`Erro na estratégia ${strategy.query}:`, e);
          }
          return [];
        })
      );

      rawVideos = results.flat();

      // Remover duplicatas
      const uniqueVideosMap = new Map();
      rawVideos.forEach((v) => {
        if (!uniqueVideosMap.has(v.video_id))
          uniqueVideosMap.set(v.video_id, v);
      });
      const allVideos = Array.from(uniqueVideosMap.values());

      if (allVideos.length === 0)
        throw new Error("Nenhum vídeo nacional encontrado");

      setTreatingStatus("Aferindo relevância e idioma local...");
      setTreatingProgress(56);

      const scored = allVideos
        .filter(
          (v: any) =>
            (v.play || v.wmplay) && v.duration > 3 && v.duration < 180,
        )
        .map((v: any) => {
          const title = (v.title || "").toLowerCase();
          const author = (v.author?.nickname || "").toLowerCase();
          const music = (v.music_info?.title || "").toLowerCase();
          const text = `${title} ${author} ${music}`;

          let score = 100;

          // 0. Filtro Técnico Obrigatório (Technical Anchor) -> Agora é bônus/penalidade
          if (productAnchors.length > 0) {
            const hasAnyAnchor = productAnchors.some((anchor) =>
              text.includes(anchor.toLowerCase()),
            );
            if (hasAnyAnchor) score += 400;
            else score -= 100;
          }

          // 1. Ancoragem de Substantivos (Noun Anchor) -> Agora ponderada
          const anchorWord = coreWords[0]?.toLowerCase();
          const hasAnchor = anchorWord && text.includes(anchorWord);
          if (hasAnchor) score += 200;
          else score -= 50;

          // 2. Relevância de Palavras-Chave (Density Match)
          let matchCount = 0;
          coreWords.forEach((word, idx) => {
            if (text.includes(word.toLowerCase())) {
              // A primeira palavra (substantivo principal) tem peso dobrado
              matchCount += (idx === 0) ? 2 : 1;
            }
          });

          const maxPossibleMatch = coreWords.length + 1; // +1 pelo peso dobrado da primeira
          const matchRatio = maxPossibleMatch > 0 ? matchCount / maxPossibleMatch : 0;
          
          if (matchRatio < 0.55) return null; // Aumento de rigor para evitar vídeos errados (ex: vestidos)

          if (matchRatio >= 0.8) score += 600;
          else if (matchRatio >= 0.5) score += 300;

          // 3. Trava de Idioma Brasileira (PT-BR) de Elite
          const hasPtBrKeywords = ptBrKeywords.some((w) => text.includes(w));
          const hasMustHave = ptBrMustHave.some((w) => text.includes(w));
          const hasAccents = /[ãéíóúç]/i.test(text);

          // Detecção de Inglês (Stop Words comuns)
          const englishStopWords = [
            "the",
            "and",
            "for",
            "with",
            "your",
            "this",
            "that",
            "from",
            "best",
            "finds",
            "must",
            "buy",
            "now",
          ];
          const countsEnglish = englishStopWords.filter(
            (w) => text.includes(` ${w} `) || text.startsWith(`${w} `),
          ).length;

          const foreignTerms = [
            "amazon find",
            "link in bio",
            "shop now",
            "available on",
            "aliexpress",
            "temu",
            "worldwide",
          ];
          const isForeign =
            foreignTerms.some((w) => text.includes(w)) ||
            (countsEnglish >= 2 && !hasAccents);

          if (hasMustHave || (hasPtBrKeywords && hasAccents)) {
            score *= 10.0; // Bônus massivo para criativos brasileiros (x10) para garantir prioridade
          } else if (isForeign || (!hasPtBrKeywords && !hasAccents)) {
            score /= 15.0; // Penalidade aumentada para vídeos gringos irrefutáveis
          }

          // 4. Qualidade e Viralização (Engajamento Mínimo de 8%)
          const views = v.play_count || v.play || 0;
          const diggs = v.digg_count || 0;
          const comments = v.comment_count || 0;
          const shares = v.share_count || 0;
          const engagementRatio =
            views > 0
              ? ((diggs + comments * 6 + shares * 10) / views) * 100
              : 0;

          if (engagementRatio < 4) return null; // Engajamento mínimo reduzido para 4%

          if (v.width && v.width >= 1080) score += 300;
          if (engagementRatio > 20) score += 400;

          // 5. Niche match
          currentNicheRules.positive.forEach((w) => {
            if (text.includes(w)) score += 50;
          });
          currentNicheRules.negative.forEach((w) => {
            if (text.includes(w)) return null;
          });

          score *= v._queryWeight || 1.0;

          return {
            id: v.video_id,
            originalUrl: v.play || v.wmplay,
            cover: v.cover,
            title: v.title,
            duration: v.duration,
            author: v.author?.nickname || "Criador",
            views: views,
            stats: { likes: diggs, shares: shares, comments: comments },
            _score: score,
          };
        })
        .filter((v: any) => v !== null && v._score >= 50)
        .sort((a: any, b: any) => b._score - a._score);

      if (scored.length === 0) {
        // Volta para shopee sem mostrar tela antiga
        showToast("Nenhum vídeo encontrado. Tente outro produto!");
        setStep("shopee");
        return;
      }

      // Pool de 10 vídeos para garantir variedade no Swap
      const topScored = scored.slice(0, 10);
      setVideoResults(topScored);
      setCurrentVideoIndex(0);

      setTreatingStatus("Ecossistema pronto!");
      setTreatingProgress(100);
      updateTikTokChecklist([
        "Lendo palavras-chave do produto",
        "Consultando tendencias TikTok + Shopee",
        "Preparando filtros de relevancia",
        `Encontrados ${topScored.length} criativos de alto potencial`,
        "Processamento concluído com sucesso",
      ]);

      await new Promise((r) => setTimeout(r, 800));
      setStep("video_selection");
      showToast(`${topScored.length} VÍDEOS ENCONTRADOS! 🎬`);
    } catch (err: any) {
      console.error("Erro ao buscar TikTok:", err);
      showToast(err.message || "Nenhum vídeo encontrado. Tente outro produto!");
      setStep("shopee");
    }
  }

  // Função para criar vídeo com imagens customizadas
  async function createVideoWithImages(product: any, images: string[], customScript?: any) {
    if (trialExpired && !hasAccessToPlatform) {
      showToast("SEU TRIAL EXPIROU. FA�A UPGRADE PARA PRO.");
      return;
    }

    setSelectedProduct({ ...product, viralScript: customScript });
    resetVideoEditor();
    setStep("treating");
    setTreatingStatus("Criando v�deo com suas imagens...");
    setTreatingProgress(20);
    setTreatingChecklist([`Criando v�deo com ${images.length} imagens...`]);

    let videoProcessor: VideoProcessor | null = null;     try {
      // Sortear m�sica
      const musicIndex = Math.floor(Math.random() * VIRAL_MUSIC.length);
      const music = VIRAL_MUSIC[musicIndex];
      setTreatingProgress(40);

      // Sortear transições
      const allTransitionsList = ['zoom', 'glitch', 'blur', 'slide', 'shake', 'flash', 'beat', 'fire', 'rotate', 'wave', 'spiral', 'pixelate'];
      const shuffledTransitions = allTransitionsList.sort(() => Math.random() - 0.5);
      const newTransitions = shuffledTransitions.slice(0, 10);
      setTreatingProgress(60);

      // Sortear filtro
      const allFiltersList = [...FILTERS];
      const newFilter = allFiltersList[Math.floor(Math.random() * allFiltersList.length)];
      setTreatingProgress(80);

      videoProcessor = new VideoProcessor();      
      const options: ProcessingOptions = {
        filter: newFilter,
        transition: newTransitions[0] || 'zoom',
        transitionList: newTransitions,
        legend: "",
        isMuted: false,
        musicUrl: music.url,
        musicBpm: music.bpm || 128,
        musicGenre: music.genre || 'house',
        storeLogo: user?.user_metadata?.store_settings?.profile_image || undefined,
        storeName: user?.user_metadata?.store_name || storeSlug.replace('@', '').toUpperCase(),
        isAutoral: true,
        onProgress: (p: number) => setTreatingProgress(Math.floor(p))
      } as any;

      const price = product.price || 0;
      const productName = product.item_name || product.title || "Produto";
      
      setTreatingChecklist(["Renderizando vídeo..."]);
      
      const videoBlob = await videoProcessor.renderSlideshow(images, options, `R$ ${price.toFixed(2)}`, productName);

      setTreatingProgress(100);
      setTreatingStatus("Vídeo pronto!");

      const videoObjectUrl = URL.createObjectURL(videoBlob);
      
      setVideoData({
        id: `custom-${Date.now()}`,
        url: videoObjectUrl,
        thumbnail: images[0],
        title: productName,
        author: "Criado por Você",
        stats: { likes: 0, shares: 0, comments: 0 },
        isAutoral: true,
        images: images,
        musicId: music.id,
        transitions: newTransitions,
        filter: newFilter
      });

      setCustomCopy(`${productName}\nR$ ${price.toFixed(2)}\n\n#viral #shopee #achadinhos`);
      setVideoLegend("");

      await new Promise(r => setTimeout(r, 600));
      setStep("ready");
      showToast(`VÍDEO PRONTO! ${images.length} imagens`);
    } catch (err: any) {
      console.error("Erro ao criar vídeo:", err);
      showToast(err.message || "ERRO AO CRIAR VÍDEO");
      setStep("list");
    } finally {
      if (videoProcessor) videoProcessor.dispose();
    }
  }

  async function handleTransformToAutoral(customProduct?: any, customVideoData?: any, legendMode: 'original' | 'custom' = 'custom') {
    const targetProduct = customProduct || selectedProduct;
    const targetVideoData = customVideoData || videoData;

    if (!targetVideoData?.url || !targetProduct) {
      showToast("Nenhum vídeo para transformar");
      return;
    }
    
    if (trialExpired && !hasAccessToPlatform) {
      showToast("SEU TRIAL EXPIROU. FAÇA UPGRADE PARA PRO.");
      return;
    }
    
    // Dica importante para o usuário
    showToast("💡 Dica: Vídeos sem legendas originais ficam mais autênticos!");

    setIsProcessing(true);
    setTreatingStatus("Transformando em autoral...");
    setTreatingProgress(10);
    
    const isMobileRuntime = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || ("ontouchstart" in window);
    let processor: VideoProcessor | null = null;
    try {
      processor = new VideoProcessor();
      const script = legendMode === 'custom' 
        ? generateViralScripts(targetProduct.item_name || targetProduct.title)[0]
        : undefined;

      setTreatingProgress(30);

      
      
      // Gerar timestamps de transição automaticamente (a cada 3 segundos)
      const autoTransitions: number[] = [3, 6, 9, 12, 15, 18, 21, 24, 27];
      
      const options: ProcessingOptions = {
        filter: isMobileRuntime ? 'cinematic' : (activeFilter || 'elite'),
        transition: 'zoom',
        transitionList: ['zoom', 'glitch', 'shake', 'blur', 'slide', 'beat', 'flash', 'fire'] as any,
        transitionTimestamps: [4, 8, 12, 16, 20, 24],
        legend: legendMode === 'custom' ? (videoLegend || '') : '',
        isMuted: audioMixOption === 'mute',
        script: script,
        musicUrl: selectedMusic || undefined,
        audioMixMode: audioMixOption,
        useNarration: useNarration,
        narrationVoice: narrationVoice,
        narrationStyle: narrationVoice === 'F' ? 'soft-female' : 'premium-male',
        mobileTurbo: isMobileRuntime,
        storeSlug: storeSlug,
        storeLogo: user?.user_metadata?.store_settings?.profile_image || undefined,
        storeName: user?.user_metadata?.store_name || storeSlug.replace('@', '').toUpperCase(),
        isAutoral: true,
        onProgress: (p: number) => setTreatingProgress(Math.floor(p))
      };

      setTreatingProgress(50);
      showToast("Renderizando com spintax...");

      const blob = await processor.renderAutoralSlideshow(targetVideoData.url, options);

      setTreatingProgress(80);

      const newUrl = URL.createObjectURL(blob);
      
      setVideoData({
        ...targetVideoData,
        id: `autoral-${Date.now()}`,
        url: newUrl,
        isAutoral: true,
        script: script,
        autoralBlob: blob // Armazena o blob para evitar re-processamento na publicação
      });

      setTreatingProgress(100);
      setTreatingStatus("Vídeo autoral pronto!");
      showToast("✨ VÍDEO TRANSFORMADO EM AUTORAL!");

      // Redireciona para tela de automação se estiver no fluxo automático
      setAutomationFinished(true);
      setStep("automation");

      // AUTO-DOWNLOAD: Inicia o download imediatamente para o usuário
      try {
        const a = document.createElement("a");
        const fileName = `viral_squad_autoral_${Date.now()}.mp4`;
        const downloadUrl = URL.createObjectURL(blob);
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
        showToast("📥 DOWNLOAD INICIADO!");
      } catch (err) {
        console.error("Erro no auto-download:", err);
      }
      
    } catch (err: any) {
      console.error("Erro ao transformar:", err);
      showToast("ERRO AO TRANSFORMAR: " + (err.message || "Tente novamente"));
    } finally {
      setIsProcessing(false);
      if (processor) processor.dispose();
    }
  }

  // Função para Autoral Automático (IA)
  async function handleAutoAutoral(product: any) {
    if (trialExpired && !hasAccessToPlatform) {
      showToast("SEU TRIAL EXPIROU. FAÇA UPGRADE PARA PRO.");
      return;
    }
    
    setIsProcessing(true);
    setStep("treating");
    setTreatingStatus("Buscando melhor fonte original (Vídeo/Imagens)...");
    setTreatingProgress(10);

    try {
      // 1. Busca detalhes profundos do produto na Shopee
      const detail = await ShopeeService.getItemDetail(product.shop_id, product.item_id);
      
      // 2. Tenta encontrar vídeo original do produto
      // Shopee API retorna informações de vídeo em diferentes campos dependendo da versão
      const videoList = detail?.item?.video_info_list || detail?.data?.video_info_list || detail?.video_info_list || [];
      const bestVideo = videoList.sort((a: any, b: any) => (b.duration || 0) - (a.duration || 0))[0];
      
      if (bestVideo && bestVideo.url) {
        showToast("🎥 VÍDEO ORIGINAL ENCONTRADO! TRANSFORMANDO...");
        const videoDataForAuto = {
          id: `shopee-${product.item_id}`,
          url: bestVideo.url,
          thumbnail: product.item_image,
          title: product.item_name,
          author: "Shopee Official",
          stats: { likes: 0, shares: 0, comments: 0 },
          isAutoral: false
        };
        // Usa a transformação robusta que já temos
        await handleTransformToAutoral(product, videoDataForAuto);
      } else {
        // 3. Fallback para Slideshow Automático se não houver vídeo
        showToast("📸 VÍDEO NÃO DISPONÍVEL. CRIANDO SLIDESHOW IA...");
        await handleCreateAutoralVideo(product, undefined, undefined, true);
      }
    } catch (err: any) {
      console.error("Erro no Auto Autoral:", err);
      // Fallback final para o modo manual se tudo falhar
      handleCreateAutoralVideo(product, undefined, undefined, true);
    }
  }

  async function handleCreateAutoralVideo(product: any, customImages?: string[], customScript?: any, isAuto: boolean = false) {
    const targetProduct = product;
    if (trialExpired && !hasAccessToPlatform) {
      showToast("SEU TRIAL EXPIROU. FA�A UPGRADE PARA PRO.");
      return;
    }

    // Usar imagens customizadas se forem fornecidas
    if (customImages && customImages.length > 0) {
      console.log("[App] Usando imagens customizadas:", customImages.length);
      await createVideoWithImages(product, customImages, customScript);
      return;
    }

    setSelectedProduct(product);
    resetVideoEditor();
    setStep("treating");
    setTreatingStatus("Criando vídeo autoral com imagens do produto...");
    setTreatingProgress(12);
    setTreatingChecklist([]); // Clear previous checklist
    
    const checklistId = Date.now(); // Unique ID for this run
    
    const updateChecklist = (items: string[]) => {
      setTreatingChecklist(items.map((item, i) => `${checklistId}-${i}-${item}`));
    };

    updateChecklist([
      "Buscando imagens do produto",
      "Processando transições e efeitos",
      "Mixando batida viral",
      "Renderizando criativo único"
    ]);
    setIsProcessing(true); let videoProcessor: VideoProcessor | null = null;
    try {
      const detail = await ShopeeService.getItemDetail(product.shop_id, product.item_id);
      
      console.log("[App] Detalhes do produto (imagens):", detail?.images);
      console.log("[App] Detalhes do produto (data):", detail?.data);
      
      let images: string[] = [];
      
      // Shopee API v2 retorna as imagens no campo "images" diretamente
      const imageSources = [
        // API v2 retorna no campo images
        detail?.images,
        detail?.data?.images,
        detail?.data?.image_list,
        detail?.data?.items?.[0]?.images,
        // Estruturas alternativas
        detail?.info?.item?.images,
        detail?.item?.images,
        detail?.data?.item?.images,
      ];
      
      console.log("[App] fontes de imagens:", imageSources);
      
      for (const source of imageSources) {
        if (Array.isArray(source) && source.length > 0) {
          console.log("[App] fonte encontrada:", source);
          const newImages = source.map((hash: any) => {
            // Different hash formats from Shopee API
            const hashStr = hash?.hash || hash?.image_id || hash?.url || hash;
            if (hashStr) {
              return `https://down-br.img.susercontent.com/file/${hashStr}`;
            }
            return null;
          }).filter((url): url is string => url !== null && url !== undefined);
          
          if (newImages.length > images.length) {
            images = newImages;
          }
        }
      }
      
      // Se não encontrou imagens da API, usar a thumbnail do produto
      if (images.length === 0 && product.item_image) {
        console.log("[App] Usando thumbnail do produto como fallback");
        images = [product.item_image];
      }
      
      // Garantir que temos pelo menos uma imagem válida
      if (images.length === 0) {
        // Fallback final: usar placeholder
        images = ["https://via.placeholder.com/400x400/1e293b/10b981?text=Produto+Shopee"];
      }
      
      // Se só tem 1 imagem, criar variações duplicates para ter mais "slides"
      if (images.length > 0 && images.length < 5) {
        const baseImage = images[0];
        
        // Duplicar a imagem para criar mais slides no vídeo
        // O sistema de vídeo vai alternar entre elas com transições
        images = [baseImage, baseImage, baseImage, baseImage, baseImage];
      }
      
      console.log(`[App] Imagens encontradas: ${images.length}`);
      
      if (images.length === 0) {
        throw new Error("Nenhuma imagem disponível para este produto");
      }

      setTreatingProgress(40);
      updateChecklist([
        "Buscando imagens do produto",
        "Processando transições e efeitos",
        "Mixando batida viral",
        "Renderizando criativo único",
        `Encontradas ${images.length} imagens`
      ]);

      const script = customScript || generateViralScripts(targetProduct.item_name || targetProduct.title)[0];
      
      const musicIndex = Math.floor(Math.random() * VIRAL_MUSIC.length);
      const music = VIRAL_MUSIC[musicIndex];

      setTreatingProgress(60);
      updateChecklist([
        "Buscando imagens do produto",
        "Processando transições e efeitos",
        "Mixando batida viral",
        "Renderizando criativo único",
        `Encontradas ${images.length} imagens`,
        `Música: ${music.name}`
      ]);

      const allTransitions: ('zoom' | 'glitch' | 'blur' | 'slide' | 'shake' | 'flash' | 'beat' | 'fire' | 'rotate')[] = 
        ['zoom', 'glitch', 'blur', 'slide', 'shake', 'flash', 'beat', 'fire', 'rotate'];
      const allFilters = ['elite', 'ultra8k', 'cinematic', 'bloom', 'glitch'];
      
      videoProcessor = new VideoProcessor();
      const options: ProcessingOptions = {
        filter: allFilters[Math.floor(Math.random() * allFilters.length)],
        transition: 'zoom',
        transitionList: allTransitions,
        legend: isAuto ? (script?.hook || "") : "",
        script: script,
        isMuted: false,
        musicUrl: music.url,
        storeSlug: storeSlug,
        storeLogo: user?.user_metadata?.store_settings?.profile_image || undefined,
        storeName: user?.user_metadata?.store_name || storeSlug.replace('@', '').toUpperCase(),
        isAutoral: true,
        onProgress: (p: number) => setTreatingProgress(Math.floor(p))
      };

      setTreatingProgress(80);
      updateChecklist([
        "Buscando imagens do produto",
        "Processando transições e efeitos",
        "Mixando batida viral",
        "Renderizando criativo único",
        `Encontradas ${images.length} imagens`,
        `Música: ${music.name}`,
        "Renderizando vídeo..."
      ]);

      const videoBlob = await videoProcessor.renderSlideshow(images, options, `R$ ${product.price}`, product.item_name);

      setTreatingProgress(100);
      setTreatingStatus("Vídeo autoral pronto!");
      updateChecklist([
        "Buscando imagens do produto",
        "Processando transições e efeitos",
        "Mixando batida viral",
        "Renderizando criativo único",
        `Encontradas ${images.length} imagens`,
        `Música: ${music.name}`,
        "Renderizando vídeo...",
        "Vídeo criado com sucesso!"
      ]);

      const videoObjectUrl = URL.createObjectURL(videoBlob);
      
      setVideoData({
        id: `autoral-${Date.now()}`,
        url: videoObjectUrl,
        thumbnail: images[0],
        title: product.item_name,
        author: "Criado por Você",
        stats: { likes: 0, shares: 0, comments: 0 },
        isAutoral: true,
        images: images,
        musicId: music.id,
        transitions: allTransitions,
        filter: allFilters[0],
        script: script // Importante para as legendas
      });

      const copyToSet = customScript ? "" : Copywriter.generateCopy(
        product.item_name, 
        `R$ ${product.price}`, 
        activeNiche || 'default',
        storeSlug
      );
      
      if (copyToSet) {
        setCustomCopy(copyToSet.tiktokCaption + "\n\n" + copyToSet.hashtags.join(" "));
      }
      
      setVideoLegend(script?.hook || "");

      await new Promise(r => setTimeout(r, 600));
      setStep("ready");
      showToast(`VÍDEO AUTORAL PRONTO! ${images.length} imagens`);

      // AUTO-DOWNLOAD se for modo IA
      if (isAuto) {
        try {
          const a = document.createElement("a");
          const fileName = `autoral_ia_${Date.now()}.mp4`;
          const downloadUrl = URL.createObjectURL(videoBlob);
          a.href = downloadUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
          showToast("📥 DOWNLOAD INICIADO!");
        } catch (err) {
          console.error("Erro no auto-download autoral:", err);
        }
      }
    } catch (err: any) {
      console.error("Erro ao criar vídeo autoral:", err);
      showToast(err.message || "ERRO AO CRIAR VÍDEO AUTORAL");
      setStep("list");
    } finally {
      if (videoProcessor) videoProcessor.dispose();
    }
  }

  // Gerar nova versão do vídeo autoral com diferentes configurações
  async function regenerateAutoralVideo() {
    if (!selectedProduct || !videoData?.isAutoral || !videoData?.images) {
      showToast("Nenhum vídeo autoral para regenerar");
      return;
    }

    showToast("Gerando nova versão... 🎲");
    setIsProcessing(true); let videoProcessor: VideoProcessor | null = null;
    try {
      videoProcessor = new VideoProcessor();
      // Garantir que temos muitas "imagens" para o vídeo
      let images = videoData.images;
      
      // Se só tem 1 imagem, criar 10 variações com transformações CSS simuladas
      if (images.length < 5) {
        const baseImage = images[0];
        images = Array(12).fill(baseImage); // 12 slides diferentes
      }

      // Sortear nova música (diferente da atual)
      const currentMusicId = videoData.musicId;
      let newMusic = VIRAL_MUSIC[Math.floor(Math.random() * VIRAL_MUSIC.length)];
      let attempts = 0;
      while (newMusic.id === currentMusicId && attempts < 20) {
        newMusic = VIRAL_MUSIC[Math.floor(Math.random() * VIRAL_MUSIC.length)];
        attempts++;
      }

      // Sortear mais transições (8-12 tipos diferentes!)
      const allTransitionsList = ['zoom', 'glitch', 'blur', 'slide', 'shake', 'flash', 'beat', 'fire', 'rotate', 'wave', 'spiral', 'pixelate'] as string[];
      const shuffledTransitions = allTransitionsList.sort(() => Math.random() - 0.5);
      const newTransitions = shuffledTransitions.slice(0, Math.floor(Math.random() * 5) + 8) as any;

      // Sortear novo filtro
      const allFiltersList = [...FILTERS];
      const shuffledFilters = allFiltersList.sort(() => Math.random() - 0.5);
      const newFilter = shuffledFilters[0];

      console.log(`[App] Regenerando com: música=${newMusic.name}, transições=${newTransitions.length} tipos, filtro=${newFilter}, imagens=${images.length}`);

      
      const options: ProcessingOptions = {
        filter: newFilter,
        transition: newTransitions[0] || 'zoom',
        transitionList: newTransitions,
        legend: "",
        isMuted: false,
        musicUrl: newMusic.url,
        storeLogo: user?.user_metadata?.store_settings?.profile_image || undefined,
        storeName: user?.user_metadata?.store_name || storeSlug.replace('@', '').toUpperCase(),
        onProgress: (p: number) => setTreatingProgress(Math.floor(p))
      };

      const price = selectedProduct.price || 0;
      const productName = selectedProduct.item_name || selectedProduct.title || "Produto";
      const videoBlob = await videoProcessor.renderSlideshow(images, options, `R$ ${price.toFixed(2)}`, productName);
      

      // Limpar URL anterior
      if (videoData?.url) {
        URL.revokeObjectURL(videoData.url);
      }

      const videoObjectUrl = URL.createObjectURL(videoBlob);
      
      setVideoData({
        ...videoData,
        id: `autoral-${Date.now()}`,
        url: videoObjectUrl,
        thumbnail: images[0],
        musicId: newMusic.id,
        transitions: newTransitions,
        filter: newFilter
      });

      showToast(`Nova versão! 🎲 Música: ${newMusic.name}`);
    } catch (err: any) {
      console.error("Erro ao regenerar vídeo:", err);
      showToast("Erro ao gerar nova versão");
    } finally {
      setIsProcessing(false);
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
      const videoBlob = await fetch(nextVideo.originalUrl)
        .then((r) => r.blob())
        .catch(() => null);
      if (!videoBlob) throw new Error("Falha ao baixar novo vídeo");

      const videoObjectUrl = URL.createObjectURL(videoBlob);
      const VIDEO_PROXY =
        "https://vzydpqilvyjqjbhzgzhq.supabase.co/functions/v1/video-proxy?url=";

      setVideoData({
        id: nextVideo.id,
        url: videoObjectUrl,
        thumbnail: nextVideo.cover || "",
        title: nextVideo.title || selectedProduct?.title || "Novo Vídeo",
        author: nextVideo.author,
        stats: nextVideo.stats,
        proxiedUrl: `${VIDEO_PROXY}${encodeURIComponent(nextVideo.originalUrl)}`,
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

  const [downloadPreviewUrl, setDownloadPreviewUrl] = useState<string | null>(
    null,
  );

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
      const modalVideo = document.querySelector(
        'video[src^="blob:"]',
      ) as HTMLVideoElement;
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
    const isAuto = typeof isAutoOrEvent === "boolean" ? isAutoOrEvent : false;
    if (!videoData || isProcessing) return null;
    setIsPreparingDownload(true);
    setIsPlaying(false);
    setIsProcessing(true);

    let processor: VideoProcessor | null = null;
    try {
      const hasEdits = activeFilter !== 'none' || videoLegend.trim() !== '' || activeTransition !== 'none' || (trimEnd > 0 && trimEnd !== trimStart) || selectedMusic !== null || isMuted;

      let blob: Blob;

      if (!hasEdits && videoData.url.startsWith('blob:')) {
        const resp = await fetch(videoData.url);
        blob = await resp.blob();
      } else {
        processor = new VideoProcessor();
        const options: ProcessingOptions = {
          filter: activeFilter,
          legend: videoLegend,
          isMuted: audioMixOption === 'mute',
          transition: activeTransition as any,
          trimStart: trimStart,
          trimEnd: trimEnd || undefined,
          transitionTimestamps: transitionTimestamps,
          existingVideoEl: videoRef.current || undefined,
          musicUrl: selectedMusic || undefined,
          audioMixMode: audioMixOption,
          useNarration: useNarration,
          narrationVoice: narrationVoice,
          script: videoData?.script,
          storeLogo: user?.user_metadata?.store_settings?.profile_image || undefined,
          storeName: user?.user_metadata?.store_name || storeSlug.replace('@', '').toUpperCase(),
          onProgress: (p: number) => setTreatingProgress(Math.floor(p))
        };

        const blobResult = await processor.renderVideo(videoData.url, options);
        blob = blobResult;
      }


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
      if (processor) processor.dispose();
      setIsProcessing(false);
      setIsPreparingDownload(false);
    }
  };

  const VisualTimeline = () => {
    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!timelineRef.current || !videoRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickedTime = Math.max(
        0,
        Math.min(videoDuration, (x / rect.width) * videoDuration),
      );
      videoRef.current.currentTime = clickedTime;
      setCurrentTime(clickedTime);
    };

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 10);
      return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`;
    };

    const addImpactPoint = () => {
      if (transitionTimestamps.length >= 8) {
        showToast("MÁXIMO DE 8 PONTOS DE IMPACTO");
        return;
      }
      setTransitionTimestamps((prev) =>
        [...prev, currentTime].sort((a, b) => a - b),
      );
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
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${isPlaying ? "bg-white text-slate-950 border-white" : "bg-accent/20 text-accent border-accent/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]"}`}
            >
              {isPlaying ? (
                <VolumeX size={24} />
              ) : (
                <Zap size={24} className="animate-pulse" />
              )}
            </motion.button>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                Tempo Atual
              </span>
              <span className="text-lg font-mono font-black text-white">
                {formatTime(currentTime)}
              </span>
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
            <span className="text-[9px] font-black text-accent uppercase tracking-[0.3em]">
              Master_Timeline_v4
            </span>
            <span className="text-[9px] font-mono text-white/30 uppercase">
              {formatTime(videoDuration)} TOTAL
            </span>
          </div>

          <div
            className="professional-timeline h-24 bg-slate-900/60 rounded-[1.5rem] border border-white/5 relative overflow-hidden group cursor-pointer shadow-inner"
            ref={timelineRef}
            onClick={handleTimelineClick}
          >
            {/* Time Ticks */}
            <div className="absolute inset-x-0 top-0 h-6 border-b border-white/5 flex items-center">
              {Array.from({ length: Math.ceil(videoDuration) + 1 }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="absolute h-full flex flex-col items-center justify-end pb-1"
                    style={{ left: `${(i / videoDuration) * 100}%` }}
                  >
                    <div
                      className={`w-[1px] bg-white/20 ${i % 5 === 0 ? "h-3" : "h-1.5"}`}
                    />
                    {i % 2 === 0 && (
                      <span className="text-[8px] font-black text-white/20 absolute -top-1">
                        {i}s
                      </span>
                    )}
                  </div>
                ),
              )}
            </div>

            {/* Video Strip Visual Representation */}
            <div className="absolute inset-x-0 top-8 bottom-0 flex gap-0.5 px-0.5 opacity-20 pointer-events-none">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-sm border border-white/5"
                />
              ))}
            </div>

            {/* Trim Highlight */}
            <div
              className="absolute top-6 bottom-0 bg-accent/10 border-x-2 border-accent/40 z-10 pointer-events-none"
              style={{
                left: `${(trimStart / videoDuration) * 100}%`,
                width: `${(((trimEnd || videoDuration) - trimStart) / videoDuration) * 100}%`,
              }}
            />

            {/* Transition Markers (Impact Points) */}
            {transitionTimestamps.map((ts, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-[3px] bg-accent z-20 shadow-[0_0_15px_rgba(6,182,212,1)]"
                style={{ left: `${(ts / videoDuration) * 100}%` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-accent rounded-full flex items-center justify-center shadow-lg transform scale-110">
                  <Zap size={8} className="text-slate-950" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTransitionTimestamps((prev) =>
                      prev.filter((_, idx) => idx !== i),
                    );
                  }}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 rounded-lg flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-white z-30 pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.8)]"
              style={{ left: `${(currentTime / videoDuration) * 100}%` }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border border-slate-900" />
              <div className="absolute inset-y-0 -left-4 -right-4 bg-white/5 blur-sm" />
            </div>
          </div>
        </div>

        {/* Trim Controls */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setTrimStart(currentTime);
              showToast("INÍCIO DO VÍDEO DEFINIDO");
            }}
            className="h-12 bg-slate-900 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2"
          >
            <Scissors size={14} className="text-accent" /> Definir Início
          </button>
          <button
            onClick={() => {
              setTrimEnd(currentTime);
              showToast("FIM DO VÍDEO DEFINIDO");
            }}
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
    if (!file.type.startsWith("image/")) {
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
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath);

      setBioImageUrl(publicUrl);
      showToast("IMAGEM ANEXADA COM SUCESSO! ✅");
    } catch (error: any) {
      console.error("Erro no upload");
      showToast(`ERRO NO UPLOAD: ${error.message || "Tente novamente"}`);
    } finally {
      setIsUploading(false);
      // Limpar o input para permitir selecionar a mesma imagem se necessário
      if (e.target) e.target.value = "";
    }
  };

  const runAutomation = async (selectedPlatform: "tiktok" | "shopee") => {
    const hasCache = videoData?.isAutoral && videoData.autoralBlob;
    
    // Se já tem o vídeo em cache, não precisa abrir a tela de animação (console)
    if (!hasCache) {
      setStep("automation");
    } else {
      showToast("🚀 INICIANDO PUBLICAÇÃO RÁPIDA...");
    }

    setActivePlatform(selectedPlatform);
    setConsoleLogs([]);
    setAutomationFinished(false);

    // ...

    addLog(
      `INICIANDO PROTOCOLO [${selectedPlatform.toUpperCase()}]`,
      "success",
    );
    addLog("Analisando arquitetura do dispositivo...", "info");
    addLog(
      `Ambiente detectado: ${isMobile ? "MOBILE/PWA" : "DESKTOP/PC"}`,
      "info",
    );

    const optimizedCaption = optimizeCaptionForPlatform(customCopy, selectedPlatform);

    try {
      await navigator.clipboard.writeText(optimizedCaption);
      addLog(`LEGENDA [${selectedPlatform.toUpperCase()}] COPIADA ✅`, "success");
      if (selectedPlatform === 'shopee') {
        addLog(`(Ajustada para 150 caracteres do limite Shopee)`, "info");
      }
    } catch (e) {
      const textarea = document.createElement("textarea");
      textarea.value = optimizedCaption;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      addLog(`LEGENDA [${selectedPlatform.toUpperCase()}] COPIADA (fallback) ✅`, "success");
    }

    if (selectedProduct) {
      const saved = await saveToSupabase(selectedProduct, selectedPlatform);
      if (saved) {
        addLog("Histórico sincronizado com nuvem.", "success");
      } else {
        addLog("Falha ao sincronizar com nuvem.", "error");
      }
    }

    const openPublishingDestination = () => {
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || ("ontouchstart" in window);

      if (selectedPlatform === "tiktok") {
        if (isMobileDevice) {
          // TikTok: intent deep link nativo
          const now = Date.now();
          addLog("Tentando abrir TikTok...", "info");
          window.location.href = "snssdk1233://";
          setTimeout(() => {
            if (document.visibilityState === "visible" && (Date.now() - now) < 2000) {
              addLog("TikTok app não detectado. Abrindo web...", "warn");
              window.open("https://www.tiktok.com/upload", "_blank");
            }
          }, 1500);
        } else {
          window.open("https://www.tiktok.com/upload", "_blank", "noopener,noreferrer");
        }
      } else if (selectedPlatform === "shopee") {
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        const shopeeDeepLink = "shopeebr://shopee-video";
        const shopeeFallback = "https://shopee.com.br/m/shopee-video";

        addLog("Iniciando Deep Link Shopee...", "info");
        
        if (isMobileDevice) {
          if (isIOS) {
            // iOS: Tentativa direta com fallback manual por visibilidade
            window.location.href = shopeeDeepLink;
            setTimeout(() => {
              if (document.visibilityState === "visible") {
                addLog("App não detectado. Abrindo navegador...", "warn");
                window.open(shopeeFallback, "_blank");
              }
            }, 2000);
          } else {
            // Android: Intent robusto para abrir app ou Play Store/Browser
            const intentUrl = `intent://shopee.com.br/#Intent;scheme=https;package=com.shopee.br;S.browser_fallback_url=${encodeURIComponent(shopeeFallback)};end`;
            window.location.href = intentUrl;
          }
        } else {
          window.open("https://affiliate.shopee.com.br/offer/product_offer", "_blank", "noopener,noreferrer");
        }
      }
    };
    /* EX-LOGIC:
    if (isMobile && selectedPlatform === "tiktok") {
      window.location.href = target;
    } else {
      window.open(target, "_blank", "noopener,noreferrer");
    } */





    const createMp4File = (blob: Blob) => {
      const fileName = `viral_squad_${Date.now()}.mp4`;
      return new File([blob], fileName, { type: "video/mp4" });
    };

    // 2. Render and Process Video (ou usar do cache se existir)
    let finalBlob: Blob | null = null;
    
    // Verificar se vídeo autoral já existe em cache
    if (videoData?.isAutoral && videoData.autoralBlob) {
      addLog("VÍDEO JÁ ESTÁ PRONTO! Usando cache...", "info");
      finalBlob = videoData.autoralBlob;
    } else {
      addLog("Renderizando vídeo para postagem...", "info");
      finalBlob = await handleDownload(true);
      if (!finalBlob) {
        addLog("FALHA NA RENDERIZAÇÃO. Retornando ao editor...", "error");
        setStep("ready");
        return;
      }
    }

    addLog("VÍDEO PRONTO! ✅", "success");
    
    if (!finalBlob) return;

    if (isMobile && navigator.share) {
      addLog("Disparando Menu de Compartilhamento...", "info");

      const triggerManualDownload = () => {
        addLog("Bypass: Download Manual Forçado...", "warn");
        const a = document.createElement("a");
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

        if (
          navigator.canShare &&
          navigator.canShare({ files: [fileToShare] })
        ) {
          await navigator.share({
            files: [fileToShare],
            title: "Bot de Postagem Viral Squad",
            text: customCopy,
          });
          addLog("Compartilhamento disparado! Poste agora no App.", "success");
        } else {
          triggerManualDownload();
          setTimeout(() => {
            openPublishingDestination();
          }, 1500);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          addLog("Erro no Share API. Tentando Download Forçado...", "error");
          triggerManualDownload();
          setTimeout(() => {
            openPublishingDestination();
          }, 1500);
        } else {
          addLog("Operação cancelada pelo usuário.", "warn");
        }
      }
    } else {
      // 2. PC ONE-CLICK MACRO
      addLog("EXECUTANDO MACRO DE UM CLIQUE [PC MODE]", "success");

      // Step A: Trigger Download (Robust PCA Style)
      const a = document.createElement("a");
      const downloadFile = createMp4File(finalBlob);
      const blobUrl = URL.createObjectURL(downloadFile);
      a.href = blobUrl;
      a.download = downloadFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      addLog("DOWNLOAD INICIADO AUTOMATICAMENTE! ✅", "success");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);

      // Step B: Wait slightly and Open
      addLog(
        `Abrindo portal de upload do ${selectedPlatform.toUpperCase()}...`,
        "info",
      );
      setTimeout(() => {
        openPublishingDestination();
        addLog("PIPELINE CONCLUÍDO. COLE A LEGENDA NO SITE!", "success");
      }, 1500);
    }

    setTimeout(() => {
      addLog("PROTOCOLO DE POSTAGEM FINALIZADO.", "success");
      setAutomationFinished(true);
      showToast("CONCLUÍDO! VERIFIQUE A ABA ABERTA 🚀");
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
      <>
        {!isSupabaseConfigured && (
          <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-4 text-center text-[11px] font-black uppercase tracking-[0.2em] z-[10000] shadow-2xl border-b border-white/20">
            ⚠️ ERRO CRÍTICO: CHAVES DO SUPABASE NÃO CONFIGURADAS NO NETLIFY! O LOGIN NÃO VAI FUNCIONAR.
          </div>
        )}
        <LoginScreen
          onLoginSuccess={(loggedUser) => {
            setUser(loggedUser);
            checkAccess(loggedUser);
          }}
        />
      </>
    );
  }


  return (
    <div className={`flex flex-col h-[100dvh] bg-slate-950 text-slate-50 font-inter overflow-hidden ${isSmall ? 'text-sm' : ''}`}>
      {!isSupabaseConfigured && (
        <div className="bg-red-600 text-white p-2 text-center text-[9px] font-black uppercase tracking-widest z-[1000] relative">
          ⚠️ CONFIGURAÇÃO SUPABASE AUSENTE (NETLIFY SETTINGS)
        </div>
      )}
      <ScanningHUD active={isScanning} />

      <header className="border-b border-white/5 bg-slate-950/60 backdrop-blur-3xl z-[100] px-6 py-4 sticky top-0 shadow-2xl space-y-4 min-h-[76px] sm:min-h-[80px]">
        <div className="flex items-center justify-between">
          <ViralSquadLogo size="sm" />
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black text-emerald-400/80 uppercase tracking-widest leading-none mb-1">
                STATUS: {hasAccessToPlatform ? 'OPERACIONAL' : 'LIMITADO'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400">
                  {user?.email?.split("@")[0]}
                </span>
                {isPro && (
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase rounded-full border border-emerald-500/20 shadow-sm">
                    PRO
                  </span>
                )}
              </div>
            </div>

            <div className="w-px h-8 bg-white/5 hidden md:block" />

            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(239, 68, 68, 0.15)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="h-10 w-10 sm:w-auto sm:px-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 transition-all hover:border-red-500/30 group"
            >
              <LogOut size={16} className="text-slate-400 group-hover:text-red-500 transition-colors" />
              <span className="text-[9px] font-black text-slate-400 group-hover:text-red-500 uppercase tracking-widest hidden sm:inline">
                ENCERRAR
              </span>
            </motion.button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <TrialCountdown
              remainingMs={trialRemaining}
              isPro={isPro}
              onRefresh={checkAccess}
            />
          </div>
          {hasAccessToPlatform ? (
            <div className="flex items-center gap-2 shrink-0">
              {isProExpiringSoon && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleUpgradeToPro}
                  className="h-10 px-4 bg-gradient-to-r from-amber-300 to-orange-400 text-slate-950 rounded-xl text-[9px] font-black uppercase tracking-[0.14em] border border-amber-200/30 shadow-lg whitespace-nowrap"
                >
                  RENOVAR
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleManageSubscription}
                className="h-10 px-4 bg-white/5 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.14em] border border-white/10 whitespace-nowrap"
              >
                GERENCIAR
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleUpgradeToPro}
              className="h-10 px-4 bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 rounded-xl text-[9px] font-black uppercase tracking-[0.14em] border border-emerald-300/30 shadow-lg whitespace-nowrap shrink-0"
            >
              ATIVAR PRO
            </motion.button>
          )}
        </div>

        {!isStoreConfigured() && step !== "bio" && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
          >
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-tight">
                PENDÊNCIA: CONFIGURE SUA LOJA PARA LIBERAR O ACESSO
              </span>
            </div>
          </motion.div>
        )}
      </header>


      <main className="flex-1 overflow-hidden flex flex-col relative bg-slate-950 contain-layout">
        {step === "bio" && (
            <div className="step-wrapper-standard overflow-y-auto p-4 md:p-8">
              <BioManager
                user={user}
                initialStoreSlug={storeSlug}
                initialStoreReady={storeReady}
                onStoreConfigured={handleStoreConfigured}
                onProceed={() => setStep("agents_scouting")}
              />
            </div>
          )}
          {step === "home" && (
            <div className="step-wrapper-standard">
              <div className="home-layout-perfect">
                {/* Top Section: The Premium Shield Identity */}
                <div className="relative group mx-auto mt-2 sm:mt-4">
                  <div className="absolute -inset-24 bg-emerald-500/5 blur-[80px] rounded-full" />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-20 h-20 sm:w-32 sm:h-32 rounded-[2rem] sm:rounded-[3rem] border border-white/10 flex items-center justify-center bg-gradient-to-br from-slate-900 to-black relative z-10 shadow-2xl premium-border"
                  >
                    <Shield size={isMobile ? 40 : 64} className="text-emerald-400" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/30 flex items-center justify-center">
                      <Zap size={isMobile ? 12 : 20} className="text-emerald-400 animate-pulse" fill="currentColor" />
                    </div>
                  </motion.div>
                </div>

                {/* Middle Section: Main Content Area */}
                <div className="space-y-2 sm:space-y-4 flex-1 flex flex-col justify-center items-center">
                  <div className="space-y-1 text-center">
                    <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase leading-[0.8] italic">
                      DOMINE O <br />
                      <span className="text-metallic">
                        ALGORITMO
                      </span>
                    </h2>
                    <p className="text-[10px] sm:text-[13px] text-emerald-400/50 uppercase font-black tracking-[0.4em] sm:tracking-[0.6em] mx-auto mt-2">
                      SQUAD V6.0 STEALTH ENGINE
                    </p>
                  </div>

                  {/* Countdown Context */}
                  {((!isPro && trialRemaining !== null) || isProExpiringSoon) && (
                    <div className="w-full max-w-sm mx-auto">
                      <TrialCountdown
                        remainingMs={trialRemaining}
                        isPro={isPro}
                        variant="large"
                        onRefresh={checkAccess}
                      />
                    </div>
                  )}
                </div>

                {/* Bottom Section: Primary Action Area */}
                <div className="w-full max-w-sm mx-auto flex flex-col gap-2 pb-24 sm:pb-6">
                  {!isPro && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleUpgradeToPro}
                      className="w-full py-4 rounded-2xl border border-emerald-400/20 bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 text-[10px] sm:text-xs font-black uppercase tracking-[0.24em] shadow-xl shadow-emerald-500/10 btn-glow-effect"
                    >
                      QUERO SER PRO AGORA
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full py-5 sm:py-6 rounded-2xl flex items-center justify-center gap-3 text-sm sm:text-lg font-black uppercase italic tracking-[0.2em] shadow-2xl border-b-4 transition-all btn-glow-effect ${
                      isStoreConfigured()
                        ? "btn-premium border-emerald-950/20"
                        : "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 border-orange-900/40 shadow-[0_20px_50px_rgba(245,158,11,0.2)]"
                    }`}
                    onClick={() => {
                      if (isStoreConfigured()) {
                        setStep("agents_scouting");
                      } else {
                        setStep("bio");
                      }
                    }}
                  >
                    <motion.span className="flex items-center gap-3">
                      {isStoreConfigured()
                        ? "INICIAR BUSCAS"
                        : "CRIAR MINHA LOJA"}
                      {isStoreConfigured() ? (
                        <Zap size={24} fill="currentColor" />
                      ) : (
                        <ArrowRight size={24} />
                      )}
                    </motion.span>
                  </motion.button>

                  <p className="text-[9px] text-emerald-400/30 font-black uppercase tracking-[0.2em] text-center pt-1">
                    {isStoreConfigured()
                      ? "PLANO ATIVO: TRIAL 24H"
                      : "PENDÊNCIA: CONFIGURAR LOJA"}
                  </p>
                </div>
              </div>
            </div>
          )}


          {step === "onboarding_start" && (
            <motion.div
              key="onboarding_start"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
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
                  <span className="text-accent underline decoration-accent/30 decoration-8 underline-offset-8">
                    VIRAL SQUAD
                  </span>
                </h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[280px] mx-auto">
                  Para começar a lucrar, precisamos configurar sua{" "}
                  <span className="text-white">VITRINE DE VENDAS</span>. É por
                  lá que seus clientes vão comprar!
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-premium px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl relative z-10"
                onClick={() => setStep("onboarding_config")}
              >
                CRIAR MINHA LOJA AGORA
              </motion.button>
            </motion.div>
          )}

          {step === "onboarding_config" && (
            <motion.div
              key="onboarding_config"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
              className="h-full flex flex-col overflow-y-auto custom-scrollbar p-4 md:p-8"
            >
              <div className="max-w-md mx-auto w-full space-y-10 pb-32">
                <div className="text-center space-y-3">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                    CONFIGURAÇÃO DE{" "}
                    <span className="text-emerald-500 underline decoration-emerald-500/20">
                      LOJA E RASTREIO
                    </span>
                  </h3>
                  <p className="text-[10px] text-dim uppercase font-black tracking-[0.3em]">
                    Defina seu link único e seu ID de Afiliado Shopee
                  </p>
                </div>
                <BioManager
                  user={user}
                  initialStoreSlug={storeSlug}
                  initialStoreReady={storeReady}
                  onStoreConfigured={handleStoreConfigured}
                  onProceed={() => setStep("onboarding_filtering")}
                />
              </div>
            </motion.div>
          )}

          {step === "onboarding_filtering" && (
            <motion.div
              key="onboarding_filtering"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
              className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center p-8 text-center space-y-12 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#020617_80%)] z-10" />

              <div className="relative z-20 space-y-12 w-full max-w-sm">
                <div className="relative mx-auto w-32 h-32">
                  <motion.div
                    animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      ease: "linear",
                    }}
                    className="absolute inset-0 border-2 border-t-accent border-r-emerald-500 border-b-purple-500 border-l-transparent rounded-full shadow-[0_0_60px_rgba(6,182,212,0.4)]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity size={40} className="text-accent animate-pulse" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter italic">
                      RECRUTANDO AGENTES...
                    </h2>
                    <p className="text-[10px] text-dim uppercase tracking-[0.4em] font-bold animate-pulse text-accent">
                      Status: Sincronizando Database Viral
                    </p>
                  </div>

                  <div className="bg-slate-950/80 backdrop-blur-3xl border border-white/5 p-6 rounded-[2rem] font-mono text-[9px] text-left space-y-2 h-44 overflow-hidden relative shadow-2xl">
                    <motion.div
                      animate={{ y: [0, -220] }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="space-y-2"
                    >
                      <p className="text-accent">
                        &gt; INICIALIZANDO_NÚCLEO_V6
                      </p>
                      <p>&gt; MAPEANDO_TENDÊNCIAS_TTC</p>
                      <p className="text-emerald-400">
                        &gt; CONEXÃO_SHOPEE_ESTABELECIDA
                      </p>
                      <p>&gt; CARREGANDO_SCRIPTS_DE_VENDAS</p>
                      <p className="text-purple-400">
                        &gt; ATIVANDO_PROXY_ANTIBAN
                      </p>
                      <p>&gt; GERANDO_CRIAÇÃO_ESTRATÉGICA</p>
                      <p className="text-accent">
                        &gt; SINCRONIZANDO_LOJA_SQUAD...
                      </p>
                      <p className="text-white font-black">
                        &gt; PROCESSO_CONCLUÍDO_COM_SUCESSO
                      </p>
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
                  onClick={() => setStep("agents_scouting")}
                >
                  LOJA CRIADA! ATIVAR AGENTES VIRIAIS 🚀
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === "agents_scouting" && (
            <motion.div
              key="agents_scouting"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
              className="step-wrapper-standard"
            >
              <AgentScouting
                onComplete={() => {
                  setStep("list");
                  refreshProducts();
                }}
              />
            </motion.div>
          )}

          {/* Tela de scouting removida - redireciona direto para list */}

          {step === "list" && (
            <motion.div
              key="list"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
              className="step-wrapper-standard p-4 sm:p-6 space-y-6 pb-40"
            >
              {/* Pesquisa por Link da Shopee */}
              <form
                onSubmit={handleCustomLinkSubmit}
                className="relative group shrink-0 space-y-2"
              >
                <div className="absolute -inset-1 bg-accent/20 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center">
                  <div className="flex-1 relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-accent transition-colors z-20"
                    />
                    <input
                      type="text"
                      value={customLink}
                      onChange={(e) => setCustomLink(e.target.value)}
                      placeholder="Busque qualquer produto na Shopee..."
                      className="w-full bg-slate-950/90 border border-white/10 rounded-2xl pl-10 pr-24 py-4 text-[13px] text-white focus:outline-none focus:border-accent/60 shadow-[0_0_30px_rgba(0,0,0,0.5)] placeholder:text-white/30 transition-all font-bold relative z-10"
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
                  <h2 className="text-3xl font-black uppercase leading-none italic tracking-tighter">
                    Packs <span className="text-accent">Shopee</span>
                  </h2>
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
                <RefreshCcw
                  size={16}
                  className="group-hover:rotate-180 transition-transform duration-700"
                />
                Sincronizar Acervo Viral
              </motion.button>

              {/* Grade de Categorias Premium */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {niches.map((n) => (
                  <motion.button
                    key={n.id}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleNicheChange(n.id)}
                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-[1.5rem] border transition-all duration-300 relative group overflow-hidden ${
                      activeNiche === n.id
                        ? "bg-accent/10 border-accent/50 text-accent shadow-[0_8px_30px_rgba(6,182,212,0.15)] bg-gradient-to-br from-accent/5 to-transparent"
                        : "bg-slate-900/40 border-white/5 text-white/40 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    {activeNiche === n.id && (
                      <motion.div
                        layoutId="niche-glow"
                        className="absolute inset-0 bg-accent/5 rounded-[1.5rem] pointer-events-none"
                      />
                    )}
                    <span
                      className={`text-2xl transition-transform duration-300 ${activeNiche === n.id ? "scale-110" : "group-hover:scale-110 grayscale-[0.5] group-hover:grayscale-0 opacity-60 group-hover:opacity-100"}`}
                    >
                      {n.icon}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest leading-none text-center transition-colors ${
                        activeNiche === n.id ? "text-accent" : "text-slate-600"
                      }`}
                    >
                      {n.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              <AnimatePresence>
                {activeNiche && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-6 flex justify-center"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(16,185,129,0.3)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => discoverNicheNews(activeNiche)}
                      disabled={isFindingNewItems}
                      className={`group relative flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase transition-all duration-500 overflow-hidden ${
                        isFindingNewItems 
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                          : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_10px_40px_-10px_rgba(16,185,129,0.5)]"
                      }`}
                    >
                      {isFindingNewItems ? (
                        <>
                          <RotateCcw className="w-4 h-4 animate-spin" />
                          <span>MINERANDO NOVIDADES...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                          <span>BUSCAR NOVIDADES NO NICHO</span>
                          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Lista de Produtos */}
              <div className="space-y-3">
                {activeItems.map((p, i) => {
                  const isPublished = publicationHistory.some(
                    (h) => h.product_id === p.id,
                  );
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      whileHover={{ x: 6 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative group ${isPublished ? "opacity-40 grayscale pointer-events-none" : "cursor-pointer"}`}
                      onClick={() => {
                        setSelectedProduct(p);
                        researchTikTok(p);
                      }}
                    >
                      <div className="absolute -inset-[1px] bg-gradient-to-r from-accent/20 via-transparent to-accent/5 rounded-[2.2rem] opacity-0 group-hover:opacity-100 transition-opacity blur-[1px]" />

                      <div className="relative bg-slate-900/60 border border-white/5 rounded-[2rem] p-4 flex gap-5 items-center backdrop-blur-3xl transition-all group-hover:border-accent/30 group-hover:bg-slate-900/80 shadow-2xl shadow-black/40">
                        {/* Badge de Comissão */}
                        <div className="relative w-16 h-16 shrink-0">
                          <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative w-full h-full rounded-2xl bg-black/60 border border-accent/20 flex flex-col items-center justify-center overflow-hidden">
                            <span className="text-[10px] font-black text-accent/60 uppercase leading-none mb-0.5 tracking-tighter">
                              COM
                            </span>
                            <span className="text-xl font-black text-accent italic leading-none">
                              {p.commission_pct}%
                            </span>
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-accent/30" />
                          </div>
                        </div>

                        {/* Info do Produto */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                                {p.sales} VENDAS
                              </span>
                            </div>
                            {isPublished && (
                              <span className="text-[8px] font-black uppercase tracking-widest text-white/30 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                POSTADO
                              </span>
                            )}
                            {p.is_international && (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
                                <Globe size={8} className="text-blue-400" />
                                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">
                                  INTERNACIONAL
                                </span>
                              </div>
                            )}
                          </div>

                          <h3 className="font-black text-[13px] text-white/90 uppercase truncate leading-tight group-hover:text-white transition-colors">
                            {p.title}
                          </h3>

                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-black text-emerald-400/80">
                              {p.price}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-slate-700" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                              SQUAD SELECTION
                            </span>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              addToBio(p, e);
                            }}
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
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">
                      Nenhum produto carregado
                    </p>
                    <button
                      onClick={refreshProducts}
                      className="text-accent text-[10px] font-black uppercase tracking-widest underline"
                    >
                      Atualizar agora
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === "plans" && (
            <motion.div
              key="plans"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
              className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center p-6 text-center space-y-8"
            >
              <div className="relative">
                <div className="absolute -inset-16 bg-accent/20 blur-[80px] rounded-full" />
                <motion.div
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  className="w-24 h-24 rounded-[2rem] bg-slate-900 border-2 border-accent/30 flex items-center justify-center relative z-10 shadow-2xl"
                >
                  <Sparkles size={40} className="text-accent" />
                </motion.div>
              </div>

              <div className="space-y-3 relative z-10">
                <h2 className="text-4xl font-black italic uppercase italic tracking-tighter">
                  ESQUADRÃO{" "}
                  <span className="text-accent underline decoration-accent/20">
                    PRO
                  </span>
                </h2>
                <p className="text-[10px] text-dim uppercase font-black tracking-[0.3em]">
                  O Próximo Nível da Automação Viral
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 w-full max-w-sm relative z-10">
                {[
                  {
                    icon: <Zap size={16} />,
                    title: "MOTOR V6 DESBLOQUEADO",
                    desc: "Acesse a tecnologia mais avançada de busca.",
                  },
                  {
                    icon: <Shield size={16} />,
                    title: "ALGORITMO ANTI-BAN",
                    desc: "Proteção total em todas as suas publicações.",
                  },
                  {
                    icon: <LayoutGrid size={16} />,
                    title: "PRODUTOS ILIMITADOS",
                    desc: "Sem restrições para escalar sua operação.",
                  },
                ].map((item, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i}
                    className="flex items-center gap-4 bg-slate-900/40 border border-white/5 p-4 rounded-2xl text-left backdrop-blur-xl"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
                        {item.title}
                      </h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setCheckoutUrl(HOTMART_CHECKOUT_URL);
                  setIsCheckoutOpen(true);
                }}
                className="w-full max-w-sm py-5 bg-gradient-to-r from-accent to-emerald-400 text-slate-950 rounded-2xl text-[12px] font-black uppercase tracking-[0.25em] shadow-[0_20px_60px_rgba(6,182,212,0.3)] border-b-4 border-slate-950/20"
              >
                ATIVAR MEU ACESSO PRO 🚀
              </motion.button>

              <button
                onClick={() => setStep("home")}
                className="text-[9px] text-slate-500 font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                VOLTAR PARA O INÍCIO
              </button>
            </motion.div>
          )}

          {step === "treating" && (
            <motion.div
              key="treating"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
              className="step-wrapper-standard flex flex-col items-center justify-center p-6"
            >
              <div className="w-full max-w-md rounded-[2.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.94)_0%,rgba(2,6,23,0.98)_100%)] p-7 shadow-[0_30px_120px_rgba(2,6,23,0.8)] backdrop-blur-xl sm:backdrop-blur-3xl">
                <div className="flex flex-col items-center text-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-10 rounded-full bg-accent/12 blur-[60px]" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute -inset-6 rounded-full border border-accent/10 border-dashed"
                    />
                    <div className="relative w-24 h-24 rounded-[2rem] border border-white/15 bg-slate-900/90 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.12)]">
                      <RefreshCcw
                        size={40}
                        className="text-accent animate-spin"
                        style={{ animationDuration: "3.2s" }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.45em] text-accent/80">
                      Pipeline Viral
                    </p>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none text-white">
                      Curando o melhor criativo
                    </h2>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {treatingStatus}
                    </p>
                  </div>

                  <div className="w-full space-y-3">
                    <div className="flex items-end justify-between">
                      <span className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-500">
                        Progresso da analise
                      </span>
                      <span className="text-2xl font-mono font-black text-accent">
                        {treatingProgress}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${treatingProgress}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
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
                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-200">
                          {item}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === "ready" && (
            <motion.div
              key="ready"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
              className="step-wrapper-standard lg:flex lg:flex-col bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.08),transparent_30%),linear-gradient(180deg,#020617_0%,#020617_100%)] overflow-y-auto lg:overflow-visible h-[100dvh] lg:h-auto"
            >
              {/* VÍDEO STICKY — sempre visível no topo ao rolar */}
              <div className="z-30 px-3 pt-safe lg:shrink-0 bg-gradient-to-b from-slate-950 via-slate-950/94 to-transparent backdrop-blur-xl lg:sticky lg:top-0 sm:px-4">
                <div className="mt-2 mb-2 rounded-[1.35rem] border border-white/6 bg-white/[0.025] px-3 py-3 shadow-[0_14px_40px_rgba(2,6,23,0.28)] sm:px-4">
                  <div className="flex items-center justify-between mb-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={goBackToShopee}
                      className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
                    >
                      <ArrowLeft size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Voltar
                      </span>
                    </motion.button>
                    <div
                      className={`flex items-center gap-2 rounded-full px-2.5 py-1.5 sm:px-3 ${hasAccessToPlatform ? "border border-emerald-400/16 bg-emerald-400/7 text-emerald-300" : "border border-amber-400/16 bg-amber-400/7 text-amber-300"}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${hasAccessToPlatform ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" : "bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.8)]"}`}
                      />
                      <span className="text-[10px] font-black uppercase tracking-[0.22em]">
                        {hasAccessToPlatform
                          ? "Edição Pro Ativa"
                          : "Modo Teste Ativo"}
                      </span>
                    </div>
                  </div>

                  <div className="mb-2 space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.42em] text-accent/70">
                      Central de postagem
                    </p>
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
                          <p className="text-[7px] font-black uppercase tracking-[0.28em] text-slate-500 leading-none">
                            Modo
                          </p>
                          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white">
                            Creative V6
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="video-preview-container min-h-[320px] sm:min-h-[500px] aspect-[9/16] max-h-[75vh] sm:max-h-[650px] mx-auto relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-white/8 shadow-[0_20px_50px_rgba(2,6,23,0.42)] bg-black">
                    {videoData?.url ? (
                      <>
                        <video
                          key={videoData?.id || "main-player"}
                          ref={videoRef}
                          src={videoData?.url || undefined}
                          crossOrigin="anonymous"
                          onTimeUpdate={(e) =>
                            setCurrentTime(e.currentTarget.currentTime)
                          }
                          onLoadedMetadata={(e) =>
                            setVideoDuration(e.currentTarget.duration)
                          }
                          playsInline
                          loop
                          muted={isMuted}
                          className={`w-full h-full object-contain filter-preview-${activeFilter} ${isTransitionActive ? `transition-preview-${activeTransition}` : ""}`}
                        />

                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <div className="bg-slate-950/55 backdrop-blur-md p-5 rounded-full border border-white/12">
                            {isPlaying ? (
                              <VolumeX size={48} className="text-white" />
                            ) : (
                              <RefreshCcw
                                size={48}
                                className="text-white animate-pulse"
                              />
                            )}
                          </div>
                        </button>

                        {/* Elite Overlays System */}
                        <div
                          className={`absolute inset-0 pointer-events-none effect-overlay-${activeFilter}`}
                        />

                        {/* Elite Overlays System */}
                        <div
                          className={`absolute inset-0 pointer-events-none effect-overlay-${activeFilter}`}
                        />
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50 space-y-4">
                        <Video size={48} className="text-white/10" />
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                          Processando Mídia...
                        </span>
                      </div>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsMuted(!isMuted)}
                      className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-30 w-10 h-10 bg-slate-950/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white"
                    >
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </motion.button>{" "}
                    {/* Editor Header with Notch Support */}
                    <div
                      className="absolute inset-x-0 top-0 z-30 px-4 flex justify-between items-center pointer-events-none"
                      style={{ paddingTop: "calc(var(--safe-top) + 0.5rem)" }}
                    >
                      <div className="w-10 h-10" />

                      <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]" />
                        <span className="text-[8px] font-black text-white italic tracking-[0.2em]">
                          LIVE_PREVIEW_V4
                        </span>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/10 pointer-events-none opacity-45" />
                  </div>
                </div>
              </div>{" "}
              {/* fim do sticky video */}
              {/* CONTROLES SCROLLÁVEIS ABAIXO */}
              <div className="lg:flex-1 lg:overflow-y-auto pb-32 px-3 space-y-4 sm:px-4">
                {/* Main Professional Editor Controls */}
                <div className="mt-2">
                  <VisualTimeline />
                </div>

                <div className="tech-card !p-4 sm:!p-5 !bg-white/[0.02] !border-white/6 space-y-5 shadow-[0_10px_30px_rgba(2,6,23,0.18)]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] text-accent/80 font-black uppercase tracking-[0.3em] leading-none mb-1">
                          Copiar Estratégia
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Use o nome curto para buscar mais rapido na central de
                          afiliados.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-black italic uppercase leading-tight text-white/95 line-clamp-3">
                          {selectedProduct?.title || "Carregando..."}
                        </h3>
                        <button
                          onClick={() => {
                            if (selectedProduct?.title) {
                              const smartName = getSmartSearchName(
                                selectedProduct.title,
                              );
                              copyToClipboard(smartName);
                              showToast("BUSCA INTELIGENTE COPIADA! 📋");
                            }
                            window.open(
                              "https://affiliate.shopee.com.br/offer/product_offer",
                              "_blank",
                            );
                          }}
                          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#EE4D2D]/8 text-[#ff8b73] border border-[#EE4D2D]/16 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#EE4D2D]/14 hover:text-white transition-all w-fit text-left leading-tight"
                        >
                          <Search size={12} className="shrink-0" />
                          <span>
                            Buscar Central de Afiliados <br />
                            <span className="text-[8px] opacity-70">
                              (Copia nome p/ colar)
                            </span>
                          </span>
                        </button>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          if (selectedProduct?.title) {
                            const smartName = getSmartSearchName(
                              selectedProduct.title,
                            );
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
                      className={`h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${boostMode === "performance" ? "bg-accent border-accent text-slate-950 shadow-[0_10px_20px_rgba(16,185,129,0.2)]" : "bg-slate-900 border-white/5 text-dim opacity-50"}`}
                      onClick={() => updateMode("performance")}
                    >
                      <Zap size={18} />
                      <span className="text-[9px] font-black uppercase">
                        Foco Vendas
                      </span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className={`h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${boostMode === "funny" ? "bg-accent border-accent text-slate-950 shadow-[0_10px_20px_rgba(16,185,129,0.2)]" : "bg-slate-900 border-white/5 text-dim opacity-50"}`}
                      onClick={() => updateMode("funny")}
                    >
                      <Activity size={18} />
                      <span className="text-[9px] font-black uppercase">
                        Foco Viral
                      </span>
                    </motion.button>
                  </div>

                  {/* QUICK ADD TO BIO STORE - ACID PREMIUM STYLE */}
                  <div className="pt-4 border-t border-white/5">
                    <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-2">
                        <ShoppingBag size={14} className="text-accent" />
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                            Publicar na Vitrine{" "}
                            <span className="text-accent italic">
                              (Opcional)
                            </span>
                          </span>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Adicione o item direto no seu link da bio com
                            imagem, titulo e link afiliado.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (videoLegend) setBioTitle(videoLegend);
                          if (videoData?.thumbnail)
                            setBioImageUrl(videoData.thumbnail);
                          showToast("✨ CAMPOS PREENCHIDOS!");
                        }}
                        className="text-[9px] font-black uppercase tracking-widest text-accent hover:text-white transition-colors flex items-center justify-center gap-1 bg-accent/5 px-2.5 py-1.5 rounded-lg border border-accent/10 shrink-0 w-full sm:w-auto"
                      >
                        <Sparkles size={10} /> Preencher Auto
                      </button>
                    </div>

                    <div className="bg-black/25 border border-white/5 rounded-2xl p-4 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black tracking-widest text-accent/70 ml-1">
                          Link Afiliado
                        </label>
                        <input
                          type="url"
                          placeholder="https://shope.ee/..."
                          value={bioLink}
                          onChange={(e) => setBioLink(e.target.value)}
                          className="w-full bg-[#0a0a0a]/90 border border-white/5 rounded-xl py-2.5 px-3 text-[11px] text-white focus:border-accent/40 outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-[9px] uppercase font-black tracking-widest text-accent/70">
                            URL da Imagem
                          </label>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="text-[9px] font-black uppercase tracking-widest text-accent hover:text-white transition-colors flex items-center gap-1 bg-accent/5 px-2 py-1 rounded-md border border-accent/10"
                          >
                            {isUploading ? (
                              <RefreshCcw size={10} className="animate-spin" />
                            ) : (
                              <Upload size={10} />
                            )}
                            {isUploading ? "SUBINDO..." : "ANEXAR IMAGEM"}
                          </button>
                        </div>
                        <input
                          type="url"
                          placeholder="Cole o link da foto do produto..."
                          value={bioImageUrl}
                          onChange={(e) => setBioImageUrl(e.target.value)}
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
                        <label className="text-[9px] uppercase font-black tracking-widest text-accent/70 ml-1">
                          Nome do Produto
                        </label>
                        <textarea
                          placeholder="Ex: Nome do Produto... 🔥"
                          value={bioTitle}
                          onChange={(e) => setBioTitle(e.target.value)}
                          className="w-full bg-[#0a0a0a]/90 border border-white/5 rounded-xl py-2.5 px-3 text-[11px] text-white focus:border-accent/40 outline-none transition-all h-20 resize-none font-medium"
                        />
                      </div>

                      <button
                        onClick={async () => {
                          const targetSlug = (
                            user?.user_metadata?.store_slug || 
                            storeSlug || 
                            localStorage.getItem("bio_store_slug") || 
                            new URLSearchParams(window.location.search).get("loja") ||
                            ""
                          ).toLowerCase();

                          if (!targetSlug) {
                            showToast("CONFIGURE SUA LOJA PRIMEIRO!");
                            setStep("bio");
                            return;
                          }
                          if (!bioLink || !bioImageUrl || !bioTitle) {
                            showToast(
                              "⚠️ Preencha todos os campos da vitrine!",
                            );
                            return;
                          }
                          setIsSavingToBio(true);
                          const { error } = await supabase
                            .from("bio_store")
                            .insert({
                              user_id: targetSlug,
                              title: bioTitle,
                              image_url: bioImageUrl,
                              affiliate_link: bioLink,
                            });
                          setIsSavingToBio(false);
                          if (!error) {
                            showToast("🛍️ PUBLICADO COM SUCESSO!");
                            setBioLink("");
                            setBioImageUrl("");
                            setBioTitle("");
                          } else {
                            showToast("❌ Erro ao publicar: " + error.message);
                          }
                        }}
                        disabled={isSavingToBio}
                        className="w-full py-3 bg-accent/8 border border-accent/16 hover:bg-accent hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
                      >
                        {isSavingToBio ? (
                          <RefreshCcw className="animate-spin" size={12} />
                        ) : (
                          <Zap size={12} fill="currentColor" />
                        )}
                        {isSavingToBio
                          ? "PUBLICANDO..."
                          : "ADICIONAR À MINHA LOJA"}
                      </button>
                      <p className="text-[8px] text-slate-600 text-center font-bold tracking-tight">
                        O item aparecerá imediatamente no seu link da bio.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6 pt-2">
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (videoData?.isAutoral) {
                            regenerateAutoralVideo();
                          } else {
                            swapVideo();
                          }
                        }}
                        disabled={isProcessing}
                        className="flex-1 h-12 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-white text-[10px] font-black uppercase tracking-widest hover:border-accent/30 transition-all disabled:opacity-50"
                      >
                        <RotateCcw size={14} className="text-accent" /> 
                        {videoData?.isAutoral ? "Nova Versão 🎲" : "Trocar Vídeo"}
                      </motion.button>
                    </div>

                    {!videoData?.isAutoral && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTransformToAutoral()}
                        disabled={isProcessing || !selectedProduct}
                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 border border-purple-400/30 rounded-xl flex items-center justify-center gap-2 text-white text-[10px] font-black uppercase tracking-widest hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
                      >
                        <Sparkles size={14} className="text-white" />
                        Transformar em Autoral ✨
                      </motion.button>
                    )}
                  </div>

                  {videoData?.isAutoral && (
                    <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-3">
                      <p className="text-[9px] font-black uppercase text-cyan-400 mb-2">Configurações Atuais</p>
                      <div className="flex flex-wrap gap-2 text-[8px] text-white/60">
                        <span className="bg-cyan-500/20 px-2 py-1 rounded">🎵 {videoData.musicId || 'Random'}</span>
                        <span className="bg-purple-500/20 px-2 py-1 rounded">✨ {videoData.filter || 'Random'}</span>
                        <span className="bg-orange-500/20 px-2 py-1 rounded">🔄 {videoData.transitions?.length || 4} transições</span>
                      </div>
                    </div>
                  )}

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
                        className={`shrink-0 px-4 py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 min-w-[80px] ${activeFilter === f.id ? "bg-accent border-accent text-slate-950 font-black" : "bg-slate-900 border-white/5 text-white/40"}`}
                      >
                        <span className="text-[10px] uppercase truncate w-full text-center tracking-tighter">
                          {f.name}
                        </span>
                      </motion.button>
                    ))}
                  </div>

                  <p className="text-[10px] text-accent font-black uppercase tracking-[0.3em] leading-none mb-4 flex items-center gap-2">
                    <Zap size={12} className="text-accent" />
                    Transições CapCut Pro
                  </p>
                  <div className="grid grid-cols-2 gap-2 pb-2">
                    {[
                      {
                        id: "fire",
                        name: "🔥 EXPLOSÃO",
                        icon: <Zap size={14} />,
                      },
                      {
                        id: "glitch",
                        name: "⚡ GLITCH PRO",
                        icon: <Scissors size={14} />,
                      },
                      {
                        id: "zoom",
                        name: "Zoom",
                        icon: <Maximize2 size={14} />,
                      },
                      {
                        id: "beat",
                        name: "Batida Viral",
                        icon: <Activity size={14} />,
                      },
                      {
                        id: "flash",
                        name: "Flash Branco",
                        icon: <Zap size={14} />,
                      },
                      {
                        id: "slide",
                        name: "Slide Lateral",
                        icon: <MoveRight size={14} />,
                      },
                      {
                        id: "blur",
                        name: "Motion Blur",
                        icon: <Sparkles size={14} />,
                      },
                      {
                        id: "shake",
                        name: "Tremor CapCut",
                        icon: <RefreshCcw size={14} />,
                      },
                      {
                        id: "rotate",
                        name: "Giro 3D Pro",
                        icon: <RotateCcw size={14} />,
                      },
                      { id: "none", name: "Original", icon: <X size={14} /> },
                    ].map((t) => (
                      <motion.button
                        key={t.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTransition(t.id)}
                        className={`h-12 rounded-xl border flex items-center justify-center gap-2 transition-all ${activeTransition === t.id ? "bg-white/10 border-accent/50 text-accent outline outline-2 outline-accent/20" : "bg-slate-900 border-white/5 text-white/20"}`}
                      >
                        {t.icon}
                        <span className="text-[10px] font-black uppercase tracking-tight">
                          {t.name}
                        </span>
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
                    {viralTracks.map((m) => (
                      <button
                        key={m.id}
                        onClick={() =>
                          setSelectedMusic(
                            selectedMusic === m.url ? null : m.url,
                          )
                        }
                        className={`shrink-0 px-4 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${
                          selectedMusic === m.url
                            ? "bg-accent text-slate-950 border-accent shadow-lg shadow-accent/20"
                            : "bg-white/5 border-white/5 text-slate-400 hover:border-white/10"
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>

                  {selectedMusic && (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "original", label: "Original", icon: "🗣️" },
                        { id: "music", label: "Somente Música", icon: "🎧" },
                        { id: "mix", label: "Mix Pro (Voz+Bit)", icon: "🎚️" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setAudioMixOption(opt.id as any)}
                          className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border transition-all ${
                            audioMixOption === opt.id
                              ? "bg-white/10 border-accent text-accent"
                              : "bg-black/20 border-white/5 text-slate-500"
                          }`}
                        >
                          <span className="text-sm">{opt.icon}</span>
                          <span className="text-[8px] font-black uppercase text-center leading-tight">
                            {opt.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* NOVO: SEÇÃO DE NARRAÇÃO IA PROFISSIONAL */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-accent font-black uppercase tracking-[0.3em] flex items-center gap-2">
                      <Mic size={12} className="text-accent" />
                      Narração IA Profissional
                    </p>
                    <button 
                      onClick={() => setUseNarration(!useNarration)}
                      className={`px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all flex items-center gap-2 ${useNarration ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/30 border border-white/10'}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${useNarration ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
                      {useNarration ? 'ATIVADA' : 'DESATIVADA'}
                    </button>
                  </div>
                  
                  {useNarration && (
                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setNarrationVoice('F')}
                        className={`h-12 rounded-xl border flex items-center justify-center gap-2 transition-all ${narrationVoice === 'F' ? 'bg-pink-500/10 border-pink-500/50 text-pink-400' : 'bg-slate-900 border-white/5 text-white/20'}`}
                      >
                        <span className="text-sm">👩</span>
                        <span className="text-[10px] font-black uppercase tracking-tight">Voz Feminina</span>
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setNarrationVoice('M')}
                        className={`h-12 rounded-xl border flex items-center justify-center gap-2 transition-all ${narrationVoice === 'M' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-slate-900 border-white/5 text-white/20'}`}
                      >
                        <span className="text-sm">👨</span>
                        <span className="text-[10px] font-black uppercase tracking-tight">Voz Masculina</span>
                      </motion.button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] text-accent font-black uppercase tracking-[0.3em] leading-none mb-1 italic">
                    Legenda para Social Media
                  </p>
                  <div className="relative group">
                    <textarea
                      className="w-full bg-slate-900 p-5 rounded-3xl border border-white/5 text-xs text-slate-100 font-medium outline-none min-h-[140px] resize-none focus:border-accent/30 transition-all leading-relaxed"
                      value={customCopy}
                      onChange={(e) => setCustomCopy(e.target.value)}
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute bottom-4 right-4 w-12 h-12 bg-accent text-slate-950 rounded-2xl flex items-center justify-center shadow-xl"
                      onClick={() => {
                        copyToClipboard(customCopy).then(() =>
                          showToast("LEGENDA COPIADA!"),
                        );
                      }}
                    >
                      <Copy size={20} />
                    </motion.button>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="space-y-2 text-center">
                    <p className="text-[10px] text-accent font-black uppercase tracking-[0.34em] leading-none italic">
                      Ação final
                    </p>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
                      Escolha onde publicar
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                      Os atalhos abaixo ja levam seu criativo para o fluxo ideal
                      de postagem, com copia e video prontos para uso.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.button
                      whileHover={{ y: -4, scale: 1.01 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => runAutomation("tiktok")}
                      className="group relative overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(226,232,240,0.94)_52%,rgba(186,230,253,0.98)_100%)] px-5 py-5 text-left shadow-[0_20px_60px_rgba(6,182,212,0.16)]"
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.18),transparent_36%)] opacity-80" />
                      <div className="relative flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-lg shadow-slate-950/20 group-hover:scale-105 transition-transform">
                            <Zap size={20} fill="currentColor" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.28em] text-slate-500">
                              Criar agora
                            </p>
                            <span className="block text-sm font-black uppercase tracking-[0.18em] text-slate-950">
                              Publicar no TikTok
                            </span>
                            <span className="block text-[10px] text-slate-600 font-bold uppercase tracking-[0.14em]">
                              Download + script viral
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="px-2.5 py-1 rounded-full bg-slate-950 text-white text-[7px] font-black uppercase tracking-[0.24em]">
                            {isMobile ? "NATIVO" : "AUTO"}
                          </div>
                          <ArrowRight
                            size={16}
                            className="text-slate-950/60 group-hover:translate-x-0.5 transition-transform"
                          />
                        </div>
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ y: -4, scale: 1.01 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => runAutomation("shopee")}
                      className="group relative overflow-hidden rounded-[2rem] border border-orange-400/20 bg-[linear-gradient(135deg,rgba(154,52,18,0.94)_0%,rgba(234,88,12,0.96)_55%,rgba(251,146,60,0.95)_100%)] px-5 py-5 text-left shadow-[0_20px_60px_rgba(249,115,22,0.18)]"
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_36%)] opacity-90" />
                      <div className="relative flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white text-orange-600 flex items-center justify-center shadow-lg shadow-orange-950/20 group-hover:scale-105 transition-transform">
                            <ShoppingBag size={20} fill="currentColor" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.28em] text-orange-100/70">
                              Publicar agora
                            </p>
                            <span className="block text-sm font-black uppercase tracking-[0.18em] text-white">
                              Shopee Videos
                            </span>
                            <span className="block text-[10px] text-orange-50/80 font-bold uppercase tracking-[0.14em]">
                              {isMobile
                                ? "Abre app e anexa o video"
                                : "Download + upload guiado"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="px-2.5 py-1 rounded-full bg-white text-orange-600 text-[7px] font-black uppercase tracking-[0.24em]">
                            {isMobile ? "NATIVO" : "AUTO"}
                          </div>
                          <ArrowRight
                            size={16}
                            className="text-white/70 group-hover:translate-x-0.5 transition-transform"
                          />
                        </div>
                      </div>
                    </motion.button>

                    {/* BOTÃO PUBLICAR NA VITRINE */}
                    <motion.button
                      whileHover={{ y: -4, scale: 1.01 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => publishToVitrine()}
                      className="group relative overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.94)_0%,rgba(34,197,94,0.96)_55%,rgba(74,222,128,0.95)_100%)] px-5 py-5 text-left shadow-[0_20px_60px_rgba(34,197,94,0.18)]"
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_36%)] opacity-90" />
                      <div className="relative flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-950/20 group-hover:scale-105 transition-transform">
                            <ShoppingCart size={20} fill="currentColor" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.28em] text-emerald-100/70">
                              Publicar agora
                            </p>
                            <span className="block text-sm font-black uppercase tracking-[0.18em] text-white">
                              Na Vitrine
                            </span>
                            <span className="block text-[10px] text-emerald-50/80 font-bold uppercase tracking-[0.14em]">
                              Adiciona à sua loja
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="px-2.5 py-1 rounded-full bg-white text-emerald-600 text-[7px] font-black uppercase tracking-[0.24em]">
                            AUTO
                          </div>
                          <ArrowRight
                            size={16}
                            className="text-white/70 group-hover:translate-x-0.5 transition-transform"
                          />
                        </div>
                      </div>
                    </motion.button>

                    {/* BOTÃO PUBLICAR NO WHATSAPP */}
                    <motion.button
                      whileHover={{ y: -4, scale: 1.01 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => publishToWhatsApp()}
                      className="group relative overflow-hidden rounded-[2rem] border border-green-500/20 bg-[linear-gradient(135deg,rgba(22,163,74,0.94)_0%,rgba(34,197,94,0.96)_55%,rgba(50,205,110,0.95)_100%)] px-5 py-5 text-left shadow-[0_20px_60px_rgba(34,197,94,0.18)]"
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_36%)] opacity-90" />
                      <div className="relative flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white text-green-600 flex items-center justify-center shadow-lg shadow-green-950/20 group-hover:scale-105 transition-transform">
                            <MessageCircle size={20} fill="currentColor" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.28em] text-green-100/70">
                              Compartilhar
                            </p>
                            <span className="block text-sm font-black uppercase tracking-[0.18em] text-white">
                              WhatsApp
                            </span>
                            <span className="block text-[10px] text-green-50/80 font-bold uppercase tracking-[0.14em]">
                              Mensagem formatada
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="px-2.5 py-1 rounded-full bg-white text-green-600 text-[7px] font-black uppercase tracking-[0.24em]">
                            AUTO
                          </div>
                          <ArrowRight
                            size={16}
                            className="text-white/70 group-hover:translate-x-0.5 transition-transform"
                          />
                        </div>
                      </div>
                    </motion.button>
                  </div>

                  <div className="bg-white/5 p-5 rounded-[2.5rem] border border-white/5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-accent rounded-full shadow-[0_0_10px_#06b6d4]" />
                      <p className="text-[9px] font-black uppercase text-accent tracking-tighter">
                        PROTOCOLO DE POSTAGEM:
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      {isMobile ? (
                        <>
                          Ao clicar em postar, seu celular abrirá o
                          Compartilhamento Nativo. O vídeo será anexado e a
                          legenda viral já foi{" "}
                          <span className="text-white font-black italic">
                            copiada!
                          </span>
                        </>
                      ) : (
                        <>
                          No computador, iniciaremos o{" "}
                          <span className="text-white font-black italic">
                            Macro de Automação
                          </span>
                          : faremos o download do vídeo, copiaremos a legenda e
                          abriremos a página de postagem para você.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  disabled={isProcessing}
                  className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 transition-all ${
                    isProcessing
                      ? "bg-slate-900/50 border border-white/5 text-slate-500 cursor-not-allowed"
                      : "bg-white/10 border border-white/20 text-white shadow-lg shadow-white/5 hover:bg-white/20 hover:border-white/30"
                  }`}
                  onClick={handleDownload}
                >
                  {isProcessing ? (
                    <RefreshCcw
                      size={18}
                      className="animate-spin text-accent"
                    />
                  ) : (
                    <Download size={18} className="text-accent" />
                  )}
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                    {isProcessing
                      ? "Sincronizando Efeitos..."
                      : "Baixar Vídeo Produzido"}
                  </span>
                </motion.button>
              </div>{" "}
              {/* fim dos controles scrolláveis */}
            </motion.div>
          )}

          {step === "automation" && (
            <motion.div
              key="automation"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
              className="step-wrapper-standard flex flex-col p-6 space-y-6"
            >
              <div className="flex items-center gap-4 px-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center">
                  <Terminal size={24} className="text-accent" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-black italic uppercase leading-none italic">
                    SQUAD<span className="text-accent">OS</span>
                  </h2>
                  <p className="text-[9px] text-dim uppercase tracking-[0.3em] font-bold animate-pulse">
                    Running Bypass Scripts...
                  </p>
                </div>
              </div>

              <div className="flex-1 bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/5 p-6 font-mono text-[10px] overflow-y-auto no-scrollbar space-y-3">
                {consoleLogs.map((log, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i}
                    className={`flex gap-3 ${log.type === "success" ? "text-accent" : log.type === "info" ? "text-dim" : "text-orange-400"}`}
                  >
                    <span className="opacity-20 shrink-0">
                      [
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                      ]
                    </span>
                    <span className="text-white/20 shrink-0">&gt;</span>
                    <span
                      className={log.type === "success" ? "font-black" : ""}
                    >
                      {log.msg}
                    </span>
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
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4"
                    >
                      <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-3xl text-center">
                        <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-3" />
                        <h3 className="text-xl font-black text-white uppercase mb-2">
                          ✅ Vídeo Pronto!
                        </h3>
                        <p className="text-sm text-slate-400 mb-2">
                          {activePlatform === 'tiktok' 
                            ? 'Legenda copiada, vídeo baixado e TikTok aberto!' 
                            : 'Legenda copiada, vídeo baixado e Shopee Videos aberto!'}
                        </p>
                        <p className="text-xs text-slate-500">
                          Seu criativo está pronto para postagem.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          className="h-16 bg-[#ff0050] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 border-2 border-white/10"
                          onClick={() => runAutomation("tiktok")}
                        >
                          <Music2 size={18} />
                          TikTok
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          className="h-16 bg-[#ee4d2d] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 border-2 border-white/10"
                          onClick={() => runAutomation("shopee")}
                        >
                          <ShoppingBag size={18} />
                          Shopee
                        </motion.button>
                      </div>

                      {/* BOTAO VER PRODUTO - Acesso rápido para favoritar */}
                      {selectedProduct?.product_link && (
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          whileHover={{ scale: 1.01 }}
                          className="w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 border border-yellow-400/30"
                          style={{
                            background: "linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fbbf24 100%)",
                            color: "#1a0a00",
                            boxShadow: "0 4px 20px rgba(251,146,60,0.35)"
                          }}
                          onClick={() => {
                            const link = selectedProduct.product_link;
                            if (link) {
                              window.open(link, "_blank");
                            }
                          }}
                        >
                          <ExternalLink size={16} strokeWidth={2.5} />
                          ⭐ Ver Produto na Shopee
                        </motion.button>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          className="h-14 bg-[#25D366] text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 border-2 border-white/10"
                          onClick={() => {
                            if (!selectedProduct) return;
                            const sanitizedLink = sanitizeShopeeLink(selectedProduct.product_link, userShopeeId || undefined);
                            const message = generateWhatsappMessage({
                              title: selectedProduct.item_name || selectedProduct.title,
                              affiliate_link: sanitizedLink,
                              price: selectedProduct.price?.toString() || "0"
                            }, storeSlug);
                            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
                          }}
                        >
                          <MessageCircle size={18} />
                          WhatsApp
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          className="h-14 bg-slate-100 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 border-2 border-white/10"
                          onClick={async () => {
                            if (!selectedProduct) return;
                            try {
                              const { data: { user } } = await supabase.auth.getUser();
                              if (!user) { showToast("🔒 Faça login primeiro!"); return; }
                              const sanitizedLink = sanitizeShopeeLink(selectedProduct.product_link, userShopeeId || undefined);
                              const { error } = await supabase.from("bio_store").insert({
                                user_id: storeSlug, 
                                title: selectedProduct.item_name || selectedProduct.title,
                                image_url: selectedProduct.item_image,
                                affiliate_link: sanitizedLink,
                                price: selectedProduct.price?.toString() || "0"
                              });
                              if (error) throw error;
                              showToast("🛒 NA VITRINE!");
                            } catch (err) {
                              showToast("❌ ERRO AO ADICIONAR");
                            }
                          }}
                        >
                          <Plus size={18} />
                          Na Vitrine
                        </motion.button>
                      </div>

                        <div className="grid grid-cols-2 gap-3">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="h-14 bg-slate-800 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-white/10"
                            onClick={() => {
                              setStep("ready");
                              setAutomationFinished(false);
                            }}
                          >
                            <Zap size={14} fill="currentColor" />
                            Editor
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="h-14 bg-emerald-500 text-slate-950 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                            onClick={() => {
                              refillProductList(activeNiche);
                              setStep("list");
                              setAutomationFinished(false);
                            }}
                          >
                            <CheckCircle2 size={16} />
                            Concluído
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

          {step === "history" && (
            <motion.div
              key="history"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
              className="step-wrapper-standard p-6 space-y-8 pb-40"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black italic uppercase leading-none">
                    Cloud <span className="text-accent">Sinc</span>
                  </h2>
                  <p className="text-[10px] text-dim uppercase tracking-[0.4em] font-bold">
                    Relatório Global Stealth
                  </p>
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
                  <p className="text-xs font-black uppercase tracking-widest">
                    Nenhum Registro Sincronizado
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {publicationHistory.map((h) => {
                    const item = activeItems.find((p) => p.id === h.product_id);

                    return (
                      <motion.div
  key={h.id}
  initial={{ opacity: 0, x: -10 }}
  animate={{ opacity: 1, x: 0 }}
  className="tech-card p-4 flex justify-between items-center group relative overflow-hidden bg-slate-900/60 border-white/5 hover:border-accent/30 transition-all"
>
  <div className={`absolute inset-y-0 left-0 w-1 ${
    h.platform === 'tiktok' ? 'bg-[#ff0050]' : 
    h.platform === 'shopee' ? 'bg-[#ee4d2d]' : 
    'bg-emerald-500'
  }`} />

  <div className="flex items-center gap-4 min-w-0 flex-1 pr-4">
    <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-white/5">
      {h.platform === 'tiktok' && <Music size={18} className="text-[#ff0050]" />}
      {h.platform === 'shopee' && <ShoppingBag size={18} className="text-[#ee4d2d]" />}
      {h.platform === 'loja' && <Globe size={18} className="text-emerald-500" />}
      {(!h.platform || h.platform === 'Shopee') && <ShoppingBag size={18} className="text-orange-500" />}
    </div>
    
    <div className="space-y-1.5 min-w-0 pr-4">
      <h3 className="text-[11px] font-black uppercase text-slate-100 truncate italic tracking-tight">
        {h.title || "PRODUTO SINC"}
      </h3>
      <div className="flex items-center gap-3">
        <span className="text-[8px] text-white/40 font-black uppercase tracking-[0.2em]">
          {getTimeAgo(new Date(h.timestamp).getTime())}
        </span>
        <div className="w-1 h-1 bg-white/10 rounded-full" />
        <span className="text-[8px] font-black uppercase tracking-widest text-accent/60">
          {h.platform?.toUpperCase() || "SINC"}
        </span>
      </div>
    </div>
  </div>

  <motion.button
    whileHover={{
      backgroundColor: "rgba(239, 68, 68, 0.2)",
      scale: 1.05
    }}
    whileTap={{ scale: 0.9 }}
    className="w-10 h-10 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400/40 flex items-center justify-center transition-all"
    onClick={() => unblock(h.id)}
  >
    <Unlock size={16} />
  </motion.button>
</motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {step === "video_selection" && (
            <motion.div
              key="video_selection"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
              className="step-wrapper-standard"
            >
              {/* Header Fixo */}
              <div className="p-6 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center">
                    <Video size={24} className="text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black italic uppercase leading-none text-white">
                      POOL DE <span className="text-accent">CRIATIVOS</span>
                    </h2>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">
                      Encontramos {videoResults.length} vídeos virais
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setStep("shopee")}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Grid de Vídeos - Sem scroll interno para evitar conflito com o wrapper */}
              <div className="grid grid-cols-2 gap-x-5 gap-y-12 px-6 pt-6 pb-96">
                {videoResults.map((v, i) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative w-full h-[320px] rounded-[2.5rem] overflow-hidden border-2 transition-all cursor-pointer shadow-[0_30px_60px_rgba(0,0,0,0.6)] group ${i === 0 ? 'border-accent ring-8 ring-accent/10' : 'border-white/10 hover:border-accent/60'}`}
                  >
                    <div 
                      className="absolute inset-0 z-0 cursor-pointer"
                      onClick={() => setVideoToPreview(v)}
                    >
                      <img 
                        src={v.cover} 
                        alt={v.title} 
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-slate-950" />
                      
                      {/* Ícone de Play central para indicar Preview */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-xl border-2 border-white/30 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                            <Play size={28} fill="currentColor" className="text-white ml-1" />
                          </div>
                          <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-white/20 shadow-xl">
                            Visualizar
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {i === 0 && (
                      <div className="absolute top-4 left-4 z-10 pointer-events-none">
                        <div className="bg-accent text-slate-950 text-[8px] font-black uppercase px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xl shadow-accent/50">
                          <Zap size={10} fill="currentColor" />
                          TOP RECOMENDADO
                        </div>
                      </div>
                    )}

                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-black/80 backdrop-blur-md text-white font-black text-[9px] px-2.5 py-1.5 rounded-xl border border-white/20">
                        {v.duration}s
                      </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3 bg-gradient-to-t from-black via-black/80 to-transparent pt-10 z-10 pointer-events-none">
                       <div className="flex flex-col">
                        <p className="text-[11px] font-black text-white uppercase italic truncate drop-shadow-2xl">
                          @{v.author}
                        </p>
                        <p className="text-[8px] text-white/50 font-bold truncate line-clamp-1 opacity-90">
                          {v.title || "VÍDEO VIRAL"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/15">
                        <div className="flex items-center gap-1.5">
                          <Activity size={12} className="text-accent" />
                          <span className="text-[10px] font-black text-accent drop-shadow-lg">
                            {Math.floor(v._score || 0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-white/80">
                           <span className="text-[10px] font-black drop-shadow-lg">
                            {v.views > 1000000 ? `${(v.views/1000000).toFixed(1)}M` : v.views > 1000 ? `${(v.views/1000).toFixed(1)}K` : v.views} PV
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm z-20">
                      <button 
                        onClick={(e) => { e.stopPropagation(); selectVideoFromPool(v, i); }}
                        className="w-[140px] py-3 bg-accent text-slate-950 text-[10px] font-black uppercase rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Check size={14} />
                        Selecionar
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setVideoToPreview(v); }}
                        className="w-[140px] py-3 bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase rounded-2xl shadow-xl active:scale-95 transition-all backdrop-blur-md flex items-center justify-center gap-2"
                      >
                        <Play size={14} fill="currentColor" />
                        Visualizar
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

            </motion.div>
          )}

          {step === "shopee" && (
            <div className="step-wrapper-standard">
              <ShopeeHub 
                onShowToast={showToast} 
                userStoreSlug={storeSlug} 
                userShopeeId={userShopeeId}
                onSaveHistory={saveToSupabase}
                shopeeHubProducts={shopeeHubProducts}
                setShopeeHubProducts={setShopeeHubProducts}
                shopeeHubKeyword={shopeeHubKeyword}
                setShopeeHubKeyword={setShopeeHubKeyword}
                shopeeHubTab={shopeeHubTab}
                setShopeeHubTab={setShopeeHubTab}
                onViralize={(p, videoType) => {
                  console.log("[ShopeeHub onViralize] produto:", p, "videoType:", videoType);
                  const prodData = {
                    ...p,
                    title: p.item_name || p.title || p.name,
                    query: p.query || p.item_name || p.title || p.name,
                  };
                  setPendingAutomationMode(videoType === 'autoral_auto' ? 'custom' : 'original');
                  showToast("🔍 Buscando melhores criativos...");
                  researchTikTok(prodData, "shopee", true);
                }}
              />
            </div>
          )}
      </main>

      {/* Proteção Global de Acesso */}
      {!hasAccessToPlatform && step !== "home" && step !== "plans" && (
        <div className="fixed inset-0 z-[600] flex flex-col items-center justify-center bg-slate-950/98 backdrop-blur-3xl p-8 text-center">
          <div className="relative mb-12">
            <div className="absolute inset-0 blur-[100px] bg-accent/30 rounded-full" />
            <div className="w-24 h-24 rounded-[2.5rem] bg-slate-900 border-2 border-accent/20 flex items-center justify-center relative shadow-2xl overflow-hidden">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="absolute inset-0 opacity-10"
              >
                <div className="w-full h-full border-4 border-dashed border-accent rounded-full" />
              </motion.div>
              <Shield size={48} className="text-accent animate-pulse" />
            </div>
          </div>
          <div className="space-y-4 max-w-md">
            <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none italic">
              SQUAD_LOCK_ACTIVE
            </h2>
            <p className="text-[10px] text-accent uppercase font-black tracking-[0.4em] animate-pulse">
              Acesso Restrito: Membros PRO ou Trial Ativo
            </p>
            <p className="text-slate-400 text-sm leading-relaxed">
              Detectamos que seu período de teste expirou ou sua assinatura não
              está ativa. Ative agora para continuar usando o Motor Viral V6.
            </p>
          </div>
          <div className="flex flex-col gap-4 w-full max-w-xs mt-12">
            <button
              onClick={handleUpgradeToPro}
              className="w-full py-5 bg-gradient-to-r from-accent to-emerald-400 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              ATIVAR ACESSO PRO AGORA
            </button>
            <button
              onClick={() => setStep("home")}
              className="text-[10px] text-slate-500 font-bold uppercase tracking-widest hover:text-white transition-colors"
            >
              VOLTAR PARA INÍCIO
            </button>
          </div>
        </div>
      )}

      {/* Global Workflow HUD - Fixed to Bottom avoid layout shifting */}
      {step === "video_selection" && (
        <div className="fixed bottom-[110px] left-6 right-6 z-[2000] pointer-events-none">
          <div className="bg-slate-950/98 backdrop-blur-3xl border border-accent/40 px-6 py-4 rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,1)] flex items-center justify-between pointer-events-auto ring-1 ring-white/5">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Sparkles size={20} className="text-accent animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white uppercase italic tracking-tighter leading-none opacity-60">Workflow em Execução</span>
                <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em] mt-1.5 leading-none">
                  {pendingAutomationMode === 'custom' ? 'AUTORAL (IA PROFISSIONAL)' : 'VIRAL (ORIGINAL)'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-accent/10 text-accent text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border border-accent/10">
                Aguardando Seleção
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="bottom-nav">
        {[
          {
            id: "bio",
            label: "1. LOJA",
            icon: ShoppingBag,
            active: step === "bio",
          },
          {
            id: "home",
            label: "2. INÍCIO",
            icon: Home,
            active: step === "home",
          },
          {
            id: "shopee",
            label: "3. SHOPEE",
            icon: Zap,
            active: step === "shopee",
          },
          {
            id: "history",
            label: "4. CLOUD",
            icon: Database,
            active: step === "history",
          },
        ].map((tab) => {
          const isConfigured = isStoreConfigured();
          const isLocked = tab.id !== "bio" && !isConfigured;

          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.85 }}
              onClick={() => {
                if (isLocked) {
                  showToast("⚠️ CONFIGURE SUA LOJA PRIMEIRO!");
                  setStep("bio");
                  return;
                }
                if (tab.id === "list" && !activeItems.length) {
                  startScouting();
                } else {
                  setStep(tab.id as any);
                }
              }}
              className={`nav-item ${tab.active ? "active" : ""} ${isLocked ? "opacity-30 grayscale" : ""}`}
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
                  <tab.icon
                    size={22}
                    className={tab.active ? "text-accent" : "text-slate-500"}
                  />
                )}
              </div>
              <span
                className={`text-[9px] font-black uppercase tracking-widest ${tab.active ? "text-accent" : "text-slate-500"}`}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </nav>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-24 left-1/2 px-8 py-4 bg-slate-900/95 backdrop-blur-3xl text-accent rounded-[2rem] min-w-[320px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-[500] border border-white/10"
          >
            <div className="flex items-center gap-4 justify-between">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
                <div className="w-2 h-2 bg-accent rounded-full animate-ping" />
              </div>
              <span className="text-[10px] font-black italic uppercase tracking-[0.25em] text-white flex-1">
                {toast}
              </span>
              <div className="w-2 h-2 bg-white/10 rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <a ref={downloadLinkRef} style={{ display: "none" }} />

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
                    <h3 className="text-xl font-black italic tracking-tighter uppercase text-white">
                      VÍDEO PRONTO! 🔥
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      Sua máquina de vendas foi gerada
                    </p>
                  </div>

                  <div className="flex flex-col w-full gap-3 pb-4">
                    <motion.button
                      whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={triggerDownload}
                      disabled={isPreparingDownload}
                      className={`w-full py-5 font-black uppercase italic tracking-[0.3em] rounded-2xl flex items-center justify-center gap-3 transition-all z-[310] ${
                        isPreparingDownload
                          ? "bg-slate-700 text-slate-400 cursor-wait"
                          : "bg-gradient-to-r from-accent to-emerald-400 text-slate-950 shadow-[0_10px_40px_rgba(6,182,212,0.4)] hover:shadow-[0_15px_60px_#06b6d4] active:scale-[0.98] animate-pulse"
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
            className="fixed inset-0 z-[5000] flex flex-col items-center justify-center bg-slate-950/98 backdrop-blur-3xl px-6 text-center overflow-hidden"
          >
            {/* Background Tech Ornaments */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_70%)]" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            </div>

            <div className="relative z-10 w-full max-w-md flex flex-col items-center">
              {/* Neural Core Animation */}
              <div className="relative mb-10">
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  className="w-40 h-40 rounded-full border border-accent/30 border-t-accent/60 shadow-[0_0_80px_rgba(6,182,212,0.2)] flex items-center justify-center"
                >
                   <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                    className="absolute inset-2 rounded-full border border-dashed border-emerald-500/20"
                  />
                  <div className="w-24 h-24 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/5 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-accent/10 to-transparent" />
                    <Cpu size={40} className="text-accent animate-pulse relative z-10" />
                  </div>
                </motion.div>
                
                {/* Orbital Status */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  className="absolute -inset-4 pointer-events-none"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-accent rounded-full shadow-[0_0_15px_#06b6d4]" />
                </motion.div>
              </div>

              {/* Status HUD */}
              <div className="space-y-1 mb-8">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white flex items-center justify-center gap-3">
                  NEURAL <span className="text-accent">HUB</span>
                </h2>
                <div className="flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                  <span className="flex items-center gap-1"><div className="w-1 h-1 bg-emerald-500 rounded-full" /> GPU ACTIVE</span>
                  <span className="flex items-center gap-1"><div className="w-1 h-1 bg-accent rounded-full animate-ping" /> SYNCING</span>
                </div>
              </div>

              {/* Progress System */}
              <div className="w-full bg-slate-900/50 border border-white/5 rounded-3xl p-6 mb-6 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-accent/50" />
                
                <div className="flex justify-between items-end mb-4 pr-1">
                  <div className="text-left">
                    <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1 italic">Processamento em Tempo Real</p>
                    <p className="text-xs font-bold text-white uppercase italic">
                      {treatingProgress < 30 ? "Iniciando Motores..." : 
                       treatingProgress < 60 ? "Injetando Transições..." : 
                       treatingProgress < 90 ? "Sincronizando Áudio IA..." : "Finalizando Master..."}
                    </p>
                  </div>
                  <span className="text-2xl font-black italic text-accent tabular-nums">{treatingProgress}%</span>
                </div>

                <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <motion.div
                    className="h-full bg-gradient-to-r from-accent via-cyan-400 to-emerald-400 rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${treatingProgress}%` }}
                    transition={{ type: "spring", damping: 20 }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-[shimmer_2s_infinite]" />
                  </motion.div>
                </div>
              </div>

              {/* Console Logs */}
              <div className="w-full bg-black/60 rounded-2xl border border-white/5 p-4 font-mono text-[9px] text-left space-y-2 mb-8 relative">
                <div className="absolute top-2 right-3 flex gap-1">
                  <div className="w-1 h-1 bg-red-500/50 rounded-full" />
                  <div className="w-1 h-1 bg-yellow-500/50 rounded-full" />
                  <div className="w-1 h-1 bg-emerald-500/50 rounded-full" />
                </div>
                
                <div className="space-y-1.5 opacity-60">
                  <p className="text-accent flex items-center gap-2">
                    <span className="opacity-30">[{new Date().toLocaleTimeString()}]</span>
                    <span className="font-bold">&gt;</span> SYSTEM: BOOTING NEURAL_ENGINE_V4
                  </p>
                  <p className="text-white/80 flex items-center gap-2">
                    <span className="opacity-30">[{new Date().toLocaleTimeString()}]</span>
                    <span className="font-bold">&gt;</span> AUTH: SHAP-API-KEY CONNECTED
                  </p>
                  {treatingProgress > 20 && (
                    <motion.p initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-emerald-400/80 flex items-center gap-2">
                      <span className="opacity-30">[{new Date().toLocaleTimeString()}]</span>
                      <span className="font-bold">&gt;</span> RENDER: APPLYING CINEMATIC_TRANSITIONS
                    </motion.p>
                  )}
                  {treatingProgress > 50 && (
                    <motion.p initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-accent/80 flex items-center gap-2">
                      <span className="opacity-30">[{new Date().toLocaleTimeString()}]</span>
                      <span className="font-bold">&gt;</span> AUDIO: INJECTING AI_VOICE_OVER (LATENCY: 12ms)
                    </motion.p>
                  )}
                  {treatingProgress > 80 && (
                    <motion.p initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-yellow-400/80 flex items-center gap-2">
                      <span className="opacity-30">[{new Date().toLocaleTimeString()}]</span>
                      <span className="font-bold">&gt;</span> FINAL: SYNCING METADATA_BUF
                    </motion.p>
                  )}
                  <motion.p 
                    animate={{ opacity: [0, 1] }} 
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="text-accent font-bold"
                  >
                    _
                  </motion.p>
                </div>
              </div>

              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] italic">
                Não feche o app. A inteligência está lapidando seu viral.
              </p>
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
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2">
              VÍDEO BAIXADO!
            </h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-8">
              Agora é só subir no TikTok/Shopee e lucrar! 🚀
            </p>
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
        {videoToPreview && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-10"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-[400px] h-full max-h-[750px] bg-slate-900 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl flex flex-col"
            >
              <div className="absolute inset-0 flex items-center justify-center z-0">
                <RefreshCcw size={40} className="text-accent/20 animate-spin" />
              </div>

              <video 
                key={videoToPreview.id}
                src={`https://vzydpqilvyjqjbhzgzhq.supabase.co/functions/v1/video-proxy?url=${encodeURIComponent(videoToPreview.originalUrl)}`}
                className="relative w-full h-full object-cover z-10"
                controls
                autoPlay
                loop
                playsInline
                onError={(e) => {
                  const target = e.target as HTMLVideoElement;
                  if (target.src.includes('video-proxy')) {
                    console.log('Proxy failed, trying direct link...');
                    target.src = videoToPreview.originalUrl;
                  }
                }}
              />
              
              <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                  <p className="text-[10px] font-black text-white uppercase italic truncate max-w-[150px]">
                    @{videoToPreview.author}
                  </p>
                </div>
                <button 
                  onClick={() => setVideoToPreview(null)}
                  className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="absolute bottom-10 left-6 right-6 z-10">
                <button 
                  onClick={() => {
                    const video = videoToPreview;
                    setVideoToPreview(null);
                    selectVideoFromPool(video, 0); 
                  }}
                  className="w-full py-5 bg-accent text-slate-950 font-black uppercase tracking-widest text-[12px] rounded-2xl shadow-2xl shadow-accent/40 active:scale-95 transition-all"
                >
                  USAR ESTE VÍDEO NO V6
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCheckoutOpen && (
          <CheckoutOverlay
            isCheckoutOpen={isCheckoutOpen}
            setIsCheckoutOpen={setIsCheckoutOpen}
            checkoutUrl={checkoutUrl}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;



