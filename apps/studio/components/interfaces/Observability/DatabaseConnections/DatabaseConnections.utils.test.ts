import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  filterActivities,
  getBlockChain,
  getBlockingChain,
  getConnectionMetrics,
  type ActivityFilters,
} from './DatabaseConnections.utils'
import { type DatabaseActivity } from '@/data/database/activity-query'

const EMPTY_FILTERS: ActivityFilters = {
  search: '',
  states: [],
  applications: [],
  roles: [],
  view: '',
}

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
  backend_start: NOW,
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
      expect(queryBlockingTheMostQueries?.count).toBe(4)
    })

    it('counts transitively - a longer block chain outweighs several short ones', () => {
      const activities = [
        activity({ pid: 1, blocked_by: [2] }),
        activity({ pid: 2, blocked_by: [3] }),
        activity({ pid: 3, blocked_by: [] }),
        activity({ pid: 4, blocked_by: [5] }),
        activity({ pid: 5, blocked_by: [] }),
      ]

      const { queryBlockingTheMostQueries } = getConnectionMetrics(activities)
      expect(queryBlockingTheMostQueries?.activity.pid).toBe(3)
      expect(queryBlockingTheMostQueries?.count).toBe(2)
    })

    it('counts a diamond-shaped block pattern once, not per incoming path', () => {
      // root blocks both p1 and p2 directly, and both p1 and p2 block w - w must only count once
      const activities = [
        activity({ pid: 0, blocked_by: [] }),
        activity({ pid: 1, blocked_by: [0] }),
        activity({ pid: 2, blocked_by: [0] }),
        activity({ pid: 3, blocked_by: [1, 2] }),
      ]

      const { queryBlockingTheMostQueries } = getConnectionMetrics(activities)
      expect(queryBlockingTheMostQueries?.activity.pid).toBe(0)
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

describe('getBlockChain', () => {
  it('returns just the pid when it is not blocked', () => {
    const activities = [activity({ pid: 1, blocked_by: [] })]

    expect(getBlockChain(1, activities)).toEqual([1])
  })

  it('walks blocked_by up to the root, nearest first', () => {
    const activities = [
      activity({ pid: 1, blocked_by: [2] }),
      activity({ pid: 2, blocked_by: [3] }),
      activity({ pid: 3, blocked_by: [] }),
    ]

    expect(getBlockChain(1, activities)).toEqual([1, 2, 3])
  })

  it('only follows the first blocker when blocked by multiple pids', () => {
    const activities = [
      activity({ pid: 1, blocked_by: [2, 3] }),
      activity({ pid: 2, blocked_by: [] }),
      activity({ pid: 3, blocked_by: [] }),
    ]

    expect(getBlockChain(1, activities)).toEqual([1, 2])
  })

  it('stops rather than looping on a cycle', () => {
    const activities = [
      activity({ pid: 1, blocked_by: [2] }),
      activity({ pid: 2, blocked_by: [1] }),
    ]

    expect(getBlockChain(1, activities)).toEqual([1, 2])
  })

  it('includes a blocker pid even if its own activity record is missing', () => {
    const activities = [activity({ pid: 1, blocked_by: [99] })]

    expect(getBlockChain(1, activities)).toEqual([1, 99])
  })
})

describe('getBlockingChain', () => {
  it('returns an empty chain when nothing is blocked by the root', () => {
    const activities = [activity({ pid: 1, blocked_by: [] })]

    expect(getBlockingChain(1, activities)).toEqual([])
  })

  it('walks forward from the root, nearest waiter first', () => {
    const activities = [
      activity({ pid: 1, blocked_by: [2] }),
      activity({ pid: 2, blocked_by: [3] }),
      activity({ pid: 3, blocked_by: [] }),
    ]

    expect(getBlockingChain(3, activities)).toEqual([2, 1])
  })

  it('does not require the root pid to have its own activity record', () => {
    const activities = [activity({ pid: 2, blocked_by: [1] })]

    expect(getBlockingChain(1, activities)).toEqual([2])
  })

  it('stops rather than looping on a cycle', () => {
    const activities = [
      activity({ pid: 2, blocked_by: [1] }),
      activity({ pid: 3, blocked_by: [2] }),
      activity({ pid: 1, blocked_by: [3] }), // would cycle back to the root
    ]

    expect(getBlockingChain(1, activities)).toEqual([2, 3])
  })

  it('only follows one branch when the root has multiple direct waiters', () => {
    const activities = [
      activity({ pid: 2, blocked_by: [1] }),
      activity({ pid: 3, blocked_by: [1] }),
    ]

    expect(getBlockingChain(1, activities)).toEqual([2])
  })
})

describe('filterActivities', () => {
  it('returns everything when no filters are applied', () => {
    const activities = [activity({ pid: 1 }), activity({ pid: 2 })]

    expect(filterActivities(activities, EMPTY_FILTERS)).toHaveLength(2)
  })

  it('filters by role', () => {
    const activities = [
      activity({ pid: 1, role_name: 'anon' }),
      activity({ pid: 2, role_name: 'postgres' }),
    ]

    const result = filterActivities(activities, { ...EMPTY_FILTERS, roles: ['anon'] })

    expect(result.map((x) => x.pid)).toEqual([1])
  })

  it('filters by state', () => {
    const activities = [activity({ pid: 1, state: 'active' }), activity({ pid: 2, state: 'idle' })]

    const result = filterActivities(activities, { ...EMPTY_FILTERS, states: ['idle'] })

    expect(result.map((x) => x.pid)).toEqual([2])
  })

  it('filters by application', () => {
    const activities = [
      activity({ pid: 1, application_name: 'studio' }),
      activity({ pid: 2, application_name: 'psql' }),
    ]

    const result = filterActivities(activities, { ...EMPTY_FILTERS, applications: ['psql'] })

    expect(result.map((x) => x.pid)).toEqual([2])
  })

  it('filters by search matching the query text, case-insensitively', () => {
    const activities = [
      activity({ pid: 1, query: 'select * from users' }),
      activity({ pid: 2, query: 'select * from orders' }),
    ]

    const result = filterActivities(activities, { ...EMPTY_FILTERS, search: 'USERS' })

    expect(result.map((x) => x.pid)).toEqual([1])
  })

  it('excludes activities with a null query from a search filter', () => {
    const activities = [activity({ pid: 1, query: null })]

    expect(filterActivities(activities, { ...EMPTY_FILTERS, search: 'anything' })).toEqual([])
  })

  it('in blockers view, only keeps root blockers - excludes leaf/idle activities', () => {
    const activities = [
      activity({ pid: 1, blocked_by: [] }), // blocks pid 2, not itself blocked - root blocker
      activity({ pid: 2, blocked_by: [1] }), // itself blocked - not a root blocker
      activity({ pid: 3, blocked_by: [] }), // not blocked, and blocks nobody
    ]

    const result = filterActivities(activities, { ...EMPTY_FILTERS, view: 'blockers' })

    expect(result.map((x) => x.pid)).toEqual([1])
  })

  it('combines multiple filters with AND semantics', () => {
    const activities = [
      activity({ pid: 1, role_name: 'anon', state: 'active' }),
      activity({ pid: 2, role_name: 'anon', state: 'idle' }),
      activity({ pid: 3, role_name: 'postgres', state: 'active' }),
    ]

    const result = filterActivities(activities, {
      ...EMPTY_FILTERS,
      roles: ['anon'],
      states: ['active'],
    })

    expect(result.map((x) => x.pid)).toEqual([1])
  })
})
