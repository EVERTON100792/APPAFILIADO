/**
 * Utilitário para garantir que os links da Shopee Brasil sigam os padrões de 2025.
 * Corrige erros comuns como utm_campaign=- e adiciona af_siteid obrigatório.
 */

export const sanitizeShopeeLink = (link: string, userShopeeId: string | undefined): string => {
  if (!link) return link;

  // Short links (s.shopee.com.br) são links limpos gerados pela API de afiliados.
  // Não devem ser modificados — já têm rastreamento embutido e nunca acionam captcha.
  if (link.includes('s.shopee.com.br') || link.includes('shope.ee')) {
    return link;
  }

  let sanitized = link;

  // Extrair URL interna de universal-link (formato legado)
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

  // 1. Remove utm_campaign (causa erro "Campanha Expirada")
  if (sanitized.includes('utm_campaign=')) {
    sanitized = sanitized.replace(/([&?])utm_campaign=[^&]+/, '');
  }

  // 2. Remove utm_content (pode causar conflitos)
  if (sanitized.includes('utm_content=')) {
    sanitized = sanitized.replace(/([&?])utm_content=[^&]+/, '');
  }

  // 3. Garante utm_source correto (an_[ID])
  if (!sanitized.includes('utm_source=an_')) {
    if (sanitized.includes('utm_source=')) {
      sanitized = sanitized.replace(/utm_source=[^&]+/, `utm_source=an_${userShopeeId}`);
    } else {
      const sep = sanitized.includes('?') ? '&' : '?';
      sanitized += `${sep}utm_source=an_${userShopeeId}`;
    }
  }

  // 4. Garante af_siteid (essencial para rastreamento no app)
  if (!sanitized.includes('af_siteid=')) {
    const sep = sanitized.includes('?') ? '&' : '?';
    sanitized += `${sep}af_siteid=an_${userShopeeId}`;
  }

  // 5. Garante utm_medium
  if (!sanitized.includes('utm_medium=')) {
    const sep = sanitized.includes('?') ? '&' : '?';
    sanitized += `${sep}utm_medium=affiliates`;
  }

  return sanitized;
};

/**
 * Cria um link de afiliado direto para o produto.
 * Usado apenas como fallback — prefira sempre usar shortLinks gerados pela API.
 */
export const createUniversalLink = (productUrl: string, userShopeeId: string, shopId?: number | string, itemId?: number | string): string => {
  const directProductUrl = shopId && itemId
    ? `https://shopee.com.br/product/${shopId}/${itemId}`
    : productUrl.split('?')[0];

  return `${directProductUrl}?utm_source=an_${userShopeeId}&utm_medium=affiliates&af_siteid=an_${userShopeeId}`;
};
