import { MoreVerticalIcon } from 'lucide-react'
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

import { OAuthAppsMemberGrantsDialogContent } from './OAuthAppsMemberGrantsDialogContent'
import { OAuthAppsRevokeDialogContent } from './OAuthAppsRevokeDialogContent'
import type { OAuthApprovalItem, OAuthApprovalTarget } from '@/data/oauth-apps/types'

export interface OAuthAppsAuthorizedRowProps {
  approval: OAuthApprovalItem
}

export const OAuthAppsAuthorizedRow = ({ approval }: OAuthAppsAuthorizedRowProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogContent, setDialogContent] = useState<'grants' | 'revoke' | null>(null)
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null)

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-x-3">
          <div
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-control bg-cover bg-center bg-no-repeat text-xs"
            style={{ backgroundImage: approval.app.icon ? `url('${approval.app.icon}')` : 'none' }}
          >
            {!!approval.app.icon ? '' : approval.app.name[0]}
          </div>
          <p className="min-w-0 truncate" title={approval.app.name}>
            {approval.app.name}
          </p>
        </div>
      </TableCell>
      <TableCell>{getGrantTargetLabel(approval.grant_target)}</TableCell>
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
                    icon={<MoreVerticalIcon />}
                    className="px-1"
                    aria-label="Manage app"
                    aria-describedby={undefined}
                  />
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Manage app</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" side="bottom" className="w-40">
              <DialogTrigger asChild>
                <DropdownMenuItem onClick={() => setDialogContent('grants')}>
                  View grants
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogTrigger asChild>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDialogContent('revoke')}
                >
                  Disconnect
                </DropdownMenuItem>
              </DialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          {dialogContent === 'grants' && <OAuthAppsMemberGrantsDialogContent approval={approval} />}
          {dialogContent === 'revoke' && (
            <OAuthAppsRevokeDialogContent
              approval={approval}
              onClose={() => setDialogContent(null)}
            />
          )}
        </Dialog>
      </TableCell>
    </TableRow>
  )
}

const getGrantTargetLabel = (target: OAuthApprovalTarget) => {
  if (target === 'members') return 'Members'
  if (target === 'organization') return 'Organization'
  return 'Organization & members'
}
