import type { SupaColumn, SupaTable } from 'components/grid/types'
import {
  ESTIMATED_CHARACTER_PIXEL_WIDTH,
  getColumnDefaultWidth,
} from 'components/grid/utils/gridColumns'
import {
  isBoolColumn,
  isDateColumn,
  isDateTimeColumn,
  isJsonColumn,
  isNumericalColumn,
  isTimeColumn,
} from 'components/grid/utils/types'

import type { DataTableColumn } from './types'

/**
 * Build DataTableRenderer columns from a Supabase grid `SupaTable` model (same widths/heuristics as react-data-grid).
 * Sorting is intentionally disabled here — table data uses server-side sort via the grid header / URL state.
 */
export function buildDataTableColumnsFromSupaTable(
  table: SupaTable
): DataTableColumn<Record<string, unknown>>[] {
  return table.columns.map((col: SupaColumn) => {
    const columnDefaultWidth = getColumnDefaultWidth(col)
    const columnWidthBasedOnName =
      (col.name.length + col.format.length) * ESTIMATED_CHARACTER_PIXEL_WIDTH
    const width =
      columnDefaultWidth < columnWidthBasedOnName ? columnWidthBasedOnName : columnDefaultWidth

    const dt = col.dataType.toLowerCase()
    let type: DataTableColumn<Record<string, unknown>>['type'] = 'text'
    if (isBoolColumn(dt)) type = 'boolean'
    else if (isJsonColumn(dt)) type = 'json'
    else if (isNumericalColumn(dt)) type = 'number'
    else if (isDateTimeColumn(dt)) type = 'datetime'
    else if (isDateColumn(dt) || isTimeColumn(dt)) type = 'date'

    return {
      id: col.name,
      name: col.name,
      width,
      minWidth: 80,
      sortable: false,
      resizable: true,
      type,
    }
  })
}
