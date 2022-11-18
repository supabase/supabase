import { FC, useState, useEffect } from 'react'
import { Modal, Form, Input, IconHelpCircle, Button, IconEyeOff, IconEye } from 'ui'

import { useStore } from 'hooks'
import EncryptionKeySelector from '../EncryptionKeySelector'
import InformationBox from 'components/ui/InformationBox'

interface Props {
  visible: boolean
  onClose: () => void
}

const AddNewSecretModal: FC<Props> = ({ visible, onClose }) => {
  const { vault, ui } = useStore()
  const [showSecretValue, setShowSecretValue] = useState(false)
  const [selectedKeyId, setSelectedKeyId] = useState<string>()

  const keys = vault.listKeys()
  const defaultKey = keys.find((key) => key.status === 'default')

  useEffect(() => {
    if (visible) setSelectedKeyId(defaultKey?.id)
  }, [visible])

  const validate = (values: any) => {
    const errors: any = {}

    if (values.secret.length === 0) errors.secret = 'Please enter your secret value'

    return errors
  }

  const onAddNewSecret = async (values: any, { setSubmitting }: any) => {
    setSubmitting(true)
    if (values.keyId === 'create-new') {
      const res = await vault.addKey(values.keyDescription || undefined)
      if (!res.error) {
        console.log('Add new secret', {
          keyId: res[0].id,
          secret: values.secret,
          description: values.description,
        })
      } else {
        ui.setNotification({
          error: res.error,
          category: 'error',
          message: `Failed to create new key: ${res.error.message}`,
        })
      }
    } else {
      console.log('Add new secret', {
        keyId: values.keyId,
        secret: values.secret,
        description: values.description,
      })
    }
    setSubmitting(false)
  }

  return (
    <Modal
      closable
      hideFooter
      size="medium"
      visible={visible}
      onCancel={onClose}
      header={<h5 className="text-sm text-scale-1200">Add new secret</h5>}
    >
      <Form
        id="add-new-secret-form"
        initialValues={{ secret: '', description: '', keyId: '', keyDescription: '' }}
        validate={validate}
        validateOnBlur={false}
        onSubmit={onAddNewSecret}
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
                <div className="py-4 space-y-4">
                  <EncryptionKeySelector
                    id="keyId"
                    descriptionId="keyDescription"
                    label="Select a key to encrypt your secret with"
                    labelOptional="Optional"
                    selectedKeyId={selectedKeyId}
                    onSelectKey={setSelectedKeyId}
                  />
                  <InformationBox
                    icon={<IconHelpCircle size={18} strokeWidth={2} />}
                    url="asd"
                    urlLabel="Vault documentation"
                    title="What is a key?"
                    description={
                      <div className="space-y-2">
                        <p>
                          Every secret in the Vault is encrypted with a key. The Vault comes with a
                          default value for this key which is sufficient for simple purposes.
                        </p>
                        <p>
                          However, you may also use a custom key for more advanced use cases, such
                          as having different secrets visible to different users
                        </p>
                      </div>
                    }
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
                    Add secret
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

export default AddNewSecretModal
