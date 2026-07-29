import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getConnectionMetrics } from './DatabaseConnections.utils'
import { type DatabaseActivity } from '@/data/database/activity-query'

const NOW = '2024-01-15T12:00:00Z'

const secondsAgo = (seconds: number) =>
  new Date(new Date(NOW).getTime() - seconds * 1000).toISOString()

// `DatabaseActivity` intersects a discriminated `WaitEvent` union, so `Partial<DatabaseActivity>`
// doesn't distribute cleanly over it - scope overrides to the plain fields tests actually vary.
type ActivityOverrides = Partial<
  Pick<
    DatabaseActivity,
    | 'pid'
    | 'role_name'
    | 'application_name'
    | 'blocked_by'
    | 'query'
    | 'query_start'
    | 'transaction_start'
    | 'state_change'
    | 'state'
  >
>

const activity = (overrides: ActivityOverrides = {}): DatabaseActivity => ({
  pid: 1,
  role_name: 'postgres',
  application_name: 'test',
  blocked_by: [],
  query: 'select 1',
  query_start: null,
  transaction_start: null,
  state_change: null,
  state: 'active',
  wait_event_type: null,
  wait_event: null,
  ...overrides,
})

describe('getConnectionMetrics', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(NOW))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns empty/null metrics for no activity', () => {
    const metrics = getConnectionMetrics([])

    expect(metrics.activeQueries).toEqual([])
    expect(metrics.blockedQueries).toEqual([])
    expect(metrics.warnBlockedQueries).toBe(false)
    expect(metrics.longestBlockedQuery).toBe(null)
    expect(metrics.idleInTransactionQueries).toEqual([])
    expect(metrics.longestRunningQuery).toBe(null)
    expect(metrics.warnLongestRunningQuery).toBe(false)
    expect(metrics.queryBlockingTheMostQueries).toBe(null)
    expect(metrics.warnTopBlocker).toBe(false)
  })

  it('counts active queries', () => {
    const activities = [
      activity({ pid: 1, state: 'active' }),
      activity({ pid: 2, state: 'idle' }),
      activity({ pid: 3, state: 'active' }),
    ]

    expect(getConnectionMetrics(activities).activeQueries).toHaveLength(2)
  })

  describe('blocked queries', () => {
    it('collects queries that are blocked by another pid', () => {
      const activities = [
        activity({ pid: 1, blocked_by: [2] }),
        activity({ pid: 2, blocked_by: [] }),
      ]

      const { blockedQueries } = getConnectionMetrics(activities)
      expect(blockedQueries.map((a) => a.pid)).toEqual([1])
    })

    it('does not warn when blocked under the threshold (10s)', () => {
      const activities = [
        activity({ pid: 1, state: 'active', blocked_by: [2], query_start: secondsAgo(5) }),
      ]

      expect(getConnectionMetrics(activities).warnBlockedQueries).toBe(false)
    })

    it('warns once a blocked query crosses the threshold (10s)', () => {
      const activities = [
        activity({ pid: 1, state: 'active', blocked_by: [2], query_start: secondsAgo(11) }),
      ]

      expect(getConnectionMetrics(activities).warnBlockedQueries).toBe(true)
    })

    it('picks the longest-blocked query', () => {
      const activities = [
        activity({ pid: 1, state: 'active', blocked_by: [3], query_start: secondsAgo(5) }),
        activity({ pid: 2, state: 'active', blocked_by: [3], query_start: secondsAgo(20) }),
      ]

      const { longestBlockedQuery } = getConnectionMetrics(activities)
      expect(longestBlockedQuery?.activity.pid).toBe(2)
      expect(longestBlockedQuery?.duration).toBe(20)
    })
  })

  describe('idle in transaction', () => {
    it('does not flag idle-in-transaction queries under the threshold (10s)', () => {
      const activities = [
        activity({ pid: 1, state: 'idle in transaction', transaction_start: secondsAgo(5) }),
      ]

      expect(getConnectionMetrics(activities).idleInTransactionQueries).toEqual([])
    })

    it('flags idle-in-transaction (and aborted) queries over the threshold (10s)', () => {
      const activities = [
        activity({ pid: 1, state: 'idle in transaction', transaction_start: secondsAgo(11) }),
        activity({
          pid: 2,
          state: 'idle in transaction (aborted)',
          transaction_start: secondsAgo(11),
        }),
        activity({ pid: 3, state: 'active', query_start: secondsAgo(11) }),
      ]

      const { idleInTransactionQueries } = getConnectionMetrics(activities)
      expect(idleInTransactionQueries.map((a) => a.pid)).toEqual([1, 2])
    })
  })

  describe('longest running query', () => {
    it('ignores states outside active/idle-in-transaction', () => {
      const activities = [activity({ pid: 1, state: 'idle', state_change: secondsAgo(1000) })]

      expect(getConnectionMetrics(activities).longestRunningQuery).toBe(null)
    })

    it('picks the longest-running query among active/idle-in-transaction states', () => {
      const activities = [
        activity({ pid: 1, state: 'active', query_start: secondsAgo(5) }),
        activity({
          pid: 2,
          state: 'idle in transaction',
          transaction_start: secondsAgo(15),
        }),
      ]

      const { longestRunningQuery } = getConnectionMetrics(activities)
      expect(longestRunningQuery?.activity.pid).toBe(2)
      expect(longestRunningQuery?.duration).toBe(15)
    })

    it('warns for an active query past the active threshold (30s)', () => {
      const activities = [activity({ pid: 1, state: 'active', query_start: secondsAgo(31) })]

      expect(getConnectionMetrics(activities).warnLongestRunningQuery).toBe(true)
    })

    it('does not warn for an active query under the active threshold (30s)', () => {
      const activities = [activity({ pid: 1, state: 'active', query_start: secondsAgo(29) })]

      expect(getConnectionMetrics(activities).warnLongestRunningQuery).toBe(false)
    })

    it('warns for an idle-in-transaction query past the shorter idle threshold (10s)', () => {
      const activities = [
        activity({ pid: 1, state: 'idle in transaction', transaction_start: secondsAgo(11) }),
      ]

      expect(getConnectionMetrics(activities).warnLongestRunningQuery).toBe(true)
    })
  })

  describe('top blocker', () => {
    it('picks the pid blocking the most other queries', () => {
      const activities = [
        activity({ pid: 1, blocked_by: [] }),
        activity({ pid: 2, blocked_by: [1] }),
        activity({ pid: 3, blocked_by: [1] }),
        activity({ pid: 4, blocked_by: [1] }),
        activity({ pid: 5, blocked_by: [2] }),
      ]

      const { queryBlockingTheMostQueries } = getConnectionMetrics(activities)
      expect(queryBlockingTheMostQueries?.activity.pid).toBe(1)
      expect(queryBlockingTheMostQueries?.count).toBe(3)
    })

    it('does not warn when the top blocker is under the threshold (3)', () => {
      const activities = [
        activity({ pid: 1, blocked_by: [] }),
        activity({ pid: 2, blocked_by: [1] }),
      ]

      expect(getConnectionMetrics(activities).warnTopBlocker).toBe(false)
    })

    it('warns once the top blocker meets the threshold (3)', () => {
      const activities = [
        activity({ pid: 1, blocked_by: [] }),
        activity({ pid: 2, blocked_by: [1] }),
        activity({ pid: 3, blocked_by: [1] }),
        activity({ pid: 4, blocked_by: [1] }),
      ]

      expect(getConnectionMetrics(activities).warnTopBlocker).toBe(true)
    })
  })
})
