'use client'

import { Button, Modal } from 'ui'
import { ThreadType } from './Threads'
import { deleteThread } from './../../app/actions'
// import { threadId } from 'worker_threads'

const ConfirmDeleteThreadModal = ({
  thread,
  onClose,
  visible,
}: {
  thread: ThreadType
  onClose: () => void
  visible: boolean
}) => {
  // const deleteCurrentThread = () => {
  //   const threadID = thread?.thread_id
  //   onClose()
  //   deleteThread(threadID!)
  // }

  // async function deleteCurrentThread(formData: FormData) {
  //   // 'use server'

  //   const action = formData.get('action') as string
  //   const threadID = formData.get('threadID') as string

  //   if (!threadID) return

  //   if (action === 'delete') {
  //     deleteThread(threadID)
  //   }
  // }

  return (
    <Modal
      variant="danger"
      alignFooter="right"
      size="small"
      visible={visible}
      onCancel={onClose}
      // onConfirm={async () => {
      //   await deleteCurrentThread()
      // }}
      hideFooter
      header="Confirm to delete thread?"
    >
      <form action={() => deleteThread(thread.thread_id)}>
        <Modal.Content className="py-4">
          <p className="text-sm">Once the thread is deleted, it cannot be recovered.</p>
        </Modal.Content>
        <Modal.Content className="py-4">
          <Button>Cancel</Button>
          <Button type="warning" htmlType="submit">
            Delete
          </Button>
        </Modal.Content>
      </form>
    </Modal>
  )
}

export default ConfirmDeleteThreadModal
