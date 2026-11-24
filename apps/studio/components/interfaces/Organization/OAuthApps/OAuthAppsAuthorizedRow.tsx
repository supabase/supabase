import { EyeIcon, MoreVerticalIcon, XIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import {
  AlertDialog,
  Button,
  Dialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from 'ui'

import type { OAuthAppDatabaseAccess, PreviewGrant } from './OAuthAppsAuthorizedPreview'
import { OAuthAppsMemberGrantsDialogContent } from './OAuthAppsMemberGrantsDialogContent'
import { OAuthAppsRevokeDialogContent } from './OAuthAppsRevokeDialogContent'
import { OAuthApproval, OAuthApprovalTarget } from '@/data/oauth-apps/oauth-apps-approvals-query'

export interface OAuthAppsAuthorizedRowProps {
  approval: OAuthApproval
  className?: string
  canRevoke: boolean
  databaseAccess?: OAuthAppDatabaseAccess
  previewGrants?: PreviewGrant[]
  previewScopes?: string[]
  previewProjects?: { name: string; ref: string }[]
}

export const OAuthAppsAuthorizedRow = ({
  approval,
  className,
  canRevoke,
  databaseAccess,
  previewScopes,
  previewGrants,
  previewProjects,
}: OAuthAppsAuthorizedRowProps) => {
  const isPreview = previewScopes != null
  const permissionCount =
    new Set(previewScopes?.map((scope) => scope.split(':')[0])).size +
    Number(databaseAccess != null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogContent, setDialogContent] = useState<'grants' | 'revoke' | null>(null)
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null)

  const AccessRoot = dialogContent === 'revoke' ? AlertDialog : Dialog
  const openAccess = () => {
    setDialogContent('grants')
    setIsDialogOpen(true)
  }

  return (
    <TableRow
      className={`cursor-pointer ${className ?? ''}`}
      onClick={(event) => {
        if (
          event.target instanceof Element &&
          (!event.currentTarget.contains(event.target) ||
            event.target.closest('button, a, [role="dialog"], [role="menu"]'))
        )
          return
        openAccess()
      }}
    >
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
          <button
            type="button"
            className="min-w-0 truncate text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={openAccess}
          >
            {approval.attributes.app.name}
          </button>
          {!isPreview && <p className="min-w-0 text-foreground-lighter font-mono">{approval.id}</p>}
        </div>
      </TableCell>
      <TableCell>
        {previewGrants ? (
          <>
            <p>
              {previewGrants.some((grant) => grant.projects == null)
                ? 'All projects'
                : `${new Set(previewGrants.flatMap((grant) => grant.projects?.map((project) => project.ref) ?? [])).size} projects`}
            </p>
            <p className="text-sm text-foreground-lighter">Varies by grant</p>
          </>
        ) : isPreview ? (
          previewProjects ? (
            `${previewProjects.length} ${previewProjects.length === 1 ? 'project' : 'projects'}`
          ) : (
            'All projects'
          )
        ) : (
          getGrantTargetLabel(approval.attributes.target)
        )}
      </TableCell>
      {isPreview && (
        <TableCell className="min-w-40 whitespace-normal">
          <p>
            {previewGrants
              ? `${new Set(previewGrants.flatMap((grant) => [...grant.scopes.map((scope) => scope.split(':')[0]), ...(grant.databaseAccess ? ['table_data'] : [])])).size} permissions`
              : `${permissionCount} ${permissionCount === 1 ? 'permission' : 'permissions'}`}

            {(databaseAccess ||
              previewScopes?.includes('database:write') ||
              previewGrants?.some(
                (grant) => grant.databaseAccess || grant.scopes.includes('database:write')
              )) &&
              ' including database access'}
          </p>
          {previewGrants && <p className="text-sm text-foreground-lighter">Varies by grant</p>}
        </TableCell>
      )}
      <TableCell className="text-right">
        <AccessRoot
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
              <DropdownMenuItem className="gap-x-2" onSelect={openAccess}>
                <EyeIcon size={14} />
                View access
              </DropdownMenuItem>

              {canRevoke && <DropdownMenuSeparator />}
              {canRevoke && (
                <DropdownMenuItem
                  className="gap-x-2"
                  onSelect={() => {
                    setDialogContent('revoke')
                    setIsDialogOpen(true)
                  }}
                >
                  <XIcon size={14} />
                  Revoke access
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {dialogContent === 'grants' && (
            <OAuthAppsMemberGrantsDialogContent
              approval={approval}
              previewScopes={previewScopes}
              previewGrants={previewGrants}
              previewProjects={previewProjects}
              databaseAccess={databaseAccess}
              onRevoke={
                canRevoke
                  ? () => {
                      setDialogContent('revoke')
                      setIsDialogOpen(true)
                    }
                  : undefined
              }
              onCloseAutoFocus={preventDefault}
            />
          )}
          {dialogContent === 'revoke' && (
            <OAuthAppsRevokeDialogContent
              approval={approval}
              databaseAccess={
                databaseAccess ??
                previewGrants?.find((grant) => grant.databaseAccess)?.databaseAccess
              }
              isPreview={isPreview}
              projects={previewProjects}
              onClose={() => setDialogContent(null)}
              onCloseAutoFocus={preventDefault}
            />
          )}
        </AccessRoot>
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
