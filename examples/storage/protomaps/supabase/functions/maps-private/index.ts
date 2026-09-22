import { withSupabase } from 'npm:@supabase/server@^1'

const ALLOWED_ORIGINS = ['http://localhost:8000']

// Public tile proxy, so deploy with verify_jwt = false.
export default {
  fetch: withSupabase({ auth: 'none' }, (req) => {
    // Restrict which origins may read the private tiles.
    const origin = req.headers.get('Origin')
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      return new Response('Not Allowed', { status: 405 })
    }

    const reqUrl = new URL(req.url)
    const url = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/authenticated${reqUrl.pathname}`

    const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!)
    const { method, headers } = req
    // Add Auth header so Storage serves the private object.
    const modHeaders = new Headers(headers)
    modHeaders.append('authorization', `Bearer ${SUPABASE_SECRET_KEYS['default']!}`)
    return fetch(url, { method, headers: modHeaders })
  }),
}
