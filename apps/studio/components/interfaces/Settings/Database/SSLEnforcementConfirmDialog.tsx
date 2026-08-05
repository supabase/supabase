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
  targetEnforced: boolean
  isSubmitting: boolean
  onConfirm: () => void
}

export const SSLEnforcementConfirmDialog = ({
  targetEnforced,
  isSubmitting,
  onConfirm,
  children,
}: PropsWithChildren<SSLEnforcementConfirmDialogProps>) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
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
            {targetEnforced ? 'Enable SSL' : 'Disable SSL'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
