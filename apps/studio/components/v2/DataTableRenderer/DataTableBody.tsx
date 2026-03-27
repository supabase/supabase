'use client'

import type { DataTableColumn, EditingCell, RowAction } from './types'
import { DataTableRow } from './DataTableRow'

interface DataTableBodyProps<T = unknown> {
  rows: T[]
  columns: DataTableColumn<T>[]
  rowKey: string | ((row: T) => string)
  selectedRows: Set<string>
  selectable: boolean
  onSelect: (key: string, checked: boolean) => void
  onRowClick?: (row: T) => void
  onRowDoubleClick?: (row: T) => void
  rowActions?: RowAction<T>[]
  editingCell: EditingCell | null
  onStartEdit: (cell: EditingCell) => void
  onCommitEdit: (rowKey: string, columnId: string, value: unknown) => void
  onCancelEdit: () => void
  editable: boolean
  compact: boolean
}

function getKey<T extends Record<string, unknown>>(
  row: T,
  rowKey: string | ((row: T) => string)
): string {
  if (typeof rowKey === 'function') return rowKey(row)
  return String(row[rowKey])
}

export function DataTableBody<T extends Record<string, unknown>>({
  rows,
  columns,
  rowKey,
  selectedRows,
  selectable,
  onSelect,
  onRowClick,
  onRowDoubleClick,
  rowActions,
  editingCell,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  editable,
  compact,
}: DataTableBodyProps<T>) {
  return (
    <tbody>
      {rows.map((row, index) => {
        const key = getKey(row, rowKey)
        return (
          <DataTableRow
            key={key}
            row={row}
            rowKey={key}
            rowIndex={index}
            columns={columns}
            isSelected={selectedRows.has(key)}
            selectable={selectable}
            onSelect={onSelect}
            onRowClick={onRowClick}
            onRowDoubleClick={onRowDoubleClick}
            rowActions={rowActions}
            editingCell={editingCell}
            onStartEdit={onStartEdit}
            onCommitEdit={onCommitEdit}
            onCancelEdit={onCancelEdit}
            editable={editable}
            compact={compact}
          />
        )
      })}
    </tbody>
  )
}
