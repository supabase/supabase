import { Badge, cn } from 'ui'

import {
  PERMISSION_MODE_LABEL,
  RISK_DOT_CLASS,
  RISK_TONE_VARIANT,
  type OverallRisk,
  type PermissionCatalogEntry,
  type PermissionMode,
} from '../AccessToken.permissions'
import type { EntryAccess } from '../AccessToken.roles'
import { ExceedsRoleBadge } from './ExceedsRoleBadge'

/**
 * Presentational pieces of the token view sheet's summary section.
 */

interface CapabilityCategoryListProps {
  categories: {
    key: string
    name: string
    entries: { entry: PermissionCatalogEntry; mode: PermissionMode }[]
  }[]
  /** Per-entry access evaluation; entries flagged 'exceeds-role' get the warning pill. */
  accessEntries: Record<string, EntryAccess>
}

export const CapabilityCategoryList = ({
  categories,
  accessEntries,
}: CapabilityCategoryListProps) => (
  <div className="space-y-4">
    {categories.map((category) => (
      <div key={category.key} className="space-y-2">
        <p className="text-[11px] font-mono uppercase tracking-wide text-foreground-lighter">
          {category.name}
        </p>
        <div className="divide-y">
          {category.entries.map(({ entry, mode }) => {
            const entryAccess = accessEntries[entry.key]
            return (
              <div key={entry.key} className="flex items-center justify-between gap-2 text-sm py-2">
                <span className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn('h-1.5 w-1.5 shrink-0 rounded-full', RISK_DOT_CLASS[entry.risk])}
                  />
                  <span className="text-foreground text-wrap">{entry.name}</span>
                  {entryAccess?.status === 'exceeds-role' && (
                    <ExceedsRoleBadge entry={entry} mode={mode} access={entryAccess} />
                  )}
                </span>
                <span className="text-foreground-lighter text-xs font-mono uppercase font-normal text-right">
                  {PERMISSION_MODE_LABEL[mode]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    ))}
  </div>
)

interface RiskLevelSummaryProps {
  risk: OverallRisk
  /** True when some selected permissions exceed the owner's role, so the risk is role-capped. */
  showRoleCaveat: boolean
}

export const RiskLevelSummary = ({ risk, showRoleCaveat }: RiskLevelSummaryProps) => (
  <div className="space-y-1">
    <span className="flex flex-wrap items-center gap-2">
      <span className="flex">
        <Badge variant={RISK_TONE_VARIANT[risk.tone]}>{risk.level} Risk</Badge>
      </span>
      <span className="text-sm text-foreground leading-px">
        {risk.text.replace(`${risk.level} — `, '')}
      </span>
    </span>
    {showRoleCaveat && (
      <p className="text-xs text-foreground-lighter">
        Based on what your current role allows this token to do.
      </p>
    )}
  </div>
)

interface ResourceSummaryItemProps {
  label: string
  /** Mono-rendered identifier under the name — the org slug or project ref. */
  sublabel?: string
  isInaccessible?: boolean
}

export const ResourceSummaryItem = ({
  label,
  sublabel,
  isInaccessible = false,
}: ResourceSummaryItemProps) => (
  <div className="flex flex-wrap items-center justify-between gap-2 py-2">
    <span className="flex flex-col gap-0.5">
      <span
        className={cn('text-sm', isInaccessible ? 'text-foreground-lighter' : 'text-foreground')}
      >
        {label}
      </span>
      {sublabel !== undefined && (
        <span className="font-mono text-xs text-foreground-lighter">{sublabel}</span>
      )}
    </span>
    {isInaccessible && <Badge variant="destructive">No longer accessible</Badge>}
  </div>
)
