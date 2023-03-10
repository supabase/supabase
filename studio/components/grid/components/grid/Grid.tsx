import { forwardRef } from 'react'
import { memo } from 'react-tracked'
import DataGrid, { DataGridHandle, RowsChangeData } from '@supabase/react-data-grid'
import { IconLoader } from 'ui'
import { GridProps, SupaRow } from '../../types'
import { useDispatch, useTrackedState } from '../../store'
import RowRenderer from './RowRenderer'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { ForeignRowSelectorProps } from 'components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/ForeignRowSelector/ForeignRowSelector'

function rowKeyGetter(row: SupaRow) {
  return row?.idx ?? -1
}

interface IGrid extends GridProps {
  rows: any[]
  updateRow: (previousRow: any, updatedData: any) => void
  onEditForeignKeyColumnValue: (args: {
    foreignKey: NonNullable<ForeignRowSelectorProps['foreignKey']>
    row: any
    column: any
  }) => void
}

// [Joshen] Just for visibility this is causing some hook errors in the browser
export const Grid = memo(
  forwardRef<DataGridHandle, IGrid>(
    (
      {
        width,
        height,
        containerClass,
        gridClass,
        rowClass,
        rows,
        updateRow,
        onEditForeignKeyColumnValue,
      },
      ref: React.Ref<DataGridHandle> | undefined
    ) => {
      const dispatch = useDispatch()
      const state = useTrackedState()

      // workaround to force state tracking on state.gridColumns
      const columnHeaders = state.gridColumns.map((x) => `${x.key}_${x.frozen}`)
      const { gridColumns, onError: onErrorFunc } = state

      function onColumnResize(index: number, width: number) {
        updateColumnResizeDebounced(index, width, dispatch)
      }

      async function onRowsChange(_rows: SupaRow[], data: RowsChangeData<SupaRow, unknown>) {
        const rowData = _rows[data.indexes[0]]
        const originRowData = rows.find((x) => x.idx == rowData.idx)
        const changedColumn = Object.keys(rowData).find(
          (name) => rowData[name] !== originRowData![name]
        )

        if (changedColumn) {
          updateRow(originRowData, { [changedColumn]: rowData[changedColumn] })
        }
      }

      function onSelectedRowsChange(selectedRows: ReadonlySet<number>) {
        dispatch({
          type: 'SELECTED_ROWS_CHANGE',
          payload: { selectedRows },
        })
      }

      function onSelectedCellChange(position: { idx: number; rowIdx: number }) {
        dispatch({
          type: 'SELECTED_CELL_CHANGE',
          payload: { position },
        })
      }

      const table = state.table

      function getColumnForeignKey(columnName: string) {
        const foreignKey = table?.columns.find((x) => x.name == columnName)?.foreignKey ?? {}

        return Boolean(
          foreignKey.targetTableSchema && foreignKey.targetTableName && foreignKey.targetColumnName
        )
          ? foreignKey
          : undefined
      }

      function onRowDoubleClick(row: any, column: any) {
        const foreignKey = getColumnForeignKey(column.name)

        if (foreignKey) {
          onEditForeignKeyColumnValue({
            foreignKey: {
              target_column_name: foreignKey.targetColumnName!,
              target_table_name: foreignKey.targetTableName!,
              target_table_schema: foreignKey.targetTableSchema!,
            },
            row,
            column,
          })
        }
      }

      if (!columnHeaders || columnHeaders.length == 0) {
        return (
          <div
            className="sb-grid-grid--loading"
            style={{ width: width || '100%', height: height || '50vh' }}
          >
            <div className="sb-grid-grid--loading__inner flex items-center gap-2">
              <div className="animate-spin text-scale-900">
                <IconLoader />
              </div>
              <div className="text-sm text-scale-1100">Loading...</div>
            </div>
          </div>
        )
      }

      return (
        <div
          className={containerClass}
          style={{ width: width || '100%', height: height || '50vh' }}
        >
          <DataGrid
            ref={ref}
            columns={gridColumns}
            rows={rows ?? []}
            rowRenderer={RowRenderer}
            rowKeyGetter={rowKeyGetter}
            selectedRows={state.selectedRows}
            onColumnResize={onColumnResize}
            onRowsChange={onRowsChange}
            onSelectedCellChange={onSelectedCellChange}
            onSelectedRowsChange={onSelectedRowsChange}
            onRowDoubleClick={onRowDoubleClick}
            className={gridClass}
            rowClass={rowClass}
            style={{ height: '100%' }}
          />
        </div>
      )
    }
  )
)

const updateColumnResize = (index: number, width: number, dispatch: (value: unknown) => void) => {
  dispatch({
    type: 'UPDATE_COLUMN_SIZE',
    payload: { index, width: Math.round(width) },
  })
}
const updateColumnResizeDebounced = AwesomeDebouncePromise(updateColumnResize, 500)
