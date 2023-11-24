'use client'

import { useEffect } from 'react'
// @ts-expect-error
import { useFormState, useFormStatus } from 'react-dom'
import { Button, Input_Shadcn_, Modal } from 'ui'
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
  const [state, formAction] = useFormState(deleteThread, { thread_id: thread.thread_id })

  function SubmitButton() {
    const { pending } = useFormStatus()

    return (
      <Button type="warning" htmlType="submit" aria-disabled={pending} loading={pending}>
        Delete thread
      </Button>
    )
  }

  useEffect(() => {
    if (state?.success) {
      onClose()
    }
  }, [state?.success, onClose])

  return (
    <Modal
      size="small"
      visible={visible}
      onCancel={onClose}
      hideFooter
      header="Confirm to delete thread?"
      className="pb-2"
    >
      <form action={formAction}>
        <Modal.Content className="py-4">
          <p className="text-sm">Once the thread is deleted, it cannot be recovered.</p>
        </Modal.Content>
        <Modal.Separator />
        <Input_Shadcn_
          name="thread_id"
          id="thread_id"
          required
          type="hidden"
          value={thread.thread_id}
        />
        <Modal.Content className="flex flex-row gap-3 justify-end">
          <Button type="default">Cancel</Button>
          <SubmitButton />
        </Modal.Content>
      </form>
    </Modal>
  )
}

export default ConfirmDeleteThreadModal
