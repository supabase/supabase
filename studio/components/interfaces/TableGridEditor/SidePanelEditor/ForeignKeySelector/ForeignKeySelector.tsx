import React, { FC, useEffect, useState } from 'react'
import { get, find, isEmpty, sortBy } from 'lodash'
import { Dictionary } from 'components/grid'
import { SidePanel, Input, Listbox, IconHelpCircle, IconDatabase, Toggle } from 'ui'
import type { PostgresTable, PostgresColumn, PostgresSchema } from '@supabase/postgres-meta'

import { useStore } from 'hooks'
import ActionBar from '../ActionBar'
import { ForeignKey } from './ForeignKeySelector.types'
import { ColumnField } from '../SidePanelEditor.types'
import InformationBox from 'components/ui/InformationBox'
import { FOREIGN_KEY_DELETION_ACTION } from 'data/database/database-query-constants'

interface Props {
  column: ColumnField
  metadata?: any
  visible: boolean
  closePanel: () => void
  saveChanges: (
    value: { table: PostgresTable; column: PostgresColumn; deletionAction: string } | undefined
  ) => void
}

// [Joshen] In the future, we can easily extend to other deletion actions as well by replacing
// enableCascadeDelete with deletionAction

const ForeignKeySelector: FC<Props> = ({ column, visible = false, closePanel, saveChanges }) => {
  const { meta } = useStore()
  const [errors, setErrors] = useState<any>({})
  const [selectedForeignKey, setSelectedForeignKey] = useState<ForeignKey>({
    schema: 'public',
    table: '',
    column: '',
    enableCascadeDelete: false,
  })

  const schemas = meta.schemas.list()
  const tables = meta.tables.list(
    (table: PostgresTable) => table.schema === selectedForeignKey.schema
  )

  const foreignKey = column?.foreignKey
  const selectedTable: PostgresTable | undefined = find(tables, {
    name: selectedForeignKey?.table,
    schema: selectedForeignKey?.schema,
  })
  const selectedColumn: PostgresColumn | undefined = find(selectedTable?.columns ?? [], {
    name: selectedForeignKey?.column,
  })

  useEffect(() => {
    // Reset the state of the side panel
    if (visible) {
      setErrors({})

      if (foreignKey) {
        setSelectedForeignKey({
          schema: foreignKey.target_table_schema,
          table: foreignKey.target_table_name,
          column: foreignKey.target_column_name,
          enableCascadeDelete: foreignKey.deletion_action === FOREIGN_KEY_DELETION_ACTION.CASCADE,
        })
      } else {
        setSelectedForeignKey({
          schema: 'public',
          table: '',
          column: '',
          enableCascadeDelete: false,
        })
      }
    }
  }, [visible])

  const updateSelectedSchema = (schema: string) => {
    meta.tables.loadBySchema(schema)
    const updatedForeignKey = { schema, table: '', column: '', enableCascadeDelete: false }
    setSelectedForeignKey(updatedForeignKey)
  }

  const updateSelectedTable = (tableId: number) => {
    setErrors({})
    if (!tableId) {
      setSelectedForeignKey({
        schema: '',
        table: '',
        column: '',
        enableCascadeDelete: false,
      })
    }
    const table = find(tables, { id: tableId })
    if (table) {
      setSelectedForeignKey({
        schema: table.schema,
        table: table.name,
        column: table.columns?.length ? table.columns[0].name : undefined,
        enableCascadeDelete: false,
      })
    }
  }

  const updateSelectedColumn = (columnId: string) => {
    setErrors({})
    const column = find(selectedTable?.columns, { id: columnId })
    if (column) {
      const updatedForeignKey = { ...selectedForeignKey, column: column.name } as ForeignKey
      setSelectedForeignKey(updatedForeignKey)
    }
  }

  const updateEnableCascadeDelete = (value: boolean) => {
    setErrors({})
    setSelectedForeignKey({ ...selectedForeignKey, enableCascadeDelete: value })
  }

  const onSaveChanges = (resolve: () => void) => {
    const errors = {} as Dictionary<any>
    if (!selectedForeignKey?.table) {
      errors['table'] = 'Please select a table'
    }
    if (selectedForeignKey?.table && !selectedForeignKey.column) {
      errors['column'] = `The table ${selectedForeignKey.table} has no columns`
    }
    setErrors(errors)
    if (isEmpty(errors)) {
      if (!selectedTable || !selectedColumn) {
        // Remove foreign key since no table selected
        saveChanges(undefined)
      } else {
        saveChanges({
          table: selectedTable,
          column: selectedColumn,
          deletionAction: selectedForeignKey.enableCascadeDelete
            ? FOREIGN_KEY_DELETION_ACTION.CASCADE
            : FOREIGN_KEY_DELETION_ACTION.NO_ACTION,
        })
      }
    }
    resolve()
  }

  return (
    <SidePanel
      key="ForeignKeySelector"
      size="medium"
      visible={visible}
      onCancel={closePanel}
      // @ts-ignore
      header={
        <span>
          Edit foreign key relation{' '}
          {column?.name && (
            <>
              for <span className="text-code">{get(column, ['name'], '')}</span>
            </>
          )}
        </span>
      }
      customFooter={
        <ActionBar
          backButtonLabel="Cancel"
          applyButtonLabel="Save"
          closePanel={closePanel}
          applyFunction={onSaveChanges}
        />
      }
    >
      <SidePanel.Content>
        <div className="py-6 space-y-6">
          <InformationBox
            icon={<IconHelpCircle size="large" strokeWidth={1.5} />}
            title="What are foreign keys?"
            description={`Foreign keys help maintain referential integrity of your data by ensuring that no
                one can insert rows into the table that do not have a matching entry to another
                table.`}
            url="https://www.postgresql.org/docs/current/tutorial-fk.html"
            urlLabel="Postgres Foreign Key Documentation"
          />

          <Listbox
            id="schema"
            label="Select a schema"
            value={selectedForeignKey.schema}
            error={errors.schema}
            onChange={(value: string) => updateSelectedSchema(value)}
          >
            {schemas.map((schema: PostgresSchema) => {
              return (
                <Listbox.Option
                  key={schema.id}
                  value={schema.name}
                  label={schema.name}
                  addOnBefore={() => <IconDatabase size={16} strokeWidth={1.5} />}
                >
                  <div className="flex items-center gap-2">
                    {/* For aria searching to target the schema name instead of schema */}
                    <span className="hidden">{schema.name}</span>
                    <span className="text-scale-1200">{schema.name}</span>
                  </div>
                </Listbox.Option>
              )
            })}
          </Listbox>

          <Listbox
            id="table"
            label="Select a table to reference to"
            value={selectedTable?.id ?? 1}
            error={errors.table}
            onChange={(value: string) => updateSelectedTable(Number(value))}
          >
            <Listbox.Option key="empty" value={1} label="---">
              ---
            </Listbox.Option>
            {/* @ts-ignore */}
            {sortBy(tables, ['schema']).map((table: PostgresTable) => {
              return (
                <Listbox.Option key={table.id} value={table.id} label={table.name}>
                  <div className="flex items-center gap-2">
                    {/* For aria searching to target the table name instead of schema */}
                    <span className="hidden">{table.name}</span>
                    <span className="text-scale-900">{table.schema}</span>
                    <span className="text-scale-1200">{table.name}</span>
                  </div>
                </Listbox.Option>
              )
            })}
          </Listbox>

          {selectedForeignKey?.table && (
            <>
              {(selectedTable?.columns ?? []).length === 0 ? (
                <Input
                  disabled
                  label={
                    <div>
                      Select a column from <code>{selectedForeignKey?.table}</code> to reference to
                    </div>
                  }
                  error={errors.column}
                  placeholder="This table has no columns available"
                />
              ) : (
                <Listbox
                  id="column"
                  value={selectedColumn?.id}
                  // @ts-ignore
                  label={
                    <div>
                      Select a column from <code>{selectedForeignKey?.table}</code> to reference to
                    </div>
                  }
                  error={errors.column}
                  onChange={(value: string) => updateSelectedColumn(value)}
                >
                  {(selectedTable?.columns ?? []).map((column: PostgresColumn) => (
                    <Listbox.Option key={column.id} value={column.id} label={column.name}>
                      <div className="flex items-center gap-2">
                        <span className="text-scale-1200">{column.name}</span>
                        <span className="text-scale-900">{column.format}</span>
                      </div>
                    </Listbox.Option>
                  ))}
                </Listbox>
              )}
              <Toggle
                label="Enable cascade deletes"
                // @ts-ignore
                onChange={(value: boolean) => updateEnableCascadeDelete(value)}
                checked={selectedForeignKey.enableCascadeDelete}
                descriptionText={`Deleting a record from ${selectedForeignKey.schema}.${selectedForeignKey.table} will also delete the referencing records from this table`}
              />
            </>
          )}
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default ForeignKeySelector
