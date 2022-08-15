import { FC, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { partition } from 'lodash'
import {
  Alert,
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
  Typography,
} from '@supabase/ui'
import { PostgresSchema, PostgresTable } from '@supabase/postgres-meta'

import Base64 from 'lib/base64'
import { checkPermissions, useStore } from 'hooks'
import { SchemaView } from './TableEditorLayout.types'
import ProductMenuItem from 'components/ui/ProductMenu/ProductMenuItem'
import { PermissionAction } from '@supabase/shared-types/out/constants'

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

  // @ts-ignore
  const schema = schemas.find((schema) => schema.name === selectedSchema)

  const [searchText, setSearchText] = useState<string>('')
  const [schemaViews, setSchemaViews] = useState<SchemaView[]>([])
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  // We may need to shift this to the schema store and do something like meta.schema.loadViews()
  // I don't need we need a separate store for views
  useEffect(() => {
    let cancel = false
    const fetchViews = async (selectedSchema: string) => {
      const views: SchemaView[] = await meta.schemas.getViews(selectedSchema)
      if (!cancel) setSchemaViews(views)
    }
    if (selectedSchema) {
      fetchViews(selectedSchema)
    }
    return () => {
      cancel = true
    }
  }, [selectedSchema])

  const refreshTables = async () => {
    setIsRefreshing(true)
    await meta.tables.load()
    setIsRefreshing(false)
  }

  const schemaTables =
    searchText.length === 0
      ? tables
      : // @ts-ignore
        tables.filter((table) => table.name.toLowerCase().includes(searchText.toLowerCase()))

  const filteredSchemaViews =
    searchText.length === 0
      ? schemaViews
      : schemaViews.filter((view) => view.name.includes(searchText))

  const [protectedSchemas, openSchemas] = partition(schemas, (schema) =>
    meta.excludedSchemas.includes(schema?.name ?? '')
  )
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  return (
    <div className="my-6 mx-4 flex flex-grow flex-col space-y-6">
      {/* Schema selection dropdown */}
      <div className="px-3">
        {meta.schemas.isLoading ? (
          <div className="flex h-[30px] items-center space-x-3 rounded border border-gray-500 px-3">
            <IconLoader className="animate-spin" size={12} />
            <span className="text-scale-900 text-xs">Loading schemas...</span>
          </div>
        ) : (
          <Listbox
            size="tiny"
            value={selectedSchema}
            // @ts-ignore
            onChange={(name: string) => {
              setSearchText('')
              setSchemaViews([])
              onSelectSchema(name)
            }}
          >
            <Listbox.Option disabled key="normal-schemas" value="normal-schemas" label="Schemas">
              <p className="text-sm">Schemas</p>
            </Listbox.Option>
            {openSchemas.map((schema) => (
              <Listbox.Option
                key={schema.id}
                value={schema.name}
                // @ts-ignore
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
                // @ts-ignore
                label={schema.name}
                addOnBefore={() => <span className="text-scale-900">schema</span>}
              >
                <span className="text-scale-1200 text-sm">{schema.name}</span>
              </Listbox.Option>
            ))}
          </Listbox>
        )}
      </div>

      <div className="space-y-1">
        {!isLocked && (
          <div className="px-3">
            {/* Add new table button */}
            <Button
              block
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
          </div>
        )}
        {/* Table search input */}
        <div className="mb-2 block px-3">
          <Input
            className="border-none"
            icon={
              <div className="text-scale-900">
                <IconSearch size={12} strokeWidth={1.5} />
              </div>
            }
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

      {/* List of tables belonging to selected schema */}
      {schemaTables.length > 0 && (
        <Menu type="pills">
          <Menu.Group
            // @ts-ignore
            title={
              <>
                <div className="flex w-full items-center justify-between">
                  <span>All tables</span>
                  <button className="cursor-pointer" onClick={refreshTables}>
                    <IconRefreshCw className={isRefreshing ? 'animate-spin' : ''} size={14} />
                  </button>
                </div>
              </>
            }
          />

          <div>
            {schemaTables.map((table) => {
              const isActive = Number(id) === table.id
              return (
                <ProductMenuItem
                  key={table.name}
                  url={`/project/${projectRef}/editor/${table.id}`}
                  name={table.name}
                  hoverText={table.comment ? table.comment : table.name}
                  isActive={isActive}
                  action={
                    isActive && (
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
                          <Dropdown.Seperator key="separator" />,
                          <Dropdown.Item
                            key="delete-table"
                            icon={<IconTrash size="tiny" />}
                            onClick={() => onDeleteTable(table)}
                          >
                            Delete Table
                          </Dropdown.Item>,
                        ]}
                      >
                        <div className="text-scale-900 hover:text-scale-1200 transition-colors">
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
      {filteredSchemaViews.length > 0 && (
        <Menu type="pills">
          <Menu.Group
            // @ts-ignore
            title={
              <>
                <div className="flex w-full items-center justify-between">
                  <span>All views</span>
                </div>
              </>
            }
          />

          {schemaViews.map((view: SchemaView) => {
            const viewId = Base64.encode(JSON.stringify(view))
            const isActive = id === viewId
            return (
              <Link key={viewId} href={`/project/${projectRef}/editor/${viewId}`}>
                <Menu.Item key={viewId} rounded active={isActive}>
                  <div className="flex justify-between">
                    <Typography.Text className="truncate">{view.name}</Typography.Text>
                  </div>
                </Menu.Item>
              </Link>
            )
          })}
        </Menu>
      )}

      {searchText.length > 0 && schemaTables.length === 0 && filteredSchemaViews.length === 0 && (
        <div className="px-3">
          <Alert title="No tables or views found">This schema has no tables or views</Alert>
        </div>
      )}

      {searchText.length === 0 && schemaTables.length === 0 && filteredSchemaViews.length === 0 && (
        <div className="px-3">
          <Alert title="No tables available">There are no tables in this schema</Alert>
        </div>
      )}
    </div>
  )
}

export default TableEditorMenu
