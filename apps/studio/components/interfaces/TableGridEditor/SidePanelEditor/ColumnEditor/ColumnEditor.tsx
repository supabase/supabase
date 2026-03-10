import type { PostgresColumn, PostgresTable } from '@supabase/postgres-meta'
import { useParams } from 'common'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import {
  Constraint,
  CONSTRAINT_TYPE,
  useTableConstraintsQuery,
} from 'data/database/constraints-query'
import {
  ForeignKeyConstraint,
  useForeignKeyConstraintsQuery,
} from 'data/database/foreign-key-constraints-query'
import { useEnumeratedTypesQuery } from 'data/enumerated-types/enumerated-types-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useProtectedSchemas } from 'hooks/useProtectedSchemas'
import { DOCS_URL } from 'lib/constants'
import { isEmpty, noop } from 'lodash'
import { ExternalLink, Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Dictionary } from 'types'
import { Button, Checkbox, Input, SidePanel, Toggle } from 'ui'

import { ActionBar } from '../ActionBar'
import type { ForeignKey } from '../ForeignKeySelector/ForeignKeySelector.types'
import { formatForeignKeys } from '../ForeignKeySelector/ForeignKeySelector.utils'
import { TEXT_TYPES } from '../SidePanelEditor.constants'
import type {
  ColumnField,
  CreateColumnPayload,
  UpdateColumnPayload,
} from '../SidePanelEditor.types'
import ColumnDefaultValue from './ColumnDefaultValue'
import {
  generateColumnField,
  generateColumnFieldFromPostgresColumn,
  generateCreateColumnPayload,
  generateUpdateColumnPayload,
  getPlaceholderText,
  validateFields,
} from './ColumnEditor.utils'
import ColumnForeignKey from './ColumnForeignKey'
import ColumnType from './ColumnType'
import HeaderTitle from './HeaderTitle'

export interface ColumnEditorProps {
  column?: Readonly<PostgresColumn>
  selectedTable: PostgresTable
  visible: boolean
  closePanel: () => void
  saveChanges: (
    payload: CreateColumnPayload | UpdateColumnPayload,
    isNewRecord: boolean,
    configuration: {
      columnId?: string
      primaryKey?: Constraint
      foreignKeyRelations: ForeignKey[]
      existingForeignKeyRelations: ForeignKeyConstraint[]
      createMore?: boolean
    },
    resolve: any
  ) => void
  updateEditorDirty: () => void
}

