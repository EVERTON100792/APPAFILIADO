/**
 * Utilitário para garantir que os links da Shopee Brasil sigam os padrões de 2025.
 * Corrige erros comuns como utm_campaign=- e adiciona af_siteid obrigatório.
 */

export const sanitizeShopeeLink = (link: string, userShopeeId: string | undefined): string => {
  if (!link) return link;

  let sanitized = link;

  if (sanitized.includes('shopee.com.br/universal-link') || sanitized.includes('shopee.com.br/m/universal-link')) {
    try {
      const parsedUrl = new URL(sanitized);
      const originalProductUrl = parsedUrl.searchParams.get('url');

      if (originalProductUrl) {
        sanitized = decodeURIComponent(originalProductUrl);
      }
    } catch {
      sanitized = sanitized
        .replace('https://shopee.com.br/m/universal-link?url=', '')
        .replace('https://shopee.com.br/universal-link?url=', '');
    }
  }

  if (!userShopeeId) return sanitized;

  // 1. Corrige o erro crítico de campanha expirada
  if (sanitized.includes('utm_campaign=')) {
    // Removemos qualquer parâmetro de campanha para evitar o erro 'Expirada'
    sanitized = sanitized.replace(/([&?])utm_campaign=[^&]+/, '');
  }

  if (sanitized.includes('utm_content=')) {
    sanitized = sanitized.replace(/([&?])utm_content=[^&]+/, '');
  }
  
  // 2. Garante que o utm_source seja an_[ID] e não contenha o '-'
  if (!sanitized.includes('utm_source=an_')) {
    // Se já tem utm_source mas está errado, tentamos substituir ou adicionar
    if (sanitized.includes('utm_source=')) {
       // Regex para substituir qualquer utm_source existente pelo correto
       sanitized = sanitized.replace(/utm_source=[^&]+/, `utm_source=an_${userShopeeId}`);
    } else {
       const separator = sanitized.includes('?') ? '&' : '?';
       sanitized += `${separator}utm_source=an_${userShopeeId}`;
    }
  }

  // 3. Garante o af_siteid (essencial para redirecionamento no app e evitar erros)
  if (!sanitized.includes('af_siteid=')) {
    const separator = sanitized.includes('?') ? '&' : '?';
    sanitized += `${separator}af_siteid=an_${userShopeeId}`;
  }

  // 4. Garante utm_medium se estiver ausente
  if (!sanitized.includes('utm_medium=')) {
    const separator = sanitized.includes('?') ? '&' : '?';
    sanitized += `${separator}utm_medium=affiliates`;
  }

  return sanitized;
};

/**
 * Converte uma URL de produto em um link de afiliado universal da Shopee.
 * Preservamos a URL original do produto dentro do parâmetro `url` para evitar
 * redirecionamentos para a home da Shopee.
 */
export const createUniversalLink = (productUrl: string, userShopeeId: string, shopId?: number | string, itemId?: number | string): string => {
  const directProductUrl = shopId && itemId
    ? `https://shopee.com.br/product/${shopId}/${itemId}`
    : productUrl.split('?')[0];

  return `${directProductUrl}?utm_source=an_${userShopeeId}&utm_medium=affiliates&af_siteid=an_${userShopeeId}`;
};
