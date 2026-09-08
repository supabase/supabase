import { Copy, Edit, ListFilter, Trash } from 'lucide-react'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { copyToClipboard, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from 'ui'

import { useTableRowOperations } from '../../hooks/useTableRowOperations'
import { formatClipboardValue } from '../../utils/common'
import { buildFilterFromCellValue, isComplexValue } from '../header/filter/FilterPopoverNew.utils'
import type { SupaRow } from '@/components/grid/types'
import { useTableEditorStateSnapshot } from '@/state/table-editor'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

type RowContextMenuContentProps = {
  row: SupaRow
  selectedCellPosition?: { idx: number; rowIdx: number } | null
}

export const RowContextMenuContent = ({
  row,
  selectedCellPosition,
}: RowContextMenuContentProps) => {
  const tableEditorSnap = useTableEditorStateSnapshot()
  const snap = useTableEditorTableStateSnapshot()
  const { deleteRows } = useTableRowOperations()
  const activeCellPosition = selectedCellPosition ?? snap.selectedCellPosition

  const onDeleteRow = useCallback(() => {
    if (!row) {
      toast.error('Row not found')
      return
    }
    deleteRows({ rows: [row], table: snap.originalTable })
  }, [row, snap.originalTable, deleteRows])

  const onEditRowClick = useCallback(() => {
    tableEditorSnap.onEditRow(row)
  }, [row, tableEditorSnap])

  const onCopyCellContent = useCallback(() => {
    if (!activeCellPosition) return

    const column = snap.gridColumns[activeCellPosition.idx]
    if (!column) return

    const value = row[column.key]
    const text = formatClipboardValue(value)
    const isSensitive = snap.sensitiveDataColumns.has(column.key as string)

    void copyToClipboard(text, () => {
      if (isSensitive) {
        toast.warning('Copied sensitive data to clipboard')
      } else {
        toast.success('Copied cell value to clipboard')
      }
    })
  }, [activeCellPosition, row, snap.gridColumns, snap.sensitiveDataColumns])

  const onCopyRowContent = useCallback(() => {
    const hasSensitiveColumns = snap.gridColumns.some((col) =>
      snap.sensitiveDataColumns.has(col.key as string)
    )

    void copyToClipboard(JSON.stringify(row), () => {
      if (hasSensitiveColumns) {
        toast.warning('Copied row containing sensitive data to clipboard')
      } else {
        toast.success('Copied row to clipboard')
      }
    })
  }, [row, snap.gridColumns, snap.sensitiveDataColumns])

  const getRowAndColumn = useCallback(() => {
    if (!activeCellPosition) return null

    const column = snap.gridColumns[activeCellPosition.idx as number]
    if (!row || !column) return null

    return { row, column }
  }, [activeCellPosition, row, snap.gridColumns])

  const onFilterByValue = useCallback(() => {
    const result = getRowAndColumn()
    if (!result) return

    const { row, column } = result
    const newFilter = buildFilterFromCellValue(column.key, row[column.key])
    snap.setFilters([...snap.filters, newFilter])

    const displayValue = newFilter.value === 'null' ? 'NULL' : newFilter.value
    toast.success(`Filtering ${column.name} by ${displayValue}`)
  }, [getRowAndColumn, snap])

  const isFilterByValueVisible = useCallback(() => {
    const result = getRowAndColumn()
    if (!result) return false

    return !isComplexValue(result.row[result.column.key])
  }, [getRowAndColumn])

  return (
    <DropdownMenuContent align="start" side="right" sideOffset={0} className="w-36 min-w-36!">
      <DropdownMenuItem className="gap-x-2" onSelect={onCopyCellContent}>
        <Copy size={12} />
        <span className="text-xs">Copy cell</span>
      </DropdownMenuItem>
      <DropdownMenuItem className="gap-x-2" onSelect={onCopyRowContent}>
        <Copy size={12} />
        <span className="text-xs">Copy row</span>
      </DropdownMenuItem>
      {isFilterByValueVisible() && (
        <DropdownMenuItem className="gap-x-2" onSelect={onFilterByValue}>
          <ListFilter size={12} />
          <span className="text-xs">Filter by value</span>
        </DropdownMenuItem>
      )}
      {snap.editable && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-x-2" onSelect={onEditRowClick}>
            <Edit size={12} />
            <span className="text-xs">Edit row</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-x-2" onSelect={onDeleteRow}>
            <Trash size={12} />
            <span className="text-xs">Delete row</span>
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  )
}
