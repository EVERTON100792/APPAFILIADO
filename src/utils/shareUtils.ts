interface ShareItem {
  title: string;
  affiliate_link: string;
  price?: string;
}

export const generateWhatsappMessage = (item: ShareItem, storeSlug?: string) => {
  const priceDisplay = item.price ? `💰 *VALOR: R$ ${item.price.toString().replace('R$', '').trim()}* 💰` : "";
  
  const storeLink = storeSlug ? `\n\n🛍️ *CONFIRA MINHA BIO PARA MAIS ACHADINHOS:* \nhttps://appafiliado.netlify.app/?loja=${storeSlug}` : "";

  // Link isolado no topo para gerar o Card de Pré Visualização no WhatsApp
  const message = `${item.affiliate_link}
    
✨ *ACHADINHO SELECIONADO PRA VOCÊ!* ✨

📦 *${item.title.toUpperCase()}*
${priceDisplay}

✅ *Produto Verificado*
✅ *Melhor Preço do Dia*
✅ *Oferta por Tempo Limitado*

👇 *RESGATE SUA OFERTA AQUI:*
${item.affiliate_link}${storeLink}

⚠️ *Atenção: Os estoques da Shopee costumam esgotar rápido. Aproveite agora!*`;

  return message;
};
