import { Loader2 } from 'lucide-react'
import { Badge } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import type { WarehouseSetupStatusResponse } from '@/data/warehouse/warehouse-setup-status-query'

const TABLE_STATE_BADGE: Record<
  WarehouseSetupStatusResponse['tables'][number]['state'],
  { label: string; variant: 'warning' | 'success' | 'destructive' }
> = {
  syncing: { label: 'Backfilling', variant: 'warning' },
  live: { label: 'Synced', variant: 'success' },
  error: { label: 'Error', variant: 'destructive' },
}

export interface WarehouseEnablingProgressProps {
  status: WarehouseSetupStatusResponse
}

export const WarehouseEnablingProgress = ({ status }: WarehouseEnablingProgressProps) => {
  return (
    <div>
      <Admonition
        type="default"
        icon={
          <Loader2 size={16} strokeWidth={1.5} className="animate-spin text-foreground-light" />
        }
        description="Setting up your Warehouse — this can take a few minutes while we backfill selected tables."
        className="mb-5"
      />

      <div className="border rounded-md overflow-hidden divide-y">
        {status.tables.map((table) => {
          const badge = TABLE_STATE_BADGE[table.state]
          return (
            <div
              key={`${table.schema}.${table.name}`}
              className="flex items-center gap-2 px-3 py-2.5"
            >
              <span className="text-sm font-mono text-foreground flex-1">
                {table.schema}.{table.name}
              </span>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
          )
        })}
        {status.tables.length === 0 && (
          <p className="px-3 py-2.5 text-sm text-foreground-lighter">
            No tables are being copied yet.
          </p>
        )}
      </div>
    </div>
  )
}
