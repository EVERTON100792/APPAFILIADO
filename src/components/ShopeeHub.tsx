import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  ShoppingBag, 
  Zap, 
  CheckCircle2, 
  TrendingUp, 
  Percent,
  Settings,
  X,
  MessageCircle,
  Plus,
  Rocket,
  Flame,
  Award,
  CircleDollarSign,
  RotateCcw,
  Video,
  Download,
  RefreshCw,
  Upload,
  Volume2,
  VolumeX,
  Music
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { ShopeeService } from "../services/shopeeService";
import { VideoProcessor } from "../utils/VideoProcessor";
import { Copywriter } from "../utils/Copywriter";
import type { VideoCopy } from "../utils/Copywriter";
import { VIRAL_MUSIC, type ViralMusic } from "../utils/MusicLibrary";
import type { ShopeeProduct } from "../services/shopeeService";
import { sanitizeShopeeLink, createUniversalLink } from "../utils/shopeeLinkUtils";
import { generateWhatsappMessage } from "../utils/shareUtils";

interface ShopeeHubProps {
  onShowToast: (msg: string) => void;
  userStoreSlug?: string;
  onViralize?: (product: any, videoType?: 'tiktok' | 'autoral', customImages?: string[]) => void;
}

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'%3E%3Crect width='160' height='160' rx='24' fill='%23070b16'/%3E%3Crect x='16' y='16' width='128' height='128' rx='22' fill='%2311172a' stroke='%2322c55e' stroke-opacity='.22'/%3E%3Cpath d='M54 102h52' stroke='%2322c55e' stroke-width='8' stroke-linecap='round'/%3E%3Cpath d='M80 52c-11 0-20 9-20 20v9h40v-9c0-11-9-20-20-20Z' fill='none' stroke='%23e5e7eb' stroke-width='8' stroke-linejoin='round'/%3E%3Ccircle cx='80' cy='81' r='6' fill='%2322c55e'/%3E%3C/svg%3E";

type TabType = "all" | "top_day" | "top_week" | "lightning" | "50off";

