import { FOREIGN_KEY_CASCADE_ACTION } from '@supabase/pg-meta'
import type { PGTable } from '@supabase/pg-meta'
import { sortBy } from 'lodash'
import { ArrowRight, HelpCircle, Loader2, X } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SidePanel,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { ActionBar } from '../ActionBar'
import { displayColumnType, normalizeFormatSchema } from '../ColumnEditor/ColumnEditor.utils'
import { NUMERICAL_TYPES, TEXT_TYPES } from '../SidePanelEditor.constants'
import type { ColumnField } from '../SidePanelEditor.types'
import { FOREIGN_KEY_CASCADE_OPTIONS } from './ForeignKeySelector.constants'
import type { ForeignKey, SelectorErrors, SelectorTypeError } from './ForeignKeySelector.types'
import {
  generateCascadeActionDescription,
  hasForeignKeySelectorChanges,
  normalizeForeignKeyForDirtyCheck,
  type ForeignKeyDirtyState,
} from './ForeignKeySelector.utils'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import InformationBox from '@/components/ui/InformationBox'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { useTableQuery } from '@/data/tables/table-retrieve-query'
import { useTablesQuery } from '@/data/tables/tables-query'
import { useQuerySchemaState } from '@/hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { uuidv4 } from '@/lib/helpers'

const EMPTY_STATE: ForeignKey = {
  id: undefined,
  schema: 'public',
  table: '',
  columns: [] as { source: string; target: string }[],
  deletionAction: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
  updateAction: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
}

interface ForeignKeySelectorProps {
  visible: boolean
  table: {
    id: number
    name: string
    columns: {
      id: string
      name: string
      format: string
      formatSchema?: string
      isArray?: boolean
      isNewColumn: boolean
    }[]
  }
  column?: ColumnField // For ColumnEditor, to prefill when adding a new foreign key
  foreignKey?: ForeignKey
  onClose: () => void
  onSaveRelation: (fk: ForeignKey) => void
}

