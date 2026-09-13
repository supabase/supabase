import { withSupabase } from 'npm:@supabase/server@^1'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

// Accepts a signed-in user's JWT or a secret key, so deploy with verify_jwt = false.
export default {
  fetch: withSupabase({ auth: ['user', 'secret'] }, async (req, ctx) => {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: 'delivered@resend.dev',
        subject: 'hello world',
        html: '<strong>it works!</strong>',
      }),
    })

    const data = await res.json()

    return Response.json(data)
  }),
}
