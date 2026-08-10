import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface DeleteEnvironmentVariableModalProps {
  visible: boolean
  variableName?: string
  loading: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const DeleteEnvironmentVariableModal = ({
  visible,
  variableName,
  loading,
  onCancel,
  onConfirm,
}: DeleteEnvironmentVariableModalProps) => {
  return (
    <ConfirmationModal
      variant="destructive"
      loading={loading}
      visible={visible}
      confirmLabel="Delete variable"
      confirmLabelLoading="Deleting variable"
      title={`Delete variable "${variableName}"`}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <p className="text-sm">
        Ensure none of your edge functions are actively using this variable before deleting it. This
        action cannot be undone.
      </p>
    </ConfirmationModal>
  )
}
