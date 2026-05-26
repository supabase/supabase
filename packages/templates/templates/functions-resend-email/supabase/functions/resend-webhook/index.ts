import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

const webhookSchema = z.object({
  type: z.string(),
  data: z
    .object({
      email_id: z.string().optional(),
      id: z.string().optional(),
      last_event: z.string().optional(),
    })
    .passthrough(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('expected POST request', { status: 405 })
  }

  const parseResult = webhookSchema.safeParse(await req.json())

  if (!parseResult.success) {
    return new Response(`invalid request body: ${parseResult.error.message}`, { status: 400 })
  }

  const event = parseResult.data
  const providerMessageId = event.data.email_id ?? event.data.id

  if (!providerMessageId) {
    return Response.json({ skipped: true, reason: 'missing provider message id' })
  }

  const status = toEmailStatus(event.type, event.data.last_event)

  const { error } = await supabase
    .from('email_messages')
    .update({
      status,
      error: status === 'failed' ? event.type : null,
      updated_at: new Date().toISOString(),
    })
    .eq('provider_message_id', providerMessageId)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ received: true })
})

function toEmailStatus(type: string, lastEvent?: string): 'sent' | 'failed' {
  const eventName = `${type}:${lastEvent ?? ''}`.toLowerCase()
  return eventName.includes('bounced') || eventName.includes('complained') ? 'failed' : 'sent'
}
