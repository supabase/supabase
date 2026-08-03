import dayjs from 'dayjs'

import {
  WARN_DURATION_ACTIVE_QUERY,
  WARN_DURATION_BLOCKED,
  WARN_DURATION_IDLE_TXN,
  WARN_TOP_BLOCKER,
} from './DatabaseConnections.constants'
import { type DatabaseActivity } from '@/data/database/activity-query'

const LONG_RUNNING_STATES: (DatabaseActivity['state'] | undefined)[] = [
  'active',
  'idle in transaction',
  'idle in transaction (aborted)',
]

type ActivityWithDuration = { activity: DatabaseActivity; duration: number }

export type ConnectionMetrics = {
  activeQueries: DatabaseActivity[]
  blockedQueries: DatabaseActivity[]
  warnBlockedQueries: boolean
  longestBlockedQuery: ActivityWithDuration | null
  idleInTransactionQueries: DatabaseActivity[]
  longestRunningQuery: ActivityWithDuration | null
  warnLongestRunningQuery: boolean
  queryBlockingTheMostQueries: { activity: DatabaseActivity; count: number } | null
  warnTopBlocker: boolean
}

export const getDuration = (activity: DatabaseActivity) => {
  const { state } = activity
  if (state === 'active' && activity.query_start) {
    return dayjs().utc().diff(dayjs(activity.query_start).utc(), 'second')
  }
  if (state === 'idle' && activity.state_change) {
    return dayjs().utc().diff(dayjs(activity.state_change).utc(), 'second')
  }
  if (
    (state === 'idle in transaction' || state === 'idle in transaction (aborted)') &&
    activity.transaction_start
  ) {
    return dayjs().utc().diff(dayjs(activity.transaction_start).utc(), 'second')
  }
  return null
}

export const getBadgeVariant = (activity: DatabaseActivity) => {
  const { state } = activity
  if (state === 'active') return 'success'
  if (state === 'idle in transaction' || state === 'idle in transaction (aborted)') return 'warning'
  return 'default'
}

// Resolves the timestamp that duration should be measured from for a given state -
// query_start while actively running, transaction_start while idle in transaction.
export const getActivityStart = (activity: DatabaseActivity) => {
  if (activity.state === 'active') return activity.query_start
  if (
    activity.state === 'idle in transaction' ||
    activity.state === 'idle in transaction (aborted)'
  ) {
    return activity.transaction_start
  }
  return null
}

// Finds the activity with the largest duration-since-start among the given activities (e.g. the
// longest-blocked query, or the longest-running query).
const findLongestRunning = (
  activities: DatabaseActivity[],
  now: dayjs.Dayjs
): ActivityWithDuration | null =>
  activities.reduce<ActivityWithDuration | null>((longest, activity) => {
    const start = getActivityStart(activity)
    if (!start) return longest
    const duration = Math.max(now.diff(dayjs(start).utc(), 'second'), 0)
    return longest === null || duration > longest.duration ? { activity, duration } : longest
  }, null)

// Counts every activity transitively blocked by pid - not just direct waiters, but their waiters
// in turn - so a long chain outweighs several short ones. Traverses breadth-first over a single
// counted set so a waiter reachable through more than one blocker (a "diamond") is still only
// counted once.
const countTransitivelyBlocked = (pid: number, activities: DatabaseActivity[]): number => {
  const counted = new Set<number>()
  const queue = [pid]

  while (queue.length > 0) {
    const currentPid = queue.shift()!
    const directWaiters = activities.filter((x) => x.blocked_by.includes(currentPid))

    for (const waiter of directWaiters) {
      if (counted.has(waiter.pid)) continue
      counted.add(waiter.pid)
      queue.push(waiter.pid)
    }
  }

  return counted.size
}

// Derives the Overview page's connection/activity metrics (and their warning thresholds) from the
// raw pg_stat_activity rows, so the logic can be unit tested independently of the component.
export const getConnectionMetrics = (activities: DatabaseActivity[]): ConnectionMetrics => {
  // Computed once so every metric below is measured against the same instant, rather than each
  // drifting slightly against the others.
  const now = dayjs().utc()

  const activeQueries = activities.filter((x) => x.state === 'active')

  const blockedQueries = activities.filter((x) => x.blocked_by.length > 0)
  const warnBlockedQueries = blockedQueries.some((activity) => {
    const start = getActivityStart(activity)
    if (!start) return false
    return now.diff(dayjs(start).utc(), 'second') >= WARN_DURATION_BLOCKED
  })
  const longestBlockedQuery = findLongestRunning(blockedQueries, now)

  const idleInTransactionQueries = activities.filter((x) => {
    const isIdleInTransaction =
      x.state === 'idle in transaction' || x.state === 'idle in transaction (aborted)'
    if (!isIdleInTransaction || !x.transaction_start) return false
    return now.diff(dayjs(x.transaction_start).utc(), 'second') >= WARN_DURATION_IDLE_TXN
  })

  const longestRunningQuery = findLongestRunning(
    activities.filter((x) => LONG_RUNNING_STATES.includes(x.state)),
    now
  )
  const warnLongestRunningQuery =
    (longestRunningQuery?.activity.state === 'active' &&
      longestRunningQuery.duration >= WARN_DURATION_ACTIVE_QUERY) ||
    ((longestRunningQuery?.activity.state === 'idle in transaction' ||
      longestRunningQuery?.activity.state === 'idle in transaction (aborted)') &&
      longestRunningQuery.duration >= WARN_DURATION_IDLE_TXN)

  const queryBlockingTheMostQueries = activities.reduce<{
    activity: DatabaseActivity
    count: number
  } | null>((mostBlocking, activity) => {
    const count = countTransitivelyBlocked(activity.pid, activities)
    if (count === 0) return mostBlocking
    if (mostBlocking && count <= mostBlocking.count) return mostBlocking
    return { activity, count }
  }, null)

  const warnTopBlocker = (queryBlockingTheMostQueries?.count ?? 0) >= WARN_TOP_BLOCKER

  return {
    activeQueries,
    blockedQueries,
    warnBlockedQueries,
    longestBlockedQuery,
    idleInTransactionQueries,
    longestRunningQuery,
    warnLongestRunningQuery,
    queryBlockingTheMostQueries,
    warnTopBlocker,
  }
}

export const getBlockChain = (pid: number, activities: DatabaseActivity[]) => {
  const chain = [pid]
  const visited = new Set([pid])
  let current = activities.find((x) => x.pid === pid)

  while (current && current.blocked_by.length > 0) {
    const nextPid = current.blocked_by[0]
    if (visited.has(nextPid)) break
    chain.push(nextPid)
    visited.add(nextPid)
    current = activities.find((x) => x.pid === nextPid)
  }

  return chain
}

// Walks the opposite direction of getBlockChain: starting from a root blocker
// (blocked_by.length === 0), finds the chain of pids waiting on it, nearest first
export const getBlockingChain = (rootPid: number, activities: DatabaseActivity[]) => {
  const chain: number[] = []
  const visited = new Set([rootPid])
  let currentPid = rootPid

  while (true) {
    const next = activities.find((x) => !visited.has(x.pid) && x.blocked_by.includes(currentPid))
    if (!next) break
    chain.push(next.pid)
    visited.add(next.pid)
    currentPid = next.pid
  }

  return chain
}
