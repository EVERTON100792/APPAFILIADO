export interface VideoCopy {
  shopeeCaption: string;
  tiktokCaption: string;
  hashtags: string[];
}

export class Copywriter {
  private static viralHashtags = [
    "#shopee", "#achadinhos", "#produtinhos", "#comprinhas", "#casa", "#utilidades",
    "#achadinhosshopee", "#shopeebr", "#viral", "#foryou", "#shopeevideo", "#decoração"
  ];

  private static magneticHooks = [
    "POR QUE ninguém está falando sobre isso? 🤫🔥",
    "PARE de usar isso do jeito errado! ❌⚠️",
    "O segredo da Shopee que as influenciadoras ESCONDEM... 🤫💎",
    "Finalmente o achadinho que vai MUDAR sua vida! ✨",
    "Sua casa nunca mais será a mesma depois desse vídeo... 🏠😱",
    "Eu não acreditei quando vi o resultado disso! 👀👇",
    "O melhor investimento que fiz na Shopee esse ano! 💸✅",
    "ISSO aqui é pura tecnologia e você nem sabia! 🚀⚡",
    "Alerta de PRODUTO VIRAL! Garanta o seu antes que esgote. 📉",
    "Duvido você não querer um desses depois de ver isso! 👀"
  ];

  private static emotionalBenefits = [
    "Transforme sua rotina com elegância e praticidade absurda.",
    "O toque de sofisticação que você e sua casa merecem.",
    "Qualidade PREMIUM testada e aprovada por milhares de pessoas.",
    "Beleza, durabilidade e o MELHOR PREÇO que você já viu!",
    "Resolva aquele problema chato de uma vez por todas agora.",
    "Sinta o prazer de ter o que há de mais moderno na palma da sua mão!"
  ];

  private static emotionalCTAs = [
    "Comenta 'EU QUERO' para receber o link exclusivo! 👇",
    "Link na Bio antes que o cupom de 50% expire! 🏃‍♂️💨",
    "Vem ver o preço inacreditável no Link na Bio! 💸",
    "Clique no Link na Bio e garanta o seu com FRETE GRÁTIS! 🚚",
    "Corra na Bio! Esse é o achado que você tanto procurava."
  ];

  public static generateCopy(productName: string, price: string, nicheId: string = 'default', storeSlug: string = 'meu-link'): VideoCopy {
    const hook = this.magneticHooks[Math.floor(Math.random() * this.magneticHooks.length)];
    const benefit = this.emotionalBenefits[Math.floor(Math.random() * this.emotionalBenefits.length)];
    const cta = this.emotionalCTAs[Math.floor(Math.random() * this.emotionalCTAs.length)];
    
    // TikTok Caption: High Engagement Style
    const tiktokText = `${hook}\n\n${productName.toUpperCase()}\n\n${benefit}\n\n💸 Apenas ${price}\n\n✨ ${cta}\n\nSiga @${storeSlug.replace(/@/g, '')} para mais achadinhos! 🛍️`;
    
    // Shopee Caption (Max 150 chars) - Growth Optimized
    const shopeeBase = `${productName.substring(0, 45)}... por apenas ${price}! 😱`;
    const shopeeCTA = ` Digite EU QUERO!`;
    const shopeeTags = ` #shopeevideo #achadinhos #viral`;
    
    let shopee = `${shopeeBase}${shopeeCTA}${shopeeTags}`;
    
    if (shopee.length > 150) {
      shopee = `${productName.substring(0, 35)}... apenas ${price}! Link na Bio! #shopee`.substring(0, 150);
    }

    // Gerar mix de hashtags (Viral + Nicho)
    const shuffled = [...this.viralHashtags].sort(() => 0.5 - Math.random());
    const selectedTags = shuffled.slice(0, 6);

    return {
      shopeeCaption: shopee,
      tiktokCaption: tiktokText,
      hashtags: selectedTags
    };
  }
}
