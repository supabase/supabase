import { Button, Dropdown, IconChevronDown, Divider, IconEdit, IconTrash } from '@supabase/ui'
import * as React from 'react'
import { useDispatch, useTrackedState } from '../../store'
import { exportRowsToCsv } from '../../utils'
import { saveAs } from 'file-saver'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'

type RowMenuProps = {}

const RowMenu: React.FC<RowMenuProps> = ({}) => {
  const state = useTrackedState()
  const dispatch = useDispatch()
  const { selectedRows, rows: allRows, editable } = state

  function onRowsDelete() {
    confirmAlert({
      title: 'Confirm to delete',
      message: 'Are you sure you want to delete the selected rows? This action cannot be undone.',
      onConfirm: async () => {
        const rowIdxs = Array.from(selectedRows) as number[]
        const rows = allRows.filter((x) => rowIdxs.includes(x.idx))
        const { error } = state.rowService!.delete(rows)
        if (error) {
          if (state.onError) state.onError(error)
        } else {
          dispatch({ type: 'REMOVE_ROWS', payload: { rowIdxs } })
          dispatch({
            type: 'SELECTED_ROWS_CHANGE',
            payload: { selectedRows: new Set() },
          })
        }
      },
    })
  }

  function onRowsExportCsv() {
    const rows = allRows.filter((x) => selectedRows.has(x.idx))
    const csv = exportRowsToCsv(state.table!.columns, rows)
    const csvData = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(csvData, `${state.table!.name}_rows.csv`)
  }

  function onAllRowsExportCsv() {
    const csv = exportRowsToCsv(state.table!.columns, allRows)
    const csvData = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(csvData, `${state.table!.name}_allRows.csv`)
  }

  return (
    <>
      <Dropdown
        align="end"
        side="bottom"
        overlay={
          <>
            {selectedRows.size == 0 && (
              <Dropdown.Item onClick={onAllRowsExportCsv} icon={<IconEdit size="tiny" />}>
                Export all rows to csv
              </Dropdown.Item>
            )}

            {selectedRows.size > 0 && (
              <Dropdown.Item onClick={onRowsExportCsv} icon={<IconEdit size="tiny" />}>
                Export to csv
              </Dropdown.Item>
            )}

            {editable && selectedRows.size > 0 && (
              <>
                <Divider light />
                <Dropdown.Item onClick={onRowsDelete} icon={<IconTrash size="tiny" stroke="red" />}>
                  Delete selected rows
                </Dropdown.Item>
              </>
            )}
          </>
        }
      >
        <Button
          as={'span'}
          type="text"
          className="opacity-50"
          icon={<IconChevronDown />}
          style={{ padding: '3px' }}
        />
      </Dropdown>
    </>
  )
}
export default RowMenu
