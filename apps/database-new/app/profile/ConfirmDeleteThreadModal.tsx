import { Modal } from 'ui'
import { ThreadType } from './Threads'
import { deleteThread } from '@/lib/actions'

const ConfirmDeleteThreadModal = ({
  thread,
  onClose,
}: {
  thread?: ThreadType
  onClose: () => void
}) => {
  const deleteCurrentThread = () => {
    const threadID = thread?.thread_id
    onClose()
    deleteThread(threadID!)
  }

  return (
    <Modal
      variant="danger"
      alignFooter="right"
      size="small"
      visible={thread !== undefined}
      onCancel={onClose}
      onConfirm={async () => {
        await deleteCurrentThread()
      }}
      header="Confirm to delete thread?"
    >
      <Modal.Content className="py-4">
        <p className="text-sm">Once the thread is deleted, it cannot be recovered.</p>
      </Modal.Content>
    </Modal>
  )
}

export default ConfirmDeleteThreadModal
