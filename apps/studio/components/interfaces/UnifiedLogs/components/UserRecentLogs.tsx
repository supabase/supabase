import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { Button } from 'ui'

import type { ColumnSchema } from '../UnifiedLogs.schema'
import {
  buildUnifiedLogsUrl,
  createUnifiedLogsSearch,
  getRowTimestampMs,
  getUniqueLogRows,
} from '../UnifiedLogs.utils'
import { EmbeddedLogsTable } from './EmbeddedLogsTable'
import { useUnifiedLogsInfiniteQuery } from '@/data/logs/unified-logs-infinite-query'

// Enough to show recent activity; the rest is a link away
const MAX_ROWS = 10
const USER_LOGS_WINDOW_MS = 24 * 60 * 60 * 1000
// The panel is narrower than the Logs page, so it keeps its own column choices
const COLUMN_PREFERENCES_KEY = 'auth-user'

/** A user's most recent logs in the Logs page's table, each opening on the Logs page. */
export function UserRecentLogs({ userId }: { userId: string }) {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  // Fixed on mount so the query key stays stable
  const [[start, end]] = useState<[Date, Date]>(() => {
    const now = Date.now()
    return [new Date(now - USER_LOGS_WINDOW_MS), new Date(now)]
  })
  const { data, error, isError, isPending, isFetching } = useUnifiedLogsInfiniteQuery({
    projectRef,
    search: createUnifiedLogsSearch({ user: userId, date: [start, end] }),
    pageSize: MAX_ROWS,
  })
  const rows = useMemo(() => getUniqueLogRows<ColumnSchema>(data?.pages), [data?.pages])

  const getLogsUrl = (log?: ColumnSchema) => {
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
  const handleOpenLogs = () => router.push(getLogsUrl())
  const handleOpenLog = (logId: string) => {
    router.push(getLogsUrl(rows.find((row) => row.id === logId)))
  }

  // Outside the table, which is wider than the panel and would center this out of view
  if (!isPending && !isError && rows.length === 0) {
    return (
      <div className="flex flex-col gap-1 p-4 text-sm">
        <p className="text-foreground-light">No logs in the last 24 hours</p>
        <p className="text-foreground-lighter">
          Requests made with this user&apos;s access token, and their Auth events, appear here.
        </p>
      </div>
    )
  }

  return (
    <EmbeddedLogsTable
      rows={rows}
      isLoading={isPending}
      isFetching={isFetching}
      error={error}
      isError={isError}
      onRowClick={handleOpenLog}
      skeletonRowCount={3}
      columnPreferencesKey={COLUMN_PREFERENCES_KEY}
      footer={
        // Sized to its label so the Button's press-scale stays centered on the text
        <div className="px-0.5 py-0.5">
          <Button
            variant="text"
            size="tiny"
            className="text-foreground-lighter"
            onClick={handleOpenLogs}
          >
            View more in Logs
          </Button>
        </div>
      }
    />
  )
}
