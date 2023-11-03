import { Input, Modal } from 'ui'

import CodeEditor from 'components/ui/CodeEditor'
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
        <div className="py-4 flex flex-col gap-y-4">
          <Input
            label="Message name"
            size="small"
            className="flex-grow"
            value={values.message}
            onChange={(v) => setValues({ ...values, message: v.target.value })}
          />
          <div className="flex flex-col gap-y-2">
            <p className="text-sm text-scale-1100">Message payload</p>
            <CodeEditor
              id="message-payload"
              language="json"
              className="!mb-0 h-32 overflow-hidden rounded border"
              onInputChange={(e: string | undefined) =>
                setValues({ ...values, payload: e ?? '{}' })
              }
              options={{ wordWrap: 'off', contextmenu: false }}
              value={values.payload}
            />
          </div>
        </div>
      </Modal.Content>
    </ConfirmationModal>
  )
}
