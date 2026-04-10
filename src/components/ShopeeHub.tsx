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
  Store
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { ShopeeService } from "../services/shopeeService";
import type { ShopeeProduct } from "../services/shopeeService";
import { sanitizeShopeeLink } from "../utils/shopeeLinkUtils";

interface ShopeeHubProps {
  onShowToast: (msg: string) => void;
  userStoreSlug?: string;
}

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'%3E%3Crect width='160' height='160' rx='24' fill='%23070b16'/%3E%3Crect x='16' y='16' width='128' height='128' rx='22' fill='%2311172a' stroke='%2322c55e' stroke-opacity='.22'/%3E%3Cpath d='M54 102h52' stroke='%2322c55e' stroke-width='8' stroke-linecap='round'/%3E%3Cpath d='M80 52c-11 0-20 9-20 20v9h40v-9c0-11-9-20-20-20Z' fill='none' stroke='%23e5e7eb' stroke-width='8' stroke-linejoin='round'/%3E%3Ccircle cx='80' cy='81' r='6' fill='%2322c55e'/%3E%3C/svg%3E";

export const ShopeeHub: React.FC<ShopeeHubProps> = ({ onShowToast, userStoreSlug: propStoreSlug }) => {
  const [keyword, setKeyword] = useState("");
  const [minCommission, setMinCommission] = useState<number>(0);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [products, setProducts] = useState<ShopeeProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userShopeeId, setUserShopeeId] = useState<string | null>(null);
  const [userStoreSlug, setUserStoreSlug] = useState<string>(propStoreSlug || "meu-link");
  const [showSettings, setShowSettings] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [activeNiche, setActiveNiche] = useState<string | null>(null);

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

  // Fetch user profile, shopee_id and storeSlug
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Get shopee_id from profiles
          const { data, error } = await supabase
            .from("profiles")
            .select("shopee_id")
            .eq("id", user.id)
            .single();
          
          if (data?.shopee_id) {
            setUserShopeeId(data.shopee_id);
          }

          // Get storeSlug from metadata or legacy
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

  React.useEffect(() => {
    if (products.length === 0 && !isSearching && !isLoadingProfile) {
      loadTrending();
    }
  }, [isLoadingProfile]);

  const loadTrending = async () => {
    setIsSearching(true);
    try {
      const results = await ShopeeService.searchProducts({ keyword: "" }, userShopeeId || undefined);
      setProducts(results);
    } catch (err) {
      console.error("Error loading trending:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveSettings = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
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
        setProducts(results);
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
      setProducts(results);
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

  const addToVitrine = async (product: ShopeeProduct) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        onShowToast("⚠️ FAÇA LOGIN PARA ADICIONAR!");
        return;
      }

      // IMPORTANTE: Sincronia de Slug - Tentar pegar da fonte mais fresca
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
      console.error("Erro ao adicionar na vitrine:", err);
      onShowToast("❌ ERRO AO ADICIONAR");
    }
  };

  const shareWhatsApp = (product: ShopeeProduct) => {
    const price = (Number(product.price) || 0).toFixed(2);
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

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    onShowToast("Link copiado!");
  };

  return (
    <div className="flex flex-col gap-6 p-4 pb-20">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black italic text-metallic uppercase leading-none tracking-tighter">
            SHOPEE <span className="text-white">HUB</span>
          </h2>
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

            {/* Product Grid Header */}
            <div className="flex items-center justify-between mt-2">
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                {keyword ? `Resultados para "${keyword}"` : "🔥 Tendências do Dia"}
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
              </h3>
              <span className="text-[8px] font-bold text-white/30 uppercase">{products.length} itens</span>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <motion.div
                  layout
                  key={product.item_id}
                  className="tech-card p-2 flex flex-col gap-2 group border-white/5 hover:border-accent/20 transition-all"
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
                    <div className="absolute top-1 right-1 bg-emerald-500 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg z-10">
                      {product.commission_rate}% OFF
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 px-1">
                    <h4 className="text-[10px] font-bold text-white line-clamp-2 leading-tight h-7">
                      {product.item_name}
                    </h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[12px] font-black text-white">
                        R$ {(Number(product.price) || 0).toFixed(2)}
                      </span>
                      <span className="text-[9px] font-bold text-accent">
                        +R$ {(Number(product.commission) || 0).toFixed(2)}
                      </span>
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
                      onClick={() => userShopeeId ? copyLink(product.product_link) : setShowSettings(true)}
                      className={`w-full h-8 border rounded-lg mt-2 text-[8px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                        userShopeeId 
                          ? "bg-slate-950 border-white/5 hover:bg-emerald-500 hover:text-slate-950" 
                          : "bg-slate-950/50 border-white/5 text-white/20 cursor-not-allowed"
                      }`}
                    >
                      {userShopeeId ? "Link Afiliado" : "Configure ID"} <Copy size={10} />
                    </button>
                  </div>
                </motion.div>
              ))}
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
