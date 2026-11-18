import { ArrowRightIcon, ChevronsUpDownIcon } from 'lucide-react'
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'

import { getDiffBetweenScopes, ScopeGroupLevel } from './OAuthAppsAuthorizeScreen.utils'
import { ScopeGroupCardItem, ScopePermissionLabel } from './ScopeGroupCardItem'
import type { OAuthScope } from '@/data/oauth-apps/types'

export interface ScopeGroupCardProps {
  scopes: OAuthScope[]
  previousScopes: OAuthScope[]
  databaseAccess?: 'read' | 'write'
  previousDatabaseAccess?: 'read' | 'write'
}

const scopeLabels: Record<ScopeGroupLevel, string> = {
  read: 'Read',
  write: 'Write',
  'read-write': 'Read-write',
}

export const ScopeGroupCardWithDiff = (props: ScopeGroupCardProps) => {
  const diff = getDiffBetweenScopes(props)
  const changedPermissions = (['read-write', 'write', 'read', 'removed'] as const).flatMap(
    (level) =>
      diff.changed[level].map((entry) => ({
        ...entry,
        nextLevel: level === 'removed' ? undefined : level,
      }))
  )

  const unchangedPermissionsCount =
    diff.unchanged['read-write'].length +
    diff.unchanged['write'].length +
    diff.unchanged['read'].length

  return (
    <>
      {changedPermissions.length > 0 && (
        <ul
          className="divide-y rounded-md border bg-surface-75 px-4 text-xs"
          aria-label="Permission changes"
        >
          {changedPermissions.map(({ permission, previousLevel, nextLevel }) => (
            <li
              key={permission}
              className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2"
            >
              <span className="font-medium">
                <ScopePermissionLabel permission={permission} />
              </span>
              <span className="flex items-center gap-1.5">
                {previousLevel ? (
                  <span className="text-foreground-light">{scopeLabels[previousLevel]}</span>
                ) : (
                  <span className="text-brand">Added</span>
                )}
                <ArrowRightIcon size={12} className="text-foreground-muted" aria-hidden />
                {nextLevel ? (
                  <span>{scopeLabels[nextLevel]}</span>
                ) : (
                  <span className="text-destructive">Removed</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
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
