import { ArrowRight, ChevronDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import {
  formatWarehouseSize,
  useWarehouseTableState,
  type WarehouseMode,
  type WarehouseTableState,
} from './warehouseDemoStore'
import { WarehouseDetachModal } from './WarehouseDetachModal'
import { WarehouseEnablementModal, type EnablementVariant } from './WarehouseEnablementModal'
import { WarehouseSyncChip } from './WarehouseSyncChip'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'

interface WarehouseEditorPanelProps {
  tableKey: string
  tableName: string
  postgresSize?: string
}

interface StorageModeConfig {
  title: string
  description: string
}

const STORAGE_MODE_CONFIG: Record<WarehouseMode, StorageModeConfig> = {
  postgres: {
    title: 'Postgres',
    description: 'Reads and writes on Postgres.',
  },
  has_warehouse_copy: {
    title: 'Postgres + Warehouse',
    description:
      'Writes on Postgres. Analytical queries on Warehouse. Copy stays in sync with Postgres.',
  },
  warehouse_backed: {
    title: 'Warehouse',
    description: 'Reads and writes on Warehouse.',
  },
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString()
}

function StorageCard({ children }: { children: ReactNode }) {
  return <div className="rounded-md border bg-surface-75 divide-y text-sm">{children}</div>
}

function StorageMetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <span className="text-foreground-light shrink-0">{label}</span>
      <div className="text-foreground text-right min-w-0">{children}</div>
    </div>
  )
}

function StorageModeHeader({
  title,
  description,
  trailing,
}: {
  title: string
  description: string
  trailing?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="min-w-0 space-y-1">
        <p className="text-foreground">{title}</p>
        <p className="text-xs leading-relaxed text-foreground-light">{description}</p>
      </div>
      {trailing}
    </div>
  )
}

function StorageCopyFlow({
  sourceName,
  sourceSize,
  copyName,
  copySize,
}: {
  sourceName: string
  sourceSize?: string
  copyName: string
  copySize: string
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs text-foreground-light">Postgres</p>
          <code className="text-code-inline break-all">{sourceName}</code>
          <p className="mt-1 text-foreground-light">{sourceSize ?? '—'}</p>
        </div>
        <ArrowRight
          className="mt-5 size-4 shrink-0 text-foreground-light"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1 text-right">
          <p className="mb-1 text-xs text-foreground-light">Warehouse copy</p>
          <code className="text-code-inline break-all">{copyName}</code>
          <p className="mt-1 text-foreground-light">{copySize}</p>
        </div>
      </div>
    </div>
  )
}

function StorageSyncMeta({ state }: { state: WarehouseTableState }) {
  const hasSyncMeta =
    state.syncState !== undefined ||
    state.lastSyncedAt !== undefined ||
    state.lagSeconds !== undefined

  if (!hasSyncMeta) return null

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 px-4 py-2.5 text-xs text-foreground-light">
      {state.syncState && <WarehouseSyncChip syncState={state.syncState} />}
      {state.syncState && (state.lastSyncedAt !== undefined || state.lagSeconds !== undefined) && (
        <span aria-hidden="true">·</span>
      )}
      {state.lastSyncedAt !== undefined && (
        <span>Last synced {formatTimestamp(state.lastSyncedAt)}</span>
      )}
      {state.lastSyncedAt !== undefined && state.lagSeconds !== undefined && (
        <span aria-hidden="true">·</span>
      )}
      {state.lagSeconds !== undefined && <span>Lag {state.lagSeconds}s</span>}
    </div>
  )
}

function CreateWarehouseCopyButton({ onAttach, onMove }: { onAttach: () => void; onMove: () => void }) {
  return (
    <div className="flex">
      <Button
        type="button"
        variant="default"
        className="rounded-r-none hover:z-10"
        onClick={onAttach}
      >
        Create Warehouse copy
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

  const copyName = state.copyName ?? `warehouse.${tableName}`
  const warehouseSize = formatWarehouseSize(state.warehouseSizeBytes)
  const modeConfig = STORAGE_MODE_CONFIG[state.mode]

  return (
    <>
      <div className="space-y-4">
        <h5>Storage</h5>

        {state.mode === 'postgres' && (
          <>
            <StorageCard>
              <StorageModeHeader
                title={modeConfig.title}
                description={modeConfig.description}
              />
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
              <StorageModeHeader
                title={modeConfig.title}
                description={modeConfig.description}
              />
              <StorageCopyFlow
                sourceName={tableKey}
                sourceSize={postgresSize}
                copyName={copyName}
                copySize={warehouseSize}
              />
              <StorageSyncMeta state={state} />
            </StorageCard>
            <Button type="button" variant="danger" onClick={() => setConfirmDetach(true)}>
              Detach Warehouse copy
            </Button>
          </>
        )}

        {state.mode === 'warehouse_backed' && (
          <StorageCard>
            <StorageModeHeader title={modeConfig.title} description={modeConfig.description} />
            <StorageMetaRow label="Size">{warehouseSize}</StorageMetaRow>
            {state.migrationCompletedAt && (
              <StorageMetaRow label="Moved">
                <span className="text-foreground-light">
                  {formatTimestamp(state.migrationCompletedAt)}
                </span>
              </StorageMetaRow>
            )}
          </StorageCard>
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
            This will drop the Warehouse copy of{' '}
            <code className="text-code-inline break-keep">{copyName}</code>. The source table will
            be unaffected and your data will remain in Postgres.
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
    </>
  )
}
