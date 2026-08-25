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
export const ComputeMetricsFooter = ({ showConnections = true }: { showConnections?: boolean }) => {
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

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={observabilityUrl}
          className="border-t px-3 py-2 hover:bg-surface-200 transition flex items-center gap-x-3 text-xs"
        >
          {/* Stable live region: announces loading/failure, never the polled values */}
          <span role="status" className="sr-only">
            {isMetricsLoading && 'Loading metrics'}
            {!isMetricsLoading && isMetricsError && 'Metrics unavailable'}
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
                CPU <span className={metricColor(cpu)}>{cpu.toFixed(0)}%</span>
              </span>
              <span className="text-foreground-lighter">·</span>
              <span>
                Disk <span className={metricColor(disk)}>{disk.toFixed(0)}%</span>
              </span>
              <span className="text-foreground-lighter">·</span>
              <span>
                RAM <span className={metricColor(memory)}>{memory.toFixed(0)}%</span>
              </span>
              {showConnections && connections.max > 0 && (
                <>
                  <span className="text-foreground-lighter">·</span>
                  <span className="text-foreground-light">
                    {connections.peak}/{connections.max} conns
                  </span>
                </>
              )}
            </>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="bottom">Go to Database Report</TooltipContent>
    </Tooltip>
  )
}
