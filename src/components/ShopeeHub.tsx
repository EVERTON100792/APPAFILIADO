import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  Music,
  ShieldCheck,
  ImagePlus,
  ArrowRight
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { ShopeeService } from "../services/shopeeService";
import { sanitizeShopeeLink } from "../utils/shopeeLinkUtils";
import { generateWhatsappMessage } from "../utils/shareUtils";
import type { ShopeeProduct } from "../services/shopeeService";

interface ShopeeHubProps {
  onShowToast: (msg: string) => void;
  userStoreSlug?: string;
  onViralize?: (product: any, videoType?: 'tiktok' | 'autoral', customImages?: string[]) => void;
  onSaveHistory?: (product: any, platform: string) => void;
}

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'%3E%3Crect width='160' height='160' rx='24' fill='%23070b16'/%3E%3Crect x='16' y='16' width='128' height='128' rx='22' fill='%2311172a' stroke='%2322c55e' stroke-opacity='.22'/%3E%3Cpath d='M54 102h52' stroke='%2322c55e' stroke-width='8' stroke-linecap='round'/%3E%3Cpath d='M80 52c-11 0-20 9-20 20v9h40v-9c0-11-9-20-20-20Z' fill='none' stroke='%23e5e7eb' stroke-width='8' stroke-linejoin='round'/%3E%3Ccircle cx='80' cy='81' r='6' fill='%2322c55e'/%3E%3C/svg%3E";

type TabType = "all" | "top_day" | "top_week" | "lightning" | "50off" | "elite";

const deduplicate = (items: ShopeeProduct[]) => {
  const seenIds = new Set<number>();
  const seenShopPrice = new Set<string>();
  const seenFuzzy = new Set<string>();
  const uniqueItems: ShopeeProduct[] = [];

  for (const item of items) {
    if (seenIds.has(item.item_id)) continue;

    // Mesmo vendedor + mesmo preco = duplicata certa
    const shopPriceKey = `${item.shop_id}-${Math.round(item.price)}`;
    if (seenShopPrice.has(shopPriceKey)) continue;

    // Fuzzy hash (20 chars + preco)
    const fuzzyName = item.item_name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
    const fuzzyHash = `${fuzzyName}-${Math.floor(item.price)}`;
    if (seenFuzzy.has(fuzzyHash)) continue;

    seenIds.add(item.item_id);
    seenShopPrice.add(shopPriceKey);
    seenFuzzy.add(fuzzyHash);
    uniqueItems.push(item);
  }

  return uniqueItems;
};

