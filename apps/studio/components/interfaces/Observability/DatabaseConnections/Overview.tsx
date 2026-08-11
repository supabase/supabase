import { parseAsInteger, useQueryState } from 'nuqs'
import { cn } from 'ui'
import {
  MetricCard,
  MetricCardContent,
  MetricCardHeader,
  MetricCardLabel,
  MetricCardValue,
} from 'ui-patterns/MetricCard'

import { getConnectionMetrics } from './DatabaseConnections.utils'
import { formatDuration } from '@/components/interfaces/QueryPerformance/QueryPerformance.utils'
import { useDatabaseRolesQuery } from '@/data/database-roles/database-roles-query'
import { useDatabaseActivityQuery } from '@/data/database/activity-query'
import { useMaxConnectionsQuery } from '@/data/database/max-connections-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTrack } from '@/lib/telemetry/track'

interface OverviewProps {
  live?: boolean
}

export const Overview = ({ live }: OverviewProps) => {
  const track = useTrack()
  const { data: project } = useSelectedProjectQuery()
  const [, setSelectedPid] = useQueryState('pid', parseAsInteger)

  const { data, isPending: isLoadingActivity } = useDatabaseActivityQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { refetchOnWindowFocus: live, refetchInterval: live ? 3000 : false }
  )

  const {
    activeQueries,
    blockedQueries,
    warnBlockedQueries,
    longestBlockedQuery,
    idleInTransactionQueries,
    longestRunningQuery,
    warnLongestRunningQuery,
    queryBlockingTheMostQueries,
    warnTopBlocker,
  } = getConnectionMetrics(data ?? [])

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

  const onSelectPid = (pid: number) => {
    setSelectedPid(pid)
    document.getElementById(pid.toString())?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const onSelectLongestBlocked = () => {
    if (!longestBlockedQuery) return
    track('database_connections_overview_metric_card_clicked', { type: 'longest_blocked' })
    onSelectPid(longestBlockedQuery.activity.pid)
  }

  const onSelectTopBlocker = () => {
    if (!queryBlockingTheMostQueries) return
    track('database_connections_overview_metric_card_clicked', { type: 'top_blocker' })
    onSelectPid(queryBlockingTheMostQueries.activity.pid)
  }

  const onSelectLongestRunning = () => {
    if (!longestRunningQuery) return
    track('database_connections_overview_metric_card_clicked', { type: 'longest_running' })
    onSelectPid(longestRunningQuery.activity.pid)
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex gap-x-4">
        <h2>Overview</h2>
      </div>

      <div className="flex flex-col gap-y-2">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <MetricCard isLoading={isLoadingRoles || isLoadingMaxConnections}>
            <MetricCardHeader>
              <MetricCardLabel
                tooltip={
                  <div>
                    <p className="text-foreground-light">Connections by roles:</p>
                    <table>
                      <tbody>
                        {rolesWithActiveConnections.map((role) => (
                          <tr key={role.id}>
                            <th scope="row" className="text-left font-normal">
                              {role.name}:
                            </th>
                            <td className="pl-2">{role.activeConnections}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

          <MetricCard
            isLoading={isLoadingActivity}
            className={cn(warnBlockedQueries && 'bg-destructive-200 border-destructive-400')}
          >
            <MetricCardHeader>
              <MetricCardLabel
                className={cn(warnBlockedQueries && 'text-foreground')}
                tooltip={
                  <>
                    <p>
                      Queries waiting on a lock held by another session - stalls everything queued
                      behind it.
                    </p>
                    <p className="mt-2">
                      Typically caused by a slow transaction, a long-running migration, or a stuck
                      idle-in-transaction session.
                    </p>
                  </>
                }
              >
                Blocked queries
              </MetricCardLabel>
            </MetricCardHeader>
            <MetricCardContent>
              <MetricCardValue
                className={cn('space-x-1', warnBlockedQueries && 'text-destructive')}
              >
                <span>{blockedQueries.length}</span>
                {warnBlockedQueries && longestBlockedQuery && (
                  <>
                    <span className="text-foreground-light text-xs">·</span>
                    <span
                      role="button"
                      tabIndex={0}
                      className={cn(
                        'text-foreground-light text-xs cursor-pointer transition-all normal-nums',
                        'hover:text-foreground hover:underline',
                        'focus:text-foreground focus:underline'
                      )}
                      onClick={() => onSelectLongestBlocked()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onSelectLongestBlocked()
                        }
                      }}
                    >
                      PID {longestBlockedQuery.activity.pid} blocked for{' '}
                      <span className="tabular-nums">
                        {formatDuration(longestBlockedQuery.duration * 1000, 0)}
                      </span>
                    </span>
                  </>
                )}
              </MetricCardValue>
            </MetricCardContent>
          </MetricCard>

          <MetricCard
            isLoading={isLoadingActivity}
            className={cn(warnTopBlocker && 'bg-destructive-200 border-destructive-400')}
          >
            <MetricCardHeader>
              <MetricCardLabel
                className={cn(warnTopBlocker && 'text-foreground')}
                tooltip="The query blocking the most other queries"
              >
                Top blocker
              </MetricCardLabel>
            </MetricCardHeader>
            <MetricCardContent>
              <MetricCardValue
                className={cn(
                  'space-x-1',
                  queryBlockingTheMostQueries === null
                    ? 'text-foreground-lighter'
                    : warnTopBlocker
                      ? 'text-destructive'
                      : 'text-foreground'
                )}
              >
                {queryBlockingTheMostQueries === null ? (
                  '-'
                ) : (
                  <>
                    <span
                      role="button"
                      tabIndex={0}
                      className="normal-nums cursor-pointer hover:underline focus:underline"
                      onClick={() => onSelectTopBlocker()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onSelectTopBlocker()
                        }
                      }}
                    >
                      PID: {queryBlockingTheMostQueries?.activity.pid}
                    </span>
                    <span className="text-foreground-light text-xs">·</span>
                    <span
                      className={cn(
                        'text-xs',
                        warnTopBlocker ? 'text-foreground-light' : 'text-foreground-lighter'
                      )}
                    >
                      Blocking {queryBlockingTheMostQueries?.count} other{' '}
                      {queryBlockingTheMostQueries?.count > 1 ? 'queries' : 'query'}
                    </span>
                  </>
                )}
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
                  'space-x-1',
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
                    <span
                      role="button"
                      tabIndex={0}
                      className="normal-nums hover:underline focus:underline cursor-pointer"
                      onClick={() => onSelectLongestRunning()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onSelectLongestRunning()
                        }
                      }}
                    >
                      PID: {longestRunningQuery.activity.pid}
                    </span>
                    <span className="text-foreground-lighter text-sm">·</span>
                    <span
                      className={cn(
                        'text-sm',
                        warnLongestRunningQuery
                          ? 'text-foreground-light'
                          : 'text-foreground-lighter'
                      )}
                    >
                      {formatDuration(longestRunningQuery.duration * 1000, 0)}
                    </span>
                  </>
                )}
              </MetricCardValue>
            </MetricCardContent>
          </MetricCard>
        </div>
      </div>
    </div>
  )
}
