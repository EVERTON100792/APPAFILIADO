import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing url parameter', { status: 400, headers: corsHeaders });
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': req.headers.get('User-Agent') || 'Mozilla/5.0',
        'Accept': req.headers.get('Accept') || '*/*',
      }
    });

    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    
    // We remove specific headers that could cause conflicts or caching issues for videos
    headers.delete('content-security-policy');
    headers.delete('x-frame-options');

    return new Response(response.body, {
      status: response.status,
      headers: headers
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
