// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

console.log('Hello from the Sentry Functions Challenge!')

import { createClient } from 'jsr:@supabase/supabase-js@2'
import * as Sentry from 'https://deno.land/x/sentry@7.102.0/index.mjs'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Sentry.init({
  dsn: Deno.env.get('SENTRY_DSN'),
  integrations: [],
  debug: false,
  // Performance Monitoring
  tracesSampleRate: 1.0,
})

// Set region and execution_id as custom tags
Sentry.setTag('region', Deno.env.get('SB_REGION'))
Sentry.setTag('execution_id', Deno.env.get('SB_EXECUTION_ID'))

Deno.serve(async (req) => {
  try {
    if (req.method === 'GET') {
      return new Response(
        'What is Supabase not? POST {answer, twitter} to this URL! Need a hint? 👉 https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/sentry/index.ts'
      )
    }
    let answer: string
    let twitter: string
    try {
      const params = await req.json()
      if (!params?.answer || !params?.twitter) throw new Error('no answer')
      answer = params.answer
      twitter = params.twitter
    } catch (_) {
      return new Response('You need to send a JSON body with {answer, twitter}!')
    }
    if (answer.toLowerCase() !== 'postgres') {
      return new Response(
        `You are correct! But that means you've failed the challenge. Please try again!`
      )
    } else {
      throw { twitter }
    }
  } catch (e) {
    Sentry.captureException(e)
    const { error } = await supabase
      .from('sentry_functions_challenge')
      .insert({ twitter: e.twitter })
    if (error) console.log(e.twitter, error.message)
    return new Response(
      JSON.stringify({
        msg: `Congrats, you are wrong https://itsjustpostgres.com/ 🎉 @${e.twitter} has been added to the draw!`,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/sentry' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"answer":"mysql", "twitter":"thorwebdev"}'

*/
