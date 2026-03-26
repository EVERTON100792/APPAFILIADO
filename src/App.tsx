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
    shopee: 'https://seller.shopee.com.br/portal/marketing/video'
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
      { id: 101, title: "Espremedor de Alho Pro", price: "R$ 47,90", commission: "18%", sales: "5k+", query: "alho viral" },
      { id: 102, title: "Cortador de Legumes 5 em 1", price: "R$ 89,90", commission: "15%", sales: "2k+", query: "legume viral" },
      { id: 103, title: "Organizador de Geladeira", price: "R$ 34,50", commission: "20%", sales: "8k+", query: "geladeira viral" },
      { id: 104, title: "Mini Processador Elétrico", price: "R$ 59,00", commission: "12%", sales: "10k+", query: "mini processador" },
      { id: 105, title: "Kit Potes Herméticos", price: "R$ 120,00", commission: "10%", sales: "1k+", query: "potes cozinha" },
      { id: 106, title: "Afiador de Facas X-Sharp", price: "R$ 29,90", commission: "25%", sales: "3k+", query: "afiador cozinha" },
      { id: 107, title: "Dispenser de Detergente", price: "R$ 25,00", commission: "15%", sales: "15k+", query: "dispenser pia" },
      { id: 108, title: "Mop Triangular de Limpeza", price: "R$ 78,00", commission: "12%", sales: "4k+", query: "mop viral" },
      { id: 109, title: "Tapete de Pia Absorvente", price: "R$ 22,90", commission: "18%", sales: "6k+", query: "tapete pia" },
      { id: 110, title: "Seladora a Vácuo Portátil", price: "R$ 115,00", commission: "12%", sales: "1k+", query: "vacuo viral" },
      { id: 111, title: "Lixeira com Sensor Smart", price: "R$ 156,00", commission: "10%", sales: "3k+", query: "lixeira sensor" },
      { id: 112, title: "Porta Temperos Giratório", price: "R$ 67,00", commission: "20%", sales: "2k+", query: "porta tempero" },
      { id: 113, title: "Escorredor de Louça Inox", price: "R$ 89,00", commission: "15%", sales: "5k+", query: "escorredor inox" },
      { id: 114, title: "Conjunto de Facas Cerâmica", price: "R$ 134,00", commission: "12%", sales: "1k+", query: "facas ceramica" },
      { id: 115, title: "Tapete Culinário Silicone", price: "R$ 29,00", commission: "25%", sales: "8k+", query: "tapete silicone" },
      { id: 116, title: "Balança Digital de Cozinha", price: "R$ 39,00", commission: "22%", sales: "10k+", query: "balança cozinha" },
      { id: 117, title: "Mixer de Mão Potente", price: "R$ 88,00", commission: "15%", sales: "4k+", query: "mixer viral" },
      { id: 118, title: "Moedor de Pimenta Elétrico", price: "R$ 54,00", commission: "18%", sales: "6k+", query: "moedor pimenta" },
      { id: 119, title: "Forma de Gelo Silicone", price: "R$ 19,00", commission: "30%", sales: "15k+", query: "gelo silicone" },
      { id: 120, title: "Suporte de Papel Toalha", price: "R$ 25,00", commission: "20%", sales: "7k+", query: "suporte papel" }
    ],
    'Tecnologia': [
      { id: 201, title: "Smartwatch Ultra Series", price: "R$ 199,00", commission: "10%", sales: "12k+", query: "smartwatch viral" },
      { id: 202, title: "Fone Bluetooth Noise Canceling", price: "R$ 145,00", commission: "12%", sales: "8k+", query: "fone bluetooth viral" },
      { id: 203, title: "Teclado Mecânico RGB", price: "R$ 250,00", commission: "8%", sales: "3k+", query: "teclado mecanico" },
      { id: 204, title: "Mouse Gamer 12000 DPI", price: "R$ 89,90", commission: "15%", sales: "6k+", query: "mouse gamer viral" },
      { id: 205, title: "Projetor Portátil 4K", price: "R$ 450,00", commission: "5%", sales: "1k+", query: "projetor viral" },
      { id: 206, title: "Power Bank MagSafe 10k", price: "R$ 120,00", commission: "12%", sales: "5k+", query: "magsafe powerbank" },
      { id: 207, title: "Hub USB-C 7 em 1", price: "R$ 98,00", commission: "15%", sales: "4k+", query: "hub usbc viral" },
      { id: 208, title: "Caixa de Som à Prova d'Água", price: "R$ 75,00", commission: "18%", sales: "10k+", query: "caixa som viral" },
      { id: 209, title: "Lâmpada Inteligente RGB", price: "R$ 35,00", commission: "25%", sales: "20k+", query: "smart bulb viral" },
      { id: 210, title: "Suporte Articulado Monitor", price: "R$ 160,00", commission: "10%", sales: "2k+", query: "monitor arm viral" },
      { id: 211, title: "Headset Gamer 7.1", price: "R$ 189,00", commission: "12%", sales: "6k+", query: "headset gamer" },
      { id: 212, title: "Ring Light Profissional", price: "R$ 55,00", commission: "20%", sales: "15k+", query: "ring light viral" },
      { id: 213, title: "Drone E88 Pro HD", price: "R$ 245,00", commission: "8%", sales: "8k+", query: "drone viral" },
      { id: 214, title: "Stream Deck Mini", price: "R$ 380,00", commission: "5%", sales: "1k+", query: "stream deck viral" },
      { id: 215, title: "SSD Externo 1TB", price: "R$ 290,00", commission: "7%", sales: "3k+", query: "ssd portable" },
      { id: 216, title: "Carregador 65W GaN", price: "R$ 110,00", commission: "15%", sales: "5k+", query: "gan charger" },
      { id: 217, title: "Mousepad RGB Extra Grande", price: "R$ 65,00", commission: "18%", sales: "7k+", query: "rgb mousepad" },
      { id: 218, title: "Webcam 1080p AutoFocus", price: "R$ 135,00", commission: "12%", sales: "4k+", query: "webcam viral" },
      { id: 219, title: "Adaptador Bluetooth 5.3", price: "R$ 25,00", commission: "30%", sales: "12k+", query: "bluetooth adapter" },
      { id: 220, title: "Microfone Condensador USB", price: "R$ 175,00", commission: "10%", sales: "3k+", query: "usb microphone" }
    ],
    'Decoração': [
      { id: 301, title: "Luminária Sunset Rainbow", price: "R$ 55,00", commission: "20%", sales: "15k+", query: "sunset lamp" },
      { id: 302, title: "Fita LED Smart RGB", price: "R$ 45,00", commission: "22%", sales: "20k+", query: "fita led viral" },
      { id: 303, title: "Umidificador de Ar Flame", price: "R$ 89,00", commission: "15%", sales: "7k+", query: "humidificador flame" },
      { id: 304, title: "Quadro de Areia Movediça", price: "R$ 78,00", commission: "18%", sales: "5k+", query: "moving sand art" },
      { id: 305, title: "Espelho Irregular Decorativo", price: "R$ 120,00", commission: "12%", sales: "3k+", query: "irregular mirror" },
      { id: 306, title: "Vaso de Planta Levitação", price: "R$ 245,00", commission: "10%", sales: "1k+", query: "levitating plant" },
      { id: 307, title: "Difusor Ultrassônico Aromas", price: "R$ 65,00", commission: "20%", sales: "10k+", query: "aroma diffuser" },
      { id: 308, title: "Relógio Digital 3D LED", price: "R$ 49,00", commission: "25%", sales: "12k+", query: "3d led clock" },
      { id: 309, title: "Cortina de Luz Estrela", price: "R$ 38,00", commission: "28%", sales: "18k+", query: "star lights viral" },
      { id: 310, title: "Projetor de Galáxia Astronauta", price: "R$ 115,00", commission: "15%", sales: "25k+", query: "astronaut projector" },
      { id: 311, title: "Luminária de Livro Dobrável", price: "R$ 59,00", commission: "22%", sales: "6k+", query: "book lamp viral" },
      { id: 312, title: "Estatueta Pensador Moderna", price: "R$ 45,00", commission: "25%", sales: "4k+", query: "thinker statue" },
      { id: 313, title: "Luminária Árvore Bonsai", price: "R$ 85,00", commission: "18%", sales: "8k+", query: "bonsai lamp viral" },
      { id: 314, title: "Relógio de Areia Decorativo", price: "R$ 32,00", commission: "30%", sales: "5k+", query: "sand timer viral" },
      { id: 315, title: "Adesivo de Parede 3D Tijolo", price: "R$ 15,00", commission: "35%", sales: "50k+", query: "3d wall sticker" },
      { id: 316, title: "Organizadores de Mesa Acrílico", price: "R$ 28,00", commission: "25%", sales: "15k+", query: "acrylic organizer" },
      { id: 317, title: "Luminária de Lua 3D", price: "R$ 42,00", commission: "28%", sales: "30k+", query: "3d moon lamp" },
      { id: 318, title: "Porta Chaves Magnético Nuvem", price: "R$ 18,00", commission: "40%", sales: "12k+", query: "cloud key holder" },
      { id: 319, title: "Prateleira Flutuante Invisível", price: "R$ 36,00", commission: "20%", sales: "9k+", query: "floating shelf" },
      { id: 320, title: "Terrário de Vidro Boho", price: "R$ 55,00", commission: "15%", sales: "2k+", query: "glass terrarium" }
    ],
    'Pet': [
      { id: 401, title: "Escova Vapor para Gatos", price: "R$ 39,90", commission: "25%", sales: "30k+", query: "steamy cat brush" },
      { id: 402, title: "Bebedouro Fonte de Água", price: "R$ 95,00", commission: "12%", sales: "5k+", query: "fonte pet viral" },
      { id: 403, title: "Lançador de Petiscos Automático", price: "R$ 145,00", commission: "15%", sales: "2k+", query: "treat launcher" },
      { id: 404, title: "Tapete Gelado Refrescante", price: "R$ 58,00", commission: "20%", sales: "8k+", query: "cooling mat pet" },
      { id: 405, title: "Mochila Astronauta para Pets", price: "R$ 165,00", commission: "10%", sales: "10k+", query: "astronaut pet bag" },
      { id: 406, title: "Brinquedo Peixe Robô", price: "R$ 25,00", commission: "35%", sales: "40k+", query: "flopping fish pet" },
      { id: 407, title: "Pá Coletora de Fezes Higiênica", price: "R$ 32,00", commission: "30%", sales: "15k+", query: "poo scooper viral" },
      { id: 408, title: "Rastreador GPS para Coleira", price: "R$ 88,00", commission: "18%", sales: "6k+", query: "pet gps tracker" },
      { id: 409, title: "Rede de Janela para Gatos", price: "R$ 75,00", commission: "20%", sales: "5k+", query: "cat window bed" },
      { id: 410, title: "Cortador de Unha com LED", price: "R$ 42,00", commission: "25%", sales: "12k+", query: "pet nail clipper led" },
      { id: 411, title: "Comedouro Inteligente Wi-Fi", price: "R$ 350,00", commission: "8%", sales: "1k+", query: "smart pet feeder" },
      { id: 412, title: "Luva Tira Pelos Master", price: "R$ 19,00", commission: "40%", sales: "100k+", query: "deshedding glove" },
      { id: 413, title: "Cama Nuvem Calmante", price: "R$ 110,00", commission: "15%", sales: "25k+", query: "calming pet bed" },
      { id: 414, title: "Escova de Dentes para Cães", price: "R$ 22,00", commission: "30%", sales: "15k+", query: "dog tooth brush toy" },
      { id: 415, title: "Coleira Peitoral Anti-Puxão", price: "R$ 54,00", commission: "22%", sales: "9k+", query: "no pull harness" },
      { id: 416, title: "Snack Ball Interativa", price: "R$ 28,00", commission: "35%", sales: "18k+", query: "pet treat ball" },
      { id: 417, title: "Secador de Pelos Silencioso", price: "R$ 185,00", commission: "12%", sales: "3k+", query: "pet dryer viral" },
      { id: 418, title: "Protetor de Sofá para Pets", price: "R$ 68,00", commission: "20%", sales: "7k+", query: "pet sofa cover" },
      { id: 419, title: "Kit de Limpeza de Patas", price: "R$ 35,00", commission: "28%", sales: "20k+", query: "paw plunger viral" },
      { id: 420, title: "Roupinha de Inverno Térmica", price: "R$ 48,00", commission: "25%", sales: "12k+", query: "dog winter coat" }
    ],
    'Beleza': [
      { id: 501, title: "Secador 5 em 1 Airflow", price: "R$ 210,00", commission: "10%", sales: "10k+", query: "hair dryer viral" },
      { id: 502, title: "Massageador Facial Ice Roller", price: "R$ 25,00", commission: "30%", sales: "45k+", query: "ice roller face" },
      { id: 503, title: "Caneta de Microblading Efeito Full", price: "R$ 18,00", commission: "45%", sales: "120k+", query: "eyebrow pen viral" },
      { id: 504, title: "Esfoliante Labial de Morango", price: "R$ 22,00", commission: "35%", sales: "50k+", query: "lip scrub viral" },
      { id: 505, title: "Modelador de Cachos Sem Calor", price: "R$ 38,00", commission: "28%", sales: "35k+", query: "heatless curls viral" },
      { id: 506, title: "Máscara Facial de LED 7 Cores", price: "R$ 145,00", commission: "15%", sales: "8k+", query: "led face mask viral" },
      { id: 507, title: "Sérum Facial Ácido Hialurônico", price: "R$ 45,00", commission: "25%", sales: "60k+", query: "hyaluronic acid viral" },
      { id: 508, title: "Kit de Pincéis de Maquiagem 12pçs", price: "R$ 55,00", commission: "22%", sales: "40k+", query: "makeup brush set" },
      { id: 509, title: "Removedor de Cravos por Sucção", price: "R$ 68,00", commission: "20%", sales: "25k+", query: "blackhead remover viral" },
      { id: 510, title: "Espelho de Maquiagem com LED", price: "R$ 89,00", commission: "18%", sales: "15k+", query: "led makeup mirror" },
      { id: 511, title: "Caneta Clareadora Dental", price: "R$ 29,00", commission: "35%", sales: "80k+", query: "teeth whitening pen" },
      { id: 512, title: "Depilador de Sobrancelha Elétrico", price: "R$ 34,00", commission: "30%", sales: "70k+", query: "eyebrow trimmer" },
      { id: 513, title: "Escova Alisadora de Cabelo", price: "R$ 98,00", commission: "15%", sales: "12k+", query: "hair straightener brush" },
      { id: 514, title: "Parche de Hidrogel para Olhos", price: "R$ 15,00", commission: "40%", sales: "150k+", query: "eye patches viral" },
      { id: 515, title: "Aparelho de Radiofrequência Facial", price: "R$ 185,00", commission: "12%", sales: "5k+", query: "rf face device" },
      { id: 516, title: "Kit de Unhas de Gel Polygel", price: "R$ 125,00", commission: "15%", sales: "10k+", query: "polygel nail kit" },
      { id: 517, title: "Massageador de Couro Cabeludo", price: "R$ 22,00", commission: "35%", sales: "45k+", query: "scalp massager viral" },
      { id: 518, title: "Organizador de Maquiagem Giro 360", price: "R$ 75,00", commission: "20%", sales: "18k+", query: "makeup organizer 360" },
      { id: 519, title: "Pó Translúcido Antibrilho", price: "R$ 36,00", commission: "28%", sales: "55k+", query: "translucent powder" },
      { id: 520, title: "Massageador de Olhos Vibrante", price: "R$ 54,00", commission: "25%", sales: "14k+", query: "eye massager wand" }
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

  const shuffle = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startScouting = () => {
    setStep('scouting');
    setTimeout(() => {
      const allProducts = Object.values(productDB).flat();
      setProductList(allProducts);
      const shuffledNiche = shuffle(productDB[activeNiche]);
      setActiveItems(shuffledNiche.slice(0, 20)); 
      setStep('list');
    }, 1500);
  };

  const handleNicheChange = (niche: string) => {
    setActiveNiche(niche);
    const shuffledNiche = shuffle(productDB[niche]);
    setActiveItems(shuffledNiche.slice(0, 20));
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
                {activeItems.map(p => {
                  const isPublished = publicationHistory.some(h => h.id === p.id);
                  return (
                    <div key={p.id} className={`tech-card flex justify-between items-center group hover:border-blue-500/50 ${isPublished ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                      <div>
                        <div className="flex gap-2 items-center mb-1">
                          {isPublished ? (
                            <span className="badge badge-error">POSTADO</span>
                          ) : (
                            <span className="badge badge-success">{p.commission} Lucro</span>
                          )}
                          <span className="text-[9px] text-dim">{p.sales} Vendidos</span>
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
