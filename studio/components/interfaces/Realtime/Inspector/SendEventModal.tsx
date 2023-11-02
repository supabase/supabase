import { Input, Modal } from 'ui'

import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useEffect, useState } from 'react'

interface SendMessageModalProps {
  visible: boolean
  onSelectCancel: () => void
  onSelectConfirm: (v: { message: string; payload: string }) => void
}

export const SendMessageModal = (props: SendMessageModalProps) => {
  const [values, setValues] = useState({ message: 'test', payload: '{}' })

  useEffect(() => {
    if (props.visible) {
      setValues({ message: 'test', payload: '{}' })
    }
  }, [props.visible])

  return (
    <ConfirmationModal
      header="Broadcast a message to all clients"
      buttonLabel="Send"
      size="medium"
      {...props}
      onSelectConfirm={() => props.onSelectConfirm(values)}
    >
      <Modal.Content>
        <div className="py-4 flex  flex-col gap-y-4">
          <Input
            label="Message name"
            size="small"
            className="flex-grow"
            value={values.message}
            onChange={(v) => setValues({ ...values, message: v.target.value })}
          />

          <Input
            label="Message payload"
            size="small"
            className="flex-grow"
            value={values.payload}
            onChange={(v) => setValues({ ...values, payload: v.target.value })}
          />
        </div>
      </Modal.Content>
    </ConfirmationModal>
  )
}
