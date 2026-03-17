import { useParams } from 'common'
import { LOGS_TABLES } from 'components/interfaces/Settings/Logs/Logs.constants'
import useLogsPreview from 'hooks/analytics/useLogsPreview'
import { Clock, ExternalLink, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, cn } from 'ui'
import { Admonition, TimestampInfo } from 'ui-patterns'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { parseEdgeFunctionEventMessage } from './EdgeFunctionRecentInvocations.utils'

interface EdgeFunctionRecentInvocationsProps {
  functionId: string
  functionSlug: string
}

export const EdgeFunctionRecentInvocations = ({
  functionId,
  functionSlug,
}: EdgeFunctionRecentInvocationsProps) => {
  const { ref } = useParams()
  const router = useRouter()

  const { logData, isLoading, isSuccess, refresh } = useLogsPreview({
    projectRef: ref as string,
    table: LOGS_TABLES.fn_edge,
    filterOverride: { function_id: functionId },
    limit: 10,
  })

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm">Recent Invocations</p>
          <p className="text-xs text-foreground-light">
            Latest invocation requests for this function
          </p>
        </div>
        <Button
          type="default"
          loading={isLoading}
          disabled={isLoading}
          icon={<RefreshCw size={14} />}
          onClick={() => refresh()}
        >
          Refresh
        </Button>
      </div>

      {isLoading && !isSuccess ? (
        <GenericSkeletonLoader />
      ) : logData.length === 0 ? (
        <Admonition
          type="note"
          title="No recent invocations"
          description="Invocation logs will appear here when requests are made to this function"
        />
      ) : (
        <div className="border rounded-md divide-y overflow-hidden">
          {logData.map((log) => {
            const statusCode = String(log.status_code ?? '')
            const method = String(log.method ?? '')
            const executionTime = log.execution_time_ms
            const is2xx = statusCode.startsWith('2')
            const is4xx = statusCode.startsWith('4')
            const is5xx = statusCode.startsWith('5')
            const logUrl = `/project/${ref}/functions/${functionSlug}/invocations?log=${log.id}`

            return (
              <div
                key={log.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(logUrl)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    router.push(logUrl)
                  }
                }}
                className="group flex items-center font-mono px-3 py-2 gap-3 bg-surface-100 cursor-pointer hover:bg-surface-200 transition-colors"
              >
                <span className="text-xs text-foreground-light whitespace-nowrap">
                  <TimestampInfo utcTimestamp={log.timestamp!} format="DD MMM YY, HH:mm:ss" />
                </span>
                <div className="flex items-center">
                  {statusCode ? (
                    <div
                      className={cn(
                        'flex items-center justify-center border px-1.5 py-0.5 rounded text-xs font-mono',
                        is2xx && 'text-brand border-brand bg-brand-300',
                        is4xx && 'text-warning border-warning bg-warning-300',
                        is5xx && 'text-destructive border-destructive bg-destructive-300',
                        !is2xx &&
                          !is4xx &&
                          !is5xx &&
                          'text-foreground-light border-default bg-surface-200'
                      )}
                    >
                      {statusCode}
                    </div>
                  ) : (
                    <span className="text-xs text-foreground-lighter">-</span>
                  )}
                </div>
                <span className="text-xs text-foreground-light">{method || '-'}</span>
                {executionTime !== undefined && (
                  <span className="flex items-center gap-1 text-xs text-foreground-light">
                    <Clock size={12} className="text-foreground-muted" />
                    {Number(executionTime).toFixed(0)}ms
                  </span>
                )}
                <span className="flex-1 text-xs text-foreground-light truncate">
                  {parseEdgeFunctionEventMessage(
                    String(log.event_message ?? ''),
                    method,
                    statusCode
                  )}
                </span>
                <ExternalLink
                  size={14}
                  className="shrink-0 text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            )
          })}
          <Link
            href={`/project/${ref}/functions/${functionSlug}/invocations`}
            className="flex items-center justify-center py-2 text-xs text-foreground-light hover:text-foreground transition-colors"
          >
            View all invocations
          </Link>
        </div>
      )}
    </div>
  )
}
