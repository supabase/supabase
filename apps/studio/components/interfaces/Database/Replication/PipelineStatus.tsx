import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { cn } from 'ui'
import { ResponseError } from 'types'
import { Loader2, ChevronDown, ChevronRight, Copy, AlertTriangle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Button,
  Collapsible_Shadcn_ as Collapsible,
  CollapsibleContent_Shadcn_ as CollapsibleContent,
  CollapsibleTrigger_Shadcn_ as CollapsibleTrigger,
} from 'ui'
import { useState, useEffect, useRef } from 'react'
import { copyToClipboard } from 'ui'
import { toast } from 'sonner'
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
  const [isErrorDetailsOpen, setIsErrorDetailsOpen] = useState(false)
  const errorDetailsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (errorDetailsRef.current && !errorDetailsRef.current.contains(event.target as Node)) {
        setIsErrorDetailsOpen(false)
      }
    }

    if (isErrorDetailsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isErrorDetailsOpen])

  const handleCopyToClipboard = async (text: string) => {
    try {
      await copyToClipboard(text)
      toast.success('Error details copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy error details')
    }
  }

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
    const hasDetails =
      failedStatus.message || failedStatus.reason || failedStatus.exit_code !== undefined
    const isLoadingLogs = isLogLoadingState(failedStatus)

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
                  : 'Pipeline has failed - expand for error details'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {hasDetails && (
          <Collapsible open={isErrorDetailsOpen} onOpenChange={setIsErrorDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button type="text" size="tiny" className="h-auto py-0 px-1 text-xs">
                {isErrorDetailsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="absolute z-10 mt-1 left-0 min-w-[400px] max-w-[600px]">
              <div
                ref={errorDetailsRef}
                className="rounded-lg border border-border bg-surface-100 p-3 shadow-md"
              >
                {isLoadingLogs ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-warning-600" />
                    <div>
                      <div className="text-sm font-medium text-foreground mb-1">
                        Pipeline Failed - Loading logs...
                      </div>
                      <div className="text-xs text-foreground-light">
                        Error logs are being retrieved from the container. This may take a few
                        moments.
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        Pipeline Error Details
                      </span>
                      {(failedStatus.message || failedStatus.reason) && (
                        <Button
                          type="text"
                          size="tiny"
                          onClick={async () => {
                            await handleCopyToClipboard(
                              [
                                failedStatus.exit_code !== undefined
                                  ? `Exit Code: ${failedStatus.exit_code}`
                                  : null,
                                failedStatus.reason ? `Reason: ${failedStatus.reason}` : null,
                                failedStatus.message ? `Message: ${failedStatus.message}` : null,
                              ]
                                .filter(Boolean)
                                .join('\n')
                            )
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {failedStatus.exit_code !== undefined && (
                        <div>
                          <span className="text-xs font-medium text-foreground-light">
                            Exit Code:
                          </span>
                          <div className="font-mono text-sm text-foreground mt-1">
                            {failedStatus.exit_code}
                          </div>
                        </div>
                      )}
                      {failedStatus.reason && (
                        <div>
                          <span className="text-xs font-medium text-foreground-light">Reason:</span>
                          <pre className="font-mono text-sm text-foreground whitespace-pre-wrap break-words mt-1 max-h-32 overflow-y-auto">
                            {failedStatus.reason}
                          </pre>
                        </div>
                      )}
                      {failedStatus.message && (
                        <div>
                          <span className="text-xs font-medium text-foreground-light">
                            Message:
                          </span>
                          <pre className="font-mono text-sm text-foreground whitespace-pre-wrap break-words mt-1 max-h-32 overflow-y-auto">
                            {failedStatus.message}
                          </pre>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
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
