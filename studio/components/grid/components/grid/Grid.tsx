import { forwardRef } from 'react'
import { memo } from 'react-tracked'
import DataGrid, { DataGridHandle, RowsChangeData } from '@supabase/react-data-grid'
import { IconLoader } from 'ui'
import { GridProps, SupaRow } from '../../types'
import { useDispatch, useTrackedState } from '../../store'
import RowRenderer from './RowRenderer'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { ForeignRowSelectorProps } from 'components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/ForeignRowSelector/ForeignRowSelector'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useForeignKeyConstraintsQuery } from 'data/database/foreign-key-constraints-query'

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

      const { project } = useProjectContext()
      const { data } = useForeignKeyConstraintsQuery({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        schema: table?.schema ?? undefined,
      })

      function getColumnForeignKey(columnName: string) {
        const { targetTableSchema, targetTableName, targetColumnName } =
          table?.columns.find((x) => x.name == columnName)?.foreignKey ?? {}

        return data?.find(
          (key) =>
            key.target_schema == targetTableSchema &&
            key.target_table == targetTableName &&
            key.target_columns == targetColumnName
        )
      }

      function onRowDoubleClick(row: any, column: any) {
        const foreignKey = getColumnForeignKey(column.name)

        if (foreignKey) {
          onEditForeignKeyColumnValue({
            foreignKey,
            row,
            column,
          })
        }
      }

      return (
        <div
          className={containerClass}
          style={{ width: width || '100%', height: height || '50vh' }}
        >
          <DataGrid
            ref={ref}
            columns={state.gridColumns}
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
