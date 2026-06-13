// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { withSupabase } from 'npm:@supabase/server@^1'

import { handler } from './handler.tsx'

console.log(`Function "tweet-to-image" up and running!`)

// Uploads to Storage with a secret key, so deploy with verify_jwt = false.
export default {
  fetch: withSupabase({ auth: 'secret' }, handler),
}
