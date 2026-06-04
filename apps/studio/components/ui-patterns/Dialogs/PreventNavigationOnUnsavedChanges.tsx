import {
  DiscardChangesConfirmationDialog,
  type DiscardChangesConfirmationDialogProps,
} from './DiscardChangesConfirmationDialog'
import { usePreventNavigationOnUnsavedChanges } from '@/hooks/ui/usePreventNavigationOnUnsavedChanges'

export const PreventNavigationOnUnsavedChanges = ({
  hasChanges,
  ...props
}: { hasChanges: boolean } & Omit<
  DiscardChangesConfirmationDialogProps,
  'visible' | 'onClose' | 'onCancel'
>) => {
  const { handleCancel, handleConfirm, shouldConfirm } = usePreventNavigationOnUnsavedChanges({
    hasChanges,
  })

  return (
    <DiscardChangesConfirmationDialog
      visible={shouldConfirm}
      onCancel={handleCancel}
      onClose={handleConfirm}
      {...props}
    />
  )
}
