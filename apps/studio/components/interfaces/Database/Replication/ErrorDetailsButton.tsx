import { AlertCircle } from 'lucide-react'
import {
  Button,
  cn,
  CodeBlock,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

interface ErrorDetailsButtonProps {
  tableName: string
  reason: string
  solution?: string
}

export const ErrorDetailsButton = ({ tableName, reason, solution }: ErrorDetailsButtonProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="tiny" type="default" className="w-min" aria-label="Show error details">
          Show error
        </Button>
      </DialogTrigger>
      <DialogContent size="xlarge" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Replication error on "{tableName}"</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="!p-0">
          <div className="px-4 py-3">
            <p className="text-sm text-foreground-light">
              The following error occurred during replication:
            </p>
          </div>
          <CodeBlock
            hideLineNumbers
            wrapLines={false}
            wrapperClassName={cn(
              '[&_pre]:px-4 [&_pre]:py-3 [&>pre]:border-x-0 [&>pre]:rounded-none'
            )}
            language="bash"
            value={reason}
            className="[&_code]:text-xs [&_code]:text-foreground [&_span]:!text-foreground"
          />
          {/* Solution if available */}
          {solution && (
            <div className="px-4 py-3">
              <p className="text-sm">{solution}</p>
            </div>
          )}
        </DialogSection>
        <DialogFooter>
          <DialogClose>
            <Button type="default">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

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
      <TooltipContent
        side="bottom"
        align="start"
        className="w-[500px] max-w-[90vw] max-h-[400px] p-0 overflow-hidden"
      >
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
