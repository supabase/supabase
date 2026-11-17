import { createHmac } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'

import type { AlertIssueNotificationEvent } from './event'
import { createSeenEvents, handleAlertIssueNotification } from './handler'
import type { NotificationReceiver } from './receivers'

const SECRET = 'notifier-secret'
const NOW = 1_794_900_000

const event: AlertIssueNotificationEvent = {
  event_id: 'evt_1',
  type: 'alert_issue.opened',
  occurred_at: '2026-11-17T10:00:00Z',
  policy: { name: 'critical-to-ops', receivers: ['ops', 'missing'] },
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
}

const signedRequest = (
  body: string,
  { timestamp = NOW, secret = SECRET }: { timestamp?: number; secret?: string } = {}
) =>
  new Request('http://studio/api/platform/alerts/notifications', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-logflare-event-id': 'evt_1',
      'x-logflare-timestamp': String(timestamp),
      'x-logflare-signature': `v1=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`,
    },
    body,
  })

const okReceiver = (name: string): NotificationReceiver => ({
  name,
  deliver: vi.fn(async () => ({
    receiver: name,
    status: 'delivered' as const,
    http_status: 200,
    attempts: 1,
  })),
})

const deps = (receivers: Record<string, NotificationReceiver>) => ({
  secret: SECRET,
  receivers,
  now: () => NOW,
  seenEvents: createSeenEvents(10),
  isPlatform: false,
})

describe('handleAlertIssueNotification', () => {
  it('fans a signed event out to its receivers and reports each delivery', async () => {
    const ops = okReceiver('ops')
    const response = await handleAlertIssueNotification(
      signedRequest(JSON.stringify(event)),
      deps({ ops })
    )

    expect(response.status).toBe(202)
    expect(await response.json()).toEqual({
      event_id: 'evt_1',
      deliveries: [
        { receiver: 'ops', status: 'delivered', http_status: 200, attempts: 1 },
        { receiver: 'missing', status: 'unknown_receiver' },
      ],
    })
    expect(ops.deliver).toHaveBeenCalledWith(event)
  })

  it('rejects an unsigned, wrongly signed or stale request without delivering', async () => {
    const ops = okReceiver('ops')
    const body = JSON.stringify(event)
    const unsigned = new Request('http://studio/x', { method: 'POST', body })

    for (const request of [
      unsigned,
      signedRequest(body, { secret: 'wrong' }),
      signedRequest(body, { timestamp: NOW - 600 }),
    ]) {
      const response = await handleAlertIssueNotification(request, deps({ ops }))
      expect(response.status).toBe(401)
    }
    expect(ops.deliver).not.toHaveBeenCalled()
  })

  it('rejects a signed body that is not a valid event', async () => {
    const response = await handleAlertIssueNotification(
      signedRequest(JSON.stringify({ ...event, type: 'alert_issue.exploded' })),
      deps({})
    )
    expect(response.status).toBe(422)
  })

  it('answers a repeated event id with the first result and delivers once', async () => {
    const ops = okReceiver('ops')
    const options = deps({ ops })
    const body = JSON.stringify(event)

    const first = await (await handleAlertIssueNotification(signedRequest(body), options)).json()
    const second = await handleAlertIssueNotification(signedRequest(body), options)

    expect(second.status).toBe(202)
    expect(await second.json()).toEqual(first)
    expect(ops.deliver).toHaveBeenCalledTimes(1)
  })

  it('is not served on the platform', async () => {
    const response = await handleAlertIssueNotification(signedRequest(JSON.stringify(event)), {
      ...deps({}),
      isPlatform: true,
    })
    expect(response.status).toBe(404)
  })

  it('refuses every request when no notifier secret is configured', async () => {
    const response = await handleAlertIssueNotification(signedRequest(JSON.stringify(event)), {
      ...deps({}),
      secret: undefined,
    })
    expect(response.status).toBe(401)
  })
})

describe('createSeenEvents', () => {
  it('forgets the oldest event past its capacity', () => {
    const seen = createSeenEvents(2)
    seen.set('a', { event_id: 'a', deliveries: [] })
    seen.set('b', { event_id: 'b', deliveries: [] })
    seen.set('c', { event_id: 'c', deliveries: [] })
    expect(seen.get('a')).toBeUndefined()
    expect(seen.get('c')).toEqual({ event_id: 'c', deliveries: [] })
  })
})
