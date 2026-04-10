interface ShareItem {
  title: string;
  affiliate_link: string;
  price?: string;
}

export const generateWhatsappMessage = (item: ShareItem, storeSlug?: string) => {
  const priceDisplay = item.price ? `💰 *VALOR: R$ ${item.price.toString().replace('R$', '').trim()}* 💰` : "";
  
  const storeLink = storeSlug ? `\n\n🛍️ *VEJA MAIS NA MINHA VITRINE:* \nhttps://appafiliado.netlify.app/?loja=${storeSlug}` : "";

  // Link ISOLADO no topo é o segredo para a foto aparecer no WhatsApp Web/PC
  const message = `${item.affiliate_link}
    
🔥 *${item.title.toUpperCase()}* 🔥
${priceDisplay}
✅ *Oportunidade Única*
✅ *Qualidade Garantida*

👉 *COMPRE AQUI:*
${item.affiliate_link}${storeLink}

Siga meu perfil para não perder os próximos achadinhos! ✨`;

  return message;
};
