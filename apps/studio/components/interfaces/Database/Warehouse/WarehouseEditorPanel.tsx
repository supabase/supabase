import { useState } from 'react'
import { Button } from 'ui'

import { formatWarehouseSize, useWarehouseTableState } from './warehouseDemoStore'
import { WarehouseDetachModal } from './WarehouseDetachModal'
import { WarehouseEnablementModal, type EnablementVariant } from './WarehouseEnablementModal'
import { WarehouseSyncChip } from './WarehouseSyncChip'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'

interface WarehouseEditorPanelProps {
  tableKey: string
  tableName: string
  postgresSize?: string
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function WarehouseEditorPanel({
  tableKey,
  tableName,
  postgresSize,
}: WarehouseEditorPanelProps) {
  const state = useWarehouseTableState(tableKey)
  const [enableModal, setEnableModal] = useState<EnablementVariant | null>(null)
  const [confirmDetach, setConfirmDetach] = useState(false)
  const [detachProgress, setDetachProgress] = useState(false)

  const copyName = state.copyName ?? `warehouse.${tableName}`
  const warehouseSize = formatWarehouseSize(state.warehouseSizeBytes)

  return (
    <>
      <div className="space-y-4">
        <div>
          <h5>Storage</h5>
          <p className="text-sm text-foreground-lighter mt-1">
            Control where this table is stored and how analytical queries are routed.
          </p>
        </div>

        {state.mode === 'postgres' && (
          <div className="space-y-3">
            <p className="text-sm text-foreground-light">Postgres</p>
            {postgresSize !== undefined && (
              <p className="text-sm text-foreground-muted">{postgresSize}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="default" onClick={() => setEnableModal('attach')}>
                Create Warehouse copy
              </Button>
              <Button type="button" variant="outline" onClick={() => setEnableModal('move')}>
                Move to Warehouse
              </Button>
            </div>
          </div>
        )}

        {state.mode === 'has_warehouse_copy' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-sm text-foreground-light">Postgres + Warehouse</p>
              {state.syncState && <WarehouseSyncChip syncState={state.syncState} />}
            </div>
            <p className="text-sm text-foreground-light">
              Copy: <span className="font-mono text-foreground">{copyName}</span>
            </p>
            <p className="text-sm text-foreground-muted">
              {postgresSize !== undefined && <>{postgresSize} · </>}
              {warehouseSize}
            </p>
            <p className="text-sm text-foreground-muted">
              {state.lastSyncedAt && <>Last synced {formatTimestamp(state.lastSyncedAt)}</>}
              {state.lastSyncedAt && state.lagSeconds !== undefined && <> · </>}
              {state.lagSeconds !== undefined && <>Lag {state.lagSeconds}s</>}
            </p>
            <p className="text-sm text-foreground-muted">Reads → Warehouse · Writes → Postgres</p>
            <Button type="button" variant="danger" onClick={() => setConfirmDetach(true)}>
              Detach copy
            </Button>
          </div>
        )}

        {state.mode === 'warehouse_backed' && (
          <div className="space-y-3">
            <p className="text-sm text-foreground-light">Warehouse</p>
            <p className="text-sm text-foreground-muted">
              {state.migrationCompletedAt && (
                <>Moved {formatTimestamp(state.migrationCompletedAt)} · </>
              )}
              {warehouseSize}
            </p>
            <p className="text-sm text-foreground-muted">Reads/writes → Warehouse</p>
          </div>
        )}
      </div>

      {enableModal && (
        <WarehouseEnablementModal
          open={true}
          variant={enableModal}
          tableKey={tableKey}
          tableName={tableName}
          onOpenChange={(open) => {
            if (!open) setEnableModal(null)
          }}
        />
      )}

      <DiscardChangesConfirmationDialog
        visible={confirmDetach}
        onCancel={() => setConfirmDetach(false)}
        onClose={() => {
          setConfirmDetach(false)
          setDetachProgress(true)
        }}
        title="Detach Warehouse copy"
        description={
          <>
            Drops the Warehouse copy of <strong>{copyName}</strong>. The source table is unaffected
            and your data remains in Postgres.
          </>
        }
        confirmLabel="Detach copy"
        cancelLabel="Cancel"
      />

      <WarehouseDetachModal
        open={detachProgress}
        tableKey={tableKey}
        copyName={copyName}
        onOpenChange={setDetachProgress}
      />
    </>
  )
}
