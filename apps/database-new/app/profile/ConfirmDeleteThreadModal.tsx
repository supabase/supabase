import { Modal } from 'ui'
import { ThreadType } from './Threads'

const ConfirmDeleteThreadModal = ({
  thread,
  onClose,
}: {
  thread?: ThreadType
  onClose: () => void
}) => {
  const deleteThread = () => {
    // Logic here
    onClose()
  }

  return (
    <Modal
      variant="danger"
      alignFooter="right"
      size="small"
      visible={thread !== undefined}
      onCancel={onClose}
      onConfirm={deleteThread}
      header="Confirm to delete thread?"
    >
      <Modal.Content className="py-4">
        <p className="text-sm">Once the thread is deleted, it cannot be recovered.</p>
      </Modal.Content>
    </Modal>
  )
}

export default ConfirmDeleteThreadModal
