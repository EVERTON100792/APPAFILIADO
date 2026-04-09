export const calculateViralScore = (views: number, likes: number, comments: number): number => {
  // Normalized formula based on the user's requested (views * 0.6) + (likes * 0.3) + (comments * 0.1)
  const rawScore = (views * 0.6) + (likes * 0.3) + (comments * 0.1);
  return rawScore; 
};

export const getScoreBadge = (views: number, likes: number, comments: number) => {
  const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
  
  if (views > 1000000 && engagementRate > 8) {
    return { text: '🔥 MUITO VIRAL', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', score: 99 };
  } else if (views > 100000 && engagementRate > 4) {
    return { text: '🔥 VIRAL', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', score: 85 };
  } else if (views > 10000 && engagementRate > 2) {
    return { text: '⚠️ MÉDIO', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', score: 65 };
  } else {
    return { text: '❌ FRACO', color: 'text-slate-400 bg-slate-400/10 border-slate-400/20', score: 30 };
  }
};

export const generateViralCaption = (category: string, title?: string): string => {
  const hooks = [
    "🚨 ESSE VÍDEO TÁ EXPLODINDO AGORA",
    "Você não vai acreditar nisso 😳",
    "O segredo que ninguém te conta 🤫",
    "Acabei de descobrir isso e tô chocado 😱",
    "Sério, olha isso até o final! 🔥"
  ];

  const ctas = [
    "Segue pra não perder mais nada! 🔥",
    "Clica no link da bio pra saber mais! 🚀",
    "Já manda pra aquele amigo que precisa ver isso! 👇",
    "Salve o vídeo pra não esquecer! 📌",
    "Comenta aqui o que você achou 👇"
  ];

  const baseHashtags = ["#viral", "#fyp", "#trend", "#foryou"];
  
  let nicheHashtags = [];
  const normalizedCategory = (category || "").toLowerCase();
  
  if (normalizedCategory.includes('cozinha') || normalizedCategory.includes('home')) {
    nicheHashtags = ["#shopee", "#achadinhos", "#cozinha", "#casa"];
  } else if (normalizedCategory.includes('tech') || normalizedCategory.includes('celular')) {
    nicheHashtags = ["#tecnologia", "#gadgets", "#dicas", "#tech"];
  } else if (normalizedCategory.includes('beleza') || normalizedCategory.includes('saude')) {
    nicheHashtags = ["#beleza", "#skincare", "#autocuidado", "#glowup"];
  } else {
    nicheHashtags = ["#dica", "#novidade", "#viralvideo"];
  }

  const selectedHook = hooks[Math.floor(Math.random() * hooks.length)];
  const selectedCta = ctas[Math.floor(Math.random() * ctas.length)];
  const hashtags = [...baseHashtags, ...nicheHashtags].join(" ");
  
  const midText = title ? `${title}\n\n` : "";

  return `${selectedHook}\n${midText}${selectedCta}\n\n${hashtags}`;
};
