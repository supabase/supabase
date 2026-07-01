import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { useSnapshot } from 'valtio'

import {
  useProjectReplication,
  warehouseDemoStore,
  type WarehouseProjectReplicationStatus,
  type WarehouseTableState,
} from './warehouseDemoStore'
import {
  getSourceTableKey,
  getWarehouseCopyTooltip,
  isWarehouseSchema,
} from './warehouseNaming.utils'
import { getReplicationLagDisplay } from './warehouseReplication.utils'

function getTableEditorDataSourceSuffix(
  schema: string,
  table: string,
  warehouseTables: Record<string, WarehouseTableState>,
  projectReplication: WarehouseProjectReplicationStatus | null
): {
  label: string
  labelTooltip: string
  lagSuffix?: string
  lagTooltip?: string
  lagTone?: 'warning' | 'destructive'
} | null {
  if (isWarehouseSchema(schema)) {
    const sourceTableKey = getSourceTableKey(schema, table)
    const tableState = warehouseTables[sourceTableKey]
    const labelTooltip = getWarehouseCopyTooltip(sourceTableKey)

    if (!projectReplication) {
      return {
        label: 'Warehouse copy',
        labelTooltip,
      }
    }

    const lagDisplay = getReplicationLagDisplay(projectReplication, tableState?.copyStatus)

    return {
      label: 'Warehouse copy',
      labelTooltip,
      lagSuffix: lagDisplay.compactSuffix,
      lagTooltip: lagDisplay.compactSuffix !== undefined ? lagDisplay.tooltip : undefined,
      lagTone:
        lagDisplay.tone === 'warning'
          ? 'warning'
          : lagDisplay.tone === 'destructive'
            ? 'destructive'
            : undefined,
    }
  }

  const tableKey = getSourceTableKey(schema, table)
  if (warehouseTables[tableKey]?.mode === 'has_warehouse_copy') {
    return {
      label: 'Postgres (live)',
      labelTooltip: 'Live Postgres rows',
    }
  }

  return null
}

interface TableEditorDataSourceSuffixProps {
  schema: string
  table: string
}

export function TableEditorDataSourceSuffix({ schema, table }: TableEditorDataSourceSuffixProps) {
  const warehouseSnap = useSnapshot(warehouseDemoStore)
  const projectReplication = useProjectReplication()
  const suffix = getTableEditorDataSourceSuffix(
    schema,
    table,
    warehouseSnap.tables,
    projectReplication
  )

  if (!suffix) return null

  const lagClassName =
    suffix.lagTone === 'destructive'
      ? 'text-destructive'
      : suffix.lagTone === 'warning'
        ? 'text-warning'
        : 'text-foreground-lighter'

  return (
    <>
      <span className="mx-1.5">·</span>
      <span className="inline-flex min-w-0 items-baseline truncate text-foreground">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default truncate">{suffix.label}</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">{suffix.labelTooltip}</TooltipContent>
        </Tooltip>
        {suffix.lagSuffix !== undefined && suffix.lagTooltip !== undefined && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn('ml-1 shrink-0 cursor-help', lagClassName)}>
                ({suffix.lagSuffix})
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{suffix.lagTooltip}</TooltipContent>
          </Tooltip>
        )}
      </span>
    </>
  )
}
