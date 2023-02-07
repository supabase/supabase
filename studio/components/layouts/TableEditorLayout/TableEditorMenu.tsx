import { useState } from 'react'
import Link from 'next/link'
import { groupBy, noop, partition } from 'lodash'
import {
  Button,
  Dropdown,
  IconChevronDown,
  IconCopy,
  IconEdit,
  IconLoader,
  IconLock,
  IconRefreshCw,
  IconSearch,
  IconTrash,
  IconX,
  Input,
  Listbox,
  Menu,
} from 'ui'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useParams } from 'hooks'

import ProductMenuItem from 'components/ui/ProductMenu/ProductMenuItem'
import { useTablesQuery } from 'data/tables/tables-query'
import { Table } from 'data/tables/table-query'
import { useProjectContext } from '../ProjectLayout/ProjectContext'
import { useSchemasQuery } from 'data/tables/schemas-query'
import { SYSTEM_SCHEMAS } from 'lib/constants'
import { PostgresTable } from '@supabase/postgres-meta'

export type TableEditorMenuProps = {
  selectedSchema?: string
  onSelectSchema: (schema: string) => void
  onAddTable: () => void
  onEditTable: (table: Table) => void
  onDeleteTable: (table: Table) => void
  onDuplicateTable: (table: Table) => void
}

