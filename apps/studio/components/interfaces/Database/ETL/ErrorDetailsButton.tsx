import { AlertCircle } from 'lucide-react'
import { Button, Popover_Shadcn_, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_ } from 'ui'

interface ErrorDetailsButtonProps {
  reason: string
  solution?: string
}

export const ErrorDetailsButton = ({ reason, solution }: ErrorDetailsButtonProps) => {
  return (
    <Popover_Shadcn_>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          size="tiny"
          type="default"
          className="w-min"
          icon={<AlertCircle />}
          aria-label="Show error details"
        >
          Show Error
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        className="w-[500px] max-w-[90vw]"
        align="start"
        side="bottom"
      >
        <div className="flex flex-col gap-y-4">
          {/* Error message */}
          <div>
            <h4 className="text-sm font-medium mb-2">Error</h4>
            <div className="bg-surface-100 rounded-md p-3 overflow-x-auto">
              <pre className="text-xs font-mono text-foreground-light whitespace-pre-wrap break-words">
                {reason}
              </pre>
            </div>
          </div>

          {/* Solution if available */}
          {solution && (
            <div>
              <h4 className="text-sm font-medium mb-2">Solution</h4>
              <p className="text-xs text-foreground-light">{solution}</p>
            </div>
          )}
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
