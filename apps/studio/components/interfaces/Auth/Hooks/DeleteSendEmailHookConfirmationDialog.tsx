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

interface DeleteSendEmailHookConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  willLockTemplates?: boolean
}

export const DeleteSendEmailHookConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  willLockTemplates = false,
}: DeleteSendEmailHookConfirmationDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Send Email hook</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>The default email templates will be used to send auth emails.</p>
            {willLockTemplates && (
              <p>Email templates cannot be edited on the Free plan without custom SMTP.</p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete hook
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
