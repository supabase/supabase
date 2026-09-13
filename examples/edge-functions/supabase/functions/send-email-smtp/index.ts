// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { withSupabase } from 'npm:@supabase/server@^1'
import nodemailer from 'npm:nodemailer@^9'

const transport = nodemailer.createTransport({
  host: Deno.env.get('SMTP_HOSTNAME')!,
  port: Number(Deno.env.get('SMTP_PORT')!),
  secure: Boolean(Deno.env.get('SMTP_SECURE')!),
  auth: {
    user: Deno.env.get('SMTP_USERNAME')!,
    pass: Deno.env.get('SMTP_PASSWORD')!,
  },
})

console.log(`Function "send-email-smtp" up and running!`)

// Authenticated endpoint, so deploy with verify_jwt = true.
export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    try {
      await new Promise<void>((resolve, reject) => {
        transport.sendMail(
          {
            from: Deno.env.get('SMTP_FROM')!,
            to: 'testr@test.de',
            subject: `Hello from Supabase Edge Functions`,
            text: `Hello Functions \\o/`,
          },
          (error) => {
            if (error) {
              return reject(error)
            }

            resolve()
          }
        )
      })
    } catch (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({
      done: true,
    })
  }),
}

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/send-email-smtp' \
//   --header 'Authorization: Bearer <USER_ACCESS_TOKEN>' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
