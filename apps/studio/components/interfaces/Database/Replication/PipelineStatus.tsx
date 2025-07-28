import AlertError from 'components/ui/AlertError'
import { ReplicationPipelineStatusData } from 'data/replication/pipeline-status-query'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { PipelineStatusRequestStatus } from 'state/replication-pipeline-request-status'
import { ResponseError } from 'types'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { getPipelineStateMessages, PIPELINE_ERROR_MESSAGES } from './Pipeline.utils'

export enum PipelineStatusName {
  FAILED = 'failed',
  STARTING = 'starting',
  STARTED = 'started',
  STOPPED = 'stopped',
  UNKNOWN = 'unknown',
}

// Type alias for better readability
type FailedStatus = Extract<ReplicationPipelineStatusData['status'], { name: 'failed' }>

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
  const isFailedStatus = (
    status: ReplicationPipelineStatusData['status'] | undefined
  ): status is FailedStatus => {
    return (
      status !== null &&
      status !== undefined &&
      typeof status === 'object' &&
      status.name === PipelineStatusName.FAILED
    )
  }

  const renderFailedStatus = () => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="w-3 h-3" />
            <span>Failed</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {getPipelineStateMessages(requestStatus, 'failed').message}
        </TooltipContent>
      </Tooltip>
    )
  }
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

    // Handle Failed status object
    if (isFailedStatus(pipelineStatus)) {
      return {
        isFailedStatus: true,
      }
    }

    if (pipelineStatus && typeof pipelineStatus === 'object' && 'name' in pipelineStatus) {
      switch (pipelineStatus.name) {
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
        <AlertError error={error} subject={PIPELINE_ERROR_MESSAGES.RETRIEVE_PIPELINE_STATUS} />
      )}
      {isSuccess && (
        <>
          {statusConfig.isFailedStatus ? (
            <div className="relative">{renderFailedStatus()}</div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn('flex items-center gap-2 text-sm w-min', statusConfig.color)}>
                  {statusConfig.dot}
                  <span>{statusConfig.label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">{statusConfig.tooltip}</TooltipContent>
            </Tooltip>
          )}
        </>
      )}
    </>
  )
}
