import { Badge, Card, CardContent } from 'ui'

import { OverRoleAnnotation } from './OverRoleAnnotation'
import type {
  OAuthOrganizationRole,
  OAuthScopeGroup,
  OAuthScopeLevel,
} from '@/data/oauth-apps/types'

export interface ScopeGroupCardProps {
  appName: string
  scopeGroups: OAuthScopeGroup[]
  memberRole: OAuthOrganizationRole['role']
}

export const ScopeGroupCard = ({ appName, scopeGroups, memberRole }: ScopeGroupCardProps) => {
  return (
    <section className="flex flex-col">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-foreground-light">
          Permissions requested
        </p>
        <p className="mt-1 text-xs text-foreground-lighter">
          Authorizing {appName} grants it the following access permissions to the selected projects.
        </p>
      </div>

      <Card className="overflow-hidden shadow-none bg-surface-200/60 border-muted mt-3">
        <CardContent className="border-none p-0">
          <div className="divide-y divide-muted px-4">
            {scopeGroups.map((scopeGroup) => (
              <div key={scopeGroup.name} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={getScopeLevelBadgeVariant(scopeGroup.level)}>
                    {getScopeLevelLabel(scopeGroup.level)}
                  </Badge>
                  <OverRoleAnnotation level={scopeGroup.level} memberRole={memberRole} />
                </div>
                <p className="mt-1 text-sm text-foreground-light">{scopeGroup.scopes.join(', ')}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function getScopeLevelLabel(level: OAuthScopeLevel) {
  if (level === 'read') return 'READ'
  if (level === 'write') return 'WRITE'
  return 'READ + WRITE'
}

function getScopeLevelBadgeVariant(level: OAuthScopeLevel) {
  return level === 'read' ? 'default' : 'warning'
}
