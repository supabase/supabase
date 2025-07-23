import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { cn } from 'ui'
import { ResponseError } from 'types'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'ui'
import { ReplicationPipelineStatusData } from 'data/replication/pipeline-status-query'
import { PipelineStatusRequestStatus } from 'state/replication-pipeline-request-status'

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

const PipelineStatus = ({
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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="w-3 h-3" />
              <span>Failed</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Replication has encountered an error. Check the logs for details.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  // Map backend statuses to UX-friendly display
  const getStatusConfig = () => {
    if (requestStatus === PipelineStatusRequestStatus.EnableRequested) {
      return {
        label: 'Enabling...',
        dot: <Loader2 className="animate-spin w-3 h-3 text-brand-600" />,
        color: 'text-brand-600',
        tooltip: 'Starting the pipeline. Table replication will resume once enabled.',
      }
    }

    if (requestStatus === PipelineStatusRequestStatus.DisableRequested) {
      return {
        label: 'Disabling...',
        dot: <Loader2 className="animate-spin w-3 h-3 text-warning-600" />,
        color: 'text-warning-600',
        tooltip: 'Stopping the pipeline. Table replication will be paused once disabled.',
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
            tooltip: 'Initializing replication. Table status will be available once running.',
          }
        case PipelineStatusName.STARTED:
          return {
            label: 'Running',
            dot: <div className="w-2 h-2 bg-brand-600 rounded-full" />,
            color: 'text-brand-600',
            tooltip: 'Replication is active and processing data',
          }
        case PipelineStatusName.STOPPED:
          return {
            label: 'Stopped',
            dot: <div className="w-2 h-2 bg-foreground-lighter rounded-full" />,
            color: 'text-foreground-light',
            tooltip: 'Replication is paused. Enable the pipeline to resume data synchronization.',
          }
        case PipelineStatusName.UNKNOWN:
          return {
            label: 'Unknown',
            dot: <div className="w-2 h-2 bg-warning-600 rounded-full" />,
            color: 'text-warning-600',
            tooltip: 'Unable to determine replication status. Check the logs for more information.',
          }
        default:
          return {
            label: 'Unknown',
            dot: <div className="w-2 h-2 bg-destructive-600 rounded-full" />,
            color: 'text-destructive-600',
            tooltip: 'Unable to determine replication status. Check the logs for more information.',
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
      {isLoading && <ShimmeringLoader></ShimmeringLoader>}
      {isError && <AlertError error={error} subject="Failed to retrieve pipeline status" />}
      {isSuccess && (
        <>
          {statusConfig.isFailedStatus ? (
            <div className="relative">{renderFailedStatus()}</div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn('flex items-center gap-2 text-sm', statusConfig.color)}>
                    {statusConfig.dot}
                    <span>{statusConfig.label}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{statusConfig.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </>
      )}
    </>
  )
}

export default PipelineStatus
