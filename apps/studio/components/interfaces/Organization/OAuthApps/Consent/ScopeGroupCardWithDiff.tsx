import { capitalize } from 'lodash'
import { ChevronsUpDownIcon } from 'lucide-react'
import { ReactNode, useMemo } from 'react'
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'

import {
  DiffScopePermission,
  formatPermissionName,
  getDiffBetweenScopes,
  ScopeGroupLevel,
} from './OAuthAppsAuthorizeScreen.utils'
import { ScopeGroupCardItem } from './ScopeGroupCardItem'
import type { OAuthScope } from '@/data/oauth-apps/types'

export interface ScopeGroupCardProps {
  scopes: OAuthScope[]
  previousScopes: OAuthScope[]
}

export const ScopeGroupCardWithDiff = ({ scopes, previousScopes }: ScopeGroupCardProps) => {
  const diff = useMemo(
    () => getDiffBetweenScopes({ scopes, previousScopes }),
    [scopes, previousScopes]
  )

  const unchangedPermissionsCount =
    diff.unchanged['read-write'].length +
    diff.unchanged['write'].length +
    diff.unchanged['read'].length

  return (
    <>
      <div className="divide-y rounded-md border bg-surface-75 px-4">
        <DiffScopeGroupItem
          label="READ-WRITE"
          level="read-write"
          permissions={diff.changed['read-write']}
        />
        <DiffScopeGroupItem label="WRITE" level="write" permissions={diff.changed['write']} />
        <DiffScopeGroupItem label="READ" level="read" permissions={diff.changed['read']} />
        <DiffScopeGroupItem
          label="REMOVED"
          level={undefined}
          permissions={diff.changed['removed']}
        />
      </div>
      <Collapsible className="flex flex-col gap-2">
        <CollapsibleTrigger asChild>
          <Button
            block
            iconRight={<ChevronsUpDownIcon className="h-4 w-4" />}
            variant="text"
            size="tiny"
            className="p-0 flex justify-center text-foreground-lighter"
          >
            <span>Already granted ({unchangedPermissionsCount})</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="divide-y rounded-md border bg-surface-75 px-4">
            <ScopeGroupCardItem label="READ-WRITE" permissions={diff.unchanged['read-write']} />
            <ScopeGroupCardItem label="WRITE" permissions={diff.unchanged['write']} />
            <ScopeGroupCardItem label="READ" permissions={diff.unchanged['read']} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  )
}

const DiffScopeGroupItem = ({
  label,
  level,
  permissions,
}: {
  label: ReactNode
  level: ScopeGroupLevel | undefined
  permissions: DiffScopePermission[]
}) => {
  if (permissions.length === 0) return null
  return (
    <div className="flex flex-col gap-2 py-3">
      <p className="font-mono text-[11px] uppercase tracking-wider text-foreground-light">
        {label}
      </p>
      <p className="text-xs font-medium text-foreground">
        {permissions.map((permission, index) => (
          <>
            <span>
              {formatPermissionName(permission.permission)}{' '}
              <span className="text-foreground-lighter">
                (
                <DiffDescription
                  key={permission.permission}
                  level={level}
                  previousLevel={permission.previousLevel}
                />
                )
              </span>
            </span>
            {index < permissions.length - 1 ? ', ' : ''}
          </>
        ))}
      </p>
    </div>
  )
}

const DiffDescription = ({
  level,
  previousLevel,
}: {
  level: ScopeGroupLevel | undefined
  previousLevel: ScopeGroupLevel | undefined
}) => {
  // Removed
  if (level == null) return capitalize(previousLevel!)

  // New
  if (previousLevel == null) return 'New'

  // Upgraded
  if (level === 'read-write') return `Upgraded from ${capitalize(previousLevel)}`

  // Modified
  if (['read', 'write'].includes(level!) && ['read', 'write'].includes(previousLevel))
    return `Changed from ${capitalize(previousLevel)}`

  // Downgraded
  return `Demoted from ${capitalize(previousLevel)}`
}
