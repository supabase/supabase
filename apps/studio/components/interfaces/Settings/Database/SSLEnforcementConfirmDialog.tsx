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
  isSubmitting: boolean
  onConfirm: () => void
  /**
   * Controlled mode for callers whose control can't act as the dialog trigger
   * (e.g. a switch, where a disabled control must never open the dialog).
   * Omit both, and pass `children`, to render the children as the trigger.
   */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const SSLEnforcementConfirmDialog = ({
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
          <AlertDialogTitle>Enforce SSL on connections?</AlertDialogTitle>
          <AlertDialogDescription>
            Enforcing SSL immediately closes existing connections that don't use SSL. Clients must
            reconnect with SSL. Existing SSL enabled connections are unaffected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="warning" disabled={isSubmitting} onClick={onConfirm}>
            Enforce SSL
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
