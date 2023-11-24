'use client'

import { Button, Modal } from 'ui'
import { deleteThread } from './../../app/actions'
import { ThreadType } from './Threads'

const ConfirmDeleteThreadModal = ({
  thread,
  onClose,
  visible,
}: {
  thread: ThreadType
  onClose: () => void
  visible: boolean
}) => {
  return (
    <Modal
      size="small"
      visible={visible}
      onCancel={onClose}
      hideFooter
      header="Confirm to delete thread?"
      className="pb-2"
    >
      <form action={() => deleteThread(thread.thread_id)}>
        <Modal.Content className="py-4">
          <p className="text-sm">Once the thread is deleted, it cannot be recovered.</p>
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content className="flex flex-row gap-3 justify-end">
          <Button type="default">Cancel</Button>
          <Button type="warning" htmlType="submit">
            Delete thread
          </Button>
        </Modal.Content>
      </form>
    </Modal>
  )
}

export default ConfirmDeleteThreadModal
