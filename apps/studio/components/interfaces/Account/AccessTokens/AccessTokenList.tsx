import AlertError from 'components/ui/AlertError'
import { useAccessTokenDeleteMutation } from 'data/access-tokens/access-tokens-delete-mutation'
import { AccessToken, useAccessTokensQuery } from 'data/access-tokens/access-tokens-query'
import { MoreVertical, Trash } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { TableCell, TableRow } from 'ui/src/components/shadcn/ui/table'
import { parseAsStringLiteral, useQueryState } from 'nuqs'

import {
  ACCESS_TOKEN_SORT_VALUES,
  AccessTokenSort,
  AccessTokenSortColumn,
} from './AccessToken.types'
import { handleSortChange, filterAndSortTokens } from './AccessToken.utils'
import { TableContainer } from './AccessTokenTable/TableContainer'
import { RowLoading } from './AccessTokenTable/RowLoading'
import { TokenNameCell, LastUsedCell, ExpiresCell } from './AccessTokenTable/TokenCells'

export interface AccessTokenListProps {
  searchString?: string
  onDeleteSuccess: (id: number) => void
}

export const AccessTokenList = ({ searchString = '', onDeleteSuccess }: AccessTokenListProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [token, setToken] = useState<AccessToken | undefined>(undefined)
  const [sort, setSort] = useQueryState(
    'sort',
    parseAsStringLiteral<AccessTokenSort>(ACCESS_TOKEN_SORT_VALUES).withDefault('created_at:desc')
  )

  const { data: tokens, error, isPending: isLoading, isError } = useAccessTokensQuery()

  const { mutate: deleteToken } = useAccessTokenDeleteMutation({
    onSuccess: (_, vars) => {
      onDeleteSuccess(vars.id)
      toast.success('Successfully deleted access token')
      setIsOpen(false)
    },
    onError: (error) => {
      toast.error(`Failed to delete access token: ${error.message}`)
    },
  })

  const onSortChange = (column: AccessTokenSortColumn) => {
    handleSortChange(sort, column, setSort)
  }

  const filteredTokens = useMemo(
    () => filterAndSortTokens(tokens, searchString, sort),
    [tokens, searchString, sort]
  )

  const empty = filteredTokens?.length === 0 && !isLoading

  if (isError) {
    return (
      <TableContainer sort={sort} onSortChange={onSortChange}>
        <TableRow>
          <TableCell colSpan={4} className="p-0">
            <AlertError
              error={error}
              subject="Failed to retrieve access tokens"
              className="rounded-none border-0"
            />
          </TableCell>
        </TableRow>
      </TableContainer>
    )
  }

  if (isLoading) {
    return (
      <TableContainer sort={sort} onSortChange={onSortChange}>
        <RowLoading />
        <RowLoading />
      </TableContainer>
    )
  }

  if (empty) {
    return (
      <TableContainer sort={sort} onSortChange={onSortChange}>
        <TableRow>
          <TableCell colSpan={4} className="py-12">
            <p className="text-sm text-center text-foreground">No access tokens found</p>
            <p className="text-sm text-center text-foreground-light">
              You do not have any tokens created yet
            </p>
          </TableCell>
        </TableRow>
      </TableContainer>
    )
  }

  return (
    <>
      <TableContainer sort={sort} onSortChange={onSortChange}>
        {filteredTokens?.map((x) => (
          <TableRow key={x.token_alias}>
            <TokenNameCell name={x.name} tokenAlias={x.token_alias} />
            <LastUsedCell lastUsedAt={x.last_used_at} />
            <ExpiresCell expiresAt={x.expires_at} />
            <TableCell>
              <div className="flex items-center justify-end gap-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="default"
                      title="More options"
                      className="w-7"
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
            </TableCell>
          </TableRow>
        ))}
      </TableContainer>

      <ConfirmationModal
        visible={isOpen}
        variant="destructive"
        title="Confirm to delete"
        confirmLabel="Delete"
        confirmLabelLoading="Deleting"
        onCancel={() => setIsOpen(false)}
        onConfirm={() => {
          if (token) deleteToken({ id: token.id })
        }}
      >
        <p className="py-4 text-sm text-foreground-light">
          This action cannot be undone. Are you sure you want to delete "{token?.name}" token?
        </p>
      </ConfirmationModal>
    </>
  )
}
