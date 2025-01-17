import { COLUMN_MIN_WIDTH } from 'components/grid/constants'
import type { SupaRow, SupaTable } from 'components/grid/types'
import {
  ESTIMATED_CHARACTER_PIXEL_WIDTH,
  getColumnDefaultWidth,
} from 'components/grid/utils/gridColumns'
import { Key } from 'lucide-react'
import DataGrid, { Column } from 'react-data-grid'
import { Tooltip_Shadcn_, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_ } from 'ui'

export interface SelectorGridProps {
  table: SupaTable
  rows: SupaRow[]
  onRowSelect: (row: SupaRow) => void
}

const columnRender = (name: string, isPrimaryKey = false) => {
  return (
    <div className="flex h-full items-center justify-center gap-2">
      {isPrimaryKey && (
        <Tooltip_Shadcn_>
          <TooltipTrigger_Shadcn_>
            <div className="text-brand">
              <Key size={14} strokeWidth={2} />
            </div>
          </TooltipTrigger_Shadcn_>
          <TooltipContent_Shadcn_ side="bottom">Primary key</TooltipContent_Shadcn_>
        </Tooltip_Shadcn_>
      )}

      <span className="sb-grid-column-header__inner__name">{name}</span>
    </div>
  )
}

const formatter = (column: string, row: SupaRow) => {
  const formattedValue = typeof row[column] === 'object' ? JSON.stringify(row[column]) : row[column]
  return (
    <div className="group sb-grid-select-cell__formatter overflow-hidden">
      <span className="text-sm truncate">{formattedValue}</span>
    </div>
  )
}

const SelectorGrid = ({ table, rows, onRowSelect }: SelectorGridProps) => {
  const columns: Column<SupaRow>[] = table.columns.map((column) => {
    const columnDefaultWidth = getColumnDefaultWidth(column)
    const columnWidthBasedOnName =
      (column.name.length + column.format.length) * ESTIMATED_CHARACTER_PIXEL_WIDTH
    const columnWidth =
      columnDefaultWidth < columnWidthBasedOnName ? columnWidthBasedOnName : columnDefaultWidth

    const result: Column<SupaRow> = {
      key: column.name,
      name: column.name,
      renderCell: (props) => formatter(column.name, props.row),
      renderHeaderCell: () => columnRender(column.name, column.isPrimaryKey),
      resizable: true,
      width: columnWidth,
      minWidth: COLUMN_MIN_WIDTH,
    }
    return result
  })

  return (
    <DataGrid
      columns={columns}
      rows={rows}
      style={{ height: '100%' }}
      onCellClick={(props) => onRowSelect(props.row)}
      rowClass={() => 'cursor-pointer'}
    />
  )
}

export default SelectorGrid
