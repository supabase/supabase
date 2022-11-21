import { FC, useState, useEffect } from 'react'
import { Modal, Form, Input, Button, IconEyeOff, IconEye } from 'ui'

import { useStore } from 'hooks'
import EncryptionKeySelector from '../EncryptionKeySelector'

interface Props {
  selectedSecret: any
  onClose: () => void
}

const EditSecretModal: FC<Props> = ({ selectedSecret, onClose }) => {
  const [showSecretValue, setShowSecretValue] = useState(false)
  const [selectedKeyId, setSelectedKeyId] = useState<string>()

  useEffect(() => {
    setSelectedKeyId(selectedSecret?.key_id)
  }, [selectedSecret])

  const validate = (values: any) => {
    const errors: any = {}

    if (values.secret.length === 0) errors.secret = 'Please enter your secret value'

    return errors
  }

  const onUpdateSecret = async (values: any, { setSubmitting }: any) => {
    setSubmitting(true)

    setSubmitting(false)
  }

  return (
    <Modal
      closable
      hideFooter
      size="medium"
      visible={selectedSecret !== undefined}
      onCancel={onClose}
      header={<h5 className="text-sm text-scale-1200">Edit secret</h5>}
    >
      <Form
        id="add-new-secret-form"
        initialValues={{
          secret: selectedSecret?.secret ?? '',
          description: selectedSecret?.description ?? '',
        }}
        validate={validate}
        validateOnBlur={false}
        onSubmit={onUpdateSecret}
      >
        {({ isSubmitting }: any) => {
          return (
            <div className="py-4">
              <Modal.Content>
                <div className="space-y-4 pb-4">
                  <Input
                    id="secret"
                    type={showSecretValue ? 'text' : 'password'}
                    label="Secret value"
                    actions={
                      <div className="mr-1">
                        <Button
                          type="default"
                          icon={showSecretValue ? <IconEyeOff /> : <IconEye />}
                          onClick={() => setShowSecretValue(!showSecretValue)}
                        />
                      </div>
                    }
                  />
                  <Input id="description" label="Description" labelOptional="Optional" />
                </div>
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content>
                <div className="py-4">
                  <EncryptionKeySelector
                    id="keyId"
                    descriptionId="keyDescription"
                    label="Select a key to encrypt your secret with"
                    labelOptional="Optional"
                    selectedKeyId={selectedKeyId}
                    onSelectKey={setSelectedKeyId}
                  />
                </div>
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content>
                <div className="flex items-center justify-end space-x-2">
                  <Button type="default" disabled={isSubmitting} onClick={onClose}>
                    Cancel
                  </Button>
                  <Button htmlType="submit" disabled={isSubmitting} loading={isSubmitting}>
                    Update secret
                  </Button>
                </div>
              </Modal.Content>
            </div>
          )
        }}
      </Form>
    </Modal>
  )
}

export default EditSecretModal
