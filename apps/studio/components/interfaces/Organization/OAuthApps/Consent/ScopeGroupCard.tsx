import { useMemo } from 'react'

import { groupScopesByLevel } from './OAuthAppsAuthorizeScreen.utils'
import { ScopeGroupCardItem } from './ScopeGroupCardItem'

export interface ScopeGroupCardProps {
  scopes: string[]
}

export const ScopeGroupCard = ({ scopes }: ScopeGroupCardProps) => {
  const scopeGroups = useMemo(() => groupScopesByLevel(scopes), [scopes])

  return (
    <div className="divide-y rounded-md border bg-surface-75 px-4">
      <ScopeGroupCardItem label="Read and write" permissions={scopeGroups['read-write']} />
      <ScopeGroupCardItem label="Write" permissions={scopeGroups['write']} />
      <ScopeGroupCardItem label="Read only" permissions={scopeGroups['read']} />
    </div>
  )
}
