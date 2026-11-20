import { LockIcon, MoreVerticalIcon, XIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import {
  Button,
  Dialog,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from 'ui'

import type { OAuthAppDatabaseAccess } from './OAuthAppsAuthorizedPreview'
import { OAuthAppsMemberGrantsDialogContent } from './OAuthAppsMemberGrantsDialogContent'
import { OAuthAppsRevokeDialogContent } from './OAuthAppsRevokeDialogContent'
import { OAuthApproval, OAuthApprovalTarget } from '@/data/oauth-apps/oauth-apps-approvals-query'

export interface OAuthAppsAuthorizedRowProps {
  approval: OAuthApproval
  className?: string
  canRevoke: boolean
  databaseAccess?: OAuthAppDatabaseAccess
  previewScopes?: string[]
}

export const OAuthAppsAuthorizedRow = ({
  approval,
  className,
  canRevoke,
  databaseAccess,
  previewScopes,
}: OAuthAppsAuthorizedRowProps) => {
  const isPreview = previewScopes != null
  const permissionCount = (previewScopes?.length ?? 0) + Number(databaseAccess != null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogContent, setDialogContent] = useState<'grants' | 'revoke' | null>(null)
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null)

  return (
    <TableRow className={className}>
      <TableCell className="pr-2">
        <div
          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-control bg-cover bg-center bg-no-repeat text-xs"
          style={{
            backgroundImage: approval.attributes.app.icon
              ? `url('${approval.attributes.app.icon}')`
              : 'none',
          }}
        >
          {!!approval.attributes.app.icon ? '' : approval.attributes.app.name[0]}
        </div>
      </TableCell>
      <TableCell className="pl-0">
        <div>
          <p className="min-w-0 truncate" title={approval.attributes.app.name}>
            {approval.attributes.app.name}
          </p>
          {!isPreview && <p className="min-w-0 text-foreground-lighter font-mono">{approval.id}</p>}
        </div>
      </TableCell>
      <TableCell>{getGrantTargetLabel(approval.attributes.target)}</TableCell>
      {isPreview && (
        <TableCell className="min-w-40 whitespace-normal">
          <p>
            {permissionCount} {permissionCount === 1 ? 'permission' : 'permissions'}
          </p>
          {databaseAccess && (
            <p className="text-xs text-foreground-light">Table data · {databaseAccess.mode}</p>
          )}
        </TableCell>
      )}
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
            <DropdownMenuTrigger asChild>
              <Button
                ref={menuTriggerRef}
                icon={<MoreVerticalIcon />}
                className="px-1"
                aria-label="Manage app"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="w-40">
              <DialogTrigger asChild>
                <DropdownMenuItem
                  className="gap-x-2 transition-none"
                  onClick={() => setDialogContent('grants')}
                >
                  <LockIcon size={14} />
                  View grants
                </DropdownMenuItem>
              </DialogTrigger>
              {canRevoke && <DropdownMenuSeparator />}
              {canRevoke && (
                <DialogTrigger asChild>
                  <DropdownMenuItem
                    className="gap-x-2 transition-none"
                    onClick={() => setDialogContent('revoke')}
                  >
                    <XIcon size={14} />
                    Revoke grants
                  </DropdownMenuItem>
                </DialogTrigger>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {dialogContent === 'grants' && (
            <OAuthAppsMemberGrantsDialogContent
              approval={approval}
              previewScopes={previewScopes}
              databaseAccess={databaseAccess}
              onCloseAutoFocus={preventDefault}
            />
          )}
          {dialogContent === 'revoke' && (
            <OAuthAppsRevokeDialogContent
              approval={approval}
              databaseAccess={databaseAccess}
              isPreview={isPreview}
              onClose={() => setDialogContent(null)}
              onCloseAutoFocus={preventDefault}
            />
          )}
        </Dialog>
      </TableCell>
    </TableRow>
  )
}

const preventDefault = (event: Event) => {
  event.preventDefault()
}

const getGrantTargetLabel = (target: OAuthApprovalTarget) => {
  if (target === 'members') return 'Members'
  if (target === 'organization') return 'Organization'
  return 'Organization & members'
}
