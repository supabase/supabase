import { isEmpty } from 'lodash'
import { useEffect, useState } from 'react'
import { Button, Form, IconEye, IconEyeOff, Input, Modal } from 'ui'

import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useStore } from 'hooks'
import { VaultSecret } from 'types'
import EncryptionKeySelector from '../Keys/EncryptionKeySelector'

interface EditSecretModalProps {
  selectedSecret: VaultSecret
  onClose: () => void
}

const EditSecretModal = ({ selectedSecret, onClose }: EditSecretModalProps) => {
  const { ui, vault } = useStore()
  const [selectedKeyId, setSelectedKeyId] = useState<string>()
  const [showSecretValue, setShowSecretValue] = useState(false)
  const [isLoadingSecretValue, setIsLoadingSecretValue] = useState(false)

  let INITIAL_VALUES = {
    name: selectedSecret?.name ?? '',
    description: selectedSecret?.description ?? '',
    secret: selectedSecret?.decryptedSecret ?? '',
  }

  useEffect(() => {
    if (selectedSecret !== undefined) {
      setShowSecretValue(false)
      setSelectedKeyId(selectedSecret.key_id)
    }
  }, [selectedSecret])

  const validate = (values: any) => {
    const errors: any = {}
    if (values.name.length === 0) errors.name = 'Please provide a name for your secret'
    if (values.secret.length === 0) errors.secret = 'Please enter your secret value'
    return errors
  }

  const onUpdateSecret = async (values: any, { setSubmitting }: any) => {
    const payload: Partial<VaultSecret> = {}
    if (values.name !== selectedSecret.name) payload.name = values.name
    if (values.description !== selectedSecret.description) payload.description = values.description
    if (selectedKeyId !== selectedSecret.key_id) {
      let encryptionKeyId = selectedKeyId
      if (values.keyId === 'create-new') {
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

      payload.key_id = encryptionKeyId
    }
    payload.secret = values.secret

    if (!isEmpty(payload)) {
      setSubmitting(true)
      const res = await vault.updateSecret(selectedSecret.id, payload)
      if (!res.error) {
        ui.setNotification({ category: 'success', message: 'Successfully updated secret' })
        setSubmitting(false)
        onClose()
      } else {
        ui.setNotification({
          error: res.error,
          category: 'error',
          message: `Failed to update secret: ${res.error.message}`,
        })
        setSubmitting(false)
      }
    }
  }

  return (
    <Modal
      closable
      hideFooter
      size="medium"
      visible={selectedSecret !== undefined}
      onCancel={onClose}
      header={<h5 className="text-sm text-foreground">Edit secret</h5>}
    >
      <Form
        id="add-new-secret-form"
        initialValues={INITIAL_VALUES}
        validate={validate}
        validateOnBlur={false}
        onSubmit={onUpdateSecret}
      >
        {({ isSubmitting, resetForm }: any) => {
          // [Alaister] although this "technically" is breaking the rules of React hooks
          // it won't error because the hooks are always rendered in the same order
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useEffect(() => {
            if (selectedSecret !== undefined && selectedSecret.decryptedSecret === undefined) {
              fetchSecretValue()
            }
          }, [selectedSecret])

          const fetchSecretValue = async () => {
            if (selectedSecret === undefined) return
            setIsLoadingSecretValue(true)
            const res = await vault.fetchSecretValue(selectedSecret.id)
            resetForm({
              values: { ...INITIAL_VALUES, secret: res },
              initialValues: { ...INITIAL_VALUES, secret: res },
            })
            setIsLoadingSecretValue(false)
          }

          return isLoadingSecretValue ? (
            <div className="space-y-2 py-4 px-2">
              <ShimmeringLoader />
              <div className="w-3/4">
                <ShimmeringLoader />
              </div>
              <div className="w-1/2">
                <ShimmeringLoader />
              </div>
            </div>
          ) : (
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
                </div>
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content>
                <div className="flex items-center justify-end space-x-2">
                  <Button type="default" disabled={isSubmitting} onClick={() => onClose()}>
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
