import { FC, useEffect, useState } from 'react'
import { isUndefined, isEmpty } from 'lodash'
import { Dictionary } from '@supabase/grid'
import { Checkbox, SidePanel, Space, Input, Divider } from '@supabase/ui'
import { PostgresColumn, PostgresRelationship, PostgresTable } from '@supabase/postgres-meta'

import ActionBar from '../ActionBar'
import HeaderTitle from './HeaderTitle'
import ColumnType from './ColumnType'
import ColumnForeignKey from './ColumnForeignKey'
import ColumnDefaultValue from './ColumnDefaultValue'
import { ForeignKeySelector } from '..'
import {
  generateColumnField,
  generateColumnFieldFromPostgresColumn,
  getColumnForeignKey,
  validateFields,
  generateCreateColumnPayload,
  generateUpdateColumnPayload,
} from './ColumnEditor.utils'
import {
  EnumType,
  ColumnField,
  CreateColumnPayload,
  UpdateColumnPayload,
} from '../SidePanelEditor.types'

interface Props {
  column?: PostgresColumn
  selectedTable: PostgresTable
  tables: PostgresTable[]
  enumTypes: EnumType[]
  visible: boolean
  closePanel: () => void
  saveChanges: (
    payload: CreateColumnPayload | UpdateColumnPayload,
    foreignKey: Partial<PostgresRelationship> | undefined,
    isNewRecord: boolean,
    configuration: { columnId: string | undefined },
    resolve: any
  ) => void
  updateEditorDirty: () => void
}

