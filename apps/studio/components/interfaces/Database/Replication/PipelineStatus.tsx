import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { cn } from 'ui'
import { ResponseError } from 'types'
import { Loader2, Play, Square, AlertTriangle, HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'ui'

interface PipelineStatusProps {
  pipelineStatus: string | undefined
  error: ResponseError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  requestStatus: 'None' | 'EnableRequested' | 'DisableRequested'
}

const PipelineStatus = ({
  pipelineStatus,
  error,
  isLoading,
  isError,
  isSuccess,
  requestStatus,
}: PipelineStatusProps) => {
  const requestInFlight = requestStatus !== 'None'
  
  // Map backend statuses to UX-friendly display
  const getStatusConfig = () => {
    if (requestStatus === 'EnableRequested') {
      return {
        label: 'Starting...',
        icon: <Loader2 className="animate-spin w-4 h-4" />,
        color: 'text-foreground-light',
        bgColor: 'bg-surface-200',
        tooltip: 'Pipeline is being enabled and will start shortly'
      }
    }
    
    if (requestStatus === 'DisableRequested') {
      return {
        label: 'Stopping...',
        icon: <Loader2 className="animate-spin w-4 h-4" />,
        color: 'text-foreground-light',
        bgColor: 'bg-surface-200',
        tooltip: 'Pipeline is being disabled and will stop shortly'
      }
    }
    
    switch (pipelineStatus) {
      case 'Starting':
        return {
          label: 'Starting',
          icon: <Loader2 className="animate-spin w-4 h-4 text-amber-500" />,
          color: 'text-amber-700',
          bgColor: 'bg-amber-100',
          tooltip: 'Pipeline is initializing and will be ready soon'
        }
      case 'Started':
        return {
          label: 'Running',
          icon: <Play className="w-4 h-4 text-green-600" />,
          color: 'text-green-700',
          bgColor: 'bg-green-100',
          tooltip: 'Pipeline is active and processing data'
        }
      case 'Stopped':
        return {
          label: 'Stopped',
          icon: <Square className="w-4 h-4 text-gray-500" />,
          color: 'text-gray-700',
          bgColor: 'bg-gray-100',
          tooltip: 'Pipeline is not running - enable to start processing'
        }
      case 'Unknown':
        return {
          label: 'Unknown',
          icon: <HelpCircle className="w-4 h-4 text-orange-500" />,
          color: 'text-orange-700',
          bgColor: 'bg-orange-100',
          tooltip: 'Pipeline status could not be determined'
        }
      default:
        return {
          label: 'Unknown',
          icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
          color: 'text-red-700',
          bgColor: 'bg-red-100',
          tooltip: 'Pipeline status is unclear - check logs for details'
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
              <div className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                statusConfig.bgColor,
                statusConfig.color
              )}>
                {statusConfig.icon}
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
