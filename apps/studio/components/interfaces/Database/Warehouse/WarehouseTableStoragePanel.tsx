import { useParams } from 'common'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useState, type ReactNode } from 'react'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

import { WarehouseDetachModal } from './WarehouseDetachModal'
import { WarehouseEnablementModal } from './WarehouseEnablementModal'
import { buildSqlEditorWarehouseUrl, getWarehouseQualifiedTableName } from './warehouseNaming.utils'
import { WarehouseSyncChip } from './WarehouseSyncChip'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { useWarehouseSetupStatusQuery } from '@/data/warehouse/warehouse-setup-status-query'
import { useWarehouseTableState } from '@/data/warehouse/warehouse-tables-query'
import {
  formatWarehouseSize,
  isWarehouseSetupInProgress,
  WAREHOUSE_SETUP_STATUS_LABELS,
  type WarehouseMode,
  type WarehouseSetupStatus,
} from '@/data/warehouse/warehouse-types'

const TYPE_LABELS: Record<WarehouseMode, string> = {
  postgres: 'Postgres',
  has_warehouse_copy: 'Postgres + Warehouse',
}

const SETUP_VARIANTS: Record<
  WarehouseSetupStatus,
  'default' | 'success' | 'warning' | 'destructive'
> = {
  not_started: 'default',
  setting_up: 'warning',
  copying: 'warning',
  installing_fdw: 'warning',
  complete: 'success',
  error: 'destructive',
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
  schema: string
  name: string
  postgresSize?: string
}

export function WarehouseTableStoragePanel({
  schema,
  name,
  postgresSize,
}: WarehouseTableStoragePanelProps) {
  const { ref: projectRef } = useParams()
  const tableKey = `${schema}.${name}`
  const state = useWarehouseTableState(tableKey)
  const { mode } = state

  // Check the async Warehouse setup status whenever the table settings surface is opened; it polls
  // while a setup phase is still running (pipeline → copy → FDW install).
  const { data: setup } = useWarehouseSetupStatusQuery({ projectRef }, { enabled: !!projectRef })
  const setupStatus = setup?.setup_status
  const setupMessage = setup?.steps.find(
    (step) => step.status === 'running' || step.status === 'error'
  )?.message
  const setupInProgress = isWarehouseSetupInProgress(setupStatus)
  // The Warehouse copy is only queryable once the FDW install completes. If the status is
  // unavailable, don't block the action.
  const canQueryWarehouse = setupStatus === undefined || setupStatus === 'complete'
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
              {setupStatus && setupStatus !== 'not_started' && (
                <MetaRow label="Setup">
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={SETUP_VARIANTS[setupStatus]}>
                      {WAREHOUSE_SETUP_STATUS_LABELS[setupStatus]}
                    </Badge>
                    {setupMessage && (
                      <span className="text-right text-xs text-foreground-lighter">
                        {setupMessage}
                      </span>
                    )}
                  </div>
                </MetaRow>
              )}
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
            {canQueryWarehouse && sqlEditorWarehouseUrl ? (
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
                {setupInProgress ? 'Preparing…' : 'Query in Warehouse'}
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
          schema={schema}
          name={name}
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
            Detaching removes the Warehouse copy{' '}
            <code className="text-code-inline break-keep">{warehouseQualifiedName}</code> from the
            catalog. Your Postgres table and its data are unaffected.
          </>
        }
        confirmLabel="Detach"
        cancelLabel="Cancel"
      />

      {detachProgress && (
        <WarehouseDetachModal
          open={true}
          schema={schema}
          name={name}
          copyName={warehouseQualifiedName}
          onOpenChange={(open) => {
            if (!open) setDetachProgress(false)
          }}
        />
      )}
    </>
  )
}
