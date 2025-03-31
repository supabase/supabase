import { Separator } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface DeployEdgeFunctionWarningModalProps {
  visible: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const DeployEdgeFunctionWarningModal = ({
  visible,
  onCancel,
  onConfirm,
}: DeployEdgeFunctionWarningModalProps) => {
  return (
    <ConfirmationModal
      visible={visible}
      size="large"
      title="Confirm before deploying updates"
      confirmLabel="Deploy updates"
      variant="warning"
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <p className="text-sm text-foreground-light">
        Deploying will immediately update your live Edge Function for this project and cannot be
        rolled back automatically.
      </p>
    </ConfirmationModal>
  )
}
