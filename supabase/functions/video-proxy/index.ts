import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Expose-Headers': 'content-range, content-length, accept-ranges',
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

    // Forward the Range header if present
    const range = req.headers.get('range');
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
    };

    if (range) {
      fetchHeaders['Range'] = range;
    }

    const response = await fetch(targetUrl, {
      method: 'GET', // Usually videos are GET
      headers: fetchHeaders,
      redirect: 'follow'
    });

    const headers = new Headers();
    // Copy essential headers from the original response
    const essentialHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control'
    ];

    essentialHeaders.forEach(h => {
      const val = response.headers.get(h);
      if (val) headers.set(h, val);
    });

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([k, v]) => {
      headers.set(k, v);
    });

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

