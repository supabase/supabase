import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { ClockIcon, RouteIcon } from 'lucide-react'
import { Skeleton } from 'ui'

import { ColumnSchema } from '../UnifiedLogs.schema'
import { getLogTypeSource, getRowTimestampMs } from '../UnifiedLogs.utils'
import { LogPanelEmptyState } from './LogPanelEmptyState'
import { LogTimeline } from './LogTimeline'
import { AlertError } from '@/components/ui/AlertError'
import { DetailSectionHeader } from '@/components/ui/DataTable/DetailSectionHeader'
import { unifiedLogRequestTimelineQueryOptions } from '@/data/logs/unified-log-request-timeline-query'
import { useFormatDateTime } from '@/lib/datetime'

const COLLAPSED_STEP_COUNT = 3

interface RequestTimelineProps {
  row: ColumnSchema
  activeLog: ColumnSchema
  onSelectLog: (log: ColumnSchema) => void
}

export function LogTimestampHeader({ log }: { log: ColumnSchema }) {
  const formatDateTime = useFormatDateTime()
  const timestampMs = getRowTimestampMs(log)
  return (
    <DetailSectionHeader
      title="Logged"
      icon={ClockIcon}
      className="border-b"
      summary={timestampMs === null ? undefined : formatDateTime(timestampMs)}
    />
  )
}

export function RequestTimeline({ row, activeLog, onSelectLog }: RequestTimelineProps) {
  const { ref: projectRef } = useParams()
  const formatDateTime = useFormatDateTime()
  const { data, error, isLoading, isError } = useQuery(
    unifiedLogRequestTimelineQueryOptions({
      projectRef,
      logId: row.id,
      source: getLogTypeSource(row.log_type),
      logTimestampMs: getRowTimestampMs(row),
    })
  )

  const logs = data?.logs ?? []
  const hasLogs = !isLoading && !isError && logs.length > 0
  const hasNoLogs = !isLoading && !isError && logs.length === 0
  const [firstLog] = logs
  const startMs = (firstLog && getRowTimestampMs(firstLog)) ?? 0

  return (
    <>
      {/* Stays mounted across states so screen readers hear the result when loading ends */}
      <span aria-live="polite" className="sr-only">
        {hasNoLogs ? 'No related logs' : ''}
      </span>
      {isLoading && (
        <div className="flex flex-col gap-3 p-4" aria-label="Loading related logs">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      )}
      {isError && (
        <AlertError
          error={error}
          subject="Failed to retrieve related logs"
          projectRef={projectRef}
          className="m-4"
        />
      )}
      {hasNoLogs && (
        <LogPanelEmptyState
          icon={RouteIcon}
          title="No related logs"
          description="Logs appear here when they share a request, trace, or function execution ID."
        />
      )}
      {hasLogs && (
        <div className="py-2">
          <LogTimeline
            aria-label="Related logs"
            logs={logs}
            activeLogId={activeLog.id}
            onSelectLog={onSelectLog}
            collapsedStepCount={COLLAPSED_STEP_COUNT}
            getTimeLabel={(log) =>
              log.id === firstLog.id
                ? formatDateTime(startMs)
                : formatOffset((getRowTimestampMs(log) ?? startMs) - startMs)
            }
          />
        </div>
      )}
    </>
  )
}

function formatOffset(ms: number) {
  if (ms < 1000) return `+${Math.round(ms)} ms`
  return `+${(ms / 1000).toFixed(2)} s`
}
