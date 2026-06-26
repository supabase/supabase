import { type ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSection,
  DialogTitle,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

import {
  formatWarehouseSize,
  useWarehouseTableState,
  type WarehouseMode,
} from './warehouseDemoStore'
import { WarehouseSyncChip } from './WarehouseSyncChip'

interface WarehouseStorageDetailsDialogProps {
  open: boolean
  tableKey: string
  postgresSize?: string
  onOpenChange: (open: boolean) => void
}

const MODE_LABELS: Record<WarehouseMode, string> = {
  postgres: 'Postgres',
  has_warehouse_copy: 'Postgres + Warehouse',
}

const MODE_TOOLTIPS: Partial<Record<WarehouseMode, ReactNode>> = {
  has_warehouse_copy: (
    <>
      Kept in the Postgres heap with a synced columnar copy in Warehouse. Changes in Postgres
      propagate to the copy; sync is one-way.
    </>
  ),
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <span className="shrink-0 text-foreground-lighter">{label}</span>
      <div className="min-w-0 text-right text-foreground">{children}</div>
    </div>
  )
}

/**
 * Read-only details for a warehouse-enabled table — sync status, lag, routing,
 * sizes. Lives behind a menu action rather than the Edit Table sheet, since
 * storage is an infrastructure concern, not part of the table's schema.
 */
export function WarehouseStorageDetailsDialog({
  open,
  tableKey,
  postgresSize,
  onOpenChange,
}: WarehouseStorageDetailsDialogProps) {
  const state = useWarehouseTableState(tableKey)
  const { mode } = state
  const warehouseSize = formatWarehouseSize(state.warehouseSizeBytes)
  const copyName = state.copyName ?? tableKey

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>Storage details</DialogTitle>
          <DialogDescription>
            <code className="text-code-inline">{tableKey}</code>
          </DialogDescription>
        </DialogHeader>
        <DialogSection>
          <div className="divide-y rounded-md border bg-surface-75 text-sm">
            <MetaRow label="Mode">
              <div className="flex items-center justify-end gap-1.5">
                <span>{MODE_LABELS[mode]}</span>
                {MODE_TOOLTIPS[mode] && (
                  <InfoTooltip side="top" className="max-w-80">
                    {MODE_TOOLTIPS[mode]}
                  </InfoTooltip>
                )}
              </div>
            </MetaRow>

            {mode === 'has_warehouse_copy' && (
              <>
                {state.syncState && (
                  <MetaRow label="Status">
                    <WarehouseSyncChip syncState={state.syncState} />
                  </MetaRow>
                )}
                {state.lastSyncedAt !== undefined && (
                  <MetaRow label="Last synced">
                    <TimestampInfo
                      className="text-sm text-foreground-light"
                      utcTimestamp={state.lastSyncedAt}
                      displayAs="local"
                    />
                  </MetaRow>
                )}
                {state.lagSeconds !== undefined && (
                  <MetaRow label="Lag">
                    <span className="text-foreground-light">{state.lagSeconds}s</span>
                  </MetaRow>
                )}
                <MetaRow label="Copy name">
                  <code className="text-code-inline break-all">{copyName}</code>
                </MetaRow>
                <MetaRow label="Postgres size">{postgresSize ?? '—'}</MetaRow>
                <MetaRow label="Warehouse size">{warehouseSize}</MetaRow>
                <MetaRow label="Routing">
                  <span className="text-foreground-light">
                    Reads → Warehouse · Writes → Postgres
                  </span>
                </MetaRow>
              </>
            )}

            {mode === 'postgres' && <MetaRow label="Size">{postgresSize ?? '—'}</MetaRow>}
          </div>
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}
