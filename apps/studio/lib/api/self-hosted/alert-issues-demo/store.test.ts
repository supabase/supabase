import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getDemoDelays } from './mode'
import { ASSISTANT_AUTHOR, getDemoStore, resetDemoStores } from './store'

const T0 = Date.parse('2026-11-17T12:00:00Z')

describe('alert issues demo store', () => {
  beforeEach(() => {
    vi.stubEnv('ALERT_ISSUES_DEMO_SPEED', 'fast')
    resetDemoStores()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.useRealTimers()
  })

  it('seeds an alert issue for every built feature', () => {
    const store = getDemoStore('default', T0)
    const byId = (id: string) => store.issues.find((issue) => issue.alert_issue_id === id)

    expect(
      store.issues.filter((issue) => issue.rule_key.startsWith('supabase.advisor.'))
    ).toHaveLength(8)
    expect(byId('advisor-rls_disabled_in_public')).toMatchObject({
      title: 'RLS Disabled in Public: public.orders',
      severity: 'critical',
      identifiers: { project: 'default', schema: 'public', table: 'orders' },
      metadata: { remediation: expect.stringContaining('0013_rls_disabled_in_public') },
      notebook: [{ title: 'Rows readable with the anon key' }, { title: 'Enable RLS' }],
    })
    expect(byId('edge-5xx-stripe-webhook')?.investigation?.status).toBe('completed')
    expect(byId('edge-5xx-send-email')?.investigation?.status).toBe('timed_out')
    expect(byId('edge-5xx-resize-image')?.status).toBe('acknowledged')
    expect(byId('edge-5xx-image-proxy')?.status).toBe('resolved')
    expect(store.comments.filter((c) => c.author === ASSISTANT_AUTHOR)).toHaveLength(1)
    expect(store.rules.some((rule) => !rule.managed)).toBe(true)
  })

  it('seeds each project once and keeps its changes', () => {
    const store = getDemoStore('default', T0)
    store.reads.set('advisor-rls_disabled_in_public', T0)

    expect(getDemoStore('default', T0 + 1000)).toBe(store)
    expect(getDemoStore('other', T0)).not.toBe(store)
  })

  it('delivers the scheduled alert issue pending, then completes its investigation', () => {
    const { arrivalMs, investigationMs } = getDemoDelays()
    const pending = () =>
      getDemoStore('default').issues.find((i) => i.alert_issue_id === 'postgres-connections')

    vi.useFakeTimers()
    vi.setSystemTime(T0)
    getDemoStore('default')
    expect(pending()).toBeUndefined()

    vi.setSystemTime(T0 + arrivalMs)
    expect(pending()?.investigation?.status).toBe('pending')

    vi.setSystemTime(T0 + arrivalMs + investigationMs)
    const issue = pending()
    expect(issue?.investigation?.status).toBe('completed')
    expect(issue?.attention_at).toBe(new Date(T0 + arrivalMs + investigationMs).toISOString())
    expect(
      getDemoStore('default').comments.find((c) => c.alert_issue_id === 'postgres-connections')
    ).toMatchObject({
      author: ASSISTANT_AUTHOR,
      body: expect.stringContaining('Initial investigation'),
    })
  })
})
