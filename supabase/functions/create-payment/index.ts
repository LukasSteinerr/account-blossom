import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

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
    console.log('Creating payment for game code:', gameCodeId)

    // Initialize Supabase client with service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      console.error('Authentication error:', userError)
      throw new Error('Not authenticated')
    }

    console.log('Authenticated user:', user.id)

    // Get game code details with seller profile using service role
    const { data: gameCode, error: gameCodeError } = await supabaseClient
      .from('game_codes')
      .select(`
        *,
        seller:seller_id (
          stripe_account_id
        ),
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

    if (!gameCode.seller?.stripe_account_id) {
      console.error('Seller not setup for payments')
      throw new Error('Seller not setup for payments')
    }

    console.log('Found game code:', gameCode.id)

    // Double-check the game code hasn't been purchased while we were processing
    const { count, error: countError } = await supabaseClient
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('game_code_id', gameCodeId)
      .eq('payment_status', 'succeeded')

    if (countError) {
      console.error('Error checking payment status:', countError)
      throw new Error('Failed to verify payment status')
    }

    if (count && count > 0) {
      console.error('Game code already purchased')
      throw new Error('Game code already purchased')
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Calculate platform fee (5%)
    const platformFee = Math.round(gameCode.price * 0.05 * 100)
    const amount = Math.round(gameCode.price * 100)

    console.log('Creating checkout session with amount:', amount, 'and platform fee:', platformFee)

    // Create Stripe Checkout session
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
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: gameCode.seller.stripe_account_id,
        },
        metadata: {
          gameCodeId,
          buyerId: user.id,
          sellerId: gameCode.seller_id,
        },
      },
    })

    console.log('Created checkout session:', session.id)

    // Create payment record
    const { error: paymentError } = await supabaseClient.from('payments').insert({
      game_code_id: gameCodeId,
      buyer_id: user.id,
      amount: gameCode.price,
      platform_fee: platformFee / 100,
      payment_intent_id: session.payment_intent as string,
    })

    if (paymentError) {
      console.error('Error creating payment record:', paymentError)
      throw new Error('Failed to create payment record')
    }

    // Update game code status
    const { error: updateError } = await supabaseClient
      .from('game_codes')
      .update({ 
        stripe_payment_intent_id: session.payment_intent as string,
        status: 'pending'
      })
      .eq('id', gameCodeId)
      .eq('status', 'available')
      .eq('payment_status', 'unpaid')

    if (updateError) {
      console.error('Error updating game code:', updateError)
      throw new Error('Failed to update game code status')
    }

    return new Response(
      JSON.stringify({ sessionId: session.id }),
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