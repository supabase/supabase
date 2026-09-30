import { ReactNode } from 'react'

import { formatPermissionName } from './OAuthAppsAuthorizeScreen.utils'

export const ScopeGroupCardItem = ({
  label,
  permissions,
}: {
  label: ReactNode
  permissions: string[]
}) => {
  if (permissions.length === 0) return null
  return (
    <div className="flex flex-col gap-2 py-3">
      <p className="font-mono text-[11px] uppercase tracking-wider text-foreground-light">
        {label}
      </p>
      <p className="text-xs font-medium text-foreground">
        {permissions.map((permission) => formatPermissionName(permission)).join(', ')}
      </p>
    </div>
  )
}
