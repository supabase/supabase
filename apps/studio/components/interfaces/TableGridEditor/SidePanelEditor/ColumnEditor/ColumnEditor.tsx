import type { PostgresColumn, PostgresTable } from '@supabase/postgres-meta'
import { useParams } from 'common'
import { isEmpty, noop } from 'lodash'
import { ExternalLink, Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import {
  CONSTRAINT_TYPE,
  Constraint,
  useTableConstraintsQuery,
} from 'data/database/constraints-query'
import {
  ForeignKeyConstraint,
  useForeignKeyConstraintsQuery,
} from 'data/database/foreign-key-constraints-query'
import { useEnumeratedTypesQuery } from 'data/enumerated-types/enumerated-types-query'
import { EXCLUDED_SCHEMAS_WITHOUT_EXTENSIONS } from 'lib/constants/schemas'
import type { Dictionary } from 'types'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Checkbox,
  Input,
  SidePanel,
  Toggle,
  WarningIcon,
} from 'ui'
import ActionBar from '../ActionBar'
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
    isNewRecord: boolean,
    configuration: {
      columnId?: string
      primaryKey?: Constraint
      foreignKeyRelations: ForeignKey[]
      existingForeignKeyRelations: ForeignKeyConstraint[]
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
  const { project } = useProjectContext()

  const [errors, setErrors] = useState<Dictionary<any>>({})
  const [columnFields, setColumnFields] = useState<ColumnField>()
  const [fkRelations, setFkRelations] = useState<ForeignKey[]>([])

  const { data: types } = useEnumeratedTypesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const enumTypes = (types ?? []).filter(
    (type) => !EXCLUDED_SCHEMAS_WITHOUT_EXTENSIONS.includes(type.schema)
  )

  const { data: constraints } = useTableConstraintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: selectedTable?.schema,
    table: selectedTable?.name,
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

    const updatedColumnFields = { ...columnFields, ...changes } as ColumnField
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
          ? generateCreateColumnPayload(selectedTable.id, columnFields)
          : generateUpdateColumnPayload(column!, selectedTable, columnFields)
        const configuration = {
          columnId: column?.id,
          primaryKey,
          foreignKeyRelations: fkRelations,
          existingForeignKeyRelations: foreignKeys,
        }
        saveChanges(payload, isNewRecord, configuration, resolve)
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
          <FormSectionLabel
            className="lg:!col-span-4"
            description={
              <div className="space-y-2">
                <Button
                  asChild
                  type="default"
                  size="tiny"
                  icon={<Plus size={14} strokeWidth={2} />}
                >
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
            onUpdateColumnType={(format: string) => onUpdateField({ format, defaultValue: null })}
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
                <WarningIcon />
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
                  <Button asChild type="default" icon={<ExternalLink />} className="mt-2">
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
          <SidePanel.Separator />

          {/* TODO: need to pull column privileges in here if any columns are using column-level privileges, show this warning */}
          {/* [Joshen] This shouldn't show up for all tables */}
          {/* <FormSection
            header={
              <FormSectionLabel className="lg:!col-span-4">Column privileges</FormSectionLabel>
            }
          >
            <FormSectionContent loading={false} className="lg:!col-span-8">
              <Alert_Shadcn_ variant="warning">
                <WarningIcon />
                <AlertTitle_Shadcn_>This table uses column-privileges</AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  <p>
                    Several columns in this table have column-level privileges. This new column will
                    have privileges set to on by default.
                  </p>
                  <p className="mt-3">
                    <Link href={`/project/${ref}/database/privileges`} passHref>
                      <Button asChild type="default" size="tiny">
                        <a>Column-level privileges</a>
                      </Button>
                    </Link>
                  </p>
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            </FormSectionContent>
          </FormSection> */}
        </>
      )}
    </SidePanel>
  )
}

export default ColumnEditor
