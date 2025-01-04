import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Creating Connect account - Start')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      console.error('User not authenticated')
      throw new Error('Not authenticated')
    }

    console.log('Authenticated user:', user.id)

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile?.stripe_account_id) {
      console.log('Checking existing account:', profile.stripe_account_id)
      const account = await stripe.accounts.retrieve(profile.stripe_account_id)
      if (account.payouts_enabled) {
        console.log('Account already setup and enabled')
        return new Response(
          JSON.stringify({ message: 'Account already setup' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    // Create a simplified Custom account for individuals
    const account = await stripe.accounts.create({
      type: 'custom',
      country: 'US',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      settings: {
        payouts: {
          schedule: {
            interval: 'manual' // Start with manual payouts for safety
          }
        }
      }
    })

    console.log('Created Stripe account:', account.id)

    // Update the profile with the new Stripe account ID
    await supabaseClient
      .from('profiles')
      .update({ stripe_account_id: account.id })
      .eq('id', user.id)

    console.log('Updated profile with Stripe account ID')

    // Create an account link with minimal requirements
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.get('origin')}/dashboard`,
      return_url: `${req.headers.get('origin')}/dashboard`,
      type: 'account_onboarding',
      collect: 'eventually_due', // Only collect what's absolutely required
    })

    console.log('Created account link')

    return new Response(
      JSON.stringify({ 
        accountId: account.id,
        accountLink: accountLink.url
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating connect account:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})