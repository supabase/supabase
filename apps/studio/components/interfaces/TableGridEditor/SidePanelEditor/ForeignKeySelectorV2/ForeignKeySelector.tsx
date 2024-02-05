import { PostgresTable } from '@supabase/postgres-meta'
import { ForeignKeyConstraint } from 'data/database/foreign-key-constraints-query'
import { sortBy } from 'lodash'
import { Table } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import {
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
import ActionBar from '../ActionBar'
import { FOREIGN_KEY_CASCADE_OPTIONS } from './ForeignKeySelector.constants'
import { generateCascadeActionDescription } from './ForeignKeySelector.utils'
import { TableField } from '../TableEditor/TableEditor.types'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useParams } from 'common'

const EMPTY_STATE = {
  schema: 'public',
  table: '',
  relations: [] as { source: string; target: string }[],
  deletionAction: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
  updateAction: FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
}

interface ForeignKeySelectorProps {
  visible: boolean
  table: TableField
  foreignKey?: ForeignKeyConstraint
  onClose: () => void
}

export const ForeignKeySelector = ({
  visible,
  table,
  foreignKey,
  onClose,
}: ForeignKeySelectorProps) => {
  const { id } = useParams()
  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()

  const [fk, setFk] = useState(EMPTY_STATE)
  const [errors, setErrors] = useState<any>({})

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: currentSchemaTables } = useTablesQuery<PostgresTable[] | undefined>({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: snap.selectedSchemaName,
    includeColumns: true,
  })
  const { data: tables } = useTablesQuery<PostgresTable[] | undefined>({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: fk.schema,
    includeColumns: true,
  })

  const currentTable = (currentSchemaTables ?? []).find((x) => x.id.toString() === id)
  const selectedTable = (tables ?? []).find((x) => x.name === fk.table && x.schema === fk.schema)

  const updateSelectedSchema = (schema: string) => {
    const updatedFk = { ...EMPTY_STATE, schema }
    setFk(updatedFk)
  }

  const updateSelectedTable = (tableId: number) => {
    setErrors({})
    if (!tableId) {
      return setFk({ ...EMPTY_STATE, schema: fk.schema, relations: [{ source: '', target: '' }] })
    }
    const table = (tables ?? []).find((x) => x.id === tableId)
    if (table)
      setFk({
        ...EMPTY_STATE,
        schema: table.schema,
        table: table.name,
        relations: [{ source: '', target: '' }],
      })
  }

  const updateSelectedColumn = (idx: number, value: string) => {
    const updatedRelations = fk.relations.map((x, i) => {
      if (i === idx) {
        return { ...x, target: value }
      } else {
        return x
      }
    })
    setFk({ ...fk, relations: updatedRelations })
  }

  const updateCascadeAction = (action: 'updateAction' | 'deletionAction', value: string) => {
    setErrors({})
    setFk({ ...fk, [action]: value })
  }

  useEffect(() => {
    if (visible) {
      if (foreignKey !== undefined) {
        setFk({
          schema: foreignKey.target_schema,
          table: foreignKey.target_table,
          relations: foreignKey.source_columns.map((x, idx) => ({
            source: x,
            target: foreignKey.target_columns[idx],
          })),
          deletionAction: foreignKey.deletion_action as FOREIGN_KEY_CASCADE_ACTION,
          updateAction: foreignKey.update_action as FOREIGN_KEY_CASCADE_ACTION,
        })
      } else {
        setFk(EMPTY_STATE)
      }
    }
  }, [visible])

  return (
    <SidePanel
      visible={visible}
      onCancel={onClose}
      className="max-w-[480px]"
      header="Manage foreign key relationships for"
      customFooter={
        <ActionBar
          backButtonLabel="Cancel"
          disableApply={false}
          applyButtonLabel="Save"
          closePanel={onClose}
          applyFunction={() => {}}
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
              <div className="flex flex-col gap-y-2">
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
                  {fk.relations.map((relation, idx) => (
                    <Fragment key={`${relation.source}-${relation.target}`}>
                      <div className="col-span-4">
                        <Listbox
                          id="column"
                          value={fk.relations[idx].target}
                          error={errors.column}
                          onChange={(value: string) => updateSelectedColumn(idx, value)}
                        >
                          <Listbox.Option key="empty" value={1} label="---" className="!w-[170px]">
                            ---
                          </Listbox.Option>
                          {(currentTable?.columns ?? []).map((column) => (
                            <Listbox.Option
                              key={column.id}
                              value={column.id}
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
                          value={fk.relations[idx].target}
                          error={errors.column}
                          onChange={(value: string) => updateSelectedColumn(idx, value)}
                        >
                          <Listbox.Option key="empty" value={1} label="---" className="!w-[170px]">
                            ---
                          </Listbox.Option>
                          {(selectedTable?.columns ?? []).map((column) => (
                            <Listbox.Option
                              key={column.id}
                              value={column.id}
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
                        <Button type="default" className="px-1" icon={<IconX />} />
                      </div>
                    </Fragment>
                  ))}
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
