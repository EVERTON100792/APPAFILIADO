/**
 * Utilitário para garantir que os links da Shopee Brasil sigam os padrões de 2025.
 * Corrige erros comuns como utm_campaign=- e adiciona af_siteid obrigatório.
 */

export const sanitizeShopeeLink = (link: string, userShopeeId: string | undefined): string => {
  if (!link) return link;
  if (!userShopeeId) return link;

  let sanitized = link;

  // 1. Corrige o erro crítico de campanha expirada
  if (sanitized.includes('utm_campaign=')) {
    // Removemos qualquer parâmetro de campanha para evitar o erro 'Expirada'
    sanitized = sanitized.replace(/([&?])utm_campaign=[^&]+/, '');
  }
  
  // Remove o /m/ se existir na URL universal para usar a versão mais compatível
  if (sanitized.includes('shopee.com.br/m/universal-link')) {
    sanitized = sanitized.replace('shopee.com.br/m/universal-link', 'shopee.com.br/universal-link');
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
    sanitized += `&utm_medium=affiliates`;
  }

  return sanitized;
};

/**
 * Converte um link de produto puro em um Universal Link robusto.
 * Usamos o formato direto 'shopee.com.br/universal-link' sem o /m/ e sem campanha 
 * para evitar o erro de 'Campanha Expirada' do Shopee Brasil.
 */
export const createUniversalLink = (productUrl: string, userShopeeId: string): string => {
  const baseUrl = productUrl.split('?')[0];
  const encodedUrl = encodeURIComponent(baseUrl);
  // Removido o /m/ e removido o utm_campaign
  return `https://shopee.com.br/universal-link?url=${encodedUrl}&utm_source=an_${userShopeeId}&utm_medium=affiliates&af_siteid=an_${userShopeeId}`;
};
