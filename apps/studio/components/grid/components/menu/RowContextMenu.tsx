import { ContextMenuContent } from '@ui/components/shadcn/ui/context-menu'
import { Copy, Edit, ListFilter, Trash } from 'lucide-react'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { ContextMenuItem_Shadcn_, ContextMenuSeparator_Shadcn_, copyToClipboard } from 'ui'

import { useTableRowOperations } from '../../hooks/useTableRowOperations'
import { formatClipboardValue } from '../../utils/common'
import { buildFilterFromCellValue, isComplexValue } from '../header/filter/FilterPopoverNew.utils'
import type { SupaRow } from '@/components/grid/types'
import { useTableEditorStateSnapshot } from '@/state/table-editor'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

type RowContextMenuContentProps = {
  row: SupaRow
}

export const RowContextMenuContent = ({ row }: RowContextMenuContentProps) => {
  const tableEditorSnap = useTableEditorStateSnapshot()
  const snap = useTableEditorTableStateSnapshot()
  const { deleteRows } = useTableRowOperations()

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
    if (!snap.selectedCellPosition) return

    const columnKey = snap.gridColumns[snap.selectedCellPosition.idx as number].key
    const value = row[columnKey]
    const text = formatClipboardValue(value)

    copyToClipboard(text)
    toast.success('Copied cell value to clipboard')
  }, [row, snap.gridColumns, snap.selectedCellPosition])

  const onCopyRowContent = useCallback(() => {
    copyToClipboard(JSON.stringify(row))
    toast.success('Copied row to clipboard')
  }, [row])

  const getRowAndColumn = useCallback(() => {
    if (!snap.selectedCellPosition) return null

    const column = snap.gridColumns[snap.selectedCellPosition.idx as number]
    if (!row || !column) return null

    return { row, column }
  }, [row, snap.selectedCellPosition, snap.gridColumns])

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
    <ContextMenuContent className="min-w-36!">
      <ContextMenuItem_Shadcn_ className="gap-x-2" onSelect={onCopyCellContent}>
        <Copy size={12} />
        <span className="text-xs">Copy cell</span>
      </ContextMenuItem_Shadcn_>
      <ContextMenuItem_Shadcn_ className="gap-x-2" onSelect={onCopyRowContent}>
        <Copy size={12} />
        <span className="text-xs">Copy row</span>
      </ContextMenuItem_Shadcn_>
      {isFilterByValueVisible() && (
        <ContextMenuItem_Shadcn_ className="gap-x-2" onSelect={onFilterByValue}>
          <ListFilter size={12} />
          <span className="text-xs">Filter by value</span>
        </ContextMenuItem_Shadcn_>
      )}
      {snap.editable && (
        <>
          <ContextMenuSeparator_Shadcn_ />
          <ContextMenuItem_Shadcn_ className="gap-x-2" onSelect={onEditRowClick}>
            <Edit size={12} />
            <span className="text-xs">Edit row</span>
          </ContextMenuItem_Shadcn_>
          <ContextMenuSeparator_Shadcn_ />
          <ContextMenuItem_Shadcn_ className="gap-x-2" onSelect={onDeleteRow}>
            <Trash size={12} />
            <span className="text-xs">Delete row</span>
          </ContextMenuItem_Shadcn_>
        </>
      )}
    </ContextMenuContent>
  )
}
