export interface ViralScript {
  id: string;
  hook: string;
  presentation: string;
  cta: string;
  vibe: 'Agressivo' | 'Curiosidade' | 'Solução Direta' | 'Desejo';
}

const HOOKS = [
  "Para tudo! Você não vai acreditar no que eu achei...",
  "O segredo para transformar sua casa gastando quase nada...",
  "Testei o produto mais falado da internet e olha no que deu!",
  "Se você sofre com isso, esse vídeo é pra você...",
  "Achei o item mais satisfatório e útil de todos..."
];

const PRESENTATIONS = [
  "Olha como esse {{NOME}} funciona na prática! Absurdo...",
  "A qualidade desse {{NOME}} me deixou sem palavras real.",
  "E o melhor de tudo? Achei esse {{NOME}} num precinho secreto.",
  "Resolvi testar o famoso {{NOME}} e ele entrega tudo que promete.",
  "Veja por que todo mundo está comprando esse {{NOME}}."
];

const CTAS = [
  "Corra que tá acabando! Link na minha Bio.",
  "Comenta 'EU QUERO' que te mando o link agora!",
  "Quer economizar? Acesse o link exclusivo no meu perfil.",
  "Aproveite antes que o preço suba! Corre no link da bio.",
  "Não perca, acesse o link na bio e garanta o seu!"
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
  const selectedCTAs = shuffleArray(CTAS).slice(0, 3);
  const selectedVibes = shuffleArray(VIBES).slice(0, 3);

  return [0, 1, 2].map((i) => ({
    id: `script-${i + 1}-${Date.now()}`,
    vibe: selectedVibes[i],
    hook: selectedHooks[i],
    presentation: selectedPresentations[i].replace(/{{NOME}}/g, shortName),
    cta: selectedCTAs[i]
  }));
}
