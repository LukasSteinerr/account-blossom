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
    const { accountId, firstName, lastName, dateOfBirth, bankAccount } = await req.json()

    // Update the account with personal information
    await stripe.accounts.update(accountId, {
      individual: {
        first_name: firstName,
        last_name: lastName,
        dob: {
          day: new Date(dateOfBirth).getDate(),
          month: new Date(dateOfBirth).getMonth() + 1,
          year: new Date(dateOfBirth).getFullYear(),
        },
      },
    })

    // Add the bank account to the Connect account
    const bankAccountToken = await stripe.tokens.create({
      bank_account: {
        country: 'US',
        currency: 'usd',
        account_holder_name: `${firstName} ${lastName}`,
        account_holder_type: 'individual',
        routing_number: bankAccount.routingNumber,
        account_number: bankAccount.accountNumber,
      },
    })

    await stripe.accounts.createExternalAccount(accountId, {
      external_account: bankAccountToken.id,
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error updating connect account:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})