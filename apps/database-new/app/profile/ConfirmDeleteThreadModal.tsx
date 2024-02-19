'use client'

import { deleteThread } from '@/app/actions'
import { createRef, useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Button, Input_Shadcn_, Modal } from 'ui'
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
  const formRef = createRef<HTMLFormElement>()

  const initialState = {
    message: '',
    success: false,
    data: {
      thread_id: thread.thread_id,
    },
  }

  const [state, formAction] = useFormState(deleteThread, initialState)

  useEffect(() => {
    if (state?.success === true) {
      onClose()
      formRef.current?.reset()
      state.success = false
    }
  }, [state, onClose, formRef])

  useEffect(() => {
    if (state?.success === true) {
      onClose()
      formRef.current?.reset()
      state.success = false
    }
  }, [state, onClose, formRef])

  function SubmitButton() {
    const { pending } = useFormStatus()

    return (
      <Button type="warning" htmlType="submit" aria-disabled={pending} loading={pending}>
        Delete thread
      </Button>
    )
  }

  return (
    <Modal
      size="small"
      visible={visible}
      onCancel={onClose}
      hideFooter
      header="Confirm to delete thread?"
      className="pb-2"
    >
      <form action={formAction} key={`${thread.thread_id}-delete-thread-form`}>
        <Modal.Content className="py-4">
          <p className="text-sm">Once the thread is deleted, it cannot be recovered.</p>
        </Modal.Content>
        <Modal.Separator />
        <Input_Shadcn_ name="thread_id" value={state.data.thread_id} type="hidden" />
        <Modal.Content className="flex flex-row gap-3 justify-end">
          <Button type="default">Cancel</Button>
          <SubmitButton />
        </Modal.Content>
      </form>
    </Modal>
  )
}

export default ConfirmDeleteThreadModal
