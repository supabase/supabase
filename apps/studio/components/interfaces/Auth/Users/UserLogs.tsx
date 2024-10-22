import dayjs from 'dayjs'
import { RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

import { useParams } from 'common'
import { LOGS_TABLES } from 'components/interfaces/Settings/Logs/Logs.constants'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { User } from 'data/auth/users-query'
import useLogsPreview from 'hooks/analytics/useLogsPreview'
import { Button, cn, CriticalIcon, Separator } from 'ui'
import { Admonition, TimestampInfo } from 'ui-patterns'
import { UserHeader } from './UserHeader'
import { PANEL_PADDING } from './UserPanel'

interface UserLogsProps {
  user: User
}

export const UserLogs = ({ user }: UserLogsProps) => {
  const { ref } = useParams()

  const {
    // logData: authLogs,
    isSuccess: isSuccessAuthLogs,
    isLoading: isLoadingAuthLogs,
    filters,
    refresh,
    setFilters,
  } = useLogsPreview({
    projectRef: ref as string,
    table: LOGS_TABLES.auth,
    filterOverride: { search_query: user.id },
    limit: 5,
  })

  const authLogs = [
    {
      error: null,
      event_message:
        '{"action":"login","instance_id":"00000000-0000-0000-0000-000000000000","level":"info","login_method":"password","metering":true,"msg":"Login","time":"2024-10-21T18:28:32Z","user_id":"a63206a3-d3d7-49a1-a6b2-f2ab8380577c"}',
      id: '68e7e768-89d0-4c8a-880f-9335e96c2c02',
      level: 'info',
      msg: 'Login',
      path: null,
      status: null,
      timestamp: 1729535312000000,
    },
    {
      error: null,
      event_message:
        '{"auth_event":{"action":"login","actor_id":"a63206a3-d3d7-49a1-a6b2-f2ab8380577c","actor_username":"example@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}},"component":"api","duration":94824175,"level":"info","method":"POST","msg":"request completed","path":"/token","referer":"http://localhost:3000","remote_addr":"159.2.122.228","request_id":"8d634ed9056c5e7a-EWR","status":200,"time":"2024-10-21T18:28:32Z"}',
      id: '145b40ee-dea1-4ef2-82da-80c611614b4a',
      level: 'info',
      msg: 'request completed',
      path: '/token',
      status: '200',
      timestamp: 1729535312000000,
    },
  ]

  useEffect(() => {
    if (user.id) setFilters({ ...filters, search_query: user.id })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  return (
    <div>
      <UserHeader user={user} />

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
              type={'status_code' in filters ? 'default' : 'secondary'}
              className="rounded-r-none border-r-0"
              disabled={isLoadingAuthLogs}
              onClick={() => setFilters({ search_query: user.id })}
            >
              Show all
            </Button>
            <div className="border-button border border-l-0 py-3" />
            <Button
              type={'status_code' in filters ? 'secondary' : 'default'}
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
            type="default"
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
            <div className="border border-b-0 rounded-t divide-y">
              {authLogs.map((log) => {
                const status = ((log.status ?? '-') as any).toString()
                const is400 = status.startsWith('4')
                const is500 = status.startsWith('5')

                return (
                  <div
                    key={log.id}
                    className="flex items-center transition font-mono px-2 py-1.5 bg-surface-100 divide-x"
                  >
                    <p className="text-xs text-foreground-light min-w-[125px] w-[125px] px-1">
                      <TimestampInfo value={log.timestamp / 1000} />
                    </p>
                    <div className="flex items-center text-xs text-foreground-light h-[22px] min-w-[70px] w-[70px] px-2">
                      <div
                        className={cn(
                          'flex items-center justify-center gap-x-1',
                          !!log.status && 'border px-1 py-0.5 rounded',
                          is400
                            ? 'text-warning border-warning bg-warning-300'
                            : is500
                              ? 'text-destructive border-destructive bg-destructive-300'
                              : ''
                        )}
                      >
                        {(is400 || is500) && (
                          <CriticalIcon
                            hideBackground
                            className={cn(is400 && 'text-warning-600')}
                          />
                        )}
                        {status}
                      </div>
                    </div>
                    <p className="text-xs text-foreground-light px-2 truncate">{`${log.path} | ${log.msg}`}</p>
                  </div>
                )
              })}
            </div>
            <Button
              block
              asChild
              type="outline"
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
