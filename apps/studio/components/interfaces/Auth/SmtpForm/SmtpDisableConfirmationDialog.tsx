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
}

export const SmtpDisableConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: SmtpDisableConfirmationDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disable custom SMTP</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Switching back to the built-in SMTP service will{' '}
              <strong className="text-foreground">reset any custom email templates</strong> and{' '}
              <strong className="text-foreground">
                reduce the email rate limit to 2 emails per hour
              </strong>
              .
            </p>
            <p>
              You won't be able to edit email templates until you set up custom SMTP again or
              upgrade your plan.
            </p>
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
