import { useState } from 'react'
import { Input, Button, Modal, Form, Alert, IconChevronDown, Dropdown, IconExternalLink } from 'ui'
import { useStore } from 'hooks'
import { useAccessTokenCreateMutation } from 'data/access-tokens/access-tokens-create-mutation'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'

export interface NewAccessTokenButtonProps {
  onCreateToken: (token: any) => void
}

const NewAccessTokenButton = observer(({ onCreateToken }: NewAccessTokenButtonProps) => {
  const { ui } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [tokenScope, setTokenScope] = useState<'V0' | undefined>(undefined)

  const validate = (values: any) => {
    const errors: any = {}
    if (!values.tokenName) errors.tokenName = 'Please enter a name for the token'
    return errors
  }

  const { mutateAsync: createAccessToken } = useAccessTokenCreateMutation()

  async function onFormSubmit(values: any, { setSubmitting }: any) {
    setSubmitting(true)

    try {
      const response = await createAccessToken({ name: values.tokenName, scope: tokenScope })
      onCreateToken(response)
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
      <div className="container max-w-7xl">
        <div className="flex justify-between">
          <div className="flex items-center">
            <Button
              className="rounded-r-none px-3"
              onClick={() => {
                setTokenScope(undefined)
                setIsOpen(true)
              }}
            >
              Generate new token
            </Button>
            <Dropdown
              align="end"
              side="bottom"
              overlay={[
                <Dropdown.Item
                  key="experimental-token"
                  onClick={() => {
                    setTokenScope('V0')
                    setIsOpen(true)
                  }}
                >
                  <div className="space-y-1">
                    <p className="block text-scale-1200">Generate token for experimental API</p>
                  </div>
                </Dropdown.Item>,
              ]}
            >
              <Button
                asChild
                type="primary"
                className="rounded-l-none px-[4px] py-[5px]"
                icon={<IconChevronDown />}
              >
                <span></span>
              </Button>
            </Dropdown>
          </div>
        </div>
      </div>

      <Modal
        closable
        hideFooter
        size="medium"
        visible={isOpen}
        onCancel={() => setIsOpen(!isOpen)}
        header={
          <div className="flex items-baseline gap-2">
            <h5 className="text-sm text-scale-1200">
              {tokenScope === 'V0' ? 'Generate token for experimental API' : 'Generate New Token'}
            </h5>
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
              {tokenScope === 'V0' && (
                <Modal.Content>
                  <Alert
                    withIcon
                    variant="warning"
                    title="The experimental API provides additional endpoints which allows you to manage your organizations and projects."
                  >
                    <p>
                      These include deleting organizations and projects which cannot be undone. As
                      such, be very careful when using this API.
                    </p>
                    <div className="mt-4">
                      <Link href="https://api.supabase.com/api/v0">
                        <a target="_blank" rel="noreferrer">
                          <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                            Experimental API documentation
                          </Button>
                        </a>
                      </Link>
                    </div>
                  </Alert>
                </Modal.Content>
              )}
              <Modal.Content>
                <Input
                  id="tokenName"
                  label="Name"
                  placeholder="Provide a name for your token"
                  className="w-full"
                />
              </Modal.Content>
              <Modal.Separator />
              <Modal.Content>
                <div className="flex items-center space-x-2 justify-end">
                  <Button type="default" disabled={isSubmitting} onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>
                    Generate token
                  </Button>
                </div>
              </Modal.Content>
            </div>
          )}
        </Form>
      </Modal>
    </>
  )
})

export default NewAccessTokenButton
