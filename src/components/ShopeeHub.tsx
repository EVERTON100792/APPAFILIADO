import React, { useState } from "react";
import { 
  Search, 
  ShoppingBag, 
  Zap, 
  ExternalLink, 
  Copy, 
  CheckCircle2, 
  TrendingUp, 
  Filter,
  DollarSign,
  Percent,
  ArrowRight,
  Settings,
  ChevronRight,
  AlertCircle,
  X,
  MessageCircle,
  Plus,
  Store,
  Clock
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { ShopeeService } from "../services/shopeeService";
import type { ShopeeProduct } from "../services/shopeeService";
import { sanitizeShopeeLink } from "../utils/shopeeLinkUtils";
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
  onGoBack?: () => void;
}

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'%3E%3Crect width='160' height='160' rx='24' fill='%23070b16'/%3E%3Crect x='16' y='16' width='128' height='128' rx='22' fill='%2311172a' stroke='%2322c55e' stroke-opacity='.22'/%3E%3Cpath d='M54 102h52' stroke='%2322c55e' stroke-width='8' stroke-linecap='round'/%3E%3Cpath d='M80 52c-11 0-20 9-20 20v9h40v-9c0-11-9-20-20-20Z' fill='none' stroke='%23e5e7eb' stroke-width='8' stroke-linejoin='round'/%3E%3Ccircle cx='80' cy='81' r='6' fill='%2322c55e'/%3E%3C/svg%3E";

