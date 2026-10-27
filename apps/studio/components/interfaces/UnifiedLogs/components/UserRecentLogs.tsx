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

const MAX_ROWS = 10
const USER_LOGS_WINDOW_MS = 24 * 60 * 60 * 1000
const COLUMN_PREFERENCES_KEY = 'auth-user'

export function UserRecentLogs({ userId }: { userId: string }) {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const [[start, end]] = useState<[Date, Date]>(() => {
    const now = Date.now()
    return [new Date(now - USER_LOGS_WINDOW_MS), new Date(now)]
  })
  const { data, error, isError, isPending, isFetching } = useUnifiedLogsInfiniteQuery(
    {
      projectRef,
      search: createUnifiedLogsSearch({ user: userId, date: [start, end] }),
      pageSize: MAX_ROWS,
    },
    { placeholderData: undefined }
  )
  const rows = useMemo(() => getUniqueLogRows<ColumnSchema>(data?.pages), [data?.pages])

  const getLogsUrl = (log?: ColumnSchema) => {
    const logMs = log ? getRowTimestampMs(log) : null
    return buildUnifiedLogsUrl({
      projectRef: projectRef ?? '',
      user: userId,
      start,
      end: logMs ? new Date(logMs + 1000) : end,
      logId: log?.id,
    })
  }
  const handleOpenLogs = () => router.push(getLogsUrl())
  const handleOpenLog = (logId: string) => {
    router.push(getLogsUrl(rows.find((row) => row.id === logId)))
  }

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
