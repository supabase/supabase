import { Fragment, type ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { formatPermissionName } from './OAuthAppsAuthorizeScreen.utils'
import { TOOLTIP_UNDERLINE_CLASS_NAME } from '@/components/ui/tooltip-styles'

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
      <h3 className="font-mono text-xs! uppercase text-foreground-light font-normal!">{label}</h3>
      <p className="text-xs font-medium text-foreground">
        {permissions.map((permission, index) => (
          <Fragment key={permission}>
            {index > 0 && <span>, </span>}
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
}

export function ScopePermissionLabel({ permission }: { permission: string }) {
  const label = formatPermissionName(permission)
  const description = permissionDescriptions[permission]
  if (!description) return label

  return (
    <Tooltip>
      <TooltipTrigger className={TOOLTIP_UNDERLINE_CLASS_NAME}>{label}</TooltipTrigger>
      <TooltipContent className="max-w-60">{description}</TooltipContent>
    </Tooltip>
  )
}
