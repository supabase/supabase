import * as Tooltip from '@radix-ui/react-tooltip'
import type { PostgresColumn, PostgresTable, PostgresType } from '@supabase/postgres-meta'
import { isEmpty, noop, partition } from 'lodash'
import Link from 'next/link'
import { useState } from 'react'
import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  Droppable,
  DroppableProvided,
} from 'react-beautiful-dnd'
import { Alert, Button, IconEdit, IconExternalLink, IconHelpCircle, IconKey, IconTrash } from 'ui'

import InformationBox from 'components/ui/InformationBox'
import { generateColumnField } from '../ColumnEditor/ColumnEditor.utils'
import ForeignKeySelector from '../ForeignKeySelector/ForeignKeySelector'
import { TEXT_TYPES } from '../SidePanelEditor.constants'
import { ColumnField, ExtendedPostgresRelationship } from '../SidePanelEditor.types'
import Column from './Column'
import { ImportContent } from './TableEditor.types'

interface ColumnManagementProps {
  table?: Partial<PostgresTable>
  columns?: ColumnField[]
  enumTypes: PostgresType[]
  importContent?: ImportContent
  isNewRecord: boolean
  onColumnsUpdated: (columns: ColumnField[]) => void
  onSelectImportData: () => void
  onClearImportContent: () => void
}