export const ForeignKeySelector = ({
  visible,
  table,
  column,
  foreignKey,
  onClose,
  onSaveRelation,
}: ForeignKeySelectorProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { selectedSchema } = useQuerySchemaState()

  const [fk, setFk] = useState(EMPTY_STATE)
  const [errors, setErrors] = useState<SelectorErrors>({})
  const [initialSnapshot, setInitialSnapshot] = useState<ForeignKeyDirtyState>()
  const hasTypeErrors = (errors.types ?? []).length > 0
  const hasTypeNotices = (errors.typeNotice ?? []).length > 0

  const { data: schemas = [] } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const sortedSchemas = [...schemas].sort((a, b) => a.name.localeCompare(b.name))

  const { data: tables } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: fk.schema,
    includeColumns: false,
  })

  const { data: selectedTable, isLoading: isLoadingSelectedTable } = useTableQuery<PGTable>(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schema: fk.schema,
      name: fk.table,
    },
    {
      enabled: !!project?.ref && !!fk.schema && !!fk.table,
    }
  )

  const disableApply = isLoadingSelectedTable || selectedTable === undefined || hasTypeErrors

  const { confirmOnClose, modalProps } = useConfirmOnClose({
    checkIsDirty: () => hasForeignKeySelectorChanges(initialSnapshot, fk),
    onClose,
  })

  const updateSelectedSchema = (schema: string) => {
    const updatedFk = { ...EMPTY_STATE, id: fk.id, schema }
    setFk(updatedFk)
  }

  const updateSelectedTable = (tableId: number) => {
    setErrors({})
    const table = (tables ?? []).find((x) => x.id === tableId)
    if (table) {
      setFk({
        ...EMPTY_STATE,
        id: fk.id,
        name: fk.name,
        tableId: table.id,
        schema: table.schema,
        table: table.name,
        columns:
          column !== undefined
            ? [{ source: column.name, target: '' }]
            : [{ source: '', target: '' }],
      })
    }
  }

  const addColumn = () => {
    setFk({ ...fk, columns: fk.columns.concat([{ source: '', target: '' }]) })
  }

  const onRemoveColumn = (idx: number) => {
    setFk({ ...fk, columns: fk.columns.filter((_, i) => i !== idx) })
  }

  const updateSelectedColumn = (idx: number, key: 'target' | 'source', value: string) => {
    const updatedRelations = fk.columns.map((x, i) => {
      if (i === idx) {
        if (key === 'target') {
          const targetCol = selectedTable?.columns?.find((col) => col.name === value)
          return {
            ...x,
            [key]: value,
            targetType: targetCol?.format,
            targetTypeSchema: normalizeFormatSchema(targetCol?.format_schema),
            targetIsArray: targetCol?.data_type === 'ARRAY',
          }
        } else {
          const sourceCol = table.columns.find((col) => col.name === value)
          return {
            ...x,
            [key]: value,
            sourceType: sourceCol?.format,
            sourceTypeSchema: normalizeFormatSchema(sourceCol?.formatSchema),
            sourceIsArray: sourceCol?.isArray ?? false,
          }
        }
      } else {
        return x
      }
    })
    setFk({ ...fk, columns: updatedRelations })
  }

  const updateCascadeAction = (action: 'updateAction' | 'deletionAction', value: string) => {
    setErrors({})
    setFk({ ...fk, [action]: value })
  }

  const validateSelection = (resolve: () => void) => {
    const errors: SelectorErrors = {}
    const incompleteColumns = fk.columns.filter(
      (column) => column.source === '' || column.target === ''
    )
    if (incompleteColumns.length > 0) errors['columns'] = 'Please ensure that columns are selected'

    if (Object.keys(errors).length > 0) {
      setErrors(errors)
      resolve()
      return
    } else {
      if (fk.table !== '') onSaveRelation(fk)
      onClose()
      resolve()
    }
  }

  const validateType = () => {
    const typeNotice: SelectorTypeError[] = []
    const typeErrors: SelectorTypeError[] = []

    fk.columns.forEach((column) => {
      const {
        source,
        target,
        sourceType: sType,
        sourceTypeSchema: sSchema,
        sourceIsArray: sArr,
        targetType: tType,
        targetTypeSchema: tSchema,
        targetIsArray: tArr,
      } = column
      const sourceColumn = table.columns.find((col) => col.name === source)
      const targetColumn = selectedTable?.columns?.find((col) => col.name === target)
      const sourceType = sType ?? sourceColumn?.format ?? ''
      const targetType = tType ?? targetColumn?.format ?? ''
      const sourceTypeSchema = sSchema ?? normalizeFormatSchema(sourceColumn?.formatSchema)
      const targetTypeSchema = tSchema ?? normalizeFormatSchema(targetColumn?.format_schema)
      const sourceIsArray = sArr ?? sourceColumn?.isArray ?? false
      const targetIsArray = tArr ?? targetColumn?.data_type === 'ARRAY'

      // [Joshen] Doing this way so that its more readable
      // If either source or target not selected yet, thats okay
      if (source === '' || target === '') return

      // pg-meta emits `_X` as the format string for arrays of X. Normalize before
      // running family checks so that an array column is never accidentally classified
      // as a member of a scalar family.
      const bareSource =
        sourceIsArray && sourceType.startsWith('_') ? sourceType.slice(1) : sourceType
      const bareTarget =
        targetIsArray && targetType.startsWith('_') ? targetType.slice(1) : targetType

      // Same-family scalars are interchangeable; arrays must match exactly.
      if (
        !sourceIsArray &&
        !targetIsArray &&
        ((NUMERICAL_TYPES.includes(sourceType) && NUMERICAL_TYPES.includes(targetType)) ||
          (TEXT_TYPES.includes(sourceType) && TEXT_TYPES.includes(targetType)) ||
          (sourceType === 'uuid' && targetType === 'uuid'))
      )
        return

      // Otherwise require an exact match across the full (format, format_schema, isArray) triple.
      if (
        bareSource === bareTarget &&
        sourceTypeSchema === targetTypeSchema &&
        sourceIsArray === targetIsArray
      )
        return

      const entry: SelectorTypeError = {
        source,
        sourceType,
        sourceTypeSchema,
        sourceIsArray,
        target,
        targetType,
        targetTypeSchema,
        targetIsArray,
      }
      if (sourceColumn?.isNewColumn && targetType !== '') {
        return typeNotice.push(entry)
      }

      typeErrors.push(entry)
    })

    setErrors({ types: typeErrors, typeNotice })
  }

  useEffect(() => {
    if (visible) {
      const initialFk = foreignKey !== undefined ? foreignKey : { ...EMPTY_STATE, id: uuidv4() }

      setErrors({})
      setFk(initialFk)
      setInitialSnapshot(normalizeForeignKeyForDirtyCheck(initialFk))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  useEffect(() => {
    if (visible) validateType()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fk, visible])

  return (
    <>
      <SidePanel
        visible={visible}
        onCancel={confirmOnClose}
        className="max-w-[480px]"
        header={`${foreignKey === undefined ? 'Add' : 'Manage'} foreign key relationship${foreignKey === undefined ? ' to' : 's for'} ${table.name.length > 0 ? table.name : 'new table'}`}
        customFooter={
          <ActionBar
            backButtonLabel="Cancel"
            disableApply={disableApply}
            applyButtonLabel="Save"
            closePanel={confirmOnClose}
            applyFunction={(resolve) => validateSelection(resolve)}
          />
        }
      >
        <SidePanel.Content>
          <div className="py-6 space-y-6">
            <InformationBox
              icon={<HelpCircle size={20} strokeWidth={1.5} />}
              title="What are foreign keys?"
              description={`Foreign keys help maintain referential integrity of your data by ensuring that no
                one can insert rows into the table that do not have a matching entry to another
                table.`}
              url="https://www.postgresql.org/docs/current/tutorial-fk.html"
              urlLabel="Postgres Foreign Key Documentation"
            />
            <FormItemLayout
              id="schema"
              isReactForm={false}
              layout="vertical"
              label="Select a schema"
              className="gap-[2px]"
              size="tiny"
            >
              <Select value={fk.schema} onValueChange={(value) => updateSelectedSchema(value)}>
                <SelectTrigger id="schema">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortedSchemas.map((schema) => (
                    <SelectItem key={schema.id} value={schema.name} className="min-w-96">
                      {schema.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItemLayout>
            <FormItemLayout
              id="table"
              isReactForm={false}
              layout="vertical"
              label="Select a table to reference to"
              className="gap-[2px]"
              size="tiny"
            >
              <Select
                value={selectedTable?.id !== undefined ? String(selectedTable.id) : undefined}
                onValueChange={(value) => updateSelectedTable(Number(value))}
                disabled={isLoadingSelectedTable}
              >
                <SelectTrigger id="table">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortBy(tables, ['schema']).map((table) => (
                    <SelectItem key={table.id} value={table.id.toString()} className="min-w-96">
                      <div className="flex items-center gap-2">
                        {/* For aria searching to target the table name instead of schema */}
                        <span className="hidden">{table.name}</span>
                        <span className="text-foreground-lighter">{table.schema}</span>
                        <span className="text-foreground">{table.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItemLayout>

            {fk.schema && fk.table && (
              <>
                {isLoadingSelectedTable ? (
                  <div className="flex py-6 flex-col items-center justify-center space-y-2">
                    <Loader2 size={14} className="animate-spin" />
                    <p className="text-sm text-foreground-light">Loading table columns</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-y-3">
                    <label className="text-foreground-light text-sm">
                      Select columns from{' '}
                      <code className="text-code-inline">
                        {fk.schema}.{fk.table}
                      </code>{' '}
                      to reference to
                    </label>
                    <div className="grid grid-cols-10 gap-y-2">
                      <div className="col-span-5 text-xs">
                        {selectedSchema}.{table.name.length > 0 ? table.name : '[unnamed table]'}
                      </div>
                      <div className="col-span-4 text-xs text-right">
                        {fk.schema}.{fk.table}
                      </div>
                      {fk.columns.length === 0 && (
                        <Alert className="col-span-10 py-2 px-3">
                          <AlertDescription>
                            There are no foreign key relations between the tables
                          </AlertDescription>
                        </Alert>
                      )}
                      {fk.columns.map((_, idx) => (
                        <Fragment key={`${fk.schema}-${fk.table}-${idx}`}>
                          <div className="col-span-4">
                            <Select
                              value={fk.columns[idx].source}
                              onValueChange={(value) => updateSelectedColumn(idx, 'source', value)}
                            >
                              <SelectTrigger
                                aria-label={`Column from ${selectedSchema}.${table.name.length > 0 ? table.name : '[unnamed table]'}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(table?.columns ?? [])
                                  .filter((x) => x.name.length !== 0)
                                  .map((column) => (
                                    <SelectItem key={column.id} value={column.name}>
                                      <div className="flex items-center gap-2">
                                        <span className="text-foreground">{column.name}</span>
                                        <span className="text-foreground-lighter">
                                          {column.format === ''
                                            ? '-'
                                            : displayColumnType(
                                                column.format,
                                                column.formatSchema,
                                                column.isArray
                                              )}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-1 flex justify-center items-center">
                            <ArrowRight />
                          </div>
                          <div className="col-span-4">
                            <Select
                              value={fk.columns[idx].target}
                              onValueChange={(value) => updateSelectedColumn(idx, 'target', value)}
                            >
                              <SelectTrigger aria-label={`Column from ${fk.schema}.${fk.table}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(selectedTable?.columns ?? []).map((column) => (
                                  <SelectItem key={column.id} value={column.name}>
                                    <div className="flex items-center gap-2">
                                      <span className="text-foreground">{column.name}</span>
                                      <span className="text-foreground-lighter">
                                        {column.format === ''
                                          ? '-'
                                          : displayColumnType(
                                              column.format,
                                              column.format_schema,
                                              column.data_type === 'ARRAY'
                                            )}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-1 flex justify-end items-center">
                            <Button
                              type="default"
                              className="px-1"
                              icon={<X />}
                              disabled={fk.columns.length === 1}
                              onClick={() => onRemoveColumn(idx)}
                            />
                          </div>
                        </Fragment>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Button type="default" onClick={addColumn}>
                        Add another column
                      </Button>
                      {errors.columns && <p className="text-red-900 text-sm">{errors.columns}</p>}
                      {hasTypeErrors && (
                        <Alert variant="warning">
                          <AlertTitle>Column types do not match</AlertTitle>
                          <AlertDescription>
                            The following columns cannot be referenced as they are not of the same
                            type:
                          </AlertDescription>
                          <ul className="list-disc pl-5 mt-2 text-foreground-light">
                            {(errors?.types ?? []).map((x, idx: number) => {
                              if (x === undefined) return null
                              return (
                                <li key={`type-error-${idx}`}>
                                  <code className="text-code-inline">{x.source}</code> (
                                  {displayColumnType(
                                    x.sourceType,
                                    x.sourceTypeSchema,
                                    x.sourceIsArray
                                  )}
                                  ) and <code className="text-code-inline">{x.target}</code>(
                                  {displayColumnType(
                                    x.targetType,
                                    x.targetTypeSchema,
                                    x.targetIsArray
                                  )}
                                  )
                                </li>
                              )
                            })}
                          </ul>
                        </Alert>
                      )}
                      {hasTypeNotices && (
                        <Alert>
                          <AlertTitle>Column types will be updated</AlertTitle>
                          <AlertDescription>
                            The following columns will have their types updated to match their
                            referenced column
                          </AlertDescription>
                          <ul className="list-disc pl-5 mt-2 text-foreground-light">
                            {(errors?.typeNotice ?? []).map((x, idx: number) => {
                              if (x === undefined) return null
                              return (
                                <li key={`type-error-${idx}`}>
                                  <div className="flex items-center gap-x-1">
                                    <code className="text-code-inline">{x.source}</code>{' '}
                                    <ArrowRight size={14} />{' '}
                                    {displayColumnType(
                                      x.targetType,
                                      x.targetTypeSchema,
                                      x.targetIsArray
                                    )}
                                  </div>
                                </li>
                              )
                            })}
                          </ul>
                        </Alert>
                      )}
                    </div>
                  </div>
                )}

                {!isLoadingSelectedTable && (
                  <>
                    <SidePanel.Separator />

                    <InformationBox
                      icon={<HelpCircle size="20" strokeWidth={1.5} />}
                      title="Which action is most appropriate?"
                      description={
                        <>
                          <p>
                            The choice of the action depends on what kinds of objects the related
                            tables represent:
                          </p>
                          <ul className="mt-2 list-disc pl-4 space-y-1">
                            <li>
                              <code className="text-code-inline">Cascade</code>: if the referencing
                              table represents something that is a component of what is represented
                              by the referenced table and cannot exist independently
                            </li>
                            <li>
                              <code className="text-code-inline">Restrict</code> or{' '}
                              <code className="text-code-inline">No action</code>: if the two tables
                              represent independent objects
                            </li>
                            <li>
                              <code className="text-code-inline">Set NULL</code> or{' '}
                              <code className="text-code-inline">Set default</code>: if a
                              foreign-key relationship represents optional information
                            </li>
                          </ul>
                          <p className="mt-2">
                            Typically, restricting and cascading deletes are the most common
                            options, but the default behavior is no action
                          </p>
                        </>
                      }
                      url="https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK"
                      urlLabel="More information"
                    />

                    <FormItemLayout
                      id="updateAction"
                      isReactForm={false}
                      layout="vertical"
                      label="Action if referenced row is updated"
                      description={
                        <p>
                          {generateCascadeActionDescription(
                            'update',
                            fk.updateAction,
                            `${fk.schema}.${fk.table}`
                          )}
                        </p>
                      }
                      className="gap-[2px]"
                      size="tiny"
                    >
                      <Select
                        value={fk.updateAction}
                        onValueChange={(value) => updateCascadeAction('updateAction', value)}
                      >
                        <SelectTrigger id="updateAction">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FOREIGN_KEY_CASCADE_OPTIONS.filter((option) =>
                            ['no-action', 'cascade', 'restrict'].includes(option.key)
                          ).map((option) => (
                            <SelectItem key={option.key} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItemLayout>
                    <FormItemLayout
                      id="deletionAction"
                      isReactForm={false}
                      layout="vertical"
                      label="Action if referenced row is removed"
                      description={
                        <p>
                          {generateCascadeActionDescription(
                            'delete',
                            fk.deletionAction,
                            `${fk.schema}.${fk.table}`
                          )}
                        </p>
                      }
                      className="gap-[2px]"
                      size="tiny"
                    >
                      <Select
                        value={fk.deletionAction}
                        onValueChange={(value) => updateCascadeAction('deletionAction', value)}
                      >
                        <SelectTrigger id="deletionAction">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FOREIGN_KEY_CASCADE_OPTIONS.map((option) => (
                            <SelectItem key={option.key} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItemLayout>
                  </>
                )}
              </>
            )}
          </div>
        </SidePanel.Content>
      </SidePanel>
      <DiscardChangesConfirmationDialog {...modalProps} />
    </>
  )
}
