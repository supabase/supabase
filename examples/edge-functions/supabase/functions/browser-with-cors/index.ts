// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { withSupabase } from 'npm:@supabase/server@^1'

console.log(`Function "browser-with-cors" up and running!`)

// Public endpoint, so deploy with verify_jwt = false.
// withSupabase handles CORS automatically.
export default {
  fetch: withSupabase({ auth: 'none' }, async (req, _ctx) => {
    try {
      const { name } = await req.json()
      const data = {
        message: `Hello ${name}!`,
      }

      return Response.json(data)
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  }),
}

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/browser-with-cors' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
