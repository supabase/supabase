import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
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
  lagSuffix?: string
  lagTone?: 'warning' | 'destructive'
  tooltip: string
} | null {
  if (isWarehouseSchema(schema)) {
    const sourceTableKey = getSourceTableKey(schema, table)
    const tableState = warehouseTables[sourceTableKey]

    if (!projectReplication) {
      return {
        label: 'Warehouse copy',
        tooltip: getWarehouseCopyTooltip(sourceTableKey),
      }
    }

    const lagDisplay = getReplicationLagDisplay(projectReplication, tableState?.copyStatus)

    return {
      label: 'Warehouse copy',
      lagSuffix: lagDisplay.compactSuffix,
      lagTone:
        lagDisplay.tone === 'warning'
          ? 'warning'
          : lagDisplay.tone === 'destructive'
            ? 'destructive'
            : undefined,
      tooltip: `${getWarehouseCopyTooltip(sourceTableKey)}. ${lagDisplay.tooltip}`,
    }
  }

  const tableKey = getSourceTableKey(schema, table)
  if (warehouseTables[tableKey]?.mode === 'has_warehouse_copy') {
    return {
      label: 'Postgres (live)',
      tooltip: 'Live Postgres rows',
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
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default truncate text-foreground">
            {suffix.label}
            {suffix.lagSuffix !== undefined && (
              <span className={`ml-1 ${lagClassName}`}>({suffix.lagSuffix})</span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{suffix.tooltip}</TooltipContent>
      </Tooltip>
    </>
  )
}
