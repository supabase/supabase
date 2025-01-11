import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import InformationBox from 'components/ui/InformationBox'
import { usePgSodiumKeyCreateMutation } from 'data/pg-sodium-keys/pg-sodium-key-create-mutation'
import { usePgSodiumKeysQuery } from 'data/pg-sodium-keys/pg-sodium-keys-query'
import { useVaultSecretCreateMutation } from 'data/vault/vault-secret-create-mutation'
import { Button, Form, Input, Modal } from 'ui'
import EncryptionKeySelector from '../Keys/EncryptionKeySelector'
import { EyeOff, Eye, HelpCircle } from 'lucide-react'

interface AddNewSecretModalProps {
  visible: boolean
  onClose: () => void
}

const AddNewSecretModal = ({ visible, onClose }: AddNewSecretModalProps) => {
  const [showSecretValue, setShowSecretValue] = useState(false)
  const [selectedKeyId, setSelectedKeyId] = useState<string>()
  const { project } = useProjectContext()

  const { mutateAsync: addKeyMutation } = usePgSodiumKeyCreateMutation()
  const { mutateAsync: addSecret } = useVaultSecretCreateMutation()

  const { data: keys } = usePgSodiumKeysQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  useEffect(() => {
    if (visible && keys) {
      setShowSecretValue(false)
      setSelectedKeyId(keys[0]?.id ?? 'create-new')
    }
  }, [visible, keys])

  const validate = (values: any) => {
    const errors: any = {}
    if (values.name.length === 0) errors.name = 'Please provide a name for your secret'
    if (values.secret.length === 0) errors.secret = 'Please enter your secret value'
    if (selectedKeyId === 'create-new' && values.keyName.length === 0)
      errors.keyName = 'Please provide a name for your new key'
    return errors
  }

  const onAddNewSecret = async (values: any, { setSubmitting }: any) => {
    if (!project) return console.error('Project is required')

    setSubmitting(true)
    let encryptionKeyId = selectedKeyId

    try {
      setSubmitting(true)
      if (selectedKeyId === 'create-new') {
        const addKeyRes = await addKeyMutation({
          projectRef: project?.ref!,
          connectionString: project?.connectionString,
          name: values.keyName || undefined,
        })
        encryptionKeyId = addKeyRes[0].id
      }

      await addSecret({
        projectRef: project.ref,
        connectionString: project?.connectionString,
        name: values.name,
        description: values.description,
        secret: values.secret,
        key_id: encryptionKeyId,
      })
      toast.success(`Successfully added new secret ${values.name}`)
      onClose()
    } catch (error: any) {
      // [Joshen] No error handler required as they are all handled within the mutations already
    } finally {
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
      header="Add new secret"
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
            <>
              <Modal.Content className="space-y-4">
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
                        icon={showSecretValue ? <EyeOff /> : <Eye />}
                        onClick={() => setShowSecretValue(!showSecretValue)}
                      />
                    </div>
                  }
                />
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content className="space-y-4">
                <EncryptionKeySelector
                  id="keyId"
                  nameId="keyName"
                  label="Select a key to encrypt your secret with"
                  labelOptional="Optional"
                  selectedKeyId={selectedKeyId}
                  onSelectKey={setSelectedKeyId}
                />
                <InformationBox
                  icon={<HelpCircle size={18} strokeWidth={2} />}
                  url="https://github.com/supabase/vault"
                  urlLabel="Vault documentation"
                  title="What is a key?"
                  description={
                    <div className="space-y-2">
                      <p>
                        Keys are used to encrypt data inside your database, and every secret in the
                        Vault is encrypted with a key.
                      </p>
                      <p>
                        You may create different keys for different purposes, such as one for
                        encrypting user data, and another for application data.
                      </p>
                    </div>
                  }
                />
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content className="flex items-center justify-end space-x-2">
                <Button type="default" disabled={isSubmitting} onClick={onClose}>
                  Cancel
                </Button>
                <Button htmlType="submit" disabled={isSubmitting} loading={isSubmitting}>
                  Add secret
                </Button>
              </Modal.Content>
            </>
          )
        }}
      </Form>
    </Modal>
  )
}

export default AddNewSecretModal
