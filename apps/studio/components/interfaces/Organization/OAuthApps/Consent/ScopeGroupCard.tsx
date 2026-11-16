import { useMemo } from 'react'

import { groupScopesByLevel } from './OAuthAppsAuthorizeScreen.utils'
import { ScopeGroupCardItem } from './ScopeGroupCardItem'
import type { OAuthScope } from '@/data/oauth-apps/types'

export interface ScopeGroupCardProps {
  scopes: OAuthScope[]
}

export const ScopeGroupCard = ({ scopes }: ScopeGroupCardProps) => {
  const scopeGroups = useMemo(() => groupScopesByLevel(scopes), [scopes])

  return (
    <div className="divide-y rounded-md border bg-surface-75 px-4">
      <ScopeGroupCardItem label="READ-WRITE" permissions={scopeGroups['read-write']} />
      <ScopeGroupCardItem label="WRITE" permissions={scopeGroups['write']} />
      <ScopeGroupCardItem label="READ" permissions={scopeGroups['read']} />
    </div>
  )
}
