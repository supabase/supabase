import { ChevronDown, History } from 'lucide-react'
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
} from './warehouseDemoStore'
import { WarehouseDetachModal } from './WarehouseDetachModal'
import { WarehouseEnablementModal, type EnablementVariant } from './WarehouseEnablementModal'
import { WarehouseSyncChip } from './WarehouseSyncChip'
import { WarehouseTimeTravelFlow } from './WarehouseTimeTravelFlow'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'

const MODE_LABELS: Record<WarehouseMode, string> = {
  postgres: 'Postgres',
  has_warehouse_copy: 'Postgres + Warehouse',
  warehouse_backed: 'Warehouse',
}

const MODE_TOOLTIPS: Partial<Record<WarehouseMode, ReactNode>> = {
  has_warehouse_copy: (
    <>
      Kept in the Postgres heap with a synced columnar copy in Warehouse. Changes in Postgres
      propagate to the copy; sync is one-way.
    </>
  ),
  warehouse_backed: (
    <>This table&apos;s storage was moved to Warehouse. The Postgres heap no longer exists.</>
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

function ModeLabel({ mode }: { mode: WarehouseMode }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <span>{MODE_LABELS[mode]}</span>
      {MODE_TOOLTIPS[mode] && (
        <InfoTooltip side="top" className="max-w-80">
          {MODE_TOOLTIPS[mode]}
        </InfoTooltip>
      )}
    </div>
  )
}

interface WarehouseTableStoragePanelProps {
  tableKey: string
  postgresSize?: string
}

export function WarehouseTableStoragePanel({
  tableKey,
  postgresSize,
}: WarehouseTableStoragePanelProps) {
  const state = useWarehouseTableState(tableKey)
  const { mode } = state
  const warehouseSize = formatWarehouseSize(state.warehouseSizeBytes)
  const copyName = state.copyName ?? `warehouse.${tableKey.split('.').pop() ?? tableKey}`

  const [enablementModal, setEnablementModal] = useState<EnablementVariant | null>(null)
  const [detachConfirm, setDetachConfirm] = useState(false)
  const [detachProgress, setDetachProgress] = useState(false)
  const [timeTravelOpen, setTimeTravelOpen] = useState(false)

  const tableName = tableKey.split('.').pop() ?? tableKey

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="divide-y rounded-md border bg-surface-75 text-sm">
          <MetaRow label="Mode">
            <ModeLabel mode={mode} />
          </MetaRow>

          {mode === 'postgres' && <MetaRow label="Size">{postgresSize ?? '—'}</MetaRow>}

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
            </>
          )}

          {mode === 'warehouse_backed' && (
            <>
              <MetaRow label="Size">{warehouseSize}</MetaRow>
              {state.migrationCompletedAt !== undefined && (
                <MetaRow label="Moved">
                  <TimestampInfo
                    className="text-sm text-foreground-light"
                    utcTimestamp={state.migrationCompletedAt}
                    displayAs="local"
                  />
                </MetaRow>
              )}
            </>
          )}
        </div>

        {mode === 'postgres' && (
          <div className="flex">
            <Button
              type="button"
              className="rounded-r-none"
              onClick={() => setEnablementModal('attach')}
            >
              Copy to Warehouse
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  icon={<ChevronDown />}
                  className="rounded-l-none border-l-0 px-2"
                  aria-label="More storage actions"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEnablementModal('move')}>
                  Move to Warehouse
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {mode === 'has_warehouse_copy' && (
          <Button type="button" variant="default" onClick={() => setDetachConfirm(true)}>
            Detach Warehouse copy
          </Button>
        )}

        {mode === 'warehouse_backed' && (
          <Button
            type="button"
            variant="default"
            icon={<History />}
            onClick={() => setTimeTravelOpen(true)}
          >
            View snapshots
          </Button>
        )}
      </div>

      {enablementModal && (
        <WarehouseEnablementModal
          open={true}
          variant={enablementModal}
          tableKey={tableKey}
          tableName={tableName}
          onOpenChange={(open) => {
            if (!open) setEnablementModal(null)
          }}
        />
      )}

      <DiscardChangesConfirmationDialog
        visible={detachConfirm}
        onCancel={() => setDetachConfirm(false)}
        onClose={() => {
          setDetachProgress(true)
          setDetachConfirm(false)
        }}
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

      {detachProgress && (
        <WarehouseDetachModal
          open={true}
          tableKey={tableKey}
          copyName={copyName}
          onOpenChange={(open) => {
            if (!open) setDetachProgress(false)
          }}
        />
      )}

      <WarehouseTimeTravelFlow
        tableKey={tableKey}
        sheetOpen={timeTravelOpen}
        onSheetOpenChange={setTimeTravelOpen}
      />
    </>
  )
}
