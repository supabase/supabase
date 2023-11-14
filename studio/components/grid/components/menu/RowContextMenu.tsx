import { Item, ItemParams, Menu, PredicateParams, Separator } from 'react-contexify'
import { IconClipboard, IconEdit, IconTrash } from 'ui'

import { SupaRow } from 'components/grid/types'
import { useCallback } from 'react'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useTrackedState } from '../../store'
import { copyToClipboard, formatClipboardValue } from '../../utils'

export const ROW_CONTEXT_MENU_ID = 'row-context-menu-id'

export type RowContextMenuProps = {
  rows: SupaRow[]
}

const RowContextMenu = ({ rows }: RowContextMenuProps) => {
  const state = useTrackedState()
  const snap = useTableEditorStateSnapshot()

  function onDeleteRow(p: ItemParams) {
    const { props } = p
    const { rowIdx } = props
    const row = rows[rowIdx]
    if (row) snap.onDeleteRows([row])
  }

  function onEditRowClick(p: ItemParams) {
    const { props } = p
    const { rowIdx } = props
    const row = rows[rowIdx]
    if (state.onEditRow) state.onEditRow(row)
  }

  function isItemHidden({ data }: PredicateParams) {
    if (data === 'edit') return state.onEditRow == undefined
    if (data === 'delete') return !state.editable
    return false
  }

  const onCopyCellContent = useCallback(
    (p: ItemParams) => {
      const { props } = p

      if (!state.selectedCellPosition || !props) {
        return
      }

      const { rowIdx } = props
      const row = rows[rowIdx]

      const columnKey = state.gridColumns[state.selectedCellPosition?.idx as number].key

      const value = row[columnKey]
      const text = formatClipboardValue(value)

      copyToClipboard(text)
    },
    [rows, state.gridColumns, state.selectedCellPosition]
  )

  return (
    <>
      <Menu id={ROW_CONTEXT_MENU_ID} animation={false}>
        <Item onClick={onCopyCellContent}>
          <IconClipboard size="tiny" />
          <span className="ml-2 text-xs">Copy cell content</span>
        </Item>
        <Item onClick={onEditRowClick} hidden={isItemHidden} data="edit">
          <IconEdit size="tiny" />
          <span className="ml-2 text-xs">Edit row</span>
        </Item>
        {state.editable && <Separator />}
        <Item onClick={onDeleteRow} hidden={isItemHidden} data="delete">
          <IconTrash size="tiny" stroke="red" />
          <span className="ml-2 text-xs">Delete row</span>
        </Item>
      </Menu>
    </>
  )
}
export default RowContextMenu
