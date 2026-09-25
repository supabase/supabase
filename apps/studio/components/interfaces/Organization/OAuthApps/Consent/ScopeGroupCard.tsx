import { useMemo } from 'react'

import {
  formatPermissionName,
  getScopeLevelLabel,
  groupScopesByLevel,
} from './OAuthAppsAuthorizeScreen.utils'
import type { OAuthScope } from '@/data/oauth-apps/types'

export interface ScopeGroupCardProps {
  scopes: OAuthScope[]
}

type ScopeGroupLevel = 'read' | 'write' | 'read-write'
type ScopeGroup = {
  level: ScopeGroupLevel
  permissions: string[]
}

export const ScopeGroupCard = ({ scopes }: ScopeGroupCardProps) => {
  const scopeGroups = useMemo<ScopeGroup[]>(() => groupScopesByLevel(scopes), [scopes])

  return (
    <div className="divide-y rounded-md border bg-surface-75 px-4">
      {scopeGroups.map((scopeGroup) => (
        <div key={scopeGroup.level} className="flex flex-col gap-2 py-3">
          <p className="font-mono text-[11px] uppercase tracking-wider text-foreground-light">
            {getScopeLevelLabel(scopeGroup.level)}
          </p>
          <p className="text-xs font-medium text-foreground">
            {scopeGroup.permissions
              .map((permission) => formatPermissionName(permission))
              .join(', ')}
          </p>
        </div>
      ))}
    </div>
  )
}
