import React, { FC, useEffect, useState } from 'react'
import { get, find, isEmpty, sortBy } from 'lodash'
import { Dictionary } from '@supabase/grid'
import { SidePanel, Typography, Listbox, IconHelpCircle } from '@supabase/ui'
import { PostgresTable, PostgresColumn, PostgresRelationship } from '@supabase/postgres-meta'

import ActionBar from '../ActionBar'
import { ForeignKey } from './ForeignKeySelector.types'
import { ColumnField } from '../SidePanelEditor.types'
import InformationBox from 'components/ui/InformationBox'

interface Props {
  tables: PostgresTable[]
  column: ColumnField
  foreignKey?: PostgresRelationship
  metadata?: any
  visible: boolean
  closePanel: () => void
  saveChanges: (value: any) => void
}

const ForeignKeySelector: FC<Props> = ({
  tables = [] as PostgresTable[],
  column,
  foreignKey,
  visible = false,
  closePanel,
  saveChanges,
}) => {
  const [errors, setErrors] = useState<any>({})
  const [selectedForeignKey, setSelectedForeignKey] = useState<ForeignKey>()

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
        })
      } else {
        setSelectedForeignKey({
          schema: '',
          table: '',
          column: '',
        })
      }
    }
  }, [visible])

  const updateSelectedTable = (tableId: number) => {
    setErrors({})
    if (!tableId) {
      setSelectedForeignKey({
        schema: '',
        table: '',
        column: '',
      })
    }
    const table = find(tables, { id: tableId })
    if (table) {
      setSelectedForeignKey({
        schema: table.schema,
        table: table.name,
        column: table.columns.length > 0 ? table.columns[0].name : undefined,
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

  const onSaveChanges = (resolve: () => void) => {
    const errors = {} as Dictionary<any>
    if (selectedForeignKey?.table && !selectedForeignKey.column) {
      errors['column'] = `The table ${selectedForeignKey.table} has no columns`
    }
    setErrors(errors)
    if (isEmpty(errors)) {
      if (!selectedTable) {
        // Remove foreign key since no table selected
        saveChanges(undefined)
      } else {
        saveChanges({ table: selectedTable, column: selectedColumn })
      }
    }
    resolve()
  }

  return (
    <SidePanel
      key="ColumnConfiguration"
      visible={visible}
      onCancel={closePanel}
      // @ts-ignore
      title={
        <div>
          Edit foreign key relation for{' '}
          <Typography.Text code>{get(column, ['name'], '')}</Typography.Text>
        </div>
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
      <div className="space-y-6">
        <InformationBox
          block
          icon={<IconHelpCircle size="large" strokeWidth={1.5} />}
          title="What are foreign keys?"
          description={
            <p>
              Foreign keys help maintain referential integrity of your data by ensuring that no one
              can insert rows into the table that do not have a matching entry to another table
            </p>
          }
          url="https://www.postgresql.org/docs/current/tutorial-fk.html"
          urlLabel="Postgres Foreign Key Documentation"
        />

        <Listbox
          label="Select a table to reference to"
          value={selectedTable?.id}
          error={errors.table}
          onChange={(value: string) => updateSelectedTable(Number(value))}
        >
          <Listbox.Option key="empty" value="" label="---">
            ---
          </Listbox.Option>
          {sortBy(tables, ['schema']).map((table: PostgresTable) => {
            return (
              <Listbox.Option key={table.id} value={table.id} label={table.name}>
                <div className="flex items-center">
                  {/* For aria searching to target the table name instead of schema */}
                  <Typography.Text className="hidden">{table.name}</Typography.Text>
                  <Typography.Text small className="opacity-50 mr-2">
                    {table.schema}
                  </Typography.Text>
                  {table.name}
                </div>
              </Listbox.Option>
            )
          })}
        </Listbox>

        {selectedForeignKey?.table && (
          <Listbox
            value={selectedColumn?.id}
            // @ts-ignore
            label={
              <div>
                Select a column from{' '}
                <Typography.Text code>{selectedForeignKey?.table}</Typography.Text> to reference to
              </div>
            }
            error={errors.column}
            onChange={(value: string) => updateSelectedColumn(value)}
          >
            {(selectedTable?.columns ?? []).map((column: PostgresColumn) => (
              <Listbox.Option key={column.id} value={column.id} label={column.name}>
                <div className="flex items-center">
                  {column.name}
                  <Typography.Text small className="opacity-50 ml-2">
                    {column.format}
                  </Typography.Text>
                </div>
              </Listbox.Option>
            ))}
          </Listbox>
        )}
      </div>
    </SidePanel>
  )
}

export default ForeignKeySelector
