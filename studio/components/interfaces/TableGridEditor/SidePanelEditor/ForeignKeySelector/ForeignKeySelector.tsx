import type { PostgresColumn, PostgresSchema, PostgresTable } from '@supabase/postgres-meta'
import { find, get, isEmpty, sortBy } from 'lodash'
import { useEffect, useState } from 'react'

import { Dictionary } from 'components/grid'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import InformationBox from 'components/ui/InformationBox'
import { FOREIGN_KEY_CASCADE_ACTION } from 'data/database/database-query-constants'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useTablesQuery } from 'data/tables/tables-query'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  IconAlertCircle,
  IconAlertTriangle,
  IconDatabase,
  IconHelpCircle,
  Input,
  Listbox,
  SidePanel,
} from 'ui'
import ActionBar from '../ActionBar'
import { ColumnField } from '../SidePanelEditor.types'
import { FOREIGN_KEY_CASCADE_OPTIONS } from './ForeignKeySelector.constants'
import { ForeignKey } from './ForeignKeySelector.types'
import { generateCascadeActionDescription } from './ForeignKeySelector.utils'

interface ForeignKeySelectorProps {
  column: ColumnField
  metadata?: any
  visible: boolean
  closePanel: () => void
  saveChanges: (
    value:
      | {
          table: PostgresTable
          column: PostgresColumn
          deletionAction: string
          updateAction: string
        }
      | undefined
  ) => void
}

const ForeignKeySelector = ({
  column,
  visible = false,
  closePanel,
  saveChanges,
}: ForeignKeySelectorProps) => {
  const { project } = useProjectContext()
  const [errors, setErrors] = useState<any>({})
  const [selectedForeignKey, setSelectedForeignKey] = useState<ForeignKey>({
    schema: 'public',
    table: '',
    column: '',
    deletionAction: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
    updateAction: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
  })

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: tables } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: selectedForeignKey.schema,
  })

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
          deletionAction: foreignKey.deletion_action,
          updateAction: foreignKey.update_action,
        })
      } else {
        setSelectedForeignKey({
          schema: 'public',
          table: '',
          column: '',
          deletionAction: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
          updateAction: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
        })
      }
    }
  }, [visible])

  const updateSelectedSchema = (schema: string) => {
    const updatedForeignKey = {
      schema,
      table: '',
      column: '',
      deletionAction: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
      updateAction: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
    }
    setSelectedForeignKey(updatedForeignKey)
  }

  const updateSelectedTable = (tableId: number) => {
    setErrors({})
    if (!tableId) {
      return setSelectedForeignKey({
        schema: '',
        table: '',
        column: '',
        deletionAction: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
        updateAction: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
      })
    }

    const table = find(tables, { id: tableId })
    if (table) {
      const primaryColumn = table.primary_keys[0]?.name
      const firstColumn = table.columns?.length ? table.columns[0].name : undefined

      setSelectedForeignKey({
        schema: table.schema,
        table: table.name,
        column: primaryColumn ?? firstColumn,
        deletionAction: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
        updateAction: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
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

  const updateCascadeAction = (action: 'updateAction' | 'deletionAction', value: string) => {
    setErrors({})
    setSelectedForeignKey({ ...selectedForeignKey, [action]: value })
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
          updateAction: selectedForeignKey.updateAction,
        })
      }
    }
    resolve()
  }

  const matchingColumnTypes = selectedColumn?.format === column?.format

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
          disableApply={!!column?.format && !matchingColumnTypes}
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
            {schemas?.map((schema: PostgresSchema) => {
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
                    <span className="text-foreground">{schema.name}</span>
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
                    <span className="text-foreground-lighter">{table.schema}</span>
                    <span className="text-foreground">{table.name}</span>
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
                        <span className="text-foreground">{column.name}</span>
                        <span className="text-foreground-lighter">{column.format}</span>
                      </div>
                    </Listbox.Option>
                  ))}
                </Listbox>
              )}
              {!matchingColumnTypes && !column?.format && (
                <Alert_Shadcn_ variant="default">
                  <IconAlertCircle className="h-4 w-4" />
                  <AlertTitle_Shadcn_>
                    The referenced column's type will be updated to {selectedColumn?.data_type}
                  </AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_ className="leading-6">
                    <span>The referenced column</span>
                    {column?.name && <span className="text-code">{column.name}</span>}
                    <span>
                      {' '}
                      must match the type of the selected foreign column when creating a foreign key
                      relationship.
                    </span>
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              )}
              {!matchingColumnTypes && column?.format && (
                <Alert_Shadcn_ variant="warning">
                  <IconAlertTriangle strokeWidth={2} />
                  <AlertTitle_Shadcn_>Column types do not match</AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_ className="leading-6">
                    <span>The referenced column</span>
                    {column?.name && <span className="text-code">{column.name}</span>}
                    <span> is of type </span>
                    <span className="text-code">{column.format}</span>
                    <span> while the selected foreign column </span>
                    <span className="text-code">
                      {selectedTable?.name}.{selectedColumn?.name}
                    </span>
                    <span> has </span>
                    <span className="text-code">{selectedColumn?.data_type}</span>type. These two
                    columns can't be referenced until they are of the same type.
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
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
                id="updateAction"
                value={selectedForeignKey.updateAction}
                label="Action if referenced row is updated"
                descriptionText={
                  <p>
                    {generateCascadeActionDescription(
                      'update',
                      selectedForeignKey.updateAction,
                      `${selectedForeignKey.schema}.${selectedForeignKey.table}`
                    )}
                  </p>
                }
                error={errors.column}
                onChange={(value: string) => updateCascadeAction('updateAction', value)}
              >
                {FOREIGN_KEY_CASCADE_OPTIONS.filter((option) =>
                  ['no-action', 'cascade', 'restrict'].includes(option.key)
                ).map((option) => (
                  <Listbox.Option key={option.key} value={option.value} label={option.label}>
                    <p className="text-foreground">{option.label}</p>
                  </Listbox.Option>
                ))}
              </Listbox>

              <Listbox
                id="deletionAction"
                value={selectedForeignKey.deletionAction}
                label="Action if referenced row is removed"
                descriptionText={
                  <>
                    <p>
                      {generateCascadeActionDescription(
                        'delete',
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
                onChange={(value: string) => updateCascadeAction('deletionAction', value)}
              >
                {FOREIGN_KEY_CASCADE_OPTIONS.map((option) => (
                  <Listbox.Option key={option.key} value={option.value} label={option.label}>
                    <p className="text-foreground">{option.label}</p>
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
