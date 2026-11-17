import { createHmac } from 'node:crypto'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { mswServer } from '@/tests/lib/msw'

const SECRET = 'notifier-secret'

async function loadRoute() {
  vi.resetModules()
  vi.stubEnv('ALERT_ISSUE_NOTIFIER_SECRET', SECRET)
  vi.stubEnv(
    'ALERT_ISSUE_WEBHOOK_RECEIVERS',
    JSON.stringify({ ops: { url: 'https://hooks.example.com/ops', secret: 'whsec_c2VjcmV0' } })
  )
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://studio.example.com')
  const { Route } = await import('@/routes/api/platform/alerts/notifications')
  const handlers = Route.options.server?.handlers
  if (!handlers || typeof handlers === 'function' || !handlers.POST) throw new Error('no POST')
  return handlers.POST
}

describe('POST /api/platform/alerts/notifications', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('delivers a signed Logflare event to the configured webhook receiver', async () => {
    let delivered: { url?: string } = {}
    mswServer.use(
      http.post('https://hooks.example.com/ops', async ({ request }) => {
        const body = (await request.json()) as { data: { alert_issue: { url: string } } }
        delivered = { url: body.data.alert_issue.url }
        return new HttpResponse(null, { status: 200 })
      })
    )
    const POST = await loadRoute()
    const timestamp = Math.floor(Date.now() / 1000)
    const body = JSON.stringify({
      event_id: 'evt_route',
      type: 'alert_issue.opened',
      occurred_at: '2026-11-17T10:00:00Z',
      policy: { name: 'all', receivers: ['ops'] },
      alert_issue: {
        alert_issue_id: 'ai_1',
        title: 'Edge Function errors: stripe-webhook',
        description: null,
        status: 'open',
        severity: 'major',
        category: 'health',
        rule_key: 'supabase.edge-function-5xx',
        identifiers: { project: 'default' },
        signal_count: 1,
        first_seen_at: '2026-11-17T09:59:00Z',
        last_seen_at: '2026-11-17T10:00:00Z',
        version: 1,
      },
    })
    const signature = createHmac('sha256', SECRET).update(`${timestamp}.${body}`).digest('hex')

    const response = await POST({
      request: new Request('http://localhost:8082/api/platform/alerts/notifications', {
        method: 'POST',
        headers: {
          'x-logflare-event-id': 'evt_route',
          'x-logflare-timestamp': String(timestamp),
          'x-logflare-signature': `v1=${signature}`,
        },
        body,
      }),
    } as never)
    if (!(response instanceof Response)) throw new Error('expected a Response')

    expect(response.status).toBe(202)
    expect(await response.json()).toMatchObject({
      event_id: 'evt_route',
      deliveries: [{ receiver: 'ops', status: 'delivered', http_status: 200 }],
    })
    expect(delivered.url).toBe('https://studio.example.com/project/default/issues/alerts/ai_1')
  })
})