export const ShopeeHub: React.FC<ShopeeHubProps> = ({ onShowToast, userStoreSlug: propStoreSlug, onSelectProduct, onGoBack }) => {
  const [keyword, setKeyword] = useState("");
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

  const niches = [
    { id: "cozinha", name: "Cozinha", icon: "🍳", keyword: "cozinha utilidades" },
    { id: "beleza", name: "Beleza", icon: "💄", keyword: "maquiagem skincare" },
    { id: "tech", name: "Tecnologia", icon: "⚡", keyword: "gadgets tecnologicos" },
    { id: "casa", name: "Decoração", icon: "✨", keyword: "decoração casa" },
    { id: "kids", name: "Kids", icon: "🧸", keyword: "brinquedos educativos" },
    { id: "pet", name: "Pet Shop", icon: "🐾", keyword: "pet acessorios" },
    { id: "game", name: "Gamers", icon: "🎮", keyword: "gamer setup" },
    { id: "sport", name: "Esportes", icon: "🏃", keyword: "fitness academia" },
    { id: "clean", name: "Limpeza", icon: "🧹", keyword: "limpeza inteligente" },
    { id: "stationery", name: "Papelaria", icon: "📒", keyword: "papelaria fofa" }
  ];

  // Fetch user profile, shopee_id, storeSlug and snapshots
  React.useEffect(() => {
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

  React.useEffect(() => {
    if (products.length === 0 && !isLoadingProfile) {
      loadTrending();
    }
  }, [isLoadingProfile]);

  const DEMO_PRODUCTS: CampaignProduct[] = [
    { id: "demo_1", item_id: 1, shop_id: 1, title: "Kit Maquiagem Profissional", item_name: "Kit Maquiagem Profissional 12pcs", price: "R$ 49,90", price_value: 49.9, product_link: "https://shopee.com.br", commission_rate: 20, commission_pct: 20, commission_value: 9.98, sales: "5.2k", sales_value: 5200, query: "maquiagem", url: "https://shopee.com.br", affiliate_link: "https://shopee.com.br?affiliate=1", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400", item_image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400", niche: "Beleza", source: "shopee_api", monitor: { availability: "stable", priceDirection: "steady", commissionDirection: "steady", lastCheckedAt: new Date().toISOString() }, intelligence: { score: 87, scoreLabel: "Muito quente", niche: "Beleza", hook: "Olha esse kit de maquiagem vendendo muito", cta: "Link na bio com meu desconto", recommendation: "Pode escalar agora", storeCollection: "Top do Dia", monitor: { availability: "stable", priceDirection: "steady", commissionDirection: "steady", lastCheckedAt: new Date().toISOString() } }, creative_modes: ["viral", "autoral", "cantado"] },
    { id: "demo_2", item_id: 2, shop_id: 1, title: "AirFryer Sem Óleo 5L", item_name: "Fritadeira Elétrica AirFryer 5L", price: "R$ 159,90", price_value: 159.9, product_link: "https://shopee.com.br", commission_rate: 12, commission_pct: 12, commission_value: 19.18, sales: "8.1k", sales_value: 8100, query: "airfryer", url: "https://shopee.com.br", affiliate_link: "https://shopee.com.br?affiliate=2", image: "https://images.unsplash.com/photo-1589647363585-f4a7c39bc3e3?w=400", item_image: "https://images.unsplash.com/photo-1589647363585-f4a7c39bc3e3?w=400", niche: "Cozinha", source: "shopee_api", monitor: { availability: "stable", priceDirection: "steady", commissionDirection: "steady", lastCheckedAt: new Date().toISOString() }, intelligence: { score: 75, scoreLabel: "Boa aposta", niche: "Cozinha", hook: "AirFryer vendendo muito agora", cta: "Link na bio com meu desconto", recommendation: "Pode escalar agora", storeCollection: "Impulso", monitor: { availability: "stable", priceDirection: "steady", commissionDirection: "steady", lastCheckedAt: new Date().toISOString() } }, creative_modes: ["viral", "autoral", "cantado"] },
    { id: "demo_3", item_id: 3, shop_id: 1, title: "Fone Bluetooth Pro", item_name: "Fone de Ouvido Bluetooth Premium", price: "R$ 89,90", price_value: 89.9, product_link: "https://shopee.com.br", commission_rate: 15, commission_pct: 15, commission_value: 13.48, sales: "3.4k", sales_value: 3400, query: "fone bluetooth", url: "https://shopee.com.br", affiliate_link: "https://shopee.com.br?affiliate=3", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", item_image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", niche: "Tecnologia", source: "shopee_api", monitor: { availability: "stable", priceDirection: "steady", commissionDirection: "steady", lastCheckedAt: new Date().toISOString() }, intelligence: { score: 68, scoreLabel: "Testar rapido", niche: "Tecnologia", hook: "Fone bluetooth vendendo muito", cta: "Link na bio com meu desconto", recommendation: "Testar rapido", storeCollection: "Escala", monitor: { availability: "stable", priceDirection: "steady", commissionDirection: "steady", lastCheckedAt: new Date().toISOString() } }, creative_modes: ["viral", "autoral", "cantado"] },
    { id: "demo_4", item_id: 4, shop_id: 1, title: "Luminária LED Galaxy", item_name: "Luminária Projetor Galaxy Stars", price: "R$ 79,90", price_value: 79.9, product_link: "https://shopee.com.br", commission_rate: 18, commission_pct: 18, commission_value: 14.38, sales: "2.8k", sales_value: 2800, query: "luminaria", url: "https://shopee.com.br", affiliate_link: "https://shopee.com.br?affiliate=4", image: "https://images.unsplash.com/photo-1534234828563-0257de5d859c?w=400", item_image: "https://images.unsplash.com/photo-1534234828563-0257de5d859c?w=400", niche: "Decoração", source: "shopee_api", monitor: { availability: "stable", priceDirection: "steady", commissionDirection: "steady", lastCheckedAt: new Date().toISOString() }, intelligence: { score: 82, scoreLabel: "Boa aposta", niche: "Decoração", hook: "Luminária linda vendendo muito", cta: "Link na bio com meu desconto", recommendation: "Pode escalar agora", storeCollection: "Top do Dia", monitor: { availability: "stable", priceDirection: "steady", commissionDirection: "steady", lastCheckedAt: new Date().toISOString() } }, creative_modes: ["viral", "autoral", "cantado"] },
    { id: "demo_5", item_id: 5, shop_id: 1, title: "Petisco para Cães", item_name: "Petiscos Cães Premium 2kg", price: "R$ 39,90", price_value: 39.9, product_link: "https://shopee.com.br", commission_rate: 22, commission_pct: 22, commission_value: 8.77, sales: "4.1k", sales_value: 4100, query: "racao pet", url: "https://shopee.com.br", affiliate_link: "https://shopee.com.br?affiliate=5", image: "https://images.unsplash.com/photo-1583337130417-3346a1c7d2e9?w=400", item_image: "https://images.unsplash.com/photo-1583337130417-3346a1c7d2e9?w=400", niche: "Pet", source: "shopee_api", monitor: { availability: "stable", priceDirection: "steady", commissionDirection: "steady", lastCheckedAt: new Date().toISOString() }, intelligence: { score: 90, scoreLabel: "Muito quente", niche: "Pet", hook: "Petisco que dogs amam", cta: "Link na bio com meu desconto", recommendation: "Pode escalar agora", storeCollection: "Impulso", monitor: { availability: "stable", priceDirection: "steady", commissionDirection: "steady", lastCheckedAt: new Date().toISOString() } }, creative_modes: ["viral", "autoral", "cantado"] },
    { id: "demo_6", item_id: 6, shop_id: 1, title: "Vitaminas Caps", item_name: "Kit Vitaminas 60 caps", price: "R$ 69,90", price_value: 69.9, product_link: "https://shopee.com.br", commission_rate: 25, commission_pct: 25, commission_value: 17.47, sales: "6.3k", sales_value: 6300, query: "vitaminas", url: "https://shopee.com.br", affiliate_link: "https://shopee.com.br?affiliate=6", image: "https://images.unsplash.com/photo-1579722820308-74e6f5f5dd72?w=400", item_image: "https://images.unsplash.com/photo-1579722820308-74e6f5f5dd72?w=400", niche: "Beleza", source: "shopee_api", monitor: { availability: "stable", priceDirection: "steady", commissionDirection: "steady", lastCheckedAt: new Date().toISOString() }, intelligence: { score: 88, scoreLabel: "Muito quente", niche: "Beleza", hook: "Vitaminas vendendo muito", cta: "Link na bio com meu desconto", recommendation: "Pode escalar agora", storeCollection: "Top do Dia", monitor: { availability: "stable", priceDirection: "steady", commissionDirection: "steady", lastCheckedAt: new Date().toISOString() } }, creative_modes: ["viral", "autoral", "cantado"] },
  ];

  const loadTrending = async () => {
    setIsSearching(true);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), 5000)
    );
    
    try {
      const results = await Promise.race([
        ShopeeService.searchProducts({ keyword: "" }, userShopeeId || undefined),
        timeoutPromise
      ]);
      
      if (results && (results as any[]).length > 0) {
        hydrateProducts(results as any[], "");
      } else {
        console.warn("[ShopeeHub] API retornou vazio, usando demo products");
        setProducts(DEMO_PRODUCTS);
      }
    } catch (err) {
      console.error("Error loading trending:", err);
      console.warn("[ShopeeHub] Usando produtos demo em modo fallback");
      setProducts(DEMO_PRODUCTS);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveSettings = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ shopee_id: id })
        .eq("id", user.id);

      if (error) throw error;

      // ATUALIZAÇÃO CRÍTICA: Salva também no user_metadata para acesso instantâneo em todo o app
      const { error: authError } = await supabase.auth.updateUser({
        data: { shopee_id: id }
      });

      if (authError) console.error("Erro ao atualizar metadata:", authError);
      
      setUserShopeeId(id);
      setShowSettings(false);
      onShowToast("✅ ID SALVO COM SUCESSO!");
      
      // Refresh products with new ID tracking
      if (keyword || products.length > 0) {
        const results = await ShopeeService.searchProducts({ 
          keyword: keyword.trim(),
          min_commission: minCommission > 0 ? minCommission : undefined,
          min_price: minPrice > 0 ? minPrice : undefined
        }, id);
        hydrateProducts(results, keyword.trim());
      }
    } catch (err) {
      onShowToast("❌ ERRO AO SALVAR ID");
    }
  };

  const handleSearch = async (overrideKeyword?: string) => {
    setIsSearching(true);
    const searchKeyword = overrideKeyword || keyword;
    try {
      const results = await ShopeeService.searchProducts({ 
        keyword: searchKeyword.trim(),
        min_commission: minCommission > 0 ? minCommission : undefined,
        min_price: minPrice > 0 ? minPrice : undefined
      }, userShopeeId || undefined);
      hydrateProducts(results, searchKeyword.trim());
      if (results.length === 0) {
        onShowToast("❌ NENHUM PRODUTO ENCONTRADO");
      } else {
        if (searchKeyword) onShowToast(`✅ ${results.length} PRODUTOS ENCONTRADOS`);
      }
    } catch (err: any) {
      console.error("ERRO DETALHADO DA SHOPEE:", err);
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
      console.error("Erro ao adicionar na vitrine:", err);
      onShowToast("❌ ERRO AO ADICIONAR");
    }
  };

  const shareWhatsApp = (product: CampaignProduct) => {
    const price = (product.price_value || 0).toFixed(2).replace('.', ',');
    const sanitizedLink = sanitizeShopeeLink(product.product_link, userShopeeId || undefined);
    
    // Link ISOLADO no topo é o segredo para a foto aparecer no WhatsApp Web/PC
    const message = `${sanitizedLink}
    
🔥 *ACHADINHO ABSURDO!* 🔥

📦 *${product.item_name}*
💰 *Por apenas: R$ ${price}* 💰

👉 *COMPRE AQUI COM MEU LINK:* ${sanitizedLink}

⚠️ *O estoque voa! Aproveite logo!*`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  const openAffiliateLink = (link: string) => {
    const sanitizedLink = sanitizeShopeeLink(link, userShopeeId || undefined);
    window.open(sanitizedLink, "_blank", "noopener,noreferrer");
  };

  const triggerCreativeFlow = (product: CampaignProduct, mode: CreativeMode) => {
    if (!onSelectProduct) {
      onShowToast("Fluxo criativo ainda indisponivel nesta tela.");
      return;
    }

    onSelectProduct(product, mode);
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
        // Filtra por itens com score alto ou que estão na coleção Top
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
        // Filtra por itens que REALMENTE tem desconto vindo da API ou score alto
        if (p.discount || (p.price_before_discount && p.price_before_discount > p.price_value)) {
          visibleProducts.push(p);
        } else if (p.intelligence?.score && p.intelligence.score > 80) {
          visibleProducts.push(p);
        }
      }
    }

    // Se a aba ainda estiver vazia, pegamos os 10 melhores produtos por score como fallback
    if (visibleProducts.length === 0 && products.length > 0) {
      visibleProducts = [...products]
        .sort((a, b) => (b.intelligence?.score || 0) - (a.intelligence?.score || 0))
        .slice(0, 10);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-20">
      {/* Header Section */}
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

      {userShopeeId === null && !isLoadingProfile && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3"
        >
          <AlertCircle className="text-amber-500" size={18} />
          <div className="flex-1">
            <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Configuração Necessária</p>
            <p className="text-[10px] text-white/70">Configure seu ID de Afiliado para ganhar comissões.</p>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="text-[9px] font-black text-amber-500 underline uppercase"
          >
            Configurar
          </button>
        </motion.div>
      )}

      <div className="flex flex-col gap-4">
            {/* Search Controls */}
            <div className="tech-card bg-slate-900/40 border-emerald-500/10">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" size={18} />
                  <input
                    type="text"
                    placeholder="O que vamos vender hoje?"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="w-full h-14 bg-slate-950/50 border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-dim focus:border-accent outline-none font-bold"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50" size={12} />
                    <input
                      type="number"
                      placeholder="Comissão mín %"
                      value={minCommission || ""}
                      onChange={(e) => setMinCommission(Number(e.target.value))}
                      className="w-full h-10 bg-slate-950/30 border border-white/5 rounded-lg pl-8 pr-3 text-[10px] font-bold text-white placeholder:text-white/20 outline-none focus:border-emerald-500/30"
                    />
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50" size={12} />
                    <input
                      type="number"
                      placeholder="Preço mín R$"
                      value={minPrice || ""}
                      onChange={(e) => setMinPrice(Number(e.target.value))}
                      className="w-full h-10 bg-slate-950/30 border border-white/5 rounded-lg pl-8 pr-3 text-[10px] font-bold text-white placeholder:text-white/20 outline-none focus:border-emerald-500/30"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleSearch()}
                  disabled={isSearching}
                  className="btn-premium h-12 text-[11px]"
                >
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Rastrear Produtos <Zap size={14} /></>
                  )}
                </button>
              </div>
            </div>

            {/* Niches Selector */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={12} /> Sugestões de Nicho
                </h3>
              </div>
             <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
                {niches.map((n) => (
                  <motion.button
                    key={n.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setActiveNiche(n.id);
                      setKeyword(n.name);
                      handleSearch(n.keyword);
                    }}
                    className={`shrink-0 px-4 py-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all min-w-[85px] ${
                      activeNiche === n.id
                        ? "bg-accent border-accent text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                        : "bg-slate-900/50 border-white/5 text-white/40 hover:border-white/20"
                    }`}
                  >
                    <span className="text-xl">{n.icon}</span>
                    <span className="text-[9px] font-black uppercase tracking-tight">{n.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Store size={12} /> Vitrines Automaticas
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



            {/* Product Grid Header */}
            <div className="flex items-center justify-between pt-2">
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 px-1">
                {keyword ? `Resultados para "${keyword}"` : "🔥 Tendências do Dia"}
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
              </h3>
              <span className="text-[8px] font-bold text-white/30 uppercase">{visibleProducts.length} itens</span>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 gap-3 min-h-[400px]">
              <AnimatePresence mode="popLayout">
                {visibleProducts.map((product) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    key={product.item_id}
                    onClick={() => triggerCreativeFlow(product, "viral")}
                    className="tech-card p-2 flex flex-col gap-2 group border-white/5 hover:border-accent/20 transition-all cursor-pointer"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden relative border border-white/5 shimmer-effect">
                      <img
                        src={product.item_image}
                        alt={product.item_name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                        }}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {product.discount ? (
                        <div className="absolute top-1 right-1 bg-[#EE4D2D] text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg z-10 animate-pulse">
                          {product.discount} OFF
                        </div>
                      ) : (
                        <div className="absolute top-1 right-1 bg-emerald-500 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg z-10">
                          {product.commission_rate}% COMISSÃO
                        </div>
                      )}
                      <div className={`absolute top-1 left-1 text-[7px] font-black px-1.5 py-0.5 rounded border z-10 ${collectionColorMap[product.intelligence.storeCollection] || "text-white border-white/10 bg-black/40"}`}>
                        {product.intelligence.storeCollection}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1 px-1">
                      <h4 className="text-[10px] font-bold text-white line-clamp-2 leading-tight h-7">
                        {product.item_name}
                      </h4>
                      <div className="flex items-center justify-between gap-2 text-[8px] uppercase font-black tracking-wider mt-0.5">
                        <span className="text-emerald-400">score {product.intelligence.score}</span>
                        <span className={`${product.monitor.availability === "replace" ? "text-red-400" : product.monitor.availability === "monitor" ? "text-amber-300" : "text-cyan-300"}`}>
                          {product.monitor.availability === "replace" ? "trocar" : product.monitor.availability === "monitor" ? "monitorar" : "estavel"}
                        </span>
                      </div>
                      <div className="flex flex-col mt-1">
                        {(product.discount || (product.price_before_discount && product.price_before_discount > product.price_value)) && (
                          <div className="bg-[#EE4D2D] text-white py-0.5 px-2 flex items-center gap-1 mb-1 rounded-sm animate-pulse">
                            <Zap size={10} fill="currentColor" />
                            <span className="text-[8px] font-black uppercase tracking-tighter">Ofertas Relâmpago</span>
                          </div>
                        )}
                        {product.price_before_discount && product.price_before_discount > product.price_value && (
                          <span className="text-[8px] text-white/30 line-through decoration-red-500/50">
                            R$ {product.price_before_discount.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] font-black text-white italic tracking-tighter">
                            {product.price}
                          </span>
                          <span className="text-[9px] font-bold text-accent">
                            +R$ {(Number(product.commission_value) || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <p className="text-[8px] text-white/40 leading-tight min-h-8 mt-1">
                        {product.intelligence.recommendation}
                      </p>

                      <div className="grid grid-cols-3 gap-1.5 mt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerCreativeFlow(product, "viral");
                          }}
                          className="h-8 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-lg shadow-pink-500/30 hover:scale-105 transition-all"
                        >
                          Viral <ArrowRight size={10} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerCreativeFlow(product, "autoral");
                          }}
                          className="h-8 rounded-lg bg-slate-950 border border-white/10 text-white/70 text-[8px] font-black uppercase tracking-wider hover:border-accent/30 hover:text-white transition-all"
                        >
                          Auto
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerCreativeFlow(product, "cantado");
                          }}
                          className="h-8 rounded-lg bg-slate-950 border border-white/10 text-white/70 text-[8px] font-black uppercase tracking-wider hover:border-accent/30 hover:text-white transition-all"
                        >
                          Canta
                        </button>
                      </div>

                      {/* Quick Access Bar inside the card bottom */}
                      <div className="flex items-center gap-2 mt-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); addToVitrine(product); }}
                          className="flex-1 h-8 bg-slate-900 border border-white/10 rounded-lg flex items-center justify-center gap-1.5 text-white/50 hover:text-accent hover:border-accent/40 transition-all"
                        >
                          <Plus size={12} /> <span className="text-[8px] font-black uppercase">Vitrine</span>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); shareWhatsApp(product); }}
                          className="flex-1 h-8 bg-[#25D366]/10 border border-[#25D366]/20 rounded-lg flex items-center justify-center gap-1.5 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all"
                        >
                          <MessageCircle size={12} /> <span className="text-[8px] font-black uppercase">Whats</span>
                        </button>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (userShopeeId) openAffiliateLink(product.product_link);
                          else setShowSettings(true);
                        }}
                        className={`w-full h-8 border rounded-lg mt-2 text-[8px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                          userShopeeId 
                            ? "bg-slate-950 border-white/5 hover:bg-emerald-500 hover:text-slate-950" 
                            : "bg-slate-950/50 border-white/5 text-white/20 cursor-not-allowed"
                        }`}
                      >
                        {userShopeeId ? "Link Afiliado" : "Configure ID"} {userShopeeId ? <ExternalLink size={10} /> : <Copy size={10} />}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black italic text-metallic uppercase">Configurações</h3>
                  <button onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">ID de Afiliado Shopee</label>
                    <div className="relative">
                      <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input 
                        type="text"
                        placeholder="Ex: 18389670456"
                        defaultValue={userShopeeId || ""}
                        id="shopee_id_input"
                        className="w-full h-14 bg-slate-950 border border-white/10 rounded-xl pl-12 pr-4 text-white font-bold outline-none focus:border-accent"
                      />
                    </div>
                    <p className="text-[8px] text-white/40 leading-relaxed italic">
                      * Encontre seu ID no portal de afiliados Shopee em "Configurações da Conta".
                    </p>
                  </div>

                  <button 
                    onClick={() => {
                      const input = document.getElementById('shopee_id_input') as HTMLInputElement;
                      handleSaveSettings(input.value);
                    }}
                    className="btn-premium w-full h-12 text-[11px]"
                  >
                    Salvar Configurações <CheckCircle2 size={16} />
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
