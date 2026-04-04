import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    const url = new URL(req.url)
    const userId = url.searchParams.get('user_id')

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
      })
    }

    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('bio_store_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        return new Response(JSON.stringify({ error: error.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
        })
      }

      return new Response(JSON.stringify({ settings: data || null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
      })
    }

    if (req.method === 'POST') {
      const body = await req.json()
      const settings = { ...body, user_id: userId, updated_at: new Date().toISOString() }

      const { data: existing } = await supabaseAdmin
        .from('bio_store_settings')
        .select('id')
        .eq('user_id', userId)
        .single()

      let result
      if (existing) {
        const { data, error } = await supabaseAdmin
          .from('bio_store_settings')
          .update(settings)
          .eq('user_id', userId)
          .select()
          .single()
        if (error) throw error
        result = data
      } else {
        const { data, error } = await supabaseAdmin
          .from('bio_store_settings')
          .insert(settings)
          .select()
          .single()
        if (error) throw error
        result = data
      }

      return new Response(JSON.stringify({ settings: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
    })
  }
})
