// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^1.33.2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  // Supabase API URL - env var exported by default when deployed.
  Deno.env.get('SUPABASE_URL') ?? '',
  // Supabase API ANON KEY - env var exported by default when deployed.
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

console.log(`Function "select-from-table-with-auth-rls" up and running!`)

serve(async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  // Set the Auth context of the user that called the function.
  // This way your row-level-security (RLS) policies are applied.
  supabase.auth.setAuth(req.headers.get('Authorization')!.replace('Bearer ', ''))

  const { data, error } = await supabase.from('users').select('*')
  console.log({ data, error })

  return new Response(JSON.stringify({ data, error }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/select-from-table-with-auth-rls' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
