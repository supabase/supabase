import { describe, expect, it } from 'vitest'

import type { IssueAffectedResource, IssueResourceMute } from '../issue-schema'
import { ISSUE_CHECK_DEFINITIONS } from './issues-mock-checks'
import {
  advancePassingResource,
  advancePendingFinding,
  applyIssueMutes,
  getHighestSeverity,
  hasBeenQuietFor,
  isActiveResource,
  isCheckStale,
  isPastReopenWindow,
  maxValue,
  pinIssueMutes,
} from './issues-mock-evaluation'

const T0 = '2026-10-21T12:00:00.000Z'
const minutesAfter = (minutes: number) =>
  new Date(new Date(T0).getTime() + minutes * 60_000).toISOString()
const advisor = { type: 'system', id: 'supabase-advisor', name: 'Supabase Advisor' } as const
const viewer = { type: 'user', id: 'viewer', name: 'You' } as const

const makeAffected = (
  key: string,
  overrides: Partial<IssueAffectedResource> = {}
): IssueAffectedResource => ({
  id: `ins_${key}`,
  key,
  resource: null,
  detail: null,
  severity: 'warning',
  value: null,
  threshold: null,
  unit: null,
  status: 'open',
  first_seen_at: T0,
  last_seen_at: T0,
  last_evaluated_at: T0,
  failing_since: T0,
  passing_since: null,
  muted: null,
  ...overrides,
})

const mute = (overrides: Partial<IssueResourceMute> = {}): IssueResourceMute => ({
  source: 'resource',
  reason: 'accepted_risk',
  until: null,
  muted_by: viewer,
  muted_at: T0,
  ...overrides,
})

describe('maxValue', () => {
  it.each([
    [null, null, null],
    [null, 2, 2],
    [3, null, 3],
    [3, 5, 5],
    [5, 3, 5],
  ])('max(%s, %s) is %s', (current, next, expected) => {
    expect(maxValue(current, next)).toBe(expected)
  })
})

describe('advancePendingFinding', () => {
  it('opens on the first failing run when there is nothing to wait out', () => {
    expect(
      advancePendingFinding({ pending: undefined, value: 4, now: T0, fireAfterSeconds: 0 })
    ).toEqual({
      pending: { failing_since: T0, run_count: 1, peak_value: 4 },
      shouldOpen: true,
    })
  })

  it('waits on the first failing run, then opens once fire_after has passed', () => {
    const first = advancePendingFinding({
      pending: undefined,
      value: 4.2,
      now: T0,
      fireAfterSeconds: 300,
    })
    expect(first.shouldOpen).toBe(false)
    const second = advancePendingFinding({
      pending: first.pending,
      value: 4.1,
      now: minutesAfter(5),
      fireAfterSeconds: 300,
    })
    expect(second).toEqual({
      pending: { failing_since: T0, run_count: 2, peak_value: 4.2 },
      shouldOpen: true,
    })
  })

  it('keeps waiting when runs come faster than fire_after, e.g. an on-demand rerun', () => {
    const first = advancePendingFinding({
      pending: undefined,
      value: null,
      now: T0,
      fireAfterSeconds: 300,
    })
    const rerun = advancePendingFinding({
      pending: first.pending,
      value: null,
      now: minutesAfter(1),
      fireAfterSeconds: 300,
    })
    expect(rerun).toEqual({
      pending: { failing_since: T0, run_count: 2, peak_value: null },
      shouldOpen: false,
    })
  })
})

describe('advancePassingResource', () => {
  it('clears on the first passing run when there is nothing to wait out', () => {
    expect(advancePassingResource({ passingSince: null, now: T0, resolveAfterSeconds: 0 })).toEqual(
      { passingSince: T0, shouldClear: true }
    )
  })

  it('starts the passing stretch on the first passing run without clearing', () => {
    expect(
      advancePassingResource({ passingSince: null, now: T0, resolveAfterSeconds: 600 })
    ).toEqual({ passingSince: T0, shouldClear: false })
  })

  it('keeps the stretch start and clears once resolve_after has passed', () => {
    expect(
      advancePassingResource({ passingSince: T0, now: minutesAfter(5), resolveAfterSeconds: 600 })
    ).toEqual({ passingSince: T0, shouldClear: false })
    expect(
      advancePassingResource({ passingSince: T0, now: minutesAfter(10), resolveAfterSeconds: 600 })
    ).toEqual({ passingSince: T0, shouldClear: true })
  })
})

describe('isActiveResource', () => {
  it.each([
    ['open and unmuted', makeAffected('a'), true],
    ['open and muted', makeAffected('a', { muted: mute() }), false],
    ['cleared', makeAffected('a', { status: 'cleared' }), false],
    ['cleared and muted', makeAffected('a', { status: 'cleared', muted: mute() }), false],
  ])('%s', (_, item, expected) => {
    expect(isActiveResource(item)).toBe(expected)
  })
})

describe('getHighestSeverity', () => {
  it.each([
    [[], undefined],
    [['info'], 'info'],
    [['info', 'warning'], 'warning'],
    [['warning', 'critical', 'info'], 'critical'],
  ] as const)('%j is %s', (severities, expected) => {
    expect(getHighestSeverity([...severities])).toBe(expected)
  })
})

