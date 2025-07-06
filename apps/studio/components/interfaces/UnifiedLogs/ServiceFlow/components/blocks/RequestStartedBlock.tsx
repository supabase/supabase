import { memo } from 'react'
import { StyledIcon } from '../shared/TimelineStep'
import { Clock } from 'lucide-react'

// Request Started - Simple header component with connecting line
export const RequestStartedBlock = memo(
  ({ data, enrichedData }: { data: any; enrichedData?: any }) => {
    const timestamp = data?.timestamp || data?.date
    const formattedTime = timestamp ? new Date(timestamp).toLocaleString() : null

    return (
      <div className="">
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
  }
)

RequestStartedBlock.displayName = 'RequestStartedBlock'

export const MemoizedRequestStartedBlock = memo(RequestStartedBlock, (prev, next) => {
  return prev.data === next.data && prev.enrichedData === next.enrichedData
}) as typeof RequestStartedBlock
