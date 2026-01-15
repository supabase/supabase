import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface DeployEdgeFunctionWarningModalProps {
  visible: boolean
  onCancel: () => void
  onConfirm: () => void
  isDeploying: boolean
  unimportedFiles: string[]
}

export const DeployEdgeFunctionWarningModal = ({
  visible,
  onCancel,
  onConfirm,
  isDeploying,
  unimportedFiles,
}: DeployEdgeFunctionWarningModalProps) => {
  return (
    <ConfirmationModal
      visible={visible}
      size="medium"
      title="Confirm to deploy updates"
      confirmLabel="Deploy updates"
      confirmLabelLoading="Deploying updates"
      variant="warning"
      loading={isDeploying}
      onCancel={onCancel}
      onConfirm={onConfirm}
      alert={
        unimportedFiles.length > 0
          ? {
              title: 'Unimported files will not be deployed or saved',
              description: (
                <>
                  Ensure that all files are imported through{' '}
                  <code className="text-code-inline">index.ts</code>
                </>
              ),
            }
          : undefined
      }
    >
      <p className="text-sm text-foreground-light">
        Deploying will immediately update your live Edge Function for this project and cannot be
        rolled back automatically. Are you sure you want to deploy the changes?
      </p>
    </ConfirmationModal>
  )
}
