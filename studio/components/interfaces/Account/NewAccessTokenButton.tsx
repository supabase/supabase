import { FC, useState } from 'react'
import { Input, Button, Modal, Form, Alert } from '@supabase/ui'
import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { NewAccessToken, useAccessTokens } from 'hooks/queries/useAccessTokens'
import { observer } from 'mobx-react-lite'

const NewAccessTokenButton = observer(() => {
  const { ui } = useStore()
  const { mutateNewToken } = useAccessTokens()
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [newToken, setNewToken] = useState<NewAccessToken | undefined>(undefined)

  async function onFormSubmit(values: any, { setSubmitting }: any) {
    setSubmitting(true)
    const response = await post(`${API_URL}/profile/access-tokens`, { name })
    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to create token: ${response.error.message}`,
      })
      setSubmitting(false)
    } else {
      mutateNewToken(response)
      setNewToken(response)

      setSubmitting(false)
      setIsOpen(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => {
          setName('')
          setNewToken(undefined)
          setIsOpen(!isOpen)
        }}
      >
        Generate new token
      </Button>
      {newToken && <NewTokenItem data={newToken} />}
      <Modal
        visible={isOpen}
        onCancel={() => setIsOpen(!isOpen)}
        header={
          <div className="flex gap-2 items-baseline">
            <h5 className="text-sm text-scale-1200">Generate New Token</h5>
          </div>
        }
        size="small"
        hideFooter
        closable
      >
        <Form
          initialValues={{ tokenName: '' }}
          validateOnBlur
          onSubmit={onFormSubmit}
          validate={(values: any) => {
            const errors: any = {}
            if (!values.tokenName) {
              errors.tokenName = 'Enter the name of the token.'
            }
            return errors
          }}
        >
          {({ isSubmitting }: { isSubmitting: boolean }) => (
            <div className="space-y-4 py-3">
              <Modal.Content>
                <Input
                  id="tokenName"
                  label="Name"
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                  placeholder="Type in the token name"
                  className="w-full"
                />
              </Modal.Content>
              <Modal.Seperator />
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
          readOnly
          size="small"
          copy={true}
          className="input-mono max-w-xl"
          value={data.token}
          onChange={() => {}}
        />
      </div>
    </Alert>
  )
})
