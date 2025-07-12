import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { cn } from 'ui'
import { ResponseError } from 'types'
import { Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'ui'

export enum PipelineStatusRequestStatus {
  None = 'None',
  EnableRequested = 'EnableRequested',
  DisableRequested = 'DisableRequested',
}

interface PipelineStatusProps {
  pipelineStatus: string | undefined
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

    switch (pipelineStatus) {
      case 'Starting':
        return {
          label: 'Starting',
          dot: <Loader2 className="animate-spin w-3 h-3 text-warning-600" />,
          color: 'text-warning-600',
          tooltip: 'Pipeline is initializing and will be ready soon',
        }
      case 'Started':
        return {
          label: 'Running',
          dot: <div className="w-2 h-2 bg-brand-600 rounded-full" />,
          color: 'text-brand-600',
          tooltip: 'Pipeline is active and processing data',
        }
      case 'Stopped':
        return {
          label: 'Stopped',
          dot: <div className="w-2 h-2 bg-foreground-lighter rounded-full" />,
          color: 'text-foreground-light',
          tooltip: 'Pipeline is not running - enable to start processing',
        }
      case 'Unknown':
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

  const statusConfig = getStatusConfig()

  return (
    <>
      {isLoading && <ShimmeringLoader></ShimmeringLoader>}
      {isError && <AlertError error={error} subject="Failed to retrieve pipeline status" />}
      {isSuccess && (
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
  )
}

export default PipelineStatus
