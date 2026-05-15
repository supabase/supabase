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

import { InlineLink } from '@/components/ui/InlineLink'
import { DOCS_URL } from '@/lib/constants'

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
  const title = isEnabled ? 'Disable Row Level Security' : 'Enable Row Level Security'
  const description = isEnabled
    ? 'This table will become publicly readable and writable. Anyone can view, add, update, or delete data in this table, and existing RLS policies will no longer apply.'
    : 'RLS restricts table access until policies allow a request. Existing queries may stop returning rows until policies are added.'
  const confirmLabel = isEnabled ? 'Disable RLS' : 'Enable RLS'
  const confirmVariant = isEnabled ? 'danger' : 'primary'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}{' '}
            <InlineLink href={`${DOCS_URL}/guides/database/postgres/row-level-security`}>
              Learn more
            </InlineLink>
            .
          </AlertDialogDescription>
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
