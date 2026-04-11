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

  try {
    // @ts-ignore
    const appId = Deno.env.get("SHOPEE_APP_ID") || "18389670456";
    // @ts-ignore
    const secret = Deno.env.get("SHOPEE_SECRET") || "L4EDLOK2VQMQOZIPKLZPLSP7QTBEWFGK";
    
    console.log(`[Shopee] v1 Triggering ${req.method} with Action: ${req.url}`);

    const bodyStr = await req.text();
    if (!bodyStr) throw new Error("Empty request body");
    
    const { action, params } = JSON.parse(bodyStr) as ShopeeRequest;
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
      
      const detailUrl = `https://shopee.com.br/api/v4/item/get?itemid=${item_id}&shopid=${shop_id}`;
      console.log(`[Shopee] Fetching public item detail: ${detailUrl}`);
      
      const response = await fetch(detailUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        }
      });
      
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        result = { error: "Non-JSON response", message: responseText };
      }

      return new Response(JSON.stringify({ 
        success: true, 
        data: result.data || result,
        status: response.status 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      throw new Error(`Invalid action: ${action}`);
    }

    const payload = JSON.stringify({ query: graphqlQuery, variables });
    const signature = await generateV1Signature(appId, secret, timestamp, payload);
    const authHeader = `SHA256 Credential=${appId},Timestamp=${timestamp},Signature=${signature}`;

    console.log(`[Shopee] Sending GraphQL request to ${SHOPEE_GRAPHQL_URL}`);
    
    const response = await fetch(SHOPEE_GRAPHQL_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": authHeader
      },
      body: payload,
    });

    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      result = { error: "Non-JSON response", message: responseText };
    }

    console.log(`[Shopee] Result: HTTP ${response.status}`);
    
    // FALLBACK LOGIC: If Link Generation failed, build a Universal Tracking Link manually
    let finalData = result.data || result;
    
    // Check if we have a user identity for tracking
    const trackingId = params.user_shopee_id || appId;
    
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
