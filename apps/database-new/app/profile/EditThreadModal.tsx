'use client'

import { updateThreadName } from '@/app/actions'
import { createRef, useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Button, Input_Shadcn_, Label_Shadcn_, Modal } from 'ui'
import { ThreadType } from './Threads'

const EditThreadModal = ({
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
    message: undefined,
    success: undefined,
    data: {
      thread_id: thread.thread_id,
      thread_title: thread.thread_title,
    },
  }

  const [state, formAction] = useFormState(updateThreadName, initialState)

  useEffect(() => {
    if (state?.success === true) {
      onClose()
      formRef.current?.reset()
      state.success = undefined
    }
  }, [state, onClose, formRef])

  function SubmitButton() {
    const { pending } = useFormStatus()

    return (
      <Button type="secondary" htmlType="submit" aria-disabled={pending} loading={pending}>
        Update thread name
      </Button>
    )
  }

  return (
    <Modal
      alignFooter="right"
      size="medium"
      visible={visible}
      onCancel={onClose}
      hideFooter
      header="Edit thread name"
      className="pb-2"
    >
      <form ref={formRef} action={formAction} key={`${thread.thread_id}-update-thread-title-form`}>
        <Modal.Content className="py-4">
          <Label_Shadcn_ htmlFor="thread_title">Provide a name for your thread</Label_Shadcn_>
          <Input_Shadcn_
            placeholder="Type in a name for the thread..."
            type="text"
            name="thread_title"
            defaultValue={state.data.thread_title}
          />
          <Input_Shadcn_ name="thread_id" value={state.data.thread_id} type="hidden" />
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content className="flex flex-row gap-3 justify-end">
          <Button type="default">Cancel</Button>
          <SubmitButton />
          <p aria-live="polite" className="sr-only" role="status">
            {state?.message}
          </p>
        </Modal.Content>
      </form>
    </Modal>
  )
}

export default EditThreadModal
