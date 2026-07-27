// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { withSupabase } from 'npm:@supabase/server@^1'

function ips(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(/\s*,\s*/)
}

// Authenticated endpoint, so deploy with verify_jwt = true.
export default {
  fetch: withSupabase({ auth: 'user' }, async (req, _ctx) => {
    const clientIps = ips(req) || ['']
    const res = await fetch(
      `https://ipinfo.io/${clientIps[0]}?token=${Deno.env.get('IPINFO_TOKEN')}`,
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
    if (res.ok) {
      const { city, country } = await res.json()

      return Response.json(`You're accessing from ${city}, ${country}`)
    } else {
      return new Response(await res.text(), {
        status: 400,
      })
    }
  }),
}
