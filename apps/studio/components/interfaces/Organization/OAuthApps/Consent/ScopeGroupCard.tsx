import type { OAuthScopeGroup, OAuthScopeLevel } from '@/data/oauth-apps/types'

export interface ScopeGroupCardProps {
  appName: string
  scopeGroups: OAuthScopeGroup[]
  /** Set to false for a receipt view (e.g. the success screen) that has no intro copy of its own. */
  showHeading?: boolean
}

export const ScopeGroupCard = ({
  appName,
  scopeGroups,
  showHeading = true,
}: ScopeGroupCardProps) => {
  return (
    <section className="flex flex-col gap-3">
      {showHeading && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-foreground">Permissions requested</p>
          <p className="text-xs text-foreground-lighter">
            Authorizing {appName} grants it the following access permissions to the selected
            projects.
          </p>
        </div>
      )}

      <div className="divide-y rounded-md border bg-surface-75 px-4">
        {scopeGroups.map((scopeGroup) => (
          <div key={scopeGroup.name} className="flex flex-col gap-2 py-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-foreground-light">
              {getScopeLevelLabel(scopeGroup.level)}
            </p>
            <p className="text-xs font-medium text-foreground">{scopeGroup.name}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function getScopeLevelLabel(level: OAuthScopeLevel) {
  if (level === 'read') return 'READ'
  if (level === 'write') return 'WRITE'
  return 'READ-WRITE'
}
