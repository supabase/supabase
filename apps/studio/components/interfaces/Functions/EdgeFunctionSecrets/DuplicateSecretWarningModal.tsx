import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface DuplicateSecretWarningModalProps {
  visible: boolean
  onCancel: () => void
  onConfirm: () => void
  isCreating: boolean
  secretName: string
}

export const DuplicateSecretWarningModal = ({
  visible,
  onCancel,
  onConfirm,
  isCreating,
  secretName,
}: DuplicateSecretWarningModalProps) => {
  return (
    <ConfirmationModal
      visible={visible}
      size="medium"
      title="Confirm replacing existing secret"
      confirmLabel="Replace secret"
      confirmLabelLoading="Replacing secret"
      variant="warning"
      loading={isCreating}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <p className="text-sm text-foreground-light">
        A secret with the name "{secretName}" already exists. Continuing will replace the existing
        secret with the new value. This action cannot be undone. Are you sure you want to proceed?
      </p>
    </ConfirmationModal>
  )
}
