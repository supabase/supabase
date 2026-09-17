import { MoreVertical } from 'lucide-react'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from 'ui'

import type {
  OAuthAuthorizedApp,
  OAuthAuthorizedAppStatus,
} from '@/data/oauth-apps/oauth-apps-authorized-apps-query'

export interface OAuthAppsAuthorizedRowProps {
  app: OAuthAuthorizedApp
  canRevoke: boolean
  onSelectViewGrants: () => void
  onSelectRevoke: () => void
}

export const OAuthAppsAuthorizedRow = ({
  app,
  canRevoke,
  onSelectViewGrants,
  onSelectRevoke,
}: OAuthAppsAuthorizedRowProps) => {
  const showRevoke = canRevoke && app.status === 'active'

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-x-3">
          <div
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-control bg-cover bg-center bg-no-repeat text-xs"
            style={{ backgroundImage: app.icon ? `url('${app.icon}')` : 'none' }}
          >
            {!!app.icon ? '' : app.name[0]}
          </div>
          <div className="min-w-0">
            <p className="truncate" title={app.name}>
              {app.name}
            </p>
            <p className="truncate font-mono text-xs text-foreground-lighter" title={app.client_id}>
              {app.client_id}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={getStatusVariant(app.status)}>{app.status.toUpperCase()}</Badge>
      </TableCell>
      <TableCell>{getGrantsLabel(app)}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button icon={<MoreVertical />} className="px-1" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" className="w-40">
            <DropdownMenuItem onClick={onSelectViewGrants}>View grants</DropdownMenuItem>
            {showRevoke && (
              <DropdownMenuItem className="text-destructive" onClick={onSelectRevoke}>
                Revoke
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

function getStatusVariant(status: OAuthAuthorizedAppStatus) {
  if (status === 'active') return 'success' as const
  if (status === 'legacy') return 'warning' as const
  return 'default' as const
}

function getGrantsLabel(app: OAuthAuthorizedApp) {
  if (app.status === 'legacy') return 'Authorized before project controls'
  if (app.member_grant_count === 1) return '1 member grant'
  return `${app.member_grant_count} member grants`
}
