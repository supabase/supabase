import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { cn } from 'ui'
import { ResponseError } from 'types'
import { Loader2, ChevronDown, ChevronRight, Copy, AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Button, Collapsible_Shadcn_ as Collapsible, CollapsibleContent_Shadcn_ as CollapsibleContent, CollapsibleTrigger_Shadcn_ as CollapsibleTrigger } from 'ui'
import { useState } from 'react'
import { toast } from 'sonner'

export enum PipelineStatusRequestStatus {
  None = 'None',
  EnableRequested = 'EnableRequested',
  DisableRequested = 'DisableRequested',
}

interface FailedStatus {
  name: 'failed'
  exit_code?: number
  message?: string
  reason?: string
}

interface RegularStatus {
  name: string
}

type PipelineStatusType = RegularStatus | FailedStatus

interface PipelineStatusProps {
  pipelineStatus: PipelineStatusType | undefined
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const isFailedStatus = (status: PipelineStatusType | undefined): status is FailedStatus => {
    return status !== null && status !== undefined && typeof status === 'object' && status.name === 'failed'
  }

  const renderFailedStatus = (failedStatus: FailedStatus) => {
    const hasDetails = failedStatus.message || failedStatus.reason || failedStatus.exit_code !== undefined
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="w-3 h-3" />
          <span>Failed</span>
        </div>
        {hasDetails && (
          <Collapsible open={isErrorDetailsOpen} onOpenChange={setIsErrorDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="text"
                size="tiny"
                className="h-auto py-0 px-1 text-xs"
              >
                {isErrorDetailsOpen ? (
                  <ChevronDown size={12} />
                ) : (
                  <ChevronRight size={12} />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="absolute z-10 mt-1 left-0 min-w-[400px] max-w-[600px]">
              <div className="rounded-lg border border-border bg-surface-100 p-3 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Pipeline Error Details</span>
                  {(failedStatus.message || failedStatus.reason) && (
                    <Button
                      type="text"
                      size="tiny"
                      onClick={() => copyToClipboard(
                        [
                          failedStatus.exit_code !== undefined ? `Exit Code: ${failedStatus.exit_code}` : null,
                          failedStatus.reason ? `Reason: ${failedStatus.reason}` : null,
                          failedStatus.message ? `Message: ${failedStatus.message}` : null,
                        ].filter(Boolean).join('\n')
                      )}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {failedStatus.exit_code !== undefined && (
                    <div>
                      <span className="text-xs font-medium text-foreground-light">Exit Code:</span>
                      <div className="font-mono text-sm text-foreground mt-1">{failedStatus.exit_code}</div>
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
                      <span className="text-xs font-medium text-foreground-light">Message:</span>
                      <pre className="font-mono text-sm text-foreground whitespace-pre-wrap break-words mt-1 max-h-32 overflow-y-auto">
                        {failedStatus.message}
                      </pre>
                    </div>
                  )}
                </div>
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
        tooltip: 'Pipeline has failed - expand for error details',
      }
    }

    if (pipelineStatus && typeof pipelineStatus === 'object' && 'name' in pipelineStatus) {
      switch (pipelineStatus.name) {
        case 'starting':
          return {
            label: 'Starting',
            dot: <Loader2 className="animate-spin w-3 h-3 text-warning-600" />,
            color: 'text-warning-600',
            tooltip: 'Pipeline is initializing and will be ready soon',
          }
        case 'started':
          return {
            label: 'Running',
            dot: <div className="w-2 h-2 bg-brand-600 rounded-full" />,
            color: 'text-brand-600',
            tooltip: 'Pipeline is active and processing data',
          }
        case 'stopped':
          return {
            label: 'Stopped',
            dot: <div className="w-2 h-2 bg-foreground-lighter rounded-full" />,
            color: 'text-foreground-light',
            tooltip: 'Pipeline is not running - enable to start processing',
          }
        case 'unknown':
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
            <div className="relative">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>{renderFailedStatus(pipelineStatus as FailedStatus)}</div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{statusConfig.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
