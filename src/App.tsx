import React, { useState, useEffect } from 'react';
import './index.css';
import { 
  Zap, 
  Video, 
  ArrowRight,
  ArrowLeft,
  Download,
  Share2,
  CheckCircle2,
  Activity,
  Home,
  Search,
  User,
  LayoutGrid,
  Copy,
  Terminal as TerminalIcon,
  RefreshCcw
} from 'lucide-react';
import { motion as _motion, AnimatePresence as _AnimatePresence } from 'framer-motion';

const motion = _motion as any;
const AnimatePresence = _AnimatePresence as any;

const App: React.FC = () => {
  const [step, setStep] = useState('idle'); // idle, scouting, list, tiktok, ready
  const [productList, setProductList] = useState<any[]>([]); 
  const [activeItems, setActiveItems] = useState<any[]>([]); 
  const [publishedIds, setPublishedIds] = useState<number[]>([]); 
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [videoData, setVideoData] = useState<any>(null);
  const [customCopy, setCustomCopy] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Persistence: Load on Mount
  useEffect(() => {
    const savedStep = localStorage.getItem('viral-app-step');
    const savedProducts = localStorage.getItem('viral-app-products');
    const savedActive = localStorage.getItem('viral-app-active');
    const savedPublished = localStorage.getItem('viral-app-published');
    const savedSelected = localStorage.getItem('viral-app-selected');
    const savedVideo = localStorage.getItem('viral-app-video');
    const savedCopy = localStorage.getItem('viral-app-copy');

    if (savedStep) setStep(savedStep || 'idle');
    if (savedProducts) setProductList(JSON.parse(savedProducts));
    if (savedActive) setActiveItems(JSON.parse(savedActive));
    if (savedPublished) setPublishedIds(JSON.parse(savedPublished));
    if (savedSelected && savedSelected !== 'null') setSelectedProduct(JSON.parse(savedSelected));
    if (savedVideo && savedVideo !== 'null') setVideoData(JSON.parse(savedVideo));
    if (savedCopy) setCustomCopy(savedCopy);
  }, []);

  // Persistence: Save on Change
  useEffect(() => {
    localStorage.setItem('viral-app-step', step);
    localStorage.setItem('viral-app-products', JSON.stringify(productList));
    localStorage.setItem('viral-app-active', JSON.stringify(activeItems));
    localStorage.setItem('viral-app-published', JSON.stringify(publishedIds));
    localStorage.setItem('viral-app-selected', JSON.stringify(selectedProduct));
    localStorage.setItem('viral-app-video', JSON.stringify(videoData));
    localStorage.setItem('viral-app-copy', customCopy);
  }, [step, productList, activeItems, publishedIds, selectedProduct, videoData, customCopy]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const startScouting = () => {
    setStep('scouting');
    setSelectedProduct(null);
    setVideoData(null);
    
    setTimeout(() => {
      const items = [
        { id: 1, title: "ESPREMEDOR DE ALHO PRO", price: "R$ 47,90", commission: "18%", sales: "5.4k+", viralScore: "98%", query: "espremedor de alho shopee brasil achadinhos viral" },
        { id: 2, title: "CORTADOR DE LEGUMES 5 EM 1", price: "R$ 89,90", commission: "15%", sales: "2.1k+", viralScore: "95%", query: "cortador de legumes shopee brasil review viral" },
        { id: 3, title: "ORGANIZADOR DE GELADEIRA", price: "R$ 34,50", commission: "20%", sales: "8.9k+", viralScore: "92%", query: "organizador de geladeira shopee brasil aesthetic" },
        { id: 4, title: "MINI PROCESSADOR ELÉTRICO", price: "R$ 59,00", commission: "12%", sales: "10k+", viralScore: "99%", query: "mini processador eletrico shopee brasil viral" },
        { id: 5, title: "KIT POTES HERMÉTICOS", price: "R$ 120,00", commission: "10%", sales: "1.2k+", viralScore: "88%", query: "potes hermeticos shopee brasil cozinha" },
        { id: 6, title: "AFIADOR DE FACAS X-SHARP", price: "R$ 29,90", commission: "25%", sales: "3.5k+", viralScore: "94%", query: "afiador de facas shopee brasil utilidade" },
        { id: 7, title: "DISPENSER DE DETERGENTE", price: "R$ 25,00", commission: "15%", sales: "15k+", viralScore: "97%", query: "dispenser de detergente shopee brasil organizacao" },
        { id: 8, title: "MOP DE LIMPEZA TRIANGULAR", price: "R$ 78,00", commission: "14%", sales: "4.2k+", viralScore: "91%", query: "mop triangular shopee brasil limpeza" },
        { id: 9, title: "TAPETE DE PIA ABSORVENTE", price: "R$ 22,90", commission: "18%", sales: "6.7k+", viralScore: "90%", query: "tapete absorvente pia shopee brasil" },
        { id: 10, title: "MÁQUINA DE VÁCUO PORTÁTIL", price: "R$ 115,00", commission: "12%", sales: "900+", viralScore: "85%", query: "seladora a vacuo shopee brasil utilidade" },
        { id: 11, title: "Fatiador 14 em 1 Multifuncional", price: "R$ 55,00", commission: "15%", sales: "3k+", viralScore: "96%", query: "fatiador 14 em 1 shopee brasil funcional" },
        { id: 12, title: "Escova de Limpeza Elétrica", price: "R$ 89,00", commission: "12%", sales: "1.5k+", viralScore: "93%", query: "escova limpeza eletrica shopee brasil viral" },
        { id: 13, title: "Suporte de Faca Magnético", price: "R$ 29,00", commission: "20%", sales: "800+", viralScore: "89%", query: "suporte faca magnetico shopee brasil cozinha" },
        { id: 14, title: "Moedor de Pimenta Elétrico", price: "R$ 45,00", commission: "18%", sales: "4k+", viralScore: "95%", query: "moedor pimenta eletrico shopee brasil" },
        { id: 15, title: "Lixeira com Sensor 12L", price: "R$ 145,00", commission: "10%", sales: "2k+", viralScore: "91%", query: "lixeira sensor shopee brasil viral" },
        { id: 16, title: "Medidor Digital de Cozinha", price: "R$ 38,00", commission: "15%", sales: "5k+", viralScore: "94%", query: "balanca medidor digital shopee brasil" },
        { id: 17, title: "Cortador de Ervas Circular", price: "R$ 19,00", commission: "25%", sales: "1.1k+", viralScore: "87%", query: "cortador ervas shopee brasil cozinha" },
        { id: 18, title: "Seladora de Sacos Portátil", price: "R$ 15,00", commission: "30%", sales: "12k+", viralScore: "98%", query: "seladora sacos portatil shopee brasil" },
        { id: 19, title: "Tapete de Silicone Microondas", price: "R$ 22,00", commission: "15%", sales: "3.2k+", viralScore: "82%", query: "tapete silicone microondas shopee brasil" },
        { id: 20, title: "Cesto de Fritura Flexível", price: "R$ 28,00", commission: "20%", sales: "6k+", viralScore: "90%", query: "cesto fritura flexivel shopee brasil" }
      ];
      
      setProductList(items);
      const filtered = items.filter(it => !publishedIds.includes(it.id));
      const shuffled = [...filtered].sort(() => 0.5 - Math.random());
      setActiveItems(shuffled.slice(0, 5));
      setStep('list');
    }, 1500);
  };

  const markAsPublished = (id: number) => {
    const newPublished = [...publishedIds, id];
    setPublishedIds(newPublished);
    
    const updatedActive = activeItems.filter(it => it.id !== id);
    const available = productList.filter(it => 
      !newPublished.includes(it.id) && 
      !updatedActive.some(active => active.id === it.id)
    );
    
    if (available.length > 0) {
      const replacement = available[Math.floor(Math.random() * available.length)];
      setActiveItems([...updatedActive, replacement]);
      showToast("REGISTRO FINALIZADO ✅");
    } else {
      setActiveItems(updatedActive);
      showToast("POOL ESGOTADO");
    }
  };

  const selectProduct = (product: any) => {
    setSelectedProduct(product);
    setCustomCopy('');
    researchTikTok(product);
  };

  const researchTikTok = async (product: any) => {
    setStep('tiktok');
    try {
      const response = await fetch(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(product.query)}&count=10&cursor=0`);
      const data = await response.json();
      
      if (data.data && data.data.videos && data.data.videos.length > 0) {
        const viralVideo = data.data.videos.sort((a: any, b: any) => (b.play_count || 0) - (a.play_count || 0))[0];
        setVideoData({ ...viralVideo, downloadUrl: viralVideo.hdplay || viralVideo.play });
      } else {
        setVideoData({ title: `Trends: ${product.title}`, downloadUrl: "https://www.tikwm.com/video/media/play/7200000000000000000.mp4" });
      }
    } catch (error) {
       console.error("Erro ao buscar TikTok:", error);
    }
    setTimeout(() => setStep('ready'), 1500);
  };

  const handleDeepLink = (url: string, fallback: string) => {
    window.location.href = url;
    setTimeout(() => { window.location.href = fallback; }, 2500);
  };

  const handleCopy = () => {
    const text = customCopy || getDefaultCopy(selectedProduct);
    navigator.clipboard.writeText(text).then(() => showToast("CONTEÚDO COPIADO ✨"));
  };

  const handleDownload = () => {
    if (videoData?.downloadUrl) {
      window.open(videoData.downloadUrl, '_blank');
    }
  };

  const getDefaultCopy = (product: any) => {
    if (!product) return "";
    const shortTitle = product.title.length > 35 ? product.title.substring(0, 32) + "..." : product.title;
    const hooks = [
      `😱 ECONOMIZE TEMPO: ${shortTitle}!`,
      `🔥 ALERTA VIRAL: ${shortTitle}!`,
      `✨ Chega de sofrer! ${shortTitle} nota 10!`,
      `💸 PROMO: ${shortTitle} por ${product.price}!`,
      `🛑 VOCÊ PRECISA: ${shortTitle} agora!`
    ];
    const CTA = "Bio! 🛒👇"; 
    const hashtags = ["shopee", "achadinhos", "dicas", "casa", "viral", "brasil", "promo"];
    const index = (product.id || 0) % hooks.length;
    let base = `${hooks[index]}\n📦 Link na ${CTA}\n\n`;
    let tagsStr = hashtags.map(t => `#${t}`).join(' ');
    const final = (base + tagsStr).trim();
    return final.length > 150 ? final.substring(0, 147) + "..." : final;
  };

  return (
    <div className="app-container">
      {/* OPERATION MONITOR (HEADER) */}
      <header>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black border border-[#1a1a1a]">
            <Zap size={20} className="text-[#FF4D00]" />
          </div>
          <div>
            <h1 className="m-0 tracking-tighter">SQUAD<span className="accent-text">01</span></h1>
            <div className="header-status">
              <div className="flex items-center">
                <span className="status-dot active-pulse"></span>
                <span className="text-[7px] text-[#00FF41] tracking-[2px] uppercase font-black">MONITORING_ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6 mt-2 sm:mt-0">
          <div>
            <span className="data-label">ATIVOS</span>
            <span className="data-value">{activeItems.length}</span>
          </div>
          <div className="border-l border-[#1a1a1a] pl-6">
            <span className="data-label">BANCO</span>
            <span className="data-value">{productList.length}</span>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {step === 'idle' && (
          <motion.div 
            key="idle"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="space-y-10 py-4"
          >
            <div className="space-y-6">
              <div className="inline-block px-3 py-1 bg-[#FF4D00]/10 border border-[#FF4D00]/30 rounded-full">
                <span className="text-[8px] text-[#FF4D00] font-black tracking-[0.3em] uppercase">SYSTEM_READY_V2.0</span>
              </div>
              <h1 className="text-[clamp(40px,12vw,56px)] font-black leading-[0.9] tracking-tighter uppercase italic">
                SQUAD<br/><span className="text-[#FF4D00]">VIRAL</span><br/>ACTIVE
              </h1>
              <p className="text-sm text-[#666] leading-relaxed max-w-[90%] border-l-2 border-[#1a1a1a] pl-4">
                Rede neural em prontidão. Analisando o banco de dados global para produtos com alto potencial de conversão e viralização imediata.
              </p>
            </div>
            
            <div className="relative group">
              <div className="absolute inset-0 bg-[#FF4D00] blur-[20px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <button 
                className="btn-premium relative z-10 w-full group overflow-hidden" 
                onClick={startScouting}
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                    INICIALIZAR PROTOCOLO <Zap size={20} className="fill-black" />
                </span>
              </button>
            </div>

            <div className="tech-card !bg-transparent border-[#1a1a1a] p-0 overflow-hidden">
               <div className="bg-[#0d0d0d] p-4 border-b border-[#1a1a1a] flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <Activity size={12} className="text-[#00FF41]" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#888]">MONITOR_DE_SISTEMA</p>
                 </div>
                 <span className="text-[8px] font-bold text-[#333]">#44029-X</span>
               </div>
               <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center text-[10px]">
                     <span className="text-[#666] font-bold">API_CONNECTION</span>
                     <span className="text-[#00FF41] font-black">STABLE_99%</span>
                  </div>
                  <div className="w-full h-1 bg-[#111] rounded-full overflow-hidden">
                     <div className="w-[99%] h-full bg-[#00FF41] shadow-[0_0_10px_#00FF41]"></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] pt-1">
                     <span className="text-[#666] font-bold">PROXY_SHIELD</span>
                     <span className="text-[#FF4D00] font-black">ENCRYPTED</span>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {step === 'scouting' && (
          <motion.div 
            key="scouting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-32 tech-card active h-[60vh]"
          >
            <div className="relative mb-10">
                <div className="absolute inset-0 bg-[#FF4D00] blur-[40px] opacity-20 animate-pulse"></div>
                <Activity size={60} className="text-[#FF4D00] relative z-10 animate-pulse" />
            </div>
            <div className="text-center space-y-3 relative z-10">
              <h1 className="text-4xl font-black tracking-tighter italic grayscale opacity-20">SCANNING...</h1>
              <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                          <div key={i} className={`w-1.5 h-1.5 bg-[#FF4D00] animate-bounce`} style={{ animationDelay: `${i*0.1}s` }}></div>
                      ))}
                  </div>
                  <p className="text-[9px] text-[#666] tracking-[0.5em] font-black uppercase">Interceptando_Dados_Shopee</p>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'list' && (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 pb-20"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="data-label">POOL_DE_PRODUTOS</h2>
                <h1 className="text-3xl">GARIMPO</h1>
              </div>
              <button 
                onClick={startScouting} 
                className="btn-secondary"
              >
                <RefreshCcw size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {activeItems.map((product, idx) => (
                <motion.div 
                  key={product.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="tech-card active group"
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-black border border-[#1a1a1a] flex items-center justify-center shrink-0 relative overflow-hidden">
                       <LayoutGrid size={20} className="text-[#333] group-hover:text-[#FF4D00] transition-colors relative z-10" />
                       <div className="absolute inset-0 bg-gradient-to-tr from-[#FF4D00]/5 to-transparent"></div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="status-dot w-1.5 h-1.5 animate-pulse"></span>
                            <span className="data-label !mb-0 text-[8px]">PROT_SCORE: {product.viralScore}</span>
                        </div>
                        <h3 className="text-[11px] font-black text-white truncate uppercase tracking-tight">{product.title}</h3>
                        
                        <div className="flex gap-4 mt-1">
                           <div className="flex flex-col">
                              <span className="text-[7px] text-[#FF4D00] font-bold uppercase tracking-tighter">COMISSÃO</span>
                              <span className="text-[10px] font-bold text-[#00FF41]">{product.commission}</span>
                           </div>
                           <div className="flex flex-col border-l border-[#1a1a1a] pl-4">
                              <span className="text-[7px] text-[#666] font-bold uppercase tracking-tighter">VENDAS</span>
                              <span className="text-[10px] font-bold">{product.sales}</span>
                           </div>
                        </div>
                    </div>
                    
                    <button 
                      className="w-10 h-10 bg-[#FF4D00] text-black flex items-center justify-center hover:brightness-125 active:scale-90 transition-all shadow-[3px_3px_0px_#9b2f00] active:shadow-none active:translate-y-[3px]"
                      onClick={() => selectProduct(product)}
                    >
                       <ArrowRight size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'tiktok' && (
          <motion.div 
            key="tiktok"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 tech-card active"
          >
            <div className="w-16 h-16 border-b-2 border-[#FF4D00] rounded-full animate-spin mb-6"></div>
            <div className="text-center">
              <h2 className="text-xl uppercase mb-1">INTERCEPTANDO VÍDEO</h2>
              <p className="text-[8px] text-[#666] tracking-[0.3em] font-bold uppercase">HD_STRIM_DECODING...</p>
            </div>
          </motion.div>
        )}

        {step === 'ready' && (
          <motion.div 
            key="ready"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pb-10"
          >
            {/* Header Actions */}
            <div className="flex justify-between items-center bg-[#0d0d0d] p-4 border-b border-[#1a1a1a] -mx-4 -mt-4 mb-6">
                <button 
                  className="btn-secondary flex items-center gap-2 !py-2"
                  onClick={() => setStep('list')}
                >
                    <ArrowLeft size={14} /> VOLTAR
                </button>
                <div className="flex items-center gap-3">
                   <div className="flex flex-col items-end">
                      <span className="text-[7px] text-[#666] font-bold tracking-widest uppercase">SYSTM_STATUS</span>
                      <span className="text-[9px] text-[#00FF41] font-black">ENCRYPTED_READY</span>
                   </div>
                   <span className="status-dot animate-pulse"></span>
                </div>
            </div>

            {/* Product Search Helper - Premium Card */}
            <div className="search-copy-card">
                <div className="flex items-center justify-between gap-4 relative z-10">
                    <div className="flex-1 min-w-0">
                        <span className="text-[8px] text-[#FF4D00] font-black tracking-[0.2em] uppercase mb-1 block">BUSCAR_NA_SHOPEE</span>
                        <p className="text-[13px] font-black text-white truncate uppercase leading-tight">{selectedProduct?.title}</p>
                    </div>
                    <button 
                        className="w-12 h-12 bg-[#FF4D00] text-black flex items-center justify-center hover:brightness-110 active:scale-95 transition-all shadow-[4px_4px_0px_#9b2f00] active:shadow-none active:translate-y-[4px] shrink-0"
                        title="Copiar Nome"
                        onClick={() => {
                            if (selectedProduct) {
                                navigator.clipboard.writeText(selectedProduct.title);
                                showToast('NOME COPIADO!');
                            }
                        }}
                    >
                        <Copy size={20} />
                    </button>
                </div>
            </div>

            {/* Video Canvas Container */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-[-10px]">
                    <Video size={12} className="text-[#FF4D00]" />
                    <span className="data-label !mb-0 text-[8px]">VIDEO_PREVIEW_STREAM</span>
                </div>
                
                <div className="video-preview-container">
                    {videoData?.cover ? (
                        <img 
                            src={videoData.cover} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center text-[#333]">
                            <Activity size={40} className="mb-2 animate-pulse" />
                            <span className="text-[8px] uppercase font-bold tracking-widest">DECODING_MEDIA...</span>
                        </div>
                    )}
                    <div className="absolute top-4 right-4 z-20">
                        <span className="px-3 py-1 bg-black/90 border border-[#FF4D00] text-[7px] font-black text-[#FF4D00] uppercase tracking-widest shadow-xl">1080P_ULTRA_HD</span>
                    </div>
                </div>

                {/* Legend System */}
                <div className="space-y-4 tech-card active relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 opacity-10">
                    <TerminalIcon size={40} />
                  </div>
                  
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#00FF41] rounded-full"></div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-white">COPY_STRATEGY_AUTOGEN</p>
                    </div>
                    <div className="px-2 py-0.5 bg-black border border-[#1a1a1a] text-[8px] font-bold text-[#FF4D00]">
                      {(customCopy || getDefaultCopy(selectedProduct)).length}/150
                    </div>
                  </div>
                  
                  <textarea 
                    className="text-terminal h-24 relative z-10 border-[#1a1a1a] focus:border-[#FF4D00] transition-colors"
                    maxLength={150}
                    placeholder="Gerando cópia persuasiva..."
                    value={customCopy || getDefaultCopy(selectedProduct)}
                    onChange={(e) => setCustomCopy(e.target.value)}
                  />
                  
                  <div className="grid grid-cols-2 gap-3 relative z-10">
                    <button className="btn-secondary flex items-center justify-center gap-2 !py-3 hover:bg-[#111]" onClick={handleDownload}>
                        <Download size={14} className="text-[#FF4D00]" /> BAIXAR
                    </button>
                    <button className="btn-secondary flex items-center justify-center gap-2 !py-3 hover:bg-[#111]" onClick={handleCopy}>
                        <Share2 size={14} className="text-[#FF4D00]" /> COPIAR
                    </button>
                  </div>
                </div>

                {/* Social Launch Grid */}
                <div className="space-y-3">
                    <span className="data-label text-[8px] text-center w-full">LANÇAR_NAS_REDES</span>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            className="h-14 bg-[#EE4D2D] text-white text-[10px] font-black uppercase flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[4px_4px_0px_#9b2f00] active:shadow-none active:translate-y-[4px]" 
                            onClick={() => handleDeepLink('shopee://shopee-video', 'https://shopee.com.br')}
                        >
                            <Zap size={16} /> Shopee
                        </button>
                        <button 
                            className="h-14 bg-white text-black text-[10px] font-black uppercase flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[4px_4px_0px_#ccc] active:shadow-none active:translate-y-[4px]" 
                            onClick={() => handleDeepLink('snssdk1233://video/publish', 'https://tiktok.com')}
                        >
                            <Video size={16} /> TikTok
                        </button>
                    </div>
                </div>

                <div className="pt-6">
                    <button 
                        className="btn-premium"
                        onClick={() => {
                            if (selectedProduct) markAsPublished(selectedProduct.id);
                            setStep('list');
                            showToast('PRODUTO PUBLICADO!');
                        }}
                    >
                        FINALIZAR E PRÓXIMO <CheckCircle2 size={24} />
                    </button>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE NAV (BOTTOM) */}
      <nav className="bottom-nav">
          <button className={`nav-item ${step === 'idle' ? 'active' : ''}`} onClick={() => setStep('idle')}>
             <Home size={18} />
             <span>Hacker</span>
          </button>
          <button className={`nav-item ${step === 'list' || step === 'scouting' ? 'active' : ''}`} onClick={() => { if (activeItems.length > 0) setStep('list'); else startScouting(); }}>
             <Search size={18} />
             <span>Garimpo</span>
          </button>
          <button className="nav-item">
             <LayoutGrid size={18} />
             <span>Status</span>
          </button>
          <button className="nav-item">
             <User size={18} />
             <span>User</span>
          </button>
      </nav>

      {toast && (
        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-24 left-6 right-6 z-50 bg-[#FF4D00] text-black p-4 font-bold text-center text-[10px] uppercase shadow-[0_0_20px_var(--accent-dim)]"
        >
            {toast}
        </motion.div>
      )}
    </div>
  );
};

export default App;
