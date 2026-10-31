import { type PropsWithChildren } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from 'ui'

interface SSLEnforcementConfirmDialogProps {
  isTargetEnforced: boolean
  isSubmitting: boolean
  onConfirm: () => Promise<void>
  /**
   * Controlled mode for callers whose control can't act as the dialog trigger
   * (e.g. a switch, where a disabled control must never open the dialog).
   * Omit both, and pass `children`, to render the children as the trigger.
   */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const SSLEnforcementConfirmDialog = ({
  isTargetEnforced,
  isSubmitting,
  onConfirm,
  open,
  onOpenChange,
  children,
}: PropsWithChildren<SSLEnforcementConfirmDialogProps>) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {children !== undefined && <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>}
      <AlertDialogContent size="medium">
        <AlertDialogHeader>
          <AlertDialogTitle>Updating SSL enforcement involves a brief downtime</AlertDialogTitle>
          <AlertDialogDescription>
            A database restart is required for SSL enforcement changes to take place, and this
            involves a few minutes of downtime. Confirm to proceed now?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="warning" disabled={isSubmitting} onClick={onConfirm}>
            {isTargetEnforced ? 'Enable SSL' : 'Disable SSL'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
