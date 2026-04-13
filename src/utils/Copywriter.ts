export interface VideoCopy {
  shopeeCaption: string;
  tiktokCaption: string;
  hashtags: string[];
}

export class Copywriter {
  private static hashtagsByNiche: Record<string, string[]> = {
    eletronicos: ["#tecnologia", "#setup", "#gadgets", "#eletronicos", "#gamer", "#techbrasil"],
    moda: ["#modafeminina", "#lookdodia", "#estilo", "#fashion", "#shopeebr", "#provador"],
    casa: ["#decoração", "#casa", "#limpeza", "#organização", "#dicasdecasa", "#cozinha"],
    beleza: ["#skincare", "#maquiagem", "#beleza", "#autocuidado", "#perfume", "#makebrasil"],
    utilidades: ["#utilidades", "#shopee", "#achadinhos", "#comprinhas", "#casaorganizada"],
    kids: ["#maededois", "#mundoazul", "#mundorosa", "#brinquedos", "#maternidade", "#bebe"],
    pet: ["#cachorro", "#gato", "#petshop", "#maedepet", "#amomeupet"],
    default: ["#shopee", "#achadinhos", "#comprinhas", "#oferta", "#promoção", "#brasil"]
  };

  private static hooks = [
    "VOCÊ NÃO VAI ACREDITAR nesse achadinho! 😱",
    "Finalmente encontrei o que eu precisava! ✨",
    "Isso aqui mudou minha rotina, sério! 🔥",
    "O melhor custo-benefício da Shopee hoje. 👇",
    "Duvido você encontrar algo mais útil que isso! ✅",
    "Alerta de preço baixo! 📉 Corra antes que acabe.",
    "Todo mundo está perguntando onde eu comprei... 👀",
    "O item que faltava na sua casa chegou! 🏠"
  ];

  private static benefits = [
    "Qualidade premium e preço que cabe no bolso.",
    "Design moderno e super funcional para o dia a dia.",
    "O item mais viral do momento com desconto exclusivo.",
    "Prático, resistente e estiloso. Você vai amar!",
    "Item indispensável para quem busca praticidade."
  ];

  public static generateCopy(productName: string, price: string, niche: string = 'default'): VideoCopy {
    const hook = this.hooks[Math.floor(Math.random() * this.hooks.length)];
    const benefit = this.benefits[Math.floor(Math.random() * this.benefits.length)];
    const selectedNiche = this.hashtagsByNiche[niche.toLowerCase()] || this.hashtagsByNiche.default;
    
    // Shuffle and pick 5 hashtags
    const hashtags = [...selectedNiche, ...this.hashtagsByNiche.default]
      .sort(() => 0.5 - Math.random())
      .slice(0, 8);

    const fullText = `${hook}\n\n${productName}\n\n${benefit}\n\n💸 Apenas ${price}\n\n🛒 Link na Bio!`;
    
    // Shopee Caption (Max 150 chars)
    let shopee = `${productName} por apenas ${price}! 😱 Link na Bio! #shopee #achadinhos`;
    if (shopee.length > 150) {
      shopee = `${productName.substring(0, 50)}... apenas ${price}! Link na Bio!`.substring(0, 150);
    }

    return {
      shopeeCaption: shopee,
      tiktokCaption: fullText,
      hashtags: hashtags
    };
  }
}
