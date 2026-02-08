import type { PostgresColumn } from '@supabase/postgres-meta'
import { useTableFilterNew } from 'components/grid/hooks/useTableFilterNew'
import { handleCopyCell } from 'components/grid/SupabaseGrid.utils'
import { useIsTableFilterBarEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { formatForeignKeys } from 'components/interfaces/TableGridEditor/SidePanelEditor/ForeignKeySelector/ForeignKeySelector.utils'
import { useForeignKeyConstraintsQuery } from 'data/database/foreign-key-constraints-query'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { isTableLike } from 'data/table-editor/table-editor-types'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useCsvFileDrop } from 'hooks/ui/useCsvFileDrop'
import { forwardRef, memo, Ref, useCallback, useMemo, useRef } from 'react'
import DataGrid, { CalculatedColumn, DataGridHandle } from 'react-data-grid'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { Button, cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { ref as valtioRef } from 'valtio'

import { useTableFilter } from '../../hooks/useTableFilter'
import type { GridProps, SupaRow } from '../../types'
import { isPendingAddRow, isPendingDeleteRow } from '../../types'
import { useOnRowsChange } from './Grid.utils'
import { GridError } from './GridError'
import RowRenderer from './RowRenderer'
import { ResponseError } from '@/types'

const rowKeyGetter = (row: SupaRow) => {
  return row?.idx ?? -1
}

interface IGrid extends GridProps {
  rows: SupaRow[]
  error: ResponseError | null
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
      const newFilterBarEnabled = useIsTableFilterBarEnabled()

      const tableEditorSnap = useTableEditorStateSnapshot()
      const snap = useTableEditorTableStateSnapshot()
      const { filters: oldFilters, clearFilters: clearOldFilters } = useTableFilter()
      const { filters: newFilters, clearFilters: clearNewFilters } = useTableFilterNew()

      const { data: org } = useSelectedOrganizationQuery()
      const { data: project } = useSelectedProjectQuery()

      const onRowsChange = useOnRowsChange(rows)

      function onSelectedRowsChange(selectedRows: Set<number>) {
        snap.setSelectedRows(selectedRows)
      }

      const selectedCellRef = useRef<{
        rowIdx: number
        row: SupaRow
        column: CalculatedColumn<SupaRow, unknown>
      } | null>(null)

      function onSelectedCellChange(args: {
        rowIdx: number
        row: SupaRow
        column: CalculatedColumn<SupaRow, unknown>
      }) {
        selectedCellRef.current = args
        snap.setSelectedCellPosition({ idx: args.column.idx, rowIdx: args.rowIdx })
      }

      const page = snap.page
      const table = snap.table
      const tableEntityType = snap.originalTable?.entity_type
      const isForeignTable = tableEntityType === ENTITY_TYPE.FOREIGN_TABLE
      const isTableEmpty = (rows ?? []).length === 0

      const { mutate: sendEvent } = useSendEventMutation()

      const {
        isValidFile: isValidFileDraggedOver,
        isDraggedOver,
        onDragOver,
        onFileDrop,
      } = useCsvFileDrop({
        enabled: isTableEmpty && !isForeignTable,
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

      function onRowDoubleClick(row: SupaRow, column: { name: string }) {
        const foreignKey = getColumnForeignKey(column.name)

        if (foreignKey) {
          tableEditorSnap.onEditForeignKeyColumnValue({
            foreignKey,
            row,
            column: column as unknown as PostgresColumn,
          })
        }
      }

      const removeAllFilters = useCallback(() => {
        if (newFilterBarEnabled) {
          clearNewFilters()
        } else {
          clearOldFilters()
        }
      }, [clearOldFilters, clearNewFilters, newFilterBarEnabled])

      const filters = useMemo(() => {
        if (newFilterBarEnabled) {
          return newFilters
        } else {
          return oldFilters
        }
      }, [newFilters, oldFilters, newFilterBarEnabled])

      // Compute columns with cellClass for dirty cells
      // This needs to be computed at render time so it reacts to operation queue changes
      const columnsWithDirtyCellClass = useMemo(() => {
        const primaryKeys = isTableLike(snap.originalTable) ? snap.originalTable.primary_keys : []
        const pendingOperations = tableEditorSnap.operationQueue.operations

        // If no pending operations, return columns as-is
        if (pendingOperations.length === 0) {
          return snap.gridColumns as CalculatedColumn<SupaRow, unknown>[]
        }

        return (snap.gridColumns as CalculatedColumn<SupaRow, unknown>[]).map((col) => {
          // Skip special columns like select column
          if (col.key === 'select-row' || col.key === 'add-column') {
            return col
          }

          return {
            ...col,
            cellClass: (row: SupaRow) => {
              // Build row identifiers from primary keys
              const rowIdentifiers: Record<string, unknown> = {}
              for (const pk of primaryKeys) {
                rowIdentifiers[pk.name] = row[pk.name]
              }

              // Check if this cell has pending changes
              const isDirty = tableEditorSnap.hasPendingCellChange(
                snap.table.id,
                rowIdentifiers,
                col.key
              )
              return isDirty ? 'rdg-cell--dirty' : undefined
            },
          }
        })
      }, [snap.gridColumns, snap.originalTable, snap.table.id, tableEditorSnap])

      // Compute rowClass function to style pending add/delete rows
      const computedRowClass = useMemo(() => {
        return (row: SupaRow) => {
          const classes: string[] = []

          // Call the original rowClass if provided
          if (rowClass) {
            const originalClass = rowClass(row)
            if (originalClass) {
              classes.push(originalClass)
            }
          }
          if (isPendingAddRow(row)) {
            classes.push('rdg-row--added')
          }
          if (isPendingDeleteRow(row)) {
            classes.push('rdg-row--deleted')
          }

          return classes.length > 0 ? classes.join(' ') : undefined
        }
      }, [rowClass])

      return (
        <div
          className={cn('flex flex-col relative transition-colors', containerClass)}
          style={{ width: width || '100%', height: height || '50vh' }}
        >
          {/* Render no rows fallback outside of the DataGrid */}
          {(rows ?? []).length === 0 && (
            <div
              className={cn(
                'absolute inset-0 flex flex-col items-center justify-center p-2 z-[1]',
                isTableEmpty && isDraggedOver && 'border-2 border-dashed',
                isValidFileDraggedOver ? 'border-brand-600' : 'border-destructive-600'
              )}
              onDragOver={onDragOver}
              onDragLeave={onDragOver}
              onDrop={onFileDrop}
            >
              {isLoading && !isDisabled && <GenericSkeletonLoader />}

              {isError && <GridError error={error} />}

              {isSuccess && (
                <>
                  {page > 1 ? (
                    <div className="flex flex-col items-center justify-center">
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
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-sm text-light pointer-events-auto">
                        {isDraggedOver ? (
                          isValidFileDraggedOver ? (
                            'Drop your CSV file here'
                          ) : (
                            <span className="text-destructive">Only CSV files are accepted</span>
                          )
                        ) : (
                          'This table is empty'
                        )}
                      </p>
                      {tableEntityType === ENTITY_TYPE.FOREIGN_TABLE ? (
                        <div className="flex items-center space-x-2 mt-4">
                          <p className="text-sm text-light pointer-events-auto">
                            This table is a foreign table. Add data to the connected source to get
                            started.
                          </p>
                        </div>
                      ) : (
                        !isDraggedOver && (
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
                        )
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
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
            rowClass={computedRowClass}
            columns={columnsWithDirtyCellClass}
            rows={rows ?? []}
            renderers={{ renderRow: RowRenderer }}
            rowKeyGetter={rowKeyGetter}
            selectedRows={snap.selectedRows}
            onColumnResize={snap.updateColumnSize}
            onRowsChange={onRowsChange}
            onSelectedCellChange={onSelectedCellChange}
            onSelectedRowsChange={onSelectedRowsChange}
            onCellDoubleClick={(props) => {
              if (typeof props.column.name === 'string') {
                onRowDoubleClick(props.row, { name: props.column.name })
              }
            }}
            onCellKeyDown={handleCopyCell}
          />
        </div>
      )
    }
  )
)
