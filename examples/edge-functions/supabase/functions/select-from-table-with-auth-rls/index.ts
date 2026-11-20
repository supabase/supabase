// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { withSupabase } from 'npm:@supabase/server@^1'

console.log(`Function "select-from-table-with-auth-rls" up and running!`)

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    try {
      // ctx.supabase runs queries as the authenticated user, so RLS applies.
      // ctx.userClaims holds the verified user identity.
      const { data, error } = await ctx.supabase.from('users').select('*')
      if (error) throw error

      return Response.json({ user: ctx.userClaims, data })
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  }),
}

// To invoke (auth: 'user' requires a signed-in user's access token):
// curl -i --location --request POST 'http://localhost:54321/functions/v1/select-from-table-with-auth-rls' \
//   --header 'Authorization: Bearer <USER_ACCESS_TOKEN>' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
