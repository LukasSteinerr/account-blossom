import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get user information
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      console.error('Authentication error:', userError)
      throw new Error('Not authenticated')
    }

    console.log('Authenticated user:', user.id)

    // Fetch the game code details
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
      .single()

    if (gameCodeError || !gameCode) {
      console.error('Error fetching game code:', gameCodeError)
      throw new Error('Game code not found or unavailable')
    }

    console.log('Found game code:', gameCode.id)

    try {
      // Create Stripe Checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${gameCode.games.title} Game Code`,
                description: `Game code for ${gameCode.games.title}`,
              },
              unit_amount: Math.round(gameCode.price * 100), // Convert price to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.headers.get('origin')}/dashboard?success=true`,
        cancel_url: `${req.headers.get('origin')}/dashboard?canceled=true`,
        metadata: {
          gameCodeId: gameCode.id,
          buyerId: user.id,
          sellerId: gameCode.seller_id,
        },
      })

      console.log('Created Stripe session:', session.id)

      // Update game code status
      const { error: updateError } = await supabaseAdmin
        .from('game_codes')
        .update({ 
          status: 'pending',
          payment_status: 'pending',
          stripe_payment_intent_id: session.payment_intent as string
        })
        .eq('id', gameCodeId)
        .eq('status', 'available')
        .eq('payment_status', 'unpaid')

      if (updateError) {
        console.error('Error updating game code status:', updateError)
        throw new Error('Failed to update game code status')
      }

      console.log('Updated game code status successfully')

      // Create payment record
      const { error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          game_code_id: gameCodeId,
          buyer_id: user.id,
          amount: gameCode.price,
          platform_fee: gameCode.price * 0.05, // 5% platform fee
          payment_intent_id: session.payment_intent as string,
        })

      if (paymentError) {
        console.error('Error creating payment record:', paymentError)
        throw new Error('Failed to create payment record')
      }

      console.log('Created payment record successfully')

      return new Response(
        JSON.stringify({ url: session.url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (stripeError) {
      console.error('Stripe or database error:', stripeError)
      throw stripeError
    }
  } catch (error) {
    console.error('Error in create-payment function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
})