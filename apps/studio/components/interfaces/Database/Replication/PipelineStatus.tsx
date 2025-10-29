import { AlertTriangle, Loader2 } from 'lucide-react'

import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { ReplicationPipelineStatusData } from 'data/replication/pipeline-status-query'
import { PipelineStatusRequestStatus } from 'state/replication-pipeline-request-status'
import { ResponseError } from 'types'
import { cn, Tooltip, TooltipContent, TooltipTrigger, WarningIcon } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { getPipelineStateMessages } from './Pipeline.utils'
import { PipelineStatusName } from './Replication.constants'

interface PipelineStatusProps {
  pipelineStatus: ReplicationPipelineStatusData['status'] | undefined
  error: ResponseError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  requestStatus?: PipelineStatusRequestStatus
  pipelineId?: number
}

export const PipelineStatus = ({
  pipelineStatus,
  error,
  isLoading,
  isError,
  isSuccess,
  requestStatus,
  pipelineId,
}: PipelineStatusProps) => {
  const { ref } = useParams()

  // Map backend statuses to UX-friendly display
  const getStatusConfig = () => {
    const statusName =
      pipelineStatus && typeof pipelineStatus === 'object' && 'name' in pipelineStatus
        ? pipelineStatus.name
        : undefined

    // Get consistent tooltip message using the same logic as other components
    const stateMessages = getPipelineStateMessages(requestStatus, statusName)

    // Show optimistic request state while backend still reports steady states
    if (requestStatus === PipelineStatusRequestStatus.RestartRequested) {
      return {
        label: 'Restarting',
        dot: <Loader2 className="animate-spin w-3 h-3 text-warning" />,
        color: 'text-warning',
        tooltip: stateMessages.message,
      }
    }
    if (requestStatus === PipelineStatusRequestStatus.StartRequested) {
      return {
        label: 'Starting',
        dot: <Loader2 className="animate-spin w-3 h-3 text-warning" />,
        color: 'text-warning',
        tooltip: stateMessages.message,
      }
    }
    if (requestStatus === PipelineStatusRequestStatus.StopRequested) {
      return {
        label: 'Stopping',
        dot: <Loader2 className="animate-spin w-3 h-3 text-warning" />,
        color: 'text-warning',
        tooltip: stateMessages.message,
      }
    }

    if (pipelineStatus && typeof pipelineStatus === 'object' && 'name' in pipelineStatus) {
      switch (pipelineStatus.name) {
        case PipelineStatusName.FAILED:
          return {
            label: 'Failed',
            dot: <AlertTriangle className="w-3 h-3 text-destructive-600" />,
            color: 'text-destructive-600',
            tooltip: stateMessages.message,
          }
        case PipelineStatusName.STARTING:
          return {
            label: 'Starting',
            dot: <Loader2 className="animate-spin w-3 h-3 text-warning" />,
            color: 'text-warning',
            tooltip: stateMessages.message,
          }
        case PipelineStatusName.STARTED:
          return {
            label: 'Running',
            dot: <div className="w-2 h-2 bg-brand-600 rounded-full" />,
            color: 'text-brand-600',
            tooltip: stateMessages.message,
          }
        case PipelineStatusName.STOPPED:
          return {
            label: 'Stopped',
            dot: <div className="w-2 h-2 bg-foreground-lighter rounded-full" />,
            color: 'text-foreground-light',
            tooltip: stateMessages.message,
          }
        case PipelineStatusName.UNKNOWN:
          return {
            label: 'Unknown',
            dot: <div className="w-2 h-2 bg-warning-600 rounded-full" />,
            color: 'text-warning',
            tooltip: stateMessages.message,
          }
        default:
          return {
            label: 'Unknown',
            dot: <div className="w-2 h-2 bg-destructive-600 rounded-full" />,
            color: 'text-destructive-600',
            tooltip: stateMessages.message,
          }
      }
    }

    // Fallback for undefined or invalid status
    return {
      label: 'Unknown',
      dot: <div className="w-2 h-2 bg-destructive-600 rounded-full" />,
      color: 'text-destructive-600',
      tooltip: 'Pipeline status is unclear - check logs for details',
    }
  }

  const statusConfig = getStatusConfig()

  const pipelineLogsUrl = pipelineId
    ? `/project/${ref}/logs/etl-replication-logs?f=${encodeURIComponent(
        JSON.stringify({ pipeline_id: pipelineId })
      )}`
    : `/project/${ref}/logs/etl-replication-logs`

  return (
    <>
      {isLoading && <ShimmeringLoader />}
      {isError && (
        <Tooltip>
          <TooltipTrigger>
            <WarningIcon />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="w-64 text-center">
            Unable to retrieve status: {error?.message}
          </TooltipContent>
        </Tooltip>
      )}
      {isSuccess && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-2 text-sm w-min', statusConfig.color)}>
              {statusConfig.dot}
              <span>{statusConfig.label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {statusConfig.tooltip}
            {['unknown', 'failed'].includes(pipelineStatus?.name ?? '') && (
              <>
                {' '}
                Check the <InlineLink href={pipelineLogsUrl}>logs</InlineLink> for more information.
              </>
            )}
          </TooltipContent>
        </Tooltip>
      )}
    </>
  )
}
