import { useState } from 'react'
import { Button, Modal, IconTrash } from 'ui'
import { useStore } from 'hooks'
import { AccessToken, useAccessTokensQuery } from 'data/access-tokens/access-tokens-query'
import { useAccessTokenDeleteMutation } from 'data/access-tokens/access-tokens-delete-mutation'
import { observer } from 'mobx-react-lite'

import Table from 'components/to-be-cleaned/Table'
import ConfirmationModal from 'components/ui/ConfirmationModal'

const AccessTokenList = observer(() => {
  const { ui } = useStore()
  const { data: tokens, isLoading } = useAccessTokensQuery()
  const { mutateAsync: deleteToken } = useAccessTokenDeleteMutation()

  const [isOpen, setIsOpen] = useState(false)
  const [token, setToken] = useState<AccessToken | undefined>(undefined)

  async function onDeleteToken(tokenId: number) {
    try {
      await deleteToken({ id: tokenId })
      setIsOpen(false)
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to delete token: ${error.message}`,
      })
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
                {tokens?.map((x) => {
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
                          asChild
                          type="default"
                          title="Delete token"
                          className="px-1"
                          onClick={() => {
                            setToken(x)
                            setIsOpen(true)
                          }}
                          icon={<IconTrash />}
                        >
                          <span></span>
                        </Button>
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
      >
        <Modal.Content>
          <p className="py-4 text-sm text-scale-1100">
            {`This action cannot be undone. Are you sure you want to delete "${token?.name}" token?`}
          </p>
        </Modal.Content>
      </ConfirmationModal>
    </>
  )
})

export default AccessTokenList
