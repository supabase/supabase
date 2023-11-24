import { Input, Modal } from 'ui'
import { ThreadType } from './Threads'
import { useEffect, useState } from 'react'

const EditThreadModal = ({ thread, onClose }: { thread?: ThreadType; onClose: () => void }) => {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (thread !== undefined) setValue(thread.thread_title)
  }, [thread])

  const updateThread = () => {
    // Logic here
    onClose()
  }

  return (
    <Modal
      alignFooter="right"
      size="medium"
      visible={thread !== undefined}
      onCancel={onClose}
      onConfirm={updateThread}
      header="Edit thread name"
    >
      <Modal.Content className="py-4">
        <Input
          label="Provide a name for your thread"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </Modal.Content>
    </Modal>
  )
}

export default EditThreadModal
