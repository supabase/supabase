import { PermissionAction } from '@supabase/shared-types/out/constants'
import { forwardRef, memo, Ref, useRef } from 'react'
import DataGrid, { CalculatedColumn, DataGridHandle } from 'react-data-grid'
import { ref as valtioRef } from 'valtio'

import { useTableFilter } from 'components/grid/hooks/useTableFilter'
import { handleCopyCell } from 'components/grid/SupabaseGrid.utils'
import { ProtectedSchemaWarning } from 'components/interfaces/Database/ProtectedSchemaWarning'
import { formatForeignKeys } from 'components/interfaces/TableGridEditor/SidePanelEditor/ForeignKeySelector/ForeignKeySelector.utils'
import NoPermission from 'components/ui/NoPermission'
import { useForeignKeyConstraintsQuery } from 'data/database/foreign-key-constraints-query'
import { isTableLike, isForeignTable } from 'data/table-editor/table-editor-types'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useCsvFileDrop } from 'hooks/ui/useCsvFileDrop'
import { useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { Button, cn } from 'ui'
import { Admonition } from 'ui-patterns'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import type { GridProps, SupaRow } from '../../types'
import { useOnRowsChange } from './Grid.utils'
import { GridError } from './GridError'
import RowRenderer from './RowRenderer'

const rowKeyGetter = (row: SupaRow) => {
  return row?.idx ?? -1
}

interface IGrid extends GridProps {
  rows: any[]
  error: any
  isDisabled?: boolean
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
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
        isDisabled = false,
        isLoading,
        isSuccess,
        isError,
      },
      ref: Ref<DataGridHandle> | undefined
    ) => {
      const tableEditorSnap = useTableEditorStateSnapshot()
      const snap = useTableEditorTableStateSnapshot()
      const { filters, onApplyFilters } = useTableFilter()

      const { data: org } = useSelectedOrganizationQuery()
      const { data: project } = useSelectedProjectQuery()

      const onRowsChange = useOnRowsChange(rows)

      function onSelectedRowsChange(selectedRows: Set<number>) {
        snap.setSelectedRows(selectedRows)
      }

      const selectedCellRef = useRef<{ rowIdx: number; row: any; column: any } | null>(null)

      function onSelectedCellChange(args: { rowIdx: number; row: any; column: any }) {
        selectedCellRef.current = args
        snap.setSelectedCellPosition({ idx: args.column.idx, rowIdx: args.rowIdx })
      }

      const page = snap.page
      const table = snap.table
      const isSelectedTable = isTableLike(snap.originalTable)
      const isSelectedForeignTable = isForeignTable(snap.originalTable)
      const isTableEmpty = (rows ?? []).length === 0

      const { can: canEditTables } = useAsyncCheckPermissions(
        PermissionAction.TENANT_SQL_ADMIN_WRITE,
        'tables'
      )

      const { can: canEditColumns } = useAsyncCheckPermissions(
        PermissionAction.TENANT_SQL_ADMIN_WRITE,
        'columns'
      )

      const { isSchemaLocked } = useIsProtectedSchema({ schema: table.schema ?? '' })

      const hasPermissionToImportData = canEditTables && canEditColumns
      const canImportData = !isSchemaLocked && isSelectedTable && hasPermissionToImportData

      const { mutate: sendEvent } = useSendEventMutation()

      const {
        isValidFile: isValidFileDraggedOver,
        isDraggedOver,
        onDragOver,
        onFileDrop,
      } = useCsvFileDrop({
        enabled: isTableEmpty && canImportData,
        onFileDropped: (file) => tableEditorSnap.onImportData(valtioRef(file)),
        onTelemetryEvent: (eventName) => {
          sendEvent({
            action: eventName,
            groups: {
              project: project?.ref ?? 'Unknown',
              organization: org?.slug ?? 'Unknown',
            },
          })
        },
      })

      const emptyStateMessage = isDraggedOver
        ? isValidFileDraggedOver
          ? 'Drop your CSV file here'
          : 'Only CSV files are accepted'
        : 'This table is empty'

      const messageClassName = isDraggedOver && !isValidFileDraggedOver ? 'text-destructive' : ''

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

      const removeAllFilters = () => onApplyFilters([])

      return (
        <div
          className={cn('flex flex-col relative transition-colors', containerClass)}
          style={{ width: width || '100%', height: height || '50vh' }}
        >
          {/* Render no rows fallback outside of the DataGrid */}
          {(rows ?? []).length === 0 && (
            <div
              className={cn(
                'absolute top-9 p-2 w-full z-[1] pointer-events-none',
                isTableEmpty && isDraggedOver && 'border-2 border-dashed',
                isValidFileDraggedOver ? 'border-brand-600' : 'border-destructive-600'
              )}
              style={{ height: `calc(100% - 35px)` }}
              onDragOver={onDragOver}
              onDragLeave={onDragOver}
              onDrop={onFileDrop}
            >
              {isLoading && !isDisabled && <GenericSkeletonLoader />}

              {isError && <GridError error={error} />}

              {isSuccess && (
                <>
                  {page > 1 ? (
                    <div className="flex flex-col items-center justify-center col-span-full h-full">
                      <p className="text-sm text-light">This page does not have any data</p>
                      <div className="flex items-center space-x-2 mt-4">
                        <Button
                          type="default"
                          className="pointer-events-auto"
                          onClick={() => snap.setPage(1)}
                        >
                          Head back to first page
                        </Button>
                      </div>
                    </div>
                  ) : (filters ?? []).length === 0 ? (
                    <>
                      {!canImportData ? (
                        <div className="absolute inset-0 p-2 z-[1] flex justify-center items-center pointer-events-auto">
                          <div className="max-w-xl">
                            {isSelectedForeignTable ? (
                              <p className="text-sm text-light text-center">
                                This table is a foreign table. Add data to the connected source to
                                get started.
                              </p>
                            ) : !isSelectedTable ? (
                              <Admonition
                                type="default"
                                className="max-w-sm"
                                title="Can't import data into a non-table entity"
                              />
                            ) : isSchemaLocked ? (
                              <ProtectedSchemaWarning schema={table.schema ?? ''} entity="table" />
                            ) : (
                              <NoPermission isFullPage resourceText="import data" />
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center col-span-full h-full">
                          <p className="text-sm text-light pointer-events-auto">
                            <span className={messageClassName}>{emptyStateMessage}</span>
                          </p>
                          {!isDraggedOver && (
                            <div className="flex flex-col items-center gap-4 mt-4">
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
                              <p className="text-xs text-foreground-light pointer-events-auto">
                                or drag and drop a CSV file here
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center col-span-full h-full">
                      <p className="text-sm text-light pointer-events-auto">
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
