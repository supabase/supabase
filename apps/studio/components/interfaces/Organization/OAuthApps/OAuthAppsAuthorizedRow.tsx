import { TableCell, TableRow } from 'ui'

import type { OAuthApprovalItem } from '@/data/oauth-apps/types'

export interface OAuthAppsAuthorizedRowProps {
  app: OAuthApprovalItem
}

export const OAuthAppsAuthorizedRow = ({ app }: OAuthAppsAuthorizedRowProps) => {
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
      <TableCell>{app.org_grant ? 'Organization' : 'Members'}</TableCell>
    </TableRow>
  )
}
