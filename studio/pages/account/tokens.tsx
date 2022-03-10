import { useState } from 'react'
import { Typography, Input, Button, Modal, Form, IconTrash } from '@supabase/ui'
import { useStore, withAuth } from 'hooks'
import { delete_, post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { AccountLayout } from 'components/layouts'
import { AccessToken, NewAccessToken, useAccessTokens } from 'hooks/queries/useAccessTokens'
import { observer } from 'mobx-react-lite'

import Table from 'components/to-be-cleaned/Table'
import ConfirmationModal from 'components/ui/ConfirmationModal'

const User = () => {
  return (
    <AccountLayout
      title="Supabase"
      breadcrumbs={[
        {
          key: `supabase-settings`,
          label: 'Access Tokens',
        },
      ]}
    >
      <div className="p-4 pt-0 mt-4 space-y-8">
        <h2 className="text-xl">Access Tokens</h2>
        <NewAccessTokenButton />
        <AccessTokenList />
      </div>
    </AccountLayout>
  )
}

export default withAuth(User)

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
      <Button onClick={() => setIsOpen(!isOpen)}>Generate New Token</Button>
      {newToken && (
        <div>
          <p>Successfully generated a new token!</p>
          <p className="text-green-900">{newToken.token}</p>
          <p>This token never will be displayed again.</p>
        </div>
      )}
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

const AccessTokenList = observer(() => {
  const { ui } = useStore()
  const { mutateDeleteToken } = useAccessTokens()
  const { tokens, isLoading } = useAccessTokens()
  const [isOpen, setIsOpen] = useState(false)
  const [token, setToken] = useState<AccessToken | undefined>(undefined)

  async function onDeleteToken(tokenId: number) {
    const response = await delete_(`${API_URL}/profile/access-tokens/${tokenId}`)
    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to delete token: ${response.error.message}`,
      })
    } else {
      mutateDeleteToken(tokenId)
      setIsOpen(false)
    }
  }

  return (
    <>
      <div className="max-w-7xl">
        <Table
          head={[
            <Table.th key="header-token">Token</Table.th>,
            <Table.th key="header-name">Name</Table.th>,
            <Table.th key="header-created">Created</Table.th>,
            <Table.th key="header-action"></Table.th>,
          ]}
          body={
            tokens && tokens.length == 0 ? (
              <Table.tr>
                <Table.td colSpan={5} className="p-3 py-12 text-center">
                  <Typography.Text type="secondary">
                    {isLoading ? 'Checking for tokens' : "You don't have any token"}
                  </Typography.Text>
                </Table.td>
              </Table.tr>
            ) : (
              <>
                {tokens?.map((x: AccessToken) => {
                  console.log('x: ', x)
                  return (
                    <Table.tr key={x.token_alias}>
                      <Table.td>{x.token_alias}</Table.td>
                      <Table.td>{x.name}</Table.td>
                      <Table.td>
                        <Typography.Text>{new Date(x.created_at).toLocaleString()}</Typography.Text>
                      </Table.td>
                      <Table.td>
                        <Button
                          as="span"
                          type="danger"
                          title="delete token"
                          onClick={() => {
                            setToken(x)
                            setIsOpen(true)
                          }}
                          icon={<IconTrash />}
                        ></Button>
                      </Table.td>
                    </Table.tr>
                  )
                })}
              </>
            )
          }
        />
      </div>
      <ConfirmationModal
        visible={isOpen}
        danger={true}
        header="Confirm to delete"
        buttonLabel="Delete"
        onSelectCancel={() => setIsOpen(false)}
        onSelectConfirm={() => {
          if (token) onDeleteToken(token.id)
        }}
        children={
          <Modal.Content>
            <p className="py-4 text-sm text-scale-1100">
              {`This action cannot be undone. Are you sure you want to delete the "${token?.name}" token?`}
            </p>
          </Modal.Content>
        }
      />
    </>
  )
})
