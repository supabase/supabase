import DataGrid, { Column } from '@supabase/react-data-grid'
import * as Tooltip from '@radix-ui/react-tooltip'
import { SupaRow, SupaTable } from 'components/grid'
import { IconKey } from 'ui'

export interface SelectorTableProps {
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
            <div className="text-brand-900">
              <IconKey size="tiny" strokeWidth={2} />
            </div>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div className="rounded bg-scale-100 py-1 px-2 leading-none shadow border border-scale-200">
              <span className="text-xs text-scale-1200">Primary key</span>
            </div>
          </Tooltip.Content>
        </Tooltip.Root>
      )}

      <span className="font-mono">{name}</span>
    </div>
  )
}

const formatter = (column: string, row: any) => {
  return (
    <div className="group sb-grid-select-cell__formatter overflow-hidden">
      <span className="font-mono text-xs truncate">{JSON.stringify(row[column])}</span>
    </div>
  )
}

const SelectorTable = ({ table, rows, onRowSelect }: SelectorTableProps) => {
  const columns: Column<SupaRow>[] = table.columns.map((column) => ({
    key: column.name,
    name: column.name,
    formatter: ({ row }: any) => formatter(column.name, row),
    headerRenderer: () => columnRender(column.name, column.isPrimaryKey),
    resizable: true,
    minWidth: 120,
  }))

  return (
    <DataGrid columns={columns} rows={rows} style={{ height: '100%' }} onRowClick={onRowSelect} />
  )
}

export default SelectorTable
