// @ts-nocheck
import Stripe from 'npm:stripe@12.0.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

// @ts-ignore
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('Signature missing', { status: 400 })
  }

  try {
    const body = await req.text()
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    
      let event
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret || '')
      } catch (err: any) {
        console.error(`Error verifying webhook signature: ${err.message}`)
        return new Response(`Webhook Error: ${err.message}`, { status: 400 })
      }

    console.log(`Event received: ${event.type}`)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    const syncProMetadata = async (userId, patch) => {
      const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(userId)
      const currentMetadata = authUserData?.user?.user_metadata || {}

      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...currentMetadata,
          ...patch,
        },
      })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.client_reference_id

      if (!userId) {
        console.error('No userId found in session metadata or client_reference_id')
        return new Response('No userId found', { status: 400 })
      }

      console.log(`Processing successful checkout for user: ${userId}`)
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
      let proExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        if (subscription?.current_period_end) {
          proExpiresAt = new Date(subscription.current_period_end * 1000).toISOString()
        }
      }

      const { error } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          is_pro: true,
        }, { onConflict: 'id' })

      if (error) {
        console.error('Error updating profile:', error)
        return new Response('Error updating profile', { status: 500 })
      }

      await syncProMetadata(userId, {
        is_pro: true,
        stripe_subscription_id: subscriptionId || null,
        pro_expires_at: proExpiresAt,
      })

      console.log(`User ${userId} promoted to PRO successfully! 🚀`)
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object
      const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = subscription.metadata?.userId || invoice.parent?.subscription_details?.metadata?.userId
        if (userId && subscription.current_period_end) {
          await supabaseAdmin
            .from('profiles')
            .update({
              is_pro: true,
            })
            .eq('id', userId)

          await syncProMetadata(userId, {
            is_pro: true,
            stripe_subscription_id: subscriptionId,
            pro_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
          })
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object
      const userId = subscription.metadata?.userId
      if (userId) {
        await supabaseAdmin
          .from('profiles')
          .update({ is_pro: false })
          .eq('id', userId)

        await syncProMetadata(userId, {
          is_pro: false,
        })
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('General Error in Webhook handle:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
