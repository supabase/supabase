/**
 * UserJourney — PROTOTYPE
 *
 * Renders a chronological timeline of everything one user did, reconstructed
 * from Auth and PostgREST logs: signed up, authenticated, API reads/writes,
 * and where a request was denied.
 *
 * This wires up REAL log queries (auth_logs + edge_logs filtered by the user)
 * via useLogsQuery. Where the logs can't tell the full story — most notably the
 * exact RLS policy that denied a write — it degrades gracefully (see the
 * data-availability note in UserJourney.utils.ts). A "Sample data" toggle shows
 * a hardcoded reference scenario so the tab stays demoable on projects with no
 * matching logs.
 *
 * See PRFAQ: https://www.notion.so/supabase/User-Journey-PRFAQ (placeholder link)
 */
import { useFlag, useParams } from 'common'
import {
  AlertTriangle,
  Database,
  ExternalLink,
  FlaskConical,
  LogIn,
  RefreshCw,
  UserPlus,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Button, cn, Separator } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { UserHeader } from './UserHeader'
import {
  buildAuthLogsSql,
  buildEdgeLogsSql,
  buildJourney,
  isValidUserId,
  SAMPLE_JOURNEY_EVENTS,
  type JourneyEvent,
} from './UserJourney.utils'
import { PANEL_PADDING } from './Users.constants'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { User } from '@/data/auth/users-infinite-query'
import { useLogsQuery } from '@/hooks/analytics/useLogsQuery'

const getEventIcon = (event: JourneyEvent) => {
  if (event.status === 'error') return AlertTriangle
  if (event.source === 'postgrest') return Database
  return event.title === 'Signed up' ? UserPlus : LogIn
}

const RequestLine = ({ request }: { request: NonNullable<JourneyEvent['request']> }) => (
  <span className="font-mono text-xs text-foreground-light">
    {request.method} {request.path} · {request.statusCode}
  </span>
)

interface UserJourneyProps {
  user: User
}

