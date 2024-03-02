import { isEmpty } from 'lodash'
import { useEffect, useState } from 'react'
import { Button, Form, IconEye, IconEyeOff, Input, Modal } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { usePgSodiumKeyCreateMutation } from 'data/pg-sodium-keys/pg-sodium-key-create-mutation'
import { useVaultSecretDecryptedValueQuery } from 'data/vault/vault-secret-decrypted-value-query'
import { useVaultSecretUpdateMutation } from 'data/vault/vault-secret-update-mutation'
import { useStore } from 'hooks'
import type { VaultSecret } from 'types'
import EncryptionKeySelector from '../Keys/EncryptionKeySelector'

interface EditSecretModalProps {
  selectedSecret: VaultSecret | undefined
  onClose: () => void
}

const EditSecretModal = ({ selectedSecret, onClose }: EditSecretModalProps) => {
  const { ui } = useStore()
  const [selectedKeyId, setSelectedKeyId] = useState<string>()
  const [showSecretValue, setShowSecretValue] = useState(false)
  const { project } = useProjectContext()

  const { mutateAsync: addKeyMutation } = usePgSodiumKeyCreateMutation()
  const { mutateAsync: updateSecret } = useVaultSecretUpdateMutation()

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
    if (!project) return console.error('Project is required')

    const payload: Partial<VaultSecret> = {}
    if (values.name !== selectedSecret?.name) payload.name = values.name
    if (values.description !== selectedSecret?.description) payload.description = values.description
    if (selectedKeyId !== selectedSecret?.key_id) {
      let encryptionKeyId = selectedKeyId
      if (values.keyId === 'create-new') {
        const addKeyRes = await addKeyMutation({
          projectRef: project?.ref!,
          connectionString: project?.connectionString,
          name: values.keyName || undefined,
        })
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

    if (!isEmpty(payload) && selectedSecret) {
      setSubmitting(true)
      const res = await updateSecret({
        projectRef: project.ref,
        connectionString: project?.connectionString,
        id: selectedSecret.id,
        ...payload,
      })
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
          // [Joshen] JFYI this is breaking rules of hooks, will be fixed once we move to
          // using react hook form instead
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const { isLoading: isLoadingSecretValue } = useVaultSecretDecryptedValueQuery(
            {
              projectRef: project?.ref!,
              id: selectedSecret?.id!,
              connectionString: project?.connectionString,
            },
            {
              enabled: !!(project?.ref && selectedSecret?.id),
              onSuccess: (res) => {
                resetForm({
                  values: { ...INITIAL_VALUES, secret: res },
                  initialValues: { ...INITIAL_VALUES, secret: res },
                })
              },
            }
          )

          return isLoadingSecretValue ? (
            <div className="p-4">
              <GenericSkeletonLoader />
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
