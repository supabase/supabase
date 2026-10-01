import { TableCell, TableRow } from 'ui'

import type { OAuthApprovalItem } from '@/data/oauth-apps/types'

export interface OAuthAppsAuthorizedRowProps {
  approval: OAuthApprovalItem
}

export const OAuthAppsAuthorizedRow = ({ approval }: OAuthAppsAuthorizedRowProps) => {
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
      <TableCell>{approval.org_grant ? 'Organization' : 'Members'}</TableCell>
    </TableRow>
  )
}
