import { useMemo } from 'react'

import { groupScopesByLevel } from './OAuthAppsAuthorizeScreen.utils'
import { ScopeGroupCardItem } from './ScopeGroupCardItem'

export interface ScopeGroupCardProps {
  scopes: string[]
  databaseAccess?: 'read' | 'write'
}

export const ScopeGroupCard = ({ scopes, databaseAccess }: ScopeGroupCardProps) => {
  const scopeGroups = useMemo(() => {
    const groups = groupScopesByLevel(scopes)
    if (databaseAccess)
      groups[databaseAccess === 'write' ? 'read-write' : 'read'].push('table_data')
    return groups
  }, [scopes, databaseAccess])

  return (
    <div className="divide-y rounded-md border bg-surface-75 px-4">
      <ScopeGroupCardItem label="READ-WRITE" permissions={scopeGroups['read-write']} />
      <ScopeGroupCardItem label="WRITE" permissions={scopeGroups['write']} />
      <ScopeGroupCardItem label="READ" permissions={scopeGroups['read']} />
    </div>
  )
}
