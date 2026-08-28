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

import { START_PIPELINE_ANYWAY_LABEL, START_PIPELINE_LABEL } from './DestinationForm.constants'

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
              ? `${START_PIPELINE_LABEL} with ${warningCount} ${warningCount === 1 ? 'warning' : 'warnings'}?`
              : `${START_PIPELINE_LABEL}?`}
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
            {hasWarnings ? START_PIPELINE_ANYWAY_LABEL : START_PIPELINE_LABEL}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
