import type { PostgresColumn, PostgresSchema, PostgresTable } from '@supabase/postgres-meta'
import { Dictionary } from 'components/grid'
import { find, get, isEmpty, sortBy } from 'lodash'
import { FC, useEffect, useState } from 'react'
import { IconDatabase, IconHelpCircle, Input, Listbox, SidePanel } from 'ui'

import InformationBox from 'components/ui/InformationBox'
import { FOREIGN_KEY_DELETION_ACTION } from 'data/database/database-query-constants'
import { useStore } from 'hooks'
import ActionBar from '../ActionBar'
import { ColumnField } from '../SidePanelEditor.types'
import { FOREIGN_KEY_DELETION_OPTIONS } from './ForeignKeySelector.constants'
import { ForeignKey } from './ForeignKeySelector.types'
import { generateDeletionActionDescription } from './ForeignKeySelector.utils'

interface Props {
  column: ColumnField
  metadata?: any
  visible: boolean
  closePanel: () => void
  saveChanges: (
    value: { table: PostgresTable; column: PostgresColumn; deletionAction: string } | undefined
  ) => void
}

const ForeignKeySelector: FC<Props> = ({ column, visible = false, closePanel, saveChanges }) => {
  const { meta } = useStore()
  const [errors, setErrors] = useState<any>({})
  const [selectedForeignKey, setSelectedForeignKey] = useState<ForeignKey>({
    schema: 'public',
    table: '',
    column: '',
    deletionAction: FOREIGN_KEY_DELETION_ACTION.NO_ACTION,
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
    // make sure the public schemas are loaded initially
    meta.tables.loadBySchema('public')
  }, [])

  useEffect(() => {
    // Reset the state of the side panel
    if (visible) {
      setErrors({})

      if (foreignKey) {
        setSelectedForeignKey({
          schema: foreignKey.target_table_schema,
          table: foreignKey.target_table_name,
          column: foreignKey.target_column_name,
          deletionAction: foreignKey.deletion_action,
        })
      } else {
        setSelectedForeignKey({
          schema: 'public',
          table: '',
          column: '',
          deletionAction: FOREIGN_KEY_DELETION_ACTION.NO_ACTION,
        })
      }
    }
  }, [visible])

  const updateSelectedSchema = (schema: string) => {
    meta.tables.loadBySchema(schema)
    const updatedForeignKey = {
      schema,
      table: '',
      column: '',
      deletionAction: FOREIGN_KEY_DELETION_ACTION.NO_ACTION,
    }
    setSelectedForeignKey(updatedForeignKey)
  }

  const updateSelectedTable = (tableId: number) => {
    setErrors({})
    if (!tableId) {
      setSelectedForeignKey({
        schema: '',
        table: '',
        column: '',
        deletionAction: FOREIGN_KEY_DELETION_ACTION.NO_ACTION,
      })
    }
    const table = find(tables, { id: tableId })
    if (table) {
      const primaryColumn = table.primary_keys[0].name
      const firstColumn = table.columns?.length ? table.columns[0].name : undefined

      setSelectedForeignKey({
        schema: table.schema,
        table: table.name,
        column: primaryColumn ?? firstColumn,
        deletionAction: FOREIGN_KEY_DELETION_ACTION.NO_ACTION,
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

  const updateDeletionAction = (value: string) => {
    setErrors({})
    setSelectedForeignKey({ ...selectedForeignKey, deletionAction: value })
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
          deletionAction: selectedForeignKey.deletionAction,
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
                      Select a column from{' '}
                      <code className="text-xs">
                        {selectedForeignKey?.schema}.{selectedForeignKey?.table}
                      </code>{' '}
                      to reference to
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
                      Select a column from{' '}
                      <code className="text-xs">
                        {selectedForeignKey?.schema}.{selectedForeignKey?.table}
                      </code>{' '}
                      to reference to
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
              <SidePanel.Separator />
              <InformationBox
                icon={<IconHelpCircle size="large" strokeWidth={1.5} />}
                title="Which action is most appropriate?"
                description={
                  <>
                    <p>
                      The choice of the action depends on what kinds of objects the related tables
                      represent:
                    </p>
                    <ul className="mt-2 list-disc pl-4 space-y-1">
                      <li>
                        <code className="text-xs">Cascade</code>: if the referencing table
                        represents something that is a component of what is represented by the
                        referenced table and cannot exist independently
                      </li>
                      <li>
                        <code className="text-xs">Restrict</code> or{' '}
                        <code className="text-xs">No action</code>: if the two tables represent
                        independent objects
                      </li>
                      <li>
                        <code className="text-xs">Set NULL</code> or{' '}
                        <code className="text-xs">Set default</code>: if a foreign-key relationship
                        represents optional information
                      </li>
                    </ul>
                    <p className="mt-2">
                      Typically, restricting and cascading deletes are the most common options, but
                      the default behavior is no action
                    </p>
                  </>
                }
                url="https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK"
                urlLabel="More information"
              />
              <Listbox
                id="deletionAction"
                value={selectedForeignKey.deletionAction}
                label="Action if referenced row is removed"
                descriptionText={
                  <>
                    <p>
                      {generateDeletionActionDescription(
                        selectedForeignKey.deletionAction,
                        `${selectedForeignKey.schema}.${selectedForeignKey.table}`
                      )}
                    </p>
                    <p className="mt-2">
                      <a
                        href="https://supabase.com/docs/guides/database/postgres/cascade-deletes"
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand opacity-75"
                      >
                        Learn more about cascade deletes
                      </a>
                    </p>
                  </>
                }
                error={errors.column}
                onChange={(value: string) => updateDeletionAction(value)}
              >
                {FOREIGN_KEY_DELETION_OPTIONS.map((option) => (
                  <Listbox.Option key={option.key} value={option.value} label={option.label}>
                    <p className="text-scale-1200">{option.label}</p>
                  </Listbox.Option>
                ))}
              </Listbox>
            </>
          )}
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default ForeignKeySelector
