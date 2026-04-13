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
  Upload
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { ShopeeService } from "../services/shopeeService";
import { VideoProcessor } from "../utils/VideoProcessor";
import { Copywriter } from "../utils/Copywriter";
import type { VideoCopy } from "../utils/Copywriter";
import { VIRAL_MUSIC } from "../utils/MusicLibrary";
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

  const videoProcRef = useRef(new VideoProcessor());
  const productDetailRef = useRef<any>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [tempProduct, setTempProduct] = useState<any>(null);
  const [tempImages, setTempImages] = useState<string[]>([]);

  const handleImageSelection = (product: any) => {
    setTempProduct(product);
    setTempImages([]);
    setShowImageModal(true);
  };

  const topDayKeywords = [
    "mais vendidos", "tendencias", "bombando", "viral shopee", "produtos virais", 
    "utilidades domesticas", "gadgets inteligentes", "maquiagem viral", "organização casa",
    "achadinhos shopee", "ofertas do dia", "mais procurados"
  ];
  const topWeekKeywords = [
    "melhores da semana", "mais vendidos semana", "top achadinhos", "favoritos shopee",
    "decoração minimalista", "iterações virais", "beleza e cuidado", "cozinha moderna",
    "tecnologia 2024", "acessórios premium", "moda tendencia"
  ];

  const tabs: {id: TabType, label: string, icon: any}[] = [
    { id: "all", label: "Explorar", icon: Search },
    { id: "top_day", label: "Mais Vendidos", icon: Flame },
    { id: "top_week", label: "Top Semana", icon: Award },
    { id: "lightning", label: "Relâmpago", icon: Zap },
    { id: "50off", label: "50% OFF", icon: CircleDollarSign },
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
  ];

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
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
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // Scroll Lock for Video Generation
  useEffect(() => {
    if (isGeneratingVideo) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isGeneratingVideo]);

  const handleCreateAuthoralVideo = async (product: any) => {
    try {
      setIsGeneratingVideo(true);
      setGeneratedVideo(null);
      setPipelineStep(0);
      setGenStatus("Iniciando Motor...");
      
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
      
      // Extrair TODAS as imagens disponíveis do produto da Shopee API
      // Prioridade: images > image_list > item.images > images do produto original
      const rawImages = 
        detail?.images || 
        detail?.image_list || 
        detail?.item?.images || 
        detail?.data?.images || 
        [];
      
      // Processar todas as imagens encontradas
      if (Array.isArray(rawImages) && rawImages.length > 0) {
        images = rawImages.map((hash: any) => {
          const hashStr = typeof hash === 'string' ? hash : hash?.hash || hash?.url || hash?.image_url || hash;
          return hashStr ? `https://down-br.img.susercontent.com/file/${hashStr}` : null;
        }).filter((url): url is string => url !== null && url !== undefined);
      }
      
      // Se não encontrou imagens da API, usar a imagem principal do produto
      if (images.length === 0 && product.item_image) {
        images.push(product.item_image);
      }
      
      // Se ainda tiver só 1 imagem, tentar buscar mais de outras fontes
      if (images.length === 1) {
        // Tentar buscar imagens do produto original via API
        const allImages = detail?.data?.info?.item?.images || 
                          detail?.info?.item?.images || 
                          [];
        if (Array.isArray(allImages) && allImages.length > 0) {
          const extraImages = allImages.map((h: any) => {
            const hashStr = typeof h === 'string' ? h : h?.hash || h;
            return hashStr ? `https://down-br.img.susercontent.com/file/${hashStr}` : null;
          }).filter((url): url is string => url !== null && url !== undefined);
          images = [...images, ...extraImages];
        }
      }
      
      // Remover duplicatas
      images = [...new Set(images)];
      
      console.log(`[ShopeeHub] Imagens coletadas para vídeo: ${images.length}`, images);

      updateStep(2);
      const copy = Copywriter.generateCopy(product.item_name, `R$ ${product.price}`, activeNiche || 'default');
      
      updateStep(3);
      // Selecionar música aleatória
      const musicIndex = Math.floor(Math.random() * VIRAL_MUSIC.length);
      const music = VIRAL_MUSIC[musicIndex];
      
      updateStep(4);
      
      const allTransitions: ('zoom' | 'glitch' | 'blur' | 'slide' | 'shake' | 'flash' | 'beat' | 'fire' | 'rotate')[] = ['zoom', 'glitch', 'blur', 'slide', 'shake', 'flash', 'beat', 'fire', 'rotate'];
      const allFilters = ['elite', 'ultra8k', 'cinematic', 'bloom', 'glitch'];
      
      const options = {
        filter: allFilters[Math.floor(Math.random() * allFilters.length)],
        transition: 'zoom' as const,
        transitionList: allTransitions,
        legend: "",
        isMuted: false,
        musicUrl: music.url
      };

      const videoBlob = await videoProcRef.current.renderSlideshow(images, options, `R$ ${product.price}`, product.item_name);
      
      setGeneratedVideo({ blob: videoBlob, copy });
      setPipelineStep(5);
      setGenStatus("Vídeo pronto!");
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar vídeo. Tente novamente.");
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
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onShowToast("✅ LEGENDA COPIADA!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Initial load or tab change
  useEffect(() => {
    if (!isLoadingProfile) {
      handleSearch(activeTab === "all" ? keyword : "");
    }
  }, [activeTab, isLoadingProfile]);

  const handleSearch = async (overrideKeyword?: string, forceRefresh = false) => {
    setIsSearching(true);
    // Limpar lista atual para dar feedback imediato de carregamento
    if (forceRefresh || (overrideKeyword === undefined && !keyword)) setProducts([]);

    let searchKeyword = overrideKeyword !== undefined ? overrideKeyword : keyword;
    let sortBy: any = 2; // Default: Sales DESC
    let listType = 0;
    
    // Niche/Pool Selection
    if (activeTab === "top_day") {
      sortBy = 2; // Sales DESC
      if (!searchKeyword) {
        searchKeyword = topDayKeywords[Math.floor(Math.random() * topDayKeywords.length)];
      }
    } else if (activeTab === "top_week") {
      sortBy = 2; // Sales DESC
      if (!searchKeyword) {
        searchKeyword = topWeekKeywords[Math.floor(Math.random() * topWeekKeywords.length)];
      }
    } else if (activeTab === "lightning") {
      searchKeyword = "oferta relampago"; 
      sortBy = 2;
    } else if (activeTab === "50off") {
      searchKeyword = "promoção 50 off";
      sortBy = 2;
    }

    // Random page logic with safety
    const isPredefinedTab = activeTab !== "all";
    const maxPages = isPredefinedTab ? 3 : 10;
    let randomPage = (isPredefinedTab || forceRefresh) ? Math.floor(Math.random() * maxPages) + 1 : 1;

    try {
      console.log(`[ShopeeHub] Tentativa 1: "${searchKeyword}" | Tab: ${activeTab} | Page: ${randomPage}`);
      
      let results = await ShopeeService.searchProducts({ 
        keyword: searchKeyword.trim(),
        sort_by: sortBy,
        page_number: randomPage,
        list_type: listType
      }, userShopeeId || undefined);

      // RETRY LOGIC: Se vier vazio em página alta, tenta página 1
      if (results.length === 0 && randomPage > 1) {
        console.log(`[ShopeeHub] Página ${randomPage} vazia. Tentando fallback para Página 1...`);
        results = await ShopeeService.searchProducts({ 
          keyword: searchKeyword.trim(),
          sort_by: sortBy,
          page_number: 1,
          list_type: listType
        }, userShopeeId || undefined);
      }

      // Final sorting cleanup for rank tabs
      if (activeTab === "top_day" || activeTab === "top_week") {
        results = results.sort((a, b) => (b.sales || 0) - (a.sales || 0));
      }

      setProducts(results);
    } catch (err) {
      console.error("ERRO SHOPEE:", err);
      onShowToast("❌ ERRO NA CONEXÃO COM SHOPEE");
    } finally {
      setIsSearching(false);
    }
  };

  const addToVitrine = async (product: ShopeeProduct) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        onShowToast("⚠️ FAÇA LOGIN PARA ADICIONAR!");
        return;
      }
      const meta = user.user_metadata || {};
      const targetSlug = (meta.store_slug || userStoreSlug || localStorage.getItem("bio_store_slug") || "meu-link").toLowerCase();
      const sanitizedLink = sanitizeShopeeLink(product.product_link, userShopeeId || undefined);

      const { error } = await supabase.from("bio_store").insert({
        user_id: targetSlug, 
        title: product.item_name,
        image_url: product.item_image,
        affiliate_link: sanitizedLink,
        price: (Number(product.price) || 0).toFixed(2)
      });

      if (error) throw error;
      onShowToast("✅ ADICIONADO NA VITRINE!");
    } catch (err) {
      onShowToast("❌ ERRO AO ADICIONAR");
    }
  };

  const shareWhatsApp = async (product: ShopeeProduct) => {
    try {
      const price = (Number(product.price) || 0).toFixed(2);
      const sanitizedLink = sanitizeShopeeLink(product.product_link, userShopeeId || undefined);
      
      const shareTitle = `✨ ACHADINHO SELECIONADO ✨`;
      const message = generateWhatsappMessage({
        title: product.item_name,
        affiliate_link: sanitizedLink,
        price: price
      }, userStoreSlug);

      if (navigator.share) {
        try {
          const response = await fetch(product.item_image);
          const blob = await response.blob();
          const file = new File([blob], 'produto.jpg', { type: 'image/jpeg' });

          await navigator.share({
            title: shareTitle,
            text: message,
            files: [file],
          });
        } catch (err) {
          await navigator.share({
            title: shareTitle,
            text: message,
            url: sanitizedLink
          });
        }
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
      }
    } catch (err) {
      console.error("Erro ao compartilhar:", err);
      const sanitizedLink = sanitizeShopeeLink(product.product_link, userShopeeId || undefined);
      window.open(`https://wa.me/?text=${encodeURIComponent(sanitizedLink)}`, "_blank");
    }
  };

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

      {/* Modern Search Bar */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
            <input
              type="text"
              placeholder="Pesquisar produtos virais..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full h-14 bg-slate-950/80 border border-white/10 rounded-2xl pl-12 pr-14 text-white placeholder:text-white/20 focus:border-emerald-500/50 outline-none font-bold transition-all"
            />
            {keyword && (
              <button 
                onClick={() => { setKeyword(""); handleSearch(""); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => handleSearch(undefined, true)}
            disabled={isSearching}
            className="w-14 h-14 bg-slate-900 border border-white/10 text-emerald-500 rounded-2xl flex items-center justify-center hover:bg-slate-800 hover:border-emerald-500/30 active:scale-95 transition-all shadow-lg"
            title="Atualizar Resultados"
          >
            {isSearching ? <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> : <RotateCcw size={22} />}
          </button>
          <button
            onClick={() => handleSearch()}
            disabled={isSearching}
            className="w-14 h-14 bg-emerald-500 text-slate-950 rounded-2xl flex items-center justify-center hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-emerald-500/10"
          >
            <TrendingUp size={22} />
          </button>
        </div>
      </div>

      {/* Horizontal Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (activeTab === tab.id) {
                // If already active, trigger refresh
                handleSearch(undefined, true);
              } else {
                setActiveTab(tab.id);
              }
            }}
            className={`shrink-0 h-10 px-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all border ${
              activeTab === tab.id
                ? "bg-emerald-500 border-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                : "bg-slate-900/50 border-white/5 text-white/40 hover:border-white/20"
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Niches - Only show in 'Explorar' tab */}
      {activeTab === "all" && (
        <div className="grid grid-cols-4 gap-2">
          {niches.slice(0, 8).map((n) => (
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
              {/* Image & Badges */}
              <div className="aspect-square rounded-xl overflow-hidden relative border border-white/10 bg-slate-950">
                <img
                  src={product.item_image}
                  alt={product.item_name}
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
                
                {/* Commission Badge - Top Left */}
                <div className="absolute top-2 left-2 bg-emerald-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-md shadow-lg z-10 flex items-center gap-1">
                  <Percent size={10} strokeWidth={4} /> {product.commission_rate}%
                </div>

                {/* Discount Badge - Bottom Right */}
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
                    <span className="text-[13px] font-black text-white">
                      R$ {product.price.toFixed(2)}
                    </span>
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                      +R$ {product.commission.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* VIP Actions: VIRAL & AUTORAL */}
                <div className="flex flex-col gap-2 mb-2">
                  <button
                    onClick={() => onViralize?.(product, 'tiktok')}
                    className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
                  >
                    <Rocket size={14} /> VÍDEO VIRAL
                  </button>

                  <button
                    onClick={() => handleImageSelection(product)}
                    className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs transition-all shadow-lg shadow-cyan-500/10 active:scale-95"
                  >
                    <Video size={14} /> VÍDEO AUTORAL
                  </button>
                </div>

                {/* Utilities Row */}
                <div className="flex items-center gap-2 mt-1">
                  <button 
                    onClick={() => addToVitrine(product)}
                    className="flex-1 h-9 bg-slate-950 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-white/40 hover:text-white hover:border-white/20 transition-all"
                    title="Adicionar à Vitrine"
                  >
                    <Plus size={14} /> <span className="text-[8px] font-black uppercase">Loja</span>
                  </button>
                  <button 
                    onClick={() => shareWhatsApp(product)}
                    className="flex-1 h-9 bg-[#25D366]/5 border border-[#25D366]/10 rounded-xl flex items-center justify-center gap-2 text-[#25D366]/60 hover:bg-[#25D366] hover:text-white transition-all shadow-xl"
                  >
                    <MessageCircle size={14} /> <span className="text-[8px] font-black uppercase">Zap</span>
                  </button>
                </div>

                {/* Affiliate Link */}
                <button
                  onClick={() => userShopeeId ? window.open(sanitizeShopeeLink(product.product_link, userShopeeId), "_blank") : setShowSettings(true)}
                  className="w-full h-8 border border-white/5 bg-slate-950/50 rounded-lg mt-1 text-[8px] font-black text-white/30 hover:text-white hover:bg-slate-900 transition-all uppercase flex items-center justify-center gap-1.5"
                >
                  {userShopeeId ? "Abrir Link Original" : "Configurar ID"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {products.length === 0 && !isSearching && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center border border-white/10">
            <ShoppingBag size={24} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest">Nenhum achadinho por aqui...</p>
        </div>
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettings(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black italic text-metallic uppercase leading-tight">Configurações</h3>
                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-1">Identidade de Afiliado</p>
                  </div>
                  <button onClick={() => setShowSettings(false)} className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all"><X size={16} /></button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">ID de Afiliado Shopee</label>
                    <div className="relative">
                      <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input 
                        type="text"
                        placeholder="Ex: 18389670456"
                        defaultValue={userShopeeId || ""}
                        id="shopee_id_input"
                        className="w-full h-14 bg-slate-950 border border-white/10 rounded-xl pl-12 pr-4 text-white font-bold outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      const input = document.getElementById('shopee_id_input') as HTMLInputElement;
                      const val = input.value.trim();
                      if (val) {
                        setUserShopeeId(val);
                        setShowSettings(false);
                        onShowToast("✅ ID ATUALIZADO!");
                      }
                    }}
                    className="btn-premium w-full h-14 text-[11px] shadow-emerald-500/20"
                  >
                    Salvar ID Shopee <CheckCircle2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGeneratingVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-slate-950 flex items-center justify-center p-4 overflow-hidden"
          >
            <div className="w-full max-w-lg bg-slate-950 border border-white/10 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
              {/* Premium Header Decoration */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500" />
              
              {!generatedVideo ? (
                <div className="flex flex-col gap-6 py-4">
                  {/* Viral Squad Styled Header */}
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full border border-dashed border-white/20 flex items-center justify-center animate-[spin_10s_linear_infinite]">
                        <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 backdrop-blur-xl">
                          <RefreshCw className="text-white animate-pulse" size={28} />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Pipeline Viral</span>
                      <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none">
                        Curando o Melhor <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Criativo</span>
                      </h3>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-2 px-8">
                        Processando melhor criativo selecionado...
                      </p>
                    </div>
                  </div>

                  {/* Horizontal Progress Bar */}
                  <div className="flex flex-col gap-2 px-4 mt-4">
                    <div className="flex items-center justify-between text-[11px] font-black tracking-widest uppercase mb-1">
                      <span className="text-white/30">Progresso da Análise</span>
                      <span className="text-white">{Math.min(pipelineStep * 20 + 20, 100)}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(pipelineStep * 20 + 20, 100)}%` }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Boxed Pipeline Steps */}
                  <div className="flex flex-col gap-3 px-2 pt-4">
                    {[
                      { id: 0, label: "Lendo Palavras-chave do Produto" },
                      { id: 1, label: "Consultando Tendências TikTok + Shopee" },
                      { id: 2, label: "Preparando Filtros de Relevância" },
                      { id: 3, label: "Mixando Batida Viral High-Retention" },
                      { id: 4, label: "Renderizando Engine Pro..." }
                    ].map((step, idx) => {
                      const isActive = pipelineStep === idx;
                      const isDone = pipelineStep > idx;
                      
                      return (
                        <div 
                          key={step.id} 
                          className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 ${
                            isDone ? "bg-emerald-500/10 border-emerald-500/20" : 
                            isActive ? "bg-white/5 border-white/20 shadow-lg shadow-black/40" : 
                            "bg-transparent border-white/5 opacity-40 text-white/50"
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            isDone ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : 
                            isActive ? "bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" : 
                            "bg-white/10"
                          }`} />
                          
                          <p className={`text-[11px] font-black uppercase tracking-widest flex-1 ${
                            isDone ? "text-emerald-400" : 
                            isActive ? "text-white" : 
                            ""
                          }`}>
                            {step.label}
                          </p>
                          
                          {isDone && <CheckCircle2 size={14} className="text-emerald-500" />}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col items-center gap-3 pt-4">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em] animate-pulse">IA em Operação...</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Preview Title */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black italic text-metallic uppercase tracking-tighter">Criativo Pronto</h3>
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Qualidade Pro Max • 40s</p>
                    </div>
                    <button 
                      onClick={() => setIsGeneratingVideo(false)}
                      className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-white"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Video Preview */}
                  <div className="aspect-[9/16] max-h-[400px] rounded-[32px] overflow-hidden bg-slate-900 border border-white/10 relative group mx-auto">
                    <video 
                      src={URL.createObjectURL(generatedVideo.blob)}
                      autoPlay loop playsInline controls
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        copyToClipboard(generatedVideo.copy.tiktokCaption + "\n\n" + generatedVideo.copy.hashtags.join(" "));
                        downloadVideo(generatedVideo.blob, `video-viral-tiktok.mp4`);
                        onShowToast("🚀 AGORA É SÓ POSTAR NO TIKTOK!");
                      }}
                      className="h-14 bg-white text-slate-950 rounded-2xl flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-xl shadow-white/5 active:scale-95"
                    >
                      <Download size={18} strokeWidth={3} /> TikTok
                    </button>
                    <button
                      onClick={() => {
                        copyToClipboard(generatedVideo.copy.shopeeCaption + "\n\n" + generatedVideo.copy.hashtags.join(" "));
                        downloadVideo(generatedVideo.blob, `video-viral-shopee.mp4`);
                        onShowToast("🛍️ LINK COPIADO PARA SHOPEE!");
                      }}
                      className="h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-wider hover:bg-orange-400 transition-all shadow-xl shadow-orange-500/10 active:scale-95"
                    >
                      <Rocket size={18} strokeWidth={3} /> Shopee
                    </button>
                  </div>

                  <button
                    onClick={() => handleCreateAuthoralVideo(productDetailRef.current)}
                    className="w-full h-11 border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    <RefreshCw size={14} /> Gerar Outra Versão
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Seleção de Imagens */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black text-white uppercase">Selecione Imagens</h3>
                <button onClick={() => setShowImageModal(false)} className="text-white/40 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <p className="text-sm text-white/60 mb-4">
                Envie fotos do produto para criar um vídeo personalizado. Se preferir, clique em "Criar com Imagens do Produto" para usar as imagens da Shopee.
              </p>

              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                id="modal-image-upload"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    const imageUrls: string[] = [];
                    for (let i = 0; i < files.length; i++) {
                      imageUrls.push(URL.createObjectURL(files[i]));
                    }
                    setTempImages(imageUrls);
                  }
                }}
              />

              <div className="space-y-3">
                <label
                  htmlFor="modal-image-upload"
                  className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold cursor-pointer"
                >
                  <Upload size={20} /> Selecionar do Dispositivo
                </label>

                {tempImages.length > 0 && (
                  <div className="text-center text-green-400 text-sm font-bold">
                    ✅ {tempImages.length} imagens selecionadas
                  </div>
                )}

                <button
                  onClick={() => {
                    if (tempImages.length > 0) {
                      onViralize?.(tempProduct, 'autoral', tempImages);
                      setShowImageModal(false);
                      setTempImages([]);
                    } else {
                      onShowToast("Selecione pelo menos 1 imagem");
                    }
                  }}
                  disabled={tempImages.length === 0}
                  className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-2xl disabled:opacity-50"
                >
                  Criar com Imagens Selecionadas
                </button>

                <button
                  onClick={() => {
                    onViralize?.(tempProduct, 'autoral', []);
                    setShowImageModal(false);
                    setTempImages([]);
                  }}
                  className="w-full h-12 border border-white/20 text-white/60 font-bold rounded-xl hover:bg-white/5"
                >
                  Criar com Imagens do Produto
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