const ColumnEditor: FC<Props> = ({
  column,
  selectedTable,
  tables = [],
  enumTypes = [],
  visible = false,
  closePanel = () => {},
  saveChanges = () => {},
  updateEditorDirty = () => {},
}) => {
  const isNewRecord = isUndefined(column)
  const hasPrimaryKey = (selectedTable?.primary_keys ?? []).length > 0
  const foreignKey = column ? getColumnForeignKey(column, selectedTable) : undefined

  const [errors, setErrors] = useState<Dictionary<any>>({})
  const [columnFields, setColumnFields] = useState<ColumnField>()
  const [isEditingRelation, setIsEditingRelation] = useState<boolean>(false)

  useEffect(() => {
    if (visible) {
      setErrors({})
      const columnFields = isNewRecord
        ? generateColumnField()
        : generateColumnFieldFromPostgresColumn(column!, selectedTable)
      setColumnFields(columnFields)
    }
  }, [visible])

  const onUpdateField = (changes: Partial<ColumnField>) => {
    const updatedColumnFields = { ...columnFields, ...changes } as ColumnField
    setColumnFields(updatedColumnFields)
    updateEditorDirty()

    const updatedErrors = { ...errors }
    for (const key of Object.keys(changes)) {
      delete updatedErrors[key]
    }
    setErrors(updatedErrors)
  }

  const saveColumnForeignKey = (foreignKeyConfiguration: any) => {
    onUpdateField({
      foreignKey: !isUndefined(foreignKeyConfiguration)
        ? {
            id: 0,
            constraint_name: '',
            source_schema: selectedTable.schema,
            source_table_name: selectedTable.name,
            source_column_name: columnFields?.name || column?.name || '',
            target_table_schema: foreignKeyConfiguration.table.schema,
            target_table_name: foreignKeyConfiguration.table.name,
            target_column_name: foreignKeyConfiguration.column.name,
          }
        : undefined,
      ...(!isUndefined(foreignKeyConfiguration) && {
        format: foreignKeyConfiguration.column.format,
        defaultValue: '',
      }),
    })
    setIsEditingRelation(false)
  }

  const onSaveChanges = (resolve: () => void) => {
    if (columnFields) {
      const errors = validateFields(columnFields)
      setErrors(errors)

      if (isEmpty(errors)) {
        const payload = isNewRecord
          ? generateCreateColumnPayload(selectedTable.id, columnFields)
          : generateUpdateColumnPayload(column!, columnFields)
        const foreignKey = columnFields.foreignKey
          ? { ...columnFields.foreignKey, source_column_name: columnFields.name }
          : undefined
        const configuration = { columnId: column?.id }
        saveChanges(payload, foreignKey, isNewRecord, configuration, resolve)
      } else {
        resolve()
      }
    }
  }

  if (!columnFields) return null

  return (
    <SidePanel
      wide
      key="ColumnEditor"
      visible={visible}
      // @ts-ignore
      title={<HeaderTitle table={selectedTable} column={column} />}
      onCancel={closePanel}
      onConfirm={(resolve: () => void) => onSaveChanges(resolve)}
      customFooter={
        <ActionBar
          backButtonLabel="Cancel"
          applyButtonLabel="Save"
          closePanel={closePanel}
          applyFunction={(resolve: () => void) => onSaveChanges(resolve)}
        />
      }
    >
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        <Input
          label="Name"
          layout="horizontal"
          type="text"
          error={errors.name}
          value={columnFields?.name ?? ''}
          onChange={(event: any) => onUpdateField({ name: event.target.value })}
        />
        <Input
          label="Description"
          placeholder="Optional"
          layout="horizontal"
          type="text"
          value={columnFields?.comment ?? ''}
          onChange={(event: any) => onUpdateField({ comment: event.target.value })}
        />
        {isNewRecord && !hasPrimaryKey && (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-8 md:col-start-5">
              <Checkbox
                label={hasPrimaryKey ? 'Add to composite primary key' : 'Is Primary Key'}
                description="A primary key indicates that a column or group of columns can be used as a unique identifier for rows in the table."
                checked={columnFields?.isPrimaryKey ?? false}
                onChange={() => onUpdateField({ isPrimaryKey: !columnFields?.isPrimaryKey })}
              />
            </div>
          </div>
        )}
        <ColumnForeignKey
          column={columnFields}
          originalForeignKey={foreignKey}
          onSelectEditRelation={() => setIsEditingRelation(true)}
          onSelectRemoveRelation={() => onUpdateField({ foreignKey: undefined })}
        />
        <Divider />
        <ColumnType
          value={columnFields?.format ?? ''}
          enumTypes={enumTypes}
          error={errors.format}
          disabled={!isUndefined(columnFields?.foreignKey)}
          onOptionSelect={(format: string) => onUpdateField({ format, defaultValue: '' })}
        />
        {isUndefined(columnFields.foreignKey) && (
          <div className="grid grid-cols-12 gap-4">
            {columnFields.format.includes('int') && (
              <div className="col-span-12 md:col-span-8 md:col-start-5">
                <Checkbox
                  label="Is Identity"
                  description="Automatically assign a sequential unique number to the column"
                  checked={columnFields.isIdentity}
                  onChange={() => {
                    const isIdentity = !columnFields.isIdentity
                    const isArray = isIdentity ? false : columnFields.isArray
                    onUpdateField({ isIdentity, isArray })
                  }}
                />
              </div>
            )}
            {!columnFields.isPrimaryKey && (
              <div className="col-span-12 md:col-span-8 md:col-start-5">
                <Checkbox
                  label="Define as Array"
                  description="Allow column to be defined as variable-length multidimensional arrays"
                  checked={columnFields.isArray}
                  onChange={() => {
                    const isArray = !columnFields.isArray
                    const isIdentity = isArray ? false : columnFields.isIdentity
                    onUpdateField({ isArray, isIdentity })
                  }}
                />
              </div>
            )}
          </div>
        )}
        <ColumnDefaultValue
          columnFields={columnFields}
          enumTypes={enumTypes}
          onUpdateField={onUpdateField}
        />
        {!columnFields.isPrimaryKey && (
          <>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 md:col-span-8 md:col-start-5">
                <Checkbox
                  label="Allow Nullable"
                  description="Allow the column to assume a NULL value if no value is provided"
                  checked={columnFields.isNullable}
                  onChange={() => onUpdateField({ isNullable: !columnFields.isNullable })}
                />
              </div>
              <div className="col-span-12 md:col-span-8 md:col-start-5">
                <Checkbox
                  label="Is Unique"
                  description="Enforce values in the column to be unique across rows"
                  checked={columnFields.isUnique}
                  onChange={() => onUpdateField({ isUnique: !columnFields.isUnique })}
                />
              </div>
            </div>
          </>
        )}
      </Space>
      <ForeignKeySelector
        tables={tables}
        column={columnFields}
        foreignKey={foreignKey}
        visible={isEditingRelation}
        closePanel={() => setIsEditingRelation(false)}
        saveChanges={saveColumnForeignKey}
      />
    </SidePanel>
  )
}

export default ColumnEditor
