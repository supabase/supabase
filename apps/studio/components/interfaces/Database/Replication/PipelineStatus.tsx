import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { cn } from 'ui'
import { ResponseError } from 'types'
import { Loader2, AlertTriangle, ExternalLink } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Button,
} from 'ui'
import { useParams } from 'common'
import { ReplicationPipelineStatusData } from 'data/replication/pipeline-status-query'

export enum PipelineStatusRequestStatus {
  None = 'None',
  EnableRequested = 'EnableRequested',
  DisableRequested = 'DisableRequested',
}

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
  requestStatus: PipelineStatusRequestStatus
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

  const isLogLoadingState = (failedStatus: FailedStatus): boolean => {
    // Right now we hardcode the error message which is returned when k8s is not able to find logs, which seems
    // to be a transient error. In case we find a way to properly handle this in the backend, this hack will not
    // be needed anymore.
    return (
      failedStatus.message?.startsWith('unable to retrieve container logs for containerd://') ===
      true
    )
  }

  const renderFailedStatus = (failedStatus: FailedStatus) => {
    const isLoadingLogs = isLogLoadingState(failedStatus)
    const { ref: projectRef } = useParams()

    const handleNavigateToLogs = () => {
      if (projectRef) {
        const logsUrl = `/project/${projectRef}/logs/postgres-logs`
        window.open(logsUrl, '_blank')
      }
    }

    return (
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 text-sm text-destructive">
                {isLoadingLogs ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                <span>Failed</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isLoadingLogs
                  ? 'Pipeline failed - logs are being retrieved from container'
                  : 'Pipeline has failed - check the logs section for detailed error information'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button
          type="outline"
          size="tiny"
          icon={<ExternalLink className="w-3 h-3" />}
          onClick={handleNavigateToLogs}
          className="h-auto py-1 px-2 text-xs"
        >
          View Logs
        </Button>
      </div>
    )
  }
  // Map backend statuses to UX-friendly display
  const getStatusConfig = () => {
    if (requestStatus === PipelineStatusRequestStatus.EnableRequested) {
      return {
        label: 'Enabling...',
        dot: <Loader2 className="animate-spin w-3 h-3 text-brand-600" />,
        color: 'text-brand-600',
        tooltip: 'Pipeline is being enabled and will start shortly',
      }
    }

    if (requestStatus === PipelineStatusRequestStatus.DisableRequested) {
      return {
        label: 'Disabling...',
        dot: <Loader2 className="animate-spin w-3 h-3 text-warning-600" />,
        color: 'text-warning-600',
        tooltip: 'Pipeline is being disabled and will stop shortly',
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
            tooltip: 'Pipeline is initializing and will be ready soon',
          }
        case PipelineStatusName.STARTED:
          return {
            label: 'Running',
            dot: <div className="w-2 h-2 bg-brand-600 rounded-full" />,
            color: 'text-brand-600',
            tooltip: 'Pipeline is active and processing data',
          }
        case PipelineStatusName.STOPPED:
          return {
            label: 'Stopped',
            dot: <div className="w-2 h-2 bg-foreground-lighter rounded-full" />,
            color: 'text-foreground-light',
            tooltip: 'Pipeline is not running - enable to start processing',
          }
        case PipelineStatusName.UNKNOWN:
          return {
            label: 'Unknown',
            dot: <div className="w-2 h-2 bg-warning-600 rounded-full" />,
            color: 'text-warning-600',
            tooltip: 'Pipeline status could not be determined',
          }
        default:
          return {
            label: 'Unknown',
            dot: <div className="w-2 h-2 bg-destructive-600 rounded-full" />,
            color: 'text-destructive-600',
            tooltip: 'Pipeline status is unclear - check logs for details',
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
            <div className="relative">{renderFailedStatus(pipelineStatus as FailedStatus)}</div>
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
