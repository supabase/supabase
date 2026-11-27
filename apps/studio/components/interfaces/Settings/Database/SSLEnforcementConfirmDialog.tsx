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
      <AlertDialogContent size="tiny">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isTargetEnforced ? 'Enforce SSL on connections' : 'Disable SSL enforcement'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isTargetEnforced
              ? 'Enforcing SSL closes existing connections that do not use SSL. Clients must reconnect with SSL. Existing SSL connections stay open.'
              : 'Disabling SSL enforcement allows clients to connect without SSL. Existing connections stay open.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="warning" disabled={isSubmitting} onClick={onConfirm}>
            {isTargetEnforced ? 'Enforce SSL' : 'Disable enforcement'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
