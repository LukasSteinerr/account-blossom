import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { gameCodeId } = await req.json()
    console.log('Creating payment for game code:', gameCodeId)

    if (!gameCodeId) {
      console.error('No game code ID provided')
      throw new Error('Game code ID is required')
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      console.error('Authentication error:', userError)
      throw new Error('Not authenticated')
    }

    console.log('Authenticated user:', user.id)

    const { data: gameCode, error: gameCodeError } = await supabaseAdmin
      .from('game_codes')
      .select(`
        *,
        games (
          title
        )
      `)
      .eq('id', gameCodeId)
      .eq('status', 'available')
      .eq('payment_status', 'unpaid')
      .maybeSingle()

    if (gameCodeError) {
      console.error('Error fetching game code:', gameCodeError)
      throw new Error('Failed to fetch game code')
    }

    if (!gameCode) {
      console.error('Game code not found or not available')
      throw new Error('Game code not found or already purchased')
    }

    console.log('Found game code:', gameCode.id)

    // Update game code status to pending
    const { error: updateError } = await supabaseAdmin
      .from('game_codes')
      .update({ 
        status: 'pending',
        payment_status: 'pending'
      })
      .eq('id', gameCodeId)
      .eq('status', 'available')
      .eq('payment_status', 'unpaid')

    if (updateError) {
      console.error('Error updating game code:', updateError)
      throw new Error('Failed to update game code status')
    }

    const amount = Math.round(gameCode.price * 100)
    console.log('Creating checkout session with amount:', amount)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: gameCode.games.title,
              description: `Game code for ${gameCode.games.title}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/dashboard?success=true`,
      cancel_url: `${req.headers.get('origin')}/dashboard?canceled=true`,
      metadata: {
        gameCodeId,
        buyerId: user.id,
        sellerId: gameCode.seller_id,
      },
    })

    console.log('Created checkout session:', session.id)

    // Create payment record
    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        game_code_id: gameCodeId,
        buyer_id: user.id,
        amount: gameCode.price,
        platform_fee: gameCode.price * 0.05,
        payment_intent_id: session.payment_intent as string,
      })

    if (paymentError) {
      console.error('Error creating payment record:', paymentError)
      throw new Error('Failed to create payment record')
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in create-payment function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})