const TableEditorMenu = ({
  selectedSchema,
  onSelectSchema = noop,
  onAddTable = noop,
  onEditTable = noop,
  onDeleteTable = noop,
  onDuplicateTable = noop,
}: TableEditorMenuProps) => {
  const { ref: projectRef, id } = useParams()
  const { project } = useProjectContext()

  const [searchText, setSearchText] = useState<string>('')

  const {
    data: tablesData,
    isLoading: isLoadingTables,
    refetch: refetchTables,
    isRefetching: isRefetchingTables,
    isSuccess: isSuccessTables,
    isError,
    error,
  } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: selectedSchema,
  })

  const objects = tablesData?.result ?? []
  const filteredObjects =
    searchText.trim().length > 0
      ? objects.filter((o) => o.name.toLowerCase().includes(searchText.toLowerCase()))
      : objects
  const {
    table: tables = [],
    foreign_table: foreignTables = [],
    view: views = [],
    materialized_view: materializedViews = [],
    partitioned_table: partitionedTables = [],
  } = groupBy(filteredObjects, 'type')

  const allTables = [...tables, ...partitionedTables]
  const allViews = [...views, ...materializedViews]

  const {
    data: schemasData,
    isLoading: isLoadingSchemas,
    refetch: refetchSchemas,
    isRefetching: isRefetchingSchemas,
    isSuccess: isSuccessSchemas,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const schemas = schemasData?.result ?? []

  const schema = schemas.find((schema) => schema.name === selectedSchema)
  const canCreateTables = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  const refreshTables = async () => {
    await Promise.allSettled([refetchTables(), refetchSchemas()])
  }

  const [protectedSchemas, openSchemas] = partition(schemas, (schema) =>
    SYSTEM_SCHEMAS.includes(schema.name)
  )
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  return (
    <div
      className="pt-6 flex flex-grow flex-col space-y-6"
      style={{ maxHeight: 'calc(100vh - 48px)' }}
    >
      {/* Schema selection dropdown */}
      <div className="px-3 mx-4">
        {isLoadingSchemas && (
          <div className="flex h-[26px] items-center space-x-3 rounded border border-gray-500 px-3">
            <IconLoader className="animate-spin" size={12} />
            <span className="text-xs text-scale-900">Loading schemas...</span>
          </div>
        )}

        {isSuccessSchemas && (
          <Listbox
            size="tiny"
            value={selectedSchema}
            onChange={(name: string) => {
              setSearchText('')
              onSelectSchema(name)
            }}
          >
            <Listbox.Option disabled key="normal-schemas" value="normal-schemas" label="Schemas">
              <p className="text-xs text-scale-1100">Schemas</p>
            </Listbox.Option>
            {openSchemas.map((schema) => (
              <Listbox.Option
                key={schema.id}
                value={schema.name}
                label={schema.name}
                addOnBefore={() => <span className="text-scale-900 text-xs">schema</span>}
              >
                <span className="text-scale-1200 text-xs">{schema.name}</span>
              </Listbox.Option>
            ))}
            <Listbox.Option
              disabled
              key="protected-schemas"
              value="protected-schemas"
              label="Protected schemas"
            >
              <p className="text-xs text-scale-1100">Protected schemas</p>
            </Listbox.Option>
            {protectedSchemas.map((schema) => (
              <Listbox.Option
                key={schema.id}
                value={schema.name}
                label={schema.name}
                addOnBefore={() => <span className="text-scale-900 text-xs">schema</span>}
              >
                <span className="text-scale-1200 text-xs">{schema.name}</span>
              </Listbox.Option>
            ))}
          </Listbox>
        )}
      </div>

      <div className="space-y-1 mx-4">
        {!isLocked && (
          <div className="px-3">
            {/* Add new table button */}
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger className="w-full">
                <Button
                  block
                  as="span"
                  disabled={!canCreateTables}
                  size="tiny"
                  icon={
                    <div className="text-scale-900">
                      <IconEdit size={14} strokeWidth={1.5} />
                    </div>
                  }
                  type="default"
                  style={{ justifyContent: 'start' }}
                  onClick={onAddTable}
                >
                  New table
                </Button>
              </Tooltip.Trigger>
              {!canCreateTables && (
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
              )}
            </Tooltip.Root>
          </div>
        )}
        {/* Table search input */}
        <div className="mb-2 block px-3">
          <Input
            className="table-editor-search border-none"
            icon={<IconSearch className="text-scale-900" size={12} strokeWidth={1.5} />}
            placeholder="Search tables"
            onChange={(e) => setSearchText(e.target.value)}
            value={searchText}
            size="tiny"
            actions={
              searchText && (
                <Button size="tiny" type="text" onClick={() => setSearchText('')}>
                  <IconX size={12} strokeWidth={2} />
                </Button>
              )
            }
          />
        </div>
      </div>

      {isLoadingTables ? (
        <div className="mx-7 flex items-center space-x-2">
          <IconLoader className="animate-spin" size={14} strokeWidth={1.5} />
          <p className="text-sm text-scale-1000">Loading tables...</p>
        </div>
      ) : searchText.length === 0 && allTables.length === 0 && allViews.length === 0 ? (
        <div className="mx-7 space-y-1 rounded-md border border-scale-400 bg-scale-300 py-3 px-4">
          <p className="text-xs">No tables available</p>
          <p className="text-xs text-scale-1100">This schema has no tables available yet</p>
        </div>
      ) : (
        <div className="flex-auto px-4 overflow-y-auto space-y-6 pb-4">
          {/* List of tables belonging to selected schema */}
          {allTables.length > 0 && (
            <Menu type="pills">
              <Menu.Group
                // @ts-ignore
                title={
                  <>
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <p>Tables</p>
                        <p style={{ fontVariantNumeric: 'tabular-nums' }}>({allTables.length})</p>
                      </div>
                      <button className="cursor-pointer" onClick={refreshTables}>
                        <IconRefreshCw
                          className={isRefetchingTables ? 'animate-spin' : ''}
                          size={14}
                        />
                      </button>
                    </div>
                  </>
                }
              />

              <div>
                {allTables.map((table) => {
                  const isActive = Number(id) === table.id
                  return (
                    <ProductMenuItem
                      key={table.name}
                      url={`/project/${projectRef}/editor/${table.id}`}
                      name={table.name}
                      hoverText={table.comment ? table.comment : table.name}
                      isActive={isActive}
                      action={
                        isActive &&
                        !isLocked && (
                          <Dropdown
                            size="small"
                            side="bottom"
                            align="start"
                            overlay={[
                              <Dropdown.Item
                                key="edit-table"
                                icon={<IconEdit size="tiny" />}
                                onClick={() => onEditTable(table)}
                              >
                                Edit Table
                              </Dropdown.Item>,
                              <Dropdown.Item
                                key="duplicate-table"
                                icon={<IconCopy size="tiny" />}
                                onClick={() => onDuplicateTable(table)}
                              >
                                Duplicate Table
                              </Dropdown.Item>,
                              <Link
                                href={`/project/${projectRef}/auth/policies?search=${table.id}`}
                              >
                                <a>
                                  <Dropdown.Item key="delete-table" icon={<IconLock size="tiny" />}>
                                    View Policies
                                  </Dropdown.Item>
                                </a>
                              </Link>,
                              <Dropdown.Separator key="separator" />,
                              <Dropdown.Item
                                key="delete-table"
                                icon={<IconTrash size="tiny" />}
                                onClick={() => onDeleteTable(table)}
                              >
                                Delete Table
                              </Dropdown.Item>,
                            ]}
                          >
                            <div className="text-scale-900 transition-colors hover:text-scale-1200">
                              <IconChevronDown size={14} strokeWidth={2} />
                            </div>
                          </Dropdown>
                        )
                      }
                    />
                  )
                })}
              </div>
            </Menu>
          )}

          {/* List of views belonging to selected schema */}
          {allViews.length > 0 && (
            <Menu type="pills">
              <Menu.Group
                // @ts-ignore
                title={
                  <div className="flex w-full items-center space-x-1">
                    <p>Views</p>
                    <p style={{ fontVariantNumeric: 'tabular-nums' }}>({allViews.length})</p>
                  </div>
                }
              />

              {allViews.map((view) => {
                const isActive = Number(id) === view.id
                return (
                  <Link key={view.id} href={`/project/${projectRef}/editor/${view.id}?type=view`}>
                    <a>
                      <Menu.Item key={view.id} rounded active={isActive}>
                        <div className="flex justify-between">
                          <p className="truncate">{view.name}</p>
                        </div>
                      </Menu.Item>
                    </a>
                  </Link>
                )
              })}
            </Menu>
          )}

          {/* List of foreign tables belonging to selected schema */}
          {foreignTables.length > 0 && (
            <Menu type="pills">
              <Menu.Group
                // @ts-ignore
                title={
                  <div className="flex w-full items-center space-x-1">
                    <p>Foreign Tables</p>
                    <p style={{ fontVariantNumeric: 'tabular-nums' }}>({foreignTables.length})</p>
                  </div>
                }
              />

              {foreignTables.map((table: Partial<PostgresTable>) => {
                const isActive = Number(id) === table.id
                return (
                  <Link
                    key={table.id}
                    href={`/project/${projectRef}/editor/${table.id}?type=foreign`}
                  >
                    <a>
                      <Menu.Item key={table.id} rounded active={isActive}>
                        <div className="flex justify-between">
                          <p className="truncate">{table.name}</p>
                        </div>
                      </Menu.Item>
                    </a>
                  </Link>
                )
              })}
            </Menu>
          )}
        </div>
      )}

      {isLoadingTables && (
        <div className="flex flex-col items-center justify-center gap-2">
          <IconLoader className="animate-spin" size={14} strokeWidth={1.5} />
          <span className="text-sm text-scale-900">Loading tables...</span>
        </div>
      )}

      {isSuccessTables && searchText.length > 0 && filteredObjects.length <= 0 && (
        <div className="!mt-0 mx-7 space-y-1 rounded-md border border-scale-400 bg-scale-300 py-3 px-4">
          <p className="text-xs">No results found</p>
          <p className="text-xs text-scale-1100">
            There are no tables or views that match your search
          </p>
        </div>
      )}

      {isSuccessTables && searchText.length <= 0 && objects.length <= 0 && (
        <div className="!mt-0 mx-7 space-y-1 rounded-md border border-scale-400 bg-scale-300 py-3 px-4">
          <p className="text-xs">No tables available</p>
          <p className="text-xs text-scale-1100">This schema has no tables available yet</p>
        </div>
      )}
    </div>
  )
}

export default TableEditorMenu
