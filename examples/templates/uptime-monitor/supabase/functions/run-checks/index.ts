// Worker for the `uptime_checks` queue. Called by the `uptime-queue-checks`
// Cron job with the project's secret key: claims queued checks in batches,
// requests each URL and records the result.

import '@supabase/functions-js/edge-runtime.d.ts'
import { withSupabase } from '@supabase/server'

const TIMEOUT_MS = 10_000
const MAX_REDIRECTS = 5
const BATCH_SIZE = 50
// Cron calls this every 30 seconds; stop claiming new batches after this long.
const TIME_BUDGET_MS = 20_000

interface QueuedCheck {
  msg_id: number
  monitor_id: string | null
  url: string | null
}

interface CheckResult {
  is_up: boolean
  status_code: number | null
  latency_ms: number | null
  error: string | null
}

/** True when the host is allowed. An empty allowlist allows every host. */
function isAllowedHost(hostname: string, allowedHosts: string[]) {
  if (allowedHosts.length === 0) return true
  const host = hostname.toLowerCase()
  return allowedHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))
}

function failure(error: string): CheckResult {
  return { is_up: false, status_code: null, latency_ms: null, error }
}

/**
 * Requests the URL, following redirects by hand so every URL requested,
 * including each redirect target, passes the host allowlist.
 */
async function checkUrl(url: string, allowedHosts: string[]): Promise<CheckResult> {
  const startedAt = performance.now()
  const signal = AbortSignal.timeout(TIMEOUT_MS)
  let current = url
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const target = new URL(current)
      if (target.protocol !== 'https:' && target.protocol !== 'http:') {
        return failure('Only http and https URLs can be monitored')
      }
      if (!isAllowedHost(target.hostname, allowedHosts)) {
        return failure(hop === 0 ? 'Host is not allowed' : 'Redirected to a host that is not allowed')
      }

      const response = await fetch(target, {
        method: 'GET',
        redirect: 'manual',
        signal,
        headers: { 'user-agent': 'supabase-uptime-monitor/1.0' },
      })
      await response.body?.cancel()

      const location = response.headers.get('location')
      if (response.status >= 300 && response.status < 400 && location) {
        current = new URL(location, target).toString()
        continue
      }
      return {
        is_up: response.status < 400,
        status_code: response.status,
        latency_ms: Math.round(performance.now() - startedAt),
        error: null,
      }
    }
    return failure(`More than ${MAX_REDIRECTS} redirects`)
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === 'TimeoutError'
    return failure(isTimeout ? `Timed out after ${TIMEOUT_MS / 1000}s` : 'Could not connect')
  }
}

export default {
  fetch: withSupabase({ auth: ['secret'] }, async (_req, ctx) => {
    const { data: hosts, error: hostsError } = await ctx.supabaseAdmin.rpc('allowed_monitor_hosts')
    if (hostsError) return Response.json({ error: hostsError.message }, { status: 500 })
    const allowedHosts = (hosts ?? []) as string[]

    const startedAt = Date.now()
    let checked = 0
    const errors: string[] = []

    // Drain the queue in batches until it's empty or the time budget runs out.
    while (Date.now() - startedAt < TIME_BUDGET_MS) {
      const { data, error } = await ctx.supabaseAdmin.rpc('claim_checks', {
        batch_size: BATCH_SIZE,
      })
      if (error) return Response.json({ error: error.message }, { status: 500 })
      const queued = (data ?? []) as QueuedCheck[]
      if (queued.length === 0) break

      const results = await Promise.all(
        queued.map(async (check) => {
          // The monitor was deleted after the check was queued: just drop it.
          const result = check.url
            ? await checkUrl(check.url, allowedHosts)
            : { is_up: true, status_code: null, latency_ms: null, error: null }
          const { error: recordError } = await ctx.supabaseAdmin.rpc('record_check', {
            msg_id: check.msg_id,
            monitor_id: check.monitor_id,
            ...result,
          })
          return recordError?.message ?? null
        })
      )
      checked += queued.length
      errors.push(...results.filter((message): message is string => message !== null))
      if (queued.length < BATCH_SIZE) break
    }

    return Response.json({ checked, errors }, { status: errors.length > 0 ? 500 : 200 })
  }),
}
