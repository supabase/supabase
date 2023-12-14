import { Modal } from 'ui'

import ConfirmationModal from 'components/ui/ConfirmationModal'

interface ApplyConfigModalProps {
  visible: boolean
  onSelectCancel: () => void
  onSelectConfirm: () => void
}

export const ApplyConfigModal = (props: ApplyConfigModalProps) => {
  return (
    <ConfirmationModal
      header="Previously found messages will be lost"
      danger
      buttonLabel="Confirm"
      size="small"
      {...props}
    >
      <Modal.Content>
        <div className="py-4">
          <p className="text-sm text-foreground"></p>
          <p className="text-sm text-foreground-light">
            The realtime inspector will clear currently collected messages and start listening for
            new messages matching the updated filters.
          </p>
        </div>
      </Modal.Content>
    </ConfirmationModal>
  )
}
