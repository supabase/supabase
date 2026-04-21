import type { PostgresColumn, PostgresTable } from '@supabase/postgres-meta'
import { useParams } from 'common'
import { isEmpty, noop } from 'lodash'
import { ExternalLink, Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Button,
  Checkbox_Shadcn_,
  cn,
  DialogSectionSeparator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  SidePanel,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

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
import { HeaderTitle } from './HeaderTitle'
import {
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from '@/components/ui/Forms/FormSection'
import {
  Constraint,
  CONSTRAINT_TYPE,
  useTableConstraintsQuery,
} from '@/data/database/constraints-query'
import {
  ForeignKeyConstraint,
  useForeignKeyConstraintsQuery,
} from '@/data/database/foreign-key-constraints-query'
import { useEnumeratedTypesQuery } from '@/data/enumerated-types/enumerated-types-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useProtectedSchemas } from '@/hooks/useProtectedSchemas'
import { DOCS_URL } from '@/lib/constants'

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
    resolve: () => void
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

  const [errors, setErrors] = useState<{ [key: string]: string }>({})
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        saveChanges(payload, isNewRecord, configuration, (err?: string) => {
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
    <Sheet key="ColumnEditor" open={visible} onOpenChange={(open) => !open && closePanel()}>
      <SheetContent
        size="lg"
        aria-describedby={undefined}
        className="flex flex-col gap-0"
        onInteractOutside={(e) => {
          // Prevent sheet from closing when interacting with toasts
          const target = e.target as HTMLElement
          if (target?.closest('[data-sonner-toast]')) e.preventDefault()
        }}
      >
        <SheetHeader>
          <SheetTitle>
            <HeaderTitle table={selectedTable} column={column} />
          </SheetTitle>
        </SheetHeader>

        <SheetSection className="overflow-auto flex-grow p-0">
          <FormSection
            header={<FormSectionLabel className="lg:!col-span-4">General</FormSectionLabel>}
          >
            <FormSectionContent loading={false} className="lg:!col-span-8">
              <FormItemLayout
                isReactForm={false}
                id="name"
                className={cn(errors.name && '[&>*>label]:text-destructive')}
                label="Name"
                description={
                  <>
                    Recommended to use lowercase and use an underscore to separate words e.g.{' '}
                    <code className="text-code-inline">column_name</code>
                  </>
                }
              >
                <Input
                  id="name"
                  type="text"
                  placeholder="column_name"
                  value={columnFields?.name ?? ''}
                  onChange={(event) => onUpdateField({ name: event.target.value })}
                />
                {errors.name && <p className="mt-2 text-destructive">{errors.name}</p>}
              </FormItemLayout>
              <FormItemLayout
                isReactForm={false}
                id="description"
                label="Description"
                labelOptional="Optional"
              >
                <Input
                  id="description"
                  type="text"
                  value={columnFields?.comment ?? ''}
                  onChange={(event) => onUpdateField({ comment: event.target.value })}
                />
              </FormItemLayout>
            </FormSectionContent>
          </FormSection>

          <DialogSectionSeparator />

          <FormSection
            header={
              <FormSectionLabel
                className="lg:!col-span-4"
                description={
                  <div className="space-y-2">
                    <Button asChild type="default" icon={<Plus />}>
                      <Link
                        target="_blank"
                        rel="noreferrer"
                        href={`/project/${ref}/database/types`}
                      >
                        Create enum types
                      </Link>
                    </Button>
                    <Button asChild type="default" icon={<ExternalLink />}>
                      <Link
                        target="_blank"
                        rel="noreferrer"
                        href={`${DOCS_URL}/guides/database/tables#data-types`}
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
                  lockColumnType
                    ? 'Column type cannot be changed as it has a foreign key relation'
                    : ''
                }
                disabled={lockColumnType}
                onOptionSelect={(format: string) => onUpdateField({ format, defaultValue: null })}
              />
              {columnFields.foreignKey === undefined && (
                <div className="space-y-4">
                  {columnFields.format.includes('int') && (
                    <FormItemLayout
                      isReactForm={false}
                      layout="flex"
                      label="Is Identity"
                      id="isIdentity"
                      description="Automatically assign a sequential unique number to the column"
                    >
                      <Checkbox_Shadcn_
                        id="isIdentity"
                        checked={columnFields.isIdentity}
                        onCheckedChange={() => {
                          const isIdentity = !columnFields.isIdentity
                          const isArray = isIdentity ? false : columnFields.isArray
                          onUpdateField({ isIdentity, isArray })
                        }}
                      />
                    </FormItemLayout>
                  )}
                  {!columnFields.isPrimaryKey && (
                    <FormItemLayout
                      isReactForm={false}
                      layout="flex"
                      id="isArray"
                      label="Define as Array"
                      description="Allow column to be defined as variable-length multidimensional arrays"
                    >
                      <Checkbox_Shadcn_
                        id="isArray"
                        checked={columnFields.isArray}
                        onCheckedChange={() => {
                          const isArray = !columnFields.isArray
                          const isIdentity = isArray ? false : columnFields.isIdentity
                          onUpdateField({ isArray, isIdentity })
                        }}
                      />
                    </FormItemLayout>
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
                tableId={selectedTable.id}
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
              <FormItemLayout
                isReactForm={false}
                layout="flex"
                id="isPrimaryKey"
                label="Is Primary Key"
                description="A primary key indicates that a column or group of columns can be used as a unique identifier for rows in the table"
              >
                <Switch
                  id="isPrimaryKey"
                  checked={columnFields?.isPrimaryKey ?? false}
                  onCheckedChange={() =>
                    onUpdateField({
                      isPrimaryKey: !columnFields?.isPrimaryKey,
                      isUnique: false,
                      isNullable: false,
                    })
                  }
                />
              </FormItemLayout>

              <Tooltip>
                <TooltipTrigger>
                  <FormItemLayout
                    isReactForm={false}
                    layout="flex"
                    id="isNullable"
                    label="Allow Nullable"
                    description="Allow the column to assume a NULL value if no value is provided"
                  >
                    <Switch
                      id="isNullable"
                      disabled={columnFields.isPrimaryKey}
                      checked={columnFields.isNullable}
                      onCheckedChange={() =>
                        onUpdateField({ isNullable: !columnFields.isNullable })
                      }
                    />
                  </FormItemLayout>
                </TooltipTrigger>
                {columnFields.isPrimaryKey && (
                  <TooltipContent side="left" align="start">
                    Column is a primary key and hence cannot be NULL
                  </TooltipContent>
                )}
              </Tooltip>

              <Tooltip>
                <TooltipTrigger>
                  <FormItemLayout
                    isReactForm={false}
                    layout="flex"
                    id="isUnique"
                    label="Is Unique"
                    description="Enforce values in the column to be unique across rows"
                  >
                    <Switch
                      id="isUnique"
                      disabled={columnFields.isPrimaryKey}
                      checked={columnFields.isUnique}
                      onCheckedChange={() => onUpdateField({ isUnique: !columnFields.isUnique })}
                    />
                  </FormItemLayout>
                </TooltipTrigger>
                {columnFields.isPrimaryKey && (
                  <TooltipContent side="left" align="start">
                    Column is a primary key and hence already unique
                  </TooltipContent>
                )}
              </Tooltip>

              <FormItemLayout isReactForm={false} label="CHECK constraint" labelOptional="Optional">
                <Input
                  type="text"
                  placeholder={placeholder}
                  value={columnFields?.check ?? ''}
                  onChange={(event) => onUpdateField({ check: event.target.value })}
                  className="[&_input]:font-mono"
                />
              </FormItemLayout>
            </FormSectionContent>
          </FormSection>
        </SheetSection>

        <SheetFooter className="!justify-between [&>div]:p-0 [&>div]:border-t-0">
          <ActionBar
            backButtonLabel="Cancel"
            applyButtonLabel="Save"
            closePanel={closePanel}
            applyFunction={(resolve: () => void) => onSaveChanges(resolve)}
            visible={visible}
          >
            {isNewRecord && (
              <div className="flex items-center gap-x-2">
                <Switch checked={createMore} onCheckedChange={() => setCreateMore(!createMore)} />
                <label
                  className="text-foreground-light text-sm cursor-pointer select-none"
                  onClick={() => setCreateMore(!createMore)}
                >
                  Create more
                </label>
              </div>
            )}
          </ActionBar>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
