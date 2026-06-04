import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import postgres from 'https://deno.land/x/postgresjs@v3.4.5/mod.js'
import { z } from 'npm:zod@3'

const QUEUE_NAME = 'email_jobs'
const RESEND_API_URL = 'https://api.resend.com/emails'

const jobSchema = z.object({
  jobId: z.number(),
  emailId: z.string().uuid(),
})

type Job = z.infer<typeof jobSchema>

type EmailMessage = {
  id: string
  to_email: string[]
  from_email: string | null
  subject: string
  html: string | null
  text: string | null
  tags: Record<string, unknown>
  attempts: number
  max_attempts: number
}

const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!)
const resendApiKey = Deno.env.get('RESEND_API_KEY')

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('expected POST request', { status: 405 })
  }

  if (!resendApiKey) {
    return Response.json({ error: 'missing RESEND_API_KEY secret' }, { status: 500 })
  }

  const parseResult = z.array(jobSchema).safeParse(await req.json())

  if (!parseResult.success) {
    return new Response(`invalid request body: ${parseResult.error.message}`, { status: 400 })
  }

  const completedJobs: Job[] = []
  const failedJobs: Array<Job & { error: string }> = []

  for (const job of parseResult.data) {
    try {
      await processJob(job)
      completedJobs.push(job)
    } catch (error) {
      failedJobs.push({
        ...job,
        error: error instanceof Error ? error.message : JSON.stringify(error),
      })
    }
  }

  return Response.json({ completedJobs, failedJobs })
})

async function processJob({ jobId, emailId }: Job) {
  const [email] = await sql<EmailMessage[]>`
    select *
    from public.email_messages
    where id = ${emailId}
  `

  if (!email) {
    await sql`select pgmq.delete(${QUEUE_NAME}, ${jobId}::bigint)`
    throw new Error(`email message not found: ${emailId}`)
  }

  if (email.attempts >= email.max_attempts) {
    await markFailed(emailId, 'maximum attempts reached')
    await sql`select pgmq.delete(${QUEUE_NAME}, ${jobId}::bigint)`
    return
  }

  await sql`
    update public.email_messages
    set status = 'sending',
        attempts = attempts + 1,
        updated_at = now()
    where id = ${emailId}
  `

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: email.from_email ?? Deno.env.get('RESEND_FROM_EMAIL'),
      to: email.to_email,
      subject: email.subject,
      html: email.html ?? undefined,
      text: email.text ?? undefined,
      tags: toResendTags(email.tags),
    }),
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = typeof payload?.message === 'string' ? payload.message : response.statusText
    const exhausted = email.attempts + 1 >= email.max_attempts
    await markFailed(emailId, error, exhausted)
    if (exhausted) {
      await sql`select pgmq.delete(${QUEUE_NAME}, ${jobId}::bigint)`
    }
    throw new Error(error)
  }

  await sql`
    update public.email_messages
    set status = 'sent',
        provider_message_id = ${payload.id ?? null},
        sent_at = now(),
        error = null,
        updated_at = now()
    where id = ${emailId}
  `

  await sql`select pgmq.delete(${QUEUE_NAME}, ${jobId}::bigint)`
}

async function markFailed(emailId: string, error: string, exhausted = true) {
  await sql`
    update public.email_messages
    set status = ${exhausted ? 'failed' : 'queued'},
        error = ${error},
        updated_at = now()
    where id = ${emailId}
  `
}

function toResendTags(tags: Record<string, unknown>) {
  return Object.entries(tags)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    .map(([name, value]) => ({ name, value }))
}
