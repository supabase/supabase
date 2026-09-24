import { useParams } from 'common'
import dayjs from 'dayjs'
import { useState } from 'react'
import { Skeleton } from 'ui'

import { getUserLogsHref, getUserLogsRange, getUserLogsSearch } from '../UnifiedLogs.links'
import { ColumnSchema } from '../UnifiedLogs.schema'
import { getRowTimestampMs } from '../UnifiedLogs.utils'
import { LogTimeline, TimelineLinkStep } from './LogTimeline'
import { AlertError } from '@/components/ui/AlertError'
import { useUnifiedLogsInfiniteQuery } from '@/data/logs/unified-logs-infinite-query'

// Enough to show recent activity; the rest is a link away
const MAX_STEPS = 10

/** A user's most recent logs, linking each one and the full list to the logs page. */
export function UserLogTimeline({ userId }: { userId: string }) {
  const { ref: projectRef } = useParams()
  // Fixed on mount so the query key stays stable
  const [range] = useState(() => getUserLogsRange(Date.now()))
  const { data, error, isPending, isError } = useUnifiedLogsInfiniteQuery({
    projectRef,
    search: getUserLogsSearch({ userId, range }),
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

  const logs: ColumnSchema[] = data.pages[0]?.data ?? []

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

  const hrefFor = (logId?: string, endMs?: number) =>
    getUserLogsHref({
      projectRef: projectRef ?? '',
      userId,
      // Ending just after a log keeps it on the first page of the list
      range: endMs ? [range[0], new Date(endMs + 1000)] : range,
      logId,
    })

  return (
    <div className="py-2">
      <LogTimeline
        aria-label="User logs"
        logs={logs.slice(0, MAX_STEPS)}
        getTimeLabel={(log) => dayjs(log.date).format('DD MMM, HH:mm:ss')}
        getLogHref={(log) => hrefFor(log.id, getRowTimestampMs(log) ?? undefined)}
        footer={<TimelineLinkStep href={hrefFor()}>View more in Logs</TimelineLinkStep>}
      />
    </div>
  )
}
