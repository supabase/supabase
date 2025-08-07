import { PermissionAction } from '@supabase/shared-types/out/constants'
import { differenceInDays } from 'date-fns'
import { MoreVertical, TrashIcon } from 'lucide-react'

import CopyButton from 'components/ui/CopyButton'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

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
  const canRemoveAccessKey = useCheckPermissions(PermissionAction.STORAGE_ADMIN_WRITE, '*')

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
    <tr className="h-8 text-ellipsis group">
      <td>
        <span className="text-foreground">{description}</span>
      </td>
      <td>
        <div className="flex items-center justify-between">
          <span className="text-ellipsis font-mono cursor-default">{access_key}</span>
          <span className="w-24 text-right opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton text={access_key} type="default" />
          </span>
        </div>
      </td>
      <td>{daysSince(created_at)}</td>
      <td className="text-right">
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
      </td>
    </tr>
  )
}
