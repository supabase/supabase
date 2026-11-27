// Worker for the `uptime_checks` queue. Called by the `uptime-queue-checks`
// Cron job with the project's secret key: claims a batch of queued checks,
// requests each URL and records the result.

import '@supabase/functions-js/edge-runtime.d.ts'
import { withSupabase } from '@supabase/server'

const TIMEOUT_MS = 10_000

interface QueuedCheck {
  msg_id: number
  monitor_id: string | null
  url: string | null
}

async function checkUrl(url: string) {
  const startedAt = performance.now()
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': 'supabase-uptime-monitor/1.0' },
    })
    await response.body?.cancel()
    return {
      is_up: response.status < 400,
      status_code: response.status,
      latency_ms: Math.round(performance.now() - startedAt),
      error: null,
    }
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === 'TimeoutError'
    return {
      is_up: false,
      status_code: null,
      latency_ms: null,
      error: isTimeout ? `Timed out after ${TIMEOUT_MS / 1000}s` : 'Could not connect',
    }
  }
}

export default {
  fetch: withSupabase({ auth: ['secret'] }, async (_req, ctx) => {
    const { data, error } = await ctx.supabaseAdmin.rpc('claim_checks', { batch_size: 50 })
    if (error) return Response.json({ error: error.message }, { status: 500 })
    const queued = (data ?? []) as QueuedCheck[]

    const results = await Promise.all(
      queued.map(async (check) => {
        // The monitor was deleted after the check was queued: just drop it.
        const result = check.url
          ? await checkUrl(check.url)
          : { is_up: true, status_code: null, latency_ms: null, error: null }
        const { error: recordError } = await ctx.supabaseAdmin.rpc('record_check', {
          msg_id: check.msg_id,
          monitor_id: check.monitor_id,
          ...result,
        })
        return recordError ? recordError.message : null
      })
    )

    const errors = results.filter(Boolean)
    return Response.json({ checked: queued.length, errors }, { status: errors.length ? 500 : 200 })
  }),
}
