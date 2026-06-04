import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import postgres from 'https://deno.land/x/postgresjs@v3.4.5/mod.js'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

const QUEUE_NAME = 'workflow_runs'

const requestSchema = z.object({
  jobId: z.number().int().positive(),
  runId: z.string().uuid(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!)

type WorkflowRun = {
  id: string
  workflow_type: string
  input: Record<string, unknown>
  attempt_count: number
  max_attempts: number
}

type WorkflowHandler = (run: WorkflowRun) => Promise<Record<string, unknown>>

const handlers: Record<string, WorkflowHandler> = {
  example: async (run) => ({ ok: true, input: run.input }),
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('expected POST request', { status: 405 })
  }

  const parseResult = requestSchema.safeParse(await req.json())

  if (!parseResult.success) {
    return new Response(`invalid request body: ${parseResult.error.message}`, { status: 400 })
  }

  const { jobId, runId } = parseResult.data

  const { data: run, error: runError } = await supabase
    .from('workflow_runs')
    .select('*')
    .eq('id', runId)
    .single<WorkflowRun>()

  if (runError || !run) {
    await deleteQueueMessage(jobId)
    return Response.json({ error: `workflow run not found: ${runError?.message}` }, { status: 404 })
  }

  if (!['queued', 'failed'].includes((run as { status?: string }).status ?? '')) {
    await deleteQueueMessage(jobId)
    return Response.json({ skipped: true, runId, status: (run as { status?: string }).status })
  }

  const attemptNumber = run.attempt_count + 1
  const { data: attempt } = await supabase
    .from('workflow_attempts')
    .insert({ run_id: runId, attempt_number: attemptNumber })
    .select('id')
    .single()

  await supabase
    .from('workflow_runs')
    .update({
      status: 'running',
      attempt_count: attemptNumber,
      locked_at: new Date().toISOString(),
      locked_by: crypto.randomUUID(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', runId)

  try {
    const handler = handlers[run.workflow_type]

    if (!handler) {
      throw new Error(`no workflow handler registered for "${run.workflow_type}"`)
    }

    const result = await handler(run)

    await supabase
      .from('workflow_runs')
      .update({
        status: 'succeeded',
        result,
        error: null,
        locked_at: null,
        locked_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId)

    if (attempt?.id) {
      await supabase
        .from('workflow_attempts')
        .update({ status: 'succeeded', result, finished_at: new Date().toISOString() })
        .eq('id', attempt.id)
    }

    await deleteQueueMessage(jobId)

    return Response.json({ runId, result })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const exhausted = attemptNumber >= run.max_attempts

    await supabase
      .from('workflow_runs')
      .update({
        status: exhausted ? 'dead_letter' : 'failed',
        error: message,
        locked_at: null,
        locked_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId)

    if (attempt?.id) {
      await supabase
        .from('workflow_attempts')
        .update({ status: 'failed', error: message, finished_at: new Date().toISOString() })
        .eq('id', attempt.id)
    }

    if (!exhausted) {
      await sql`select pgmq.send(${QUEUE_NAME}, ${JSON.stringify({ runId })}::jsonb)`
    }

    await deleteQueueMessage(jobId)

    return Response.json({ runId, error: message, retrying: !exhausted }, { status: 500 })
  }
})

async function deleteQueueMessage(jobId: number) {
  await sql`select pgmq.delete(${QUEUE_NAME}, ${jobId}::bigint)`
}
