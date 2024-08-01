import Link from 'next/link'
import { useState } from 'react'
import {
  Alert,
  Button,
  DialogFooter,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Form,
  IconChevronDown,
  IconExternalLink,
  Input,
  Modal,
} from 'ui'

import { useAccessTokenCreateMutation } from 'data/access-tokens/access-tokens-create-mutation'

export interface NewAccessTokenButtonProps {
  onCreateToken: (token: any) => void
}

const NewAccessTokenButton = ({ onCreateToken }: NewAccessTokenButtonProps) => {
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  asChild
                  type="primary"
                  className="rounded-l-none px-[4px] py-[5px]"
                  icon={<IconChevronDown />}
                >
                  <span></span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom">
                <DropdownMenuItem
                  key="experimental-token"
                  onClick={() => {
                    setTokenScope('V0')
                    setIsOpen(true)
                  }}
                >
                  <div className="space-y-1">
                    <p className="block text-foreground">Generate token for experimental API</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Modal
        closable
        hideFooter
        size="small"
        visible={isOpen}
        onCancel={() => setIsOpen(!isOpen)}
        header={
          <div className="flex items-baseline gap-2">
            <h5 className="text-sm text-foreground">
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
            <>
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
                      <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                        <Link
                          href="https://api.supabase.com/api/v0"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Experimental API documentation
                        </Link>
                      </Button>
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
              <DialogFooter>
                <div className="flex items-center space-x-2 justify-end">
                  <Button type="default" disabled={isLoading} onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button htmlType="submit" loading={isLoading} disabled={isLoading}>
                    Generate token
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </Form>
      </Modal>
    </>
  )
}

export default NewAccessTokenButton
