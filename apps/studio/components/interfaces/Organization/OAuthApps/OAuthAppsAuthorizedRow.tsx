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

import type { OAuthAppOverviewItem } from '@/data/oauth-apps/types'

export interface OAuthAppsAuthorizedRowProps {
  app: OAuthAppOverviewItem
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
          <p className="min-w-0 truncate" title={app.name}>
            {app.name}
          </p>
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

function getStatusVariant(status: OAuthAppOverviewItem['status']) {
  if (status === 'active') return 'success' as const
  return 'warning' as const
}

function getGrantsLabel(app: OAuthAppOverviewItem) {
  if (app.status === 'legacy') return 'Authorized before project controls'
  if (app.member_grant_count === 1) return '1 member grant'
  return `${app.member_grant_count} member grants`
}
