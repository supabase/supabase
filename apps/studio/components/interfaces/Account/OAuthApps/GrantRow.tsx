import { MoreVertical } from 'lucide-react'
import { useRef, useState } from 'react'
import {
  Button,
  Dialog,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { GrantDisconnectDialogContent } from './GrantDisconnectDialogContent'
import { GrantProjectsDialogContent } from './GrantProjectsDialogContent'
import type { MemberOauthGrantItem } from '@/data/oauth-apps/types'

export interface OAuthAppsAuthorizedRowProps {
  grant: MemberOauthGrantItem
}

export const GrantRow = ({ grant }: OAuthAppsAuthorizedRowProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogContent, setDialogContent] = useState<'projects' | 'disconnect' | null>(null)
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null)
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-x-3">
          <div
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-control bg-cover bg-center bg-no-repeat text-xs"
            style={{ backgroundImage: grant.app.icon ? `url('${grant.app.icon}')` : 'none' }}
          >
            {!!grant.app.icon ? '' : grant.app.name[0]}
          </div>
          <div className="flex flex-col">
            <p className="min-w-0 truncate" title={grant.app.name}>
              {grant.app.name}
            </p>
            <p className="min-w-0 text-foreground-lighter">
              {grant.projects?.length ?? 'All'}{' '}
              {grant.projects?.length === 1 ? 'project' : 'projects'}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>{grant.organization.name}</TableCell>
      <TableCell>
        <TimestampInfo
          utcTimestamp={grant.approved_at ?? ''}
          labelFormat="DD/MM/YYYY, HH:mm:ss"
          className="text-sm"
        />
      </TableCell>
      <TableCell className="text-right">
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            // When users close the dialogs, we need to restore the focus on the menu button
            // Done in a setTimeout because the dialog tries to restore focus on the trigger despite onCloseAutoFocus being cancelled in the dialog contents
            setTimeout(() => {
              if (!open && menuTriggerRef.current) {
                menuTriggerRef.current.focus()
              }
            })
          }}
        >
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    ref={menuTriggerRef}
                    icon={<MoreVertical />}
                    className="px-1"
                    aria-label="Manage app"
                    aria-describedby={undefined}
                  />
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Manage app</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" side="bottom" className="w-40">
              {grant.projects != null && (
                <DialogTrigger asChild>
                  <DropdownMenuItem onClick={() => setDialogContent('projects')}>
                    View projects
                  </DropdownMenuItem>
                </DialogTrigger>
              )}
              <DialogTrigger asChild>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDialogContent('disconnect')}
                >
                  Disconnect
                </DropdownMenuItem>
              </DialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          {dialogContent === 'projects' && <GrantProjectsDialogContent grant={grant} />}
          {dialogContent === 'disconnect' && (
            <GrantDisconnectDialogContent grant={grant} onClose={() => setIsDialogOpen(false)} />
          )}
        </Dialog>
      </TableCell>
    </TableRow>
  )
}
