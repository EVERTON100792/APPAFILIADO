import { supabase } from "../supabaseClient";

export interface ShopeeProduct {
  item_id: number;
  shop_id: number;
  item_name: string;
  item_image: string;
  price: number;
  original_price: number;
  discount: number;
  commission_rate: number;
  commission: number;
  sales: number;
  shop_name: string;
  product_link: string;
  affiliate_link?: string;
}

export interface ShopeeSearchFilters {
  keyword: string;
  min_commission?: number;
  min_price?: number;
  max_price?: number;
  sort_by?: "sales" | "price" | "commission" | number;
  list_type?: number;
  page_number?: number;
}

export class ShopeeService {
  /**
   * Searches for products on Shopee using the Edge Function proxy.
   * Always converts productLinks to short links (s.shopee.com.br/xxx) to avoid
   * captcha pages and ensure proper affiliate tracking.
   */
  static async searchProducts(filters: ShopeeSearchFilters, userShopeeId?: string): Promise<ShopeeProduct[]> {
    let shopeeSort = filters.sort_by === "sales" ? 3 : 2;
    if (typeof filters.sort_by === "number") shopeeSort = filters.sort_by;

    const { data: result, error } = await supabase.functions.invoke("shopee-prod-search", {
      body: {
        action: "search_products",
        params: {
          keyword: filters.keyword || "",
          page_size: 50,
          page_number: filters.page_number || 1,
          sort_by: shopeeSort,
          list_type: filters.list_type || 0,
        },
      },
    });

    console.group(`🔍 Shopee Search: "${filters.keyword}"`);
    console.log("Filtros:", filters);

    if (error || !result?.success) {
      console.error("Erro na busca:", error || result?.error || result?.errors);
      console.groupEnd();
      throw error || new Error(result?.error || result?.errors?.[0]?.message || "Erro na busca da Shopee");
    }

    const nodes = result.data?.nodes || result.data?.productOfferV2?.nodes || [];
    console.log(`✅ Encontrados: ${nodes.length} itens`);
    console.groupEnd();

    if (nodes.length === 0) return [];

    // ── CONVERSÃO DE LINKS ────────────────────────────────────────────────────────
    // Sempre converter para shortLink (s.shopee.com.br/xxx).
    // O shortLink:
    //   1. Nunca aciona captcha
    //   2. Já tem rastreamento da conta de afiliado da API
    //   3. Redireciona corretamente para o app/site da Shopee
    const urlToShortLink = new Map<string, string>();

    const productLinks = nodes.map((n: any) => n.productLink).filter(Boolean) as string[];

    if (productLinks.length > 0) {
      try {
        // Sempre chamar generate_links, independente de ter userShopeeId
        const shortLinks = await this.convertLinks(productLinks, userShopeeId);
        productLinks.forEach((url: string, i: number) => {
          if (shortLinks[i]) {
            urlToShortLink.set(url, shortLinks[i]);
          }
        });
        console.log(`🔗 Short links gerados: ${urlToShortLink.size}/${productLinks.length}`);
      } catch (err) {
        // Em caso de falha na conversão, usar productLink original da API
        // (já tem rastreamento do app_id, porém é uma URL longa)
        console.warn("⚠️ Falha ao gerar short links — usando productLink original:", err);
      }
    }

    return nodes.map((item: any) => {
      let price = Number(item.price) || 0;
      let originalPrice = Number(item.originalPrice) || Number(item.price_before_discount) || price;

      // Correção de escala: API v2 às vezes retorna valores 100x maiores
      if (price >= 10000) {
        price = price / 100;
        if (originalPrice >= 10000) originalPrice = originalPrice / 100;
      }

      // Calcula desconto real (campo da API pode ser 0 mesmo com preço reduzido)
      let discount = Number(item.discount) || 0;
      if (discount === 0 && originalPrice > price && originalPrice > 0) {
        discount = Math.round((1 - price / originalPrice) * 100);
      }

      const commissionRate = Number(item.commissionRate) || 0;
      const itemId = item.itemId || item.item_id || 0;
      const shopId = item.shopId || item.shop_id || 0;
      const originalUrl = item.productLink || "";

      // Preferência de link: shortLink > productLink original da API
      // NUNCA usar createUniversalLink (URL bruta sem shortLink = captcha)
      let finalLink = urlToShortLink.get(originalUrl) || originalUrl;

      // Se ainda não tem link, construir URL direta limpa como último recurso
      if (!finalLink && shopId && itemId) {
        const base = `https://shopee.com.br/product/${shopId}/${itemId}`;
        const afParams = userShopeeId
          ? `?utm_source=an_${userShopeeId}&utm_medium=affiliates&af_siteid=an_${userShopeeId}`
          : "";
        finalLink = base + afParams;
      }

      return {
        item_id: itemId || Math.random(),
        shop_id: shopId,
        item_name: item.productName || item.product_name || item.item_name || "Produto Shopee",
        item_image: item.imageUrl || item.image_url || item.item_image || "",
        price,
        original_price: originalPrice,
        discount,
        commission_rate: Math.round(commissionRate * 100),
        commission: price * commissionRate || 0,
        sales: Number(item.sales) || Number(item.sold) || 0,
        shop_name: item.shop_name || item.shopName || "Shopee",
        product_link: finalLink,
      };
    });
  }

