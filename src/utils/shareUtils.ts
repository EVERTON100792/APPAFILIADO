interface ShareItem {
  title: string;
  affiliate_link: string;
  price?: string;
}

export const generateWhatsappMessage = (item: ShareItem) => {
  const hooks = [
    "Gente, CHOCADA com esse achadinho! 😱",
    "Olha esse item que encontrei pra vocês! ✨",
    "Esse aqui resolve MINHA VIDA total! 😍",
    "Um dos meus favoritos desse mês! 🔥",
    "Vocês não têm noção da qualidade disso aqui! 💎",
    "Achadinho de OURO hoje no app! 🚀",
    "Sério, eu tava precisando MUITO de um desses! 👀",
    "Parem tudo e vejam essa maravilha! 🛑",
    "Achei o que faltava pra sua casa! 🏠",
    "Dica de milhões hoje, aproveitem! 💸"
  ];

  const descriptions = [
    "Qualidade premium e super prático pro dia a dia.",
    "Melhor custo-benefício que já vi nessa categoria.",
    "É aquele item 'tem que ter' que todo mundo quer.",
    "Acabou de chegar reposição, corre porque voa!",
    "Design lindo e entrega tudo que promete (e mais).",
    "Super resistente e com acabamento impecável.",
    "A solução perfeita pra facilitar sua rotina.",
    "Todo mundo que compra se apaixona pelo resultado.",
    "É o queridinho do momento nas redes sociais!",
    "Compacto, inteligente e extremamente funcional."
  ];

  const ctas = [
    "🛍️ COMPRE AQUI:",
    "🛒 LINK OFICIAL COM DESCONTO:",
    "👉 GARANTA O SEU AQUI:",
    "🔗 ACESSE O LINK PROMOCIONAL:",
    "🚩 LINK DA MINHA BIO:",
    "✨ VER DETALHES NO SITE:",
    "📦 PEÇA O SEU ANTES QUE ACABE:"
  ];

  const random = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  const promoHeader = `🔥 ${item.title.toUpperCase()} 🔥`;
  const priceDisplay = item.price ? `\n💰 VALOR: R$ ${item.price.replace('R$', '').trim()}\n` : "";
  
  const message = `${random(hooks)}\n\n${promoHeader}\n${priceDisplay}\n✅ ${random(descriptions)}\n✅ Testado e Aprovado\n\n${random(ctas)} ${item.affiliate_link}\n\nSiga meu perfil para mais achados como este! ✨`;

  return message;
};
