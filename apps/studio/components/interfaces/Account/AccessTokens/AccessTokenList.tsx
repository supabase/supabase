import dayjs from 'dayjs'
import { MoreVertical, Trash } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import AlertError from 'components/ui/AlertError'
import { useAccessTokenDeleteMutation } from 'data/access-tokens/access-tokens-delete-mutation'
import { AccessToken, useAccessTokensQuery } from 'data/access-tokens/access-tokens-query'
import { DATETIME_FORMAT } from 'lib/constants'
import {
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui/src/components/shadcn/ui/table'

const RowLoading = () => (
  <TableRow>
    <TableCell>
      <Skeleton className="max-w-60 h-4 rounded-full" />
    </TableCell>
    <TableCell>
      <Skeleton className="max-w-40 h-4 rounded-full" />
    </TableCell>
    <TableCell>
      <Skeleton className="max-w-32 h-4 rounded-full" />
    </TableCell>
    <TableCell>
      <Skeleton className="w-20 h-8 rounded-md" />
    </TableCell>
  </TableRow>
)

const TableContainer = ({ children }: { children: React.ReactNode }) => (
  <Card className="w-full overflow-hidden">
    <CardContent className="p-0">
      <Table className="p-5 table-auto">
        <TableHeader>
          <TableRow className="bg-200">
            <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
              Name
            </TableHead>
            <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
              Token
            </TableHead>
            <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
              Created
            </TableHead>
            <TableHead className="text-right font-mono uppercase text-xs text-foreground-lighter h-auto py-2" />
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

  const { data: tokens, error, isLoading, isError } = useAccessTokensQuery()

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

  const onDeleteToken = async (tokenId: number) => {
    deleteToken({ id: tokenId })
  }

  const filteredTokens = useMemo(() => {
    return !searchString
      ? tokens
      : tokens?.filter((token) => {
          return token.name.toLowerCase().includes(searchString.toLowerCase())
        })
  }, [tokens, searchString])

  const empty = filteredTokens?.length === 0 && !isLoading

  if (isError) {
    return (
      <TableContainer>
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
      <TableContainer>
        <RowLoading />
        <RowLoading />
      </TableContainer>
    )
  }

  if (empty) {
    return (
      <TableContainer>
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
      <TableContainer>
        {filteredTokens?.map((x) => {
          return (
            <TableRow key={x.token_alias}>
              <TableCell className="w-48">
                <p className="truncate">{x.name}</p>
              </TableCell>
              <TableCell>
                <span className="font-mono text-foreground-light">{x.token_alias}</span>
              </TableCell>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-foreground-light">
                      {dayjs(x.created_at).format('D MMM YYYY')}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Created on {dayjs(x.created_at).format(DATETIME_FORMAT)}</p>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-x-2">
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
