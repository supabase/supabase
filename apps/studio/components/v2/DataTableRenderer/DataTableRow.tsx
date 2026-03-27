'use client'

import { MoreHorizontal } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from 'ui'
import { DataTableCell } from './DataTableCell'
import type { DataTableColumn, EditingCell, RowAction } from './types'

interface DataTableRowProps<T = unknown> {
  row: T
  rowKey: string
  rowIndex: number
  columns: DataTableColumn<T>[]
  isSelected: boolean
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

export function DataTableRow<T extends Record<string, unknown>>({
  row,
  rowKey,
  rowIndex,
  columns,
  isSelected,
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
}: DataTableRowProps<T>) {
  const rowHeight = compact ? 'h-7' : 'h-[35px]'

  return (
    <tr
      className={cn(
        'group border-b border-secondary',
        rowHeight,
        isSelected ? 'bg-brand/10' : 'bg-dash-sidebar hover:bg-surface-200',
        onRowClick && 'cursor-pointer'
      )}
      onClick={onRowClick ? () => onRowClick(row) : undefined}
      onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(row) : undefined}
      onKeyDown={
        onRowClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onRowClick(row)
              }
            }
          : undefined
      }
    >
      {selectable && (
        <td
          className="w-10 min-w-10 max-w-10 px-2 align-middle text-center"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-control accent-brand cursor-pointer"
            checked={isSelected}
            onChange={(e) => onSelect(rowKey, e.target.checked)}
            aria-label={`Select row ${rowIndex + 1}`}
          />
        </td>
      )}

      {columns.map((col) => (
        <DataTableCell
          key={col.id}
          column={col}
          row={row}
          rowKey={rowKey}
          rowIndex={rowIndex}
          isEditing={editingCell?.rowKey === rowKey && editingCell?.columnId === col.id}
          onStartEdit={onStartEdit}
          onCommitEdit={onCommitEdit}
          onCancelEdit={onCancelEdit}
          editable={editable}
        />
      ))}

      {rowActions && rowActions.length > 0 && (
        <td
          className="w-8 min-w-8 max-w-8 px-0 align-middle text-center opacity-0 group-hover:opacity-100 focus-within:opacity-100"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="text"
                size="tiny"
                className="h-6 w-6 p-0"
                icon={<MoreHorizontal className="h-3.5 w-3.5" />}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="w-40">
              {rowActions.map((action) => {
                const isDisabled =
                  typeof action.disabled === 'function'
                    ? action.disabled(row)
                    : (action.disabled ?? false)
                const isDanger = action.variant === 'danger'
                return (
                  <DropdownMenuItem
                    key={action.id}
                    disabled={isDisabled}
                    className={cn(isDanger && 'text-destructive focus:text-destructive')}
                    onClick={() => action.onClick(row)}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      )}
    </tr>
  )
}
