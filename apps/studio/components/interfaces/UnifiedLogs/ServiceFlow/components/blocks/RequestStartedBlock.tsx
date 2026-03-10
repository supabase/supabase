import { Clock } from 'lucide-react'
import { memo } from 'react'
import { ColumnSchema } from '../../../UnifiedLogs.schema'
import { StyledIcon } from '../shared/TimelineStep'

// Request Started - Simple header component with connecting line
export const MemoizedRequestStartedBlock = memo(function RequestStartedBlock({
  data,
}: {
  data: ColumnSchema
}) {
  // Convert microseconds to milliseconds for JavaScript Date
  const timestampMs = data?.timestamp
    ? data.timestamp / 1000
    : data?.date
      ? data.date.getTime()
      : null
  const formattedTime = timestampMs ? new Date(timestampMs).toLocaleString() : null

  return (
    <div>
      <div className="flex items-center justify-between py-0 px-2">
        <div className="flex items-center gap-2 text-sm text-foreground-light">
          <StyledIcon icon={Clock} title="Request started" />
          <span>Request started</span>
        </div>
        {formattedTime && (
          <span className="text-sm font-mono text-foreground-light">{formattedTime}</span>
        )}
      </div>
      {/* Connecting line to first timeline block */}
      <div className="border-l h-4 ml-5"></div>
    </div>
  )
})

MemoizedRequestStartedBlock.displayName = 'MemoizedRequestStartedBlock'
