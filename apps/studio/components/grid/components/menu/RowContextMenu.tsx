import { Copy, Edit, Trash } from 'lucide-react'
import { useCallback } from 'react'
import { Item, ItemParams, Menu } from 'react-contexify'
import { toast } from 'sonner'

import { ROW_CONTEXT_MENU_ID } from 'components/grid/constants'
import type { SupaRow } from 'components/grid/types'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { copyToClipboard, DialogSectionSeparator } from 'ui'
import { formatClipboardValue } from '../../utils/common'

type RowContextMenuProps = {
  rows: SupaRow[]
}

type RowContextMenuItemProps = ItemParams<{ rowIdx: number }, string>

export const RowContextMenu = ({ rows }: RowContextMenuProps) => {
  const tableEditorSnap = useTableEditorStateSnapshot()
  const snap = useTableEditorTableStateSnapshot()

  function onDeleteRow(p: RowContextMenuItemProps) {
    const rowIdx = p.props?.rowIdx
    if (rowIdx === undefined || rowIdx === null) return

    const row = rows[rowIdx]
    if (row) tableEditorSnap.onDeleteRows([row])
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
