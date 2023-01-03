import { FC, useState } from 'react'
import { Input, Button, Modal, Form, Alert } from 'ui'
import { useStore } from 'hooks'
import {
  NewAccessToken,
  useAccessTokenCreateMutation,
} from 'data/access-tokens/access-tokens-create-mutation'
import { observer } from 'mobx-react-lite'

const NewAccessTokenButton = observer(() => {
  const { ui } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [newToken, setNewToken] = useState<NewAccessToken | undefined>(undefined)

  const validate = (values: any) => {
    const errors: any = {}
    if (!values.tokenName) {
      errors.tokenName = 'Please enter a name for the token'
    }
    return errors
  }

  const { mutateAsync: createAccessToken } = useAccessTokenCreateMutation()

  async function onFormSubmit(values: any, { setSubmitting }: any) {
    setSubmitting(true)

    try {
      const response = await createAccessToken({ name: values.tokenName })
      setNewToken(response)

      setSubmitting(false)
      setIsOpen(false)
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to create token: ${error.message}`,
      })

      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => {
          setNewToken(undefined)
          setIsOpen(!isOpen)
        }}
      >
        Generate new token
      </Button>
      {newToken && <NewTokenItem data={newToken} />}
      <Modal
        closable
        hideFooter
        size="small"
        visible={isOpen}
        onCancel={() => setIsOpen(!isOpen)}
        header={
          <div className="flex items-baseline gap-2">
            <h5 className="text-sm text-scale-1200">Generate New Token</h5>
          </div>
        }
      >
        <Form
          validateOnBlur
          initialValues={{ tokenName: '' }}
          onSubmit={onFormSubmit}
          validate={validate}
        >
          {({ isSubmitting }: { isSubmitting: boolean }) => (
            <div className="py-3 space-y-4">
              <Modal.Content>
                <Input
                  id="tokenName"
                  label="Name"
                  placeholder="Type in the token name"
                  className="w-full"
                />
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content>
                <Button htmlType="submit" loading={isSubmitting} size="small" block danger>
                  Generate Token
                </Button>
              </Modal.Content>
            </div>
          )}
        </Form>
      </Modal>
    </>
  )
})

export default NewAccessTokenButton

interface NewTokenItemProps {
  data: NewAccessToken
}

const NewTokenItem: FC<NewTokenItemProps> = observer(({ data }) => {
  return (
    <Alert withIcon variant="success" title="Successfully generated a new token!">
      <div className="w-full space-y-2">
        <p className="text-sm">
          Do copy this access token and store it in a secure place - you will not be able to see it
          again.
        </p>
        <Input
          copy
          readOnly
          size="small"
          className="max-w-xl input-mono"
          value={data.token}
          onChange={() => {}}
        />
      </div>
    </Alert>
  )
})
