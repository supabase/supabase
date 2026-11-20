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

interface SmtpDisableConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  blockEditingOnReset?: boolean
}

export const SmtpDisableConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  blockEditingOnReset = false,
}: SmtpDisableConfirmationDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disable custom SMTP</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Switching back to the built-in SMTP service will{' '}
                <strong className="text-foreground">reset any custom email templates</strong> and{' '}
                <strong className="text-foreground">
                  reduce the email rate limit to 2 emails per hour
                </strong>
                .
              </p>
              {!blockEditingOnReset && (
                <p>
                  You won't be able to edit email templates until you set up custom SMTP again or
                  upgrade your plan.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="warning" onClick={onConfirm}>
            Disable custom SMTP
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
