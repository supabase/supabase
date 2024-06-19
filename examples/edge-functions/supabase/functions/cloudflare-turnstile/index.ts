// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { corsHeaders } from '../_shared/cors.ts'

console.log(`Function "cloudflare-turnstile" up and running!`)

function ips(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(/\s*,\s*/)
}

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()
    if (!token) throw new Error('Missing token!')

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
      return new Response(JSON.stringify(outcome), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
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
// curl -i --location --request POST 'http://localhost:54321/functions/v1/cloudflare-turnstile' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"token":"cf-turnstile-response"}'
