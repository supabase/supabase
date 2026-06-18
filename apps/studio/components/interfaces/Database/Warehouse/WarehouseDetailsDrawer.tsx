import { useState } from 'react'
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { clearTableMode, useWarehouseTableState } from './warehouseDemoStore'
import { WarehouseModeChip } from './WarehouseModeChip'
import { WarehouseSyncChip } from './WarehouseSyncChip'

interface WarehouseDetailsDrawerProps {
  tableKey: string
  tableName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function WarehouseDetailsDrawer({
  tableKey,
  tableName,
  open,
  onOpenChange,
}: WarehouseDetailsDrawerProps) {
  const state = useWarehouseTableState(tableKey)
  const [confirmDetach, setConfirmDetach] = useState(false)

  function handleDetach() {
    clearTableMode(tableKey)
    setConfirmDetach(false)
    onOpenChange(false)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent size="lg" className="flex flex-col gap-0 p-0">
          <SheetHeader className="border-b px-8 py-6 text-left">
            <SheetTitle>Warehouse details</SheetTitle>
            <SheetDescription>{tableName}</SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-0 overflow-y-auto divide-y">
            {/* Mode */}
            <div className="px-8 py-5 flex flex-col gap-2">
              <p className="text-xs text-foreground-light uppercase tracking-widest font-medium">
                Storage mode
              </p>
              <WarehouseModeChip mode={state.mode} />
            </div>

            {/* Status (copy only) */}
            {state.mode === 'has_warehouse_copy' && state.syncState && (
              <div className="px-8 py-5 flex flex-col gap-3">
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
              <div className="px-8 py-5 flex flex-col gap-2">
                <p className="text-xs text-foreground-light uppercase tracking-widest font-medium">
                  Migration
                </p>
                <p className="text-sm text-foreground-light">
                  Completed {formatTimestamp(state.migrationCompletedAt)}
                </p>
              </div>
            )}

            {/* Routing */}
            <div className="px-8 py-5 flex flex-col gap-3">
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
                Same connection string — no changes required in your application.
              </p>
            </div>

            {/* Storage */}
            <div className="px-8 py-5 flex flex-col gap-2">
              <p className="text-xs text-foreground-light uppercase tracking-widest font-medium">
                Warehouse storage
              </p>
              <p className="text-sm text-foreground">184 GB</p>
            </div>
          </div>

          {state.mode === 'has_warehouse_copy' && (
            <SheetFooter className="border-t px-8 py-4">
              <Button type="button" variant="danger" onClick={() => setConfirmDetach(true)}>
                Detach Warehouse copy
              </Button>
              <p className="text-xs text-foreground-muted self-center">
                Drops the Warehouse copy. Source table is unaffected.
              </p>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmationModal
        variant="destructive"
        visible={confirmDetach}
        title="Detach Warehouse copy"
        description={`Drops the Warehouse copy of ${tableName}. The source table is unaffected and your data remains in Postgres.`}
        confirmLabel="Detach copy"
        onConfirm={handleDetach}
        onCancel={() => setConfirmDetach(false)}
      />
    </>
  )
}
