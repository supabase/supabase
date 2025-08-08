import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface DeployEdgeFunctionWarningModalProps {
  visible: boolean
  onCancel: () => void
  onConfirm: () => void
  isDeploying: boolean
}

export const DeployEdgeFunctionWarningModal = ({
  visible,
  onCancel,
  onConfirm,
  isDeploying,
}: DeployEdgeFunctionWarningModalProps) => {
  return (
    <ConfirmationModal
      visible={visible}
      size="medium"
      title="Confirm deploying updates"
      confirmLabel="Deploy updates"
      confirmLabelLoading="Deploying updates"
      variant="warning"
      loading={isDeploying}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <p className="text-sm text-foreground-light">
        Deploying will immediately update your live Edge Function for this project and cannot be
        rolled back automatically. Are you sure you want to deploy the changes?
      </p>
    </ConfirmationModal>
  )
}