  /**
   * Converte uma lista de URLs em short links de afiliado (s.shopee.com.br/xxx).
   * O shortLink nunca aciona captcha e já carrega rastreamento de afiliado.
   */
  static async convertLinks(urls: string[], userShopeeId?: string): Promise<string[]> {
    const { data: result, error } = await supabase.functions.invoke("shopee-prod-search", {
      body: {
        action: "generate_links",
        params: {
          link_list: urls,
          user_shopee_id: userShopeeId,
        },
      },
    });

    if (error || !result?.success) {
      console.error("Erro ao converter links:", error || result?.error || result?.errors);
      throw error || new Error(result?.error || result?.errors?.[0]?.message || "Erro ao converter link");
    }

    const urlResult = result.data?.urlGenerate || result.data?.generate_link || result.data?.generateLink;
    const links = Array.isArray(urlResult) ? urlResult : [urlResult].filter(Boolean);

    // Prioridade: shortLink > originLink (shortLink é o link limpo s.shopee.com.br/xxx)
    return links
      .map((l: any) => l.shortLink || l.short_link || l.originLink || l.origin_link)
      .filter(Boolean);
  }

  /**
   * Busca detalhes completos de um produto (incluindo todas as imagens do carrossel).
   */
  static async getItemDetail(shopId: number, itemId: number): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke("shopee-prod-search", {
        body: {
          action: "get_item_detail",
          params: { shop_id: shopId, item_id: itemId },
        },
      });

      if (error || !data?.success) throw error || new Error("Falha ao buscar detalhe do produto");
        const out = data.data || {};
        out.edge_images = data.images || [];

        return out;
    } catch (error) {
      console.error("Erro ao buscar detalhe:", error);
      return null;
    }
  }

  /**
   * Busca um produto pelo Offer ID da plataforma de afiliados (ex: BBX-GNA-ZFX).
   */
  static async getProductByOfferId(offerId: string, userShopeeId?: string): Promise<ShopeeProduct[]> {
    const { data: result, error } = await supabase.functions.invoke("shopee-prod-search", {
      body: {
        action: "get_offer_by_id",
        params: { offer_id: offerId },
      },
    });

    if (error || !result?.success) {
      throw error || new Error(result?.error || "Erro ao buscar por Offer ID");
    }

    const nodes = result.data?.nodes || result.data?.productOfferV2?.nodes || [];
    if (nodes.length === 0) return [];

    const productLinks = nodes.map((n: any) => n.productLink).filter(Boolean) as string[];
    const urlToShortLink = new Map<string, string>();

    if (productLinks.length > 0) {
      try {
        const shortLinks = await this.convertLinks(productLinks, userShopeeId);
        productLinks.forEach((url: string, i: number) => {
          if (shortLinks[i]) urlToShortLink.set(url, shortLinks[i]);
        });
      } catch (_) { /* usa productLink original */ }
    }

    return nodes.map((item: any) => {
      let price = Number(item.price) || 0;
      if (price >= 10000) price = price / 100;
      const itemId = item.itemId || item.item_id || 0;
      const shopId = item.shopId || item.shop_id || 0;
      const originalUrl = item.productLink || "";
      const finalLink = urlToShortLink.get(originalUrl) || originalUrl;

      return {
        item_id: itemId,
        shop_id: shopId,
        item_name: item.productName || "Produto Shopee",
        item_image: item.imageUrl || "",
        price,
        original_price: price,
        discount: 0,
        commission_rate: Math.round((Number(item.commissionRate) || 0) * 100),
        commission: price * (Number(item.commissionRate) || 0),
        sales: Number(item.sales) || 0,
        shop_name: "Shopee",
        product_link: finalLink,
      };
    });
  }
}





