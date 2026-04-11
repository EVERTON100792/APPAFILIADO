import React, { useState, useEffect } from "react";
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
  Store,
  Clock,
  ChevronRight
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { ShopeeService } from "../services/shopeeService";
import type { ShopeeProduct } from "../services/shopeeService";
import { sanitizeShopeeLink, createUniversalLink } from "../utils/shopeeLinkUtils";
import { generateWhatsappMessage } from "../utils/shareUtils";
import {
  adaptShopeeProductToCampaign,
  type CampaignProduct,
  type CreativeMode,
  type ProductSnapshot,
} from "../utils/shopeeIntelligence";

interface ShopeeHubProps {
  onShowToast: (msg: string) => void;
  userStoreSlug?: string;
  onSelectProduct?: (product: CampaignProduct, mode: CreativeMode) => void;
  onViralize?: (product: any) => void;
  onGoBack?: () => void;
}

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'%3E%3Crect width='160' height='160' rx='24' fill='%23070b16'/%3E%3Crect x='16' y='16' width='128' height='128' rx='22' fill='%2311172a' stroke='%2322c55e' stroke-opacity='.22'/%3E%3Cpath d='M54 102h52' stroke='%2322c55e' stroke-width='8' stroke-linecap='round'/%3E%3Cpath d='M80 52c-11 0-20 9-20 20v9h40v-9c0-11-9-20-20-20Z' fill='none' stroke='%23e5e7eb' stroke-width='8' stroke-linejoin='round'/%3E%3Ccircle cx='80' cy='81' r='6' fill='%2322c55e'/%3E%3C/svg%3E";

type TabType = "all" | "top_day" | "top_week" | "lightning" | "50off";

