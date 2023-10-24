import { useCallback, useState } from 'react'
import { Item, ItemParams, Menu, PredicateParams, Separator } from 'react-contexify'

import { SupaRow, SupaTable } from 'components/grid/types'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useTableRowDeleteMutation } from 'data/table-rows/table-row-delete-mutation'
import { IconClipboard, IconEdit, IconTrash, Modal } from 'ui'
import { useDispatch, useTrackedState } from '../../store'
import { copyToClipboard, formatClipboardValue } from '../../utils'

export const ROW_CONTEXT_MENU_ID = 'row-context-menu-id'

export type RowContextMenuProps = {
  table: SupaTable
  rows: SupaRow[]
}

const RowContextMenu = ({ table, rows }: RowContextMenuProps) => {
  const state = useTrackedState()
  const dispatch = useDispatch()

  const [deletingRow, setDeletingRow] = useState<SupaRow | null>(null)

  const { project } = useProjectContext()
  const { mutate: deleteRows } = useTableRowDeleteMutation({
    onSuccess: (res, variables) => {
      dispatch({ type: 'REMOVE_ROWS', payload: { rowIdxs: [variables.rows[0].idx] } })
      dispatch({
        type: 'SELECTED_ROWS_CHANGE',
        payload: { selectedRows: new Set() },
      })
      setDeletingRow(null)
    },
    onError: (error) => {
      if (state.onError) state.onError(error)
    },
  })

  function onDeleteRow(p: ItemParams) {
    const { props } = p
    const { rowIdx } = props
    const row = rows[rowIdx]
    if (!row) return

    setDeletingRow(row)
  }

  function onConfirmDeleteRow() {
    if (!deletingRow || !project) return

    deleteRows({
      projectRef: project.ref,
      connectionString: project.connectionString,
      table,
      rows: [deletingRow],
    })
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

      <ConfirmationModal
        visible={deletingRow !== null}
        header="Confirm to delete"
        buttonLabel="Confirm"
        onSelectCancel={() => setDeletingRow(null)}
        onSelectConfirm={() => {
          onConfirmDeleteRow()
        }}
      >
        <Modal.Content>
          <p className="py-4 text-sm text-foreground-light">
            Are you sure you want to delete this row? This action cannot be undone.
          </p>
        </Modal.Content>
      </ConfirmationModal>
    </>
  )
}
export default RowContextMenu
