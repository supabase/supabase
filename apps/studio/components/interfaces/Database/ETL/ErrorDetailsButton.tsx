import { AlertCircle } from 'lucide-react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface ErrorDetailsButtonProps {
  reason: string
  solution?: string
}

export const ErrorDetailsButton = ({ reason, solution }: ErrorDetailsButtonProps) => {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Button
          size="tiny"
          type="default"
          className="w-min"
          icon={<AlertCircle size={14} />}
          aria-label="Show error details"
        >
          Show Error
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start" className="w-[500px] max-w-[90vw] max-h-[400px] p-0 overflow-hidden">
        <div className="flex flex-col gap-y-3 p-4 max-h-[400px] overflow-y-auto">
          {/* Error message */}
          <div>
            <div className="text-xs font-medium mb-2">Error</div>
            <div className="bg-surface-100 rounded p-2 max-h-[250px] overflow-y-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words">{reason}</pre>
            </div>
          </div>

          {/* Solution if available */}
          {solution && (
            <div>
              <div className="text-xs font-medium mb-2">Solution</div>
              <p className="text-xs">{solution}</p>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
