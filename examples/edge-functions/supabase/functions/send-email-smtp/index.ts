// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import nodemailer from 'npm:nodemailer@6.9.10'

const transport = nodemailer.createTransport({
  host: Deno.env.get('SMTP_HOSTNAME')!,
  port: Number(Deno.env.get('SMTP_PORT')!),
  secure: Boolean(Deno.env.get('SMTP_SECURE')!),
  auth: {
    user: Deno.env.get('SMTP_USERNAME')!,
    pass: Deno.env.get('SMTP_PASSWORD')!
  }
})

console.log(`Function "send-email-smtp" up and running!`)

Deno.serve(async (_req) => {
  try {
    await new Promise<void>((resolve, reject) => {
      transport.sendMail({
        from: Deno.env.get('SMTP_FROM')!,
        to: 'testr@test.de',
        subject: `Hello from Supabase Edge Functions`,
        text: `Hello Functions \\o/`,
      }, error => {
        if (error) {
          return reject(error)
        }
  
        resolve()
      })
    })
  } catch (error) {
    return new Response(error.message, { status: 500 })
  }

  return new Response(
    JSON.stringify({
      done: true,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )
})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/send-email-smtp' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