export const ShopeeHub: React.FC<ShopeeHubProps> = ({ 
  onShowToast, 
  userStoreSlug: propStoreSlug, 
  onSelectProduct, 
  onViralize,
  onGoBack 
}) => {
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [minCommission, setMinCommission] = useState<number>(0);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [products, setProducts] = useState<CampaignProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userShopeeId, setUserShopeeId] = useState<string | null>(null);
  const [userStoreSlug, setUserStoreSlug] = useState<string>(propStoreSlug || "meu-link");
  const [showSettings, setShowSettings] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [activeNiche, setActiveNiche] = useState<string | null>(null);
  const [activeCollection, setActiveCollection] = useState<string>("Todas");

  const [snapshots, setSnapshots] = useState<Record<string, ProductSnapshot>>({});

  const saveSnapshotsToDb = async (nextSnapshots: Record<string, ProductSnapshot>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("product_snapshots")
        .upsert({ 
          user_id: user.id, 
          data: nextSnapshots,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      setSnapshots(nextSnapshots);
    } catch (err) {
      console.error("[ShopeeHub] Erro ao salvar snapshots no Supabase:", err);
    }
  };

  const hydrateProducts = (rawProducts: ShopeeProduct[], searchKeyword: string) => {
    const nextSnapshots: Record<string, ProductSnapshot> = { ...snapshots };

    console.log("[ShopeeHub] hydrateProducts received:", rawProducts.length, "products");

    if (rawProducts.length === 0) {
      setProducts([]);
      return;
    }

    const adapted = rawProducts.map((product) => {
      const key = `${product.shop_id}_${product.item_id}`;
      const previous = snapshots[key];
      const campaignProduct = adaptShopeeProductToCampaign(product, searchKeyword, previous);

      nextSnapshots[key] = {
        price: Number(product.price) || 0,
        commissionRate: Number(product.commission_rate) || 0,
        capturedAt: new Date().toISOString(),
      };

      return campaignProduct;
    });

    saveSnapshotsToDb(nextSnapshots);
    console.log("[ShopeeHub] Setting products:", adapted.length, "collections:", [...new Set(adapted.map(p => p.intelligence?.storeCollection))]);
    setProducts(adapted);
  };

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

  // Fetch user profile, shopee_id, storeSlug and snapshots
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Get profile data primarily from profiles table
          const { data: profile } = await supabase
            .from("profiles")
            .select("store_slug, shopee_id")
            .eq("id", user.id)
            .maybeSingle();
          
          if (profile?.shopee_id) {
            setUserShopeeId(profile.shopee_id);
          }

          const meta = user.user_metadata || {};
          const slug = profile?.store_slug || meta.store_slug || "meu-link";
          setUserStoreSlug(slug.toLowerCase());

          // Load snapshots from DB
          const { data: snapshotData } = await supabase
            .from("product_snapshots")
            .select("data")
            .eq("user_id", user.id)
            .maybeSingle();
          
          if (snapshotData?.data) {
            setSnapshots(snapshotData.data as Record<string, ProductSnapshot>);
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // Initial load or tab change
  useEffect(() => {
    if (!isLoadingProfile) {
      handleSearch(activeTab === "all" ? keyword : "");
    }
  }, [activeTab, isLoadingProfile]);

  const handleSearch = async (overrideKeyword?: string) => {
    setIsSearching(true);
    let searchKeyword = overrideKeyword !== undefined ? overrideKeyword : keyword;
    let sortBy: any = 2;

    if (activeTab === "top_day") {
      sortBy = 3;
      if (!searchKeyword) searchKeyword = "mais vendidos";
    } else if (activeTab === "top_week") {
      sortBy = 3;
      if (!searchKeyword) searchKeyword = "ofertas semana";
    } else if (activeTab === "lightning") {
      searchKeyword = "oferta relampago";
    } else if (activeTab === "50off") {
      if (!searchKeyword) searchKeyword = "ofertas";
    }

    try {
      let results = await ShopeeService.searchProducts({ 
        keyword: searchKeyword.trim(),
        sort_by: sortBy
      }, userShopeeId || undefined);

      if (activeTab === "lightning") {
        if (results.length < 3) {
          const backup = await ShopeeService.searchProducts({ keyword: "oferta relampago", sort_by: 2 }, userShopeeId || undefined);
          results = [...results, ...backup].slice(0, 20);
        }
      }

      if (activeTab === "50off") {
        if (results.length < 3) {
          const backup = await ShopeeService.searchProducts({ keyword: "promoção 50 off", sort_by: 2 }, userShopeeId || undefined);
          results = [...results, ...backup].slice(0, 20);
        }
      }

      if (activeTab === "top_day" || activeTab === "top_week") {
        results = results.sort((a, b) => {
          const scoreA = (a.sales || 1) * (a.commission_rate || 1);
          const scoreB = (b.sales || 1) * (b.commission_rate || 1);
          return scoreB - scoreA;
        });
      }

      hydrateProducts(results, searchKeyword.trim());
      
      if (results.length === 0) {
        onShowToast("❌ NENHUM PRODUTO ENCONTRADO");
      } else {
        if (searchKeyword) onShowToast(`✅ ${results.length} PRODUTOS ENCONTRADOS`);
      }
    } catch (err) {
      console.error("ERRO SHOPEE:", err);
      onShowToast("❌ ERRO NA CONEXÃO COM SHOPEE");
    } finally {
      setIsSearching(false);
    }
  };

  const addToVitrine = async (product: CampaignProduct) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        onShowToast("⚠️ FAÇA LOGIN PARA ADICIONAR!");
        return;
      }

      // IMPORTANTE: Sincronia de Slug - Priorizar fonte mais fresca (prop) depois metadata
      const targetSlug = String(userStoreSlug || user.user_metadata?.store_slug || "meu-link").toLowerCase();

      const sanitizedLink = sanitizeShopeeLink(product.product_link, userShopeeId || undefined);

      const { error } = await supabase.from("bio_store").insert({
        user_id: targetSlug, 
        title: product.item_name,
        image_url: product.item_image,
        affiliate_link: sanitizedLink,
        price: (product.price_value || 0).toFixed(2).replace('.', ','),
        price_before_discount: product.price_before_discount?.toFixed(2).replace('.', ','),
        discount: product.discount
      });

      if (error) throw error;
      onShowToast("✅ ADICIONADO NA VITRINE!");
    } catch (err) {
      onShowToast("❌ ERRO AO ADICIONAR");
    }
  };

  const shareWhatsApp = async (product: CampaignProduct) => {
    try {
      const price = (product.price_value || 0).toFixed(2);
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

  const triggerCreativeFlow = (product: CampaignProduct, mode: CreativeMode) => {
    if (onSelectProduct) {
      onSelectProduct(product, mode);
    } else if (onViralize) {
      onViralize(product);
    } else {
      onShowToast("Fluxo criativo ainda indisponivel nesta tela.");
    }
  };

  const handleSaveSettings = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        onShowToast("Você precisa estar logado!");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        data: { shopee_id: id }
      });

      if (error) throw error;

      setUserShopeeId(id);
      onShowToast("ID Shopee atualizado! 🚀");
      setShowSettings(false);
    } catch (err: any) {
      console.error("[ShopeeHub] Erro ao salvar configs:", err);
      onShowToast("Erro ao salvar: " + err.message);
    }
  };

  const collectionColorMap: Record<string, string> = {
    "Top do Dia": "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    "Impulso": "text-cyan-300 border-cyan-400/20 bg-cyan-400/10",
    "Ticket Premium": "text-amber-300 border-amber-400/20 bg-amber-400/10",
    "Escala": "text-fuchsia-300 border-fuchsia-400/20 bg-fuchsia-400/10",
    "Ofertas Relâmpago": "text-[#EE4D2D] border-[#EE4D2D]/20 bg-[#EE4D2D]/10",
  };

  const collectionOptions = ["Todas", "Ofertas Relâmpago", "Top do Dia", "Impulso", "Ticket Premium", "Escala"];
  
  let visibleProducts: CampaignProduct[] = [];
  
  if (activeCollection === "Todas") {
    visibleProducts = products;
  } else {
    for (const p of products) {
      const col = String(p.intelligence?.storeCollection || "");
      if (activeCollection === "Top do Dia") {
        if (col.toLowerCase().includes("top") || (p.intelligence?.score && p.intelligence.score > 60)) {
          visibleProducts.push(p);
        }
      } else if (activeCollection === "Impulso" && col.toLowerCase().includes("impulso")) {
        visibleProducts.push(p);
      } else if (activeCollection === "Ticket Premium" && col.toLowerCase().includes("ticket")) {
        visibleProducts.push(p);
      } else if (activeCollection === "Escala" && col.toLowerCase().includes("escala")) {
        visibleProducts.push(p);
      } else if (activeCollection === "Ofertas Relâmpago") {
        if (p.discount || (p.price_before_discount && p.price_before_discount > p.price_value)) {
          visibleProducts.push(p);
        } else if (p.intelligence?.score && p.intelligence.score > 80) {
          visibleProducts.push(p);
        }
      }
    }
    if (visibleProducts.length === 0 && products.length > 0) {
      visibleProducts = [...products]
        .sort((a, b) => (b.intelligence?.score || 0) - (a.intelligence?.score || 0))
        .slice(0, 10);
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {onGoBack && (
              <button 
                onClick={onGoBack}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all mr-1"
              >
                <ChevronRight className="rotate-180" size={16} />
              </button>
            )}
            <h2 className="text-3xl font-black italic text-metallic uppercase leading-none tracking-tighter">
              SHOPEE <span className="text-white">HUB</span>
            </h2>
          </div>
          <p className="text-[10px] font-black text-emerald-400/80 tracking-[0.2em] uppercase">
            Ferramentas Pro de Afiliado
          </p>
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
              className="w-full h-14 bg-slate-950/80 border border-white/10 rounded-2xl pl-12 pr-4 text-white placeholder:text-white/20 focus:border-emerald-500/50 outline-none font-bold transition-all"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={isSearching}
            className="w-14 h-14 bg-emerald-500 text-slate-950 rounded-2xl flex items-center justify-center hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-emerald-500/10"
          >
            {isSearching ? <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : <TrendingUp size={22} />}
          </button>
        </div>
      </div>

      {/* Horizontal Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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

      {/* Vitrines Automaticas */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Store size={12} /> Vitrines Automáticas
          </h3>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 pb-1">
          {collectionOptions.map((collection) => (
            <button
              key={collection}
              onClick={() => setActiveCollection(collection)}
              className={`shrink-0 h-8 px-3 rounded-full border text-[8px] font-black uppercase tracking-widest transition-all ${activeCollection === collection ? "bg-white text-slate-950 border-white" : "bg-slate-900/50 border-white/10 text-white/50 hover:text-white hover:border-white/20"}`}
            >
              {collection}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mt-2">
        <h3 className="text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center gap-2 px-1">
          {activeTab === "all" ? (keyword ? `Busca: ${keyword}` : "🔥 Tendências") : tabs.find(t => t.id === activeTab)?.label}
          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
        </h3>
        <span className="text-[8px] font-bold text-white/20 uppercase">{visibleProducts.length} itens</span>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        <AnimatePresence mode="popLayout">
          {visibleProducts.map((product) => {
            const hasDiscount = (product.discount ? true : false) || (product.price_before_discount && product.price_before_discount > product.price_value);
            
            return (
              <motion.div
                layout
                key={`${product.shop_id}_${product.item_id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="tech-card p-2 flex flex-col gap-3 group border-white/5 hover:border-emerald-500/30 transition-all bg-slate-900/20"
              >
                {/* Image & Badges */}
                <div className="aspect-square rounded-xl overflow-hidden relative border border-white/10 bg-slate-950" onClick={() => triggerCreativeFlow(product, "viral")}>
                  <img
                    src={product.item_image}
                    alt={product.item_name}
                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                  />
                  
                  {/* Collection Badge - Top Left */}
                  <div className={`absolute top-1 left-1 text-[7px] font-black px-1.5 py-0.5 rounded border z-10 ${collectionColorMap[product.intelligence?.storeCollection || ""] || "text-white border-white/10 bg-black/40"}`}>
                    {product.intelligence?.storeCollection || "Achadinho"}
                  </div>

                  {/* Commission Badge - Top Right */}
                  <div className="absolute top-1 right-1 bg-emerald-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-md shadow-lg z-10 flex items-center gap-1">
                    <Percent size={10} strokeWidth={4} /> {product.commission_rate}%
                  </div>

                  {/* Discount Badge - Bottom Right */}
                  {hasDiscount && (
                    <div className="absolute bottom-2 right-2 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-lg z-10 animate-pulse">
                      {product.discount || "SALE"}
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
                        R$ {product.price_before_discount?.toFixed(2)}
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-black text-white">
                        R$ {product.price_value?.toFixed(2)}
                      </span>
                      <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                        +R$ {product.commission_value?.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* VIP Action: VIRAL */}
                  <button
                    onClick={() => triggerCreativeFlow(product, "viral")}
                    className="w-full h-10 bg-emerald-500 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 group"
                  >
                    <Rocket size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    VIRAL
                  </button>

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
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {visibleProducts.length === 0 && !isSearching && (
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
                        handleSaveSettings(val);
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
    </div>
  );
};
