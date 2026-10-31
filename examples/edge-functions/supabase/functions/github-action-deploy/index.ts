// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { withSupabase } from 'npm:@supabase/server@^1'

console.log('Hello from Functions!')

// Authenticated endpoint, so deploy with verify_jwt = true.
export default {
  fetch: withSupabase({ auth: 'user' }, async (_req, _ctx) => {
    const data = {
      message: `I was deployed via GitHub Actions!`,
    }

    return Response.json(data)
  }),
}

// To invoke:
// curl -i --location --request GET 'http://localhost:54321/functions/v1/github-action-deploy' \
//   --header 'Authorization: Bearer <USER_ACCESS_TOKEN>'
