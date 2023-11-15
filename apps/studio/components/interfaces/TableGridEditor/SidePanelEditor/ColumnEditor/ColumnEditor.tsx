import type { PostgresColumn, PostgresTable, PostgresType } from '@supabase/postgres-meta'
import { useParams } from 'common'
import { isEmpty, noop } from 'lodash'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Checkbox,
  IconAlertCircle,
  IconExternalLink,
  IconPlus,
  Input,
  SidePanel,
  Toggle,
} from 'ui'

import { Dictionary } from 'components/grid'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms'
import { useForeignKeyConstraintsQuery } from 'data/database/foreign-key-constraints-query'
import { useStore } from 'hooks'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { ForeignKeySelector } from '..'
import ActionBar from '../ActionBar'
import { TEXT_TYPES } from '../SidePanelEditor.constants'
import {
  ColumnField,
  CreateColumnPayload,
  ExtendedPostgresRelationship,
  UpdateColumnPayload,
} from '../SidePanelEditor.types'
import ColumnDefaultValue from './ColumnDefaultValue'
import {
  generateColumnField,
  generateColumnFieldFromPostgresColumn,
  generateCreateColumnPayload,
  generateUpdateColumnPayload,
  getColumnForeignKey,
  validateFields,
} from './ColumnEditor.utils'
import ColumnForeignKey from './ColumnForeignKey'
import ColumnType from './ColumnType'
import HeaderTitle from './HeaderTitle'

export interface ColumnEditorProps {
  column?: PostgresColumn
  selectedTable: PostgresTable
  visible: boolean
  closePanel: () => void
  saveChanges: (
    payload: CreateColumnPayload | UpdateColumnPayload,
    foreignKey: ExtendedPostgresRelationship | undefined,
    isNewRecord: boolean,
    configuration: {
      columnId: string | undefined
    },
    resolve: any
  ) => void
  updateEditorDirty: () => void
}

