import { supabase } from "../supabaseClient";
import { sanitizeShopeeLink, createUniversalLink } from "../utils/shopeeLinkUtils";

export interface ShopeeProduct {
  item_id: number;
  shop_id: number;
  item_name: string;
  item_image: string;
  price: number;
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
  sort_by?: "sales" | "price" | "commission";
}

export class ShopeeService {
  /**
   * Searches for products on Shopee using the Edge Function proxy.
   */
  static async searchProducts(filters: ShopeeSearchFilters, userShopeeId?: string): Promise<ShopeeProduct[]> {
    const { data: result, error } = await supabase.functions.invoke("shopee-prod-search", {
      body: {
        action: "search_products",
        params: {
          keyword: filters.keyword || "", // Empty keyword = Trending
          page_size: 20,
          page_number: 1,
          sort_by: filters.sort_by || "sales",
        },
      },
    });

    if (error || !result?.success) {
      console.error("Error searching Shopee products:", error || result?.error || result?.errors);
      throw error || new Error(result?.error || result?.errors?.[0]?.message || "Erro na busca da Shopee");
    }

    const nodes = result.data?.productOfferV2?.nodes || [];
    if (nodes.length === 0) return [];

    // Melhorando a lógica de mapeamento: Criamos um mapa para garantir que o link encurtado 
    // corresponda exatamente ao produto original, mesmo que alguns produtos falhem.
    const urlToShortLink = new Map<string, string>();
    
    if (userShopeeId) {
      try {
        const urlList = nodes.map((n: any) => n.productLink).filter(Boolean);
        const resultLinks = await this.convertLinks(urlList, userShopeeId);
        
        // Mapeia o link original (originLink) para o link curto retornado pela API
        // A API de links da Shopee retorna originLink no objeto, vamos usar isso.
        urlList.forEach((url: string, i: number) => {
          if (resultLinks[i]) {
            urlToShortLink.set(url, resultLinks[i]);
          }
        });
      } catch (err) {
        console.error("Erro ao encurtar links em lote:", err);
      }
    }
    
    return nodes.map((item: any) => {
      const price = Number(item.price) || 0;
      const commissionRate = Number(item.commissionRate) || 0;
      const originalUrl = item.productLink || "";
      
      // 1. Tenta o link curto oficial da API (s.shopee.com.br)
      let finalLink = urlToShortLink.get(originalUrl) || "";
      
      // 2. HIGIENIZAÇÃO: Se o link vier da Edge Function com parametros inválidos, nós consertamos aqui
      if (finalLink && userShopeeId) {
        finalLink = sanitizeShopeeLink(finalLink, userShopeeId);
      }

      // 3. Se não temos link curto, gera o UNIVERSAL LINK Robusto
      if (!finalLink && userShopeeId && originalUrl) {
        finalLink = createUniversalLink(originalUrl, userShopeeId);
      }

      // 4. Fallback final
      if (!finalLink) finalLink = originalUrl;

      return {
        item_id: item.itemId || Math.random(),
        shop_id: 0,
        item_name: item.productName || "Produto Shopee",
        item_image: item.imageUrl || "",
        price: price, 
        commission_rate: commissionRate * 100,
        commission: (price * commissionRate) || 0,
        sales: 0,
        shop_name: "Shopee",
        product_link: finalLink,
      };
    });
  }

  /**
   * Generates affiliate links for a list of Shopee URLs.
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
      console.error("Error converting Shopee links:", error || result?.error || result?.errors);
      throw error || new Error(result?.error || result?.errors?.[0]?.message || "Erro ao converter link");
    }

    // GraphQL v1 returns data: { urlGenerate: [...] } or { generate_link: [...] }
    const urlResult = result.data?.urlGenerate || result.data?.generate_link || result.data?.generateLink;
    const links = Array.isArray(urlResult) ? urlResult : [urlResult].filter(Boolean);
    return links.map((l: any) => l.short_link || l.shortLink || l.originLink || l.origin_link).filter(Boolean);
  }

}
