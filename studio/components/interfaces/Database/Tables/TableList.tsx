import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop, partition } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'
import Table from 'components/to-be-cleaned/Table'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useCheckPermissions, useStore } from 'hooks'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import {
  Button,
  IconCheck,
  IconColumns,
  IconEdit3,
  IconLock,
  IconPlus,
  IconSearch,
  IconTrash,
  Input,
  Listbox,
} from 'ui'
import AlertError from 'components/ui/AlertError'

interface TableListProps {
  onAddTable: () => void
  onEditTable: (table: any) => void
  onDeleteTable: (table: any) => void
  onOpenTable: (table: any) => void
}

const TableList = ({
  onAddTable = noop,
  onEditTable = noop,
  onDeleteTable = noop,
  onOpenTable = noop,
}: TableListProps) => {
  const { meta } = useStore()
  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()

  const [filterString, setFilterString] = useState<string>('')
  const canUpdateTables = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const [protectedSchemas, openSchemas] = partition(schemas ?? [], (schema) =>
    EXCLUDED_SCHEMAS.includes(schema?.name ?? '')
  )

  const {
    data: tables,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useTablesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schema: snap.selectedSchemaName,
    },
    {
      select(tables) {
        return filterString.length === 0
          ? tables
          : tables.filter((table) => table.name.includes(filterString))
      },
    }
  )

  const publications = meta.publications.list()
  const realtimePublication = publications.find(
    (publication) => publication.name === 'supabase_realtime'
  )

  const schema = schemas?.find((schema) => schema.name === snap.selectedSchemaName)
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  return (
    <>
      <div className="mb-4">
        <h3 className="mb-1 text-xl text-scale-1200">Database Tables</h3>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-[260px]">
            <Listbox
              size="small"
              value={snap.selectedSchemaName}
              onChange={snap.setSelectedSchemaName}
              icon={isLocked && <IconLock size={14} strokeWidth={2} />}
            >
              <Listbox.Option disabled key="normal-schemas" value="normal-schemas" label="Schemas">
                <p className="text-sm">Schemas</p>
              </Listbox.Option>
              {openSchemas.map((schema) => (
                <Listbox.Option
                  key={schema.id}
                  value={schema.name}
                  label={schema.name}
                  addOnBefore={() => <span className="text-scale-900">schema</span>}
                >
                  <span className="text-scale-1200 text-sm">{schema.name}</span>
                </Listbox.Option>
              ))}
              <Listbox.Option
                disabled
                key="protected-schemas"
                value="protected-schemas"
                label="Protected schemas"
              >
                <p className="text-sm">Protected schemas</p>
              </Listbox.Option>
              {protectedSchemas.map((schema) => (
                <Listbox.Option
                  key={schema.id}
                  value={schema.name}
                  label={schema.name}
                  addOnBefore={() => <span className="text-scale-900">schema</span>}
                >
                  <span className="text-scale-1200 text-sm">{schema.name}</span>
                </Listbox.Option>
              ))}
            </Listbox>
          </div>
          <div>
            <Input
              size="small"
              placeholder="Filter tables"
              value={filterString}
              onChange={(e: any) => setFilterString(e.target.value)}
              icon={<IconSearch size="tiny" />}
            />
          </div>
        </div>

        {!isLocked && (
          <div>
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger>
                <Button
                  disabled={!canUpdateTables}
                  icon={<IconPlus />}
                  onClick={() => onAddTable()}
                >
                  New table
                </Button>
              </Tooltip.Trigger>
              {!canUpdateTables && (
                <Tooltip.Portal>
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                        'border border-scale-200',
                      ].join(' ')}
                    >
                      <span className="text-xs text-scale-1200">
                        You need additional permissions to create tables
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="py-4 space-y-2">
          <GenericSkeletonLoader />
        </div>
      )}

      {isError && <AlertError error={error} subject="Failed to retrieve tables" />}

      {isSuccess &&
        (tables.length === 0 ? (
          <NoSearchResults />
        ) : (
          <div className="my-4 w-full">
            <Table
              head={[
                <Table.th key="name">Name</Table.th>,
                <Table.th key="description" className="hidden lg:table-cell">
                  Description
                </Table.th>,
                <Table.th key="rows" className="hidden xl:table-cell">
                  Rows (Estimated)
                </Table.th>,
                <Table.th key="size" className="hidden xl:table-cell">
                  Size (Estimated)
                </Table.th>,
                <Table.th key="realtime" className="hidden xl:table-cell text-center">
                  Realtime Enabled
                </Table.th>,
                <Table.th key="buttons"></Table.th>,
              ]}
              body={
                <>
                  {tables.length === 0 && filterString.length === 0 && (
                    <Table.tr key={snap.selectedSchemaName}>
                      <Table.td colSpan={6}>
                        <p className="text-sm text-scale-1200">No tables created yet</p>
                        <p className="text-sm text-light">
                          There are no tables found in the schema "{snap.selectedSchemaName}"
                        </p>
                      </Table.td>
                    </Table.tr>
                  )}
                  {tables.length === 0 && filterString.length > 0 && (
                    <Table.tr key={snap.selectedSchemaName}>
                      <Table.td colSpan={6}>
                        <p className="text-sm text-scale-1200">No results found</p>
                        <p className="text-sm text-light">
                          Your search for "{filterString}" did not return any results
                        </p>
                      </Table.td>
                    </Table.tr>
                  )}
                  {tables.length > 0 &&
                    tables.map((x: any, i: any) => (
                      <Table.tr key={x.id}>
                        <Table.td>
                          <p title={x.name}>{x.name}</p>
                        </Table.td>
                        <Table.td className="hidden max-w-sm truncate lg:table-cell break-all whitespace-normal">
                          {x.comment !== null ? (
                            <p title={x.comment}>{x.comment}</p>
                          ) : (
                            <p className="text-scale-800">No description</p>
                          )}
                        </Table.td>
                        <Table.td className="hidden xl:table-cell">
                          <code className="text-sm">
                            {x.live_rows_estimate ?? x.live_row_count}
                          </code>
                        </Table.td>
                        <Table.td className="hidden xl:table-cell">
                          <code className="text-sm">{x.size}</code>
                        </Table.td>
                        <Table.td className="hidden xl:table-cell text-center">
                          {(realtimePublication?.tables ?? []).find(
                            (table: any) => table.id === x.id
                          ) && (
                            <div className="flex justify-center">
                              <IconCheck strokeWidth={2} />
                            </div>
                          )}
                        </Table.td>
                        <Table.td>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="default"
                              iconRight={<IconColumns />}
                              className="whitespace-nowrap hover:border-gray-500"
                              style={{ paddingTop: 3, paddingBottom: 3 }}
                              onClick={() => onOpenTable(x)}
                            >
                              {x.columns?.length} columns
                            </Button>

                            <Tooltip.Root delayDuration={0}>
                              <Tooltip.Trigger>
                                <Button
                                  type="text"
                                  icon={<IconEdit3 />}
                                  style={{ padding: 5 }}
                                  disabled={!canUpdateTables || isLocked}
                                  onClick={() => onEditTable(x)}
                                />
                              </Tooltip.Trigger>
                              {!canUpdateTables && (
                                <Tooltip.Portal>
                                  <Tooltip.Content side="bottom">
                                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                                    <div
                                      className={[
                                        'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                                        'border border-scale-200',
                                      ].join(' ')}
                                    >
                                      <span className="text-xs text-scale-1200">
                                        You need additional permissions to edit tables
                                      </span>
                                    </div>
                                  </Tooltip.Content>
                                </Tooltip.Portal>
                              )}
                            </Tooltip.Root>

                            <Tooltip.Root delayDuration={0}>
                              <Tooltip.Trigger>
                                <Button
                                  type="text"
                                  icon={<IconTrash />}
                                  style={{ padding: 5 }}
                                  disabled={!canUpdateTables || isLocked}
                                  onClick={() => onDeleteTable(x)}
                                />
                              </Tooltip.Trigger>
                              {!canUpdateTables && (
                                <Tooltip.Portal>
                                  <Tooltip.Content side="bottom">
                                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                                    <div
                                      className={[
                                        'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                                        'border border-scale-200',
                                      ].join(' ')}
                                    >
                                      <span className="text-xs text-scale-1200">
                                        You need additional permissions to delete tables
                                      </span>
                                    </div>
                                  </Tooltip.Content>
                                </Tooltip.Portal>
                              )}
                            </Tooltip.Root>
                          </div>
                        </Table.td>
                      </Table.tr>
                    ))}
                </>
              }
            />
          </div>
        ))}
    </>
  )
}

export default observer(TableList)
