// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { withSupabase } from 'npm:@supabase/server@^1'

import { handler } from './handler.tsx'

console.log(`Function "opengraph" up and running!`)

// Public endpoint, so deploy with verify_jwt = false.
export default {
  fetch: withSupabase({ auth: 'none' }, handler),
}
