import React, { useState, useEffect } from 'react';
import './index.css';
import { 
  Zap, Video, ArrowRight, Download,
  Activity, Home, Search, LayoutGrid, Copy, Terminal, RefreshCcw, Unlock, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const [step, setStep] = useState('idle');
  const platformUrls = {
    tiktok: 'https://www.tiktok.com/upload?lang=pt-BR',
    shopee: 'https://seller.shopee.com.br/creator-center/video-upload/upload'
  };
  const [productList, setProductList] = useState<any[]>([]); 
  const [activeItems, setActiveItems] = useState<any[]>([]); 
  const [publicationHistory, setPublicationHistory] = useState<{ id: number; timestamp: number }[]>([]); 
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [videoData, setVideoData] = useState<any>(null);
  const [customCopy, setCustomCopy] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [automationFinished, setAutomationFinished] = useState(false);
  const [boostMode, setBoostMode] = useState('none');
  const [activeNiche, setActiveNiche] = useState('Cozinha');
  const [consoleLogs, setConsoleLogs] = useState<{msg: string, type?: string}[]>([]);

  const niches = ['Cozinha', 'Tecnologia', 'Decoração', 'Pet', 'Beleza'];
  const productDB: Record<string, any[]> = {
    'Cozinha': [
      { id: 101, title: "Espremedor de Alho Pro Stainless", price: "R$ 47,90", commission_pct: 25, sales: "45.2k", query: "garlic press viral tiktok" },
      { id: 102, title: "Cortador de Legumes 12 em 1 Multifucional", price: "R$ 89,90", commission_pct: 18, sales: "22.8k", query: "vegetable slicer viral" },
      { id: 103, title: "Organizador de Geladeira Empilhável", price: "R$ 34,50", commission_pct: 12, sales: "88.1k", query: "fridge organization viral" },
      { id: 104, title: "Mini Processador Elétrico Turbo 300ml", price: "R$ 59,00", commission_pct: 35, sales: "124k", query: "mini food chopper viral" },
      { id: 105, title: "Seladora a Vácuo Profissional KeepFresh", price: "R$ 115,00", commission_pct: 22, sales: "15.4k", query: "vacuum sealer viral" },
      { id: 106, title: "Afiador de Facas Tungstênio 3 Estágios", price: "R$ 31,90", commission_pct: 40, sales: "56.7k", query: "knife sharpener viral" },
      { id: 107, title: "Dispenser de Detergente Premium 2 em 1", price: "R$ 28,00", commission_pct: 28, sales: "210k", query: "soap dispenser dash" },
      { id: 108, title: "Mop Triangular 360 Graus Auto-Torção", price: "R$ 78,00", commission_pct: 15, sales: "34k", query: "triangle mop viral" },
      { id: 109, title: "Tapete de Pia Ultra Absorvente Diatomita", price: "R$ 22,90", commission_pct: 45, sales: "67.8k", query: "absorbent mat viral" },
      { id: 110, title: "Lixeira Inteligente Sensor Aproximação", price: "R$ 156,00", commission_pct: 10, sales: "12.2k", query: "smart trash can viral" }
    ],
    'Tecnologia': [
      { id: 201, title: "Smartwatch Ultra 9 Series Retina", price: "R$ 199,00", commission_pct: 15, sales: "145k", query: "smartwatch ultra viral" },
      { id: 202, title: "Fone Bluetooth ANC High definition", price: "R$ 145,00", commission_pct: 20, sales: "88k", query: "anc earbuds viral" },
      { id: 203, title: "Teclado Mecânico Gamer RGB Silent", price: "R$ 250,00", commission_pct: 12, sales: "15k", query: "mechanical keyboard aesthetic" },
      { id: 204, title: "Projetor Portátil Cinema 4K Android", price: "R$ 450,00", commission_pct: 10, sales: "28k", query: "portable projector viral" },
      { id: 205, title: "Power Bank MagSafe 20000mAh", price: "R$ 135,00", commission_pct: 25, sales: "56k", query: "magsafe powerbank viral" },
      { id: 206, title: "Lâmpada Inteligente RGB Wi-Fi Plus", price: "R$ 39,00", commission_pct: 45, sales: "310k", query: "smart bulb hack viral" },
      { id: 207, title: "Hub USB-C 8 em 1 Portátil", price: "R$ 118,00", commission_pct: 18, sales: "42k", query: "usb c hub setup viral" },
      { id: 208, title: "Drone 4K Dual Camera E88 Max", price: "R$ 265,00", commission_pct: 15, sales: "67k", query: "drone budget viral" },
      { id: 209, title: "Ring Light Profissional 12 Polegadas", price: "R$ 55,00", commission_pct: 35, sales: "190k", query: "ring light tiktok viral" },
      { id: 210, title: "Mousepad Gamer RGB Speed Edition", price: "R$ 72,00", commission_pct: 28, sales: "33k", query: "rgb mousepad aesthetic" }
    ],
    'Decoração': [
      { id: 301, title: "Luminária Sunset Rainbow Premium", price: "R$ 55,00", commission_pct: 35, sales: "250k", query: "sunset lamp aesthetic" },
      { id: 302, title: "Umidificador de Ar Flame Vulcan", price: "R$ 95,00", commission_pct: 25, sales: "89k", query: "flame diffuser viral" },
      { id: 303, title: "Projetor Astronauta Galáxia 2.0", price: "R$ 115,00", commission_pct: 20, sales: "310k", query: "astronaut projector viral" },
      { id: 304, title: "Arandela LED Sem Fio Recarregável", price: "R$ 78,00", commission_pct: 30, sales: "45k", query: "cordless wall light viral" },
      { id: 305, title: "Relógio Digital 3D LED Mirror", price: "R$ 52,00", commission_pct: 40, sales: "120k", query: "3d led clock viral" },
      { id: 306, title: "Escultura Pensador Minimalista", price: "R$ 48,00", commission_pct: 45, sales: "23k", query: "thinker statue aesthetic" },
      { id: 307, title: "Fita LED RGBIC Efeito Dinâmico", price: "R$ 68,00", commission_pct: 28, sales: "150k", query: "rgbic led strips viral" },
      { id: 308, title: "Vaso Auto-Irrigável Transparente", price: "R$ 42,00", commission_pct: 32, sales: "34k", query: "self watering pot viral" },
      { id: 309, title: "Quadro de Areia Movediça 3D", price: "R$ 85,00", commission_pct: 22, sales: "15k", query: "moving sand art viral" },
      { id: 310, title: "Prateleira de Vidro Invisível", price: "R$ 38,00", commission_pct: 35, sales: "11k", query: "floating shelf aesthetic" }
    ],
    'Pet': [
      { id: 401, title: "Escova Vapor X-Steam para Gatos", price: "R$ 42,00", commission_pct: 45, sales: "215k", query: "steamy cat brush viral" },
      { id: 402, title: "Bebedouro Fonte de Água Ultra Silent", price: "R$ 98,00", commission_pct: 20, sales: "56k", query: "pet fountain viral" },
      { id: 403, title: "Brinquedo Peixe Robô Realista Pro", price: "R$ 29,00", commission_pct: 50, sales: "340k", query: "flopping fish pet viral" },
      { id: 404, title: "Rede de Janela Cat-Sky Garden", price: "R$ 82,00", commission_pct: 25, sales: "42k", query: "cat window bed viral" },
      { id: 405, title: "Pá Coletora Higiênica Click-Clean", price: "R$ 35,00", commission_pct: 40, sales: "88k", query: "poo scooper viral tiktok" },
      { id: 406, title: "Mochila Astronauta Panorâmica", price: "R$ 178,00", commission_pct: 15, sales: "29k", query: "pet backpack astronaut viral" },
      { id: 407, title: "Tapete Gelado Refresh-Pet XL", price: "R$ 65,00", commission_pct: 30, sales: "67k", query: "cooling mat pet viral" },
      { id: 408, title: "Cortador de Unha LED Safelight", price: "R$ 45,00", commission_pct: 35, sales: "91k", query: "pet nail clipper led viral" },
      { id: 409, title: "Comedouro Elevado Ergonômico", price: "R$ 55,00", commission_pct: 32, sales: "12k", query: "elevated pet bowl viral" },
      { id: 410, title: "Kit Banho Dry-Pet Super Toalha", price: "R$ 28,00", commission_pct: 42, sales: "53k", query: "pet bath robe viral" }
    ],
    'Beleza': [
      { id: 501, title: "Escova Alisadora 5 em 1 Airflow Pro", price: "R$ 235,00", commission_pct: 18, sales: "95k", query: "hair styler viral tiktok" },
      { id: 502, title: "Caneta Microblading Efeito Natural 4D", price: "R$ 22,00", commission_pct: 60, sales: "520k", query: "eyebrow pen viral tiktok" },
      { id: 503, title: "Removedor de Cravos Vácuo Pro-Clean", price: "R$ 72,00", commission_pct: 35, sales: "140k", query: "blackhead suction viral" },
      { id: 504, title: "Sérum Facial Retinol Booster 30ml", price: "R$ 49,00", commission_pct: 50, sales: "250k", query: "retinol serum viral" },
      { id: 505, title: "Modelador de Cachos Silk Curls", price: "R$ 35,00", commission_pct: 55, sales: "180k", query: "heatless curls aesthetic" },
      { id: 506, title: "Kit de Pincéis Crystal Profissional", price: "R$ 65,00", commission_pct: 40, sales: "89k", query: "makeup brush set viral" },
      { id: 507, title: "Massageador Facial Ice Roller Pro", price: "R$ 28,00", commission_pct: 55, sales: "110k", query: "ice roller face viral" },
      { id: 508, title: "Máscara LED Terapia 7 Cores", price: "R$ 158,00", commission_pct: 25, sales: "34k", query: "led therapy mask viral" },
      { id: 509, title: "Espelho Maquiagem LED Touch High", price: "R$ 95,00", commission_pct: 30, sales: "67k", query: "led vanity mirror viral" },
      { id: 510, title: "Aparelho Limpeza Foreo-Style Luminous", price: "R$ 32,00", commission_pct: 65, sales: "450k", query: "face cleanser viral" }
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

  const sortByCommission = (array: any[]) => {
    return [...array].sort((a, b) => b.commission_pct - a.commission_pct);
  };

  const startScouting = () => {
    setStep('scouting');
    setTimeout(() => {
      const allProducts = Object.values(productDB).flat();
      setProductList(allProducts);
      const sortedNiche = sortByCommission(productDB[activeNiche]);
      setActiveItems(sortedNiche.slice(0, 20)); 
      setStep('list');
    }, 1500);
  };

  const handleNicheChange = (niche: string) => {
    setActiveNiche(niche);
    const sortedNiche = sortByCommission(productDB[niche]);
    setActiveItems(sortedNiche.slice(0, 20));
  };

  const markAsPublished = (id: number) => {
    const newHistory = [...publicationHistory, { id, timestamp: Date.now() }];
    setPublicationHistory(newHistory);
    const pubIds = newHistory.map(h => h.id);
    const nextAvailable = productList.find(p => !pubIds.includes(p.id) && !activeItems.some(a => a.id === p.id));
    const newActive = activeItems.filter(p => p.id !== id);
    if (nextAvailable) newActive.push(nextAvailable);
    setActiveItems(sortByCommission(newActive));
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
      setCustomCopy(`🔥 ÚLTIMAS UNIDADES: ${selectedProduct.title}!\n🛑 Link na minha Bio com desconto exclusivo! 🛒👇\n#promo #achadinhos #shopee #viral #brasil`);
    } else if (mode === 'funny') {
      setCustomCopy(`🤣 POV: Você não sabia que precisava de um desse até ver esse vídeo! 🤡🔥\nO link está na Bio esperando por você! 🛒👇\n#humor #utilidades #casa #viral #achados`);
    }
  };

  const researchTikTok = async (product: any) => {
    setStep('tiktok');
    setBoostMode('none');
    // Better marketing legends without price
    const legends = [
      `😱 Gente, olha que achado incrível para sua casa! 🏠✨ \nO link oficial com desconto exclusivo está na minha Bio! 🛒👇 \n#shopee #achadinhos #produtoviral #utilidades`,
      `Você não sabia que precisava disso até ver esse vídeo... 🤯🔥 \nCorre no link da Bio antes que acabe o estoque! 🛒 \n#shopeebrasil #viral #casa #decoracao`,
      `Esse é o item que todo mundo está procurando nesta semana! 🏆📦 \nLink disponível na Bio por tempo limitado! ✅ \n#oferta #shopee #importados #achadosshopee`
    ];
    setCustomCopy(legends[Math.floor(Math.random() * legends.length)]);
    try {
      const res = await fetch(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(product.query)}&count=5`);
      const data = await res.json();
      const video = data.data?.videos?.[0] || { cover: '', play: '' };
      setVideoData({ cover: video.cover, url: video.play });
    } catch {
      setVideoData({ cover: '', url: '' });
    }
    setStep('ready');
    setAutomationFinished(false);
    setTimeout(() => setStep('ready'), 1000);
  };

  const runAutomation = (platform: 'tiktok' | 'shopee') => {
    // Semi-Auto features: Copy to clipboard and open Target
    navigator.clipboard.writeText(customCopy);
    
    window.open(platformUrls[platform], '_blank');
    
    setStep('automation');
    setConsoleLogs([]);
    const logs = [
      { msg: `> INICIANDO MOTOR DE AUTOMAÇÃO ${platform.toUpperCase()}...`, type: 'info' },
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
            setAutomationFinished(true);
            showToast("CONCLUÍDO! VERIFIQUE A ABA ABERTA 🚀");
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
        <div></div>
      </header>

      <main className="content-area">
        <AnimatePresence mode="wait">
          {step === 'idle' && (
            <motion.div key="idle" initial={{opacity:0}} animate={{opacity:1}} className="text-center py-20 space-y-10">
              <div className="relative inline-block">
                <Terminal size={64} className="accent-text mx-auto" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-4 border-2 border-dashed border-blue-500/30 rounded-full"
                />
              </div>
              <div className="space-y-3">
                <h2 className="text-4xl font-black tracking-tighter uppercase italic">Viral Core AI</h2>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-[1px] w-8 bg-blue-500/50"></div>
                  <p className="text-[10px] text-blue-400 uppercase font-black tracking-[4px]">Marketing Intelligence</p>
                  <div className="h-[1px] w-8 bg-blue-500/50"></div>
                </div>
              </div>
              <div className="flex flex-col gap-4 items-center">
                <button className="btn-primary !px-12 !h-14 font-black italic tracking-widest text-lg group relative overflow-hidden" onClick={startScouting}>
                  <span className="relative z-10">INICIAR VARREDURA</span>
                  <motion.div 
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.5 }}
                  />
                </button>
                <p className="text-[9px] text-dim uppercase">Protocolo V9.2 • Sincronização em Tempo Real</p>
              </div>
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
                {activeItems.map(p => {
                  const isPublished = publicationHistory.some(h => h.id === p.id);
                  return (
                    <div key={p.id} className={`tech-card flex justify-between items-center group hover:border-blue-500/50 ${isPublished ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                      <div>
                        <div className="flex gap-2 items-center mb-1">
                          {isPublished ? (
                            <span className="badge badge-error">POSTADO</span>
                          ) : (
                            <div className="flex flex-col">
                              <span className="text-[10px] text-green-400 font-black italic tracking-tighter leading-none mb-1">{p.commission_pct}% DE LUCRO 🔥</span>
                              <div className="h-[2px] w-full bg-green-500/30 rounded-full overflow-hidden">
                                <motion.div initial={{width:0}} animate={{width:`${p.commission_pct}%`}} className="h-full bg-green-500" />
                              </div>
                            </div>
                          )}
                          <span className="text-[9px] text-blue-400 font-bold uppercase">{p.sales} VENDIDOS</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm uppercase">{p.title}</h3>
                          <button className="copy-trigger" onClick={(e)=>{ e.stopPropagation(); navigator.clipboard.writeText(p.title); showToast("NOME COPIADO!"); }}>
                            <Copy size={10} />
                          </button>
                        </div>
                        <p className="text-[10px] text-dim font-mono">{p.price}</p>
                      </div>
                      <button className="btn-secondary !p-3 hover:bg-blue-500/20" onClick={() => { setSelectedProduct(p); researchTikTok(p); }}>
                        <ArrowRight size={18} className="accent-text" />
                      </button>
                    </div>
                  );
                })}
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
                
                {/* Overlay de Comissão no Vídeo */}
                <div className="absolute top-4 right-4 z-20">
                  <motion.div initial={{x:50}} animate={{x:0}} className="bg-green-600 px-3 py-1 rounded-l-full border-l-4 border-white shadow-xl flex items-center gap-2">
                    <Zap size={12} className="text-white animate-pulse" />
                    <span className="text-xs font-black text-white italic">{selectedProduct.commission_pct}% LUCRO</span>
                  </motion.div>
                </div>
              </div>

              <div className="tech-card py-2 flex justify-between items-center border-blue-500/30 bg-blue-500/5">
                <div className="flex flex-col text-left overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">Identificador p/ Busca</span>
                    <span className="badge badge-success !py-0 !px-2 !text-[9px] font-black">{selectedProduct.commission_pct}% COMISSÃO</span>
                  </div>
                  <h3 className="text-xs font-black uppercase text-white truncate pr-2">{selectedProduct.title}</h3>
                </div>
                <button className="copy-trigger !mt-0 h-8 px-3 flex-shrink-0" onClick={()=>{ navigator.clipboard.writeText(selectedProduct.title); showToast("NOME COPIADO!"); }}>
                  <Copy size={12} /> COPIAR
                </button>
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

              <div className="grid grid-cols-2 gap-3">
                <button className="btn-primary !h-14 !bg-[#000000] !border-white/10" onClick={()=>runAutomation('tiktok')}>
                  TIKTOK 🎬
                </button>
                <button className="btn-primary !h-14 !bg-[#EE4D2D] !shadow-[#EE4D2D]/20" onClick={()=>runAutomation('shopee')}>
                  SHOPEE 🟠
                </button>
              </div>
              <button className="btn-secondary w-full !h-12 mt-2" onClick={()=>window.open(videoData.url)}>
                <Download size={16} /> BAIXAR VÍDEO SEM MARCA
              </button>
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

              <div className="text-center space-y-4">
                {automationFinished ? (
                  <div className="grid grid-cols-2 gap-4">
                    <button className="btn-secondary !h-14" onClick={() => { setStep('ready'); setAutomationFinished(false); }}>
                      <RefreshCcw size={16} /> POSTAR OUTRO
                    </button>
                    <button className="btn-primary !h-14 !bg-emerald-600" onClick={() => { markAsPublished(selectedProduct.id); setStep('list'); setAutomationFinished(false); }}>
                      <CheckCircle size={16} /> FINALIZAR ITEM
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-dim animate-pulse">O App está simulando a postagem no seu navegador...</p>
                )}
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
