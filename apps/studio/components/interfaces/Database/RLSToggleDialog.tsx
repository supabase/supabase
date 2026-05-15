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

interface RLSToggleDialogProps {
  open: boolean
  tableName?: string
  isEnabled: boolean
  isSubmitting?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
}

export function RLSToggleDialog({
  open,
  isEnabled,
  isSubmitting = false,
  onOpenChange,
  onConfirm,
}: RLSToggleDialogProps) {
  const title = isEnabled ? 'Disable Row Level Security?' : 'Enable Row Level Security?'
  const description = isEnabled
    ? 'Without RLS, clients using anon or authenticated keys may be able to read, modify, or delete rows in this table.'
    : 'RLS restricts table access until matching policies allow a request. Existing queries may return no rows until policies are added.'
  const confirmLabel = isEnabled ? 'Disable RLS' : 'Enable RLS'
  const confirmVariant = isEnabled ? 'danger' : 'warning'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={confirmVariant}
            loading={isSubmitting}
            onClick={() => onConfirm()}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
