import { FC } from 'react'
import { Alert, Button, Modal } from 'ui'

interface Props {
  visible: boolean
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: () => void
}

const ConfirmUpdateInstanceModal: FC<Props> = ({ visible, isSubmitting, onCancel, onConfirm }) => {
  return (
    <Modal
      hideFooter
      visible={visible}
      size="large"
      header="Updating project database instance size"
      onCancel={onCancel}
    >
      <div className="space-y-4 py-4">
        <Modal.Content>
          <Alert
            withIcon
            variant="warning"
            title="Your project will need to be restarted for changes to take place"
          >
            Upon confirmation, your project will be restarted to change your instance size. This
            will take up to 2 minutes in which your project will be unavailable during the time.
          </Alert>
        </Modal.Content>
        <Modal.Content>
          <p className="text-sm text-scale-1200">Would you like to update your project now?</p>
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

export default ConfirmUpdateInstanceModal
