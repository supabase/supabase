import { forwardRef, memo, Ref, useRef } from 'react'
import DataGrid, { CalculatedColumn, DataGridHandle } from 'react-data-grid'

import { handleCopyCell } from 'components/grid/SupabaseGrid.utils'
import { formatForeignKeys } from 'components/interfaces/TableGridEditor/SidePanelEditor/ForeignKeySelector/ForeignKeySelector.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { useForeignKeyConstraintsQuery } from 'data/database/foreign-key-constraints-query'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { Button, cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import type { Filter, GridProps, SupaRow } from '../../types'
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
      ref: Ref<DataGridHandle> | undefined
    ) => {
      const tableEditorSnap = useTableEditorStateSnapshot()
      const snap = useTableEditorTableStateSnapshot()

      const onRowsChange = useOnRowsChange(rows)

      function onSelectedRowsChange(selectedRows: Set<number>) {
        snap.setSelectedRows(selectedRows)
      }

      const selectedCellRef = useRef<{ rowIdx: number; row: any; column: any } | null>(null)

      function onSelectedCellChange(args: { rowIdx: number; row: any; column: any }) {
        selectedCellRef.current = args
        snap.setSelectedCellPosition({ idx: args.column.idx, rowIdx: args.rowIdx })
      }

      const table = snap.table
      const tableEntityType = snap.originalTable?.entity_type

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
          (key) =>
            key.source_schema === table?.schema &&
            key.source_table === table?.name &&
            key.source_columns.includes(columnName) &&
            key.target_schema === targetTableSchema &&
            key.target_table === targetTableName &&
            key.target_columns.includes(targetColumnName ?? '')
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
          className={cn(`flex flex-col relative`, containerClass)}
          style={{ width: width || '100%', height: height || '50vh' }}
        >
          {/* Render no rows fallback outside of the DataGrid */}
          {(rows ?? []).length === 0 && (
            <div
              style={{ height: `calc(100% - 35px)` }}
              className="absolute top-9 p-2 w-full z-[1] pointer-events-none"
            >
              {isLoading && <GenericSkeletonLoader />}
              {isError && (
                <AlertError
                  className="pointer-events-auto"
                  error={error}
                  subject="Failed to retrieve rows from table"
                >
                  {filters.length > 0 && (
                    <p>
                      Verify that the filter values are correct, as the error may stem from an
                      incorrectly applied filter
                    </p>
                  )}
                </AlertError>
              )}
              {isSuccess && (
                <>
                  {(filters ?? []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center col-span-full h-full">
                      <p className="text-sm text-light">This table is empty</p>
                      {tableEntityType === ENTITY_TYPE.FOREIGN_TABLE ? (
                        <div className="flex items-center space-x-2 mt-4">
                          <p className="text-sm text-light">
                            This table is a foreign table. Add data to the connected source to get
                            started.
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 mt-4">
                          <Button
                            type="default"
                            className="pointer-events-auto"
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
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center col-span-full">
                      <p className="text-sm text-light">
                        The filters applied have returned no results from this table
                      </p>
                      <div className="flex items-center space-x-2 mt-4">
                        <Button
                          type="default"
                          className="pointer-events-auto"
                          onClick={() => removeAllFilters()}
                        >
                          Remove all filters
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <DataGrid
            ref={ref}
            className={`${gridClass} flex-grow`}
            rowClass={rowClass}
            columns={snap.gridColumns as CalculatedColumn<any, any>[]}
            rows={rows ?? []}
            renderers={{ renderRow: RowRenderer }}
            rowKeyGetter={rowKeyGetter}
            selectedRows={snap.selectedRows}
            onColumnResize={snap.updateColumnSize}
            onRowsChange={onRowsChange}
            onSelectedCellChange={onSelectedCellChange}
            onSelectedRowsChange={onSelectedRowsChange}
            onCellDoubleClick={(props) => onRowDoubleClick(props.row, props.column)}
            onCellKeyDown={handleCopyCell}
          />
        </div>
      )
    }
  )
)
