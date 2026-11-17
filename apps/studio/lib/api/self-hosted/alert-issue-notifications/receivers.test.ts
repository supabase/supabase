import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AlertIssueNotificationEvent } from './event'
import {
  configuredWebhookReceivers,
  createWebhookReceiver,
  parseWebhookReceivers,
} from './receivers'
import { signStandardWebhook } from './signature'
import { mswServer } from '@/tests/lib/msw'

const event: AlertIssueNotificationEvent = {
  event_id: 'evt_1',
  type: 'alert_issue.opened',
  occurred_at: '2026-11-17T10:00:00Z',
  policy: { name: 'critical-to-ops', receivers: ['ops'] },
  alert_issue: {
    alert_issue_id: 'ai_1',
    title: 'Edge Function errors: stripe-webhook',
    description: 'An Edge Function returned 5xx responses in the last hour.',
    status: 'open',
    severity: 'major',
    category: 'health',
    rule_key: 'supabase.edge-function-5xx',
    identifiers: { project: 'default', function_id: 'stripe-webhook' },
    signal_count: 1,
    first_seen_at: '2026-11-17T09:59:00Z',
    last_seen_at: '2026-11-17T10:00:00Z',
    version: 1794900000000000,
  },
}

const URL_OPS = 'https://hooks.example.com/ops'
const noSleep = () => Promise.resolve()

describe('parseWebhookReceivers', () => {
  it('parses a name to url and secret map', () => {
    expect(
      parseWebhookReceivers(JSON.stringify({ ops: { url: URL_OPS, secret: 'whsec_c2VjcmV0' } }))
    ).toEqual({ ops: { url: URL_OPS, secret: 'whsec_c2VjcmV0' } })
  })

  it('returns no receivers when unset', () => {
    expect(parseWebhookReceivers(undefined)).toEqual({})
  })

  it('throws on invalid JSON or a receiver without a URL', () => {
    expect(() => parseWebhookReceivers('{')).toThrow(/ALERT_ISSUE_WEBHOOK_RECEIVERS/)
    expect(() => parseWebhookReceivers(JSON.stringify({ ops: { secret: 'x' } }))).toThrow(
      /ALERT_ISSUE_WEBHOOK_RECEIVERS/
    )
  })
})

describe('configuredWebhookReceivers', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('has no receivers when the env var is unset', () => {
    vi.stubEnv('ALERT_ISSUE_WEBHOOK_RECEIVERS', '')
    expect(configuredWebhookReceivers('https://studio.example.com')).toEqual({})
  })

  it('builds a receiver per configured name', () => {
    vi.stubEnv(
      'ALERT_ISSUE_WEBHOOK_RECEIVERS',
      JSON.stringify({ ops: { url: URL_OPS, secret: 's' }, oncall: { url: URL_OPS, secret: 't' } })
    )
    expect(Object.keys(configuredWebhookReceivers('https://studio.example.com'))).toEqual([
      'ops',
      'oncall',
    ])
  })
})

describe('createWebhookReceiver', () => {
  afterEach(() => vi.useRealTimers())

  it('posts a Standard Webhooks request with a link to the alert issue', async () => {
    let request: Request | undefined
    let body = ''
    mswServer.use(
      http.post(URL_OPS, async ({ request: req }) => {
        request = req
        body = await req.text()
        return new HttpResponse(null, { status: 204 })
      })
    )
    const receiver = createWebhookReceiver(
      'ops',
      { url: URL_OPS, secret: 'whsec_c2VjcmV0' },
      { studioUrl: 'https://studio.example.com', sleep: noSleep }
    )

    const result = await receiver.deliver(event)

    expect(result).toEqual({ receiver: 'ops', status: 'delivered', http_status: 204, attempts: 1 })
    const id = request!.headers.get('webhook-id')
    const timestamp = Number(request!.headers.get('webhook-timestamp'))
    expect(id).toBe('evt_1:ops')
    expect(request!.headers.get('webhook-signature')).toBe(
      signStandardWebhook({ id: id!, timestamp, body, secret: 'whsec_c2VjcmV0' })
    )
    expect(JSON.parse(body)).toEqual({
      type: 'alert_issue.opened',
      occurred_at: '2026-11-17T10:00:00Z',
      data: {
        alert_issue: {
          ...event.alert_issue,
          url: 'https://studio.example.com/project/default/issues/alerts/ai_1',
        },
        policy: event.policy,
      },
    })
  })

  it('retries server errors and reports the final status', async () => {
    let calls = 0
    mswServer.use(
      http.post(URL_OPS, () => {
        calls += 1
        return calls < 3
          ? new HttpResponse(null, { status: 503 })
          : new HttpResponse(null, { status: 200 })
      })
    )
    const receiver = createWebhookReceiver(
      'ops',
      { url: URL_OPS, secret: 's' },
      { studioUrl: 'https://studio.example.com', sleep: noSleep }
    )

    expect(await receiver.deliver(event)).toEqual({
      receiver: 'ops',
      status: 'delivered',
      http_status: 200,
      attempts: 3,
    })
  })

  it('does not retry client errors', async () => {
    let calls = 0
    mswServer.use(
      http.post(URL_OPS, () => {
        calls += 1
        return new HttpResponse(null, { status: 410 })
      })
    )
    const receiver = createWebhookReceiver(
      'ops',
      { url: URL_OPS, secret: 's' },
      { studioUrl: 'https://studio.example.com', sleep: noSleep }
    )

    expect(await receiver.deliver(event)).toEqual({
      receiver: 'ops',
      status: 'failed',
      http_status: 410,
      attempts: 1,
    })
    expect(calls).toBe(1)
  })

  it('gives up after three failed attempts', async () => {
    mswServer.use(http.post(URL_OPS, () => HttpResponse.error()))
    const receiver = createWebhookReceiver(
      'ops',
      { url: URL_OPS, secret: 's' },
      { studioUrl: 'https://studio.example.com', sleep: noSleep }
    )

    expect(await receiver.deliver(event)).toEqual({
      receiver: 'ops',
      status: 'failed',
      attempts: 3,
    })
  })
})
