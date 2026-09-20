import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Edit2, MoreVertical, Trash } from 'lucide-react'
import Link from 'next/link'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Menu,
} from 'ui'

import { ContentBase } from '@/data/content/content-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useProfile } from '@/lib/profile'
import type { Dashboards } from '@/types'

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

export const ObservabilityMenuItem = ({
  item,
  pageKey,
  onSelectEdit,
  onSelectDelete,
}: ReportMenuItemProps) => {
  const { profile } = useProfile()
  const { can: canUpdateCustomReport } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'user_content',
    {
      resource: {
        type: 'report',
        visibility: item.report.visibility,
        owner_id: item.report.owner_id,
      },
      subject: { id: profile?.id },
    }
  )

  const menuItem = (
    <Menu.Item active={item.key === pageKey} className="pr-2.5">
      <div className="flex w-full items-center justify-between gap-1">
        <p className="truncate w-full">{item.name}</p>

        {canUpdateCustomReport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="More actions"
                variant="text"
                className="px-0.5 h-[20px] opacity-50 hover:opacity-100"
                icon={<MoreVertical size={12} strokeWidth={2} />}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44 *:gap-x-2">
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (!item.id) return
                  onSelectEdit()
                }}
              >
                <Edit2 size={12} />
                <div>Rename report</div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (!item.id) return
                  onSelectDelete()
                }}
              >
                <Trash size={12} />
                <div>Delete report</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Menu.Item>
  )

  return (
    <Link key={item.key + '-menukey'} href={item.url} className="block">
      {menuItem}
    </Link>
  )
}
