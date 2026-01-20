import AlertError from 'components/ui/AlertError'
import { useAccessTokenDeleteMutation } from 'data/access-tokens/access-tokens-delete-mutation'
import { AccessToken, useAccessTokensQuery } from 'data/access-tokens/access-tokens-query'
import dayjs from 'dayjs'
import { MoreVertical, Trash } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeadSort,
  TableRow,
} from 'ui/src/components/shadcn/ui/table'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'
import { parseAsStringLiteral, useQueryState } from 'nuqs'

const ACCESS_TOKEN_SORT_VALUES = [
  'created_at:asc',
  'created_at:desc',
  'last_used_at:asc',
  'last_used_at:desc',
  'expires_at:asc',
  'expires_at:desc',
] as const

type AccessTokenSort = (typeof ACCESS_TOKEN_SORT_VALUES)[number]
type AccessTokenSortColumn = AccessTokenSort extends `${infer Column}:${string}` ? Column : unknown
type AccessTokenSortOrder = AccessTokenSort extends `${string}:${infer Order}` ? Order : unknown

const RowLoading = () => (
  <TableRow>
    <TableCell>
      <Skeleton className="w-40 max-w-40 h-4 rounded-full" />
    </TableCell>
    <TableCell>
      <Skeleton className="w-60 max-w-60 h-4 rounded-full" />
    </TableCell>
    <TableCell>
      <Skeleton className="max-w-32 h-4 rounded-full" />
    </TableCell>
    <TableCell>
      <Skeleton className="max-w-32 h-4 rounded-full" />
    </TableCell>
    <TableCell>
      <Skeleton className="w-4 h-4 rounded-md" />
    </TableCell>
  </TableRow>
)

const tableHeaderClass = 'text-left font-mono uppercase text-xs text-foreground-lighter py-2'

interface TableContainerProps {
  children: React.ReactNode
  sort: AccessTokenSort
  onSortChange: (column: AccessTokenSortColumn) => void
}

const TableContainer = ({ children, sort, onSortChange }: TableContainerProps) => (
  <Card className="w-full overflow-hidden">
    <CardContent className="p-0">
      <Table className="p-5 table-auto">
        <TableHeader>
          <TableRow className="bg-200">
            <TableHead className={tableHeaderClass}>Token</TableHead>
            <TableHead className={tableHeaderClass}>
              <TableHeadSort column="last_used_at" currentSort={sort} onSortChange={onSortChange}>
                Last used
              </TableHeadSort>
            </TableHead>
            <TableHead className={tableHeaderClass}>
              <TableHeadSort column="expires_at" currentSort={sort} onSortChange={onSortChange}>
                Expires
              </TableHeadSort>
            </TableHead>
            <TableHead className={cn(tableHeaderClass, '!text-right')} />
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </CardContent>
  </Card>
)

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

  const handleSortChange = (column: AccessTokenSortColumn) => {
    const [currentCol, currentOrder] = sort.split(':') as [
      AccessTokenSortColumn,
      AccessTokenSortOrder,
    ]
    if (currentCol === column) {
      if (currentOrder === 'asc') {
        setSort(`${column}:desc` as AccessTokenSort)
      } else {
        setSort('created_at:desc')
      }
    } else {
      setSort(`${column}:asc` as AccessTokenSort)
    }
  }

  const onDeleteToken = async (tokenId: number) => {
    deleteToken({ id: tokenId })
  }

  const filteredTokens = useMemo(() => {
    const filtered = !searchString
      ? tokens
      : tokens?.filter((token) => {
          return token.name.toLowerCase().includes(searchString.toLowerCase())
        })

    if (!filtered) return filtered

    const [sortCol, sortOrder] = sort.split(':') as [AccessTokenSortColumn, AccessTokenSortOrder]
    const orderMultiplier = sortOrder === 'asc' ? 1 : -1

    return [...filtered].sort((a, b) => {
      if (sortCol === 'created_at') {
        return (
          (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * orderMultiplier
        )
      }
      if (sortCol === 'last_used_at') {
        if (!a.last_used_at && !b.last_used_at) return 0
        if (!a.last_used_at) return 1
        if (!b.last_used_at) return -1
        return (
          (new Date(a.last_used_at).getTime() - new Date(b.last_used_at).getTime()) *
          orderMultiplier
        )
      }
      if (sortCol === 'expires_at') {
        if (!a.expires_at && !b.expires_at) return 0
        if (!a.expires_at) return 1
        if (!b.expires_at) return -1
        return (
          (new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()) * orderMultiplier
        )
      }
      return 0
    })
  }, [tokens, searchString, sort])

  const empty = filteredTokens?.length === 0 && !isLoading

  if (isError) {
    return (
      <TableContainer sort={sort} onSortChange={handleSortChange}>
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
      <TableContainer sort={sort} onSortChange={handleSortChange}>
        <RowLoading />
        <RowLoading />
      </TableContainer>
    )
  }

  if (empty) {
    return (
      <TableContainer sort={sort} onSortChange={handleSortChange}>
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
      <TableContainer sort={sort} onSortChange={handleSortChange}>
        {filteredTokens?.map((x) => {
          return (
            <TableRow key={x.token_alias}>
              <TableCell className="w-auto max-w-96">
                <p className="truncate" title={x.name}>
                  {x.name}
                </p>
                <p
                  className="font-mono text-foreground-lighter truncate text-xs mt-1 max-w-32 sm:max-w-48 lg:max-w-full"
                  title={x.token_alias}
                >
                  {x.token_alias}
                </p>
              </TableCell>
              <TableCell className="text-foreground-light min-w-28">
                {x.last_used_at ? (
                  <TimestampInfo
                    utcTimestamp={x.last_used_at}
                    label={dayjs(x.last_used_at).fromNow()}
                    className="text-sm"
                  />
                ) : (
                  <p className="text-foreground-light text-sm">Never used</p>
                )}
              </TableCell>
              <TableCell className="min-w-28 text-foreground-light">
                {x.expires_at ? (
                  dayjs(x.expires_at).isBefore(dayjs()) ? (
                    <TimestampInfo
                      utcTimestamp={x.expires_at}
                      label="Expired"
                      className="text-sm"
                    />
                  ) : (
                    <TimestampInfo
                      utcTimestamp={x.expires_at}
                      label={dayjs(x.expires_at).format('DD MMM YYYY')}
                      className="text-sm"
                    />
                  )
                ) : (
                  <p className="text-foreground-light text-sm">Never</p>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="default"
                        title="More options"
                        className="px-1"
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
              </TableCell>
            </TableRow>
          )
        })}
      </TableContainer>

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
          This action cannot be undone. Are you sure you want to delete "{token?.name}" token?
        </p>
      </ConfirmationModal>
    </>
  )
}
