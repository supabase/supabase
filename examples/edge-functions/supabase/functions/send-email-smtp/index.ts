// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { withSupabase } from 'npm:@supabase/server@^1'
import nodemailer from 'npm:nodemailer@6.9.10'

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

// Public endpoint, so deploy with verify_jwt = false.
export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
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
      return new Response(error.message, { status: 500 })
    }

    return Response.json({
      done: true,
    })
  }),
}

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/send-email-smtp' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
