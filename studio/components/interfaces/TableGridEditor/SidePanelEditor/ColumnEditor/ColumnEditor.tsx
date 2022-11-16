import Link from 'next/link'
import { FC, useEffect, useState } from 'react'
import { isUndefined, isEmpty } from 'lodash'
import { Dictionary } from 'components/grid'
import { Checkbox, SidePanel, Input, Button, IconExternalLink, Toggle } from 'ui'
import {
  PostgresColumn,
  PostgresRelationship,
  PostgresTable,
  PostgresType,
} from '@supabase/postgres-meta'

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
import { TEXT_TYPES } from '../SidePanelEditor.constants'
import { ColumnField, CreateColumnPayload, UpdateColumnPayload } from '../SidePanelEditor.types'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms'
import { EncryptionKeySelector } from 'components/interfaces/Settings/Vault'

interface Props {
  column?: PostgresColumn
  selectedTable: PostgresTable
  tables: PostgresTable[]
  enumTypes: PostgresType[]
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
  const originalForeignKey = column ? getColumnForeignKey(column, selectedTable) : undefined

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

  if (!columnFields) return null

  const onUpdateField = (changes: Partial<ColumnField>) => {
    const isTextBasedColumn = TEXT_TYPES.includes(columnFields.format)
    if (!isTextBasedColumn && changes.defaultValue === '') {
      changes.defaultValue = null
    }

    const updatedColumnFields = { ...columnFields, ...changes } as ColumnField
    setColumnFields(updatedColumnFields)
    updateEditorDirty()

    const updatedErrors = { ...errors }
    for (const key of Object.keys(changes)) {
      delete updatedErrors[key]
    }
    setErrors(updatedErrors)
  }

  const saveColumnForeignKey = (
    foreignKeyConfiguration: { table: PostgresTable; column: PostgresColumn } | undefined
  ) => {
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
        defaultValue: null,
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
          : generateUpdateColumnPayload(column!, selectedTable, columnFields)
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

  return (
    <SidePanel
      size="xlarge"
      key="ColumnEditor"
      visible={visible}
      // @ts-ignore
      onConfirm={(resolve: () => void) => onSaveChanges(resolve)}
      // @ts-ignore
      header={<HeaderTitle table={selectedTable} column={column} />}
      onCancel={closePanel}
      customFooter={
        <ActionBar
          backButtonLabel="Cancel"
          applyButtonLabel="Save"
          closePanel={closePanel}
          applyFunction={(resolve: () => void) => onSaveChanges(resolve)}
        />
      }
      onInteractOutside={(event) => {
        const isToast = (event.target as Element)?.closest('#toast')
        if (isToast) {
          event.preventDefault()
        }
      }}
    >
      <FormSection header={<FormSectionLabel>General</FormSectionLabel>}>
        <FormSectionContent loading={false}>
          <Input
            label="Name"
            type="text"
            error={errors.name}
            value={columnFields?.name ?? ''}
            onChange={(event: any) => onUpdateField({ name: event.target.value })}
          />
          <Input
            label="Description"
            labelOptional="Optional"
            type="text"
            value={columnFields?.comment ?? ''}
            onChange={(event: any) => onUpdateField({ comment: event.target.value })}
          />
        </FormSectionContent>
      </FormSection>
      <SidePanel.Separator />
      <FormSection header={<FormSectionLabel>Foreign Key Relation</FormSectionLabel>}>
        <FormSectionContent loading={false}>
          <div>
            <ColumnForeignKey
              column={columnFields}
              originalForeignKey={originalForeignKey}
              onSelectEditRelation={() => setIsEditingRelation(true)}
              onSelectRemoveRelation={() => onUpdateField({ foreignKey: undefined })}
            />
          </div>
        </FormSectionContent>
      </FormSection>
      <SidePanel.Separator />
      <FormSection header={<FormSectionLabel>Data Type</FormSectionLabel>}>
        <FormSectionContent loading={false}>
          <ColumnType
            value={columnFields?.format ?? ''}
            layout="vertical"
            enumTypes={enumTypes}
            error={errors.format}
            disabled={!isUndefined(columnFields?.foreignKey)}
            description={
              <Link href="https://supabase.com/docs/guides/database/tables#data-types">
                <a target="_blank" rel="noreferrer">
                  <Button
                    as="span"
                    type="text"
                    size="small"
                    className="text-scale-1000 hover:text-scale-1200"
                    icon={<IconExternalLink size={14} strokeWidth={2} />}
                  >
                    Learn more about data types
                  </Button>
                </a>
              </Link>
            }
            onOptionSelect={(format: string) => onUpdateField({ format, defaultValue: null })}
          />
          {isUndefined(columnFields.foreignKey) && (
            <div className="space-y-4">
              {columnFields.format.includes('int') && (
                <div className="w-full">
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
                <div className="w-full">
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
        </FormSectionContent>
      </FormSection>
      <SidePanel.Separator />
      <FormSection header={<FormSectionLabel>Configuration</FormSectionLabel>}>
        <FormSectionContent loading={false}>
          <Toggle
            label="Is Primary Key"
            descriptionText="A primary key indicates that a column or group of columns can be used as a unique identifier for rows in the table"
            checked={columnFields?.isPrimaryKey ?? false}
            onChange={() => onUpdateField({ isPrimaryKey: !columnFields?.isPrimaryKey })}
          />
          <Toggle
            label="Allow Nullable"
            descriptionText="Allow the column to assume a NULL value if no value is provided"
            checked={columnFields.isNullable}
            onChange={() => onUpdateField({ isNullable: !columnFields.isNullable })}
          />
          <Toggle
            label="Is Unique"
            descriptionText="Enforce values in the column to be unique across rows"
            checked={columnFields.isUnique}
            onChange={() => onUpdateField({ isUnique: !columnFields.isUnique })}
          />
        </FormSectionContent>
      </FormSection>
      <SidePanel.Separator />
      <FormSection header={<FormSectionLabel>Security</FormSectionLabel>}>
        <FormSectionContent loading={false}>
          <Toggle
            label="Encrypt Column"
            descriptionText="Encrypt the column's data with pgsodium's Transparent Column Encryption (TCE)"
            checked={columnFields.isEncrypted}
            onChange={() => onUpdateField({ isEncrypted: !columnFields.isEncrypted })}
          />
          {columnFields.isEncrypted && <EncryptionKeySelector />}
        </FormSectionContent>
      </FormSection>

      <ForeignKeySelector
        tables={tables}
        column={columnFields}
        visible={isEditingRelation}
        closePanel={() => setIsEditingRelation(false)}
        saveChanges={saveColumnForeignKey}
      />
    </SidePanel>
  )
}

export default ColumnEditor
