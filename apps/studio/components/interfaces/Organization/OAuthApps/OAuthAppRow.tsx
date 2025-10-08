import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Edit, MoreVertical, Trash } from 'lucide-react'

import Table from 'components/to-be-cleaned/Table'
import CopyButton from 'components/ui/CopyButton'
import type { OAuthApp } from 'data/oauth/oauth-apps-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'

export interface OAuthAppRowProps {
  app: OAuthApp
  onSelectEdit: () => void
  onSelectDelete: () => void
}

export const OAuthAppRow = ({ app, onSelectEdit, onSelectDelete }: OAuthAppRowProps) => {
  const { can: canUpdateOAuthApps } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'approved_oauth_apps'
  )
  const { can: canDeleteOAuthApps } = useAsyncCheckPermissions(
    PermissionAction.DELETE,
    'approved_oauth_apps'
  )

  return (
    <Table.tr>
      <Table.td>
        <div
          className="w-[30px] h-[30px] rounded-full bg-no-repeat bg-cover bg-center border border-control flex items-center justify-center"
          style={{ backgroundImage: app.icon ? `url('${app.icon}')` : 'none' }}
        >
          {!!app.icon ? '' : `${app.name[0]}`}
        </div>
      </Table.td>
      <Table.td>
        <p title={app.name} className="truncate">
          {app.name}
        </p>
      </Table.td>
      <Table.td>
        <div className="flex items-center gap-x-2">
          <p className="font-mono truncate" title={app.client_id}>
            {app.client_id}
          </p>
          <CopyButton type="default" iconOnly text={app.client_id ?? ''} className="px-1" />
        </div>
      </Table.td>
      <Table.td>
        <TimestampInfo
          utcTimestamp={app.created_at ?? ''}
          labelFormat="DD/MM/YYYY, HH:mm:ss"
          className="text-sm"
        />
      </Table.td>
      <Table.td align="right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="default" icon={<MoreVertical />} className="px-1" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" className="w-32">
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuItem
                  key="edit"
                  disabled={!canUpdateOAuthApps}
                  className="space-x-2 !pointer-events-auto"
                  onClick={() => {
                    if (canUpdateOAuthApps) onSelectEdit()
                  }}
                >
                  <Edit size={16} />
                  <p>Edit app</p>
                </DropdownMenuItem>
              </TooltipTrigger>
              {!canUpdateOAuthApps && (
                <TooltipContent side="left">
                  You need additional permissions to edit apps
                </TooltipContent>
              )}
            </Tooltip>
            <DropdownMenuSeparator />
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuItem
                  disabled={!canDeleteOAuthApps}
                  className="space-x-2 !pointer-events-auto"
                  key="delete"
                  onClick={() => {
                    if (canDeleteOAuthApps) onSelectDelete()
                  }}
                >
                  <Trash size={16} />
                  <p>Delete app</p>
                </DropdownMenuItem>
              </TooltipTrigger>
              {!canDeleteOAuthApps && (
                <TooltipContent side="left">
                  You need additional permissions to delete apps
                </TooltipContent>
              )}
            </Tooltip>
          </DropdownMenuContent>
        </DropdownMenu>
      </Table.td>
    </Table.tr>
  )
}
