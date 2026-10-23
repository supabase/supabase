import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { issueNotificationRuleInputSchema } from '../issue-notification-schema'
import { issueDocumentSchema, issueSchema, markdownDocument } from '../issue-schema'
import {
  createIssue,
  createIssueComment,
  deleteIssueNotificationRule,
  getIssue,
  listIssueCheckRuns,
  listIssueChecks,
  listIssueNotificationRules,
  listIssues,
  listIssueTimeline,
  MOCK_ASSISTANT_REPLY_DELAY_MS,
  reportCheckRun,
  resetIssuesMock,
  saveIssueNotificationRule,
  updateAffectedResource,
  updateIssue,
  updateIssueCheck,
} from './issues-mock-api'
import { buildSeedDb, MOCK_DB_VERSION } from './issues-mock-fixtures'
import type { IssueAffectedResourceDraft, IssueDraft } from './lint-to-issue'

const projectRef = 'test-project'
const run = async <T>(promise: Promise<T>) => {
  await vi.advanceTimersByTimeAsync(500)
  return promise
}
const payload = {
  title: 'Nightly import failed',
  body: markdownDocument('The import notebook returned errors.'),
  severity: 'warning' as const,
  category: 'data' as const,
  fingerprint: 'agent:nightly-import-errors',
}
// A state check: opens and clears on a single run, resolves automatically
const check: IssueDraft = {
  ...payload,
  fingerprint: 'check:auth_otp_long_expiry',
  origin: { type: 'check', check_id: 'auth_otp_long_expiry', check_name: 'OTP expiry' },
}
// A threshold check: opens after 5 minutes failing, clears after 10 minutes passing, and
// resolves an hour after the last failing stretch ended
const errorRateCheck: IssueDraft = {
  ...payload,
  category: 'health',
  fingerprint: 'check:log_auth_error_rate_high',
  origin: { type: 'check', check_id: 'log_auth_error_rate_high', check_name: 'Auth errors' },
}
// An event check: recovering doesn't resolve it, a person does
const eventCheck: IssueDraft = {
  ...payload,
  category: 'security',
  fingerprint: 'check:leaked_service_key',
  origin: { type: 'check', check_id: 'leaked_service_key', check_name: 'Leaked key' },
}
const finding = (name: string): IssueAffectedResourceDraft => ({
  key: name,
  resource: { type: 'table', schema: 'public', name },
  detail: `${name} needs attention`,
})
const errorRate = (value: number): IssueAffectedResourceDraft => ({
  key: 'auth',
  resource: null,
  detail: `${value}% of Auth requests failed`,
  value,
  threshold: 1,
  unit: '%',
})
const report = (issue: IssueDraft, findings: IssueAffectedResourceDraft[]) =>
  run(reportCheckRun({ projectRef, issue, findings }))
const fiveMinutesLater = () => vi.advanceTimersByTimeAsync(5 * 60_000)
const HOUR_MS = 60 * 60_000
const DAY_MS = 24 * HOUR_MS

