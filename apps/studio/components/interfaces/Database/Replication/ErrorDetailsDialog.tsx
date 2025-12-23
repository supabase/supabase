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
} from 'ui'

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
      <DialogContent size="xlarge" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            Replication error on <code className="text-code-inline">{tableName}</code>
          </DialogTitle>
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
}
