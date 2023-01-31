import * as React from 'react'
import { Menu, Item, ItemParams, PredicateParams } from 'react-contexify'
import { IconTrash, IconClipboard, IconEdit } from 'ui'
import { useDispatch, useTrackedState } from '../../store'
import { formatClipboardValue, copyToClipboard } from '../../utils'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'

export const ROW_CONTEXT_MENU_ID = 'row-context-menu-id'

type RowContextMenuProps = {}

const RowContextMenu: React.FC<RowContextMenuProps> = ({}) => {
  const state = useTrackedState()
  const dispatch = useDispatch()

  function onDeleteRow(p: ItemParams) {
    confirmAlert({
      title: 'Confirm to delete',
      message: 'Are you sure you want to delete this row? This action cannot be undone.',
      onAsyncConfirm: async () => {
        const { props } = p
        const { rowIdx } = props
        const row = state.rows[rowIdx]
        if (!row) return

        const { error } = await state.rowService!.delete([row])
        if (error) {
          if (state.onError) state.onError(error)
        } else {
          dispatch({ type: 'REMOVE_ROWS', payload: { rowIdxs: [row.idx] } })
          dispatch({
            type: 'SELECTED_ROWS_CHANGE',
            payload: { selectedRows: new Set() },
          })
        }
      },
    })
  }

  function onEditRowClick(p: ItemParams) {
    const { props } = p
    const { rowIdx } = props
    const row = state.rows[rowIdx]
    if (state.onEditRow) state.onEditRow(row)
  }

  function isItemHidden({ data }: PredicateParams) {
    if (data === 'edit') return state.onEditRow == undefined
    if (data === 'delete') return !state.editable
    return false
  }

  function onCopyCellContent(p: ItemParams) {
    const { props } = p

    if (!state.selectedCellPosition || !props) {
      return
    }

    const { rowIdx } = props
    const row = state.rows[rowIdx]

    const columnKey = state.gridColumns[state.selectedCellPosition?.idx as number].key

    const value = row[columnKey]
    const text = formatClipboardValue(value)

    copyToClipboard(text)
  }

  return (
    <>
      <Menu id={ROW_CONTEXT_MENU_ID} animation={false}>
        <Item onClick={onCopyCellContent}>
          <IconClipboard size="tiny" />
          <span className="sb-grid-context-menu__label">Copy cell content</span>
        </Item>
        <Item onClick={onEditRowClick} hidden={isItemHidden} data="edit">
          <IconEdit size="tiny" />
          <span className="sb-grid-context-menu__label">Edit row</span>
        </Item>
        <Item onClick={onDeleteRow} hidden={isItemHidden} data="delete">
          <IconTrash size="tiny" stroke="red" />
          <span className="sb-grid-context-menu__label">Delete row</span>
        </Item>
      </Menu>
    </>
  )
}
export default RowContextMenu
