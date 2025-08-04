import { useAccessTokenDeleteMutation } from 'data/access-tokens/access-tokens-delete-mutation'
import { AccessToken, useAccessTokensQuery } from 'data/access-tokens/access-tokens-query'
import { Trash, MoreVertical, View } from 'lucide-react'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  Card,
  CardContent,
  Skeleton,
  cn,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'ui'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui/src/components/shadcn/ui/table'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { ViewTokenPermissionsPanel } from './ViewTokenPermissionsPanel'

export interface AccessTokenListProps {
  searchString?: string
}

const AccessTokenList = ({ searchString = '' }: AccessTokenListProps) => {
  const { data: tokens, isLoading } = useAccessTokensQuery()
  const { mutate: deleteToken } = useAccessTokenDeleteMutation({
    onSuccess: () => {
      toast.success('Successfully deleted access token')
      setIsOpen(false)
    },
  })

  const [isOpen, setIsOpen] = useState(false)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [token, setToken] = useState<AccessToken | undefined>(undefined)

  const onDeleteToken = async (tokenId: number) => deleteToken({ id: tokenId })

  const filteredTokens = useMemo(() => {
    return !searchString
      ? tokens
      : tokens?.filter((token) => {
          return token.name.toLowerCase().includes(searchString.toLowerCase())
        })
  }, [tokens, searchString])

  const empty = filteredTokens?.length === 0 && !isLoading

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
    <Card className={cn('w-full overflow-hidden', !empty && 'bg-surface-100')}>
      <CardContent className="p-0">
        <Table className="p-5 table-auto">
          <TableHeader>
            <TableRow className={cn('bg-200', empty && 'hidden')}>
              <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
                Name
              </TableHead>
              <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
                Token
              </TableHead>
              <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
                Expiry
              </TableHead>
              <TableHead className="text-right font-mono uppercase text-xs text-foreground-lighter h-auto py-2" />
            </TableRow>
          </TableHeader>
          <TableBody className="">{children}</TableBody>
        </Table>
      </CardContent>
    </Card>
  )

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
        <div className="!rounded-b-md overflow-hidden py-12 flex flex-col gap-1 items-center justify-center">
          <p className="text-sm text-foreground">No access tokens found</p>
          <p className="text-sm text-foreground-light">You do not have any tokens created yet</p>
        </div>
      </TableContainer>
    )
  }

  return (
    <>
      <TooltipProvider>
        <TableContainer>
          {filteredTokens?.map((x) => {
            const createdDate = new Date(x.created_at)
            const expiryDate = new Date('2025-07-31T17:16:36')

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
                        {expiryDate.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Expires on {expiryDate.toLocaleDateString('en-GB')},{' '}
                        {expiryDate.toLocaleTimeString('en-GB')}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-x-2">
                    <Button
                      type="default"
                      title="View access"
                      onClick={() => {
                        setIsPanelOpen(true)
                        setToken(x)
                      }}
                    >
                      View access
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
                </TableCell>
              </TableRow>
            )
          })}
        </TableContainer>
      </TooltipProvider>

      <ViewTokenPermissionsPanel
        visible={isPanelOpen}
        token={token}
        onClose={() => {
          setIsPanelOpen(false)
        }}
      />

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
