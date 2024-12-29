import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const PLATFORM_FEE_PERCENTAGE = 0.05 // 5% platform fee

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { gameCodeId } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) throw new Error('Not authenticated')

    // Get game code details
    const { data: gameCode } = await supabaseClient
      .from('game_codes')
      .select(`
        *,
        profiles:seller_id (
          stripe_account_id
        )
      `)
      .eq('id', gameCodeId)
      .single()

    if (!gameCode) throw new Error('Game code not found')
    if (gameCode.status !== 'available') throw new Error('Game code not available')
    if (gameCode.payment_status !== 'unpaid') throw new Error('Game code already purchased')
    if (!gameCode.profiles?.stripe_account_id) throw new Error('Seller not setup for payments')

    const platformFee = Math.round(gameCode.price * PLATFORM_FEE_PERCENTAGE * 100)
    const sellerAmount = Math.round(gameCode.price * 100) - platformFee

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(gameCode.price * 100),
      currency: 'usd',
      application_fee_amount: platformFee,
      transfer_data: {
        destination: gameCode.profiles.stripe_account_id,
      },
      metadata: {
        gameCodeId,
        buyerId: user.id,
        sellerId: gameCode.seller_id,
      },
    })

    // Create payment record
    await supabaseClient.from('payments').insert({
      game_code_id: gameCodeId,
      buyer_id: user.id,
      amount: gameCode.price,
      platform_fee: platformFee / 100,
      payment_intent_id: paymentIntent.id,
    })

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})