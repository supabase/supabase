import { Clipboard, Edit, Trash } from 'lucide-react'
import { useCallback } from 'react'
import { Item, ItemParams, Menu } from 'react-contexify'

import type { SupaRow } from 'components/grid/types'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { ROW_CONTEXT_MENU_ID } from '.'
import { copyToClipboard, formatClipboardValue } from '../../utils/common'

export type RowContextMenuProps = {
  rows: SupaRow[]
}

const RowContextMenu = ({ rows }: RowContextMenuProps) => {
  const tableEditorSnap = useTableEditorStateSnapshot()
  const snap = useTableEditorTableStateSnapshot()

  function onDeleteRow(p: ItemParams) {
    const { props } = p
    const { rowIdx } = props
    const row = rows[rowIdx]
    if (row) tableEditorSnap.onDeleteRows([row])
  }

  function onEditRowClick(p: ItemParams) {
    const { props } = p
    const { rowIdx } = props
    const row = rows[rowIdx]
    tableEditorSnap.onEditRow(row)
  }

  const onCopyCellContent = useCallback(
    (p: ItemParams) => {
      const { props } = p

      if (!snap.selectedCellPosition || !props) {
        return
      }

      const { rowIdx } = props
      const row = rows[rowIdx]

      const columnKey = snap.gridColumns[snap.selectedCellPosition.idx as number].key

      const value = row[columnKey]
      const text = formatClipboardValue(value)

      copyToClipboard(text)
    },
    [rows, snap.gridColumns, snap.selectedCellPosition]
  )

  return (
    <>
      <Menu id={ROW_CONTEXT_MENU_ID} animation={false}>
        <Item onClick={onCopyCellContent}>
          <Clipboard size={14} />
          <span className="ml-2 text-xs">Copy cell content</span>
        </Item>
        <Item onClick={onEditRowClick} hidden={!snap.editable} data="edit">
          <Edit size={14} />
          <span className="ml-2 text-xs">Edit row</span>
        </Item>
        <Item onClick={onDeleteRow} hidden={!snap.editable} data="delete">
          <Trash size={14} stroke="red" />
          <span className="ml-2 text-xs">Delete row</span>
        </Item>
      </Menu>
    </>
  )
}
export default RowContextMenu
