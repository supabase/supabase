import { useQueryClient } from '@tanstack/react-query'
import { ROW_CONTEXT_MENU_ID } from 'components/grid/constants'
import type { SupaRow } from 'components/grid/types'
import { queueRowDeletesWithOptimisticUpdate } from 'components/grid/utils/queueOperationUtils'
import {
  useIsQueueOperationsEnabled,
  useIsTableFilterBarEnabled,
} from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Copy, Edit, ListFilter, Trash } from 'lucide-react'
import { useCallback } from 'react'
import { Item, ItemParams, Menu } from 'react-contexify'
import { toast } from 'sonner'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { copyToClipboard, DialogSectionSeparator } from 'ui'

import { formatClipboardValue } from '../../utils/common'
import { buildFilterFromCellValue, isComplexValue } from '../header/filter/FilterPopoverNew.utils'

type RowContextMenuProps = {
  rows: SupaRow[]
}

type RowContextMenuItemProps = ItemParams<{ rowIdx: number }, string>

export const RowContextMenu = ({ rows }: RowContextMenuProps) => {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const tableEditorSnap = useTableEditorStateSnapshot()
  const snap = useTableEditorTableStateSnapshot()
  const isQueueOperationsEnabled = useIsQueueOperationsEnabled()
  const isTableFilterBarEnabled = useIsTableFilterBarEnabled()

  function onDeleteRow(p: RowContextMenuItemProps) {
    const rowIdx = p.props?.rowIdx
    if (rowIdx === undefined || rowIdx === null) return

    const row = rows[rowIdx]
    if (!row) {
      toast.error('Row not found')
      return
    }

    if (isQueueOperationsEnabled) {
      queueRowDeletesWithOptimisticUpdate({
        rows: [row],
        table: snap.originalTable,
        queryClient,
        queueOperation: tableEditorSnap.queueOperation,
        projectRef: project?.ref,
      })
      return
    }

    tableEditorSnap.onDeleteRows([row])
  }

  function onEditRowClick(p: RowContextMenuItemProps) {
    const rowIdx = p.props?.rowIdx
    if (rowIdx === undefined || rowIdx === null) return

    const row = rows[rowIdx]
    tableEditorSnap.onEditRow(row)
  }

  const onCopyCellContent = useCallback(
    (p: RowContextMenuItemProps) => {
      const rowIdx = p.props?.rowIdx
      if (!snap.selectedCellPosition || rowIdx === undefined || rowIdx === null) return

      const row = rows[rowIdx]
      const columnKey = snap.gridColumns[snap.selectedCellPosition.idx as number].key

      const value = row[columnKey]
      const text = formatClipboardValue(value)

      copyToClipboard(text)
      toast.success('Copied cell value to clipboard')
    },
    [rows, snap.gridColumns, snap.selectedCellPosition]
  )

  const onCopyRowContent = useCallback(
    (p: RowContextMenuItemProps) => {
      const rowIdx = p.props?.rowIdx
      if (rowIdx === undefined || rowIdx === null) return

      const row = rows[rowIdx]
      copyToClipboard(JSON.stringify(row))
      toast.success('Copied row to clipboard')
    },
    [rows]
  )

  const getRowAndColumn = useCallback(
    (rowIdx: number | undefined | null) => {
      if (!snap.selectedCellPosition || rowIdx === undefined || rowIdx === null) {
        return null
      }

      const row = rows[rowIdx]
      const column = snap.gridColumns[snap.selectedCellPosition.idx as number]

      if (!row || !column) return null

      return { row, column }
    },
    [rows, snap.selectedCellPosition, snap.gridColumns]
  )

  const onFilterByValue = useCallback(
    (p: RowContextMenuItemProps) => {
      const result = getRowAndColumn(p.props?.rowIdx)
      if (!result) return

      const { row, column } = result
      const newFilter = buildFilterFromCellValue(column.key, row[column.key])
      snap.setFilters([...snap.filters, newFilter])

      const displayValue = newFilter.value === 'null' ? 'NULL' : newFilter.value
      toast.success(`Filtering ${column.name} by ${displayValue}`)
    },
    [getRowAndColumn, snap]
  )

  const isFilterByValueHidden = useCallback(
    ({ props: itemProps }: { props?: { rowIdx: number } }) => {
      if (!isTableFilterBarEnabled) return true

      const result = getRowAndColumn(itemProps?.rowIdx)
      if (!result) return true

      return isComplexValue(result.row[result.column.key])
    },
    [isTableFilterBarEnabled, getRowAndColumn]
  )

  return (
    <Menu id={ROW_CONTEXT_MENU_ID} animation={false} className="!min-w-36">
      <Item onClick={onCopyCellContent}>
        <Copy size={12} />
        <span className="ml-2 text-xs">Copy cell</span>
      </Item>
      <Item onClick={onCopyRowContent}>
        <Copy size={12} />
        <span className="ml-2 text-xs">Copy row</span>
      </Item>
      <Item onClick={onFilterByValue} hidden={isFilterByValueHidden}>
        <ListFilter size={12} />
        <span className="ml-2 text-xs">Filter by value</span>
      </Item>

      {/* We can't just wrap this entire section in a fragment conditional
		  on snap.editable because of a bug in react-contexify. Only the
		  top-level children of Menu are cloned with the necessary bound props,
		  so Items must be direct children of Menu:
		  https://github.com/fkhadra/react-contexify/blob/8d9fc63ac13040d3250e8eefd593d50a3ebdd1e6/src/components/Menu.tsx#L295
		*/}
      {snap.editable && <DialogSectionSeparator className="my-1.5" />}
      <Item onClick={onEditRowClick} hidden={!snap.editable} data="edit">
        <Edit size={12} />
        <span className="ml-2 text-xs">Edit row</span>
      </Item>
      {snap.editable && <DialogSectionSeparator className="my-1.5" />}
      <Item onClick={onDeleteRow} hidden={!snap.editable} data="delete">
        <Trash size={12} />
        <span className="ml-2 text-xs">Delete row</span>
      </Item>
    </Menu>
  )
}
