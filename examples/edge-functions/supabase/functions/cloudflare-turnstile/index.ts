// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { withSupabase } from 'npm:@supabase/server@^1'

console.log(`Function "cloudflare-turnstile" up and running!`)

function ips(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(/\s*,\s*/)
}

// Public endpoint, so deploy with verify_jwt = false.
// withSupabase handles CORS automatically.
export default {
  fetch: withSupabase({ auth: 'none' }, async (req, _ctx) => {
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
        return Response.json(outcome)
      }

      throw new Error('Turnstile validation failed!')
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  }),
}

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/cloudflare-turnstile' \
//   --header 'Content-Type: application/json' \
//   --data '{"token":"cf-turnstile-response"}'
