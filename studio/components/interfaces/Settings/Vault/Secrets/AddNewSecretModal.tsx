import { useEffect, useState } from 'react'
import { Button, Form, IconEye, IconEyeOff, IconHelpCircle, Input, Modal } from 'ui'

import InformationBox from 'components/ui/InformationBox'
import { useStore } from 'hooks'
import EncryptionKeySelector from '../Keys/EncryptionKeySelector'

interface AddNewSecretModalProps {
  visible: boolean
  onClose: () => void
}

const AddNewSecretModal = ({ visible, onClose }: AddNewSecretModalProps) => {
  const { vault, ui } = useStore()
  const [showSecretValue, setShowSecretValue] = useState(false)
  const [selectedKeyId, setSelectedKeyId] = useState<string>()

  const keys = vault.listKeys()

  useEffect(() => {
    if (visible) {
      setShowSecretValue(false)
      setSelectedKeyId(keys[0]?.id ?? 'create-new')
    }
  }, [visible])

  const validate = (values: any) => {
    const errors: any = {}
    if (values.name.length === 0) errors.name = 'Please provide a name for your secret'
    if (values.secret.length === 0) errors.secret = 'Please enter your secret value'
    if (selectedKeyId === 'create-new' && values.keyName.length === 0)
      errors.keyName = 'Please provide a name for your new key'
    return errors
  }

  const onAddNewSecret = async (values: any, { setSubmitting }: any) => {
    setSubmitting(true)
    let encryptionKeyId = selectedKeyId

    if (selectedKeyId === 'create-new') {
      const addKeyRes = await vault.addKey(values.keyName || undefined)
      if (addKeyRes.error) {
        return ui.setNotification({
          error: addKeyRes.error,
          category: 'error',
          message: `Failed to create new key: ${addKeyRes.error.message}`,
        })
      } else {
        encryptionKeyId = addKeyRes[0].id
      }
    }

    const res = await vault.addSecret({
      name: values.name,
      description: values.description,
      secret: values.secret,
      key_id: encryptionKeyId,
    })

    if (!res.error) {
      ui.setNotification({
        category: 'success',
        message: `Successfully added new secret ${values.name}`,
      })
      onClose()
      setSubmitting(false)
    } else {
      ui.setNotification({
        error: res.error,
        category: 'error',
        message: `Failed to add secret ${values.name}: ${res.error.message}`,
      })
      setSubmitting(false)
    }
  }

  return (
    <Modal
      closable
      hideFooter
      size="medium"
      visible={visible}
      onCancel={onClose}
      header={<h5 className="text-sm text-foreground">Add new secret</h5>}
    >
      <Form
        id="add-new-secret-form"
        initialValues={{ name: '', description: '', secret: '', keyId: '', keyName: '' }}
        validate={validate}
        validateOnBlur={false}
        onSubmit={onAddNewSecret}
      >
        {({ isSubmitting }: any) => {
          return (
            <div className="py-4">
              <Modal.Content>
                <div className="space-y-4 pb-4">
                  <Input id="name" label="Name" />
                  <Input id="description" label="Description" labelOptional="Optional" />
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
                </div>
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content>
                <div className="py-4 space-y-4">
                  <EncryptionKeySelector
                    id="keyId"
                    nameId="keyName"
                    label="Select a key to encrypt your secret with"
                    labelOptional="Optional"
                    selectedKeyId={selectedKeyId}
                    onSelectKey={setSelectedKeyId}
                  />
                  <InformationBox
                    icon={<IconHelpCircle size={18} strokeWidth={2} />}
                    url="https://github.com/supabase/vault"
                    urlLabel="Vault documentation"
                    title="What is a key?"
                    description={
                      <div className="space-y-2">
                        <p>
                          Keys are used to encrypt data inside your database, and every secret in
                          the Vault is encrypted with a key.
                        </p>
                        <p>
                          You may create different keys for different purposes, such as one for
                          encrypting user data, and another for application data.
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
