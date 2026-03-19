import { PermissionAction } from '@supabase/shared-types/out/constants'
import { differenceInDays } from 'date-fns'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { MoreVertical, TrashIcon } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

export const StorageCredItem = ({
  description,
  id,
  created_at,
  access_key,
  onDeleteClick,
}: {
  description: string
  id: string
  created_at: string
  access_key: string
  onDeleteClick: (id: string) => void
}) => {
  const { can: canRemoveAccessKey } = useAsyncCheckPermissions(
    PermissionAction.STORAGE_ADMIN_WRITE,
    '*'
  )

  function daysSince(date: string) {
    const now = new Date()
    const created = new Date(date)
    const diffInDays = differenceInDays(now, created)

    if (diffInDays === 0) {
      return 'Today'
    } else if (diffInDays === 1) {
      return `${diffInDays} day ago`
    } else {
      return `${diffInDays} days ago`
    }
  }

  return (
    <TableRow className="h-8 text-ellipsis group">
      <TableCell>
        <span className="text-foreground">{description}</span>
      </TableCell>
      <TableCell>
        <Input readOnly copy value={access_key} className="font-mono" />
      </TableCell>
      <TableCell className="text-foreground-lighter whitespace-nowrap">
        {daysSince(created_at)}
      </TableCell>
      <TableCell className="text-right">
        {canRemoveAccessKey && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                icon={<MoreVertical size={14} strokeWidth={1} />}
                type="text"
                className="px-1.5 text-foreground-lighter hover:text-foreground"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-w-40" align="end">
              <DropdownMenuItem
                className="flex gap-1.5 "
                onClick={(e) => {
                  e.preventDefault()
                  onDeleteClick(id)
                }}
              >
                <TrashIcon size="14" />
                Revoke key
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  )
}
