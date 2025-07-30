import { useAccessTokenDeleteMutation } from 'data/access-tokens/access-tokens-delete-mutation'
import { AccessToken, useAccessTokensQuery } from 'data/access-tokens/access-tokens-query'
import { Trash, MoreVertical } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import Table from 'components/to-be-cleaned/Table'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

const AccessTokenList = () => {
  const { data: tokens, isLoading } = useAccessTokensQuery()
  const { mutate: deleteToken } = useAccessTokenDeleteMutation({
    onSuccess: () => {
      toast.success('Successfully deleted access token')
      setIsOpen(false)
    },
  })

  const [isOpen, setIsOpen] = useState(false)
  const [token, setToken] = useState<AccessToken | undefined>(undefined)

  const onDeleteToken = async (tokenId: number) => deleteToken({ id: tokenId })

  return (
    <>
      <div className="overflow-hidden overflow-x-scroll">
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
                  <p className="text-foreground-light">
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
                        <div className="flex items-center justify-end gap-x-2">
                          <Button
                            type="default"
                            title="Manage access"
                            onClick={() => {
                              console.log('Open try here...')
                            }}
                          >
                            Manage access
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="text"
                                title="More options"
                                className="px-1.5"
                                disabled={isLoading}
                                loading={isLoading}
                                icon={<MoreVertical />}
                              />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="bottom" align="end" className="w-40">
                              <DropdownMenuItem
                                className="gap-x-2"
                                onClick={() => {
                                  setToken(x)
                                  setIsOpen(true)
                                }}
                              >
                                <Trash size={12} />
                                <p>Delete token</p>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
        variant={'destructive'}
        title="Confirm to delete"
        confirmLabel="Delete"
        confirmLabelLoading="Deleting"
        onCancel={() => setIsOpen(false)}
        onConfirm={() => {
          if (token) onDeleteToken(token.id)
        }}
      >
        <p className="py-4 text-sm text-foreground-light">
          {`This action cannot be undone. Are you sure you want to delete "${token?.name}" token?`}
        </p>
      </ConfirmationModal>
    </>
  )
}

export default AccessTokenList
