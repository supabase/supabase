// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { supabaseAdminClient } from '../_shared/supabaseClient.ts'
import { corsHeaders } from '../_shared/cors.ts'

console.log(`Function "get-tshirt-competition" up and running!`)

function positionInAlphabet(myChar: string): number {
  const DIFFERENCE_CHARCODE_AND_LETTERS = 96
  // Convert the character into lowercase
  const myCharLowercase = myChar.toLowerCase()
  // Find the position of the char in the alphabet
  const position = myCharLowercase.charCodeAt(0) - DIFFERENCE_CHARCODE_AND_LETTERS
  return position
}

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const email = url.searchParams.get('email')
    const twitter = url.searchParams.get('twitter')
    const answer = url.searchParams.get('answer')

    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email ?? '') || !answer)
      throw new Error(
        `You're missing either a valid 'email' and/or 'answer' param(s). HINT: https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/get-tshirt-competition/index.ts`
      )

    if (Number(answer) !== positionInAlphabet(email!))
      throw new Error(
        `Sorry, that's wrong, please try again! HINT: https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/get-tshirt-competition/index.ts`
      )

    // Submit email to draw
    const { error } = await supabaseAdminClient.from('get-tshirt-competition').upsert(
      {
        email,
        twitter,
      },
      { onConflict: 'email' }
    )
    if (error) {
      console.log(error)
      throw new Error(error.details)
    }

    return new Response(`Thanks for playing! ${email} has been added to the draw \\o/`, {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

// To invoke:
// curl -i --location --request GET 'http://localhost:54321/functions/v1/get-tshirt-competition?email=testr@test.de&answer=20'
