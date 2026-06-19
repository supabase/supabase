import { ChevronDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

import {
  formatWarehouseSize,
  useWarehouseTableState,
  type WarehouseMode,
  type WarehouseTableState,
} from './warehouseDemoStore'
import { WarehouseDetachModal } from './WarehouseDetachModal'
import { WarehouseEnablementModal, type EnablementVariant } from './WarehouseEnablementModal'
import { WarehouseSyncChip } from './WarehouseSyncChip'
import { WarehouseTimeTravelFlow } from './WarehouseTimeTravelFlow'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'

interface WarehouseEditorPanelProps {
  tableKey: string
  tableName: string
  postgresSize?: string
}

const MODE_LABELS: Record<WarehouseMode, string> = {
  postgres: 'Postgres',
  has_warehouse_copy: 'Postgres + Warehouse',
  warehouse_backed: 'Warehouse',
}

const WAREHOUSE_MODE_TOOLTIPS: Partial<Record<WarehouseMode, ReactNode>> = {
  has_warehouse_copy: (
    <>
      Keeps this table in the Postgres heap and maintains a synced columnar copy in Warehouse.
      Changes in Postgres propagate to the copy; sync is one-way, not bidirectional.
    </>
  ),
  warehouse_backed: (
    <>
      This table&apos;s storage was moved to Warehouse. The Postgres heap for this table no longer
      exists.
    </>
  ),
}

function StorageCard({ children }: { children: ReactNode }) {
  return <div className="rounded-md border bg-surface-75 divide-y text-sm">{children}</div>
}

function StorageMetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <span className="text-foreground-lighter shrink-0">{label}</span>
      <div className="text-foreground text-right min-w-0">{children}</div>
    </div>
  )
}

function StorageModeRow({ mode }: { mode: WarehouseMode }) {
  const tooltip = WAREHOUSE_MODE_TOOLTIPS[mode]

  return (
    <StorageMetaRow label="Mode">
      <div className="flex items-center justify-end gap-1.5">
        <span>{MODE_LABELS[mode]}</span>
        {tooltip && (
          <InfoTooltip side="top" className="max-w-80">
            {tooltip}
          </InfoTooltip>
        )}
      </div>
    </StorageMetaRow>
  )
}

function StorageSyncRows({ state }: { state: WarehouseTableState }) {
  return (
    <>
      {state.syncState && (
        <StorageMetaRow label="Status">
          <WarehouseSyncChip syncState={state.syncState} />
        </StorageMetaRow>
      )}
      {state.lastSyncedAt !== undefined && (
        <StorageMetaRow label="Last synced">
          <TimestampInfo
            className="text-sm text-foreground-light"
            utcTimestamp={state.lastSyncedAt}
            displayAs="local"
          />
        </StorageMetaRow>
      )}
      {state.lagSeconds !== undefined && (
        <StorageMetaRow label="Lag">
          <span className="text-foreground-light">{state.lagSeconds}s</span>
        </StorageMetaRow>
      )}
    </>
  )
}

function CreateWarehouseCopyButton({
  onAttach,
  onMove,
}: {
  onAttach: () => void
  onMove: () => void
}) {
  return (
    <div className="flex">
      <Button
        type="button"
        variant="default"
        className="rounded-r-none hover:z-10"
        onClick={onAttach}
      >
        Copy to Warehouse
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="default"
            aria-label="More warehouse storage options"
            className="shrink-0 rounded-l-none px-[4px] py-[5px] -ml-px"
            icon={<ChevronDown />}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={onMove}>Move to Warehouse</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
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
  const [snapshotsOpen, setSnapshotsOpen] = useState(false)

  const copyName = state.copyName ?? `warehouse.${tableName}`
  const warehouseSize = formatWarehouseSize(state.warehouseSizeBytes)

  return (
    <>
      <div className="space-y-4">
        <h5>Storage</h5>

        {state.mode === 'postgres' && (
          <>
            <StorageCard>
              <StorageModeRow mode="postgres" />
              <StorageMetaRow label="Size">{postgresSize ?? '—'}</StorageMetaRow>
            </StorageCard>
            <CreateWarehouseCopyButton
              onAttach={() => setEnableModal('attach')}
              onMove={() => setEnableModal('move')}
            />
          </>
        )}

        {state.mode === 'has_warehouse_copy' && (
          <>
            <StorageCard>
              <StorageModeRow mode="has_warehouse_copy" />
              <StorageMetaRow label="Copy name">
                <code className="text-code-inline break-all">{copyName}</code>
              </StorageMetaRow>
              <StorageMetaRow label="Postgres size">{postgresSize ?? '—'}</StorageMetaRow>
              <StorageMetaRow label="Copy size">{warehouseSize}</StorageMetaRow>
              <StorageSyncRows state={state} />
            </StorageCard>
            <Button type="button" variant="danger" onClick={() => setConfirmDetach(true)}>
              Detach Warehouse copy
            </Button>
          </>
        )}

        {state.mode === 'warehouse_backed' && (
          <>
            <StorageCard>
              <StorageModeRow mode="warehouse_backed" />
              <StorageMetaRow label="Size">{warehouseSize}</StorageMetaRow>
              {state.migrationCompletedAt && (
                <StorageMetaRow label="Moved">
                  <TimestampInfo
                    className="text-sm text-foreground-light"
                    utcTimestamp={state.migrationCompletedAt}
                    displayAs="local"
                  />
                </StorageMetaRow>
              )}
            </StorageCard>
            <Button type="button" variant="default" onClick={() => setSnapshotsOpen(true)}>
              View snapshots
            </Button>
          </>
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
        size="small"
        title="Detach Warehouse copy"
        description={
          <>
            Detaching deletes the Warehouse copy{' '}
            <code className="text-code-inline break-keep">{copyName}</code>. Your source table and
            its data in Postgres are unaffected.
          </>
        }
        confirmLabel="Detach"
        cancelLabel="Cancel"
      />

      <WarehouseDetachModal
        open={detachProgress}
        tableKey={tableKey}
        copyName={copyName}
        onOpenChange={setDetachProgress}
      />

      {state.mode === 'warehouse_backed' && (
        <WarehouseTimeTravelFlow
          tableKey={tableKey}
          sheetOpen={snapshotsOpen}
          onSheetOpenChange={setSnapshotsOpen}
        />
      )}
    </>
  )
}
