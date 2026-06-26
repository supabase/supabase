import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useState, type ReactNode } from 'react'
import { Button } from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

import {
  formatWarehouseSize,
  useWarehouseTableState,
  type WarehouseMode,
} from './warehouseDemoStore'
import { WarehouseDetachModal } from './WarehouseDetachModal'
import { WarehouseEnablementModal } from './WarehouseEnablementModal'
import { WarehouseSyncChip } from './WarehouseSyncChip'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'

const MODE_LABELS: Record<WarehouseMode, string> = {
  postgres: 'Postgres heap',
  has_warehouse_copy: 'Postgres heap + Warehouse copy',
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

  const [enablementModalOpen, setEnablementModalOpen] = useState(false)
  const [detachConfirm, setDetachConfirm] = useState(false)
  const [detachProgress, setDetachProgress] = useState(false)

  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))
  const [, setConnectTab] = useQueryState('connectTab', parseAsString)

  const tableName = tableKey.split('.').pop() ?? tableKey

  const openCatalogConnect = () => {
    setConnectTab('catalog')
    setShowConnect(true)
  }

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
                <MetaRow label="Sync status">
                  <WarehouseSyncChip syncState={state.syncState} />
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
        </div>

        {mode === 'postgres' && (
          <Button
            type="button"
            variant="default"
            className="w-fit"
            onClick={() => setEnablementModalOpen(true)}
          >
            Copy to Warehouse
          </Button>
        )}

        {mode === 'has_warehouse_copy' && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="default" onClick={openCatalogConnect}>
              Connect externally
            </Button>
            <Button type="button" variant="danger" onClick={() => setDetachConfirm(true)}>
              Detach Warehouse copy
            </Button>
          </div>
        )}
      </div>

      {enablementModalOpen && (
        <WarehouseEnablementModal
          open={true}
          tableKey={tableKey}
          tableName={tableName}
          onOpenChange={(open) => {
            if (!open) setEnablementModalOpen(false)
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
    </>
  )
}
