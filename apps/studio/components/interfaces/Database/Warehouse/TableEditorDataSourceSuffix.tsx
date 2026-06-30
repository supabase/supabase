import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { useSnapshot } from 'valtio'

import { warehouseDemoStore, type WarehouseTableState } from './warehouseDemoStore'
import { getSourceTableKey, isWarehouseSchema } from './warehouseNaming.utils'
import { formatWarehouseLagLabel } from './warehouseTableEditor.utils'

function getTableEditorDataSourceSuffix(
  schema: string,
  table: string,
  warehouseTables: Record<string, WarehouseTableState>
): { label: string; lagLabel?: string; tooltip: string } | null {
  if (isWarehouseSchema(schema)) {
    const sourceTableKey = getSourceTableKey(schema, table)
    const lagSeconds = warehouseTables[sourceTableKey]?.lagSeconds ?? 12

    return {
      label: 'Warehouse copy',
      lagLabel: formatWarehouseLagLabel(lagSeconds),
      tooltip: `Read-only Warehouse copy of ${sourceTableKey}`,
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
  const suffix = getTableEditorDataSourceSuffix(schema, table, warehouseSnap.tables)

  if (!suffix) return null

  return (
    <>
      <span className="mx-1.5">·</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default truncate text-foreground">
            {suffix.label}
            {suffix.lagLabel !== undefined && (
              <span className="text-foreground-lighter ml-1">({suffix.lagLabel})</span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{suffix.tooltip}</TooltipContent>
      </Tooltip>
    </>
  )
}