export const ShopeeHub: React.FC<ShopeeHubProps> = ({ onShowToast, userStoreSlug: propStoreSlug, onViralize, onSaveHistory }) => {
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [products, setProducts] = useState<ShopeeProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userShopeeId, setUserShopeeId] = useState<string | null>(null);
  const [userStoreSlug, setUserStoreSlug] = useState<string>(propStoreSlug || "meu-link");
  const [showSettings, setShowSettings] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isMiniScanning, setIsMiniScanning] = useState(false);
  
  // States para Seletor de Imagens
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [pickerImages, setPickerImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isLoadingPicker, setIsLoadingPicker] = useState(false);
  const [tempProduct, setTempProduct] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States para Radar Elite
  const [isScanningGlobal, setIsScanningGlobal] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 20, niche: "" });

  const niches = [
    { id: "cozinha",   name: "Cozinha",     icon: "🍳", keyword: "utensilios cozinha panela" },
    { id: "beleza",    name: "Beleza",       icon: "💄", keyword: "maquiagem skincare cuidados" },
    { id: "tech",      name: "Tecnologia",   icon: "💻", keyword: "gadgets eletronicos fone" },
    { id: "casa",      name: "Casa",         icon: "🏠", keyword: "decoracao casa almofada" },
    { id: "organizer", name: "Organização",  icon: "📂", keyword: "organizador gaveta guarda roupa" },
    { id: "limpeza",   name: "Limpeza",      icon: "🧹", keyword: "produto limpeza esponja" },
    { id: "setup",     name: "Setup",        icon: "🖥️", keyword: "suporte notebook teclado mouse" },
    { id: "pet",       name: "Pets",         icon: "🐾", keyword: "acessorios cachorro gato petshop" },
    { id: "kids",      name: "Kids",         icon: "🧸", keyword: "brinquedo infantil educativo" },
    { id: "viral",     name: "Achadinhos",   icon: "🔥", keyword: "achado shopee viral" },
    { id: "moda",      name: "Moda",         icon: "👗", keyword: "roupa feminina vestido tendencia" },
    { id: "fitness",   name: "Fitness",      icon: "💪", keyword: "academia treino fitness" },
  ];

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
      } catch (err: any) {
        console.error("Error profile:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!isLoadingProfile) {
      handleSearch(activeTab === "all" ? keyword : "", true);
    }
  }, [activeTab, isLoadingProfile]);

  // ── KEYWORD POOLS ─────────────────────────────────────────────────────────────
  // Cada aba usa 4 keywords buscadas em PARALELO → ~200 produtos antes de filtrar

  const LIGHTNING_KEYWORDS = [
    "promoção relâmpago", "oferta especial shopee",
    "queima estoque", "liquidação shopee",
  ];
  const OFF50_KEYWORDS = [
    "desconto shopee", "liquidação total shopee",
    "mega desconto", "super promoção shopee",
  ];
  const TOP_KEYWORDS = [
    "mais vendidos shopee", "top achadinhos shopee",
    "produto viral shopee", "shopee best seller",
  ];

  // ── HELPER: calcula desconto real usando original_price vs price ─────────────
  const calcDiscount = (p: { price: number; original_price: number; discount: number }): number => {
    // Usar campo discount da API se for razoável (> 0 e <= 99)
    if (p.discount > 0 && p.discount <= 99) return p.discount;
    // Recalcular baseado nos preços quando o campo não é confiável
    if (p.original_price > 0 && p.original_price > p.price) {
      return Math.round((1 - p.price / p.original_price) * 100);
    }
    return 0;
  };

  // ── HELPER: busca múltiplas keywords em paralelo e combina resultados ─────────
  const parallelSearch = async (
    keywords: string[],
    sortBy: number = 3,
    pagesPerKeyword: number = 2
  ) => {
    const requests: Promise<any[]>[] = [];

    keywords.forEach(kw => {
      // Buscar 2 páginas por keyword (p1 + p2) para garantir volume
      for (let page = 1; page <= pagesPerKeyword; page++) {
        requests.push(
          ShopeeService.searchProducts(
            { keyword: kw.trim(), sort_by: sortBy, page_number: page },
            userShopeeId || undefined
          ).catch(() => []) // ignora erros individuais para não quebrar o batch
        );
      }
    });

    const batches = await Promise.all(requests);
    const allItems = ([] as any[]).concat(...batches);
    return deduplicate(allItems);
  };

  const handleSearch = async (overrideKeyword?: string, forceRefresh = false) => {
    setIsSearching(true);
    if (forceRefresh) setProducts([]);

    if (activeTab === "elite" && forceRefresh) {
      setIsSearching(false);
      return;
    }

    if (forceRefresh) {
      setIsMiniScanning(true);
      await new Promise(r => setTimeout(r, 600));
      setIsMiniScanning(false);
    }

    if (activeTab === "elite" && !forceRefresh && products.length === 0) {
      setIsSearching(false);
      return;
    }

    try {
      let finalProducts: any[] = [];

      // ── MODO EXPLORAR (all) ────────────────────────────────────────────────────
      if (activeTab === "all") {
        const searchKw = overrideKeyword !== undefined
          ? (overrideKeyword || "achadinhos shopee")
          : (keyword || "achadinhos shopee");

        // Busca simples em 3 páginas para explorar
        const [p1, p2, p3] = await Promise.all([
          ShopeeService.searchProducts({ keyword: searchKw.trim(), sort_by: 3, page_number: 1 }, userShopeeId || undefined).catch(() => []),
          ShopeeService.searchProducts({ keyword: searchKw.trim(), sort_by: 3, page_number: 2 }, userShopeeId || undefined).catch(() => []),
          ShopeeService.searchProducts({ keyword: searchKw.trim(), sort_by: 2, page_number: 1 }, userShopeeId || undefined).catch(() => []),
        ]);
        finalProducts = deduplicate([...p1, ...p2, ...p3]);
        if (overrideKeyword === undefined) finalProducts = finalProducts.sort(() => Math.random() - 0.5);

      // ── MODO RELÂMPAGO ─────────────────────────────────────────────────────────
      } else if (activeTab === "lightning") {
        // 4 keywords × 2 páginas = 8 chamadas paralelas → ~400 produtos brutos
        finalProducts = await parallelSearch(LIGHTNING_KEYWORDS, 3, 2);

        // Calcular desconto real e filtrar apenas os que têm desconto
        const withRealDiscount = finalProducts
          .map(p => ({ ...p, _disc: calcDiscount(p) }))
          .filter(p => p._disc > 0)
          .sort((a, b) => b._disc - a._disc);

        finalProducts = withRealDiscount.length >= 10
          ? withRealDiscount
          : finalProducts.sort((a, b) => a.price - b.price); // fallback: menor preço

      // ── MODO 50% OFF ───────────────────────────────────────────────────────────
      } else if (activeTab === "50off") {
        // 4 keywords × 2 páginas = ~400 produtos brutos
        finalProducts = await parallelSearch(OFF50_KEYWORDS, 3, 2);

        // Calcular desconto real para todos
        const withCalcDisc = finalProducts.map(p => ({ ...p, _disc: calcDiscount(p) }));

        // Filtro progressivo: 50%+ → 30%+ → 15%+ → ordenar por maior desconto
        const g50 = withCalcDisc.filter(p => p._disc >= 50).sort((a, b) => b._disc - a._disc);
        const g30 = withCalcDisc.filter(p => p._disc >= 30).sort((a, b) => b._disc - a._disc);
        const g15 = withCalcDisc.filter(p => p._disc >= 15).sort((a, b) => b._disc - a._disc);
        const gAny = withCalcDisc.filter(p => p._disc > 0).sort((a, b) => b._disc - a._disc);

        if (g50.length >= 8)       finalProducts = g50;
        else if (g30.length >= 8)  finalProducts = g30;
        else if (g15.length >= 8)  finalProducts = g15;
        else if (gAny.length >= 4) finalProducts = gAny;
        else                        finalProducts = withCalcDisc.sort((a, b) => b._disc - a._disc);

      // ── MODO DESTAQUES / TOP SEMANA ────────────────────────────────────────────
      } else if (activeTab === "top_day" || activeTab === "top_week") {
        // 4 keywords × 2 páginas = ~400 produtos brutos
        finalProducts = await parallelSearch(TOP_KEYWORDS, 3, 2);

        // Ordenar por sales (mais vendidos primeiro)
        finalProducts = finalProducts.sort((a, b) => (b.sales || 0) - (a.sales || 0));
      }

      // ── FALLBACK GLOBAL ────────────────────────────────────────────────────────
      if (finalProducts.length === 0) {
        console.warn('Busca zerou — executando fallback global');
        const fallback = await ShopeeService.searchProducts(
          { keyword: "achadinhos shopee", sort_by: 3, page_number: 1 },
          userShopeeId || undefined
        );
        finalProducts = deduplicate(fallback);
      }

      setProducts(finalProducts);
    } catch (err) {
      console.error("Erro busca:", err);
      onShowToast("⚠️ Erro na conexão Shopee");
    } finally {
      setIsSearching(false);
    }
  };

  const handleImageSelection = async (product: any) => {
    try {
      console.log("🎬 Iniciando Seletor Autoral para:", product.item_name);
      onShowToast("🎬 Abrindo Seletor Autoral...");
      
      setTempProduct(product);
      setIsLoadingPicker(true);
      setShowImagePicker(true);
      setSelectedImages([]);
      
      const detail = await ShopeeService.getItemDetail(product.shop_id, product.item_id);
      let images: string[] = [];
      const rawImages = detail?.item?.images || detail?.images || detail?.image_list || [];
      
      if (Array.isArray(rawImages) && rawImages.length > 0) {
        images = rawImages.map((h: any) => {
          const hash = typeof h === 'string' ? h : h.hash || h.url || h;
          if (hash.startsWith('http')) return hash;
          return `https://down-br.img.susercontent.com/file/${hash}`;
        });
      }
      
      // Se ainda n�o tiver imagens, usar a principal do produto como fallback
      if (images.length === 0 && product.item_image) {
        images = [product.item_image];
      }
      
      setPickerImages(images);
      setSelectedImages(images.length > 0 ? images.slice(0, 5) : []); 
    } catch (err) {
      console.error("Erro images:", err);
      // Fallback em caso de erro na API de detalhe
      if (product.item_image) {
        setPickerImages([product.item_image]);
        setSelectedImages([product.item_image]);
      }
    } finally {
      setIsLoadingPicker(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        onShowToast("⚠️ Arquivo muito grande (Max 5MB)");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPickerImages(prev => [base64, ...prev]);
        setSelectedImages(prev => [base64, ...prev]);
      };
      reader.readAsDataURL(file);
    });
  };

  const runGlobalSpy = async () => {
    setIsScanningGlobal(true);
    setProducts([]);
    
    const allEliteProds: any[] = [];
    const scanNiches = niches.slice(0, 12); 
    const totalNiches = scanNiches.length;
    
    for (let i = 0; i < totalNiches; i++) {
      const niche = scanNiches[i];
      setScanProgress({ current: i + 1, total: totalNiches, niche: niche.name });
      
      try {
        const searchResults = await ShopeeService.searchProducts({ 
          keyword: niche.keyword,
          sort_by: 3 
        }, userShopeeId || undefined);
        
        const elite = searchResults.filter(p => {
          const rate = parseFloat(p.commission_rate?.toString() || "0");
          return rate >= 10;
        });

        allEliteProds.push(...elite);
        setProducts(deduplicate(allEliteProds).slice(0, 50));
        await new Promise(r => setTimeout(r, 400));
      } catch (err) {
        console.warn(`Erro nicho ${niche.name}:`, err);
      }
    }

    setProducts(allEliteProds.slice(0, 50));
    setIsScanningGlobal(false);
    onShowToast("Radar Elite Completo!");
  };

  const addToVitrine = async (product: ShopeeProduct) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { onShowToast("🔒 Faça login primeiro!"); return; }
      const sanitizedLink = sanitizeShopeeLink(product.product_link, userShopeeId || undefined);
      const { error } = await supabase.from("bio_store").insert({
        user_id: userStoreSlug, 
        title: product.item_name,
        image_url: product.item_image,
        affiliate_link: sanitizedLink,
        price: product.price.toFixed(2)
      });
      if (error) throw error;
      onShowToast("? NA VITRINE!");
    } catch (err) {
      onShowToast("? ERRO");
    }
  };

  const shareWhatsApp = async (product: ShopeeProduct) => {
    const sanitizedLink = sanitizeShopeeLink(product.product_link, userShopeeId || undefined);
    const message = generateWhatsappMessage({
      title: product.item_name,
      affiliate_link: sanitizedLink,
      price: product.price.toFixed(2)
    }, userStoreSlug);
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const MatrixScanner = () => {
    if (!isScanningGlobal) return null;
    return createPortal(
      <div className="fixed inset-0 z-[2000] bg-black/90 flex flex-col items-center justify-center p-6 backdrop-blur-xl">
        <div className="relative z-10 w-full max-w-md bg-slate-900/50 border border-green-500/30 p-8 rounded-3xl backdrop-blur-2xl shadow-[0_0_50px_rgba(34,197,94,0.15)] text-center">
          <ShieldCheck className="text-4xl text-green-500 mx-auto mb-6 animate-pulse" size={48} />
          <h2 className="text-2xl font-black text-white mb-2 uppercase">RADAR ELITE 10%</h2>
          <p className="text-green-500 font-mono text-[10px] mb-8 tracking-[0.2em] uppercase">Buscando Lucro Máximo...</p>
          <div className="space-y-6">
            <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <motion.div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
              />
            </div>
            <div className="bg-black/40 border border-green-500/10 rounded-xl p-4 font-mono text-[10px] text-left">
              <div className="text-green-500">PROCESSO: {scanProgress.current}/{scanProgress.total}</div>
              <div className="text-white mt-1 uppercase line-clamp-1">{scanProgress.niche}</div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const tabs: {id: TabType, label: string, icon: any}[] = [
    { id: "all", label: "Explorar", icon: Search },
    { id: "elite", label: "Elite (+10%)", icon: ShieldCheck },
    { id: "top_day", label: "Destaques", icon: Flame },
    { id: "top_week", label: "Top Semana", icon: Award },
    { id: "lightning", label: "Relâmpago", icon: Zap },
    { id: "50off", label: "50% OFF", icon: CircleDollarSign },
  ];

  return (
    <div className="flex flex-col gap-5 p-4 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-3xl font-black italic text-white uppercase leading-none tracking-tighter">
            SHOPEE <span className="text-emerald-500">HUB</span>
          </h2>
          <p className="text-[9px] font-black text-emerald-400/80 tracking-[0.2em] uppercase mt-1">Intelligence Pro Max</p>
        </div>
        <button onClick={() => setShowSettings(true)} className="w-10 h-10 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-center text-white/60">
          <Settings size={20} />
        </button>
      </div>

      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
          <input
            type="text"
            placeholder="O que quer vender hoje?..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full h-14 bg-slate-950/80 border border-white/10 rounded-2xl pl-12 pr-14 text-white font-bold outline-none"
          />
        </div>
        <button onClick={() => handleSearch(undefined, true)} className="w-14 h-14 bg-slate-900 border border-white/10 text-emerald-500 rounded-2xl flex items-center justify-center">
          {isSearching ? <RefreshCw className="animate-spin" size={20} /> : <RotateCcw size={20} />}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 h-10 px-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all border ${
              activeTab === tab.id ? "bg-emerald-500 border-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "bg-slate-900/50 border-white/5 text-white/40"
            }`}
          >
            <tab.icon size={14} /> {tab.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {activeTab === "all" && (
        <div className="grid grid-cols-4 gap-2">
          {niches.map((n) => (
            <button
              key={n.id}
              onClick={() => { setKeyword(n.name); handleSearch(n.keyword); }}
              className="h-16 bg-slate-900/40 border border-white/5 rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95"
            >
              <span className="text-lg">{n.icon}</span>
              <span className="text-[8px] font-bold text-white/50 uppercase truncate w-full px-1 text-center">{n.name}</span>
            </button>
          ))}
        </div>
      )}

      {activeTab === "elite" && products.length === 0 && (
        <div className="flex flex-col gap-4 p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[2.5rem] text-center">
          <ShieldCheck className="text-emerald-400 mx-auto" size={48} />
          <h4 className="text-xl font-black italic text-white uppercase tracking-tighter">Radar Elite +10%</h4>
          <p className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest">Busca automática por comissão máxima</p>
          <button onClick={runGlobalSpy} className="w-full h-16 bg-emerald-500 text-slate-950 font-black italic uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3">
            <Rocket size={20} /> INICIAR RADAR HACKER
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5">
        {products.map((product) => (
          <motion.div layout key={product.item_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tech-card p-2 flex flex-col gap-3 group border-white/5 bg-slate-900/20">
            {/* Imagem clicavel - abre produto na Shopee */}
            <a
              href={`https://shopee.com.br/product/${product.shop_id}/${product.item_id}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="block relative group/img"
            >
              <div className="aspect-square rounded-xl overflow-hidden relative border border-white/10 bg-slate-950">
                <img src={product.item_image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                <div className="absolute top-2 left-2 bg-emerald-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-md">
                  {product.commission_rate}%
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center rounded-xl">
                  <span className="text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <ArrowRight size={12} /> Ver na Shopee
                  </span>
                </div>
              </div>
            </a>
            <div className="flex flex-col gap-1.5 px-1">
              <a href={`https://shopee.com.br/product/${product.shop_id}/${product.item_id}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                <h4 className="text-[10px] font-bold text-white/90 line-clamp-2 leading-snug h-7 hover:text-emerald-400 transition-colors">{product.item_name}</h4>
              </a>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-black text-white">R$ {product.price.toFixed(2)}</span>
                <span className="text-[9px] font-black text-emerald-400">R$ {product.commission.toFixed(2)}</span>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <button onClick={() => onViralize?.(product, 'tiktok')} className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-[10px] uppercase shadow-lg shadow-emerald-500/20">
                  <Rocket size={14} /> VÍDEO VIRAL
                </button>
                <button onClick={() => handleImageSelection(product)} className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-[10px] uppercase shadow-lg shadow-blue-500/20">
                  <Video size={14} /> VÍDEO AUTORAL
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => addToVitrine(product)} className="flex-1 h-9 bg-slate-950 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-white/40"><Plus size={14} /> <span className="text-[8px] font-black uppercase">Loja</span></button>
                <button onClick={() => shareWhatsApp(product)} className="flex-1 h-9 bg-[#25D366]/5 border border-[#25D366]/10 rounded-xl flex items-center justify-center gap-2 text-[#25D366]/60"><MessageCircle size={14} /> <span className="text-[8px] font-black uppercase">Zap</span></button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <MatrixScanner />

      {/* Settings Modal (Portalized) */}
      {createPortal(
        <AnimatePresence>
          {showSettings && (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 relative shadow-2xl"
              >
                <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-white/40"><X size={20} /></button>
                <h3 className="text-xl font-black text-white uppercase mb-6 italic tracking-tight">Configurações</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">ID Parceiro Shopee</label>
                    <input 
                      type="text" 
                      value={userShopeeId || ""} 
                      onChange={(e) => setUserShopeeId(e.target.value)}
                      placeholder="Ex: 123456"
                      className="w-full h-14 bg-slate-950 border border-white/10 rounded-xl px-4 text-white font-bold outline-none focus:border-emerald-500/50 transition-all font-mono"
                    />
                  </div>
                  <button 
                    onClick={async () => {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (user) {
                        await supabase.from("profiles").upsert({ id: user.id, shopee_id: userShopeeId });
                        onShowToast("? Configurações Salvas");
                        setShowSettings(false);
                      }
                    }}
                    className="w-full h-14 bg-emerald-500 text-slate-950 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                  >
                    Salvar Altera��es
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Image Picker Modal (Portalized) */}
      {createPortal(
        <AnimatePresence>
          {showImagePicker && (
            <div className="fixed inset-0 z-[3001] flex flex-col bg-slate-950 overflow-hidden">
              <motion.div 
                initial={{ y: "100%" }} 
                animate={{ y: 0 }} 
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="flex-1 flex flex-col h-full"
              >
                <div className="p-6 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black italic text-white uppercase flex items-center gap-2">
                      <Video size={20} className="text-blue-500" /> SELETOR AUTORAL
                    </h3>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Crie seu vídeo premium</p>
                  </div>
                  <button 
                    onClick={() => setShowImagePicker(false)}
                    className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                  {isLoadingPicker ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                      <RefreshCw className="text-blue-500 animate-spin" size={36} />
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Coletando Imagens do Produto...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <motion.div 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="relative aspect-square rounded-[32px] overflow-hidden border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer group hover:border-blue-500/50 transition-all"
                      >
                        <ImagePlus className="text-blue-500 group-hover:scale-110 transition-transform" size={32} />
                        <span className="text-[10px] font-black text-white/40 uppercase">Minhas Fotos</span>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept="image/*" className="hidden" />
                      </motion.div>

                      {pickerImages.map((img, idx) => {
                        const isSelected = selectedImages.includes(img);
                        return (
                          <motion.div 
                            key={idx}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              if (isSelected) setSelectedImages(prev => prev.filter(i => i !== img));
                              else setSelectedImages(prev => [...prev, img]);
                            }}
                            className={`relative aspect-square rounded-[32px] overflow-hidden border-2 transition-all cursor-pointer ${isSelected ? 'border-blue-500 shadow-xl shadow-blue-500/20' : 'border-white/5'}`}
                          >
                            <img src={img} className="w-full h-full object-cover" alt="" />
                            {isSelected && (
                              <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                                <CheckCircle2 size={32} className="text-white drop-shadow-lg" />
                              </div>
                            )}
                            <div className="absolute bottom-3 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase italic">
                              CENA 0{idx + 1}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-6 bg-slate-900 border-t border-white/10 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setSelectedImages([...pickerImages]);
                        if (onViralize && tempProduct) {
                          onViralize(tempProduct, 'autoral', [...pickerImages]);
                          setShowImagePicker(false);
                        }
                      }}
                      className="flex-1 h-14 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] text-white/60 uppercase hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={14} /> Usar Todas
                    </button>
                    <button 
                      disabled={selectedImages.length === 0}
                      onClick={() => {
                        if (onViralize && tempProduct) {
                          onViralize(tempProduct, 'autoral', selectedImages);
                          setShowImagePicker(false);
                        }
                      }}
                      className={`flex-[2] h-14 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3 transition-all ${selectedImages.length > 0 ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'bg-white/5 text-white/10'}`}
                    >
                      Processar Seleção ({selectedImages.length}) <ArrowRight size={18} />
                    </button>
                  </div>
                  <p className="text-[8px] font-bold text-center text-white/20 uppercase">Selecione as fotos da Shopee ou envie as suas para o vídeo</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
