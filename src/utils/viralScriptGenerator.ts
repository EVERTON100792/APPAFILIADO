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
  "Para tudo! Olha só o que eu achei...",
  "O negócio mais incrível que você vai ver hoje...",
  "Você não vai acreditar nisso...",
  "O segredo que ninguém te conta...",
  "Testei e olha no que deu...",
  "Achei e preciso te mostrar!",
  "Vem ver essa belezinha...",
  "Olha esse achado insano!",
  "Esse resolve minha vida toda...",
  "Gente, olha isso!",
  "Você precisa ver isso!",
  "Achei o melhor do mercado!",
  "Olha o tamanho disso...",
  "Testado e aprovado!",
  "Não acredito que era tão bom!",
  "Preciso te mostrar isso...",
  "Olha só que lindo!",
  "Não believes quanto é bom!",
  "Vem seeing o que chegou!"
];

// Presentations universais sem referência a tempo/dias
const PRESENTATIONS = [
  "Olha como [[NOME]] funciona na prática!",
  "A qualidade é absurda, olha só...",
  "Olha só como ficou lindo!",
  "A qualidade étop, simplesmente incr.",
  "Olha o acabamento perfeito!",
  "Isso aqui é muito bem feito.",
  "Super prático e funciona mt bem!",
  "A qualidade surpreende siempre!",
  "É lindo e funciona perfeitamente!",
  "Recomendo muito esse produto!"
];

// Midrolls universais
const MIDROLLS = [
  "Detalhes importantes...",
  "Olha só como é feito...",
  "E a melhor parte...",
  "Vem ver de perto como é...",
  "Olha só que demais!",
  "Isso é demais!"
];

// CTAs universais
const CTAS = [
  "Corre que está acabando! Link na minha Bio.",
  "Comenta 'EU QUERO' que te mando o link!",
  "Quer economizar? Acesse o link agora!",
  "Aproveita antes que o preço sube!",
  "Não perca,Link na Bio agora!",
  "Link na Bio! Corre!",
  "Clique na Bio agora!",
  "Corre que é oferta!",
  "Garantindo no link agora!",
  "Acesse agora mesmo!"
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