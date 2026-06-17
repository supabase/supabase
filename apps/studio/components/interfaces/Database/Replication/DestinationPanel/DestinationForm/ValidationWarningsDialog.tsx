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
              ? `Create destination with ${warningCount} ${warningCount === 1 ? 'warning' : 'warnings'}?`
              : 'Create destination?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasWarnings
              ? 'Replication can start, but the warnings listed above may affect how some changes are applied downstream. Review them before proceeding.'
              : 'No validation issues were found. Confirm to create the destination and start replication.'}
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
            {hasWarnings ? 'Proceed to create' : 'Create destination'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
