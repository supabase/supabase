import { forwardRef, memo, useRef } from 'react'
import DataGrid, { CalculatedColumn, DataGridHandle } from 'react-data-grid'

import { formatClipboardValue } from 'components/grid/utils/common'
import { TableGridInnerLoadingState } from 'components/interfaces/TableGridEditor/LoadingState'
import { formatForeignKeys } from 'components/interfaces/TableGridEditor/SidePanelEditor/ForeignKeySelector/ForeignKeySelector.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { useForeignKeyConstraintsQuery } from 'data/database/foreign-key-constraints-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { copyToClipboard } from 'lib/helpers'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { Button, cn } from 'ui'
import type { Filter, GridProps, SupaRow } from '../../types'
import { useKeyboardShortcuts } from '../common/Hooks'
import { useOnRowsChange } from './Grid.utils'
import RowRenderer from './RowRenderer'

const rowKeyGetter = (row: SupaRow) => {
  return row?.idx ?? -1
}

interface IGrid extends GridProps {
  rows: any[]
  error: any
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  filters: Filter[]
  onApplyFilters: (appliedFilters: Filter[]) => void
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
        onApplyFilters,
      },
      ref: React.Ref<DataGridHandle> | undefined
    ) => {
      const tableEditorSnap = useTableEditorStateSnapshot()
      const snap = useTableEditorTableStateSnapshot()

      const onRowsChange = useOnRowsChange(rows)

      function onSelectedRowsChange(selectedRows: Set<number>) {
        snap.setSelectedRows(selectedRows)
      }

      const selectedCellRef = useRef<{ rowIdx: number; row: any; column: any } | null>(null)

      function copyCellValue() {
        const selectedCellValue =
          selectedCellRef.current?.row?.[selectedCellRef.current?.column?.key]
        const text = formatClipboardValue(selectedCellValue)
        if (!text) return
        copyToClipboard(text)
      }

      useKeyboardShortcuts(
        {
          'Command+c': (event: KeyboardEvent) => {
            event.stopPropagation()
            copyCellValue()
          },
          'Control+c': (event: KeyboardEvent) => {
            event.stopPropagation()
            copyCellValue()
          },
        },
        ['INPUT', 'TEXTAREA']
      )

      function onSelectedCellChange(args: { rowIdx: number; row: any; column: any }) {
        selectedCellRef.current = args
        snap.setSelectedCellPosition({ idx: args.column.idx, rowIdx: args.rowIdx })
      }

      const table = snap.table

      const { mutate: sendEvent } = useSendEventMutation()
      const org = useSelectedOrganization()
      const { project } = useProjectContext()
      const { data } = useForeignKeyConstraintsQuery({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        schema: table?.schema ?? undefined,
      })

      function getColumnForeignKey(columnName: string) {
        const { targetTableSchema, targetTableName, targetColumnName } =
          table?.columns.find((x) => x.name == columnName)?.foreignKey ?? {}

        const fk = data?.find(
          (key: any) =>
            key.source_schema === table?.schema &&
            key.source_table === table?.name &&
            key.source_columns.includes(columnName) &&
            key.target_schema === targetTableSchema &&
            key.target_table === targetTableName &&
            key.target_columns.includes(targetColumnName)
        )

        return fk !== undefined ? formatForeignKeys([fk])[0] : undefined
      }

      function onRowDoubleClick(row: any, column: any) {
        const foreignKey = getColumnForeignKey(column.name)

        if (foreignKey) {
          tableEditorSnap.onEditForeignKeyColumnValue({
            foreignKey,
            row,
            column,
          })
        }
      }

      const removeAllFilters = () => {
        onApplyFilters([])
      }

      return (
        <div
          className={cn(`flex flex-col`, containerClass)}
          style={{ width: width || '100%', height: height || '50vh' }}
        >
          <DataGrid
            ref={ref}
            className={`${gridClass} flex-grow`}
            rowClass={rowClass}
            columns={snap.gridColumns as CalculatedColumn<any, any>[]}
            rows={rows ?? []}
            renderers={{
              renderRow: RowRenderer,
              noRowsFallback: (
                // [Joshen] Temp fix with magic numbers till we find a better solution
                // RDG used to use flex, but with v7 they've moved to CSS grid and the
                // in built no rows fallback only takes the width of the CSS grid itself
                <div style={{ width: `calc(100vw - 255px - 55px)` }}>
                  {isLoading && <TableGridInnerLoadingState />}
                  {isError && (
                    <div className="p-2 col-span-full">
                      <AlertError error={error} subject="Failed to retrieve rows from table">
                        {filters.length > 0 && (
                          <p>
                            Verify that the filter values are correct, as the error may stem from an
                            incorrectly applied filter
                          </p>
                        )}
                      </AlertError>
                    </div>
                  )}
                  {isSuccess && (
                    <>
                      {(filters ?? []).length === 0 ? (
                        <div
                          style={{ height: `calc(100% - 35px)` }}
                          className="flex flex-col items-center justify-center col-span-full"
                        >
                          <p className="text-sm text-light">This table is empty</p>
                          <p className="text-sm text-light mt-1">
                            Add rows to your table to get started.
                          </p>
                          <div className="flex items-center space-x-2 mt-4">
                            {
                              <Button
                                type="default"
                                onClick={() => {
                                  tableEditorSnap.onImportData()
                                  sendEvent({
                                    action: 'import_data_button_clicked',
                                    properties: { tableType: 'Existing Table' },
                                    groups: {
                                      project: project?.ref ?? 'Unknown',
                                      organization: org?.slug ?? 'Unknown',
                                    },
                                  })
                                }}
                              >
                                Import data from CSV
                              </Button>
                            }
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{ height: `calc(100% - 35px)` }}
                          className="flex flex-col items-center justify-center col-span-full"
                        >
                          <p className="text-sm text-light">
                            The filters applied have returned no results from this table
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
                </div>
              ),
            }}
            rowKeyGetter={rowKeyGetter}
            selectedRows={snap.selectedRows}
            onColumnResize={snap.updateColumnSize}
            onRowsChange={onRowsChange}
            onSelectedCellChange={onSelectedCellChange}
            onSelectedRowsChange={onSelectedRowsChange}
            onCellDoubleClick={(props) => onRowDoubleClick(props.row, props.column)}
          />
        </div>
      )
    }
  )
)
