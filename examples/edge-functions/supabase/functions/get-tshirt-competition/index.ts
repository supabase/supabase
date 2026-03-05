// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from 'npm:supabase-js@2'
// New approach (v2.95.0+)
import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors'
// For older versions:
// import { corsHeaders } from '../_shared/cors.ts'

console.log(`Function "get-tshirt-competition" up and running!`)

function countEmailSegments(email: string): string {
  const [localPart, domain] = email.split('@')
  const [hostname, ...countryCodes] = domain.split('.')
  return `${localPart.length}${hostname.length}${countryCodes.reduce((a, cc) => a + cc.length, '')}`
}

function turnEmailToCount(email: string): string {
  const [localPart, domain] = email.split('@')
  const [hostname, ...countryCodes] = domain.split('.')
  return `${localPart.length}@${hostname.length}${countryCodes.reduce(
    (a, cc) => a + '.' + cc.length,
    ''
  )}`
}

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const email = url.searchParams.get('email')
    const twitter = url.searchParams.get('twitter')
    const size = url.searchParams.get('size')
    const answer = url.searchParams.get('answer')

    if (
      !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email ?? '') ||
      !answer ||
      !twitter ||
      !size
    ) {
      throw new Error(
        `Please provide valid 'email', 'twitter', 'size', and 'answer' params. HINT: https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/get-tshirt-competition/index.ts`
      )
    }

    if (answer !== countEmailSegments(email!)) {
      throw new Error(
        `Sorry, that's wrong, please try again! HINT: https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/get-tshirt-competition/index.ts`
      )
    }

    const supabaseAdminClient = createClient(
      // Supabase API URL - env var exported by default when deployed.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API SERVICE ROLE KEY - env var exported by default when deployed.
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    // Submit email to draw
    const { error } = await supabaseAdminClient.from('get-tshirt-competition-2').upsert(
      {
        email,
        twitter,
        size,
      },
      { onConflict: 'email' }
    )
    if (error) {
      console.log(error)
      throw new Error(error.details)
    }

    return new Response(
      `Thanks for playing! ${turnEmailToCount(email!)} has been added to the draw \\o/`,
      {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

// To invoke:
// curl -i --location --request GET 'http://localhost:54321/functions/v1/get-tshirt-competition?email=testr@test.de&twitter=thorwebdev&size=2XL&answer=20'
