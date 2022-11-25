import { useState } from 'react'
import { Button, Modal, IconTrash } from 'ui'
import { useStore } from 'hooks'
import { delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { AccessToken, useAccessTokens } from 'hooks/queries/useAccessTokens'
import { observer } from 'mobx-react-lite'

import Table from 'components/to-be-cleaned/Table'
import ConfirmationModal from 'components/ui/ConfirmationModal'

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
                  <p className="text-scale-1000">
                    {isLoading ? 'Checking for tokens' : 'You do not have any tokens created yet'}
                  </p>
                </Table.td>
              </Table.tr>
            ) : (
              <>
                {tokens?.map((x: AccessToken) => {
                  return (
                    <Table.tr key={x.token_alias}>
                      <Table.td>
                        <span className="font-mono">{x.token_alias}</span>
                      </Table.td>
                      <Table.td>{x.name}</Table.td>
                      <Table.td>
                        <p>{new Date(x.created_at).toLocaleString()}</p>
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
              {`This action cannot be undone. Are you sure you want to delete "${token?.name}" token?`}
            </p>
          </Modal.Content>
        }
      />
    </>
  )
})

export default AccessTokenList
