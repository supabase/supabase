import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useState } from 'react'
import { Alert, Button, Dropdown, Form, IconChevronDown, IconExternalLink, Input, Modal } from 'ui'

import { useAccessTokenCreateMutation } from 'data/access-tokens/access-tokens-create-mutation'

export interface NewAccessTokenButtonProps {
  onCreateToken: (token: any) => void
}

const NewAccessTokenButton = observer(({ onCreateToken }: NewAccessTokenButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [tokenScope, setTokenScope] = useState<'V0' | undefined>(undefined)

  const validate = (values: any) => {
    const errors: any = {}
    if (!values.tokenName) errors.tokenName = 'Please enter a name for the token'
    return errors
  }

  const { mutate: createAccessToken, isLoading } = useAccessTokenCreateMutation({
    onSuccess: (res) => {
      onCreateToken(res)
      setIsOpen(false)
    },
  })

  const onFormSubmit = async (values: any) => {
    createAccessToken({ name: values.tokenName, scope: tokenScope })
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
          {() => (
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
                  <Button type="default" disabled={isLoading} onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button htmlType="submit" loading={isLoading} disabled={isLoading}>
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