export const ShopeeHub: React.FC<ShopeeHubProps> = ({ onShowToast, userStoreSlug: propStoreSlug, onViralize }) => {
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [products, setProducts] = useState<ShopeeProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userShopeeId, setUserShopeeId] = useState<string | null>(null);
  const [userStoreSlug, setUserStoreSlug] = useState<string>(propStoreSlug || "meu-link");
  const [showSettings, setShowSettings] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [activeNiche, setActiveNiche] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [genStatus, setGenStatus] = useState("");
  const [generatedVideo, setGeneratedVideo] = useState<{blob: Blob, copy: VideoCopy} | null>(null);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [randomSeed, setRandomSeed] = useState(0);
  const [selectedMusic, setSelectedMusic] = useState<ViralMusic | null>(null);
  const [isMutedVideo, setIsMutedVideo] = useState(false);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  const videoProcRef = useRef(new VideoProcessor());
  const productDetailRef = useRef<any>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [tempProduct, setTempProduct] = useState<any>(null);
  const [tempImages, setTempImages] = useState<string[]>([]);
  const authLockRef = useRef<Promise<any> | null>(null);
  const isMobileRef = useRef(false);
  const lastMusicIndexRef = useRef<number>(-1);

  const getRandomMusic = () => {
    let index: number;
    do {
      index = Math.floor(Math.random() * VIRAL_MUSIC.length);
    } while (index === lastMusicIndexRef.current && VIRAL_MUSIC.length > 1);
    lastMusicIndexRef.current = index;
    return VIRAL_MUSIC[index];
  };

  useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
      isMobileRef.current = /iPhone|iPad|iPod|Android/i.test(ua) || ("ontouchstart" in window);
    };
    checkMobile();
  }, []);

  const safeGetUser = async () => {
    if (authLockRef.current) {
      await authLockRef.current;
    }
    authLockRef.current = supabase.auth.getUser();
    try {
      return await authLockRef.current;
    } finally {
      authLockRef.current = null;
    }
  };

  const handleImageSelection = (product: any) => {
    setTempProduct(product);
    setTempImages([]);
    setShowImageModal(true);
  };

  const lightningKeywords = [
    "oferta relampago", "flash deal shopee", "promoção do dia", "super oferta", "queima de estoque",
    "preços baixos", "oportunidade unica", "desconto progressivo"
  ];
  const off50Keywords = [
    "50% off", "promoção 50%", "metade do preço", "descontão", "liquidação total",
    "outlet shopee", "preço de custo", "especial 50 off"
  ];

  const niches = [
    { id: "cozinha", name: "Cozinha", icon: "🍳", keyword: "cozinha utilidades" },
    { id: "beleza", name: "Beleza", icon: "💄", keyword: "maquiagem skincare" },
    { id: "tech", name: "Tecnologia", icon: "⚡", keyword: "gadgets tecnologicos" },
    { id: "casa", name: "Decoração", icon: "✨", keyword: "decoração casa" },
    { id: "kids", name: "Kids", icon: "🧸", keyword: "brinquedos educativos" },
    { id: "pet", name: "Pet Shop", icon: "🐾", keyword: "pet acessorios" },
    { id: "game", name: "Gamers", icon: "🎮", keyword: "gamer setup" },
    { id: "sport", name: "Esportes", icon: "🏃", keyword: "fitness academia" },
    { id: "moda_f", name: "Moda Fem", icon: "👗", keyword: "moda feminina tendencia" },
    { id: "moda_m", name: "Moda Masc", icon: "👕", keyword: "moda masculina casual" },
    { id: "relogios", name: "Relógios", icon: "⌚", keyword: "relogio luxo" },
    { id: "auto", name: "Auto", icon: "🚗", keyword: "acessorios carro" },
    { id: "ferramentas", name: "Ferramentas", icon: "🛠️", keyword: "ferramentas profissionais" },
    { id: "saude", name: "Saúde", icon: "🧘", keyword: "bem estar saude" },
    { id: "office", name: "Office", icon: "💻", keyword: "home office setup" },
    { id: "papelaria", name: "Papelaria", icon: "✏️", keyword: "papelaria fofa" },
  ];

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await safeGetUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("shopee_id")
            .eq("id", user.id)
            .single();
          
          if (data?.shopee_id) setUserShopeeId(data.shopee_id);
          const meta = user.user_metadata || {};
          const slug = meta.store_slug || localStorage.getItem("bio_store_slug") || "meu-link";
          setUserStoreSlug(slug.toLowerCase());
        }
      } catch (err: any) {
        console.error("Error fetching profile:", err?.message || err);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const handleCreateAuthoralVideo = async (product: any) => {
    try {
      setIsGeneratingVideo(true);
      setGeneratedVideo(null);
      setPipelineStep(0);
      setGenStatus("Iniciando...");
      
      const steps = [
        "Lendo Palavras-chave...",
        "Consultando Tendências...",
        "Preparando Filtros...",
        "Mixando Batida Viral...",
        "Renderizando Criativo Único..."
      ];

      const updateStep = (idx: number) => {
        setPipelineStep(idx);
        setGenStatus(steps[idx]);
      };

      updateStep(0);
      const detail = await ShopeeService.getItemDetail(product.shop_id, product.item_id);
      
      updateStep(1);
      let images: string[] = [];
      const rawImages = detail?.images || detail?.item?.images || detail?.image_list || [];
      if (Array.isArray(rawImages) && rawImages.length > 0) {
        images = rawImages.map((h: any) => `https://down-br.img.susercontent.com/file/${typeof h === 'string' ? h : h.hash || h.url}`);
      }
      if (images.length === 0 && product.item_image) images.push(product.item_image);

      updateStep(2);
      const copy = Copywriter.generateCopy(product.item_name, `R$ ${product.price}`, activeNiche || 'default');
      
      updateStep(3);
      const music = selectedMusic || getRandomMusic();
      
      updateStep(4);
      const allTransitions = ['zoom', 'light_leak', 'glass_shine', 'whip_push', 'mirror_flip', 'pan_cinematic', 'blur', 'slide', 'flash', 'beat', 'split'];
      const allFilters = ['elite', 'ultra8k', 'cinematic', 'bloom', 'neon', 'golden'];
      const shuffledTrans = [...allTransitions].sort(() => Math.random() - 0.5).slice(0, 6) as any[];
      
      const options = {
        filter: allFilters[Math.floor(Math.random() * allFilters.length)],
        transition: shuffledTrans[0] as any,
        transitionList: shuffledTrans,
        legend: "",
        isMuted: isMutedVideo,
        musicUrl: isMutedVideo ? undefined : music.url
      };

      const videoBlob = await videoProcRef.current.renderSlideshow(images, options, `R$ ${product.price}`, product.item_name);
      setVideoPreviewUrl(URL.createObjectURL(videoBlob));
      setGeneratedVideo({ blob: videoBlob, copy });
      setPipelineStep(5);
    } catch (err: any) {
      console.error("Erro ao gerar vídeo:", err);
      onShowToast("❌ ERRO AO GERAR VÍDEO");
      setIsGeneratingVideo(false);
    }
  };

  const downloadVideo = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onShowToast("✅ LEGENDA COPIADA!");
    } catch (err) {
      console.error("Falha ao copiar:", err);
    }
  };

  useEffect(() => {
    if (!isLoadingProfile) {
      handleSearch(activeTab === "all" ? keyword : "");
    }
  }, [activeTab, isLoadingProfile]);

  const handleSearch = async (overrideKeyword?: string, forceRefresh = false) => {
    setIsSearching(true);
    let searchKeyword = overrideKeyword !== undefined ? overrideKeyword : keyword;
    let sortBy: any = 2;
    
    if (activeTab === "lightning") {
      searchKeyword = lightningKeywords[Math.floor(Math.random() * lightningKeywords.length)]; 
      sortBy = 2;
    } else if (activeTab === "50off") {
      searchKeyword = off50Keywords[Math.floor(Math.random() * off50Keywords.length)];
      sortBy = 2;
    } else if (activeTab === "top_day" || activeTab === "top_week") {
      sortBy = 2;
    }

    const maxPages = activeTab !== "all" ? 3 : 10;
    let randomPage = forceRefresh ? Math.floor(Math.random() * maxPages) + 1 : 1;

    try {
      const results = await ShopeeService.searchProducts({ 
        keyword: searchKeyword.trim() || "ofertas",
        sort_by: sortBy,
        page_number: randomPage
      }, userShopeeId || undefined);
      setProducts(results);
    } catch (err) {
      console.error("Erro busca:", err);
      onShowToast("❌ ERRO AO BUSCAR SHOPEE");
    } finally {
      setIsSearching(false);
    }
  };

  const addToVitrine = async (product: ShopeeProduct) => {
    try {
      const { data: { user } } = await safeGetUser();
      if (!user) {
        onShowToast("⚠️ FAÇA LOGIN!");
        return;
      }
      const sanitizedLink = sanitizeShopeeLink(product.product_link, userShopeeId || undefined);
      const { error } = await supabase.from("bio_store").insert({
        user_id: userStoreSlug, 
        title: product.item_name,
        image_url: product.item_image,
        affiliate_link: sanitizedLink,
        price: product.price.toFixed(2)
      });
      if (error) throw error;
      onShowToast("✅ ADICIONADO NA VITRINE!");
    } catch (err) {
      console.error("Erro vitrine:", err);
      onShowToast("❌ ERRO AO ADICIONAR");
    }
  };

  const shareWhatsApp = async (product: ShopeeProduct) => {
    try {
      const sanitizedLink = sanitizeShopeeLink(product.product_link, userShopeeId || undefined);
      const message = generateWhatsappMessage({
        title: product.item_name,
        affiliate_link: sanitizedLink,
        price: product.price.toFixed(2)
      }, userStoreSlug);
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    } catch (err) {
      console.error("Erro share:", err);
    }
  };

  const tabs: {id: TabType, label: string, icon: any}[] = [
    { id: "all", label: "Explorar", icon: Search },
    { id: "top_day", label: "Mais Vendidos", icon: Flame },
    { id: "top_week", label: "Top Semana", icon: Award },
    { id: "lightning", label: "Relâmpago", icon: Zap },
    { id: "50off", label: "50% OFF", icon: CircleDollarSign },
  ];

  return (
    <div className="flex flex-col gap-5 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-3xl font-black italic text-metallic uppercase leading-none tracking-tighter">
            SHOPEE <span className="text-white">HUB</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
            <p className="text-[9px] font-black text-emerald-400/80 tracking-[0.2em] uppercase">Mecanismo de Conversão Pro</p>
          </div>
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-center text-white/60 hover:text-accent hover:border-accent/40 transition-all"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
          <input
            type="text"
            placeholder="Pesquisar produtos virais..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full h-14 bg-slate-950/80 border border-white/10 rounded-2xl pl-12 pr-14 text-white placeholder:text-white/20 outline-none font-bold"
          />
        </div>
        <button
          onClick={() => handleSearch(undefined, true)}
          className="w-14 h-14 bg-slate-900 border border-white/10 text-emerald-500 rounded-2xl flex items-center justify-center hover:bg-slate-800 transition-all"
        >
          {isSearching ? <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> : <RotateCcw size={22} />}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 h-10 px-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all border ${
              activeTab === tab.id ? "bg-emerald-500 border-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-slate-900/50 border-white/5 text-white/40 hover:border-white/20"
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Niches */}
      {activeTab === "all" && (
        <div className="grid grid-cols-4 gap-2 max-h-[280px] overflow-y-auto no-scrollbar pr-1">
          {niches.map((n) => (
            <button
              key={n.id}
              onClick={() => { setKeyword(n.name); handleSearch(n.keyword); }}
              className="h-16 bg-slate-900/40 border border-white/5 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-emerald-500/30 transition-all active:scale-95"
            >
              <span className="text-lg">{n.icon}</span>
              <span className="text-[8px] font-bold text-white/50 uppercase">{n.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between mt-2">
        <h3 className="text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center gap-2">
          {activeTab === "all" ? (keyword ? `Busca: ${keyword}` : "🔥 Tendências") : tabs.find(t => t.id === activeTab)?.label}
          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
        </h3>
        <span className="text-[8px] font-bold text-white/20 uppercase">{products.length} itens</span>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        {products.map((product) => {
          const hasDiscount = product.discount > 0 && product.original_price > product.price;
          return (
            <motion.div
              layout
              key={product.item_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="tech-card p-2 flex flex-col gap-3 group border-white/5 hover:border-emerald-500/30 transition-all bg-slate-900/20"
            >
              <div className="aspect-square rounded-xl overflow-hidden relative border border-white/10 bg-slate-950">
                <img
                  src={product.item_image}
                  alt={product.item_name}
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-2 left-2 bg-emerald-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-md shadow-lg z-10">
                  {product.commission_rate}%
                </div>
                {hasDiscount && (
                  <div className="absolute bottom-2 right-2 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-lg z-10 animate-pulse">
                    {product.discount}% OFF
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-1.5 px-1">
                <h4 className="text-[10px] font-bold text-white/90 line-clamp-2 leading-snug h-7">
                  {product.item_name}
                </h4>
                
                <div className="flex flex-col gap-0.5">
                  {hasDiscount && (
                    <span className="text-[9px] text-white/20 line-through font-bold">
                      R$ {product.original_price.toFixed(2)}
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-black text-white">R$ {product.price.toFixed(2)}</span>
                    <span className="text-[9px] font-black text-emerald-400">+R$ {product.commission.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mb-2">
                  <button onClick={() => onViralize?.(product, 'tiktok')} className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs active:scale-95 transition-all">
                    <Rocket size={14} /> VÍDEO VIRAL
                  </button>
                  <button onClick={() => handleImageSelection(product)} className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs active:scale-95 transition-all">
                    <Video size={14} /> VÍDEO AUTORAL
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <button onClick={() => addToVitrine(product)} className="flex-1 h-9 bg-slate-950 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-white/40 hover:text-white transition-all">
                    <Plus size={14} /> <span className="text-[8px] font-black uppercase">Loja</span>
                  </button>
                  <button onClick={() => shareWhatsApp(product)} className="flex-1 h-9 bg-[#25D366]/5 border border-[#25D366]/10 rounded-xl flex items-center justify-center gap-2 text-[#25D366]/60 hover:text-[#25D366] transition-all">
                    <MessageCircle size={14} /> <span className="text-[8px] font-black uppercase">Zap</span>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {products.length === 0 && !isSearching && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
          <ShoppingBag size={24} />
          <p className="text-[10px] font-black uppercase tracking-widest">Nenhum achadinho por aqui...</p>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettings(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black italic text-white uppercase">Configurações</h3>
                    <p className="text-[8px] font-bold text-white/20 uppercase mt-1">Identidade Afiliado</p>
                  </div>
                  <button onClick={() => setShowSettings(false)} className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-white/40"><X size={16} /></button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">ID de Afiliado Shopee</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 18389670456" 
                      defaultValue={userShopeeId || ""} 
                      id="shopee_id_input"
                      className="w-full h-14 bg-slate-950 border border-white/10 rounded-xl px-4 text-white font-bold outline-none focus:border-emerald-500" 
                    />
                  </div>
                  <button 
                    onClick={() => {
                      const val = (document.getElementById('shopee_id_input') as HTMLInputElement).value.trim();
                      if (val) { setUserShopeeId(val); setShowSettings(false); onShowToast("✅ ID ATUALIZADO!"); }
                    }}
                    className="w-full h-14 bg-emerald-500 text-slate-950 rounded-xl font-black text-xs uppercase"
                  >
                    Salvar ID Shopee
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isGeneratingVideo && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-slate-950 flex items-center justify-center p-2"
          >
            <div className="w-full h-full max-w-2xl bg-slate-950 rounded-3xl p-4 relative flex flex-col">
              {!generatedVideo ? (
                <div className="flex flex-col gap-6 py-4">
                  <div className="flex flex-col items-center text-center gap-4">
                    <RefreshCw className="text-emerald-500 animate-spin" size={32} />
                    <h3 className="text-2xl font-black text-white uppercase">{genStatus}</h3>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(pipelineStep + 1) * 20}%` }} className="h-full bg-emerald-500" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-white uppercase italic">Criativo Pronto</h3>
                    <button onClick={() => setIsGeneratingVideo(false)} className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-white/40"><X size={16} /></button>
                  </div>
                  <div className="flex-1 min-h-[300px] rounded-2xl overflow-hidden bg-slate-950 border border-white/10 relative flex items-center justify-center">
                    <video src={videoPreviewUrl || ""} autoPlay loop playsInline controls className="w-full h-full object-contain max-h-[60vh]" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { copyToClipboard(generatedVideo.copy.tiktokCaption); downloadVideo(generatedVideo.blob, "video.mp4"); }} className="h-12 bg-white text-slate-950 rounded-xl font-black text-[10px] uppercase">TikTok</button>
                    <button onClick={() => { copyToClipboard(generatedVideo.copy.shopeeCaption); downloadVideo(generatedVideo.blob, "video.mp4"); }} className="h-12 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase">Shopee</button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {showImageModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white uppercase">Selecione Imagens</h3>
                <button onClick={() => setShowImageModal(false)}><X size={24} className="text-white/40" /></button>
              </div>
              <input type="file" accept="image/*" multiple id="modal-upload" className="hidden" onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setTempImages(files.map(f => URL.createObjectURL(f)));
              }} />
              <div className="space-y-4">
                <label htmlFor="modal-upload" className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold cursor-pointer"><Upload size={20} /> Carregar Fotos</label>
                <button 
                  onClick={() => { onViralize?.(tempProduct, 'autoral', tempImages); setShowImageModal(false); }}
                  disabled={tempImages.length === 0}
                  className="w-full h-14 bg-emerald-500 text-slate-950 rounded-xl font-black disabled:opacity-50"
                >
                  Criar com {tempImages.length} fotos
                </button>
                <button onClick={() => { onViralize?.(tempProduct, 'autoral', []); setShowImageModal(false); }} className="w-full h-12 border border-white/10 text-white/40 rounded-xl font-bold">Usar fotos da Shopee</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
