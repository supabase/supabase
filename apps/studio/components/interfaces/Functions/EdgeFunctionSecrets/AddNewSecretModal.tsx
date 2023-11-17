import { useParams } from 'common'
import { useRef, useState } from 'react'
import { Button, Form, IconEye, IconEyeOff, Input, Modal } from 'ui'

import { useSecretsCreateMutation } from 'data/secrets/secrets-create-mutation'
import { useStore } from 'hooks'

interface AddNewSecretModalProps {
  visible: boolean
  onClose: () => void
}

const AddNewSecretModal = ({ visible, onClose }: AddNewSecretModalProps) => {
  const { ui } = useStore()
  const { ref: projectRef } = useParams()
  const submitRef = useRef<HTMLButtonElement>(null)
  const [showSecretValue, setShowSecretValue] = useState(false)

  const { mutate: createSecret, isLoading: isCreating } = useSecretsCreateMutation({
    onSuccess: (res, variables) => {
      ui.setNotification({
        category: 'success',
        message: `Successfully created new secret "${variables.secrets[0].name}"`,
      })
      onClose()
    },
  })

  const validate = (values: any) => {
    const errors: any = {}
    if (values.name.length === 0) errors.name = 'Please provide a name for your secret'
    if (values.value.length === 0) errors.value = 'Please provide a value for your secret'
    return errors
  }

  const onSubmit = (values: any) => {
    createSecret({ projectRef, secrets: [values] })
  }

  return (
    <Modal
      size="medium"
      visible={visible}
      onCancel={onClose}
      header="Create a new secret"
      alignFooter="right"
      customFooter={
        <div className="flex items-center gap-2">
          <Button type="default" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            type="primary"
            disabled={isCreating}
            loading={isCreating}
            onClick={() => submitRef?.current?.click()}
          >
            {isCreating ? 'Creating secret' : 'Create secret'}
          </Button>
        </div>
      }
    >
      <Form
        validateOnBlur
        initialValues={{ name: '', value: '' }}
        validate={validate}
        onSubmit={onSubmit}
      >
        {() => (
          <>
            <Modal.Content className="py-4 space-y-3">
              <Input id="name" label="Secret name" />
              <Input
                id="value"
                label="Secret value"
                className="input-mono"
                type={showSecretValue ? 'text' : 'password'}
                actions={
                  <div className="mr-1">
                    <Button
                      type="default"
                      className="px-1"
                      icon={showSecretValue ? <IconEyeOff /> : <IconEye />}
                      onClick={() => setShowSecretValue(!showSecretValue)}
                    />
                  </div>
                }
              />
            </Modal.Content>
            <button className="hidden" type="submit" ref={submitRef} />
          </>
        )}
      </Form>
    </Modal>
  )
}

export default AddNewSecretModal
