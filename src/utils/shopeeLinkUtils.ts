/**
 * Utilitário para garantir que os links da Shopee Brasil sigam os padrões de 2025.
 * Corrige erros comuns como utm_campaign=- e adiciona af_siteid obrigatório.
 */

export const sanitizeShopeeLink = (link: string, userShopeeId: string | undefined): string => {
  if (!link) return link;
  if (!userShopeeId) return link;

  let sanitized = link;

  // 1. Corrige o erro crítico de campanha expirada (utm_campaign=-)
  if (sanitized.includes('utm_campaign=-')) {
    sanitized = sanitized.replace('utm_campaign=-', 'utm_campaign=viral_squad');
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

  // 4. Garante utm_medium e utm_campaign se estiverem ausentes
  if (!sanitized.includes('utm_medium=')) {
    sanitized += `&utm_medium=affiliates`;
  }
  if (!sanitized.includes('utm_campaign=')) {
    sanitized += `&utm_campaign=viral_squad`;
  }

  return sanitized;
};

/**
 * Converte um link de produto puro em um Universal Link robusto.
 */
export const createUniversalLink = (productUrl: string, userShopeeId: string): string => {
  const baseUrl = productUrl.split('?')[0];
  const encodedUrl = encodeURIComponent(baseUrl);
  return `https://shopee.com.br/m/universal-link?url=${encodedUrl}&utm_source=an_${userShopeeId}&utm_medium=affiliates&utm_campaign=viral_squad&af_siteid=an_${userShopeeId}`;
};
