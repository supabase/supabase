'use client'

import { Button, Input, Modal } from 'ui'
import { updateThreadName } from './../../app/actions'
import { ThreadType } from './Threads'
import { useState } from 'react'

const EditThreadModal = ({
  thread,
  onClose,
  visible,
}: {
  thread: ThreadType
  onClose: () => void
  visible: boolean
}) => {
  const [value, setValue] = useState(thread.thread_title)

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
      <form
        action={(formData: FormData) => {
          const threadNameEntry: FormDataEntryValue | null = formData.get('threadName')

          // Check if threadNameEntry is not null and is of type string
          if (threadNameEntry !== null && typeof threadNameEntry === 'string') {
            const threadName: string = threadNameEntry
            updateThreadName(thread.id, threadName)
          }
        }}
      >
        <Modal.Content className="py-4">
          <Input
            label="Provide a name for your thread"
            value={value}
            name="threadName"
            onChange={(e) => setValue(e.target.value)}
          />
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content className="flex flex-row gap-3 justify-end">
          <Button type="default">Cancel</Button>
          <Button type="secondary" htmlType="submit">
            Update thread name
          </Button>
        </Modal.Content>
      </form>
    </Modal>
  )
}

export default EditThreadModal
