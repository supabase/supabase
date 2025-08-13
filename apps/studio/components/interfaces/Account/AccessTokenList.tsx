import { useAccessTokenDeleteMutation } from 'data/access-tokens/access-tokens-delete-mutation'
import { AccessToken, useAccessTokensQuery } from 'data/access-tokens/access-tokens-query'
import { Trash } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens && tokens.length == 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-3 py-12 text-center">
                  <p className="text-foreground-light">
                    {isLoading ? 'Checking for tokens' : 'You do not have any tokens created yet'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              tokens?.map((x) => {
                return (
                  <TableRow key={x.token_alias}>
                    <TableCell>
                      <span className="font-mono">{x.token_alias}</span>
                    </TableCell>
                    <TableCell>{x.name}</TableCell>
                    <TableCell>
                      <p>
                        {x.last_used_at ? new Date(x.last_used_at).toLocaleString() : 'Never used'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p>{x.expires_at ? new Date(x.expires_at).toLocaleString() : 'Never'}</p>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="default"
                        title="Delete token"
                        className="px-1"
                        onClick={() => {
                          setToken(x)
                          setIsOpen(true)
                        }}
                        icon={<Trash />}
                      />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
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
