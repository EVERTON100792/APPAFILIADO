// @ts-ignore: Deno type definitions not found in Node environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShopeeRequest {
  action: "search_products" | "generate_links" | "get_item_detail";
  params: any;
}

// Shopee Affiliate v1 (Legacy) Configuration
const SHOPEE_GRAPHQL_URL = "https://open-api.affiliate.shopee.com.br/graphql";

// @ts-ignore: Deno global only available at runtime
const APP_ID = Deno.env.get("SHOPEE_APP_ID") || "18389670456";
// @ts-ignore: Deno global only available at runtime
const SECRET = Deno.env.get("SHOPEE_SECRET") || "L4EDLOK2VQMQOZIPKLZPLSP7QTBEWFGK";

async function generateV1Signature(appId: string, secret: string, timestamp: number, body: string): Promise<string> {
  // Signature = SHA256(AppID + Timestamp + Payload + Secret)
  const baseString = `${appId}${timestamp}${body}${secret}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(baseString);
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
  
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join("");
}

// @ts-ignore: Deno global only available at runtime
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Skip auth check - allow public access for this function
  // The function will work with or without auth header

  try {
    console.log(`[Shopee] v1 Triggering ${req.method} with Action: ${req.url}`);

    const bodyStr = await req.text();
    if (!bodyStr) throw new Error("Empty request body");
    
    let action: string = "";
    let params: any = {};
    
    try {
      const parsed = JSON.parse(bodyStr);
      action = parsed.action || "";
      params = parsed.params || {};
    } catch (e) {
      action = "search_products";
      params = {};
    }
    
    const timestamp = Math.floor(Date.now() / 1000);
    
    let graphqlQuery = "";
    let variables = {};

    if (action === "introspection") {
      graphqlQuery = `
        query {
          queryType: __type(name: "Query") {
            fields {
              name
            }
          }
        }
      `;
    } else if (action === "search_products") {
      const listType = params.list_type || 0;
      
      graphqlQuery = `
        query productOfferV2($keyword: String, $page: Int, $limit: Int, $listType: Int, $sortType: Int) {
          productOfferV2(keyword: $keyword, page: $page, limit: $limit, listType: $listType, sortType: $sortType) {
            nodes {
              itemId
              shopId
              productName
              productLink
              imageUrl
              price
              commissionRate
              sales
            }
          }
        }
      `;
      variables = {
        keyword: params.keyword || "",
        page: params.page_number || 1,
        limit: params.page_size || 20,
        listType: listType,
        sortType: params.sort_by || 2
      };
    } else if (action === "generate_links") {
      graphqlQuery = `
        mutation urlGenerate($urlList: [String!]!) {
          urlGenerate(urlList: $urlList) {
            shortLink
            originLink
          }
        }
      `;
      variables = {
        urlList: params.link_list || []
      };
    } else if (action === "get_item_detail") {
      const { item_id, shop_id } = params;
      if (!item_id || !shop_id) throw new Error("Missing item_id or shop_id");
      
      let images: string[] = [];
      let result: any = null;
      
      console.log(`[Shopee] Bypassing API to scrape HTML for: ${item_id}`);
      
      try {
        const htmlUrl = `https://shopee.com.br/product/${shop_id}/${item_id}`;
        const resHtml = await fetch(htmlUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
            "Accept": "text/html"
          }
        });
        const html = await resHtml.text();
        const matches = [...html.matchAll(/"images":(\[.*?\])/g)];
        
        for (let i = 0; i < matches.length; i++) {
           try {
             const arr = JSON.parse(matches[i][1]);
             if (arr.length > images.length) {
                images = arr;
             }
           } catch(e) {}
        }
        
        console.log(`[Shopee] Scraped ${images.length} images from HTML`);
        
        // Mock a result structure if needed
        result = { item: { images: images } };
      } catch (err) {
         console.log("[Shopee] Failed to fetch HTML:", err);
      }

      // If HTML failed, we could try the fallback endpoints, but they are returning 90309999 anyway.
      
      return new Response(JSON.stringify({ 
        success: true, 
        data: result,
        images: images,
        status: 200 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      throw new Error(`Invalid action: ${action}`);
    }

    const payload = JSON.stringify({ query: graphqlQuery, variables });
    const signature = await generateV1Signature(APP_ID, SECRET, timestamp, payload);
    const authHeader = `SHA256 Credential=${APP_ID},Timestamp=${timestamp},Signature=${signature}`;

    console.log(`[Shopee] Sending GraphQL request to ${SHOPEE_GRAPHQL_URL}`);
    
    let response;
    let responseText;
    let result;
    
    try {
      response = await fetch(SHOPEE_GRAPHQL_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": authHeader
        },
        body: payload,
      });
      
      responseText = await response.text();
      result = JSON.parse(responseText);
    } catch (fetchError: any) {
      console.error("[Shopee] GraphQL fetch error:", fetchError.message);
      
      // Fallback: Search using public Shopee API
      console.log("[Shopee] Using public API fallback for search");
      const searchKeyword = params.keyword || "";
      const searchUrl = `https://shopee.com.br/api/v4/search/search_items?by=sales&limit=50&newest=0&keyword=${encodeURIComponent(searchKeyword)}&order=desc&page_type=search`;
      
      const fallbackResponse = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
        }
      });
      
      const fallbackText = await fallbackResponse.text();
      const fallbackData = JSON.parse(fallbackText);
      
      const items = fallbackData.items?.map((item: any) => ({
        itemId: item.item_id,
        shopId: item.shop_id,
        productName: item.name,
        productLink: `https://shopee.com.br/product/${item.shop_id}/${item.item_id}`,
        imageUrl: `https://cf.shopee.com.br/file/${item.image?.hash || item.image}`,
        price: item.price / 100000,
        price_before_discount: item.price_before_discount / 100000 || item.price / 100000,
        discount: item.discount || 0,
        commissionRate: 0.12,
        sales: item.sold || 0,
      })) || [];
      
      return new Response(JSON.stringify({ 
        success: true, 
        data: { nodes: items },
        error: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`[Shopee] Result: HTTP ${response.status}`);
    
    // FALLBACK LOGIC: If Link Generation failed, build a Universal Tracking Link manually
    let finalData = result.data || result;
    
    // Check if we have a user identity for tracking
    const trackingId = params.user_shopee_id || APP_ID;
    
    if (action === "generate_links" && (!finalData.urlGenerate || finalData.errors)) {
      console.log(`[Shopee] GraphQL urlGenerate failed/empty. Applying Universal Link Fallback with trackingId: ${trackingId}`);
      const links = params.link_list.map((url: string) => {
        // Universal Link pattern for Shopee Brazil Affiliate
        const cleanUrl = url.split('?')[0];
        return {
          shortLink: `${cleanUrl}?utm_source=an_${trackingId}&utm_medium=affiliates&af_siteid=an_${trackingId}`,
          originLink: url,
          is_fallback: true
        };
      });
      finalData = { urlGenerate: links };
    }
    
    // Flatten data for easier access and ensure success flag
    const searchData = finalData.productOfferV2 || finalData;
    
    console.log(`[Shopee] Returning success. Nodes found: ${searchData?.nodes?.length || 0}`);

    return new Response(JSON.stringify({ 
      success: true, 
      status: response.status, 
      data: searchData,
      errors: result.errors
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[Shopee] Fatal Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});


