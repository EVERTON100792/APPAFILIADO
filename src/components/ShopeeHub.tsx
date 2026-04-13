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
            className="fixed inset-0 z-[1000] bg-slate-950 flex items-center justify-center p-2 overflow-hidden"
          >
            <div className="w-full h-full max-w-2xl bg-slate-950 border-0 rounded-3xl p-4 shadow-2xl relative flex flex-col">
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
                <div className="flex flex-col gap-4 flex-1">
                  {/* Preview Title */}
                  <div className="flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="text-lg font-black italic text-metallic uppercase tracking-tighter">Criativo Pronto</h3>
                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em]">30s • Preview</p>
                    </div>
                    <button 
                      onClick={() => setIsGeneratingVideo(false)}
                      className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Music & Sound Options */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setShowMusicPicker(true)}
                      className="flex-1 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center gap-1 text-[9px] font-black uppercase text-emerald-400"
                    >
                      <Video size={12} /> Música
                    </button>
                    <button
                      onClick={() => setIsMutedVideo(!isMutedVideo)}
                      className={`h-8 px-3 rounded-lg flex items-center justify-center gap-1 text-[9px] font-black uppercase ${isMutedVideo ? 'bg-red-500/20 border border-red-500/30 text-red-400' : 'bg-white/5 border border-white/10 text-white/60'}`}
                    >
                      {isMutedVideo ? <VolumeX size={12} /> : <Volume2 size={12} />}
                      {isMutedVideo ? 'Sem' : 'Som'}
                    </button>
                  </div>

                  {/* Video Preview - Full Screen */}
                  <div className="flex-1 min-h-[300px] rounded-2xl overflow-hidden bg-slate-950 border border-white/10 relative flex items-center justify-center">
                    {videoPreviewUrl ? (
                      <video 
                        src={videoPreviewUrl}
                        autoPlay loop playsInline controls
                        className="w-full h-full object-contain max-h-[55vh]"
                      />
                    ) : (
                      <video 
                        src={URL.createObjectURL(generatedVideo.blob)}
                        autoPlay loop playsInline controls
                        className="w-full h-full object-contain max-h-[55vh]"
                      />
                    )}
                  </div>

                  {/* Action Buttons - Compact */}
                  <div className="grid grid-cols-2 gap-2 shrink-0">
                    <button
                      onClick={() => {
                        copyToClipboard(generatedVideo.copy.tiktokCaption + "\n\n" + generatedVideo.copy.hashtags.join(" "));
                        downloadVideo(generatedVideo.blob, `video-viral-tiktok.mp4`);
                        onShowToast("🚀 AGORA É SÓ POSTAR NO TIKTOK!");
                      }}
                      className="h-12 bg-white text-slate-950 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-lg"
                    >
                      <Download size={16} strokeWidth={3} /> TikTok
                    </button>
                    <button
                      onClick={() => {
                        copyToClipboard(generatedVideo.copy.shopeeCaption + "\n\n" + generatedVideo.copy.hashtags.join(" "));
                        downloadVideo(generatedVideo.blob, `video-viral-shopee.mp4`);
                        onShowToast("🛍️ LINK COPIADO!");
                      }}
                      className="h-12 bg-orange-500 text-white rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-wider hover:bg-orange-400 transition-all shadow-lg"
                    >
                      <Rocket size={16} strokeWidth={3} /> Shopee
                    </button>
                  </div>

                  <button
                    onClick={() => handleCreateAuthoralVideo(productDetailRef.current)}
                    className="w-full h-10 border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest transition-all shrink-0"
                  >
                    <RefreshCw size={12} /> Nova Versão
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

      {/* Music Picker Modal */}
      <AnimatePresence>
        {showMusicPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-4 max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-lg font-black text-white uppercase">Escolha a Música</h3>
                <button onClick={() => setShowMusicPicker(false)} className="text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex gap-2 mb-3 shrink-0">
                <button
                  onClick={() => {
                    setSelectedMusic(null);
                    setShowMusicPicker(false);
                  }}
                  className="flex-1 h-9 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase text-white/60"
                >
                  Aleatória
                </button>
                <button
                  onClick={() => {
                    setIsMutedVideo(true);
                    setShowMusicPicker(false);
                  }}
                  className="flex-1 h-9 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] font-black uppercase text-red-400"
                >
                  Sem Som
                </button>
              </div>

              <div className="overflow-y-auto space-y-1 flex-1">
                {VIRAL_MUSIC.slice(0, 50).map((music, idx) => (
                  <button
                    key={music.id}
                    onClick={() => {
                      setSelectedMusic(music);
                      setIsMutedVideo(false);
                      setShowMusicPicker(false);
                    }}
                    className={`w-full h-10 px-3 rounded-lg flex items-center justify-between text-left ${
                      selectedMusic?.id === music.id 
                        ? 'bg-emerald-500/20 border border-emerald-500/30' 
                        : 'bg-white/5 border border-transparent hover:bg-white/10'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-white truncate">{music.name}</span>
                    <span className="text-[9px] text-white/40">{music.bpm} BPM</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
