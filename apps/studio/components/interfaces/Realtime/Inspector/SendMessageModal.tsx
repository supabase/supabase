import { useEffect, useState } from 'react'

import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { tryParseJson } from 'lib/helpers'
import { Input, Modal } from 'ui'

interface SendMessageModalProps {
  visible: boolean
  onSelectCancel: () => void
  onSelectConfirm: (v: { message: string; payload: string }) => void
}

const defaultPayload = {
  message: 'Test message',
  payload: '{ "message": "Hello World" }',
}

export const SendMessageModal = ({
  visible,
  onSelectCancel,
  onSelectConfirm,
}: SendMessageModalProps) => {
  const [error, setError] = useState<string>()
  const [values, setValues] = useState(defaultPayload)

  useEffect(() => {
    if (visible) {
      setError(undefined)
      setValues(defaultPayload)
    }
  }, [visible])

  return (
    <Modal
      size="medium"
      alignFooter="right"
      header="Broadcast a message to all clients"
      visible={visible}
      loading={false}
      onCancel={onSelectCancel}
      onConfirm={() => {
        const payload = tryParseJson(values.payload)
        if (payload === undefined) {
          setError('Please provide a valid JSON')
        } else {
          onSelectConfirm({ ...values, payload })
        }
      }}
    >
      <Modal.Content className="flex flex-col gap-y-4">
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
            onInputChange={(e: string | undefined) => setValues({ ...values, payload: e ?? '{}' })}
            options={{ wordWrap: 'off', contextmenu: false }}
            value={values.payload}
          />
          {error !== undefined && <p className="text-sm text-red-900">{error}</p>}
        </div>
      </Modal.Content>
    </Modal>
  )
}
