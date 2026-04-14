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

  private static magneticHooks = [
    "VOCÊ NÃO VAI ACREDITAR nesse achadinho! 😱",
    "Finalmente encontrei o que eu precisava! ✨",
    "Isso aqui mudou minha rotina, sério! 🔥",
    "O melhor custo-benefício da Shopee hoje. 👇",
    "Duvido você encontrar algo mais útil que isso! ✅",
    "Alerta de preço baixo! 📉 Corra antes que acabe.",
    "Todo mundo está perguntando onde eu comprei... 👀",
    "O item que faltava na sua casa chegou! 🏠",
    "Pare de gastar dinheiro com o que não funciona! 🛑"
  ];

  private static benefits = [
    "Qualidade premium e preço que cabe no bolso.",
    "Design moderno e super funcional para o dia a dia.",
    "O item mais viral do momento com desconto exclusivo.",
    "Prático, resistente e estiloso. Você vai amar!",
    "Item indispensável para quem busca praticidade.",
    "Economize tempo e dinheiro com essa solução!"
  ];

  public static generateCopy(productName: string, price: string, niche: string = 'default', storeSlug: string = 'meu-link'): VideoCopy {
    const hook = this.magneticHooks[Math.floor(Math.random() * this.magneticHooks.length)];
    const benefit = this.benefits[Math.floor(Math.random() * this.benefits.length)];
    const selectedNiche = this.hashtagsByNiche[niche.toLowerCase()] || this.hashtagsByNiche.default;
    
    // Shuffle and pick 8 hashtags for TikTok
    const tiktokHashtags = [...selectedNiche, ...this.hashtagsByNiche.default]
      .sort(() => 0.5 - Math.random())
      .slice(0, 8);

    const tiktokText = `${hook}\n\n${productName}\n\n${benefit}\n\n💸 Apenas ${price}\n\n🛒 Link na Bio!\n\nSiga @${storeSlug.replace(/@/g, '')} para mais achadinhos! 🛍️`;
    
    // Shopee Caption (Max 150 chars) - Growth Optimized
    const shopeeBase = `${productName.substring(0, 45)}... por apenas ${price}! 😱`;
    const shopeeCTA = ` Link na Bio!`;
    const shopeeTags = ` #shopeevideo #achadinhos #promo`;
    
    let shopee = `${shopeeBase}${shopeeCTA}${shopeeTags}`;
    
    if (shopee.length > 150) {
      // Radical trim if still too long
      shopee = `${productName.substring(0, 30)}... apenas ${price}! Link na Bio! #shopee`.substring(0, 150);
    }

    return {
      shopeeCaption: shopee,
      tiktokCaption: tiktokText,
      hashtags: tiktokHashtags
    };
  }
}
