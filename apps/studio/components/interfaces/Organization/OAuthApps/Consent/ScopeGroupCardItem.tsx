import { Fragment, type ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

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
      <p className="font-mono text-xs uppercase text-foreground-light">{label}</p>
      <p className="text-xs font-medium text-foreground">
        {permissions.map((permission, index) => (
          <Fragment key={permission}>
            {index > 0 && ', '}
            <ScopePermissionLabel permission={permission} />
          </Fragment>
        ))}
      </p>
    </div>
  )
}

const permissionDescriptions: Partial<Record<string, string>> = {
  database: 'Access database settings. Write access also allows the app to run SQL.',
  environment: 'Access project branches.',
  table_data: 'Connect directly to Postgres to access table data.',
}

export function ScopePermissionLabel({ permission }: { permission: string }) {
  const label = formatPermissionName(permission)
  const description = permissionDescriptions[permission]
  if (!description) return label

  return (
    <Tooltip>
      <TooltipTrigger className="underline decoration-dotted underline-offset-4">
        {label}
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-60">
        {description}
      </TooltipContent>
    </Tooltip>
  )
}
