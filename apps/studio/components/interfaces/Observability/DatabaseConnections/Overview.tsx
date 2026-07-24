import dayjs from 'dayjs'
import { parseAsInteger, useQueryState } from 'nuqs'
import { cn } from 'ui'
import {
  MetricCard,
  MetricCardContent,
  MetricCardHeader,
  MetricCardLabel,
  MetricCardValue,
} from 'ui-patterns/MetricCard'

import { WARN_DURATION_ACTIVE_QUERY, WARN_DURATION_IDLE_TXN } from './DatabaseConnections.constants'
import { formatDuration } from '@/components/interfaces/QueryPerformance/QueryPerformance.utils'
import { useDatabaseRolesQuery } from '@/data/database-roles/database-roles-query'
import { useDatabaseActivityQuery, type DatabaseActivity } from '@/data/database/activity-query'
import { useMaxConnectionsQuery } from '@/data/database/max-connections-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const LONG_RUNNING_STATES: (DatabaseActivity['state'] | undefined)[] = [
  'active',
  'idle in transaction',
  'idle in transaction (aborted)',
]

interface OverviewProps {
  live?: boolean
}

/**
 * [Joshen] Couple of nuances worth calling out to provide better signals for the user
 * - Idle in transaction:
 *   - Only considers queries in that state, but running for longer than 10 seconds
 *   - Could otherwise be a query in mid-flight
 * - Longest running:
 *  - Only considers queries that are active or idle in transaction
 */
