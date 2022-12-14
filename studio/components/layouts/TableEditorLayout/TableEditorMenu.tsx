import { FC, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { partition } from 'lodash'
import { observer } from 'mobx-react-lite'
import {
  Button,
  Dropdown,
  IconChevronDown,
  IconCopy,
  IconEdit,
  IconLoader,
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
import { PostgresSchema, PostgresTable } from '@supabase/postgres-meta'

import Base64 from 'lib/base64'
import { checkPermissions, useStore } from 'hooks'
import { SchemaView } from './TableEditorLayout.types'
import ProductMenuItem from 'components/ui/ProductMenu/ProductMenuItem'

interface Props {
  selectedSchema?: string
  onSelectSchema: (schema: string) => void
  onAddTable: () => void
  onEditTable: (table: PostgresTable) => void
  onDeleteTable: (table: PostgresTable) => void
  onDuplicateTable: (table: PostgresTable) => void
}

const TableEditorMenu: FC<Props> = ({
  selectedSchema,
  onSelectSchema = () => {},
  onAddTable = () => {},
  onEditTable = () => {},
  onDeleteTable = () => {},
  onDuplicateTable = () => {},
}) => {
  const { meta, ui } = useStore()
  const router = useRouter()
  const { id } = router.query

  const projectRef = ui.selectedProject?.ref
  const schemas: PostgresSchema[] = meta.schemas.list()
  const tables: PostgresTable[] = meta.tables.list(
    (table: PostgresTable) => table.schema === selectedSchema
  )
  // const foreignTables: PostgresTable[] = meta.foreignTables.list(
  //   (table: PostgresTable) => table.schema === selectedSchema
  // )
  const foreignTables = [
    {
      id: 27112,
      schema: 'public',
      name: 'balance',
      comment: null,
      columns: [
        {
          table_id: 27112,
          schema: 'public',
          table: 'balance',
          id: '27112.1',
          ordinal_position: 1,
          name: 'balance_type',
          default_value: null,
          data_type: 'text',
          format: 'text',
          is_identity: false,
          identity_generation: null,
          is_generated: false,
          is_nullable: true,
          is_updatable: true,
          is_unique: false,
          enums: [],
          comment: null,
        },
        {
          table_id: 27112,
          schema: 'public',
          table: 'balance',
          id: '27112.2',
          ordinal_position: 2,
          name: 'amount',
          default_value: null,
          data_type: 'bigint',
          format: 'int8',
          is_identity: false,
          identity_generation: null,
          is_generated: false,
          is_nullable: true,
          is_updatable: true,
          is_unique: false,
          enums: [],
          comment: null,
        },
        {
          table_id: 27112,
          schema: 'public',
          table: 'balance',
          id: '27112.3',
          ordinal_position: 3,
          name: 'currency',
          default_value: null,
          data_type: 'text',
          format: 'text',
          is_identity: false,
          identity_generation: null,
          is_generated: false,
          is_nullable: true,
          is_updatable: true,
          is_unique: false,
          enums: [],
          comment: null,
        },
        {
          table_id: 27112,
          schema: 'public',
          table: 'balance',
          id: '27112.4',
          ordinal_position: 4,
          name: 'attrs',
          default_value: null,
          data_type: 'jsonb',
          format: 'jsonb',
          is_identity: false,
          identity_generation: null,
          is_generated: false,
          is_nullable: true,
          is_updatable: true,
          is_unique: false,
          enums: [],
          comment: null,
        },
      ],
    },
  ]

  // @ts-ignore
  const schema = schemas.find((schema) => schema.name === selectedSchema)
  const canCreateTables = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  const [searchText, setSearchText] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  // We may need to shift this to the schema store and do something like meta.schema.loadViews()
  // I don't need we need a separate store for views
  useEffect(() => {
    let cancel = false
    const fetchViews = async (selectedSchema: string) => {
      await meta.schemas.loadViews(selectedSchema)
    }
    if (selectedSchema) fetchViews(selectedSchema)

    return () => {
      cancel = true
    }
  }, [selectedSchema])

  const refreshTables = async () => {
    setIsRefreshing(true)
    await meta.tables.load()
    if (selectedSchema) await meta.schemas.loadViews(selectedSchema)
    setIsRefreshing(false)
  }

  const filteredTables =
    searchText.length === 0
      ? tables
      : // @ts-ignore
        tables.filter((table) => table.name.toLowerCase().includes(searchText.toLowerCase()))

  const filteredViews =
    searchText.length === 0
      ? meta.schemas.views || []
      : (meta.schemas.views || []).filter((view) =>
          view.name.toLowerCase().includes(searchText.toLowerCase())
        )

  const filteredForeignTables =
    searchText.length === 0
      ? foreignTables
      : foreignTables.filter((table) => table.name.toLowerCase().includes(searchText.toLowerCase()))

  const [protectedSchemas, openSchemas] = partition(schemas, (schema) =>
    meta.excludedSchemas.includes(schema?.name ?? '')
  )
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  return (
    <div
      className="pt-6 flex flex-grow flex-col space-y-6"
      style={{ maxHeight: 'calc(100vh - 48px)' }}
    >
      {/* Schema selection dropdown */}
      <div className="px-3 mx-4">
        {!meta.schemas.isInitialized ? (
          <div className="flex h-[26px] items-center space-x-3 rounded border border-gray-500 px-3">
            <IconLoader className="animate-spin" size={12} />
            <span className="text-xs text-scale-900">Loading schemas...</span>
          </div>
        ) : (
          <Listbox
            size="tiny"
            value={selectedSchema}
            // @ts-ignore
            onChange={(name: string) => {
              setSearchText('')
              onSelectSchema(name)
            }}
          >
            <Listbox.Option disabled key="normal-schemas" value="normal-schemas" label="Schemas">
              <p className="text-xs text-scale-1100">Schemas</p>
            </Listbox.Option>
            {/* @ts-ignore */}
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

      <div className="flex-auto px-4 overflow-y-auto space-y-6 pb-4">
        {/* List of tables belonging to selected schema */}
        {filteredTables.length > 0 && (
          <Menu type="pills">
            <Menu.Group
              // @ts-ignore
              title={
                <>
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <p>Tables</p>
                      <p style={{ fontVariantNumeric: 'tabular-nums' }}>
                        ({filteredTables.length})
                      </p>
                    </div>
                    <button className="cursor-pointer" onClick={refreshTables}>
                      <IconRefreshCw className={isRefreshing ? 'animate-spin' : ''} size={14} />
                    </button>
                  </div>
                </>
              }
            />

            <div>
              {filteredTables.map((table) => {
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
        {filteredViews.length > 0 && (
          <Menu type="pills">
            <Menu.Group
              // @ts-ignore
              title={
                <div className="flex w-full items-center space-x-1">
                  <p>Views</p>
                  <p style={{ fontVariantNumeric: 'tabular-nums' }}>({filteredViews.length})</p>
                </div>
              }
            />

            {filteredViews.map((view: SchemaView) => {
              const viewId = Base64.encode(JSON.stringify(view))
              const isActive = id === viewId
              return (
                <Link key={viewId} href={`/project/${projectRef}/editor/${viewId}`}>
                  <a>
                    <Menu.Item key={viewId} rounded active={isActive}>
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
        {filteredForeignTables.length > 0 && (
          <Menu type="pills">
            <Menu.Group
              // @ts-ignore
              title={
                <div className="flex w-full items-center space-x-1">
                  <p>Foreign Tables</p>
                  <p style={{ fontVariantNumeric: 'tabular-nums' }}>
                    ({filteredForeignTables.length})
                  </p>
                </div>
              }
            />

            {filteredForeignTables.map((table: Partial<PostgresTable>) => {
              const isActive = Number(id) === table.id
              return (
                <Link key={table.id} href={`/project/${projectRef}/editor/${table.id}`}>
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

      {searchText.length > 0 && filteredTables.length === 0 && filteredViews.length === 0 && (
        <div className="!mt-0 mx-7 space-y-1 rounded-md border border-scale-400 bg-scale-300 py-3 px-4">
          <p className="text-xs">No results found</p>
          <p className="text-xs text-scale-1100">
            There are no tables or views that match your search
          </p>
        </div>
      )}

      {searchText.length === 0 && filteredTables.length === 0 && filteredViews.length === 0 && (
        <div className="!mt-0 mx-7 space-y-1 rounded-md border border-scale-400 bg-scale-300 py-3 px-4">
          <p className="text-xs">No tables available</p>
          <p className="text-xs text-scale-1100">This schema has no tables available yet</p>
        </div>
      )}
    </div>
  )
}

export default observer(TableEditorMenu)
