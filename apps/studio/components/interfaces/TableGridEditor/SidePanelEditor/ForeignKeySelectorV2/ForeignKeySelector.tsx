import { PostgresTable } from '@supabase/postgres-meta'
import { sortBy } from 'lodash'
import { Table } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import {
  AlertDescription_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconArrowRight,
  IconDatabase,
  IconExternalLink,
  IconHelpCircle,
  IconX,
  Listbox,
  SidePanel,
} from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import InformationBox from 'components/ui/InformationBox'
import { FOREIGN_KEY_CASCADE_ACTION } from 'data/database/database-query-constants'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { uuidv4 } from 'lib/helpers'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import ActionBar from '../ActionBar'
import { TableField } from '../TableEditor/TableEditor.types'
import { FOREIGN_KEY_CASCADE_OPTIONS } from './ForeignKeySelector.constants'
import { ForeignKey } from './ForeignKeySelector.types'
import { generateCascadeActionDescription } from './ForeignKeySelector.utils'

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
  table: TableField
  foreignKey?: ForeignKey
  onClose: () => void
  onSaveRelation: (fk: ForeignKey) => void
}

export const ForeignKeySelector = ({
  visible,
  table,
  foreignKey,
  onClose,
  onSaveRelation,
}: ForeignKeySelectorProps) => {
  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()

  const [fk, setFk] = useState(EMPTY_STATE)
  const [errors, setErrors] = useState<any>({})

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: tables } = useTablesQuery<PostgresTable[] | undefined>({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: fk.schema,
    includeColumns: true,
  })

  const selectedTable = (tables ?? []).find((x) => x.name === fk.table && x.schema === fk.schema)

  const updateSelectedSchema = (schema: string) => {
    const updatedFk = { ...EMPTY_STATE, schema }
    setFk(updatedFk)
  }

  const updateSelectedTable = (tableId: number) => {
    setErrors({})
    if (!tableId) {
      return setFk({ ...EMPTY_STATE, schema: fk.schema, columns: [{ source: '', target: '' }] })
    }
    const table = (tables ?? []).find((x) => x.id === tableId)
    if (table)
      setFk({
        ...EMPTY_STATE,
        schema: table.schema,
        table: table.name,
        columns: [{ source: '', target: '' }],
      })
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
        return { ...x, [key]: value }
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

  useEffect(() => {
    if (visible) {
      if (foreignKey !== undefined) setFk(foreignKey)
      else setFk({ ...EMPTY_STATE, id: uuidv4() })
    }
  }, [visible])

  return (
    <SidePanel
      visible={visible}
      onCancel={onClose}
      className="max-w-[480px]"
      header={`Manage foreign key relationships for ${table.name.length > 0 ? table.name : 'new table'}`}
      customFooter={
        <ActionBar
          backButtonLabel="Cancel"
          disableApply={false}
          applyButtonLabel="Save"
          closePanel={onClose}
          applyFunction={(resolve: any) => {
            onSaveRelation(fk)
            onClose()
            resolve()
          }}
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
            value={fk.schema}
            error={errors.schema}
            onChange={(value: string) => updateSelectedSchema(value)}
          >
            {schemas?.map((schema) => {
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
            {sortBy(tables, ['schema']).map((table) => {
              return (
                <Listbox.Option
                  key={table.id}
                  value={table.id}
                  label={table.name}
                  addOnBefore={() => <Table size={16} strokeWidth={1.5} />}
                >
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

          {fk.schema && fk.table && (
            <>
              <div className="flex flex-col gap-y-3">
                <label className="text-foreground-light text-sm">
                  Select columns from{' '}
                  <code className="text-xs">
                    {fk.schema}.{fk.table}
                  </code>
                  to reference to
                </label>
                <div className="grid grid-cols-10 gap-y-2">
                  <div className="col-span-5 text-xs text-foreground-lighter">
                    {snap.selectedSchemaName}.
                    {table.name.length > 0 ? table.name : '[unnamed table]'}
                  </div>
                  <div className="col-span-4 text-xs text-foreground-lighter text-right">
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
                    <Fragment key={`${uuidv4}`}>
                      <div className="col-span-4">
                        <Listbox
                          id="column"
                          value={fk.columns[idx].source}
                          error={errors.column}
                          onChange={(value: string) => updateSelectedColumn(idx, 'source', value)}
                        >
                          <Listbox.Option key="empty" value={''} label="---" className="!w-[170px]">
                            ---
                          </Listbox.Option>
                          {(table?.columns ?? []).map((column) => (
                            <Listbox.Option
                              key={column.id}
                              value={column.name}
                              label={column.name}
                              className="!w-[170px]"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-foreground">{column.name}</span>
                                <span className="text-foreground-lighter">{column.format}</span>
                              </div>
                            </Listbox.Option>
                          ))}
                        </Listbox>
                      </div>
                      <div className="col-span-1 flex justify-center items-center">
                        <IconArrowRight />
                      </div>
                      <div className="col-span-4">
                        <Listbox
                          id="column"
                          value={fk.columns[idx].target}
                          error={errors.column}
                          onChange={(value: string) => updateSelectedColumn(idx, 'target', value)}
                        >
                          <Listbox.Option key="empty" value={''} label="---" className="!w-[170px]">
                            ---
                          </Listbox.Option>
                          {(selectedTable?.columns ?? []).map((column) => (
                            <Listbox.Option
                              key={column.id}
                              value={column.name}
                              label={column.name}
                              className="!w-[170px]"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-foreground">{column.name}</span>
                                <span className="text-foreground-lighter">{column.format}</span>
                              </div>
                            </Listbox.Option>
                          ))}
                        </Listbox>
                      </div>
                      <div className="col-span-1 flex justify-end items-center">
                        <Button
                          type="default"
                          className="px-1"
                          icon={<IconX />}
                          onClick={() => onRemoveColumn(idx)}
                        />
                      </div>
                    </Fragment>
                  ))}
                </div>
                <div>
                  <Button type="default" onClick={addColumn}>
                    Add another column
                  </Button>
                </div>
              </div>

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
                value={fk.updateAction}
                label="Action if referenced row is updated"
                descriptionText={
                  <p>
                    {generateCascadeActionDescription(
                      'update',
                      fk.updateAction,
                      `${fk.schema}.${fk.table}`
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
                value={fk.deletionAction}
                className="[&>div>label]:flex [&>div>label]:items-center"
                label="Action if referenced row is removed"
                // @ts-ignore
                labelOptional={
                  <Button asChild type="default" icon={<IconExternalLink />}>
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href="https://supabase.com/docs/guides/database/postgres/cascade-deletes"
                    >
                      Documentation
                    </a>
                  </Button>
                }
                descriptionText={
                  <>
                    <p>
                      {generateCascadeActionDescription(
                        'delete',
                        fk.deletionAction,
                        `${fk.schema}.${fk.table}`
                      )}
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
