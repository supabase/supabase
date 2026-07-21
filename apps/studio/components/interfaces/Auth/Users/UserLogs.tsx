import { useParams } from 'common'
import { ExternalLink, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { Button, cn, Separator } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { UserHeader } from './UserHeader'
import { PANEL_PADDING } from './Users.constants'
import { LOGS_TABLES } from '@/components/interfaces/Settings/Logs/Logs.constants'
import { LogTypeIcon } from '@/components/interfaces/UnifiedLogs/components/LogTypeIcon'
import { getLevelRowClassName } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DataTableColumnLevelIndicator } from '@/components/ui/DataTable/DataTableColumn/DataTableColumnLevelIndicator'
import { DataTableColumnStatusCode } from '@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'
import { User } from '@/data/auth/users-infinite-query'
import useLogsPreview from '@/hooks/analytics/useLogsPreview'
import { useLogsUrlState } from '@/hooks/analytics/useLogsUrlState'

interface UserLogsProps {
  user: User
}

const API_LOGS_QUERY = (userId: string) =>
  `select\n  cast(timestamp as datetime) as timestamp,\n  event_message, metadata \nfrom edge_logs \nWHERE (\n  metadata[SAFE_OFFSET(0)].request[SAFE_OFFSET(0)].sb[SAFE_OFFSET(0)].auth_user\n    = '${userId}'\n)\nlimit 100`

export const UserLogs = ({ user }: UserLogsProps) => {
  const { ref } = useParams()
  const { filters, setFilters } = useLogsUrlState()
  const [, setFiltersValue] = useQueryState('f')

  const {
    logData: authLogs,
    isSuccess: isSuccessAuthLogs,
    isLoading: isLoadingAuthLogs,
    refresh,
  } = useLogsPreview({
    projectRef: ref as string,
    table: LOGS_TABLES.auth,
    filterOverride: { search_query: user.id },
    limit: 5,
  })

  useEffect(() => {
    if (user.id) setFilters({ ...filters, search_query: user.id })

    return () => {
      setFiltersValue(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  return (
    <div>
      <UserHeader user={user} />

      <Separator />

      <div className={cn('flex flex-col gap-y-3', PANEL_PADDING)}>
        <div>
          <p>API logs</p>
          <p className="text-sm text-foreground-light">
            View edge logs for requests made by this user
          </p>
        </div>

        <Button asChild variant="default" className="w-min">
          <Link
            href={`/project/${ref}/logs/explorer?q=${encodeURIComponent(API_LOGS_QUERY(user.id ?? ''))}`}
          >
            Open in Log Explorer
          </Link>
        </Button>
      </div>

      <Separator />

      <div className={cn('flex flex-col gap-y-3', PANEL_PADDING)}>
        <div>
          <p>Authentication logs</p>
          <p className="text-sm text-foreground-light">
            Latest logs from authentication for this user in the past hour
          </p>
        </div>

        {/* [Joshen] This whole thing here i reckon we can shift to a component, if in the future we wanna add more user logs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant={'status_code' in filters ? 'default' : 'secondary'}
              className="rounded-r-none border-r-0"
              disabled={isLoadingAuthLogs}
              onClick={() => setFilters({ search_query: user.id })}
            >
              Show all
            </Button>
            <div className="border-button border border-l-0 py-3" />
            <Button
              variant={'status_code' in filters ? 'secondary' : 'default'}
              className="rounded-l-none border-l-0"
              disabled={isLoadingAuthLogs}
              onClick={() =>
                setFilters({
                  search_query: user.id,
                  status_code: { client_error: true, server_error: true },
                })
              }
            >
              Error only
            </Button>
          </div>
          <Button
            variant="default"
            loading={isLoadingAuthLogs}
            disabled={isLoadingAuthLogs}
            icon={<RefreshCw />}
            onClick={() => refresh()}
          >
            Refresh
          </Button>
        </div>

        {isLoadingAuthLogs && !isSuccessAuthLogs ? (
          <GenericSkeletonLoader />
        ) : authLogs.length === 0 ? (
          <Admonition
            type="note"
            title="No authentication logs available for this user"
            description="Auth events such as logging in will be shown here"
          />
        ) : (
          <div>
            <div className="border border-b-0 rounded-t-md overflow-x-auto">
              <div className="min-w-[640px] divide-y">
                {authLogs.map((log) => {
                  const status =
                    log.status !== undefined && log.status !== null ? String(log.status) : undefined
                  const level = status?.startsWith('5')
                    ? 'error'
                    : status?.startsWith('4')
                      ? 'warning'
                      : 'success'
                  const method = log.method ? String(log.method) : ''

                  return (
                    <div
                      key={log.id}
                      className={cn(
                        'group relative flex items-center h-[30px] pl-3 text-xs hover:bg-surface-200',
                        getLevelRowClassName(level)
                      )}
                    >
                      <DataTableColumnLevelIndicator
                        value={level}
                        className="w-2 min-w-2 shrink-0"
                      />
                      <div className="font-mono tracking-tight text-foreground-light w-[140px] shrink-0 truncate pl-3 pr-2">
                        <TimestampInfo utcTimestamp={log.timestamp / 1000} />
                      </div>
                      <div className="w-[32px] shrink-0 flex items-center justify-end pr-2">
                        <LogTypeIcon type="auth" size={14} className="text-foreground-lighter" />
                      </div>
                      <div className="w-[60px] shrink-0 flex items-center px-2">
                        <DataTableColumnStatusCode value={status} level={level} />
                      </div>
                      <div className="font-mono tracking-tight text-foreground-lighter w-[64px] shrink-0 truncate px-2">
                        {method}
                      </div>
                      <div className="font-mono tracking-tight text-foreground w-[200px] shrink-0 truncate px-2">
                        {String(log.path ?? '')}
                      </div>
                      <div className="font-mono tracking-tight text-muted-foreground flex-1 min-w-[160px] truncate px-2">
                        {String(log.msg ?? '')}
                      </div>

                      <ButtonTooltip
                        variant="outline"
                        asChild
                        tooltip={{ content: { text: 'Open in logs' } }}
                        className="px-1.5 absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition bg-background focus-visible:opacity-100"
                      >
                        <Link href={`/project/${ref}/logs/auth-logs?log=${log.id}`}>
                          <ExternalLink size="12" className="text-foreground-light" />
                        </Link>
                      </ButtonTooltip>
                    </div>
                  )
                })}
              </div>
            </div>
            <Button
              block
              asChild
              variant="outline"
              className="transition rounded-t-none text-foreground-light hover:text-foreground"
            >
              <Link href={`/project/${ref}/logs/auth-logs?s=${user.id}`}>See more logs</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