export const ColumnEditor = ({
  column,
  selectedTable,
  visible = false,
  closePanel = noop,
  saveChanges = noop,
  updateEditorDirty = noop,
}: ColumnEditorProps) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [errors, setErrors] = useState<Dictionary<any>>({})
  const [columnFields, setColumnFields] = useState<ColumnField>()
  const [fkRelations, setFkRelations] = useState<ForeignKey[]>([])
  const [createMore, setCreateMore] = useState(false)
  const [placeholder, setPlaceholder] = useState(
    getPlaceholderText(columnFields?.format, columnFields?.name)
  )

  const { data: types } = useEnumeratedTypesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: protectedSchemas } = useProtectedSchemas({ excludeSchemas: ['extensions'] })
  const enumTypes = (types ?? []).filter(
    (type) => !protectedSchemas.find((s) => s.name === type.schema)
  )

  const { data: constraints } = useTableConstraintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id: selectedTable?.id,
  })
  const primaryKey = (constraints ?? []).find(
    (constraint) => constraint.type === CONSTRAINT_TYPE.PRIMARY_KEY_CONSTRAINT
  )

  const { data } = useForeignKeyConstraintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: selectedTable?.schema,
  })

  const isNewRecord = column === undefined
  const foreignKeyMeta = data || []
  const foreignKeys = foreignKeyMeta.filter((relation) => {
    return relation.source_id === column?.table_id && relation.source_columns.includes(column.name)
  })
  const lockColumnType =
    fkRelations.find(
      (fk) =>
        fk.columns.find((col) => col.source === columnFields?.name) !== undefined && !fk.toRemove
    ) !== undefined

  useEffect(() => {
    if (visible) {
      setErrors({})
      const columnFields = isNewRecord
        ? generateColumnField({ schema: selectedTable.schema, table: selectedTable.name })
        : generateColumnFieldFromPostgresColumn(column, selectedTable, foreignKeyMeta)
      setColumnFields(columnFields)
      setFkRelations(formatForeignKeys(foreignKeys))
    }
  }, [visible])

  if (!columnFields) return null

  const onUpdateField = (changes: Partial<ColumnField>) => {
    const isTextBasedColumn = TEXT_TYPES.includes(columnFields.format)
    if (!isTextBasedColumn && changes.defaultValue === '') {
      changes.defaultValue = null
    }

    const changedName = 'name' in changes && changes.name !== columnFields.name
    const changedFormat = 'format' in changes && changes.format !== columnFields.format

    if (
      changedName &&
      fkRelations.find((fk) => fk.columns.find(({ source }) => source === columnFields?.name))
    ) {
      setFkRelations(
        fkRelations.map((relation) => ({
          ...relation,
          columns: relation.columns.map((col) =>
            col.source === columnFields?.name ? { ...col, source: changes.name! } : col
          ),
        }))
      )
    }

    if (changedName || changedFormat) {
      setPlaceholder(
        getPlaceholderText(changes.format || columnFields.format, changes.name || columnFields.name)
      )
    }

    const updatedColumnFields: ColumnField = { ...columnFields, ...changes }
    setColumnFields(updatedColumnFields)
    updateEditorDirty()

    const updatedErrors = { ...errors }
    for (const key of Object.keys(changes)) {
      delete updatedErrors[key]
    }
    setErrors(updatedErrors)
  }

  const onSaveChanges = (resolve: () => void) => {
    if (columnFields) {
      const errors = validateFields(columnFields)
      setErrors(errors)

      if (isEmpty(errors)) {
        const payload = isNewRecord
          ? generateCreateColumnPayload(selectedTable, columnFields)
          : generateUpdateColumnPayload(column!, selectedTable, columnFields)
        const configuration = {
          columnId: column?.id,
          primaryKey,
          foreignKeyRelations: fkRelations,
          existingForeignKeyRelations: foreignKeys,
          createMore,
        }
        saveChanges(payload, isNewRecord, configuration, (err?: any) => {
          resolve()
          if (!err && createMore && isNewRecord) {
            const freshColumnFields = generateColumnField({
              schema: selectedTable.schema,
              table: selectedTable.name,
            })
            setColumnFields(freshColumnFields)
            setFkRelations([])
            setErrors({})
          }
        })
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
          visible={visible}
        >
          {isNewRecord && (
            <div className="flex items-center gap-x-2">
              <Toggle
                size="tiny"
                checked={createMore}
                onChange={() => setCreateMore(!createMore)}
              />
              <label
                className="text-foreground-light text-sm cursor-pointer select-none"
                onClick={() => setCreateMore(!createMore)}
              >
                Create more
              </label>
            </div>
          )}
        </ActionBar>
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
          <FormSectionLabel
            className="lg:!col-span-4"
            description={
              <div className="space-y-2">
                <Button asChild type="default" size="tiny" icon={<Plus strokeWidth={2} />}>
                  <Link href={`/project/${ref}/database/types`} target="_blank" rel="noreferrer">
                    Create enum types
                  </Link>
                </Button>
                <Button
                  asChild
                  type="default"
                  size="tiny"
                  icon={<ExternalLink size={14} strokeWidth={2} />}
                >
                  <Link
                    href={`${DOCS_URL}/guides/database/tables#data-types`}
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
            description={
              lockColumnType ? 'Column type cannot be changed as it has a foreign key relation' : ''
            }
            disabled={lockColumnType}
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
        header={<FormSectionLabel className="lg:!col-span-4">Foreign Keys</FormSectionLabel>}
      >
        <FormSectionContent loading={false} className="lg:!col-span-8">
          <ColumnForeignKey
            column={columnFields}
            relations={fkRelations}
            closePanel={closePanel}
            onUpdateColumnType={(format: string) => {
              if (format[0] === '_') {
                onUpdateField({ format: format.slice(1), isArray: true, isIdentity: false })
              } else {
                onUpdateField({ format })
              }
            }}
            onUpdateFkRelations={setFkRelations}
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
            placeholder={placeholder}
            type="text"
            value={columnFields?.check ?? ''}
            onChange={(event: any) => onUpdateField({ check: event.target.value })}
            className="[&_input]:font-mono"
          />
        </FormSectionContent>
      </FormSection>
    </SidePanel>
  )
}
