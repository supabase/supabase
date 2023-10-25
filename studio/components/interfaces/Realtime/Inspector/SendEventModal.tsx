import { Input, Modal } from 'ui'

import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useStacked } from 'components/ui/Charts/Charts.utils'
import { useEffect, useState } from 'react'

interface SendEventModalProps {
  visible: boolean
  onSelectCancel: () => void
  onSelectConfirm: () => void
}

export const SendEventModal = (props: SendEventModalProps) => {
  const [values, setValues] = useState({ event: 'test', payload: '{}' })

  useEffect(() => {
    if (props.visible) {
      setValues({ event: 'test', payload: '{}' })
    }
  }, [props.visible])

  return (
    <ConfirmationModal
      header="Broadcast an event to all clients"
      buttonLabel="Send"
      size="medium"
      {...props}
    >
      <Modal.Content>
        <div className="py-4 flex  flex-col gap-y-4">
          <Input
            label="Event name"
            size="small"
            className="flex-grow"
            value={values.event}
            onChange={(v) => setValues({ ...values, event: v.target.value })}
          />

          <Input
            label="Event payload"
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
