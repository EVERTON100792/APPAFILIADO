import React, { useState, useEffect } from 'react';
import './index.css';
import { 
  Zap, Video, ArrowRight, Download,
  Activity, Home, Search, LayoutGrid, Copy, Terminal, RefreshCcw, Unlock
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
  const [activeNiche, setActiveNiche] = useState('Cozinha');
  const [consoleLogs, setConsoleLogs] = useState<{msg: string, type?: string}[]>([]);

  const niches = ['Cozinha', 'Tecnologia', 'Decoração', 'Pet', 'Beleza'];

  const productDB: Record<string, any[]> = {
    'Cozinha': [
      { id: 101, title: "Espremedor de Alho Pro", price: "R$ 47,90", commission: "18%", sales: "5k+", query: "alho viral" },
      { id: 102, title: "Cortador de Legumes 5 em 1", price: "R$ 89,90", commission: "15%", sales: "2k+", query: "legume viral" },
      { id: 103, title: "Organizador de Geladeira", price: "R$ 34,50", commission: "20%", sales: "8k+", query: "geladeira viral" },
      { id: 104, title: "Mini Processador Elétrico", price: "R$ 59,00", commission: "12%", sales: "10k+", query: "mini processador" },
      { id: 105, title: "Kit Potes Herméticos", price: "R$ 120,00", commission: "10%", sales: "1k+", query: "potes cozinha" },
      { id: 106, title: "Afiador de Facas X-Sharp", price: "R$ 29,90", commission: "25%", sales: "3k+", query: "afiador cozinha" },
      { id: 107, title: "Dispenser de Detergente", price: "R$ 25,00", commission: "15%", sales: "15k+", query: "dispenser pia" },
      { id: 108, title: "Mop Triangular de Limpeza", price: "R$ 78,00", commission: "12%", sales: "4k+", query: "mop viral" },
      { id: 109, title: "Tapete de Pia Absorvente", price: "R$ 22,90", commission: "18%", sales: "6k+", query: "tapete pia" },
      { id: 110, title: "Seladora a Vácuo Portátil", price: "R$ 115,00", commission: "12%", sales: "1k+", query: "vacuo viral" }
    ],
    'Tecnologia': [
      { id: 201, title: "Smartwatch Ultra Series", price: "R$ 199,00", commission: "10%", sales: "12k+", query: "smartwatch viral" },
      { id: 202, title: "Fone Bluetooth Noise Canceling", price: "R$ 145,00", commission: "12%", sales: "8k+", query: "fone bluetooth viral" },
      { id: 203, title: "Teclado Mecânico RGB", price: "R$ 250,00", commission: "8%", sales: "3k+", query: "teclado mecanico" },
      { id: 204, title: "Mouse Gamer 12000 DPI", price: "R$ 89,90", commission: "15%", sales: "6k+", query: "mouse gamer viral" },
      { id: 205, title: "Projetor Portátil 4K", price: "R$ 450,00", commission: "5%", sales: "1k+", query: "projetor viral" }
    ],
    'Decoração': [
      { id: 301, title: "Luminária Sunset Rainbow", price: "R$ 55,00", commission: "20%", sales: "15k+", query: "sunset lamp" },
      { id: 302, title: "Fita LED Smart RGB", price: "R$ 45,00", commission: "22%", sales: "20k+", query: "fita led viral" },
      { id: 303, title: "Umidificador de Ar Flame", price: "R$ 89,00", commission: "15%", sales: "7k+", query: "humidificador flame" }
    ],
    'Pet': [
      { id: 401, title: "Escova Vapor para Gatos", price: "R$ 39,90", commission: "25%", sales: "30k+", query: "steamy cat brush" },
      { id: 402, title: "Bebedouro Fonte de Água", price: "R$ 95,00", commission: "12%", sales: "5k+", query: "fonte pet viral" }
    ],
    'Beleza': [
      { id: 501, title: "Secador 5 em 1 Airflow", price: "R$ 210,00", commission: "10%", sales: "10k+", query: "hair dryer viral" },
      { id: 502, title: "Massageador Facial Ice Roller", price: "R$ 25,00", commission: "30%", sales: "45k+", query: "ice roller face" }
    ]
  };

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
      const allProducts = Object.values(productDB).flat();
      setProductList(allProducts);
      const pubIds = publicationHistory.map(h => h.id);
      const filtered = productDB[activeNiche].filter(p => !pubIds.includes(p.id));
      setActiveItems(filtered.slice(0, 20)); 
      setStep('list');
    }, 1500);
  };

  const handleNicheChange = (niche: string) => {
    setActiveNiche(niche);
    const pubIds = publicationHistory.map(h => h.id);
    const filtered = productDB[niche].filter(p => !pubIds.includes(p.id));
    setActiveItems(filtered.slice(0, 20));
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

  const runAutomation = () => {
    setStep('automation');
    setConsoleLogs([]);
    const logs = [
      { msg: "> INICIANDO MOTOR DE AUTOMAÇÃO SQUAD...", type: 'info' },
      { msg: "> Sincronizando banco de metadados...", type: 'info' },
      { msg: "> Validando credenciais de conta no navegador...", type: 'info' },
      { msg: "> Acessando painel de postagem via Bridge Protocol...", type: 'info' },
      { msg: "> Carregando vídeo com Magic IA e gatilhos mentais...", type: 'info' },
      { msg: "> Aplicando Tags de alta conversão: #shopee #viral #achadinhos", type: 'info' },
      { msg: "> AGUARDANDO RESPOSTA DO SERVIDOR...", type: 'warn' },
      { msg: "> Bypass de CAPTCHA concluído com sucesso.", type: 'info' },
      { msg: "> POSTAGEM PROGRAMADA E SINCRONIZADA!", type: 'success' },
      { msg: "> VERIFICANDO STATUS DO LINK NA BIO...", type: 'info' },
      { msg: "> TUDO PRONTO! O SQUAD FINALIZOU O SERVIÇO.", type: 'success' }
    ];

    logs.forEach((log, i) => {
      setTimeout(() => {
        setConsoleLogs(prev => [...prev, log]);
        if (i === logs.length - 1) {
          setTimeout(() => {
            markAsPublished(selectedProduct.id);
            setStep('list');
            showToast("POSTAGEM CONCLUÍDA! 🚀");
          }, 2000);
        }
      }, i * 800);
    });
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
            <p className="data-label">VENDAS HOJE</p>
            <p className="data-value">R$ 1.240,00</p>
          </div>
        </div>
      </header>

      <main className="content-area">
        <AnimatePresence mode="wait">
          {step === 'idle' && (
            <motion.div key="idle" initial={{opacity:0}} animate={{opacity:1}} className="text-center py-20 space-y-8">
              <Zap size={64} className="accent-text mx-auto animate-pulse" />
              <div className="space-y-2">
                <h2 className="text-4xl font-extrabold tracking-tighter uppercase">Squad V2</h2>
                <p className="text-xs text-dim uppercase tracking-[3px]">Marketing Automation</p>
              </div>
              <button className="btn-primary" onClick={startScouting}>Entrar no Garimpo</button>
            </motion.div>
          )}

          {step === 'scouting' && (
            <motion.div key="scouting" initial={{opacity:0}} animate={{opacity:1}} className="h-full flex flex-col items-center justify-center space-y-4">
              <RefreshCcw size={48} className="accent-text animate-spin" />
              <p className="data-label animate-pulse text-center">ESCANER IA ATIVO...<br/><span className="text-[8px] text-dim">MAPEANDO PRODUTOS VIRALIZADOS</span></p>
            </motion.div>
          )}

          {step === 'list' && (
            <motion.div key="list" initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold uppercase">Nichos Premium</h2>
                <div className="badge badge-blue">{activeItems.length} ITENS</div>
              </div>
              
              <div className="niche-selector">
                {niches.map(n => (
                  <button 
                    key={n} 
                    className={`niche-chip ${activeNiche === n ? 'active' : ''}`}
                    onClick={() => handleNicheChange(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {activeItems.map(p => (
                  <div key={p.id} className="tech-card flex justify-between items-center group hover:border-blue-500/50">
                    <div>
                      <div className="flex gap-2 items-center mb-1">
                        <span className="badge badge-success">{p.commission} Lucro</span>
                        <span className="text-[9px] text-dim">{p.sales} Vendidos</span>
                      </div>
                      <h3 className="font-bold text-sm uppercase">{p.title}</h3>
                      <p className="text-[10px] text-dim font-mono">{p.price}</p>
                    </div>
                    <button className="btn-secondary !p-3 hover:bg-blue-500/20" onClick={() => { setSelectedProduct(p); researchTikTok(p); }}>
                      <ArrowRight size={18} className="accent-text" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'tiktok' && (
            <motion.div key="tiktok" initial={{opacity:0}} animate={{opacity:1}} className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <Video size={56} className="accent-purple animate-bounce" />
                <div className="absolute -inset-2 bg-purple-500/20 blur-xl rounded-full animate-pulse"></div>
              </div>
              <p className="data-label">BAIXANDO CRIATIVO SEM MARCA D'ÁGUA...</p>
            </motion.div>
          )}

          {step === 'ready' && (
            <motion.div key="ready" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-6">
              <div className="video-preview-container">
                {videoData?.cover ? (
                  <img src={videoData.cover} className="w-full h-full object-cover opacity-60" alt="Preview"/>
                ) : <div className="w-full h-full flex items-center justify-center text-dim bg-slate-900/50">Carregando Visual...</div>}
                
                {boostMode === 'performance' && (
                  <motion.div initial={{scale:0}} animate={{scale:1}} className="absolute inset-x-0 bottom-10 p-4 bg-red-600/90 text-center font-black italic uppercase text-xs tracking-widest z-10 shadow-2xl">
                    OFERTA RELÂMPAGO 🔥
                  </motion.div>
                )}
                {boostMode === 'funny' && (
                  <div className="absolute inset-0 flex items-center justify-center text-6xl drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] z-10 pointer-events-none">
                    🤣🔥
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className={`btn-secondary h-12 flex flex-col items-center justify-center gap-1 ${boostMode==='performance'?'!border-blue-500 !bg-blue-500/20':''}`} onClick={()=>updateMode('performance')}>
                  <Zap size={14} className={boostMode==='performance'?'text-blue-400':''} />
                  <span>VENDAS</span>
                </button>
                <button className={`btn-secondary h-12 flex flex-col items-center justify-center gap-1 ${boostMode==='funny'?'!border-purple-500 !bg-purple-500/20':''}`} onClick={()=>updateMode('funny')}>
                  <Activity size={14} className={boostMode==='funny'?'text-purple-400':''} />
                  <span>VIRAL</span>
                </button>
              </div>

              <div className="tech-card space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-dim uppercase font-bold tracking-wider">Legenda Otimizada IA:</p>
                  <button className="flex items-center gap-1 text-[10px] text-blue-400 font-bold" onClick={()=>{ navigator.clipboard.writeText(customCopy); showToast("COPIADO!"); }}>
                    <Copy size={12} /> COPIAR
                  </button>
                </div>
                <textarea 
                  className="w-full bg-slate-900/30 p-2 rounded-lg border border-white/5 text-[11px] text-main outline-none min-h-[90px] resize-none"
                  value={customCopy}
                  onChange={(e)=>setCustomCopy(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button className="btn-secondary !h-14 font-black" onClick={()=>window.open(videoData.url)}>
                  <Download size={18} /> DOWNLOAD
                </button>
                <button className="btn-primary !h-14 !bg-emerald-600 !shadow-emerald-900/40" onClick={runAutomation}>
                  AUTO-POST 🚀
                </button>
              </div>
            </motion.div>
          )}

          {step === 'automation' && (
            <motion.div key="automation" initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
              <div className="flex items-center gap-3">
                <Terminal size={24} className="text-emerald-500" />
                <h2 className="text-xl font-bold uppercase">Executando Squad</h2>
              </div>
              
              <div className="automation-console">
                {consoleLogs.map((log, i) => (
                  <div key={i} className={`console-line ${log.type}`}>
                    {log.msg}
                  </div>
                ))}
                <div className="animate-pulse inline-block w-2 h-4 bg-emerald-500 ml-1"></div>
              </div>

              <div className="text-center">
                <p className="text-[10px] text-dim animate-pulse">O App está simulando a postagem no seu navegador...</p>
              </div>
            </motion.div>
          )}

          {step === 'history' && (
            <motion.div key="history" initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
              <h2 className="text-2xl font-bold uppercase mb-4">Relatório de Posts</h2>
              {publicationHistory.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center space-y-4 opacity-30">
                  <LayoutGrid size={40} />
                  <p className="text-xs">NENHUMA POSTAGEM REGISTRADA</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {publicationHistory.map(h => {
                    const item = productList.find(p => p.id === h.id);
                    return (
                      <div key={h.id} className="tech-card flex justify-between items-center border-l-4 border-l-emerald-500">
                        <div>
                          <h3 className="text-xs font-bold uppercase">{item?.title || "Item Sincronizado"}</h3>
                          <p className="text-[9px] text-emerald-400 font-mono">STATUS: ATIVO • {getTimeAgo(h.timestamp)}</p>
                        </div>
                        <button className="btn-secondary !p-2 text-red-400/50 hover:text-red-400" onClick={()=>unblock(h.id)}>
                          <Unlock size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="bottom-nav">
        <button className={`nav-item ${step==='idle'?'active':''}`} onClick={()=>setStep('idle')}>
          <Home size={22}/>
          <span>Início</span>
        </button>
        <button className={`nav-item ${['list','scouting','ready','tiktok','automation'].includes(step)?'active':''}`} onClick={()=>productList.length?setStep('list'):startScouting()}>
          <Search size={22}/>
          <span>Garimpo</span>
        </button>
        <button className={`nav-item ${step==='history'?'active':''}`} onClick={()=>setStep('history')}>
          <LayoutGrid size={22}/>
          <span>Logs</span>
        </button>
      </nav>

      {toast && (
        <motion.div initial={{y:100, x:'-50%'}} animate={{y:0, x:'-50%'}} exit={{y:100, x:'-50%'}} className="fixed bottom-28 left-1/2 bg-white text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-tighter shadow-[0_15px_30px_rgba(0,0,0,0.5)] z-[200]">
          {toast}
        </motion.div>
      )}
    </div>
  );
};

export default App;
