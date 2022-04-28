import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { SmtpClient } from 'https://deno.land/x/denomailer@0.12.0/mod.ts'

const smtp = new SmtpClient()

serve(async (req) => {
  await smtp.connect({
    hostname: Deno.env.get('SMTP_HOSTNAME')!,
    port: Number(Deno.env.get('SMTP_PORT')!),
    username: Deno.env.get('SMTP_USERNAME')!,
    password: Deno.env.get('SMTP_PASSWORD')!,
  })

  const body = await req.json()

  const functionSecret = Deno.env.get('FUNCTION_SECRET')
  const requestSecret = req.headers.get('x-function-secret')

  if (functionSecret !== requestSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { table, record } = body

  const content = Object.entries(record).reduce(
    (acc, [key, value]) => acc + `${key}: ${value || 'NOT_PROVIDED'}\n`,
    ''
  )

  let to = Deno.env.get('SMTP_FALLBACK_TO')!
  let form = 'Unknown'

  if (table === 'enterprise_contacts') {
    to = Deno.env.get('SMTP_ENTERPRISE_TO')!
    form = 'Enterprise'
  } else if (table === 'partner_contacts') {
    to = Deno.env.get('SMTP_PARTNER_TO')!
    form = 'Partner'
  }

  try {
    await smtp.send({
      from: Deno.env.get('SMTP_FROM')!,
      to,
      subject: `New Contact Form Submission (${form})`,
      content,
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