const ColumnEditor = ({
  column,
  selectedTable,
  visible = false,
  closePanel = noop,
  saveChanges = noop,
  updateEditorDirty = noop,
}: ColumnEditorProps) => {
  const { ref } = useParams()
  const { meta, vault } = useStore()
  const { project } = useProjectContext()

  const [errors, setErrors] = useState<Dictionary<any>>({})
  const [columnFields, setColumnFields] = useState<ColumnField>()
  const [isEditingRelation, setIsEditingRelation] = useState<boolean>(false)

  const { data } = useForeignKeyConstraintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: selectedTable?.schema,
  })
  const foreignKeyMeta = data || []

  const keys = vault.listKeys()
  const enumTypes = meta.types.list((type: PostgresType) => !EXCLUDED_SCHEMAS.includes(type.schema))

  const isNewRecord = column === undefined
  const originalForeignKey = column
    ? getColumnForeignKey(column, selectedTable, foreignKeyMeta)
    : undefined

  useEffect(() => {
    if (visible) {
      setErrors({})
      const columnFields = isNewRecord
        ? { ...generateColumnField(), keyId: keys.length > 0 ? keys[0].id : 'create-new' }
        : generateColumnFieldFromPostgresColumn(column!, selectedTable, foreignKeyMeta)
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

  const saveColumnForeignKey = (foreignKeyConfiguration?: {
    table: PostgresTable
    column: PostgresColumn
    deletionAction: string
    updateAction: string
  }) => {
    onUpdateField({
      foreignKey:
        foreignKeyConfiguration !== undefined
          ? {
              id: 0,
              constraint_name: '',
              source_schema: selectedTable.schema,
              source_table_name: selectedTable.name,
              source_column_name: columnFields?.name || column?.name || '',
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
    >
      <FormSection header={<FormSectionLabel className="lg:!col-span-4">General</FormSectionLabel>}>
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <Input
            label="Name"
            type="text"
            descriptionText="Recommended to use lowercase and use an underscore to separate words e.g. column_name"
            placeholder="column_name"
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
      <FormSection
        header={
          <FormSectionLabel className="lg:!col-span-4">Foreign Key Relation</FormSectionLabel>
        }
      >
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <div>
            <ColumnForeignKey
              column={columnFields}
              originalForeignKey={originalForeignKey}
              onSelectEditRelation={() => setIsEditingRelation(true)}
              onSelectRemoveRelation={() => onUpdateField({ foreignKey: undefined })}
              onSelectCancelRemoveRelation={() => onUpdateField({ foreignKey: originalForeignKey })}
            />
          </div>
        </FormSectionContent>
      </FormSection>
      <SidePanel.Separator />
      <FormSection
        header={
          <FormSectionLabel
            className="lg:!col-span-4"
            description={
              <div className="space-y-2">
                <Button
                  asChild
                  type="default"
                  size="tiny"
                  icon={<IconPlus size={14} strokeWidth={2} />}
                >
                  <Link href={`/project/${ref}/database/types`} target="_blank" rel="noreferrer">
                    Create enum types
                  </Link>
                </Button>
                <Button
                  asChild
                  type="default"
                  size="tiny"
                  icon={<IconExternalLink size={14} strokeWidth={2} />}
                >
                  <Link
                    href="https://supabase.com/docs/guides/database/tables#data-types"
                    target="_blank"
                    rel="noreferrer"
                  >
                    About data types
                  </Link>
                </Button>
              </div>
            }
          >
            Data Type
          </FormSectionLabel>
        }
      >
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <ColumnType
            showRecommendation
            value={columnFields?.format ?? ''}
            layout="vertical"
            enumTypes={enumTypes}
            error={errors.format}
            disabled={columnFields?.foreignKey !== undefined}
            onOptionSelect={(format: string) => onUpdateField({ format, defaultValue: null })}
          />
          {columnFields.foreignKey === undefined && (
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
      <FormSection
        header={<FormSectionLabel className="lg:!col-span-4">Constraints</FormSectionLabel>}
      >
        <FormSectionContent loading={false} className="lg:!col-span-8">
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
          <Input
            label="CHECK Constraint"
            labelOptional="Optional"
            placeholder={`e.g length(${columnFields?.name || 'column_name'}) < 500`}
            type="text"
            value={columnFields?.check ?? ''}
            onChange={(event: any) => onUpdateField({ check: event.target.value })}
            className="[&_input]:font-mono"
          />
        </FormSectionContent>
      </FormSection>

      {isNewRecord && (
        <>
          <SidePanel.Separator />
          <FormSection
            header={<FormSectionLabel className="lg:!col-span-4">Security</FormSectionLabel>}
          >
            <FormSectionContent loading={false} className="lg:!col-span-8">
              <Alert_Shadcn_>
                <IconAlertCircle />
                <AlertTitle_Shadcn_>
                  Column encryption has been removed from the GUI
                </AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  <p className="!leading-normal">
                    You may still encrypt new columns through the SQL editor using{' '}
                    <Link
                      href={`/project/${ref}/database/extensions?filter=pgsodium`}
                      className="text-brand hover:underline"
                    >
                      pgsodium's
                    </Link>{' '}
                    Transparent Column Encryption (TCE).
                  </p>
                  <Button asChild type="default" icon={<IconExternalLink />} className="mt-2">
                    <Link
                      target="_blank"
                      rel="noreferrer"
                      href="https://github.com/orgs/supabase/discussions/18849"
                    >
                      Learn more
                    </Link>
                  </Button>
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            </FormSectionContent>
          </FormSection>
        </>
      )}

      <ForeignKeySelector
        column={columnFields}
        visible={isEditingRelation}
        closePanel={() => setIsEditingRelation(false)}
        saveChanges={saveColumnForeignKey}
      />
    </SidePanel>
  )
}

export default ColumnEditor
