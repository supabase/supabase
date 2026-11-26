import { MinusIcon, PlusIcon } from 'lucide-react'
import { cn } from 'ui'

import {
  formatPermissionName,
  getDiffBetweenScopes,
  ScopeGroupLevel,
} from './OAuthAppsAuthorizeScreen.utils'
import { ScopePermissionLabel } from './ScopeGroupCardItem'

export interface ScopeGroupCardProps {
  scopes: string[]
  previousScopes: string[]
}

const scopeLabels: Record<ScopeGroupLevel, string> = {
  'read-write': 'Read and write',
  write: 'Write',
  read: 'Read only',
}

const scopeLevels = ['read-write', 'write', 'read'] as const

export const ScopeGroupCardWithDiff = (props: ScopeGroupCardProps) => {
  const diff = getDiffBetweenScopes(props)
  const removedPermissions = [
    ...diff.changed.removed,
    ...scopeLevels.flatMap((level) =>
      diff.changed[level].filter(({ previousLevel }) => previousLevel)
    ),
  ]

  return (
    <div className="space-y-2">
      {scopeLevels.map((level) => {
        const rows = [
          ...diff.changed[level].map(({ permission }) => ({ permission, status: 'Added' })),
          ...removedPermissions
            .filter(({ previousLevel }) => previousLevel === level)
            .map(({ permission }) => ({ permission, status: 'Removed' })),
          ...diff.unchanged[level].map((permission) => ({ permission, status: 'Unchanged' })),
        ]
        if (rows.length === 0) return null

        return (
          <div key={level} className="rounded-md border bg-surface-75 px-4 text-xs">
            <h3 className="py-2 font-mono text-xs! uppercase text-foreground-light font-normal!">
              {scopeLabels[level]}
            </h3>
            <ul className="divide-y border-t" aria-label={scopeLabels[level]}>
              {rows.map(({ permission, status }) => (
                <li
                  key={permission}
                  className={cn(
                    'flex items-center justify-between gap-2 py-2',
                    status === 'Added' && 'text-success',
                    status === 'Removed' && 'text-destructive',
                    status === 'Unchanged' && 'text-foreground-light'
                  )}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    {status === 'Added' && <PlusIcon size={12} className="shrink-0" aria-hidden />}
                    {status === 'Removed' && (
                      <MinusIcon size={12} className="shrink-0" aria-hidden />
                    )}
                    {status === 'Unchanged' && <span className="w-3 shrink-0" aria-hidden />}
                    <span className={cn('font-medium', status === 'Removed' && 'line-through')}>
                      {status === 'Removed' ? (
                        formatPermissionName(permission)
                      ) : (
                        <ScopePermissionLabel permission={permission} />
                      )}
                    </span>
                  </span>
                  <span className={cn(status === 'Unchanged' && 'text-foreground-lighter')}>
                    {status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
