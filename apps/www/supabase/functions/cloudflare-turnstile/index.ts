// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log(`Function "cloudflare-turnstile" up and running!`)

function ips(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(/\s*,\s*/)
}

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, token } = await req.json()
    if (!email || !token) throw new Error('Missing email or token params!')

    const clientIps = ips(req) || ['']

    // Validate the token by calling the
    // "/siteverify" API endpoint.
    const formData = new FormData()
    formData.append('secret', Deno.env.get('CLOUDFLARE_TURNSTILE_SECRET_KEY') ?? '')
    formData.append('response', token)
    formData.append('remoteip', clientIps[0])

    const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
    const result = await fetch(url, {
      body: formData,
      method: 'POST',
    })

    const outcome = await result.json()
    console.log(outcome)
    if (outcome.success) {
      const supabaseAdminClient = createClient(
        // Supabase API URL - env var exported by default when deployed.
        Deno.env.get('SUPABASE_URL') ?? '',
        // Supabase API SERVICE ROLE KEY - env var exported by default when deployed.
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      // Create new ticket
      const { data: newTicket, error: insertError } = await supabaseAdminClient
        .from('lw6_tickets')
        .upsert({ email }, { onConflict: 'email', ignoreDuplicates: false })
        .eq('email', email)
        .select('id')
        .single()
      if (insertError) throw insertError
      // Check if golden ticket
      const { data } = await supabaseAdminClient
        .from('lw6_tickets_golden')
        .select('*')
        .eq('id', newTicket.id)
        .single()
      return new Response(
        JSON.stringify({
          id: data?.id ?? 'new',
          ticketNumber: data?.ticketNumber ?? 1234,
          name: data?.name ?? '',
          username: data?.username ?? '',
          golden: data?.golden ?? false,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    throw new Error('Turnstile validation failed!')
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"token":"cf-turnstile-response"}'
