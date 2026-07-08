import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'ui'

interface ValidationWarningsDialogProps {
  open: boolean
  isLoading: boolean
  warningCount: number
  onOpenChange: (value: boolean) => void
  onConfirm: () => void
}

export const ValidationWarningsDialog = ({
  open,
  isLoading,
  warningCount,
  onOpenChange,
  onConfirm,
}: ValidationWarningsDialogProps) => {
  const hasWarnings = warningCount > 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasWarnings
              ? `Create and start pipeline with ${warningCount} ${warningCount === 1 ? 'warning' : 'warnings'}?`
              : 'Create and start pipeline?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasWarnings
              ? 'Replication can start, but the warnings listed above may affect how some changes are applied downstream. Review them before proceeding.'
              : 'No validation issues were found. Confirm to create the pipeline and start replication to the destination.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={hasWarnings ? 'warning' : 'primary'}
            disabled={isLoading}
            loading={isLoading}
            onClick={onConfirm}
          >
            {hasWarnings ? 'Create and start pipeline anyway' : 'Create and start pipeline'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