describe('applyIssueMutes', () => {
  const quiet = {
    status: 'dismissed',
    dismiss_reason: 'accepted_risk',
    snoozed_until: null,
  } as const

  it('mutes open, unmuted affected resources when the issue is dismissed', () => {
    const [open, cleared] = applyIssueMutes({
      affected: [makeAffected('a'), makeAffected('b', { status: 'cleared' })],
      issue: quiet,
      actor: viewer,
      now: T0,
    })
    expect(open.muted).toEqual({
      source: 'issue',
      reason: 'accepted_risk',
      until: null,
      muted_by: viewer,
      muted_at: T0,
    })
    expect(cleared.muted).toBeNull()
  })

  it('carries the snooze deadline onto the mutes', () => {
    const until = minutesAfter(60)
    const [muted] = applyIssueMutes({
      affected: [makeAffected('a')],
      issue: { status: 'snoozed', dismiss_reason: null, snoozed_until: until },
      actor: viewer,
      now: T0,
    })
    expect(muted.muted).toMatchObject({ source: 'issue', reason: null, until })
  })

  it('leaves mutes set on an affected resource directly in place', () => {
    const own = mute({ reason: 'false_positive' })
    const [muted] = applyIssueMutes({
      affected: [makeAffected('a', { muted: own })],
      issue: quiet,
      actor: viewer,
      now: T0,
    })
    expect(muted.muted).toEqual(own)
  })

  it('lifts issue mutes but not resource mutes when the issue reopens or resolves', () => {
    for (const status of ['open', 'resolved'] as const) {
      const [fromIssue, own] = applyIssueMutes({
        affected: [
          makeAffected('a', { muted: mute({ source: 'issue' }) }),
          makeAffected('b', { muted: mute() }),
        ],
        issue: { status, dismiss_reason: null, snoozed_until: null },
        actor: advisor,
        now: T0,
      })
      expect(fromIssue.muted).toBeNull()
      expect(own.muted).toEqual(mute())
    }
  })

  it('replaces issue mutes when the snooze deadline changes', () => {
    const until = minutesAfter(120)
    const [muted] = applyIssueMutes({
      affected: [makeAffected('a', { muted: mute({ source: 'issue', until: minutesAfter(60) }) })],
      issue: { status: 'snoozed', dismiss_reason: null, snoozed_until: until },
      actor: viewer,
      now: minutesAfter(1),
    })
    expect(muted.muted).toMatchObject({ source: 'issue', until, muted_at: minutesAfter(1) })
  })
})

describe('pinIssueMutes', () => {
  it('turns issue mutes into resource mutes and leaves everything else alone', () => {
    const own = mute({ reason: 'not_relevant' })
    const [fromIssue, ownMute, unmuted] = pinIssueMutes([
      makeAffected('a', { muted: mute({ source: 'issue' }) }),
      makeAffected('b', { muted: own }),
      makeAffected('c'),
    ])
    expect(fromIssue.muted).toEqual(mute({ source: 'resource' }))
    expect(ownMute.muted).toBe(own)
    expect(unmuted.muted).toBeNull()
  })
})

describe('isCheckStale', () => {
  it.each([
    ['an on-demand check', null, T0, minutesAfter(600), false],
    ['a check that has never completed a run', 300, null, minutesAfter(600), false],
    ['a run exactly two intervals ago', 300, T0, minutesAfter(10), false],
    ['a run more than two intervals ago', 300, T0, minutesAfter(11), true],
  ])('%s', (_, intervalSeconds, lastCompletedAt, now, expected) => {
    expect(isCheckStale({ intervalSeconds, lastCompletedAt, now })).toBe(expected)
  })
})

describe('hasBeenQuietFor', () => {
  it.each([
    ['an issue that never had an episode', null, T0, 3600, true],
    ['nothing to wait out', T0, T0, 0, true],
    ['less than the quiet period', T0, minutesAfter(59), 3600, false],
    ['exactly the quiet period', T0, minutesAfter(60), 3600, true],
  ])('%s', (_, lastFailingAt, now, seconds, expected) => {
    expect(hasBeenQuietFor({ lastFailingAt, now, seconds })).toBe(expected)
  })
})

describe('isPastReopenWindow', () => {
  const resolvedAt = '2026-10-01T12:00:00Z'
  const resolved = { status: 'resolved' as const, resolved_at: resolvedAt }
  const DAY = 24 * 60 * 60

  it('files a new issue only once a resolved issue is older than the window', () => {
    expect(
      isPastReopenWindow({ issue: resolved, now: '2026-10-02T11:00:00Z', reopenWindowSeconds: DAY })
    ).toBe(false)
    expect(
      isPastReopenWindow({ issue: resolved, now: '2026-10-02T12:00:00Z', reopenWindowSeconds: DAY })
    ).toBe(false)
    expect(
      isPastReopenWindow({ issue: resolved, now: '2026-10-15T12:00:00Z', reopenWindowSeconds: DAY })
    ).toBe(true)
  })

  it('always reopens without a window, and reopens issues that were never resolved', () => {
    const now = '2026-12-01T12:00:00Z'
    expect(isPastReopenWindow({ issue: resolved, now, reopenWindowSeconds: null })).toBe(false)
    for (const status of ['open', 'dismissed', 'snoozed'] as const) {
      expect(
        isPastReopenWindow({ issue: { status, resolved_at: null }, now, reopenWindowSeconds: DAY })
      ).toBe(false)
    }
  })

  it('gives incident checks a window and lints none', () => {
    for (const check of ISSUE_CHECK_DEFINITIONS) {
      if (check.kind === 'state') expect(check.reopen_window_seconds).toBeNull()
      else expect(check.reopen_window_seconds).toBe(DAY)
    }
  })
})
