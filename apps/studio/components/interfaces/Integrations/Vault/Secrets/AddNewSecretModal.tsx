import { useVaultSecretCreateMutation } from 'data/vault/vault-secret-create-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Eye, EyeOff } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button, Form, Input, Modal } from 'ui'

export const AddNewSecretModal = () => {
  const { data: project } = useSelectedProjectQuery()
  const [showSecretValue, setShowSecretValue] = useState(false)

  const { mutateAsync: addSecret } = useVaultSecretCreateMutation()

  const [showAddSecretModal, setShowAddSecretModal] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false)
  )

  useEffect(() => {
    if (showAddSecretModal) {
      setShowSecretValue(false)
    }
  }, [showAddSecretModal])

  const validate = (values: any) => {
    const errors: any = {}
    if (values.name.length === 0) errors.name = 'Please provide a name for your secret'
    if (values.secret.length === 0) errors.secret = 'Please enter your secret value'
    return errors
  }

  const onAddNewSecret = async (values: any, { setSubmitting }: any) => {
    if (!project) return console.error('Project is required')

    setSubmitting(true)

    try {
      setSubmitting(true)

      await addSecret({
        projectRef: project.ref,
        connectionString: project?.connectionString,
        name: values.name,
        description: values.description,
        secret: values.secret,
      })
      toast.success(`Successfully added new secret ${values.name}`)
      setShowAddSecretModal(null)
    } catch (error: any) {
      // [Joshen] No error handler required as they are all handled within the mutations already
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      hideFooter
      size="medium"
      visible={showAddSecretModal}
      onCancel={() => setShowAddSecretModal(null)}
      header="Add new secret"
    >
      <Form
        id="add-new-secret-form"
        initialValues={{ name: '', description: '', secret: '' }}
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
              <Modal.Content className="flex items-center justify-end space-x-2">
                <Button
                  type="default"
                  disabled={isSubmitting}
                  onClick={() => setShowAddSecretModal(null)}
                >
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