export const UserJourney = ({ user }: UserJourneyProps) => {
  const { ref } = useParams()
  const useOtel = useFlag('otelLegacyLogs')

  // Sample data is a local-only demo affordance — never expose it to customers.
  const isLocal = process.env.NEXT_PUBLIC_ENVIRONMENT === 'local'

  const [errorsOnly, setErrorsOnly] = useState(false)
  const [showSample, setShowSample] = useState(false)

  const userId = user.id
  const canQuery = isValidUserId(userId) && !showSample

  const authSql = useMemo(
    () => (isValidUserId(userId) ? buildAuthLogsSql(userId, useOtel) : ''),
    [userId, useOtel]
  )
  const edgeSql = useMemo(
    () => (isValidUserId(userId) ? buildEdgeLogsSql(userId, useOtel) : ''),
    [userId, useOtel]
  )

  const {
    logData: authLogs,
    isLoading: isLoadingAuth,
    error: authError,
    runQuery: runAuthQuery,
  } = useLogsQuery({
    projectRef: ref,
    initialParams: { sql: authSql },
    enabled: canQuery,
    options: { useOtel },
  })

  const {
    logData: edgeLogs,
    isLoading: isLoadingEdge,
    error: edgeError,
    runQuery: runEdgeQuery,
  } = useLogsQuery({
    projectRef: ref,
    initialParams: { sql: edgeSql },
    enabled: canQuery,
    options: { useOtel },
  })

  const liveEvents = useMemo(() => buildJourney(authLogs, edgeLogs), [authLogs, edgeLogs])

  const isLoading = canQuery && (isLoadingAuth || isLoadingEdge)
  const error = authError || edgeError
  const allEvents = showSample ? SAMPLE_JOURNEY_EVENTS : liveEvents
  const events = errorsOnly ? allEvents.filter((event) => event.status === 'error') : allEvents

  const refresh = () => {
    runAuthQuery()
    runEdgeQuery()
  }

  return (
    <div>
      <UserHeader user={user} />

      <Separator />

      <div className={cn('flex flex-col gap-y-4', PANEL_PADDING)}>
        <div className="flex items-start justify-between">
          <div>
            <p>User journey</p>
          </div>
          <span className="text-xs text-foreground-lighter whitespace-nowrap pt-0.5">
            Last 24 hours
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant={errorsOnly ? 'default' : 'secondary'}
              className="rounded-r-none border-r-0"
              onClick={() => setErrorsOnly(false)}
            >
              Show all
            </Button>
            <div className="border-button border border-l-0 py-3" />
            <Button
              variant={errorsOnly ? 'secondary' : 'default'}
              className="rounded-l-none border-l-0"
              onClick={() => setErrorsOnly(true)}
            >
              Errors only
            </Button>
          </div>
          <div className="flex items-center gap-x-2">
            {isLocal && (
              <ButtonTooltip
                variant={showSample ? 'secondary' : 'default'}
                className="px-2"
                icon={<FlaskConical />}
                onClick={() => setShowSample((value) => !value)}
                tooltip={{
                  content: { text: showSample ? 'Showing sample data' : 'Show sample data' },
                }}
              />
            )}
            <ButtonTooltip
              asChild
              variant="default"
              className="px-2"
              tooltip={{ content: { text: 'Filter logs by user' } }}
            >
              <Link href={`/project/${ref}/logs/auth-logs?s=${user.id}`}>
                <ExternalLink size={14} className="text-foreground-light" />
              </Link>
            </ButtonTooltip>
            <ButtonTooltip
              variant="default"
              className="px-2"
              icon={<RefreshCw />}
              loading={isLoading}
              disabled={isLoading || showSample}
              onClick={refresh}
              tooltip={{ content: { text: 'Refresh' } }}
            />
          </div>
        </div>

        {isLoading && events.length === 0 ? (
          <GenericSkeletonLoader />
        ) : error && events.length === 0 && !showSample ? (
          <Admonition
            type="warning"
            title="Unable to load this user's journey"
            description={typeof error === 'string' ? error : 'Failed to query auth and API logs'}
          />
        ) : events.length === 0 ? (
          <Admonition
            type="note"
            title="No journey available for this user"
            description="Events from auth and API logs will be shown here"
          />
        ) : (
          <ol className="flex flex-col">
            {events.map((event, index) => {
              const Icon = getEventIcon(event)
              const isLast = index === events.length - 1
              const isError = event.status === 'error'

              return (
                <li key={event.id} className="flex gap-x-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex items-center justify-center rounded-full w-6 h-6 shrink-0 border',
                        isError
                          ? 'bg-destructive-200 border-destructive-400 text-destructive'
                          : 'bg-surface-100 border-strong text-foreground-light'
                      )}
                    >
                      <Icon size={12} strokeWidth={1.5} />
                    </div>
                    {!isLast && <div className="w-px grow bg-border my-1.5" />}
                  </div>

                  <div className={cn('flex-1 min-w-0', isLast ? 'pb-0' : 'pb-8')}>
                    {isError ? (
                      <div className="rounded-md border border-destructive-400 bg-destructive-200 overflow-hidden">
                        <div className="px-3 py-2.5">
                          <div className="flex items-center justify-between gap-x-2">
                            <p className="text-sm font-medium text-destructive">{event.title}</p>
                            <TimestampInfo
                              utcTimestamp={event.timestamp}
                              format="HH:mm:ss.SSS"
                              className="font-mono text-xs text-destructive whitespace-nowrap"
                            />
                          </div>
                          <p className="text-xs text-foreground-light mt-0.5">
                            {event.description}
                          </p>
                          {event.request && (
                            <p className="mt-1.5">
                              <RequestLine request={event.request} />
                            </p>
                          )}
                        </div>
                        {event.error && (
                          <>
                            <Separator className="bg-destructive-400" />
                            <div className="px-3 py-2.5">
                              <p className="text-xs text-foreground-light">{event.error.message}</p>
                              {(event.error.policy || event.error.table) && (
                                <p className="text-xs mt-1">
                                  {event.error.policy ? (
                                    <>
                                      <span className="text-foreground-light">policy </span>
                                      <span className="font-mono text-foreground">
                                        {event.error.policy}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-foreground-light">
                                      policy name unavailable from logs
                                    </span>
                                  )}
                                  {event.error.table && (
                                    <>
                                      <span className="text-foreground-light"> on table </span>
                                      <span className="font-mono text-foreground">
                                        {event.error.table}
                                      </span>
                                    </>
                                  )}
                                </p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-x-2">
                          <p className="text-sm font-medium text-foreground">{event.title}</p>
                          <TimestampInfo
                            utcTimestamp={event.timestamp}
                            format="HH:mm:ss.SSS"
                            className="font-mono text-xs text-foreground-lighter whitespace-nowrap"
                          />
                        </div>
                        <p className="text-xs text-foreground-light mt-0.5">{event.description}</p>
                        {event.request && (
                          <p className="mt-1.5">
                            <RequestLine request={event.request} />
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}
