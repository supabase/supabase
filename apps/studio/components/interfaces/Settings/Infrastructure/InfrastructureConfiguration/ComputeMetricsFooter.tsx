import { useParams } from 'common'
import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { metricColor } from './InstanceNode.utils'
import { useComputeMetrics } from '@/hooks/analytics/useComputeMetrics'

/**
 * Compute metrics row at the bottom of a primary database node card, linking
 * to the database report. Metrics are project-scoped, which reports the
 * primary on both standard and High Availability projects.
 */
export const ComputeMetricsFooter = ({
  isConnectionsAvailable = true,
}: {
  isConnectionsAvailable?: boolean
}) => {
  const { ref } = useParams()

  const {
    cpu,
    disk,
    memory,
    connections,
    isLoading: isMetricsLoading,
    isError: isMetricsError,
  } = useComputeMetrics({
    projectRef: ref,
  })

  const observabilityUrl = `/project/${ref}/observability/database`
  const hasConnectionMetrics = isConnectionsAvailable && connections !== null && connections.max > 0

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={observabilityUrl}
          className="border-t px-3 py-2 hover:bg-surface-200 transition flex items-center gap-x-3 text-xs"
        >
          {/* Stable live region: announces loading/unavailability, never the polled values */}
          <span role="status" className="sr-only">
            {isMetricsLoading && 'Loading metrics'}
            {!isMetricsLoading && isMetricsError && 'Metrics unavailable'}
            {!isMetricsLoading && !isMetricsError && (
              <>
                {cpu === null && 'CPU unavailable. '}
                {disk === null && 'Disk unavailable. '}
                {memory === null && 'RAM unavailable. '}
                {!hasConnectionMetrics && 'Connection metrics unavailable.'}
              </>
            )}
          </span>
          {/* h-4 matches the text-xs line height so the card doesn't shift when metrics load */}
          {isMetricsLoading && (
            <div
              aria-hidden="true"
              className="h-4 w-44 rounded-sm bg-surface-300 motion-safe:animate-pulse"
            />
          )}
          {!isMetricsLoading && isMetricsError && (
            <span aria-hidden="true" className="text-foreground-lighter">
              Metrics unavailable
            </span>
          )}
          {!isMetricsLoading && !isMetricsError && (
            <>
              <span>
                CPU <MetricValue value={cpu} />
              </span>
              <span className="text-foreground-lighter">·</span>
              <span>
                Disk <MetricValue value={disk} />
              </span>
              <span className="text-foreground-lighter">·</span>
              <span>
                RAM <MetricValue value={memory} />
              </span>
              <span className="text-foreground-lighter">·</span>
              <span className="text-foreground-light">
                {hasConnectionMetrics ? (
                  <>
                    {connections.peak}/{connections.max} conns
                  </>
                ) : (
                  <>
                    Conns <span className="text-foreground-lighter">Unavailable</span>
                  </>
                )}
              </span>
            </>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="bottom">Go to Database Report</TooltipContent>
    </Tooltip>
  )
}

function MetricValue({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-foreground-lighter">Unavailable</span>
  }

  return <span className={metricColor(value)}>{value.toFixed(0)}%</span>
}
