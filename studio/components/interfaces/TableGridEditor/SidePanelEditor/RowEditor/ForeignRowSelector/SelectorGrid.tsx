import DataGrid, { Column } from 'react-data-grid'
import * as Tooltip from '@radix-ui/react-tooltip'
import { SupaRow, SupaTable } from 'components/grid'
import { IconKey } from 'ui'
import {
  ESTIMATED_CHARACTER_PIXEL_WIDTH,
  getColumnDefaultWidth,
} from 'components/grid/utils/gridColumns'
import { COLUMN_MIN_WIDTH } from 'components/grid/constants'

export interface SelectorGridProps {
  table: SupaTable
  rows: SupaRow[]
  onRowSelect: (row: SupaRow) => void
}

const columnRender = (name: string, isPrimaryKey = false) => {
  return (
    <div className="flex h-full items-center justify-center gap-2">
      {isPrimaryKey && (
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger>
            <div className="text-brand">
              <IconKey size="tiny" strokeWidth={2} />
            </div>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div className="rounded bg-scale-100 py-1 px-2 leading-none shadow border border-scale-200">
                <span className="text-xs text-foreground">Primary key</span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      )}

      <span className="sb-grid-column-header__inner__name">{name}</span>
    </div>
  )
}

const formatter = (column: string, row: any) => {
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

    return {
      key: column.name,
      name: column.name,
      formatter: ({ row }: any) => formatter(column.name, row),
      headerRenderer: () => columnRender(column.name, column.isPrimaryKey),
      resizable: true,
      width: columnWidth,
      minWidth: COLUMN_MIN_WIDTH,
    }
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
