import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

interface EnableVersioningConfirmationModalProps {
  visible: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const EnableVersioningConfirmationModal = ({
  visible,
  loading = false,
  onConfirm,
  onCancel,
}: EnableVersioningConfirmationModalProps) => (
  <ConfirmationModal
    variant="warning"
    visible={visible}
    loading={loading}
    title="Confirm to enable object versioning"
    confirmLabel="Enable versioning"
    confirmLabelLoading="Enabling versioning..."
    onCancel={onCancel}
    onConfirm={onConfirm}
    alert={{
      title: 'Storage object versioning is in public alpha',
      description: (
        <p className="text-pretty">
          The behavior of this feature may change during development and is not recommended
          production use.
        </p>
      ),
    }}
  >
    <p className="text-sm text-foreground-light">
      Retained versions count toward Storage usage and may increase your bill.
    </p>
  </ConfirmationModal>
)
