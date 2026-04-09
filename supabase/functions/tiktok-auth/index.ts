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
    const { code, redirect_uri, code_verifier } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ error: "Code é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenUrl = "https://open.tiktokapis.com/v2/oauth/token/";
    const credentials = btoa(`${TIKTOK_CLIENT_KEY}:${TIKTOK_CLIENT_SECRET}`);

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirect_uri || "",
      code_verifier: code_verifier || "",
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return new Response(JSON.stringify({ error: tokenData }), {
        status: tokenResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") || "",
        Deno.env.get("SUPABASE_SERVICE_KEY") || ""
      );

      const userResponse = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      const userId = userResponse.data.user?.id;

      if (userId) {
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 0));

        await supabase.from("user_integrations").upsert({
          user_id: userId,
          tiktok_access_token: tokenData.access_token,
          tiktok_refresh_token: tokenData.refresh_token,
          tiktok_expires_at: expiresAt.toISOString(),
        }, { onConflict: "user_id" });
      }
    }

    return new Response(JSON.stringify({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
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