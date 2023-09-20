/* eslint-disable react/display-name */

import DataGrid, { DataGridHandle, RowsChangeData } from '@supabase/react-data-grid'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { forwardRef } from 'react'
import { memo } from 'react-tracked'

import { ForeignRowSelectorProps } from 'components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/ForeignRowSelector/ForeignRowSelector'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useForeignKeyConstraintsQuery } from 'data/database/foreign-key-constraints-query'
import { useUrlState } from 'hooks'
import { Button } from 'ui'
import { useDispatch, useTrackedState } from '../../store'
import { Filter, GridProps, SupaRow } from '../../types'
import RowRenderer from './RowRenderer'

const rowKeyGetter = (row: SupaRow) => {
  return row?.idx ?? -1
}

const updateColumnResize = (index: number, width: number, dispatch: (value: unknown) => void) => {
  dispatch({
    type: 'UPDATE_COLUMN_SIZE',
    payload: { index, width: Math.round(width) },
  })
}
const updateColumnResizeDebounced = AwesomeDebouncePromise(updateColumnResize, 500)

interface IGrid extends GridProps {
  rows: any[]
  error: any
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  filters: Filter[]
  setParams: ReturnType<typeof useUrlState>[1]
  updateRow: (previousRow: any, updatedData: any) => void
  onAddRow?: () => void
  onImportData?: () => void
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
        error,
        isLoading,
        isSuccess,
        isError,
        filters,
        setParams,
        updateRow,
        onAddRow,
        onImportData,
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

      const removeAllFilters = () => {
        setParams((prevParams) => {
          return { ...prevParams, filter: [] }
        })
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
            noRowsFallback={
              <>
                {isLoading && (
                  <div className="p-2">
                    <GenericSkeletonLoader />
                  </div>
                )}
                {isError && (
                  <div className="p-2">
                    <AlertError error={error} subject="Failed to retrieve rows from table" />
                  </div>
                )}
                {isSuccess && (
                  <>
                    {(filters ?? []).length === 0 ? (
                      <div
                        style={{ height: `calc(100% - 35px)` }}
                        className="flex flex-col items-center justify-center"
                      >
                        <p className="text-sm text">This table is empty</p>
                        {onAddRow !== undefined && onImportData !== undefined && (
                          <>
                            <p className="text-sm text-light mt-1">
                              Add rows to your table to get started.
                            </p>
                            <div className="flex items-center space-x-2 mt-4">
                              {/* [Joshen] Leaving this as a placeholder */}
                              {/* <Button type="outline">Generate random data</Button> */}
                              {onAddRow !== undefined && onImportData !== undefined && (
                                <Button type="default" onClick={onImportData}>
                                  Import data via CSV
                                </Button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{ height: `calc(100% - 35px)` }}
                        className="flex flex-col items-center justify-center"
                      >
                        <p className="text-sm text-light">
                          The filters applied has returned no results from this table
                        </p>
                        <div className="flex items-center space-x-2 mt-4">
                          <Button type="default" onClick={() => removeAllFilters()}>
                            Remove all filters
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            }
          />
        </div>
      )
    }
  )
)
