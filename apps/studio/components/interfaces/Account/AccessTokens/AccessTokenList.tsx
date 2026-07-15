import { Key, MoreVertical, Trash } from 'lucide-react'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
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

import {
  ACCESS_TOKEN_SORT_VALUES,
  AccessTokenSort,
  AccessTokenSortColumn,
} from './AccessToken.types'
import { filterAndSortTokens, handleSortChange } from './AccessToken.utils'
import { RowLoading } from './AccessTokenTable/RowLoading'
import { TableContainer } from './AccessTokenTable/TableContainer'
import { ExpiresCell, LastUsedCell, TokenNameCell } from './AccessTokenTable/TokenCells'
import { useMergedAccessTokens, type MergedAccessToken } from './hooks/useMergedAccessTokens'
import { ViewTokenSheet } from './Scoped/ViewTokenSheet'
import { AlertError } from '@/components/ui/AlertError'
import { useAccessTokenDeleteMutation } from '@/data/access-tokens/access-tokens-delete-mutation'
import { useScopedAccessTokenDeleteMutation } from '@/data/scoped-access-tokens/scoped-access-tokens-delete-mutation'
import { useTrack } from '@/lib/telemetry/track'

export interface AccessTokenListProps {
  searchString?: string
  scopedEnabled?: boolean
  onDeleteSuccess?: (id: string | number) => void
}

export const AccessTokenList = ({
  searchString = '',
  scopedEnabled = true,
  onDeleteSuccess,
}: AccessTokenListProps) => {
  const track = useTrack()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [token, setToken] = useState<MergedAccessToken | undefined>(undefined)
  const [viewToken, setViewToken] = useState<MergedAccessToken | undefined>(undefined)
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false)
  const [sort, setSort] = useQueryState(
    'sort',
    parseAsStringLiteral<AccessTokenSort>(ACCESS_TOKEN_SORT_VALUES).withDefault('created_at:desc')
  )

  const { tokens, error, isLoading, isError } = useMergedAccessTokens({ scopedEnabled })

  const { mutate: deleteClassicToken, isPending: isDeletingClassic } = useAccessTokenDeleteMutation(
    {
      onSuccess: (_, vars) => {
        track('access_token_removed', { tokenType: 'classic' })
        onDeleteSuccess?.(vars.id)
        toast.success('Successfully deleted access token')
        setIsDeleteOpen(false)
      },
      onError: (error) => {
        toast.error(`Failed to delete access token: ${error.message}`)
      },
    }
  )

  const { mutate: deleteScopedToken, isPending: isDeletingScoped } =
    useScopedAccessTokenDeleteMutation({
      onSuccess: (_, vars) => {
        track('access_token_removed', { tokenType: 'scoped' })
        onDeleteSuccess?.(vars.id)
        toast.success('Successfully deleted access token')
        setIsDeleteOpen(false)
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

  const handleConfirmDelete = () => {
    if (!token) return
    if (token.kind === 'classic') deleteClassicToken({ id: token.id as number })
    else deleteScopedToken({ id: token.id as string })
  }

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
          <TableRow key={`${x.kind}-${x.id}`}>
            <TokenNameCell
              name={x.name}
              tokenAlias={x.token_alias}
              isClassic={x.kind === 'classic'}
            />
            <LastUsedCell lastUsedAt={x.last_used_at} />
            <ExpiresCell expiresAt={x.expires_at} />
            <TableCell>
              <div className="flex items-center justify-end gap-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="default"
                      title="More options"
                      className="w-7"
                      icon={<MoreVertical />}
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="end" className="w-40">
                    {x.kind === 'scoped' && (
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
                    )}
                    <DropdownMenuItem
                      className="gap-x-2"
                      onClick={() => {
                        setToken(x)
                        setIsDeleteOpen(true)
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
        visible={isDeleteOpen}
        variant="destructive"
        title="Confirm to delete"
        confirmLabel="Delete"
        confirmLabelLoading="Deleting"
        loading={isDeletingClassic || isDeletingScoped}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
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
