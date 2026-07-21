import dayjs from 'dayjs'
import { ArrowRight } from 'lucide-react'
import { AiIconAnimation, cn } from 'ui'
import {
  MetricCard,
  MetricCardContent,
  MetricCardHeader,
  MetricCardLabel,
  MetricCardValue,
} from 'ui-patterns/MetricCard'

import { buildDatabaseConnectionsSummaryPrompt } from './DatabaseConnections.ai'
import { WARN_DURATION_ACTIVE_QUERY, WARN_DURATION_IDLE_TXN } from './DatabaseConnections.constants'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useDatabaseRolesQuery } from '@/data/database-roles/database-roles-query'
import { useDatabaseActivityQuery, type DatabaseActivity } from '@/data/database/activity-query'
import { useMaxConnectionsQuery } from '@/data/database/max-connections-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

const LONG_RUNNING_STATES: (DatabaseActivity['state'] | undefined)[] = [
  'active',
  'idle in transaction',
  'idle in transaction (aborted)',
]

interface OverviewProps {
  live?: boolean
  refreshTimestamp: string
}

/**
 * [Joshen] Couple of nuances worth calling out to provide better signals for the user
 * - Idle in transaction:
 *   - Only considers queries in that state, but running for longer than 10 seconds
 *   - Could otherwise be a query in mid-flight
 * - Longest running:
 *  - Only considers queries that are active or idle in transaction
 */
export const Overview = ({ live, refreshTimestamp }: OverviewProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()

  const { data, isPending: isLoadingActivity } = useDatabaseActivityQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { refetchOnWindowFocus: live, refetchInterval: live ? 3000 : false }
  )
  const activeQueries = data?.filter((x) => x.state === 'active')
  const blockedQueries = data?.filter((x) => x.blocked_by.length > 0)
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
  const queryRunningLongWarning =
    !!longestRunningQuery &&
    ((longestRunningQuery.activity.state === 'active' &&
      longestRunningQuery.duration >= WARN_DURATION_ACTIVE_QUERY) ||
      ((longestRunningQuery.activity.state === 'idle in transaction' ||
        longestRunningQuery.activity.state === 'idle in transaction (aborted)') &&
        longestRunningQuery.duration >= WARN_DURATION_IDLE_TXN))

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

  const handleSummarizeActivity = () => {
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    const prompt = buildDatabaseConnectionsSummaryPrompt({
      activities: data ?? [],
      timestamp: refreshTimestamp,
    })
    aiSnap.newChat({
      name: `DB Connections Summary ${dayjs().format('DD/MM/YYYY HH:mm')}`,
      initialMessage: prompt,
    })
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex gap-x-4">
        <h2>Overview</h2>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
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
            <MetricCardValue>
              {totalActiveConnections}/{maxConnectionLimit}
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

        <MetricCard isLoading={isLoadingActivity}>
          <MetricCardHeader>
            <MetricCardLabel
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
              className={cn(idleInTransactionQueries.length > 0 && 'text-destructive')}
            >
              {idleInTransactionQueries.length}
            </MetricCardValue>
          </MetricCardContent>
        </MetricCard>

        <MetricCard isLoading={isLoadingActivity}>
          <MetricCardHeader>
            <MetricCardLabel
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
            <MetricCardValue>{blockedQueries?.length ?? 0}</MetricCardValue>
          </MetricCardContent>
        </MetricCard>

        <MetricCard isLoading={isLoadingActivity}>
          <MetricCardHeader>
            <MetricCardLabel tooltip="Only considers active or idle-in-transaction queries">
              Longest running
            </MetricCardLabel>
          </MetricCardHeader>
          <MetricCardContent>
            <MetricCardValue
              className={cn(
                longestRunningQuery === null && 'text-foreground-lighter',
                queryRunningLongWarning &&
                  (longestRunningQuery?.activity.state === 'active'
                    ? 'text-warning'
                    : 'text-destructive')
              )}
            >
              {longestRunningQuery === null ? '-' : `${longestRunningQuery.duration}s`}
            </MetricCardValue>
          </MetricCardContent>
        </MetricCard>

        <MetricCard
          className="border-brand-400 hover:border-brand-500 cursor-pointer"
          onClick={handleSummarizeActivity}
        >
          <MetricCardHeader>
            <MetricCardLabel className="[&>span]:flex [&>span]:items-center [&>span]:gap-x-2">
              <AiIconAnimation allowHoverEffect size={12} />
              <span className="text-brand">AI Summary</span>
            </MetricCardLabel>
          </MetricCardHeader>
          <MetricCardContent>
            <div className="flex flex-row items-center gap-x-2 translate-y-1">
              <p>Summarize activity</p>
              <ArrowRight size={14} />
            </div>
          </MetricCardContent>
        </MetricCard>
      </div>
    </div>
  )
}
