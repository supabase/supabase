import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { Check, Clipboard, Edit, MoreVertical, Trash } from 'lucide-react'
import { useState } from 'react'

import Table from 'components/to-be-cleaned/Table'
import type { OAuthApp } from 'data/oauth/oauth-apps-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { copyToClipboard } from 'lib/helpers'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'

export interface OAuthAppRowProps {
  app: OAuthApp
  onSelectEdit: () => void
  onSelectDelete: () => void
}

const OAuthAppRow = ({ app, onSelectEdit, onSelectDelete }: OAuthAppRowProps) => {
  const [isCopied, setIsCopied] = useState(false)

  const canUpdateOAuthApps = useCheckPermissions(PermissionAction.UPDATE, 'approved_oauth_apps')
  const canDeleteOAuthApps = useCheckPermissions(PermissionAction.DELETE, 'approved_oauth_apps')

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
        <div className="flex items-center">
          <p className="font-mono truncate w-[220px]" title={app.client_id}>
            {app.client_id}
          </p>
          <Button
            type="default"
            icon={isCopied ? <Check className="text-brand" strokeWidth={3} /> : <Clipboard />}
            className="ml-2 px-1"
            onClick={() => {
              copyToClipboard(app.client_id)
              setIsCopied(true)
              setTimeout(() => {
                setIsCopied(false)
              }, 3000)
            }}
          />
        </div>
      </Table.td>
      <Table.td>
        <span className="font-mono" title={app.client_secret_alias}>
          {app.client_secret_alias}...
        </span>
      </Table.td>
      <Table.td>{dayjs(app.created_at).format('DD/MM/YYYY, HH:mm:ss')}</Table.td>
      <Table.td align="right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="default" icon={<MoreVertical />} className="px-1" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom">
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
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
              </TooltipTrigger_Shadcn_>
              {!canUpdateOAuthApps && (
                <TooltipContent_Shadcn_ side="left">
                  You need additional permissions to edit apps
                </TooltipContent_Shadcn_>
              )}
            </Tooltip_Shadcn_>
            <DropdownMenuSeparator />
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
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
              </TooltipTrigger_Shadcn_>
              {!canDeleteOAuthApps && (
                <TooltipContent_Shadcn_ side="left">
                  You need additional permissions to delete apps
                </TooltipContent_Shadcn_>
              )}
            </Tooltip_Shadcn_>
          </DropdownMenuContent>
        </DropdownMenu>
      </Table.td>
    </Table.tr>
  )
}

export default OAuthAppRow
