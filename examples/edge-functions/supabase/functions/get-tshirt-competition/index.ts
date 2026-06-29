// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { withSupabase } from 'npm:@supabase/server@^1'

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

// Public challenge endpoint, so deploy with verify_jwt = false.
export default {
  fetch: withSupabase<any>({ auth: 'none' }, async (req, ctx) => {
    try {
      const url = new URL(req.url)
      const email = url.searchParams.get('email')
      const twitter = url.searchParams.get('twitter')
      const size = url.searchParams.get('size')
      const answer = url.searchParams.get('answer')

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? '') || !answer || !twitter || !size) {
        throw new Error(
          `Please provide valid 'email', 'twitter', 'size', and 'answer' params. HINT: https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/get-tshirt-competition/index.ts`
        )
      }

      if (answer !== countEmailSegments(email!)) {
        throw new Error(
          `Sorry, that's wrong, please try again! HINT: https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/get-tshirt-competition/index.ts`
        )
      }

      // Submit email to draw
      const { error } = await ctx.supabaseAdmin.from('get-tshirt-competition-2').upsert(
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
          headers: { 'Content-Type': 'text/plain' },
          status: 200,
        }
      )
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
  }),
}

// To invoke:
// curl -i --location --request GET 'http://localhost:54321/functions/v1/get-tshirt-competition?email=testr@test.de&twitter=thorwebdev&size=2XL&answer=20'
