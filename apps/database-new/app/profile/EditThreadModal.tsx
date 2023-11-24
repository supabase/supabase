'use client'

// @ts-expect-error
import { useFormState, useFormStatus } from 'react-dom'
import { Button, Input_Shadcn_, Label_Shadcn_, Modal } from 'ui'
import { updateThreadName } from './../../app/actions'
import { ThreadType } from './Threads'
import { useEffect, useState } from 'react'

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
    thread_title: thread.thread_title,
    row_id: thread.id,
  }

  const [threadTitle, setThreadTitle] = useState(thread.thread_title)
  const [state, formAction] = useFormState(updateThreadName, initialState)

  function SubmitButton() {
    const { pending } = useFormStatus()

    return (
      <Button type="secondary" htmlType="submit" aria-disabled={pending} loading={pending}>
        Update thread name
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
      alignFooter="right"
      size="medium"
      visible={visible}
      onCancel={onClose}
      hideFooter
      header="Edit thread name"
      className="pb-2"
    >
      <form action={formAction} key={`${thread.id}-update-thread-title-form`}>
        <Modal.Content className="py-4">
          <Label_Shadcn_ htmlFor="thread_title">Provide a name for your thread</Label_Shadcn_>
          <Input_Shadcn_
            placeholder="Type in a name for the thread..."
            type="text"
            name="thread_title"
            id="thread_title"
            required
            value={threadTitle}
            onChange={(e) => setThreadTitle(e.target.value)}
          />
          <Input_Shadcn_
            name="row_id"
            id="row_id"
            required
            type="hidden"
            className=""
            value={thread.id}
          />
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
