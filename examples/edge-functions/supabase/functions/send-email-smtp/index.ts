// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { SmtpClient } from 'https://deno.land/x/denomailer@0.12.0/mod.ts'

const smtp = new SmtpClient()

console.log(`Function "send-email-smtp" up and running!`)

serve(async (req) => {
  await smtp.connect({
    hostname: Deno.env.get('SMTP_HOSTNAME')!,
    port: Number(Deno.env.get('SMTP_PORT')!),
    username: Deno.env.get('SMTP_USERNAME')!,
    password: Deno.env.get('SMTP_PASSWORD')!,
  })

  try {
    await smtp.send({
      from: Deno.env.get('SMTP_FROM')!,
      to: 'testr@test.de',
      subject: `Hello from Supabase Edge Functions`,
      content: `Hello Functions \o/`,
    })
  } catch (error: any) {
    return new Response(error.message, { status: 500 })
  }

  await smtp.close()

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
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
