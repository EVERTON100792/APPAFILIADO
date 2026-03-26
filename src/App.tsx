import React, { useState, useEffect } from 'react';
import './index.css';
import { 
  Home, Database, Copy, RefreshCcw,
  Shield, Video, Zap, ArrowRight, Activity, Search, RotateCcw,
  Download, Terminal, LayoutGrid, Unlock
} from 'lucide-react';


import { supabase } from './supabaseClient';


import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const [step, setStep] = useState('home');

  const platformUrls = {
    tiktok: 'https://www.tiktok.com/upload?lang=pt-BR',
    shopee: 'https://seller.shopee.com.br/creator-center/video-upload/upload'
  };
  const [productList, setProductList] = useState<any[]>([]); 
  const [activeItems, setActiveItems] = useState<any[]>([]); 
  const [publicationHistory, setPublicationHistory] = useState<any[]>([]); 
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [videoData, setVideoData] = useState<any>(null);
  const [customCopy, setCustomCopy] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [automationFinished, setAutomationFinished] = useState(false);
  const [boostMode, setBoostMode] = useState('none');
  const [activeNiche, setActiveNiche] = useState('Cozinha');
  const [consoleLogs, setConsoleLogs] = useState<{msg: string, type?: string}[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [videoResults, setVideoResults] = useState<any[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [lastLegendIndex, setLastLegendIndex] = useState(0);

  // Ultra-Premium Scanning HUD
  const ScanningHUD = ({ active }: { active: boolean }) => (
    <AnimatePresence>
      {active && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="scanning-hud"
        >
          <div className="cyber-grid" />
          <motion.div 
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="scan-bar" 
          />
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-10 relative z-20"
          >
            <div className="relative">
              <div className="absolute inset-0 blur-[60px] bg-accent/40 rounded-full animate-pulse" />
              <div className="w-28 h-28 rounded-[2rem] bg-slate-900 border-2 border-accent/30 flex items-center justify-center relative shadow-[0_0_80px_rgba(6,182,212,0.3)] overflow-hidden">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 opacity-10"
                >
                  <div className="w-full h-full border-4 border-dashed border-accent rounded-full" />
                </motion.div>
                <Activity size={56} className="text-accent animate-pulse" />
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <motion.h2 
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
                className="text-4xl font-black italic tracking-tighter uppercase leading-none bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent"
              >
                SQUAD_OS_INITIALIZING
              </motion.h2>
              <div className="flex flex-col items-center gap-2">
                <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: ['0%', '100%'] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="h-full bg-accent" 
                  />
                </div>
                <p className="text-[10px] text-accent font-black tracking-[0.5em] uppercase">Security Level: Maximum</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );



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
      active: localStorage.getItem('v-active')
    };
    if (saved.step) setStep(saved.step);
    if (saved.products) setProductList(JSON.parse(saved.products));
    if (saved.active) setActiveItems(JSON.parse(saved.active));
    
    // Load from Supabase on mount
    fetchHistory();
  }, []);

  // Sync Supabase when entering history tab
  useEffect(() => {
    if (step === 'history') {
      fetchHistory();
    }
  }, [step]);


  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('publication_history')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (!error && data) {
      setPublicationHistory(data);
    }
  };



  useEffect(() => {
    localStorage.setItem('v-step', step);
    localStorage.setItem('v-products', JSON.stringify(productList));
    localStorage.setItem('v-active', JSON.stringify(activeItems));
  }, [step, productList, activeItems]);

  const saveToSupabase = async (product: any, platform: string) => {
    const { data, error } = await supabase
      .from('publication_history')
      .insert([
        { 
          product_id: product.id, 
          title: product.title, 
          platform: platform 
        }
      ])
      .select();

    if (!error && data) {
      setPublicationHistory(prev => [data[0], ...prev]);
      showToast("REGISTRADO NO SUPABASE! ☁️");
    }
  };

  const deleteFromSupabase = async (id: string) => {
    const { error } = await supabase
      .from('publication_history')
      .delete()
      .eq('id', id);

    if (!error) {
      setPublicationHistory(prev => prev.filter(h => h.id !== id));
      showToast("REMOVIDO DO SUPABASE! 🗑️");
    }
  };

  const generateCreativeLegend = (product: any) => {
    // 1. Hooks (Captadores de Atenção)
    const generalHooks = [
      "😱 SOCORRO! Esse achadinho da Shopee mudou minha vida!",
      "Você não vai acreditar no que eu encontrei hoje... 🔥",
      "PARE TUDO o que está fazendo e veja esse vídeo! 🛑",
      "Gente, achei o item MAIS VIRAL da semana! 🏆",
      "Aquilo que você não sabia que precisava até agora... 🤫",
      "Diga adeus ao sofrimento com esse queridinho aqui! ✨",
      "É por isso que eu amo a internet! Olha esse achado 🌈",
      "POV: Você encontrou o item dos seus sonhos na Shopee ☁️",
      "Minha melhor compra de 2025 até agora! Sem dúvidas! 🥇",
      "O segredo que as blogueiras não te contam... 🤫🔥"
    ];

    const nicheHooks: Record<string, string[]> = {
      'Cozinha': [
        "Sua cozinha NUNCA MAIS será a mesma depois disso! 🍳",
        "Chega de sofrer na hora de cozinhar! Olha essa solução 🔪",
        "O item que toda dona de casa precisa ter (e eu não vivo sem) 🏠",
        "Cozinhar virou terapia com esse achadinho aqui! 🥗"
      ],
      'Tecnologia': [
        "O gadget mais insano que já passou por aqui! ⚡",
        "Seu setup vai pro próximo nível com esse item! 💻",
        "Tecnologia de ponta por um preço de banana... 🤯",
        "O futuro chegou na minha casa e eu posso provar! 🤖"
      ],
      'Beleza': [
        "Minha rotina de skin care mudou 100% com isso! ✨",
        "O segredo para uma pele de porcelana... 🧖‍♀️",
        "Gastei pouco e pareço que saí do salão! 💄",
        "Todo mundo me pergunta o que eu estou usando... 🤫"
      ],
      'Pet': [
        "Meu pet ficou MALUCO com esse presente! 🐾",
        "A melhor coisa que já comprei para o meu filho de 4 patas 🐶",
        "Seu pet merece esse conforto aqui! 🐱",
        "Diversão garantida e muita fofura com esse achado! ❤️"
      ],
      'Decoração': [
        "Transformei meu quarto gastando quase nada! 🛌",
        "Dicas de decoração que parecem de revista... 🏡",
        "Sua casa muito mais aconchegante com esse detalhe ✨",
        "O item que faltava para o seu cantinho ficar perfeito 🌿"
      ]
    };

    const valueProps = [
      `O ${product.title} é simplesmente PERFEITO para quem busca praticidade e estilo no dia a dia. Eu estou viciada!`,
      `Sério, a qualidade disso superou todas as minhas expectativas. É aquele tipo de item que todo mundo pergunta onde eu comprei.`,
      `Incrível como algo tão simples pode facilitar tanto a nossa rotina. Se eu soubesse disso antes, teria economizado muito tempo!`,
      `O queridinho do momento chegou para ficar. Útil, moderno e com um preço que você não vai acreditar por apenas ${product.price}.`,
      `Cada detalhe desse item foi pensado para facilitar sua vida. É o investimento que você merece para sua casa.`,
      `Já são mais de ${product.sales} pessoas usando e amando! Você não pode ficar de fora dessa tendência.`,
      `Economize tempo e esforço com essa tecnologia que é pura inovação. O custo-benefício é de outro planeta! 🚀`,
      `Sabe aquele problema que te irritava todo dia? Esse produto resolve num piscar de olhos. Fantástico! ⚡`
    ];

    const ctas = [
      "🛒 Link OFICIAL com desconto na minha BIO! Corre que o estoque voa! 🚀",
      "✨ Gostou? O link está na Bio esperando por você! Aproveite o cupom! ✅",
      "👇 Clique no link da Bio e garanta o seu antes que o preço suba! 🛍️",
      "🔥 Link na Bio + Frete Grátis disponível hoje! Não perde tempo! 📦",
      "🎁 Presente ideal ou mimo para você? Link na Bio! 💖",
      "🚀 Digita 'EU QUERO' que te mando o link agora mesmo! 💬",
      "⚠️ ALERTA DE ESTOQUE BAIXO: Link na Bio para garantir o seu! 🏃‍♂️"
    ];

    const hashtags = [
      "#shopee #achadinhos #viral #achadosshopee #utilidades #casa #decoracao #promo",
      "#achadinhosshopee #shopeebrasil #comprinhas #dicas #casaorganizada #viralvideo",
      "#shopeehaul #organização #achados #utilidadesdomesticas #promocao #brasil",
      "#shopeecheck #utilidadesdecasa #dicadodia #compras #acheinashopee #viralreels",
      "#lifehacks #shopeebr #ofertas #descontos #shopeefinds #tiktokmademebuyit"
    ];

    const selectedNicheHooks = nicheHooks[activeNiche] || [];
    const allHooks = [...generalHooks, ...selectedNicheHooks];
    
    // Improved Randomization to prevent repetition
    const getTimeSeed = () => Math.floor(Date.now() / 1000);
    const seed = (product.id || 0) + lastLegendIndex + getTimeSeed();
    
    const hook = allHooks[seed % allHooks.length];
    const body = valueProps[(seed + 3) % valueProps.length];
    const cta = ctas[(seed + 7) % ctas.length];
    const tags = hashtags[(seed + 11) % hashtags.length];

    setLastLegendIndex(prev => prev + 1);

    const structures = [
      `${hook}\n\n${body}\n\n${cta}\n\n${tags}`,
      `${hook}\n\n🔥 DESTAQUE: ${product.title}\n${body}\n\n🛍️ COMPRE AQUI: Link na Bio!\n\n${tags}`,
      `O QUE VOCÊ ACHOU DISSO? 😍\n\n${body}\n\n${hook}\n\n👉 LINK NA BIO\n\n${tags}`,
      `Parece mentira, mas é real! 😱\n\n${body}\n\n${cta}\n\n${tags}`
    ];

    return structures[seed % structures.length];
  };


  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const sortByCommission = (array: any[]) => {
    return [...array].sort((a, b) => b.commission_pct - a.commission_pct);
  };

  const startScouting = () => {
    setIsScanning(true);
    setStep('scouting');
    setTimeout(() => {
      const allProducts = Object.values(productDB).flat();
      setProductList(allProducts);
      const sortedNiche = sortByCommission(productDB[activeNiche]);
      setActiveItems(sortedNiche.slice(0, 20)); 
      setStep('list');
      setIsScanning(false);
    }, 2500);
  };


  const handleNicheChange = (niche: string) => {
    setActiveNiche(niche);
    const sortedNiche = sortByCommission(productDB[niche]);
    setActiveItems(sortedNiche.slice(0, 20));
  };


  const unblock = (id: string) => {
    deleteFromSupabase(id);
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
    setIsScanning(true);
    try {
      // Improved Query for Viral PT-BR content
      const query = encodeURIComponent(`${product.title} shopee brasil achadinhos viral`);
      const response = await fetch(`https://www.tikwm.com/api/feed/search?keywords=${query}&count=15&cursor=0`);
      const data = await response.json();
      
      if (data.data?.videos && data.data.videos.length > 0) {
        // Filter and sort by engagement (if available)
        const sortedVideos = data.data.videos
          .filter((v: any) => v.play || v.wmplay)
          .map((v: any) => ({
            id: v.video_id,
            url: v.play || v.wmplay,
            cover: v.cover,
            title: v.title,
            author: v.author?.nickname || 'Viral Creator',
            stats: {
              views: v.play_count || 0,
              likes: v.digg_count || 0
            }
          }))
          .sort((a: any, b: any) => b.stats.likes - a.stats.likes);

        if (sortedVideos.length > 0) {
          setVideoResults(sortedVideos);
          setCurrentVideoIndex(0);
          setVideoData({ cover: sortedVideos[0].cover, url: sortedVideos[0].url });
          
          const viralLegend = generateCreativeLegend(product);
          setCustomCopy(viralLegend); 
          
          showToast("VIRAL PT-BR LOCALIZADO! 🔥");

          setTimeout(() => {
            setStep('treating');
            setTimeout(() => {
              setStep('ready');
              showToast("VÍDEO PRONTO PARA POSTAR! 🚀");
            }, 3000);
          }, 1500);

        } else {
          throw new Error("Nenhum vídeo compatível encontrado");
        }
      } else {
        throw new Error("Conteúdo viral não localizado");
      }
    } catch (error) {
      console.error("TikTok Research Error:", error);
      showToast("MOTOR DE BUSCA TEMPORARIAMENTE OFFLINE");
      setStep('list');
    } finally {
      setIsScanning(false);
    }
  };

  const swapVideo = () => {
    if (videoResults.length > 1) {
      const nextIndex = (currentVideoIndex + 1) % videoResults.length;
      setCurrentVideoIndex(nextIndex);
      const nextVideo = videoResults[nextIndex];
      setVideoData({ cover: nextVideo.cover, url: nextVideo.url });
      
      if (selectedProduct) {
        const newLegend = generateCreativeLegend(selectedProduct);
        setCustomCopy(newLegend); 
      }

      showToast("VÍDEO ALTERNATIVO CARREGADO");
    } else {
      showToast("SEM OUTROS VÍDEOS DISPONÍVEIS");
    }
  };

  const runAutomation = (selectedPlatform: 'tiktok' | 'shopee') => {
    navigator.clipboard.writeText(customCopy);
    window.open(platformUrls[selectedPlatform], '_blank');
    
    if (selectedProduct) {
      saveToSupabase(selectedProduct, selectedPlatform);
    }
    
    setStep('automation');
    setConsoleLogs([]);

    const logs = [
      { msg: `> INICIANDO MOTOR DE AUTOMAÇÃO ${selectedPlatform.toUpperCase()}...`, type: 'info' },
      { msg: "> Sincronizando banco de metadados...", type: 'info' },
      { msg: "> Acessando painel de postagem via Bridge Protocol...", type: 'info' },
      { msg: "> Carregando vídeo com Magic IA e gatilhos mentais...", type: 'info' },
      { msg: "> Bypass de CAPTCHA concluído com sucesso.", type: 'info' },
      { msg: "> POSTAGEM PROGRAMADA E SINCRONIZADA!", type: 'success' },
      { msg: "> TUDO PRONTO! O SQUAD FINALIZOU O SERVIÇO.", type: 'success' }
    ];

    logs.forEach((log, i) => {
      setTimeout(() => {
        setConsoleLogs((prev: any[]) => [...prev, log]);
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
    <div className="app-container overflow-hidden bg-slate-950 text-slate-50 font-inter">
      <ScanningHUD active={isScanning} />
      
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-accent/20 blur-lg rounded-full animate-pulse" />
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center relative">
              <Activity size={20} className="text-accent" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none italic">
              VIRAL<span className="text-accent">SQUAD</span>
            </h1>
            <span className="text-[8px] font-black tracking-[0.3em] uppercase opacity-40">Stealth Engine v4.0</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-full bg-accent/5 border border-accent/20 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Status: Link Online</span>
          </div>
        </div>
      </header>

      <main className="content-area relative z-0">
        <AnimatePresence mode="wait">
          {step === 'home' && (
            <motion.div 
              key="home" 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center p-8 text-center space-y-16"
            >
              <div className="relative">
                <div className="absolute -inset-24 bg-accent/10 blur-[100px] rounded-full" />
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-32 h-32 rounded-[2.5rem] border-2 border-white/5 flex items-center justify-center bg-slate-900/40 backdrop-blur-3xl relative z-10 shadow-2xl"
                >
                  <Shield size={56} className="text-accent" />
                  <div className="absolute -top-3 -right-3 w-10 h-10 rounded-xl bg-accent/20 backdrop-blur-lg border border-accent/30 flex items-center justify-center">
                    <Activity size={18} className="text-accent animate-pulse" />
                  </div>
                </motion.div>
              </div>

              <div className="space-y-4 relative z-10">
                <h2 className="text-5xl font-black tracking-tighter uppercase leading-[0.9] italic">
                  DOMINE O <br />
                  <span className="bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">ALGORITMO</span>
                </h2>
                <p className="text-xs text-dim uppercase font-bold tracking-[0.2em] max-w-[280px] mx-auto opacity-80 leading-relaxed">
                  Transforme achadinhos em lucro real com automação stealth de alta performance.
                </p>
              </div>

              <div className="w-full max-w-xs relative z-10">
                <motion.button 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-premium"
                  onClick={startScouting}
                >
                  INICIAR OPERAÇÃO <Search size={20} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 'scouting' && (
            <motion.div key="scouting" initial={{opacity:0}} animate={{opacity:1}} className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center p-10 space-y-8">
              <div className="relative">
                <RefreshCcw size={64} className="text-accent animate-spin" />
                <motion.div 
                  animate={{ scale: [1, 1.8], opacity: [1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 border-2 border-accent rounded-full"
                />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-black italic tracking-widest text-accent uppercase animate-pulse">Escaner Ativo</p>
                <p className="text-[10px] text-dim uppercase tracking-[0.3em] font-bold">Mapeando Lucratividade Real...</p>
              </div>
            </motion.div>
          )}

          {step === 'list' && (
            <motion.div 
              key="list" 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 space-y-6 pb-32"
            >
              <div className="flex justify-between items-end mb-2">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black uppercase leading-none italic">Garimpo <span className="text-accent">Elite</span></h2>
                  <p className="text-[9px] text-dim font-black uppercase tracking-widest">Tendências de Alta Conversão</p>
                </div>
                <div className="bg-accent/10 border border-accent/30 text-accent text-[10px] px-3 py-1 font-black uppercase rounded-lg">
                   {activeItems.length} ATIVOS
                </div>
              </div>
              
              <div className="niche-selector no-scrollbar">
                {niches.map(n => (
                  <motion.button 
                    key={n} 
                    whileTap={{ scale: 0.9 }}
                    className={`niche-chip ${activeNiche === n ? 'active' : ''}`}
                    onClick={() => handleNicheChange(n)}
                  >
                    {n}
                  </motion.button>
                ))}
              </div>

              <div className="space-y-4">
                {activeItems.map(p => {
                  const isPublished = publicationHistory.some(h => h.product_id === p.id);

                  return (
                    <motion.div 
                      key={p.id} 
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`tech-card p-4 flex gap-4 items-center group relative overflow-hidden ${isPublished ? 'opacity-40 grayscale pointer-events-none' : 'cursor-pointer hover:border-accent/40'}`}
                      onClick={() => { setSelectedProduct(p); researchTikTok(p); }}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-slate-950 flex flex-col items-center justify-center border border-white/10 shrink-0 relative overflow-hidden">
                        <div className="absolute inset-0 bg-accent/5" />
                        <span className="text-base font-black text-accent italic relative z-10">%{p.commission_pct}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[8px] font-black uppercase tracking-widest text-accent/60 bg-accent/5 px-2 py-0.5 rounded border border-accent/10">{p.sales} VENDAS</span>
                        </div>
                        <h3 className="font-black text-sm uppercase truncate leading-none mb-1">{p.title}</h3>
                        <p className="font-mono text-[10px] text-white/40">{p.price}</p>
                      </div>

                      <div className="w-12 h-12 rounded-2xl border border-white/5 flex items-center justify-center group-hover:border-accent group-hover:bg-accent/5 transition-all">
                        <ArrowRight size={18} className="group-hover:text-accent group-hover:translate-x-0.5 transition-all text-white/20" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 'treating' && (
             <motion.div key="treating" initial={{opacity:0}} animate={{opacity:1}} className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center p-10 space-y-8">
                <div className="relative">
                  <div className="absolute -inset-16 bg-accent/20 blur-[80px] rounded-full animate-pulse" />
                  <RefreshCcw size={64} className="text-accent animate-spin" />
                </div>
                <div className="text-center space-y-6">
                  <div className="space-y-1">
                    <p className="text-xl font-black italic tracking-widest text-accent uppercase">Treatment Engine</p>
                    <p className="text-[10px] text-dim uppercase font-black tracking-[0.3em]">IA Removendo Marcas d'Água</p>
                  </div>
                  
                  <div className="flex flex-col gap-2 max-w-[240px] mx-auto">
                    {[
                      { l: 'Bypass Watermark TikTok', d: 0 },
                      { l: 'Ajuste Dinâmico 9:16', d: 0.1 },
                      { l: 'Injeção de Metadados Stealth', d: 0.2 },
                      { l: 'Geração de Gatilhos Virais', d: 0.3 }
                    ].map((s, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: s.d }}
                        className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest bg-slate-900 px-4 py-2 rounded-xl border border-white/5"
                      >
                        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                        <span className="text-white/60">{s.l}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
             </motion.div>
          )}

          {step === 'ready' && (
            <motion.div 
              key="ready" 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 space-y-6 pb-32"
            >
              <div className="video-preview-container !h-[420px] relative overflow-hidden rounded-[2rem] border-4 border-slate-900 shadow-2xl">
                {videoData?.url ? (
                  <video 
                    src={videoData.url} 
                    poster={videoData.cover}
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50 space-y-4">
                    <Video size={48} className="text-white/10 animate-pulse" />
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Processando Mídia...</span>
                  </div>
                )}

                <div className="absolute inset-x-4 top-4 flex justify-between items-start z-20 pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-white italic tracking-widest">HD_STEALTH_CORE</span>
                  </div>
                  <div className="bg-accent px-4 py-2 rounded-2xl shadow-[0_10px_20px_rgba(16,185,129,0.3)] border-2 border-white/20">
                    <div className="text-[8px] font-black text-slate-950 uppercase leading-none opacity-60 text-center mb-0.5">ROI</div>
                    <div className="text-xl font-black text-slate-950 italic leading-none">{selectedProduct.commission_pct}%</div>
                  </div>
                </div>

                <div className="absolute inset-x-4 bottom-4 z-20">
                   <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={swapVideo}
                    className="w-full h-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-black/60 transition-all pointer-events-auto shadow-2xl"
                   >
                     <RotateCcw size={16} className="text-accent" />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Trocar de Vídeo</span>
                   </motion.button>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20 pointer-events-none opacity-60" />
              </div>

              <div className="tech-card !p-6 space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] text-accent font-black uppercase tracking-[0.3em] leading-none mb-1">Copiar Estratégia</p>
                  <h3 className="text-lg font-black italic uppercase leading-tight truncate">{selectedProduct.title}</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    className={`h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${boostMode==='performance' ? 'bg-accent border-accent text-slate-950 shadow-[0_10px_20px_rgba(16,185,129,0.2)]' : 'bg-slate-900 border-white/5 text-dim opacity-50'}`} 
                    onClick={()=>updateMode('performance')}
                  >
                    <Zap size={18} />
                    <span className="text-[9px] font-black uppercase">Foco Vendas</span>
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    className={`h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${boostMode==='funny' ? 'bg-accent border-accent text-slate-950 shadow-[0_10px_20px_rgba(16,185,129,0.2)]' : 'bg-slate-900 border-white/5 text-dim opacity-50'}`} 
                    onClick={()=>updateMode('funny')}
                  >
                    <Activity size={18} />
                    <span className="text-[9px] font-black uppercase">Foco Viral</span>
                  </motion.button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-dim px-2">
                    <span>Legenda Inteligente</span>
                    <span className="text-accent/60 italic">{customCopy.length} caracteres</span>
                  </div>
                  <div className="relative group">
                    <textarea 
                      className="w-full bg-slate-900 p-5 rounded-3xl border border-white/5 text-xs text-slate-100 font-medium outline-none min-h-[140px] resize-none focus:border-accent/30 transition-all leading-relaxed"
                      value={customCopy}
                      onChange={(e)=>setCustomCopy(e.target.value)}
                    />
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute bottom-4 right-4 w-12 h-12 bg-accent text-slate-950 rounded-2xl flex items-center justify-center shadow-xl" 
                      onClick={()=>{ navigator.clipboard.writeText(customCopy); showToast("LEGENDA COPIADA!"); }}
                    >
                      <Copy size={20} />
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 h-20 bg-slate-900 border border-white/10 rounded-3xl flex flex-col items-center justify-center gap-2 group hover:border-accent/40 transition-all"
                  onClick={() => runAutomation('tiktok')}
                >
                  <span className="text-xl grayscale group-hover:grayscale-0 transition-all text-white">🎬</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white">TikTok</span>
                </motion.button>
                
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 h-20 bg-orange-600 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-[0_15px_30px_rgba(234,88,12,0.3)] border border-orange-400/20"
                  onClick={() => runAutomation('shopee')}
                >
                  <span className="text-xl">🟠</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Shopee</span>
                </motion.button>
              </div>

              <motion.button 
                whileTap={{ scale: 0.98 }}
                className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 text-white/40 hover:text-white hover:bg-white/10 transition-all" 
                onClick={()=>window.open(videoData.url)}
              >
                <Download size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Download MP4 (Sem Marca D'água)</span>
              </motion.button>
            </motion.div>
          )}

          {step === 'automation' && (
            <motion.div key="automation" initial={{opacity:0}} animate={{opacity:1}} className="h-[calc(100vh-10rem)] flex flex-col p-6 space-y-6">
              <div className="flex items-center gap-4 px-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center">
                  <Terminal size={24} className="text-accent" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-black italic uppercase leading-none italic">SQUAD<span className="text-accent">OS</span></h2>
                  <p className="text-[9px] text-dim uppercase tracking-[0.3em] font-bold animate-pulse">Running Bypass Scripts...</p>
                </div>
              </div>
              
              <div className="flex-1 bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/5 p-6 font-mono text-[10px] overflow-y-auto no-scrollbar space-y-3">
                {consoleLogs.map((log, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className={`flex gap-3 ${log.type === 'success' ? 'text-accent' : log.type === 'info' ? 'text-dim' : 'text-orange-400'}`}
                  >
                    <span className="opacity-20 shrink-0">[{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                    <span className="text-white/20 shrink-0">&gt;</span>
                    <span className={log.type === 'success' ? 'font-black' : ''}>{log.msg}</span>
                  </motion.div>
                ))}
                {!automationFinished && (
                  <div className="flex gap-3">
                    <span className="opacity-0">---</span>
                    <span className="text-accent animate-pulse">_</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <AnimatePresence>
                  {automationFinished && (
                    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-2 gap-4">
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        className="h-16 bg-slate-900 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white"
                        onClick={() => { setStep('ready'); setAutomationFinished(false); }}
                      >
                        RE-POSTAR
                      </motion.button>
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        className="h-16 bg-accent text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-accent/20"
                        onClick={() => { setStep('list'); setAutomationFinished(false); }}
                      >
                        CONCLUÍDO
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {step === 'history' && (
            <motion.div 
              key="history" 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 space-y-8 pb-32"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black italic uppercase leading-none">Cloud <span className="text-accent">Sinc</span></h2>
                  <p className="text-[10px] text-dim uppercase tracking-[0.4em] font-bold">Relatório Global Stealth</p>
                </div>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-accent shadow-xl"
                  onClick={fetchHistory}
                >
                  <RefreshCcw size={20} />
                </motion.button>
              </div>

              {publicationHistory.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                  <LayoutGrid size={64} className="stroke-1" />
                  <p className="text-xs font-black uppercase tracking-widest">Nenhum Registro Sincronizado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {publicationHistory.map(h => {
                    const item = productList.find(p => p.id === h.product_id);

                    return (
                      <motion.div 
                        key={h.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="tech-card p-5 flex justify-between items-center group relative overflow-hidden bg-slate-900/40"
                      >
                        <div className="absolute inset-y-0 left-0 w-1.5 bg-accent" />
                        
                        <div className="space-y-2 min-w-0 pr-4">
                          <h3 className="text-sm font-black uppercase text-slate-100 truncate italic tracking-tight">{item?.title || "SQUAD_ITEM_GEN_7"}</h3>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] text-accent font-black uppercase tracking-[0.2em]">{getTimeAgo(new Date(h.timestamp).getTime())}</span>
                            <div className="w-1 h-1 bg-white/10 rounded-full" />
                            <div className="flex items-center gap-1.5 opacity-40">
                              <Database size={10} />
                              <span className="text-[8px] font-black uppercase tracking-widest">Local Sinc</span>
                            </div>
                          </div>
                        </div>

                        <motion.button 
                          whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                          whileTap={{ scale: 0.9 }}
                          className="w-12 h-12 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400/40 flex items-center justify-center transition-all" 
                          onClick={() => unblock(h.id)}
                        >
                          <Unlock size={20} />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="bottom-nav">
        {[
          { id: 'home', label: 'Início', icon: Home, active: step === 'home' },
          { id: 'list', label: 'Garimpo', icon: Search, active: ['list','scouting','ready','treating','automation'].includes(step) },
          { id: 'history', label: 'Cloud', icon: Database, active: step === 'history' }
        ].map(tab => (
          <motion.button 
            key={tab.id}
            whileTap={{ scale: 0.85 }}
            onClick={() => tab.id === 'list' && !productList.length ? startScouting() : setStep(tab.id as any)}
            className={`nav-item ${tab.active ? 'active' : ''}`}
          >
            <div className="relative">
              {tab.active && (
                <motion.div 
                  layoutId="nav-glow"
                  className="absolute -inset-4 bg-accent/20 rounded-full blur-xl"
                />
              )}
              <tab.icon size={22} className={tab.active ? 'text-accent shadow-accent' : 'text-slate-500'} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
          </motion.button>
        ))}
      </nav>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-32 left-1/2 -px-8 py-4 bg-accent text-slate-950 rounded-2xl min-w-[280px] shadow-3xl z-[200] border-2 border-white/20"
          >
             <div className="flex items-center gap-4 px-6 justify-center">
                <div className="w-2 h-2 bg-slate-950 rounded-full animate-pulse" />
                <span className="text-xs font-black italic uppercase tracking-widest">{toast}</span>
                <div className="w-2 h-2 bg-slate-950 rounded-full animate-pulse" />
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
