import React, { useState, useEffect } from 'react';
import './index.css';
import { 
  Zap, Video, ArrowRight, ArrowLeft, Download, Share2, CheckCircle2, 
  Activity, Home, Search, LayoutGrid, Copy, Terminal, RefreshCcw, Unlock, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const [step, setStep] = useState('idle');
  const [productList, setProductList] = useState<any[]>([]); 
  const [activeItems, setActiveItems] = useState<any[]>([]); 
  const [publicationHistory, setPublicationHistory] = useState<{ id: number; timestamp: number }[]>([]); 
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [videoData, setVideoData] = useState<any>(null);
  const [customCopy, setCustomCopy] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [boostMode, setBoostMode] = useState('none');
  const [isBoosting, setIsBoosting] = useState(false);

  // Persistence
  useEffect(() => {
    const saved = {
      step: localStorage.getItem('v-step'),
      products: localStorage.getItem('v-products'),
      history: localStorage.getItem('v-history'),
      active: localStorage.getItem('v-active')
    };
    if (saved.step) setStep(saved.step);
    if (saved.products) setProductList(JSON.parse(saved.products));
    if (saved.history) setPublicationHistory(JSON.parse(saved.history));
    if (saved.active) setActiveItems(JSON.parse(saved.active));
  }, []);

  useEffect(() => {
    localStorage.setItem('v-step', step);
    localStorage.setItem('v-products', JSON.stringify(productList));
    localStorage.setItem('v-history', JSON.stringify(publicationHistory));
    localStorage.setItem('v-active', JSON.stringify(activeItems));
  }, [step, productList, publicationHistory, activeItems]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const startScouting = () => {
    setStep('scouting');
    setTimeout(() => {
      const db = [
        { id: 1, title: "Espremedor de Alho Pro", price: "R$ 47,90", commission: "18%", sales: "5k+", query: "alho viral" },
        { id: 2, title: "Cortador de Legumes 5 em 1", price: "R$ 89,90", commission: "15%", sales: "2k+", query: "legume viral" },
        { id: 3, title: "Organizador de Geladeira", price: "R$ 34,50", commission: "20%", sales: "8k+", query: "geladeira viral" },
        { id: 4, title: "Mini Processador Elétrico", price: "R$ 59,00", commission: "12%", sales: "10k+", query: "mini processador" },
        { id: 5, title: "Kit Potes Herméticos", price: "R$ 120,00", commission: "10%", sales: "1k+", query: "potes cozinha" },
        { id: 6, title: "Afiador de Facas X-Sharp", price: "R$ 29,90", commission: "25%", sales: "3k+", query: "afiador cozinha" },
        { id: 7, title: "Dispenser de Detergente", price: "R$ 25,00", commission: "15%", sales: "15k+", query: "dispenser pia" },
        { id: 8, title: "Mop Triangular de Limpeza", price: "R$ 78,00", commission: "12%", sales: "4k+", query: "mop viral" },
        { id: 9, title: "Tapete de Pia Absorvente", price: "R$ 22,90", commission: "18%", sales: "6k+", query: "tapete pia" },
        { id: 10, title: "Seladora a Vácuo Portátil", price: "R$ 115,00", commission: "12%", sales: "1k+", query: "vacuo viral" }
      ];
      setProductList(db);
      const pubIds = publicationHistory.map(h => h.id);
      const filtered = db.filter(p => !pubIds.includes(p.id));
      setActiveItems(filtered.slice(0, 5));
      setStep('list');
    }, 1500);
  };

  const markAsPublished = (id: number) => {
    const newHistory = [...publicationHistory, { id, timestamp: Date.now() }];
    setPublicationHistory(newHistory);
    const pubIds = newHistory.map(h => h.id);
    const nextAvailable = productList.find(p => !pubIds.includes(p.id) && !activeItems.some(a => a.id === p.id));
    const newActive = activeItems.filter(p => p.id !== id);
    if (nextAvailable) newActive.push(nextAvailable);
    setActiveItems(newActive);
  };

  const unblock = (id: number) => {
    setPublicationHistory(prev => prev.filter(h => h.id !== id));
    showToast("LIBERADO! 🔓");
  };

  const getTimeAgo = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 86400000);
    return diff === 0 ? "Hoje" : `${diff} dias atrás`;
  };

  const updateMode = (mode: string) => {
    setBoostMode(mode);
    if (mode === 'performance') {
      setCustomCopy(`🔥 ÚLTIMAS UNIDADES: ${selectedProduct.title}!\n💸 PROMOÇÃO: ${selectedProduct.price}!\n🛑 Link na Bio! 🛒👇\n#promo #achadinhos #shopee #brasil`);
    } else if (mode === 'funny') {
      setCustomCopy(`🤣 POV: Você não sabia que precisava desse ${selectedProduct.title} até ver esse vídeo!\nO link está na Bio! 🛒👇\n#humor #utilidades #casa #viral`);
    }
  };

  const handleBoost = () => {
    setIsBoosting(true);
    setTimeout(() => {
      setIsBoosting(false);
      showToast("VÍDEO IMPULSIONADO! 🔥");
    }, 2000);
  };

  const researchTikTok = async (product: any) => {
    setStep('tiktok');
    setBoostMode('none');
    setCustomCopy(`😱 VOCÊ PRECISA DISSO: ${product.title}!\n🚀 Viral no mundo todo!\n🔗 Link na Bio! 🛒👇`);
    try {
      const res = await fetch(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(product.query)}&count=5`);
      const data = await res.json();
      const video = data.data?.videos?.[0] || { cover: '', play: '' };
      setVideoData({ cover: video.cover, url: video.play });
    } catch {
      setVideoData({ cover: '', url: '' });
    }
    setTimeout(() => setStep('ready'), 1000);
  };

  return (
    <div className="app-container">
      <header>
        <div className="flex items-center gap-2">
          <Activity size={20} className="accent-text" />
          <h1>VIRAL<span className="accent-text">SQUAD</span></h1>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="data-label">HISTÓRICO</p>
            <p className="data-value">{publicationHistory.length}/{productList.length}</p>
          </div>
        </div>
      </header>

      <main className="content-area">
        <AnimatePresence mode="wait">
          {step === 'idle' && (
            <motion.div key="idle" initial={{opacity:0}} animate={{opacity:1}} className="text-center py-20 space-y-8">
              <Zap size={64} className="accent-text mx-auto animate-pulse" />
              <h2 className="text-4xl font-extrabold tracking-tighter uppercase">Squad<br/>Pronto</h2>
              <button className="btn-primary" onClick={startScouting}>Iniciar Garimpo</button>
            </motion.div>
          )}

          {step === 'scouting' && (
            <motion.div key="scouting" initial={{opacity:0}} animate={{opacity:1}} className="h-full flex flex-col items-center justify-center space-y-4">
              <RefreshCcw size={48} className="accent-text animate-spin" />
              <p className="data-label animate-pulse">Analisando Banco de Dados...</p>
            </motion.div>
          )}

          {step === 'list' && (
            <motion.div key="list" initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
              <h2 className="text-2xl font-bold uppercase mb-4">Top Seleção</h2>
              {activeItems.map(p => (
                <div key={p.id} className="tech-card flex justify-between items-center group">
                  <div>
                    <p className="data-label">{p.commission} Comissão</p>
                    <h3 className="font-bold text-sm uppercase">{p.title}</h3>
                    <p className="text-[10px] text-dim">{p.price} • {p.sales} vendas</p>
                  </div>
                  <button className="btn-secondary !p-3" onClick={() => { setSelectedProduct(p); researchTikTok(p); }}>
                    <ArrowRight size={18} className="accent-text" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}

          {step === 'tiktok' && (
            <motion.div key="tiktok" initial={{opacity:0}} animate={{opacity:1}} className="h-full flex flex-col items-center justify-center space-y-4">
              <Video size={48} className="accent-purple animate-bounce" />
              <p className="data-label">Baixando Criativo Viral...</p>
            </motion.div>
          )}

          {step === 'ready' && (
            <motion.div key="ready" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-6">
              <div className="video-preview-container">
                {videoData?.cover ? (
                  <img src={videoData.cover} className="w-full h-full object-cover opacity-60" alt="Preview"/>
                ) : <div className="w-full h-full flex items-center justify-center text-dim">Sem Prévia</div>}
                
                {boostMode === 'performance' && (
                  <motion.div initial={{scale:0}} animate={{scale:1}} className="absolute inset-x-0 bottom-10 p-4 bg-red-600/80 text-center font-bold italic rotate-1 z-10">
                    OFERTA RELÂMPAGO 🔥
                  </motion.div>
                )}
                {boostMode === 'funny' && (
                  <motion.div initial={{scale:0, rotate:-10}} animate={{scale:1, rotate:0}} className="absolute inset-0 flex items-center justify-center bg-white/10 text-6xl drop-shadow-2xl z-10 pointer-events-none">
                    🤣🔥
                  </motion.div>
                )}
                
                {isBoosting && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20">
                    <Terminal className="accent-blue animate-pulse" />
                    <p className="text-[10px] mt-2">IA APLICANDO GATILHOS...</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold text-dim">Selecione a Estratégia:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button className={`btn-secondary ${boostMode==='performance'?'!border-blue-500 !bg-blue-500/10':''}`} onClick={()=>updateMode('performance')}>Vendas</button>
                  <button className={`btn-secondary ${boostMode==='funny'?'!border-purple-500 !bg-purple-500/10':''}`} onClick={()=>updateMode('funny')}>Humor</button>
                </div>
              </div>

              <button className="btn-primary !h-12 !bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" onClick={handleBoost}>
                <Zap size={16} /> Aplicar Magia IA
              </button>

              <div className="tech-card space-y-3">
                <p className="text-[10px] text-dim uppercase font-bold">Legenda Otimizada:</p>
                <textarea 
                  className="w-full bg-transparent border-none text-xs text-main outline-none min-h-[80px]"
                  value={customCopy}
                  onChange={(e)=>setCustomCopy(e.target.value)}
                />
                <div className="flex gap-2">
                  <button className="btn-secondary flex-1" onClick={()=>{ navigator.clipboard.writeText(customCopy); showToast("COPIADO!"); }}><Copy size={14}/> Copiar</button>
                  <button className="btn-secondary flex-1" onClick={()=>window.open(videoData.url)}><Download size={14}/> Vídeo</button>
                </div>
              </div>

              <button className="btn-primary" onClick={()=>{ markAsPublished(selectedProduct.id); setStep('list'); showToast("CONCLUÍDO!"); }}>Finalizar Postagem</button>
            </motion.div>
          )}

          {step === 'history' && (
            <motion.div key="history" initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
              <h2 className="text-2xl font-bold uppercase mb-4">Registro de Lutas</h2>
              {publicationHistory.length === 0 ? (
                <div className="text-center py-10 text-dim">Nenhum registro encontrado.</div>
              ) : (
                publicationHistory.map(h => {
                  const item = productList.find(p => p.id === h.id);
                  return (
                    <div key={h.id} className="tech-card flex justify-between items-center">
                      <div>
                        <h3 className="text-xs font-bold uppercase">{item?.title || "Item Removido"}</h3>
                        <p className="text-[10px] text-green-400">Publicado {getTimeAgo(h.timestamp)}</p>
                      </div>
                      <button className="btn-secondary !p-2 text-red-500 group" onClick={()=>unblock(h.id)}>
                        <Unlock size={16} className="group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="bottom-nav">
        <button className={`nav-item ${step==='idle'?'active':''}`} onClick={()=>setStep('idle')}><Home size={20}/>Início</button>
        <button className={`nav-item ${['list','scouting','ready','tiktok'].includes(step)?'active':''}`} onClick={()=>activeItems.length?setStep('list'):startScouting()}><Search size={20}/>Garimpo</button>
        <button className={`nav-item ${step==='history'?'active':''}`} onClick={()=>setStep('history')}><LayoutGrid size={20}/>Logs</button>
      </nav>

      {toast && (
        <motion.div initial={{y:50}} animate={{y:0}} className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-6 py-2 rounded-full font-bold text-xs shadow-2xl z-[100]">
          {toast}
        </motion.div>
      )}
    </div>
  );
};

export default App;
