export interface ViralScript {
  id: string;
  hook: string;
  presentation: string;
  midroll: string;
  cta: string;
  vibe: 'Agressivo' | 'Curiosidade' | 'Solução Direta' | 'Desejo';
}

// Hooks universais que funcionam para qualquer produto
const HOOKS = [
  "POR QUE ninguém está falando sobre isso? 🤫🔥",
  "PARE de usar isso do jeito errado! ❌⚠️",
  "O segredo da Shopee que as influenciadoras ESCONDEM... 🤫💎",
  "Finalmente o achadinho que vai MUDAR sua vida! ✨",
  "Sua casa nunca mais será a mesma depois desse vídeo... 🏠😱",
  "Eu não acreditei quando vi o resultado disso! 👀👇",
  "O melhor investimento que fiz na Shopee esse ano! 💸✅",
  "ISSO aqui é pura tecnologia e você nem sabia! 🚀⚡",
  "Alerta de PRODUTO VIRAL! Garanta o seu antes que esgote. 📉",
  "Duvido você não querer um desses depois de ver isso! 👀",
  "Isso aqui resolveu um problema que eu nem sabia que tinha! 🧠",
  "O achado mais útil que você vai ver hoje, prometo! ✅",
  "Gente, eu tô sem palavras pra esse produtinho... 🙊",
  "Se você valoriza o seu tempo, você precisa disso aqui! ⏳",
  "O preço disso é brincadeira perto do que ele faz! 💸"
];

// Presentations universais
const PRESENTATIONS = [
  "Olha como esse [[NOME]] funciona na prática! 🚀",
  "A qualidade é simplesmente absurda, olha os detalhes...",
  "O acabamento é impecável e a entrega foi super rápida! ✨",
  "Super prático e resolve o problema de um jeito muito fácil.",
  "É o tipo de item que todo mundo deveria ter em casa. 🏠",
  "Fiquei surpresa com a durabilidade e o design premium.",
  "Além de lindo, é extremamente funcional. Nota 10/10!",
  "Olha só como ele facilita as tarefas mais chatas do dia.",
  "Eu testei e posso garantir: vale cada centavo! 💰",
  "O segredo da organização e sofisticação em um só item."
];

// Midrolls universais
const MIDROLLS = [
  "Dá uma olhada nos detalhes de perto... 🔍",
  "A melhor parte é como ele se adapta a qualquer lugar.",
  "Vem ver o material de alta resistência que eles usam.",
  "É muita tecnologia envolvida num produtinho só! ⚡",
  "Olha só como é fácil de usar e de guardar.",
  "Isso aqui mudou completamente meu jeito de organizar as coisas!"
];

// CTAs universais - Foco total em comentários para subir no algoritmo
const CTAS = [
  "Comenta 'EU QUERO' para receber o link exclusivo no Direct! 👇",
  "Link na Bio com 50% de DESCONTO por tempo limitado! 🏃‍♂️💨",
  "Diga 'EU QUERO' se você também precisa de um desse em casa! ✨",
  "Vem ver o preço inacreditável no Link na Bio! 💸",
  "Clique no Link na Bio para garantir o seu com FRETE GRÁTIS! 🚚",
  "Quer o link? Comenta 'EU QUERO' aqui embaixo agora! 👇",
  "Corra na Bio! Esse é o achado que você tanto procurava.",
  "Siga @perfil para mais achadinhos como esse todos os dias! 🛍️"
];

const VIBES: ViralScript['vibe'][] = ['Agressivo', 'Curiosidade', 'Solução Direta', 'Desejo'];

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function generateViralScripts(productName: string): ViralScript[] {
  const shortName = productName.split(" ").slice(0, 4).join(" ") + "...";
  
  const selectedHooks = shuffleArray(HOOKS).slice(0, 3);
  const selectedPresentations = shuffleArray(PRESENTATIONS).slice(0, 3);
  const selectedMidrolls = shuffleArray(MIDROLLS).slice(0, 2);
  const selectedCTAs = shuffleArray(CTAS).slice(0, 4);
  const selectedVibes = shuffleArray(VIBES).slice(0, 3);

  return [0, 1, 2].map((i) => ({
    id: `script-${i + 1}-${Date.now()}`,
    vibe: selectedVibes[i],
    hook: selectedHooks[i],
    presentation: selectedPresentations[i].replace(/\[\[NOME\]\]/g, shortName),
    midroll: selectedMidrolls[i],
    cta: selectedCTAs[i]
  }));
}