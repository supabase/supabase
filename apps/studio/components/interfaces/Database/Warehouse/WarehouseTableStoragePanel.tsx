import { useParams } from 'common'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useState, type ReactNode } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

import {
  formatWarehouseSize,
  useWarehouseTableState,
  type WarehouseMode,
} from './warehouseDemoStore'
import { WarehouseDetachModal } from './WarehouseDetachModal'
import { WarehouseEnablementModal } from './WarehouseEnablementModal'
import { buildSqlEditorWarehouseUrl, getWarehouseQualifiedTableName } from './warehouseNaming.utils'
import { WarehouseSyncChip } from './WarehouseSyncChip'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'

const TYPE_LABELS: Record<WarehouseMode, string> = {
  postgres: 'Postgres',
  has_warehouse_copy: 'Postgres + Warehouse',
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <span className="shrink-0 text-foreground-lighter">{label}</span>
      <div className="min-w-0 text-right text-foreground">{children}</div>
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
  const { ref: projectRef } = useParams()
  const state = useWarehouseTableState(tableKey)
  const { mode } = state
  const warehouseSize = formatWarehouseSize(state.warehouseSizeBytes)
  const warehouseQualifiedName = state.copyName ?? getWarehouseQualifiedTableName(tableKey)

  const [enablementModalOpen, setEnablementModalOpen] = useState(false)
  const [detachConfirm, setDetachConfirm] = useState(false)
  const [detachProgress, setDetachProgress] = useState(false)

  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))
  const [, setConnectTab] = useQueryState('connectTab', parseAsString)

  const openCatalogConnect = () => {
    setConnectTab('catalog')
    setShowConnect(true)
  }

  const sqlEditorWarehouseUrl =
    projectRef !== undefined ? buildSqlEditorWarehouseUrl(projectRef, tableKey) : undefined

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="divide-y rounded-md border bg-surface-75 text-sm">
          <MetaRow label="Type">{TYPE_LABELS[mode]}</MetaRow>

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
              <MetaRow label="Postgres table">
                <div className="flex items-center justify-end gap-1.5">
                  <code className="text-code-inline break-all">{tableKey}</code>
                  <InfoTooltip side="top" className="max-w-72">
                    Used by the Table Editor and application writes.
                  </InfoTooltip>
                </div>
              </MetaRow>
              <MetaRow label="Warehouse table">
                <div className="flex items-center justify-end gap-1.5">
                  <code className="text-code-inline break-all">{warehouseQualifiedName}</code>
                  <InfoTooltip side="top" className="max-w-72">
                    Query this name explicitly in the SQL Editor for analytical workloads.
                  </InfoTooltip>
                </div>
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
          <div className="flex w-fit">
            {sqlEditorWarehouseUrl ? (
              <Button type="button" variant="default" className="rounded-r-none hover:z-10" asChild>
                <Link href={sqlEditorWarehouseUrl}>Query in Warehouse</Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                className="rounded-r-none hover:z-10"
                disabled
              >
                Query in Warehouse
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="default"
                  icon={<ChevronDown />}
                  className="shrink-0 rounded-l-none px-[4px] py-[5px] -ml-px"
                  aria-label="More warehouse actions"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={openCatalogConnect}>Connect externally</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDetachConfirm(true)}
                >
                  Detach Warehouse copy
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {enablementModalOpen && (
        <WarehouseEnablementModal
          open={true}
          tableKey={tableKey}
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
            <code className="text-code-inline break-keep">{warehouseQualifiedName}</code>. Your
            Postgres table and its data are unaffected.
          </>
        }
        confirmLabel="Detach"
        cancelLabel="Cancel"
      />

      {detachProgress && (
        <WarehouseDetachModal
          open={true}
          tableKey={tableKey}
          copyName={warehouseQualifiedName}
          onOpenChange={(open) => {
            if (!open) setDetachProgress(false)
          }}
        />
      )}
    </>
  )
}