const ColumnManagement = ({
  table,
  columns = [],
  enumTypes = [],
  importContent,
  isNewRecord,
  onColumnsUpdated = noop,
  onSelectImportData = noop,
  onClearImportContent = noop,
}: ColumnManagementProps) => {
  const [selectedColumnToEditRelation, setSelectedColumnToEditRelation] = useState<ColumnField>()

  const hasImportContent = !isEmpty(importContent)
  const [primaryKeyColumns, otherColumns] = partition(
    columns,
    (column: ColumnField) => column.isPrimaryKey
  )

  const saveColumnForeignKey = (foreignKeyConfiguration?: {
    table: PostgresTable
    column: PostgresColumn
    deletionAction: string
    updateAction: string
  }) => {
    if (selectedColumnToEditRelation !== undefined) {
      onUpdateColumn(selectedColumnToEditRelation, {
        foreignKey:
          foreignKeyConfiguration !== undefined
            ? {
                id: 0,
                constraint_name: '',
                source_schema: table?.schema ?? '',
                source_table_name: table?.name ?? '',
                source_column_name: selectedColumnToEditRelation?.name,
                target_table_schema: foreignKeyConfiguration.table.schema,
                target_table_name: foreignKeyConfiguration.table.name,
                target_column_name: foreignKeyConfiguration.column.name,
                deletion_action: foreignKeyConfiguration.deletionAction,
                update_action: foreignKeyConfiguration.updateAction,
              }
            : undefined,
        ...(foreignKeyConfiguration !== undefined && {
          format: foreignKeyConfiguration.column.format,
          defaultValue: null,
        }),
      })
    }
    setSelectedColumnToEditRelation(undefined)
  }

  const onUpdateColumn = (columnToUpdate: ColumnField, changes: Partial<ColumnField>) => {
    const updatedColumns = columns.map((column: ColumnField) => {
      if (column.id === columnToUpdate.id) {
        const isTextBasedColumn = TEXT_TYPES.includes(columnToUpdate.format)
        if (!isTextBasedColumn && changes.defaultValue === '') {
          changes.defaultValue = null
        }

        if ('name' in changes && column.foreignKey !== undefined) {
          const foreignKey: ExtendedPostgresRelationship = {
            ...column.foreignKey,
            source_column_name: changes?.name ?? '',
          }
          return { ...column, ...changes, foreignKey }
        }
        return { ...column, ...changes }
      } else {
        return column
      }
    })
    onColumnsUpdated(updatedColumns)
  }

  const onAddColumn = () => {
    const defaultColumn = generateColumnField()
    const updatedColumns = columns.concat(defaultColumn)
    onColumnsUpdated(updatedColumns)
  }

  const onRemoveColumn = (columnToRemove: ColumnField) => {
    const updatedColumns = columns.filter((column: ColumnField) => column.id !== columnToRemove.id)
    onColumnsUpdated(updatedColumns)
  }

  const onSortColumns = (result: any, type: 'pks' | 'others') => {
    // Dropped outside of the list
    if (!result.destination) {
      return
    }

    if (type === 'pks') {
      const updatedPrimaryKeyColumns = primaryKeyColumns.slice()
      const [removed] = updatedPrimaryKeyColumns.splice(result.source.index, 1)
      updatedPrimaryKeyColumns.splice(result.destination.index, 0, removed)
      const updatedColumns = updatedPrimaryKeyColumns.concat(otherColumns)
      return onColumnsUpdated(updatedColumns)
    }

    if (type === 'others') {
      const updatedOtherColumns = otherColumns.slice()
      const [removed] = updatedOtherColumns.splice(result.source.index, 1)
      updatedOtherColumns.splice(result.destination.index, 0, removed)
      const updatedColumns = primaryKeyColumns.concat(updatedOtherColumns)
      return onColumnsUpdated(updatedColumns)
    }
  }

  return (
    <>
      <div className="w-full space-y-4 table-editor-columns">
        <div className="flex items-center justify-between w-full">
          <h5>Columns</h5>
          {isNewRecord && (
            <>
              {hasImportContent ? (
                <div className="flex items-center space-x-3">
                  <Button type="default" icon={<IconEdit />} onClick={onSelectImportData}>
                    Edit content
                  </Button>
                  <Button type="danger" icon={<IconTrash />} onClick={onClearImportContent}>
                    Remove content
                  </Button>
                </div>
              ) : (
                <Button type="default" onClick={onSelectImportData}>
                  Import data via spreadsheet
                </Button>
              )}
            </>
          )}
        </div>

        {hasImportContent && (
          <p className="text-sm text-foreground-light my-2">
            Your table will be created with {importContent?.rowCount?.toLocaleString()} rows and the
            following {columns.length} columns.
          </p>
        )}

        {primaryKeyColumns.length === 0 && (
          <Alert title="Warning: No primary keys selected" variant="warning" withIcon>
            Tables require at least one column as a primary key in order to uniquely identify each
            row. Without a primary key, you will not be able to update or delete rows from the
            table.
          </Alert>
        )}

        {primaryKeyColumns.length > 1 && (
          <InformationBox
            block
            icon={<IconKey className="text-white" size="large" />}
            title="Composite primary key selected"
            description="The columns that you've selected will be grouped as a primary key, and will serve
          as the unique identifier for the rows in your table"
          />
        )}

        <div className="space-y-2">
          {/* Headers */}
          <div className="flex w-full px-3">
            {/* Drag handle */}
            {isNewRecord && <div className="w-[5%]" />}
            <div className="w-[25%] flex items-center space-x-2">
              <h5 className="text-xs text-foreground-lighter">Name</h5>
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger>
                  <h5 className="text-xs text-foreground-lighter">
                    <IconHelpCircle size={15} strokeWidth={1.5} />
                  </h5>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-alternative py-1 px-2 leading-none shadow', // background
                        'border border-background', //border
                      ].join(' ')}
                    >
                      <span className="text-xs text-foreground">
                        Recommended to use lowercase and use an underscore to separate words e.g.
                        column_name
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
            <div className="w-[25%]">
              <h5 className="text-xs text-foreground-lighter">Type</h5>
            </div>
            <div className={`${isNewRecord ? 'w-[25%]' : 'w-[30%]'} flex items-center space-x-2`}>
              <h5 className="text-xs text-foreground-lighter">Default Value</h5>

              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger>
                  <h5 className="text-xs text-foreground-lighter">
                    <IconHelpCircle size={15} strokeWidth={1.5} />
                  </h5>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-alternative py-1 px-2 leading-none shadow', // background
                        'border border-background', //border
                      ].join(' ')}
                    >
                      <span className="text-xs text-foreground">
                        Can either be a literal or an expression. When using an expression wrap your
                        expression in brackets, e.g. (gen_random_uuid())
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
            <div className="w-[10%]">
              <h5 className="text-xs text-foreground-lighter">Primary</h5>
            </div>
            {/* Empty space */}
            <div className={`${hasImportContent ? 'w-[10%]' : 'w-0'}`} />
            {/* More config button */}
            <div className="w-[5%]" />
            {/* Delete button */}
            {!hasImportContent && <div className="w-[5%]" />}
          </div>

          {primaryKeyColumns.length > 0 && (
            <DragDropContext onDragEnd={(result: any) => onSortColumns(result, 'pks')}>
              <Droppable droppableId="pk_columns_droppable">
                {(droppableProvided: DroppableProvided) => (
                  <div
                    ref={droppableProvided.innerRef}
                    className={`space-y-2 rounded-md bg-surface-200 px-3 py-2 ${
                      isNewRecord ? '' : '-mx-3'
                    }`}
                  >
                    {primaryKeyColumns.map((column: ColumnField, index: number) => (
                      <Draggable key={column.id} draggableId={column.id} index={index}>
                        {(draggableProvided: DraggableProvided) => (
                          <div
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                          >
                            <Column
                              column={column}
                              enumTypes={enumTypes}
                              isNewRecord={isNewRecord}
                              hasImportContent={hasImportContent}
                              dragHandleProps={draggableProvided.dragHandleProps}
                              onEditRelation={() => {
                                setSelectedColumnToEditRelation(column)
                              }}
                              onUpdateColumn={(changes) => onUpdateColumn(column, changes)}
                              onRemoveColumn={() => onRemoveColumn(column)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {droppableProvided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}

          <DragDropContext onDragEnd={(result: any) => onSortColumns(result, 'others')}>
            <Droppable droppableId="other_columns_droppable">
              {(droppableProvided: DroppableProvided) => (
                <div
                  ref={droppableProvided.innerRef}
                  className={`space-y-2 py-2 ${isNewRecord ? 'px-3 ' : ''}`}
                >
                  {otherColumns.map((column: ColumnField, index: number) => (
                    <Draggable key={column.id} draggableId={column.id} index={index}>
                      {(draggableProvided: DraggableProvided) => (
                        <div ref={draggableProvided.innerRef} {...draggableProvided.draggableProps}>
                          <Column
                            column={column}
                            enumTypes={enumTypes}
                            isNewRecord={isNewRecord}
                            hasImportContent={hasImportContent}
                            dragHandleProps={draggableProvided.dragHandleProps}
                            onEditRelation={() => {
                              setSelectedColumnToEditRelation(column)
                            }}
                            onUpdateColumn={(changes) => onUpdateColumn(column, changes)}
                            onRemoveColumn={() => onRemoveColumn(column)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {droppableProvided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <div className="flex items-center justify-between">
          {!hasImportContent && (
            <Button type="default" onClick={() => onAddColumn()}>
              Add column
            </Button>
          )}
          <Button
            asChild
            type="text"
            className="text-foreground-light hover:text-foreground"
            icon={<IconExternalLink size={12} strokeWidth={2} />}
          >
            <Link
              href="https://supabase.com/docs/guides/database/tables#data-types"
              target="_blank"
              rel="noreferrer"
            >
              Learn more about data types
            </Link>
          </Button>
        </div>
      </div>
      <ForeignKeySelector
        column={selectedColumnToEditRelation as ColumnField}
        visible={selectedColumnToEditRelation !== undefined}
        closePanel={() => setSelectedColumnToEditRelation(undefined)}
        saveChanges={saveColumnForeignKey}
      />
    </>
  )
}

export default ColumnManagement
