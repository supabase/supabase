import AlertError from 'components/ui/AlertError'
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

const tableHeaderClass = 'text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2'

const TableContainer = ({ children, columns }: { children: React.ReactNode; columns: TableColumn<any>[] }) => (
  <Card className="w-full overflow-hidden">
    <CardContent className="p-0">
      <Table className="p-5 table-auto">
        <TableHeader>
          <TableRow className="bg-200">
            {columns.map((column) => (
              <TableHead key={column.key} className={cn(tableHeaderClass, column.className)}>
                {column.label}
              </TableHead>
            ))}
            <TableHead className={cn(tableHeaderClass, '!text-right')} />
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </CardContent>
  </Card>
)

export interface TableColumn<T> {
  key: string
  label: string
  render: (token: T) => React.ReactNode
  className?: string
}

export interface AccessTokenTableProps<T> {
  searchString?: string
  onDeleteSuccess: (id: string | number) => void
  tokens: T[] | undefined
  error: any
  isLoading: boolean
  isError: boolean
  deleteMutation: any
  getTokenId: (token: T) => string | number
  getTokenName: (token: T) => string
  columns: TableColumn<T>[]
  emptyMessage?: string
  emptyDescription?: string
}

export const AccessTokenTable = <T,>({
  searchString = '',
  onDeleteSuccess,
  tokens,
  error,
  isLoading,
  isError,
  deleteMutation,
  getTokenId,
  getTokenName,
  columns,
  emptyMessage = 'No access tokens found',
  emptyDescription = 'You do not have any tokens created yet',
}: AccessTokenTableProps<T>) => {
  const [isOpen, setIsOpen] = useState(false)
  const [token, setToken] = useState<T | undefined>(undefined)

  const { mutate: deleteToken } = deleteMutation({
    onSuccess: (_: any, vars: any) => {
      onDeleteSuccess(vars.id)
      toast.success('Successfully deleted access token')
      setIsOpen(false)
    },
    onError: (error: any) => {
      toast.error(`Failed to delete access token: ${error.message}`)
    },
  })

  const onDeleteToken = async (tokenId: string | number) => {
    deleteToken({ id: tokenId })
  }

  const filteredTokens = useMemo(() => {
    return !searchString
      ? tokens
      : tokens?.filter((token) => {
          return getTokenName(token).toLowerCase().includes(searchString.toLowerCase())
        })
  }, [tokens, searchString, getTokenName])

  const empty = filteredTokens?.length === 0 && !isLoading

  if (isError) {
    return (
      <TableContainer columns={columns}>
        <TableRow>
          <TableCell colSpan={columns.length + 1} className="p-0">
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
      <TableContainer columns={columns}>
        <RowLoading />
        <RowLoading />
      </TableContainer>
    )
  }

  if (empty) {
    return (
      <TableContainer columns={columns}>
        <TableRow>
          <TableCell colSpan={columns.length + 1} className="py-12">
            <p className="text-sm text-center text-foreground">{emptyMessage}</p>
            <p className="text-sm text-center text-foreground-light">{emptyDescription}</p>
          </TableCell>
        </TableRow>
      </TableContainer>
    )
  }

  return (
    <>
      <TableContainer columns={columns}>
        {filteredTokens?.map((token) => {
          const tokenId = getTokenId(token)
          const tokenName = getTokenName(token)

          return (
            <TableRow key={tokenId}>
              {columns.map((column) => (
                <TableCell key={column.key} className={column.className}>
                  {column.render(token)}
                </TableCell>
              ))}
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
                          setToken(token)
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
          if (token) onDeleteToken(getTokenId(token))
        }}
      >
        <p className="py-4 text-sm text-foreground-light">
          This action cannot be undone. Are you sure you want to delete "{token ? getTokenName(token) : ''}" token?
        </p>
      </ConfirmationModal>
    </>
  )
}
