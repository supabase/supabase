import { useState } from 'react'
import {
  IconMoon,
  IconSun,
  Typography,
  Input,
  Listbox,
  Button,
  Modal,
  Form,
  IconTrash,
} from '@supabase/ui'
import { useProfile, useStore, withAuth } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { AccountLayout } from 'components/layouts'
import Table from 'components/to-be-cleaned/Table'
import { AccessToken, useAccessTokens } from 'hooks/queries/useAccessTokens'
import { observer } from 'mobx-react-lite'

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
  const [newToken, setNewToken] = useState<AccessToken | undefined>(undefined)

  async function onFormSubmit(values: any, { setSubmitting }: any) {
    // FOR DEBUG ONLY
    const newToken = {
      id: 1,
      alias: 'sbp_rtrR......bnvW',
      name,
      created_at: 1646819999,
    }

    mutateNewToken(newToken, false)
    setNewToken(newToken)

    setSubmitting(false)
    setIsOpen(false)
    // DEBUG

    // setSubmitting(true)
    // const { data, error } = await post(`${API_URL}/profile/access-tokens`, { name })
    // if (error) {
    //   ui.setNotification({
    //     category: 'error',
    //     message: `Failed to create access token: ${error.message}`,
    //   })
    //   setSubmitting(false)
    // } else {
    //   mutateNewToken(data)
    //   setNewToken(data)

    //   setSubmitting(false)
    //   setIsOpen(false)
    // }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(!isOpen)}>Generate New Token</Button>
      {newToken && (
        <div>
          <p>Successfully generated a new token!</p>
          <p className="text-green-900">sbp_98S29dsxxxxxxxxxxxxxxxoF52j1nIL</p>
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

const AccessTokenList = () => {
  const { tokens } = useAccessTokens()

  return (
    <div className="max-w-7xl">
      <Table
        head={[
          <Table.th key="header-token">Token</Table.th>,
          <Table.th key="header-name">Name</Table.th>,
          <Table.th key="header-created">Created</Table.th>,
          <Table.th key="header-action"></Table.th>,
        ]}
        body={
          <>
            {tokens?.map((x: AccessToken) => {
              return (
                <Table.tr key={x.alias}>
                  <Table.td>{x.alias}</Table.td>
                  <Table.td>{x.name}</Table.td>
                  <Table.td>
                    <Typography.Text>
                      {new Date(x.created_at * 1000).toLocaleString()}
                    </Typography.Text>
                  </Table.td>
                  <Table.td>
                    <Button
                      as="span"
                      type="danger"
                      title="delete token"
                      icon={<IconTrash />}
                    ></Button>
                  </Table.td>
                </Table.tr>
              )
            })}
          </>
        }
      />
    </div>
  )
}
