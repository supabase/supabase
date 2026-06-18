import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from 'ui'

import { clearTableMode, useWarehouseTableState } from './warehouseDemoStore'
import { WarehouseEnablementModal, type EnablementVariant } from './WarehouseEnablementModal'
import { WarehouseModeChip } from './WarehouseModeChip'
import { WarehouseSyncChip } from './WarehouseSyncChip'

interface WarehouseEditorPanelProps {
  tableKey: string
  tableName: string
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function WarehouseEditorPanel({ tableKey, tableName }: WarehouseEditorPanelProps) {
  const state = useWarehouseTableState(tableKey)
  const [enableModal, setEnableModal] = useState<EnablementVariant | null>(null)
  const [confirmDetach, setConfirmDetach] = useState(false)

  function handleDetach() {
    clearTableMode(tableKey)
    setConfirmDetach(false)
  }

  return (
    <>
      <div className="flex flex-col divide-y">
        {/* Mode */}
        <div className="py-5 flex flex-col gap-2">
          <p className="text-xs text-foreground-light uppercase tracking-widest font-medium">
            Storage mode
          </p>
          <WarehouseModeChip mode={state.mode} />
        </div>

        {/* Status (copy only) */}
        {state.mode === 'has_warehouse_copy' && state.syncState && (
          <div className="py-5 flex flex-col gap-3">
            <p className="text-xs text-foreground-light uppercase tracking-widest font-medium">
              Sync status
            </p>
            <div className="flex items-center gap-3">
              <WarehouseSyncChip syncState={state.syncState} />
              {state.lagSeconds !== undefined && (
                <span className="text-sm text-foreground-light">Lag: {state.lagSeconds}s</span>
              )}
            </div>
            {state.lastSyncedAt && (
              <p className="text-sm text-foreground-light">
                Last synced: {formatTimestamp(state.lastSyncedAt)}
              </p>
            )}
          </div>
        )}

        {/* Migration status (moved) */}
        {state.mode === 'warehouse_backed' && state.migrationCompletedAt && (
          <div className="py-5 flex flex-col gap-2">
            <p className="text-xs text-foreground-light uppercase tracking-widest font-medium">
              Migration
            </p>
            <p className="text-sm text-foreground-light">
              Completed {formatTimestamp(state.migrationCompletedAt)}
            </p>
          </div>
        )}

        {/* Routing */}
        {state.mode !== 'postgres' && (
          <div className="py-5 flex flex-col gap-3">
            <p className="text-xs text-foreground-light uppercase tracking-widest font-medium">
              Query routing
            </p>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-light">Analytical reads</span>
                <span className="font-medium text-foreground">Warehouse</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-light">Writes</span>
                <span className="font-medium text-foreground">
                  {state.mode === 'warehouse_backed' ? 'Warehouse' : 'Postgres'}
                </span>
              </div>
              {state.mode === 'has_warehouse_copy' && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-light">OLTP reads</span>
                  <span className="font-medium text-foreground">Postgres</span>
                </div>
              )}
            </div>
            <p className="text-xs text-foreground-muted">
              Same connection string — no application changes required.
            </p>
          </div>
        )}

        {/* Storage */}
        {state.mode !== 'postgres' && (
          <div className="py-5 flex flex-col gap-2">
            <p className="text-xs text-foreground-light uppercase tracking-widest font-medium">
              Warehouse storage
            </p>
            <p className="text-sm text-foreground">184 GB</p>
          </div>
        )}

        {/* Actions for postgres tables */}
        {state.mode === 'postgres' && (
          <div className="py-5 flex flex-col gap-3">
            <p className="text-xs text-foreground-light uppercase tracking-widest font-medium">
              Enable Warehouse
            </p>
            <p className="text-sm text-foreground-light">
              Offload analytical queries to the Warehouse without changing your connection string.
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="default" onClick={() => setEnableModal('attach')}>
                Create Warehouse copy
              </Button>
              <Button type="button" variant="outline" onClick={() => setEnableModal('move')}>
                Move to Warehouse
              </Button>
            </div>
          </div>
        )}

        {/* Detach action for copies */}
        {state.mode === 'has_warehouse_copy' && (
          <div className="py-5">
            <Button type="button" variant="danger" onClick={() => setConfirmDetach(true)}>
              Detach Warehouse copy
            </Button>
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

      <AlertDialog open={confirmDetach} onOpenChange={setConfirmDetach}>
        <AlertDialogContent size="small">
          <AlertDialogHeader>
            <AlertDialogTitle>Detach Warehouse copy</AlertDialogTitle>
            <AlertDialogDescription>
              Drops the Warehouse copy of <strong>{tableName}</strong>. The source table is
              unaffected and your data remains in Postgres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={handleDetach}>
              Detach copy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
