import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getDemoDelays } from './mode'
import { simulateLogflareRequest, type DemoRequest } from './router'
import { resetDemoStores } from './store'

const T0 = Date.parse('2026-11-17T12:00:00Z')
const PROJECT = { 'filters[identifiers.project]': 'default' }
const FILTERS = { 'identifiers.project': 'default' }

const call = (path: string, request: DemoRequest, now = T0) =>
  simulateLogflareRequest(path, request, now)
const list = (now = T0) =>
  call('alerts/issues', { method: 'GET', searchParams: PROJECT }, now).body as {
    alert_issue_id: string
    unread: boolean
    status: string
    rule_key: string
  }[]

describe('simulateLogflareRequest', () => {
  beforeEach(() => {
    vi.stubEnv('ALERT_ISSUES_DEMO_SPEED', 'fast')
    resetDemoStores()
  })

  it('lists visible alert issues, unread until read', () => {
    const before = list()
    expect(before.some((issue) => issue.alert_issue_id === 'postgres-connections')).toBe(false)
    expect(
      before.find((issue) => issue.alert_issue_id === 'advisor-rls_disabled_in_public')?.unread
    ).toBe(true)

    const read = call('alerts/issues/reads', {
      method: 'POST',
      body: { alert_issue_ids: ['advisor-rls_disabled_in_public'], read: true, filters: FILTERS },
    })
    expect(read).toEqual({ status: 200, body: { count: 1 } })
    expect(
      list().find((issue) => issue.alert_issue_id === 'advisor-rls_disabled_in_public')?.unread
    ).toBe(false)
  })

  it('applies valid actions and refuses the rest', () => {
    const action = (name: string) =>
      call('alerts/issues/advisor-rls_disabled_in_public/actions', {
        method: 'POST',
        body: { action: name, actor: 'self-hosted', filters: FILTERS },
      })

    expect(action('acknowledge')).toMatchObject({ status: 200, body: { status: 'acknowledged' } })
    expect(action('acknowledge').status).toBe(409)
    expect(action('resolve')).toMatchObject({ body: { status: 'resolved', change: 'resolved' } })
    expect(action('reopen')).toMatchObject({ body: { status: 'open', change: 'reopened' } })
  })

  it('adds comments and validates them', () => {
    const path = 'alerts/issues/edge-5xx-stripe-webhook/comments'
    const added = call(path, {
      method: 'POST',
      searchParams: PROJECT,
      body: { author: 'self-hosted', body: 'On it' },
    })

    expect(added).toMatchObject({ status: 201, body: { author: 'self-hosted', body: 'On it' } })
    expect(
      call(path, { method: 'POST', searchParams: PROJECT, body: { author: 'x', body: ' ' } }).status
    ).toBe(422)
    expect(call(path, { method: 'GET', searchParams: PROJECT }).body).toHaveLength(3)
  })

  it('returns an alert issue log preview for the requested range', () => {
    const events = (from: number) =>
      call('alerts/issues/edge-5xx-stripe-webhook/events', {
        method: 'GET',
        searchParams: {
          ...PROJECT,
          from: new Date(from).toISOString(),
          to: new Date(T0).toISOString(),
        },
      }).body as { total: number; lql: string }

    expect(events(T0 - 3_600_000).lql).toBe(
      'f:function_edge_logs m.function_id:"stripe-webhook" m.status_code:>=500'
    )
    expect(events(T0 - 7 * 86_400_000).total).toBeGreaterThan(events(T0 - 3_600_000).total)
  })

  it('previews LQL filters', () => {
    const preview = call('alerts/preview', {
      method: 'POST',
      body: { lql: 'f:function_logs m.level:error' },
    })

    expect(preview.status).toBe(200)
    expect((preview.body as { total: number }).total).toBeGreaterThan(0)
    expect(call('alerts/preview', { method: 'POST', body: { lql: 'm.level:error' } }).status).toBe(
      422
    )
  })

  it('opens grouped alert issues on a custom rule first scheduled run', () => {
    const created = call('alerts/issue_types', {
      method: 'POST',
      body: {
        name: 'Edge Function runtime errors',
        lql: 'f:function_logs m.level:error',
        severity: 'warning',
        category: 'health',
        group_by: ['metadata.function_id'],
        identifiers: { project: 'default' },
      },
    })
    expect(created).toMatchObject({
      status: 201,
      body: { rule_key: 'custom.edge-function-runtime-errors', managed: false },
    })

    const titles = (now: number) => list(now).map((issue) => issue.alert_issue_id)
    expect(titles(T0).some((id) => id.startsWith('custom.edge-function-runtime-errors'))).toBe(
      false
    )

    const fired = list(T0 + getDemoDelays().customRuleMs).filter((issue) =>
      issue.rule_key.startsWith('custom.edge-function-runtime-errors')
    )
    expect(fired.length).toBeGreaterThan(0)
  })

  it('hides silenced alert issue types and shows them again when the silence is removed', () => {
    const silence = call('alerts/silences', {
      method: 'POST',
      body: {
        rule_key: 'supabase.advisor.unindexed_foreign_keys',
        matchers: { project: 'default' },
        created_by: 'self-hosted',
      },
    })
    const id = (silence.body as { id: string }).id
    const hasUnindexed = () =>
      list().some((issue) => issue.alert_issue_id === 'advisor-unindexed_foreign_keys')

    expect(silence.status).toBe(201)
    expect(hasUnindexed()).toBe(false)
    const types = call('alerts/issue_types', { method: 'GET', searchParams: PROJECT }).body as {
      rule_key: string
      silenced: boolean
    }[]
    expect(
      types.find((type) => type.rule_key === 'supabase.advisor.unindexed_foreign_keys')?.silenced
    ).toBe(true)

    expect(call(`alerts/silences/${id}`, { method: 'DELETE' }).status).toBe(204)
    expect(hasUnindexed()).toBe(true)
  })

  it('deletes only custom alert issue types', () => {
    list()
    expect(call('alerts/issue_types/supabase.edge-function-5xx', { method: 'DELETE' }).status).toBe(
      422
    )
    expect(call('alerts/issue_types/custom.auth-rate-limits', { method: 'DELETE' }).status).toBe(
      204
    )
  })
})
