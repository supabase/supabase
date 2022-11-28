import { FC, useState, useEffect } from 'react'
import { useStore } from 'hooks'
import { VaultSecret } from 'types'
import { Modal, Form, Input, Button, IconEyeOff, IconEye } from 'ui'
import EncryptionKeySelector from '../Keys/EncryptionKeySelector'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'

interface Props {
  selectedSecret: VaultSecret
  onClose: () => void
}

const EditSecretModal: FC<Props> = ({ selectedSecret, onClose }) => {
  const { vault } = useStore()
  const [isLoadingSecretValue, setIsLoadingSecretValue] = useState(false)
  const [showSecretValue, setShowSecretValue] = useState(false)
  const [selectedKeyId, setSelectedKeyId] = useState<string>()

  let INITIAL_VALUES = {
    name: selectedSecret?.name ?? '',
    description: selectedSecret?.description ?? '',
    secret: selectedSecret?.decryptedSecret ?? '',
  }

  useEffect(() => {
    if (selectedSecret !== undefined) {
      setShowSecretValue(false)
      setSelectedKeyId(selectedSecret?.key_id)
    }
  }, [selectedSecret])

  const validate = (values: any) => {
    const errors: any = {}
    if (values.name.length === 0) errors.name = 'Please provide a name for your secret'
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
        initialValues={INITIAL_VALUES}
        validate={validate}
        validateOnBlur={false}
        onSubmit={onUpdateSecret}
      >
        {({ isSubmitting, resetForm }: any) => {
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
                <div className="py-4">
                  <EncryptionKeySelector
                    id="keyId"
                    nameId="keyDescription"
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
