export function getSmartSearchName(title: string): string {
  if (!title) return '';
  
  // 1. Limpar caracteres especiais e lixo de marketplace agressivo
  let cleanTitle = title.split(/[-,\(\)\[\]|]/)[0]; 
  
  // 2. Termos técnicos que NÃO podem ser removidos (Power Words)
  const powerWords = [
    'levitação', 'magnética', 'magnético', 'usb', 'led', 'bluetooth', 
    'portátil', 'mini', 'inteligente', 'smart', 'flutuante', 'gamer', 'rgb',
    'projetor', 'mixer', 'umidificador', 'aspirador', 'escova', 'fone', 'caixa',
    'relógio', 'relógio', 'massageador', 'máquina', 'removedor', 'suporte',
    'organizador', 'luminária', 'ventilador', 'processador', 'triturador'
  ];
  
  // 3. Remover termos que poluem a busca e trazem resultados de baixa qualidade
  const marketJunk = [
    'promoção', 'oferta', 'queima', 'estoque', 'barato', 'shopee', 'link', 'bio', 
    'brasil', 'br', 'kit', 'conjunto', 'pacote', 'unidade', 'und', 'pcs', 'peças', 
    'peça', 'novo', 'nova', 'original', 'oficial', 'compre', 'aqui', 'clique', 
    'veja', 'olha', 'frete', 'grátis', 'pronta', 'entrega', 'envio', 'imediato',
    'atacado', 'varejo', 'premium', 'luxo', 'exclusivo', 'importado', 'envio em 24h',
    'shope', 'shein', 'aliexpress', 'mercadolivre', 'magalu', 'colorido', 
    'super', 'ultra', 'top', 'melhor'
  ];
  
  const regexJunk = new RegExp(`\\b(${marketJunk.join('|')})\\b`, 'gi');
  cleanTitle = cleanTitle.replace(regexJunk, ' ').trim();

  // 4. Remover emojis e caracteres não alfanuméricos
  cleanTitle = cleanTitle.replace(/[^\w\sÀ-ú0-9]/gi, ' ');
  
  // 5. Filtrar palavras curtas e stop words, mas MANTER as power words
  const stopWords = new Set([
    'a', 'o', 'e', 'de', 'do', 'da', 'em', 'para', 'com', 'os', 'as', 'um', 'uma', 
    'na', 'no', 'que', 'dos', 'das', 'seu', 'sua', 'pelo', 'pela', 'como', 'mais',
    'com', 'seu', 'sua', 'tipo', 'seu'
  ]);
  
  let words = cleanTitle.split(/\s+/).filter(w => {
    const low = w.toLowerCase();
    return (w.length > 2 && !stopWords.has(low)) || powerWords.includes(low);
  });
  
  // Garantir que a primeira palavra seja significativa (não um "Mini" que esquecemos)
  if (words.length > 1) {
    const genericAdjectives = ['mini', 'grande', 'portatil', 'portátil', 'colorido', 'pequeno', 'medio', 'médio', 'top'];
    if (genericAdjectives.includes(words[0].toLowerCase())) {
      // Rotaciona para dar prioridade ao substantivo
      const adjunct = words.shift();
      if (adjunct) words.push(adjunct);
    }
  }

  if (words.length === 0) return title.substring(0, 30).trim();

  return words.slice(0, 5).join(' ').trim();
}

export function generateViralProductName(baseName: string): string {
  const clean = getSmartSearchName(baseName);
  if (!clean) return baseName.toUpperCase();

  const prefixes = [
    '😱 O FAMOSO', '✨ A INCRÍVEL', '🚨 CHEGOU!', '🏆 MAIS VENDIDO', '💎 ACHADINHO DE HOJE', 
    '🔥 REVELADO!', '🛑 VOCÊ PRECISA DISSO!', '👀 GENTE! OLHA ISSO', '🏠 O SEGREDO DO LAR:', 
    '🌟 O QUERIDINHO:', '🧨 PRODUTO VIRAL', '🎯 A MELHOR COMPRA:', '💖 JÁ QUERIA UM:',
    '⚡ ESSE É DIFERENTE', '🔊 VIROU FEBRE!', '💎 O MELHOR ACHADO', '💡 ISSO É GENIAL!',
    '📢 UTILIDADE PÚBLICA', '👑 MEU FAVORITO:', '🎀 DICA DE AMIGA:', '⚡ PROMOÇÃO RELÂMPAGO'
  ];
  
  const suffixes = [
    ' 🔥', ' ✨', ' [DÁ UMA OLHADA! 😱]', ' [O MELHOR QUE JÁ VI]', ' [OFERTA RELÂMPAGO ⚡]', 
    ' [VOCÊ VAI AMAR!]', ' (RECOMENDO MUITO)', ' ✨ MELHOR DO DIA', ' 💎 QUALIDADE PREMIUM',
    ' - SÉRIO, É PERFEITO!', ' (ACHADO DE OURO)', ' ✅ TESTADO E APROVADO'
  ];

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  // Forçando Maiúsculas conforme pedido do usuário
  const fullName = `${prefix} ${clean.toUpperCase()}${suffix}`;
  
  return fullName.length > 85 ? `${prefix} ${clean.toUpperCase()} 🔥` : fullName;
}