describe('issues mock API', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.localStorage.clear()
    resetIssuesMock(projectRef)
  })
  afterEach(() => vi.useRealTimers())

  it.each([
    { channel: 'slack', destination: '#project-alerts' },
    { channel: 'linear', destination: 'Engineering' },
    { channel: 'claude_code', destination: 'Production triage' },
    { channel: 'webhook', destination: 'https://example.com/issues' },
  ])('creates, edits, disables and deletes a $channel notification rule', async (destination) => {
    const rule = issueNotificationRuleInputSchema.parse({
      ...destination,
      severity: 'critical',
      check_ids: [],
      is_enabled: true,
    })
    const saved = await run(saveIssueNotificationRule({ projectRef, rule }))
    expect(saved).toMatchObject(rule)
    const updated = await run(
      saveIssueNotificationRule({
        projectRef,
        id: saved.id,
        rule: {
          ...rule,
          severity: 'all',
          check_ids: ['rls_disabled_in_public', 'auth_otp_long_expiry'],
          is_enabled: false,
        },
      })
    )
    expect(updated.check_ids).toEqual(['rls_disabled_in_public', 'auth_otp_long_expiry'])
    expect(updated.id).toBe(saved.id)
    expect(await run(listIssueNotificationRules({ projectRef }))).toEqual([updated])
    expect(
      JSON.parse(window.localStorage.getItem(`supabase-issues-mock:${projectRef}`)!)
    ).toMatchObject({ notification_rules: [updated] })
    await run(deleteIssueNotificationRule({ projectRef, id: saved.id }))
    expect(await run(listIssueNotificationRules({ projectRef }))).toEqual([])
  })

  it('restores saved state per project and reseeds state from an older prototype', async () => {
    const savedProject = 'saved-notification-settings'
    const rule = {
      id: 'saved-rule',
      channel: 'slack',
      destination: '#alerts',
      severity: 'all',
      check_ids: [],
      is_enabled: false,
    }
    window.localStorage.setItem(
      `supabase-issues-mock:${savedProject}`,
      JSON.stringify({ ...buildSeedDb(savedProject), notification_rules: [rule] })
    )
    expect(await run(listIssueNotificationRules({ projectRef: savedProject }))).toEqual([rule])
    expect(await run(listIssueNotificationRules({ projectRef }))).toEqual([])

    const oldProject = 'older-prototype'
    const key = `supabase-issues-mock:${oldProject}`
    const seed = buildSeedDb(oldProject)
    window.localStorage.setItem(
      key,
      JSON.stringify({ ...seed, version: MOCK_DB_VERSION - 1, notification_rules: [rule] })
    )
    const { issues } = await run(listIssues({ projectRef: oldProject, filters: {} }))
    const savedIds = new Set(seed.issues.map(({ id }) => id))
    expect(issues.length).toBeGreaterThan(0)
    expect(issues.some(({ id }) => savedIds.has(id))).toBe(false)
    expect(await run(listIssueNotificationRules({ projectRef: oldProject }))).toEqual([])
    expect(JSON.parse(window.localStorage.getItem(key)!)).toMatchObject({
      version: MOCK_DB_VERSION,
    })
  })

  it.each(['', '   ', 'not-a-url', 'javascript:alert(1)', 'ftp://example.com'])(
    'rejects invalid webhook destinations (%s) without saving a rule',
    async (destination) => {
      const promise = saveIssueNotificationRule({
        projectRef,
        rule: {
          channel: 'webhook',
          destination,
          severity: 'all',
          check_ids: [],
          is_enabled: true,
        },
      })
      const rejection = expect(promise).rejects.toMatchObject({ code: 400 })
      await vi.advanceTimersByTimeAsync(500)
      await rejection
      expect(await run(listIssueNotificationRules({ projectRef }))).toEqual([])
    }
  )

  it('does not recreate a deleted rule when an outdated editor saves', async () => {
    const promise = saveIssueNotificationRule({
      projectRef,
      id: 'deleted-rule',
      rule: {
        channel: 'slack',
        destination: '#alerts',
        severity: 'all',
        check_ids: [],
        is_enabled: true,
      },
    })
    const rejection = expect(promise).rejects.toMatchObject({ code: 404 })
    await vi.advanceTimersByTimeAsync(500)
    await rejection
    expect(await run(listIssueNotificationRules({ projectRef }))).toEqual([])
  })

  it('returns valid notebook documents and one current issue per check', async () => {
    const { issues } = await run(listIssues({ projectRef, filters: {} }))
    issues.forEach((issue) => expect(issueSchema.safeParse(issue).success).toBe(true))
    const checks = issues.filter((issue) => issue.origin.type === 'check')
    // A check only files another issue once its last one was resolved past the reopen window
    const refiled = checks.filter((issue) => issue.previous_issue_id !== null)
    expect(refiled.length).toBeGreaterThan(0)
    refiled.forEach((issue) =>
      expect(checks.find(({ id }) => id === issue.previous_issue_id)).toMatchObject({
        fingerprint: issue.fingerprint,
        status: 'resolved',
      })
    )
    const current = checks.filter(
      ({ id }) => !refiled.some(({ previous_issue_id }) => previous_issue_id === id)
    )
    expect(new Set(current.map((issue) => issue.fingerprint)).size).toBe(current.length)
    expect(checks.some((issue) => issue.affected.length > 1)).toBe(true)
  })

  it('lists all check categories, including checks without current issues', async () => {
    const checks = await run(listIssueChecks({ projectRef }))
    expect(new Set(checks.map((check) => check.category))).toEqual(
      new Set(['security', 'health', 'performance'])
    )
    expect(checks.every((check) => check.is_enabled)).toBe(true)
    expect(
      checks.every((check) => typeof check.summary === 'string' && check.summary.length > 0)
    ).toBe(true)
    expect(new Set(checks.map((check) => check.id)).size).toBe(checks.length)
    expect(checks.some((check) => check.id === 'log_auth_error_rate_high')).toBe(true)
  })

  it('pauses detections without changing existing issues and resumes when enabled', async () => {
    const { issues } = await run(listIssues({ projectRef, filters: {} }))
    const issue = issues.find((item) => item.fingerprint === 'check:rls_disabled_in_public')!
    const beforeEvents = (await run(listIssueTimeline({ projectRef, id: issue.id }))).events
    await run(updateIssueCheck({ projectRef, checkId: 'rls_disabled_in_public', isEnabled: false }))
    const skipped = await report(issue, [])
    expect(skipped.issue).toEqual(issue)
    expect(skipped.run).toMatchObject({ check_id: 'rls_disabled_in_public', status: 'skipped' })
    expect((await run(listIssueTimeline({ projectRef, id: issue.id }))).events).toEqual(
      beforeEvents
    )
    expect(
      JSON.parse(window.localStorage.getItem(`supabase-issues-mock:${projectRef}`)!)
    ).toMatchObject({
      disabled_check_ids: ['rls_disabled_in_public'],
    })
    await run(updateIssueCheck({ projectRef, checkId: 'rls_disabled_in_public', isEnabled: true }))
    const resumed = await report(issue, [finding('new_table')])
    expect(resumed.issue?.occurrence_count).toBe(issue.occurrence_count + 1)
  })

  it('restores project-specific settings and skips new issues for disabled checks', async () => {
    const savedProject = 'saved-check-settings'
    const checkId = 'log_auth_error_rate_high'
    window.localStorage.setItem(
      `supabase-issues-mock:${savedProject}`,
      JSON.stringify({
        ...buildSeedDb(savedProject),
        disabled_check_ids: [checkId],
      })
    )
    const checks = await run(listIssueChecks({ projectRef: savedProject }))
    expect(checks.find((check) => check.id === checkId)?.is_enabled).toBe(false)
    const draft: IssueDraft = {
      ...check,
      fingerprint: `check:${checkId}`,
      origin: { type: 'check', check_id: checkId, check_name: 'Auth errors' },
    }
    const skipped = await run(
      reportCheckRun({ projectRef: savedProject, issue: draft, findings: [finding('auth')] })
    )
    expect(skipped).toMatchObject({ run: { status: 'skipped' }, issue: undefined })
    expect(
      (await run(listIssueChecks({ projectRef }))).find((check) => check.id === checkId)?.is_enabled
    ).toBe(true)
  })

  it('files notebook-based reviews as agent issues with the reference in the body', async () => {
    const { issues } = await run(
      listIssues({ projectRef, filters: { origin: ['manual'], search: 'Order pipeline checks' } })
    )
    expect(issues).toHaveLength(1)
    expect(issues[0].created_by.type).toBe('assistant')
    expect(issues[0].origin).toEqual({ type: 'manual' })
    expect(issues[0].body.cells[0]).toMatchObject({
      _tag: 'markdown_cell',
      text: expect.stringContaining(
        `[Order pipeline checks](/project/${projectRef}/explorer/notebook/nb-order-pipeline)`
      ),
    })
  })

  it('filters by status and reports per-status counts for the other filters', async () => {
    const dismissed = await run(
      createIssue({ projectRef, payload: { ...payload, category: 'security' } })
    )
    await run(updateIssue({ projectRef, id: dismissed.id, payload: { status: 'dismissed' } }))
    const { issues, counts } = await run(
      listIssues({ projectRef, filters: { status: ['open'], category: ['security'] } })
    )
    expect(issues.length).toBeGreaterThan(0)
    expect(issues.every((issue) => issue.status === 'open' && issue.category === 'security')).toBe(
      true
    )
    expect(counts.open).toBe(issues.length)
    expect(counts.dismissed).toBeGreaterThan(0)
  })

  it('sorts critical issues first and searches affected resources', async () => {
    const { issues } = await run(listIssues({ projectRef, filters: { status: ['open'] } }))
    const firstNonCritical = issues.findIndex((issue) => issue.severity !== 'critical')
    expect(issues.slice(firstNonCritical).some((issue) => issue.severity === 'critical')).toBe(
      false
    )
    await report(check, [finding('unique_resource')])
    const result = await run(listIssues({ projectRef, filters: { search: 'unique_resource' } }))
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0].fingerprint).toBe(check.fingerprint)
  })

  it('deduplicates repeated reports and reopens resolved issues', async () => {
    const first = await run(createIssue({ projectRef, payload }))
    const second = await run(createIssue({ projectRef, payload }))
    expect(second.id).toBe(first.id)
    expect(second.occurrence_count).toBe(2)
    await run(updateIssue({ projectRef, id: first.id, payload: { status: 'resolved' } }))
    const reopened = await run(createIssue({ projectRef, payload }))
    expect(reopened.status).toBe('open')
    const events = (await run(listIssueTimeline({ projectRef, id: first.id }))).events
    expect(events.map((event) => event.type === 'status_changed' && event.to)).toEqual([
      false,
      'resolved',
      'open',
    ])
  })

  it('adds, refreshes, clears and regresses affected resources on the same issue', async () => {
    const first = (await report(check, [finding('a'), finding('b')])).issue
    expect(first?.affected).toHaveLength(2)
    const next = (await report(check, [finding('b'), finding('c')])).issue
    expect(next?.id).toBe(first?.id)
    expect(next?.affected.map(({ key, status }) => [key, status])).toEqual([
      ['a', 'cleared'],
      ['b', 'open'],
      ['c', 'open'],
    ])
    const cleared = (await report(check, [])).issue
    expect(cleared?.status).toBe('resolved')
    const regressed = (await report(check, [finding('a')])).issue
    expect(regressed?.status).toBe('open')
    expect(regressed?.affected[0].id).toBe(first?.affected[0].id)
    expect(regressed?.affected).toHaveLength(3)
    expect(regressed).toBeDefined()
    if (!regressed) return

    // Affected resources coming and going are episodes; only the issue's own changes are events
    const events = (await run(listIssueTimeline({ projectRef, id: regressed.id }))).events
    expect(
      events.map((event) => [
        event.type,
        event.type === 'status_changed' && `${event.from}→${event.to}`,
        event.actor.type,
      ])
    ).toEqual([
      ['created', false, 'system'],
      ['status_changed', 'open→resolved', 'system'],
      ['status_changed', 'resolved→open', 'system'],
    ])
    const episodes = (await run(listIssueTimeline({ projectRef, id: regressed.id }))).episodes
    const keyById = new Map(regressed.affected.map(({ id, key }) => [id, key]))
    expect(
      episodes.map((episode) => [
        keyById.get(episode.affected_id),
        episode.failing_run_count,
        episode.ended_at === null,
      ])
    ).toEqual([
      ['a', 1, false],
      ['b', 2, false],
      ['c', 1, false],
      ['a', 1, true],
    ])
  })

  it('keeps a manual check open through recovery, with an episode per failing stretch', async () => {
    const reportLeak = (isFailing: boolean) => report(eventCheck, isFailing ? [finding('api')] : [])
    const first = (await reportLeak(true)).issue
    expect(first).toBeDefined()
    if (!first) return
    await run(
      createIssueComment({ projectRef, id: first.id, body: markdownDocument('Checking the logs.') })
    )
    for (let i = 1; i < 50; i++) await reportLeak(true)

    await reportLeak(false)
    const healthy = (await reportLeak(false)).issue
    expect(healthy).toMatchObject({ status: 'open', resolved_at: null })
    expect(healthy?.affected[0].status).toBe('cleared')
    await reportLeak(true)
    const recurring = (await reportLeak(true)).issue
    expect(recurring).toMatchObject({ id: first.id, status: 'open', occurrence_count: 52 })
    expect(recurring?.affected).toHaveLength(1)
    expect(recurring?.affected[0]).toMatchObject({ id: first.affected[0].id, status: 'open' })

    // 54 runs, and the timeline only has what people did
    const events = (await run(listIssueTimeline({ projectRef, id: first.id }))).events
    expect(events.map(({ type }) => type)).toEqual(['created', 'comment'])
    const episodes = (await run(listIssueTimeline({ projectRef, id: first.id }))).episodes
    expect(
      episodes.map(({ failing_run_count, ended_at }) => [failing_run_count, ended_at === null])
    ).toEqual([
      [50, false],
      [2, true],
    ])
  })

  it('does not create an issue for a passing check', async () => {
    expect(await report(check, [])).toMatchObject({
      run: { status: 'passed', finding_count: 0 },
      issue: undefined,
    })
  })

  it('waits out fire_after, then keeps a one-check dip in the same episode', async () => {
    const rates = [4.2, 4.1, 3.9, 0.4, 3.8, 4.0]
    const results = []
    for (const [index, value] of rates.entries()) {
      if (index > 0) await fiveMinutesLater()
      results.push(await report(errorRateCheck, value > 1 ? [errorRate(value)] : []))
    }
    expect(results.map(({ run }) => run.status)).toEqual([
      'failed',
      'failed',
      'failed',
      'passed',
      'failed',
      'failed',
    ])
    // The first failing check only starts the clock
    expect(results[0].issue).toBeUndefined()
    // The dip starts recovering without clearing anything
    expect(results[3].issue?.affected[0]).toMatchObject({
      status: 'open',
      passing_since: results[3].run.started_at,
    })

    const issue = results[5].issue!
    expect(issue).toMatchObject({ status: 'open', occurrence_count: 5 })
    expect(issue.affected).toEqual([
      expect.objectContaining({
        status: 'open',
        value: 4,
        threshold: 1,
        unit: '%',
        failing_since: results[0].run.started_at,
        passing_since: null,
      }),
    ])
    expect((await run(listIssueTimeline({ projectRef, id: issue.id }))).episodes).toEqual([
      expect.objectContaining({
        started_at: results[0].run.started_at,
        ended_at: null,
        failing_run_count: 5,
        peak_value: 4.2,
      }),
    ])
    const events = (await run(listIssueTimeline({ projectRef, id: issue.id }))).events
    expect(events.map(({ type }) => type)).toEqual(['created'])
  })

  it('forgets a pending finding that passes before fire_after', async () => {
    expect((await report(errorRateCheck, [errorRate(4.2)])).issue).toBeUndefined()
    await fiveMinutesLater()
    await report(errorRateCheck, [])
    await fiveMinutesLater()
    // A new failing stretch starts the clock again
    expect((await report(errorRateCheck, [errorRate(4.2)])).issue).toBeUndefined()
  })

  it('clears after resolve_after, then resolves the issue an hour after recovery', async () => {
    await report(errorRateCheck, [errorRate(4.2)])
    await fiveMinutesLater()
    await report(errorRateCheck, [errorRate(4.1)])
    await fiveMinutesLater()
    const recovering = await report(errorRateCheck, [])
    await fiveMinutesLater()
    const stillRecovering = await report(errorRateCheck, [])
    expect(stillRecovering.issue).toMatchObject({ status: 'open' })
    expect(stillRecovering.issue?.affected[0]).toMatchObject({
      status: 'open',
      passing_since: recovering.run.started_at,
    })
    await fiveMinutesLater()
    const cleared = (await report(errorRateCheck, [])).issue
    // The affected resource clears, but the issue waits out the hour
    expect(cleared).toMatchObject({ status: 'open' })
    expect(cleared?.affected[0]).toMatchObject({
      status: 'cleared',
      failing_since: null,
      passing_since: null,
    })
    expect((await run(listIssueTimeline({ projectRef, id: cleared!.id }))).episodes).toEqual([
      expect.objectContaining({ ended_at: recovering.run.started_at, failing_run_count: 2 }),
    ])

    const later = []
    for (let i = 0; i < 10; i++) {
      await fiveMinutesLater()
      later.push((await report(errorRateCheck, [])).issue)
    }
    // An hour after the first normal check
    expect(later.at(-2)?.status).toBe('open')
    expect(later.at(-1)?.status).toBe('resolved')
    const events = (await run(listIssueTimeline({ projectRef, id: cleared!.id }))).events
    expect(events.map(({ type }) => type)).toEqual(['created', 'status_changed'])
  })

  it('keeps a rate that settles and comes back within the hour as one open issue', async () => {
    const rates = [4.2, 4.1, 3.9, 0.4, 0.3, 0.5, 3.8, 4.0]
    const results = []
    for (const [index, value] of rates.entries()) {
      if (index > 0) await fiveMinutesLater()
      results.push(await report(errorRateCheck, value > 1 ? [errorRate(value)] : []))
    }
    expect(results.map(({ issue }) => issue?.status ?? null)).toEqual([
      null,
      'open',
      'open',
      'open',
      'open',
      'open',
      'open',
      'open',
    ])
    const issue = results[7].issue!
    expect(issue.affected[0]).toMatchObject({
      status: 'open',
      failing_since: results[6].run.started_at,
    })
    expect((await run(listIssueTimeline({ projectRef, id: issue.id }))).episodes).toEqual([
      expect.objectContaining({
        started_at: results[0].run.started_at,
        ended_at: results[3].run.started_at,
        failing_run_count: 3,
        peak_value: 4.2,
      }),
      expect.objectContaining({
        started_at: results[6].run.started_at,
        ended_at: null,
        failing_run_count: 2,
        peak_value: 4,
      }),
    ])
    const events = (await run(listIssueTimeline({ projectRef, id: issue.id }))).events
    expect(events.map(({ type }) => type)).toEqual(['created'])
  })

  it('reopens a resolved threshold issue as a regression', async () => {
    // Up for two checks, normal for 65 minutes, then up for two more
    const rates = [4.2, 4.1, ...Array(13).fill(0.3), 3.8, 4.0]
    const results = []
    for (const [index, value] of rates.entries()) {
      if (index > 0) await fiveMinutesLater()
      results.push(await report(errorRateCheck, value > 1 ? [errorRate(value)] : []))
    }
    expect(results.slice(13).map(({ issue }) => issue?.status)).toEqual([
      'open',
      'resolved',
      'resolved',
      'open',
    ])
    const issue = results.at(-1)!.issue!
    expect(issue.id).toBe(results[1].issue?.id)
    expect((await run(listIssueTimeline({ projectRef, id: issue.id }))).episodes).toHaveLength(2)
    const events = (await run(listIssueTimeline({ projectRef, id: issue.id }))).events
    expect(
      events.map((event) => event.type === 'status_changed' && `${event.from}→${event.to}`)
    ).toEqual([false, 'open→resolved', 'resolved→open'])
  })

  it('reopens a threshold issue resolved within its reopen window', async () => {
    await report(errorRateCheck, [errorRate(4.2)])
    await fiveMinutesLater()
    const first = (await report(errorRateCheck, [errorRate(4.1)])).issue!
    await run(updateIssue({ projectRef, id: first.id, payload: { status: 'resolved' } }))

    await vi.advanceTimersByTimeAsync(12 * HOUR_MS)
    await report(errorRateCheck, [errorRate(3.8)])
    await fiveMinutesLater()
    const reopened = (await report(errorRateCheck, [errorRate(4.0)])).issue!
    expect(reopened).toMatchObject({ id: first.id, status: 'open', previous_issue_id: null })
  })

  it('files a new linked issue when a threshold check fires after its reopen window', async () => {
    await report(errorRateCheck, [errorRate(4.2)])
    await fiveMinutesLater()
    const first = (await report(errorRateCheck, [errorRate(4.1)])).issue!
    await run(updateIssue({ projectRef, id: first.id, payload: { status: 'resolved' } }))

    // Two weeks later it's up again for long enough to open
    await vi.advanceTimersByTimeAsync(14 * DAY_MS)
    expect((await report(errorRateCheck, [errorRate(3.8)])).issue).toBeUndefined()
    await fiveMinutesLater()
    const next = (await report(errorRateCheck, [errorRate(4.0)])).issue!
    expect(next.id).not.toBe(first.id)
    expect(next).toMatchObject({
      status: 'open',
      fingerprint: first.fingerprint,
      previous_issue_id: first.id,
      occurrence_count: 2,
    })

    // The old issue stays resolved and notes where it went
    expect(await run(getIssue({ projectRef, id: first.id }))).toMatchObject({ status: 'resolved' })
    const { events } = await run(listIssueTimeline({ projectRef, id: first.id }))
    expect(events.at(-1)).toMatchObject({ type: 'recurred', next_issue_id: next.id })

    // Later runs update the new issue
    await fiveMinutesLater()
    expect((await report(errorRateCheck, [errorRate(4.4)])).issue?.id).toBe(next.id)
  })

  it('keeps reopening a lint issue however long ago it was resolved', async () => {
    const first = (await report(check, [finding('a')])).issue!
    await run(updateIssue({ projectRef, id: first.id, payload: { status: 'resolved' } }))
    await vi.advanceTimersByTimeAsync(60 * DAY_MS)
    const reopened = (await report(check, [finding('a')])).issue!
    expect(reopened).toMatchObject({ id: first.id, status: 'open', previous_issue_id: null })
  })

  it('records a flapping rate as episodes without adding events', async () => {
    // Six cycles of up for two checks, then normal for long enough to clear
    const cycle = [4.2, 4.1, 0.3, 0.3, 0.3]
    const rates = Array.from({ length: 6 }, () => cycle).flat()
    let issueId: string | undefined
    for (const [index, value] of rates.entries()) {
      if (index > 0) await fiveMinutesLater()
      const result = await report(errorRateCheck, value > 1 ? [errorRate(value)] : [])
      issueId ??= result.issue?.id
    }
    const issue = await run(getIssue({ projectRef, id: issueId! }))
    expect(issue.status).toBe('open')
    expect((await run(listIssueTimeline({ projectRef, id: issue.id }))).episodes).toHaveLength(6)
    const events = (await run(listIssueTimeline({ projectRef, id: issue.id }))).events
    expect(events.map(({ type }) => type)).toEqual(['created'])
  })

  it('changes nothing when a run errors, and only clears within a scoped run', async () => {
    const created = (await report(check, [finding('a'), finding('b')])).issue!
    const errored = await run(
      reportCheckRun({ projectRef, issue: check, error: 'Database is not reachable' })
    )
    expect(errored.run).toMatchObject({ status: 'error', error: 'Database is not reachable' })
    expect(errored.issue?.affected.map(({ status }) => status)).toEqual(['open', 'open'])

    // Rechecking `a` after a fix; `b` is outside the scope even though it's reported
    const rechecked = await run(
      reportCheckRun({
        projectRef,
        issue: check,
        trigger: 'on_demand',
        actor: { type: 'user', id: 'user-maya', name: 'Maya Chen' },
        scope: { type: 'keys', keys: ['a'] },
        findings: [finding('b')],
      })
    )
    expect(rechecked.run).toMatchObject({
      trigger: 'on_demand',
      actor: { type: 'user', id: 'user-maya' },
      status: 'passed',
      finding_count: 0,
    })
    expect(rechecked.issue?.status).toBe('open')
    expect(rechecked.issue?.affected.map(({ key, status }) => [key, status])).toEqual([
      ['a', 'cleared'],
      ['b', 'open'],
    ])
    const episodes = (await run(listIssueTimeline({ projectRef, id: created.id }))).episodes
    expect(episodes.map(({ ended_at }) => ended_at === null)).toEqual([false, true])
  })

  it('lists runs newest first, keeps the last 20 and flags stale scheduled checks', async () => {
    const checks = await run(listIssueChecks({ projectRef }))
    expect(checks.every((item) => item.last_run !== null && !item.is_stale)).toBe(true)
    expect(checks.find((item) => item.id === 'log_data_api_error_rate_high')).toMatchObject({
      kind: 'threshold',
      interval_seconds: 300,
      fire_after_seconds: 300,
      resolve_after_seconds: 600,
      resolve_issue_after_seconds: 3600,
      last_run: { status: 'failed' },
    })
    const runs = await run(
      listIssueCheckRuns({ projectRef, checkId: 'log_data_api_error_rate_high' })
    )
    expect(runs.map(({ status }) => status)).toEqual([
      ...Array(10).fill('failed'),
      ...Array(10).fill('passed'),
    ])
    expect(runs[0].started_at > runs[1].started_at).toBe(true)

    for (let i = 0; i < 25; i++) await report(check, [])
    expect(
      await run(
        listIssueCheckRuns({
          projectRef,
          checkId: 'auth_otp_long_expiry',
        })
      )
    ).toHaveLength(20)

    await vi.advanceTimersByTimeAsync(11 * 60_000)
    const later = await run(listIssueChecks({ projectRef }))
    expect(later.find((item) => item.id === 'log_data_api_error_rate_high')?.is_stale).toBe(true)
  })

  it('takes the highest severity of unmuted affected resources and records each change', async () => {
    const created = (await report(check, [finding('a')])).issue!
    expect(created.severity).toBe('warning')
    const escalated = (
      await report(check, [finding('a'), { ...finding('b'), severity: 'critical' }])
    ).issue!
    expect(escalated.severity).toBe('critical')
    // A run never lowers it, so a value hovering around a boundary doesn't flap
    const steady = (await report(check, [finding('a'), finding('b')])).issue!
    expect(steady.severity).toBe('critical')

    const critical = escalated.affected.find(({ key }) => key === 'b')!
    const muted = await run(
      updateAffectedResource({
        projectRef,
        id: created.id,
        affectedId: critical.id,
        payload: { muted: { reason: 'accepted_risk', until: null } },
      })
    )
    expect(muted.severity).toBe('warning')
    expect(muted.status).toBe('open')
    expect(muted.affected.find(({ key }) => key === 'b')?.muted).toMatchObject({
      source: 'resource',
      reason: 'accepted_risk',
      until: null,
      muted_by: { type: 'user' },
    })

    const events = (await run(listIssueTimeline({ projectRef, id: created.id }))).events
    expect(
      events
        .filter((event) => event.type === 'severity_changed')
        .map(
          (event) => event.type === 'severity_changed' && [event.from, event.to, event.actor.type]
        )
    ).toEqual([
      ['warning', 'critical', 'system'],
      ['critical', 'warning', 'user'],
    ])
    expect(events.find((event) => event.type === 'resource_muted')).toMatchObject({
      affected_id: critical.id,
      reason: 'accepted_risk',
    })
  })

  it('lifts a resource mute when its deadline passes and rejects past deadlines', async () => {
    const created = (await report(check, [finding('a')])).issue!
    const affectedId = created.affected[0].id
    const past = updateAffectedResource({
      projectRef,
      id: created.id,
      affectedId,
      payload: { muted: { reason: null, until: new Date(Date.now() - 1000).toISOString() } },
    })
    const rejection = expect(past).rejects.toMatchObject({ code: 400 })
    await vi.advanceTimersByTimeAsync(500)
    await rejection

    const until = new Date(Date.now() + 60_000).toISOString()
    await run(
      updateAffectedResource({
        projectRef,
        id: created.id,
        affectedId,
        payload: { muted: { reason: null, until } },
      })
    )
    await vi.advanceTimersByTimeAsync(60_000)
    const issue = await run(getIssue({ projectRef, id: created.id }))
    expect(issue.affected[0].muted).toBeNull()
    const events = (await run(listIssueTimeline({ projectRef, id: created.id }))).events
    expect(events.slice(-2)).toEqual([
      expect.objectContaining({ type: 'resource_muted', until }),
      expect.objectContaining({
        type: 'resource_unmuted',
        actor: expect.objectContaining({ type: 'system' }),
      }),
    ])
  })

  it('reopens a dismissed issue for a newly affected resource and keeps the dismissed ones muted', async () => {
    const created = (await report(check, [finding('a')])).issue!
    const dismissed = await run(
      updateIssue({
        projectRef,
        id: created.id,
        payload: { status: 'dismissed', dismiss_reason: 'accepted_risk' },
      })
    )
    expect(dismissed.affected[0].muted).toMatchObject({ source: 'issue', reason: 'accepted_risk' })

    // Seeing the dismissed affected resource again stays quiet
    const quiet = (await report(check, [finding('a')])).issue
    expect(quiet?.status).toBe('dismissed')
    const quietEvents = (await run(listIssueTimeline({ projectRef, id: created.id }))).events
    expect(quietEvents.at(-1)?.type).toBe('status_changed')

    const reopened = (await report(check, [finding('a'), finding('b')])).issue
    expect(reopened?.status).toBe('open')
    expect(reopened?.affected.map(({ key, muted }) => [key, muted?.source ?? null])).toEqual([
      ['a', 'resource'],
      ['b', null],
    ])
    const events = (await run(listIssueTimeline({ projectRef, id: created.id }))).events
    expect(events.at(-1)).toMatchObject({ type: 'status_changed', from: 'dismissed', to: 'open' })
  })

  it('lifts issue mutes but keeps resource mutes when a person reopens the issue', async () => {
    const created = (await report(check, [finding('a'), finding('b')])).issue!
    await run(
      updateAffectedResource({
        projectRef,
        id: created.id,
        affectedId: created.affected[1].id,
        payload: { muted: { reason: 'false_positive', until: null } },
      })
    )
    await run(updateIssue({ projectRef, id: created.id, payload: { status: 'dismissed' } }))
    const reopened = await run(
      updateIssue({ projectRef, id: created.id, payload: { status: 'open' } })
    )
    expect(reopened.affected.map(({ muted }) => muted?.reason ?? null)).toEqual([
      null,
      'false_positive',
    ])
  })

  it('reopens expired snoozes and retains the reason on dismissal events', async () => {
    const issue = await run(createIssue({ projectRef, payload }))
    const snoozedUntil = new Date(Date.now() + 10_000).toISOString()
    const snoozed = await run(
      updateIssue({
        projectRef,
        id: issue.id,
        payload: { status: 'snoozed', snoozed_until: snoozedUntil },
      })
    )
    expect(snoozed.status).toBe('snoozed')
    await vi.advanceTimersByTimeAsync(10_000)
    expect((await run(getIssue({ projectRef, id: issue.id }))).status).toBe('open')
    await run(
      updateIssue({
        projectRef,
        id: issue.id,
        payload: { status: 'dismissed', dismiss_reason: 'accepted_risk' },
      })
    )
    const events = (await run(listIssueTimeline({ projectRef, id: issue.id }))).events
    expect(events.at(-1)).toMatchObject({
      type: 'status_changed',
      to: 'dismissed',
      dismiss_reason: 'accepted_risk',
    })
  })

  it('records changes to an existing snooze and resolves it when all affected resources clear', async () => {
    const { issue } = await report(check, [finding('a')])
    expect(issue).toBeDefined()
    if (!issue) return
    await run(
      updateIssue({
        projectRef,
        id: issue.id,
        payload: { status: 'snoozed', snoozed_until: new Date(Date.now() + 60_000).toISOString() },
      })
    )
    const newDeadline = new Date(Date.now() + 120_000).toISOString()
    await run(
      updateIssue({
        projectRef,
        id: issue.id,
        payload: { status: 'snoozed', snoozed_until: newDeadline },
      })
    )
    const events = (await run(listIssueTimeline({ projectRef, id: issue.id }))).events
    expect(events.at(-1)).toMatchObject({
      type: 'status_changed',
      to: 'snoozed',
      snoozed_until: newDeadline,
    })
    const snoozed = await run(getIssue({ projectRef, id: issue.id }))
    expect(snoozed.affected[0].muted).toMatchObject({ source: 'issue', until: newDeadline })
    const cleared = (await report(check, [])).issue
    expect(cleared).toMatchObject({ status: 'resolved', snoozed_until: null })
    expect(cleared?.affected[0].muted).toBeNull()
  })

  it('shows the Assistant replying after a mention, then exposes its document', async () => {
    const issue = await run(createIssue({ projectRef, payload }))
    await run(
      createIssueComment({ projectRef, id: issue.id, body: markdownDocument('No mention yet') })
    )
    expect((await run(getIssue({ projectRef, id: issue.id }))).agents_working).toEqual([])
    await run(
      createIssueComment({
        projectRef,
        id: issue.id,
        body: markdownDocument('@Assistant take a look'),
      })
    )
    const working = await run(getIssue({ projectRef, id: issue.id }))
    expect(working.comment_count).toBe(2)
    expect(working.agents_working).toEqual([expect.objectContaining({ type: 'assistant' })])
    const before = (await run(listIssueTimeline({ projectRef, id: issue.id }))).events
    expect(before.filter((event) => event.actor.type === 'assistant')).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(MOCK_ASSISTANT_REPLY_DELAY_MS)
    const settled = await run(getIssue({ projectRef, id: issue.id }))
    expect(settled.agents_working).toEqual([])
    expect(settled.comment_count).toBe(3)
    const events = (await run(listIssueTimeline({ projectRef, id: issue.id }))).events
    const reply = events.at(-1)
    expect(reply).toMatchObject({ type: 'comment', actor: { type: 'assistant' } })
    if (reply?.type === 'comment')
      expect(issueDocumentSchema.safeParse(reply.body).success).toBe(true)
  })

  it('lets a mentioned Assistant diagnose, then fix and resolve the error-rate demo', async () => {
    const { issues } = await run(listIssues({ projectRef, filters: {} }))
    const { id } = issues.find((item) => item.fingerprint === 'check:log_data_api_error_rate_high')!
    const ask = async (text: string) => {
      await run(createIssueComment({ projectRef, id, body: markdownDocument(text) }))
      expect((await run(getIssue({ projectRef, id }))).agents_working).toHaveLength(1)
      await vi.advanceTimersByTimeAsync(MOCK_ASSISTANT_REPLY_DELAY_MS)
      return run(getIssue({ projectRef, id }))
    }

    // Asking what's wrong gets a diagnosis and leaves the issue open
    const diagnosed = await ask('@Assistant what’s causing this?')
    expect(diagnosed.status).toBe('open')

    // Asking for a fix resolves it with the reply, and the failing period ends there
    const fixed = await ask('@Assistant go ahead and fix it')
    expect(fixed).toMatchObject({ status: 'resolved', agents_working: [] })
    expect(fixed.affected[0]).toMatchObject({ status: 'cleared', failing_since: null })

    const { events, episodes } = await run(listIssueTimeline({ projectRef, id }))
    const reply = events.findLast((event) => event.type === 'comment')!
    expect(events.slice(-2)).toEqual([
      expect.objectContaining({
        type: 'comment',
        actor: expect.objectContaining({ type: 'assistant' }),
      }),
      expect.objectContaining({
        type: 'status_changed',
        from: 'open',
        to: 'resolved',
        created_at: reply.created_at,
        actor: expect.objectContaining({ type: 'assistant', on_behalf_of: expect.anything() }),
      }),
    ])
    expect(episodes.at(-1)).toMatchObject({ ended_at: reply.created_at })
  })

  it('keeps a failing issue’s queries live and anchors them once it stops failing', async () => {
    const { issues } = await run(listIssues({ projectRef, filters: {} }))
    const { id } = issues.find((item) => item.fingerprint === 'check:log_data_api_error_rate_high')!
    // Still failing: relative ranges count back from now
    expect((await run(getIssue({ projectRef, id }))).body.as_of).toBeNull()

    await run(createIssueComment({ projectRef, id, body: markdownDocument('@Assistant fix it') }))
    await vi.advanceTimersByTimeAsync(MOCK_ASSISTANT_REPLY_DELAY_MS)
    const resolved = await run(getIssue({ projectRef, id }))
    const { events, episodes } = await run(listIssueTimeline({ projectRef, id }))

    // Stopped failing: the body counts back from when the last failing period ended
    expect(resolved.body.as_of).toBe(episodes.at(-1)?.ended_at)
    // Each comment counts back from when it was posted
    events
      .filter((event) => event.type === 'comment')
      .forEach((event) => {
        expect(event.type === 'comment' && event.body.as_of).toBe(event.created_at)
      })
  })

  it('keeps an issue live when the check never recorded a failing period', async () => {
    const issue = await run(createIssue({ projectRef, payload }))
    expect(issue.body.as_of).toBeNull()
  })

  it('ends open episodes when a person resolves a check issue', async () => {
    const created = (await report(check, [finding('a')])).issue!
    const resolved = await run(
      updateIssue({ projectRef, id: created.id, payload: { status: 'resolved' } })
    )
    expect(resolved.affected[0]).toMatchObject({ status: 'cleared', failing_since: null })
    const { episodes } = await run(listIssueTimeline({ projectRef, id: created.id }))
    expect(episodes).toEqual([expect.objectContaining({ ended_at: resolved.resolved_at })])

    // Still failing on the next run is a regression with a new episode
    const regressed = (await report(check, [finding('a')])).issue
    expect(regressed?.status).toBe('open')
    expect((await run(listIssueTimeline({ projectRef, id: created.id }))).episodes).toHaveLength(2)
  })

  it('returns a 404 for an unknown issue', async () => {
    const assertion = expect(getIssue({ projectRef, id: 'unknown' })).rejects.toMatchObject({
      code: 404,
    })
    await vi.advanceTimersByTimeAsync(500)
    await assertion
  })
})
