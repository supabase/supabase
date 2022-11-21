import { FC } from 'react'
import { Alert, Button, Modal } from 'ui'

interface Props {
  visible: boolean
  isSubmitting: boolean
  isChangingInstanceSize: boolean
  isDisablingPITR: boolean
  onCancel: () => void
  onConfirm: () => void
}

const warnings = {
  changingInstanceSize: {},
}

const ConfirmPaymentModal: FC<Props> = ({
  visible,
  isSubmitting,
  isChangingInstanceSize,
  isDisablingPITR,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal
      hideFooter
      visible={visible}
      size="large"
      header="Confirm changes to your project's subscription"
      onCancel={onCancel}
    >
      <div className="space-y-4 py-4">
        <Modal.Content>
          <div className="space-y-2">
            {isChangingInstanceSize && (
              <Alert
                withIcon
                variant="warning"
                title="Your project will need to be restarted for size changes to take place"
              >
                Upon confirmation, your project will be restarted to change your instance size. This
                will take up to 2 minutes in which your project will be unavailable during the time.
              </Alert>
            )}
            {isDisablingPITR && (
              <Alert
                withIcon
                variant="warning"
                title="All available PITR back ups for your project will be removed and are non-recoverable"
              >
                As such, your project will not have past PITR backups if you were to re-enable PITR
                for your project.
              </Alert>
            )}
          </div>
        </Modal.Content>
        <Modal.Content>
          <p className="text-sm text-scale-1200">
            Confirm the changes to your project's subscription?
          </p>
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

export default ConfirmPaymentModal
