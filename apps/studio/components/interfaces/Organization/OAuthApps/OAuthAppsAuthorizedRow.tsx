import { TableCell, TableRow } from 'ui'

import type { OAuthApprovalItem, OAuthApprovalTarget } from '@/data/oauth-apps/types'

export interface OAuthAppsAuthorizedRowProps {
  approval: OAuthApprovalItem
  className?: string
}

export const OAuthAppsAuthorizedRow = ({ approval, className }: OAuthAppsAuthorizedRowProps) => {
  return (
    <TableRow className={className}>
      <TableCell className="pr-2">
        <div
          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-control bg-cover bg-center bg-no-repeat text-xs"
          style={{ backgroundImage: approval.app.icon ? `url('${approval.app.icon}')` : 'none' }}
        >
          {!!approval.app.icon ? '' : approval.app.name[0]}
        </div>
      </TableCell>
      <TableCell className="pl-0">
        <div>
          <p className="min-w-0 truncate" title={approval.app.name}>
            {approval.app.name}
          </p>
          <p className="min-w-0 text-foreground-lighter font-mono">{approval.app.id}</p>
        </div>
      </TableCell>
      <TableCell>{getGrantTargetLabel(approval.grant_target)}</TableCell>
    </TableRow>
  )
}

const getGrantTargetLabel = (target: OAuthApprovalTarget) => {
  if (target === 'members') return 'Members'
  if (target === 'organization') return 'Organization'
  return 'Organization & members'
}
