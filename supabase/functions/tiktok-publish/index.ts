import { serve } from "std/http/server.ts";
import { createClient } from "supabase";

const TIKTOK_CLIENT_KEY = "sbawcxdrytk259in36";
const TIKTOK_CLIENT_SECRET = "0rXgdOjTZtclTNLaxvaLn3Opdf8OLlg9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_KEY") || ""
    );

    const { video_url, caption } = await req.json();

    if (!video_url) {
      return new Response(JSON.stringify({ error: "video_url é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userResponse = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    const userId = userResponse.data.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: integration } = await supabase
      .from("user_integrations")
      .select("tiktok_access_token")
      .eq("user_id", userId)
      .single();

    if (!integration?.tiktok_access_token) {
      return new Response(JSON.stringify({ error: "TikTok não conectado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = integration.tiktok_access_token;

    const initVideoUrl = "https://open.tiktokapis.com/v2/post/publish/video/init/";
    const initResponse = await fetch(initVideoUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_info: {
          source: "PUSH_FILE",
          video_url: video_url,
          caption: caption || "",
        },
      }),
    });

    const initData = await initResponse.json();

    if (!initResponse.ok) {
      return new Response(JSON.stringify({ 
        error: "Erro ao publicar no TikTok", 
        details: initData 
      }), {
        status: initResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      publish_id: initData.publish_id,
      data: initData,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});