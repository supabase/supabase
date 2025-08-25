import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { ReplicationPipelineStatusData } from 'data/replication/pipeline-status-query'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { PipelineStatusRequestStatus } from 'state/replication-pipeline-request-status'
import { ResponseError } from 'types'
import { cn, Tooltip, TooltipContent, TooltipTrigger, WarningIcon } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { getPipelineStateMessages } from './Pipeline.utils'

export enum PipelineStatusName {
  FAILED = 'failed',
  STARTING = 'starting',
  STARTED = 'started',
  STOPPED = 'stopped',
  UNKNOWN = 'unknown',
}

interface PipelineStatusProps {
  pipelineStatus: ReplicationPipelineStatusData['status'] | undefined
  error: ResponseError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  requestStatus?: PipelineStatusRequestStatus
}

export const PipelineStatus = ({
  pipelineStatus,
  error,
  isLoading,
  isError,
  isSuccess,
  requestStatus,
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

    if (requestStatus === PipelineStatusRequestStatus.EnableRequested) {
      return {
        label: 'Enabling...',
        dot: <Loader2 className="animate-spin w-3 h-3 text-brand-600" />,
        color: 'text-brand-600',
        tooltip: stateMessages.message,
      }
    }

    if (requestStatus === PipelineStatusRequestStatus.DisableRequested) {
      return {
        label: 'Disabling...',
        dot: <Loader2 className="animate-spin w-3 h-3 text-warning-600" />,
        color: 'text-warning-600',
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
            dot: <Loader2 className="animate-spin w-3 h-3 text-warning-600" />,
            color: 'text-warning-600',
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
            color: 'text-warning-600',
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
                Check the{' '}
                <InlineLink href={`/project/${ref}/logs/etl-replication-logs`}>logs</InlineLink> for
                more information.
              </>
            )}
          </TooltipContent>
        </Tooltip>
      )}
    </>
  )
}
