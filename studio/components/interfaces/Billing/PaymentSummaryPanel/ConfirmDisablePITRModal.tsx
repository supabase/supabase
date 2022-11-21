import { FC } from 'react'
import { Alert, Button, Modal } from 'ui'

interface Props {
  visible: boolean
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: () => void
}

const ConfirmDisablePITRModal: FC<Props> = ({ visible, isSubmitting, onCancel, onConfirm }) => {
  return (
    <Modal
      hideFooter
      visible={visible}
      size="large"
      header="Disabling point in time recovery"
      onCancel={onCancel}
    >
      <div className="space-y-4 py-4">
        <Modal.Content>
          <Alert
            withIcon
            variant="warning"
            title="All available PITR back ups for your project will be removed and are non-recoverable"
          >
            As such, your project will not have past PITR backups if you were to re-enable PITR for
            your project.
          </Alert>
        </Modal.Content>
        <Modal.Content>
          <p className="text-sm text-scale-1200">Confirm to disable PITR for your project?</p>
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content>
          <div className="flex items-center gap-2">
            <Button block type="default" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              block
              type="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
              onClick={onConfirm}
            >
              Confirm
            </Button>
          </div>
        </Modal.Content>
      </div>
    </Modal>
  )
}

export default ConfirmDisablePITRModal
