import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronDown, Edit2, Trash } from 'lucide-react'
import Link from 'next/link'

import { ContentBase } from 'data/content/content-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useProfile } from 'lib/profile'
import { Dashboards } from 'types'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

interface ReportMenuItemProps {
  item: {
    id?: string
    name: string
    description: string
    key: string
    url: string
    hasDropdownActions: boolean
    report: ContentBase & {
      type: 'report'
      content: Dashboards.Content
    }
  }
  pageKey: string
  onSelectEdit: () => void
  onSelectDelete: () => void
}

export const ReportMenuItem = ({
  item,
  pageKey,
  onSelectEdit,
  onSelectDelete,
}: ReportMenuItemProps) => {
  const { profile } = useProfile()
  const canUpdateCustomReport = useCheckPermissions(PermissionAction.UPDATE, 'user_content', {
    resource: {
      type: 'report',
      visibility: item.report.visibility,
      owner_id: item.report.owner_id,
    },
    subject: { id: profile?.id },
  })

  return (
    <Link
      className={cn(
        'pr-2 h-7 pl-3 mt-1 text-foreground-light group-hover:text-foreground/80 text-sm',
        'flex items-center justify-between rounded-md group relative',
        item.key === pageKey ? 'bg-surface-300 text-foreground' : 'hover:bg-surface-200'
      )}
      key={item.key + '-menukey'}
      href={item.url}
    >
      <div>{item.name}</div>

      {canUpdateCustomReport && (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              type="text"
              className="px-1 opacity-50 hover:opacity-100"
              icon={<ChevronDown size={12} strokeWidth={2} />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 *:space-x-2">
            <DropdownMenuItem
              onClick={() => {
                if (!item.id) return
                onSelectEdit()
              }}
            >
              <Edit2 size={12} />
              <div>Rename</div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                if (!item.id) return
                onSelectDelete()
              }}
            >
              <Trash size={12} />
              <div>Delete</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </Link>
  )
}