export const Overview = ({ live }: OverviewProps) => {
  const { data: project } = useSelectedProjectQuery()
  const [, setSelectedPid] = useQueryState('pid', parseAsInteger)

  const { data, isPending: isLoadingActivity } = useDatabaseActivityQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { refetchOnWindowFocus: live, refetchInterval: live ? 3000 : false }
  )
  const activeQueries = (data ?? []).filter((x) => x.state === 'active')
  const blockedQueries = (data ?? []).filter((x) => x.blocked_by.length > 0)
  const idleInTransactionQueries = (data ?? []).filter((x) => {
    const isIdleInTransaction =
      x.state === 'idle in transaction' || x.state === 'idle in transaction (aborted)'
    if (!isIdleInTransaction || !x.transaction_start) return false
    return dayjs().utc().diff(dayjs(x.transaction_start).utc(), 'second') > WARN_DURATION_IDLE_TXN
  })

  const longestRunningQuery = (data ?? [])
    .filter((x) => LONG_RUNNING_STATES.includes(x.state))
    .reduce<{ activity: DatabaseActivity; duration: number } | null>((longest, activity) => {
      const start = activity.state === 'active' ? activity.query_start : activity.transaction_start
      if (!start) return longest
      const duration = Math.max(dayjs().utc().diff(dayjs(start).utc(), 'second'), 0)
      return longest === null || duration > longest.duration ? { activity, duration } : longest
    }, null)
  const warnLongestRunningQuery =
    (longestRunningQuery?.activity.state === 'active' &&
      longestRunningQuery.duration >= WARN_DURATION_ACTIVE_QUERY) ||
    ((longestRunningQuery?.activity.state === 'idle in transaction' ||
      longestRunningQuery?.activity.state === 'idle in transaction (aborted)') &&
      longestRunningQuery.duration >= WARN_DURATION_IDLE_TXN)

  const { data: roles, isPending: isLoadingRoles } = useDatabaseRolesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { refetchOnWindowFocus: live, refetchInterval: live ? 3000 : false }
  )
  const rolesWithActiveConnections = (roles ?? []).filter((role) => role.activeConnections)
  const totalActiveConnections = (roles ?? [])
    .map((role) => role.activeConnections)
    .reduce((a, b) => a + b, 0)

  const { data: maxConnectionLimit, isPending: isLoadingMaxConnections } = useMaxConnectionsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      select: (data) => data.maxConnections,
      refetchInterval: live ? 3000 : false,
    }
  )

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex gap-x-4">
        <h2>Overview</h2>
      </div>

      <div className="flex flex-col gap-y-2">
        <div className="grid grid-cols-2 gap-2">
          <MetricCard isLoading={isLoadingRoles || isLoadingMaxConnections}>
            <MetricCardHeader>
              <MetricCardLabel
                tooltip={
                  <div>
                    <p className="text-foreground-light pr-2">Connections by roles:</p>
                    {rolesWithActiveConnections.map((role) => (
                      <div key={role.id} className="flex items-center">
                        <p className="min-w-32">{role.name}:</p> {role.activeConnections}
                      </div>
                    ))}
                  </div>
                }
              >
                Connections
              </MetricCardLabel>
            </MetricCardHeader>
            <MetricCardContent>
              <MetricCardValue className="space-x-1">
                <span>{totalActiveConnections}</span>
                <span className="text-sm text-foreground-light">/</span>
                <span className="text-sm text-foreground-light">{maxConnectionLimit}</span>
              </MetricCardValue>
            </MetricCardContent>
          </MetricCard>

          <MetricCard
            isLoading={isLoadingActivity}
            className={cn(warnLongestRunningQuery && 'bg-warning-200 border-warning-400')}
          >
            <MetricCardHeader>
              <MetricCardLabel
                className={cn(warnLongestRunningQuery && 'text-foreground')}
                tooltip="Only considers active or idle-in-transaction queries"
              >
                Longest running
              </MetricCardLabel>
            </MetricCardHeader>
            <MetricCardContent>
              <MetricCardValue
                className={cn(
                  'space-x-2',
                  longestRunningQuery === null
                    ? 'text-foreground-lighter'
                    : warnLongestRunningQuery
                      ? 'text-warning'
                      : 'text-foreground'
                )}
              >
                {longestRunningQuery === null ? (
                  '-'
                ) : (
                  <>
                    <span>{formatDuration(longestRunningQuery.duration * 1000, 0)}</span>
                    <span className="text-foreground-lighter text-sm">·</span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="text-foreground-lighter text-sm hover:text-foreground transition cursor-pointer"
                      onClick={() => setSelectedPid(longestRunningQuery.activity.pid)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedPid(longestRunningQuery.activity.pid)
                        }
                      }}
                    >
                      PID: {longestRunningQuery.activity.pid}
                    </span>
                  </>
                )}
              </MetricCardValue>
            </MetricCardContent>
          </MetricCard>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
          <MetricCard isLoading={isLoadingActivity}>
            <MetricCardHeader>
              <MetricCardLabel tooltip="Queries currently executing on the database.">
                Active queries
              </MetricCardLabel>
            </MetricCardHeader>
            <MetricCardContent>
              <MetricCardValue>{activeQueries?.length}</MetricCardValue>
            </MetricCardContent>
          </MetricCard>

          <MetricCard
            isLoading={isLoadingActivity}
            className={cn(blockedQueries.length && 'bg-destructive-200 border-destructive-400')}
          >
            <MetricCardHeader>
              <MetricCardLabel
                className={cn(blockedQueries.length && 'text-foreground')}
                tooltip={
                  <>
                    <p>
                      Queries waiting on a lock held by another session - stalls everything queued
                      behind it.
                    </p>
                    <p className="mt-2">
                      Typically caused by an uncommitted transaction, a long-running migration, or a
                      stuck idle-in-transaction session.
                    </p>
                  </>
                }
              >
                Blocked queries
              </MetricCardLabel>
            </MetricCardHeader>
            <MetricCardContent>
              <MetricCardValue className={cn(blockedQueries.length && 'text-destructive')}>
                {blockedQueries.length}
              </MetricCardValue>
            </MetricCardContent>
          </MetricCard>

          <MetricCard
            isLoading={isLoadingActivity}
            className={cn(idleInTransactionQueries.length && 'bg-warning-200 border-warning-400')}
          >
            <MetricCardHeader>
              <MetricCardLabel
                className={cn(idleInTransactionQueries.length && 'text-foreground')}
                tooltip={
                  <>
                    <p>
                      Transactions left open without running a query, which can hold locks and block
                      table cleanup for as long as it stays open
                    </p>
                    <p className="mt-2">
                      Typically indicates an app issue, such as a forgotten COMMIT or ROLLBACK.
                    </p>
                  </>
                }
              >
                Idle in transaction
              </MetricCardLabel>
            </MetricCardHeader>
            <MetricCardContent>
              <MetricCardValue
                className={cn(idleInTransactionQueries.length > 0 && 'text-warning')}
              >
                {idleInTransactionQueries.length}
              </MetricCardValue>
            </MetricCardContent>
          </MetricCard>
        </div>
      </div>
    </div>
  )
}
