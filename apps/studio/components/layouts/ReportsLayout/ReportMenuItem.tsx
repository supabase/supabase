import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronDown, Edit2, Trash } from 'lucide-react'
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

export const ReportMenuItem = ({
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
    <Menu.Item active={item.key === pageKey}>
      <div className="flex w-full items-center justify-between gap-1">
        <span className="truncate">{item.name}</span>

        {canUpdateCustomReport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="text"
                className="px-1 opacity-50 hover:opacity-100"
                icon={<ChevronDown size={12} strokeWidth={2} />}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-32 *:gap-x-2">
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
