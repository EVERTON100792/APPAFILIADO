// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const hottokHeader = req.headers.get('x-hotmart-hottok') || req.headers.get('hottok')
    
    // Inicializa o cliente admin do Supabase
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Busca o HOTTOK na tabela de config
    let secretHottok = Deno.env.get('HOTMART_HOTTOK')
    if (!secretHottok) {
      const { data: configData } = await supabaseAdmin
        .from('app_config')
        .select('value')
        .eq('key', 'HOTMART_HOTTOK')
        .single();
      
      if (configData) secretHottok = configData.value;
    }

    // 2. Valida o Token de Seguranca da Hotmart
    if (!hottokHeader || hottokHeader !== secretHottok) {
      console.error("Token HOTTOK invalido")
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = await req.json()
    const email = payload.data?.buyer?.email
    const status = payload.data?.purchase?.status

    if (!email) {
      throw new Error("Email do comprador nao encontrado")
    }

    // 3. Busca o usuário diretamente pelo email (Alta Performance)
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email)
    
    if (userError) {
      console.error(`Erro ao buscar usuário ${email}:`, userError.message)
      return new Response(JSON.stringify({ message: 'User not found in Auth' }), {
        status: 200, // Retornamos 200 para a Hotmart não ficar tentando reenviar se o usuário não existe
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const user = userData.user;

    // 4. Ativa ou Desativa o PRO
    const isApproved = ['APPROVED', 'COMPLETE'].includes(status)
    const isCanceled = ['CANCELED', 'REFUNDED', 'EXPIRED'].includes(status)

    if (isApproved) {
      await supabaseAdmin.from('profiles').update({ is_pro: true }).eq('id', user.id)
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, is_pro: true }
      })
    } else if (isCanceled) {
      await supabaseAdmin.from('profiles').update({ is_pro: false }).eq('id', user.id)
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, is_pro: false }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error("Erro no Webhook:", errorMessage)
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
