import { FOREIGN_KEY_CASCADE_ACTION } from '@supabase/pg-meta'
import type { PostgresTable } from '@supabase/postgres-meta'
import { sortBy } from 'lodash'
import { ArrowRight, HelpCircle, Loader2, X } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SidePanel,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { ActionBar } from '../ActionBar'
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
    columns: { id: string; name: string; format: string; isNewColumn: boolean }[]
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

  const { data: selectedTable, isLoading: isLoadingSelectedTable } = useTableQuery<PostgresTable>(
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
          const targetType = selectedTable?.columns?.find((col) => col.name === value)?.format
          return { ...x, [key]: value, targetType }
        } else {
          const sourceType = table.columns.find((col) => col.name === value)?.format as string
          return { ...x, [key]: value, sourceType }
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
      const { source, target, sourceType: sType, targetType: tType } = column
      const sourceColumn = table.columns.find((col) => col.name === source)
      const sourceType = sType ?? sourceColumn?.format ?? ''
      const targetType =
        tType ?? selectedTable?.columns?.find((col) => col.name === target)?.format ?? ''

      // [Joshen] Doing this way so that its more readable
      // If either source or target not selected yet, thats okay
      if (source === '' || target === '') return

      // If source and target are in the same type of data types, thats okay
      if (
        (NUMERICAL_TYPES.includes(sourceType) && NUMERICAL_TYPES.includes(targetType)) ||
        (TEXT_TYPES.includes(sourceType) && TEXT_TYPES.includes(targetType)) ||
        (sourceType === 'uuid' && targetType === 'uuid')
      )
        return

      // Otherwise just check if the format is equal to each other
      if (sourceType === targetType) return

      if (sourceColumn?.isNewColumn && targetType !== '') {
        return typeNotice.push({ source, sourceType, target, targetType })
      }

      typeErrors.push({ source, sourceType, target, targetType })
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
              <Select_Shadcn_
                value={fk.schema}
                onValueChange={(value) => updateSelectedSchema(value)}
              >
                <SelectTrigger_Shadcn_ id="schema">
                  <SelectValue_Shadcn_ />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {sortedSchemas.map((schema) => (
                    <SelectItem_Shadcn_ key={schema.id} value={schema.name} className="min-w-96">
                      {schema.name}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </FormItemLayout>
            <FormItemLayout
              id="table"
              isReactForm={false}
              layout="vertical"
              label="Select a table to reference to"
              className="gap-[2px]"
              size="tiny"
            >
              <Select_Shadcn_
                value={selectedTable?.id !== undefined ? String(selectedTable.id) : undefined}
                onValueChange={(value) => updateSelectedTable(Number(value))}
                disabled={isLoadingSelectedTable}
              >
                <SelectTrigger_Shadcn_ id="table">
                  <SelectValue_Shadcn_ />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {sortBy(tables, ['schema']).map((table) => (
                    <SelectItem_Shadcn_
                      key={table.id}
                      value={table.id.toString()}
                      className="min-w-96"
                    >
                      <div className="flex items-center gap-2">
                        {/* For aria searching to target the table name instead of schema */}
                        <span className="hidden">{table.name}</span>
                        <span className="text-foreground-lighter">{table.schema}</span>
                        <span className="text-foreground">{table.name}</span>
                      </div>
                    </SelectItem_Shadcn_>
                  ))}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
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
                        <Alert_Shadcn_ className="col-span-10 py-2 px-3">
                          <AlertDescription_Shadcn_>
                            There are no foreign key relations between the tables
                          </AlertDescription_Shadcn_>
                        </Alert_Shadcn_>
                      )}
                      {fk.columns.map((_, idx) => (
                        <Fragment key={`${fk.schema}-${fk.table}-${idx}`}>
                          <div className="col-span-4">
                            <Select_Shadcn_
                              value={fk.columns[idx].source}
                              onValueChange={(value) => updateSelectedColumn(idx, 'source', value)}
                            >
                              <SelectTrigger_Shadcn_
                                aria-label={`Column from ${selectedSchema}.${table.name.length > 0 ? table.name : '[unnamed table]'}`}
                              >
                                <SelectValue_Shadcn_ />
                              </SelectTrigger_Shadcn_>
                              <SelectContent_Shadcn_>
                                {(table?.columns ?? [])
                                  .filter((x) => x.name.length !== 0)
                                  .map((column) => (
                                    <SelectItem_Shadcn_ key={column.id} value={column.name}>
                                      <div className="flex items-center gap-2">
                                        <span className="text-foreground">{column.name}</span>
                                        <span className="text-foreground-lighter">
                                          {column.format === '' ? '-' : column.format}
                                        </span>
                                      </div>
                                    </SelectItem_Shadcn_>
                                  ))}
                              </SelectContent_Shadcn_>
                            </Select_Shadcn_>
                          </div>
                          <div className="col-span-1 flex justify-center items-center">
                            <ArrowRight />
                          </div>
                          <div className="col-span-4">
                            <Select_Shadcn_
                              value={fk.columns[idx].target}
                              onValueChange={(value) => updateSelectedColumn(idx, 'target', value)}
                            >
                              <SelectTrigger_Shadcn_
                                aria-label={`Column from ${fk.schema}.${fk.table}`}
                              >
                                <SelectValue_Shadcn_ />
                              </SelectTrigger_Shadcn_>
                              <SelectContent_Shadcn_>
                                {(selectedTable?.columns ?? []).map((column) => (
                                  <SelectItem_Shadcn_ key={column.id} value={column.name}>
                                    <div className="flex items-center gap-2">
                                      <span className="text-foreground">{column.name}</span>
                                      <span className="text-foreground-lighter">
                                        {column.format === '' ? '-' : column.format}
                                      </span>
                                    </div>
                                  </SelectItem_Shadcn_>
                                ))}
                              </SelectContent_Shadcn_>
                            </Select_Shadcn_>
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
                        <Alert_Shadcn_ variant="warning">
                          <AlertTitle_Shadcn_>Column types do not match</AlertTitle_Shadcn_>
                          <AlertDescription_Shadcn_>
                            The following columns cannot be referenced as they are not of the same
                            type:
                          </AlertDescription_Shadcn_>
                          <ul className="list-disc pl-5 mt-2 text-foreground-light">
                            {(errors?.types ?? []).map((x, idx: number) => {
                              if (x === undefined) return null
                              return (
                                <li key={`type-error-${idx}`}>
                                  <code className="text-code-inline">{x.source}</code> (
                                  {x.sourceType}) and{' '}
                                  <code className="text-code-inline">{x.target}</code>(
                                  {x.targetType})
                                </li>
                              )
                            })}
                          </ul>
                        </Alert_Shadcn_>
                      )}
                      {hasTypeNotices && (
                        <Alert_Shadcn_>
                          <AlertTitle_Shadcn_>Column types will be updated</AlertTitle_Shadcn_>
                          <AlertDescription_Shadcn_>
                            The following columns will have their types updated to match their
                            referenced column
                          </AlertDescription_Shadcn_>
                          <ul className="list-disc pl-5 mt-2 text-foreground-light">
                            {(errors?.typeNotice ?? []).map((x, idx: number) => {
                              if (x === undefined) return null
                              return (
                                <li key={`type-error-${idx}`}>
                                  <div className="flex items-center gap-x-1">
                                    <code className="text-code-inline">{x.source}</code>{' '}
                                    <ArrowRight size={14} /> {x.targetType}
                                  </div>
                                </li>
                              )
                            })}
                          </ul>
                        </Alert_Shadcn_>
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
                      <Select_Shadcn_
                        value={fk.updateAction}
                        onValueChange={(value) => updateCascadeAction('updateAction', value)}
                      >
                        <SelectTrigger_Shadcn_ id="updateAction">
                          <SelectValue_Shadcn_ />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          {FOREIGN_KEY_CASCADE_OPTIONS.filter((option) =>
                            ['no-action', 'cascade', 'restrict'].includes(option.key)
                          ).map((option) => (
                            <SelectItem_Shadcn_ key={option.key} value={option.value}>
                              {option.label}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
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
                      <Select_Shadcn_
                        value={fk.deletionAction}
                        onValueChange={(value) => updateCascadeAction('deletionAction', value)}
                      >
                        <SelectTrigger_Shadcn_ id="deletionAction">
                          <SelectValue_Shadcn_ />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          {FOREIGN_KEY_CASCADE_OPTIONS.map((option) => (
                            <SelectItem_Shadcn_ key={option.key} value={option.value}>
                              {option.label}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
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
