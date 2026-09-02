import {
  Button,
  cn,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'

interface ErrorDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tableName: string
  reason: string
  solution?: string
}

export const ErrorDetailsDialog = ({
  open,
  onOpenChange,
  tableName,
  reason,
  solution,
}: ErrorDetailsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Replication error</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-2">
            <p className="text-sm text-foreground-light">{tableName} stopped replicating:</p>
            {/*
              No `language`: this is an error message reported by the destination, not code, so
              syntax highlighting would colour it at random. The code block is still the right
              frame, since it marks the text as machine output and carries a copy button for
              pasting into a support request.
            */}
            <CodeBlock
              hideLineNumbers
              wrapLines
              wrapLongLines
              value={reason}
              wrapperClassName={cn('[&_pre]:px-3 [&_pre]:py-3')}
              className="[&_code]:text-xs [&_code]:text-foreground [&_span]:text-foreground!"
            />
          </div>
          {solution && <p className="text-sm text-foreground-light">{solution}</p>}
        </DialogSection>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="default">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
