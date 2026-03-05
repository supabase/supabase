import AlertError from 'components/ui/AlertError'
import { useScopedAccessTokenDeleteMutation } from 'data/scoped-access-tokens/scoped-access-tokens-delete-mutation'
import {
  ScopedAccessToken,
  useScopedAccessTokensQuery,
} from 'data/scoped-access-tokens/scoped-access-token-query'
import { MoreVertical, Trash, Key } from 'lucide-react'
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
} from '../AccessToken.types'
import { handleSortChange, filterAndSortTokens } from '../AccessToken.utils'
import { TableContainer } from '../AccessTokenTable/TableContainer'
import { RowLoading } from '../AccessTokenTable/RowLoading'
import { TokenNameCell, LastUsedCell, ExpiresCell } from '../AccessTokenTable/TokenCells'
import { ViewTokenSheet } from './ViewTokenSheet'

export interface ScopedTokenListProps {
  searchString?: string
  onDeleteSuccess: (id: string | number) => void
}

export const ScopedTokenList = ({ searchString = '', onDeleteSuccess }: ScopedTokenListProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [token, setToken] = useState<ScopedAccessToken | undefined>(undefined)
  const [viewToken, setViewToken] = useState<ScopedAccessToken | undefined>(undefined)
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false)
  const [sort, setSort] = useQueryState(
    'sort',
    parseAsStringLiteral<AccessTokenSort>(ACCESS_TOKEN_SORT_VALUES).withDefault('created_at:desc')
  )

  const { data: tokensData, error, isPending: isLoading, isError } = useScopedAccessTokensQuery()

  const tokens = tokensData?.tokens

  const { mutate: deleteToken } = useScopedAccessTokenDeleteMutation({
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
            <p className="text-sm text-center text-foreground">No scoped access tokens found</p>
            <p className="text-sm text-center text-foreground-light">
              You do not have any scoped tokens created yet
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
          <TableRow key={x.id}>
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
                        setViewToken(x)
                        setIsViewSheetOpen(true)
                      }}
                    >
                      <Key size={12} />
                      <p>View permissions</p>
                    </DropdownMenuItem>
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
          if (token) deleteToken({ id: token.id as string })
        }}
      >
        <p className="py-4 text-sm text-foreground-light">
          This action cannot be undone. Are you sure you want to delete "{token?.name}" token?
        </p>
      </ConfirmationModal>

      <ViewTokenSheet
        visible={isViewSheetOpen}
        tokenId={viewToken ? String(viewToken.id) : undefined}
        onClose={() => {
          setIsViewSheetOpen(false)
          setViewToken(undefined)
        }}
      />
    </>
  )
}
