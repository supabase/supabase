import { Clipboard, Edit, Trash } from 'lucide-react'
import { useCallback } from 'react'
import { Item, ItemParams, Menu } from 'react-contexify'
import { toast } from 'sonner'

import { ROW_CONTEXT_MENU_ID } from 'components/grid/constants'
import type { SupaRow } from 'components/grid/types'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { copyToClipboard, DialogSectionSeparator } from 'ui'
import { formatClipboardValue } from '../../utils/common'

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
      toast.success('Copied cell value to clipboard')
    },
    [rows, snap.gridColumns, snap.selectedCellPosition]
  )

  const onCopyRowContent = useCallback(
    (p: ItemParams) => {
      const { props } = p
      const { rowIdx } = props
      const row = rows[rowIdx]
      copyToClipboard(JSON.stringify(row))
      toast.success('Copied row to clipboard')
    },
    [rows]
  )

  return (
    <Menu id={ROW_CONTEXT_MENU_ID} animation={false} className="!min-w-36">
      <Item onClick={onCopyCellContent}>
        <Clipboard size={12} />
        <span className="ml-2 text-xs">Copy cell</span>
      </Item>
      <Item onClick={onCopyRowContent}>
        <Clipboard size={12} />
        <span className="ml-2 text-xs">Copy row</span>
      </Item>
      <DialogSectionSeparator className="my-1.5" />
      <Item onClick={onEditRowClick} hidden={!snap.editable} data="edit">
        <Edit size={12} />
        <span className="ml-2 text-xs">Edit row</span>
      </Item>
      <DialogSectionSeparator className="my-1.5" />
      <Item onClick={onDeleteRow} hidden={!snap.editable} data="delete">
        <Trash size={12} />
        <span className="ml-2 text-xs">Delete row</span>
      </Item>
    </Menu>
  )
}
export default RowContextMenu
