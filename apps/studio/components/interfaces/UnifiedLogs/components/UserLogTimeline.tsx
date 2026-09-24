import { useParams } from 'common'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { Skeleton } from 'ui'

import { ColumnSchema } from '../UnifiedLogs.schema'
import {
  buildUnifiedLogsUrl,
  createUnifiedLogsSearch,
  getRowTimestampMs,
  getUniqueLogRows,
} from '../UnifiedLogs.utils'
import { LogTimeline, TimelineLinkStep } from './LogTimeline'
import { AlertError } from '@/components/ui/AlertError'
import { useUnifiedLogsInfiniteQuery } from '@/data/logs/unified-logs-infinite-query'

// Enough to show recent activity; the rest is a link away
const MAX_STEPS = 10
const USER_LOGS_WINDOW_MS = 24 * 60 * 60 * 1000

/** A user's most recent logs, linking each one and the full list to the logs page. */
export function UserLogTimeline({ userId }: { userId: string }) {
  const { ref: projectRef } = useParams()
  // Fixed on mount so the query key stays stable
  const [[start, end]] = useState<[Date, Date]>(() => {
    const now = Date.now()
    return [new Date(now - USER_LOGS_WINDOW_MS), new Date(now)]
  })
  const search = useMemo(
    () => createUnifiedLogsSearch({ user: userId, date: [start, end] }),
    [userId, start, end]
  )
  const { data, error, isPending, isError } = useUnifiedLogsInfiniteQuery({
    projectRef,
    search,
    pageSize: MAX_STEPS,
  })

  if (isPending) {
    return (
      <div className="flex flex-col gap-3 p-4" aria-label="Loading user logs">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <AlertError
        error={error}
        subject="Failed to retrieve user logs"
        projectRef={projectRef}
        className="m-4"
      />
    )
  }

  const logs = getUniqueLogRows<ColumnSchema>(data.pages)

  if (logs.length === 0) {
    return (
      <div className="flex flex-col gap-1 p-4 text-sm">
        <p className="text-foreground-light">No logs in the last 24 hours</p>
        <p className="text-foreground-lighter">
          Requests made with this user&apos;s access token, and their Auth events, appear here.
        </p>
      </div>
    )
  }

  const hrefFor = (log?: ColumnSchema) => {
    const logMs = log ? getRowTimestampMs(log) : null
    return buildUnifiedLogsUrl({
      projectRef: projectRef ?? '',
      user: userId,
      start,
      // Ending just after a log keeps it on the first page of the list
      end: logMs ? new Date(logMs + 1000) : end,
      logId: log?.id,
    })
  }

  return (
    <div className="py-2">
      <LogTimeline
        aria-label="User logs"
        logs={logs}
        getTimeLabel={(log) => dayjs(log.date).format('DD MMM, HH:mm:ss')}
        getLogHref={hrefFor}
        footer={<TimelineLinkStep href={hrefFor()}>View more in Logs</TimelineLinkStep>}
      />
    </div>
  )
}
