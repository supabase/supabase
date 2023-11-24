'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { Button, Input_Shadcn_, Label_Shadcn_, Modal } from 'ui'
import { updateThreadName } from './../../app/actions'
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
  const initialState = {
    threadName: thread.thread_title,
  }

  const [state, formAction] = useFormState(updateThreadName, {
    threadName: thread.thread_title,
  })

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
      <form action={formAction}>
        <Modal.Content className="py-4">
          <Label_Shadcn_ htmlFor="threadName">Provide a name for your thread</Label_Shadcn_>
          <Input_Shadcn_ type="text" name="threadName" id="threadName" required />
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content className="flex flex-row gap-3 justify-end">
          <Button type="default">Cancel</Button>
          <SubmitButton />
          <p aria-live="polite" className="sr-only">
            {state?.message}
          </p>
        </Modal.Content>
      </form>
    </Modal>
  )
}

export default EditThreadModal
