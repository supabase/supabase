import { Check, X } from 'lucide-react'
import type { ReactNode } from 'react'

import type { Entity } from '@/data/table-editor/table-editor-types'
import { isTableLike } from '@/data/table-editor/table-editor-types'

interface TableDetailOverviewProps {
  entity: Entity
  realtimeEnabled: boolean
}

function OverviewItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-foreground-lighter">{label}</span>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}

export function TableDetailOverview({ entity, realtimeEnabled }: TableDetailOverviewProps) {
  const isTable = isTableLike(entity)

  return (
    <div className="rounded-md border bg-surface-75 px-4 py-3">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewItem label="Schema">
          <code className="text-code-inline">{entity.schema}</code>
        </OverviewItem>

        {isTable && (
          <OverviewItem label="Row level security">
            <div className="flex items-center gap-2">
              {entity.rls_enabled ? (
                <>
                  <Check size={14} className="text-brand-link" />
                  <span className="text-foreground-light">Enabled</span>
                </>
              ) : (
                <>
                  <X size={14} className="text-foreground-muted" />
                  <span className="text-foreground-lighter">Disabled</span>
                </>
              )}
            </div>
          </OverviewItem>
        )}

        {isTable && (
          <OverviewItem label="Realtime">
            <div className="flex items-center gap-2">
              {realtimeEnabled ? (
                <>
                  <Check size={14} className="text-brand-link" />
                  <span className="text-foreground-light">Enabled</span>
                </>
              ) : (
                <>
                  <X size={14} className="text-foreground-muted" />
                  <span className="text-foreground-lighter">Disabled</span>
                </>
              )}
            </div>
          </OverviewItem>
        )}

        {isTable && entity.size !== undefined && (
          <OverviewItem label="Postgres size">
            <span className="text-foreground-light">{entity.size}</span>
          </OverviewItem>
        )}

        {entity.comment !== undefined && entity.comment !== null && entity.comment !== '' && (
          <OverviewItem label="Comment">
            <span className="text-foreground-light">{entity.comment}</span>
          </OverviewItem>
        )}
      </div>
    </div>
  )
}
