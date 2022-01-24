import { FC, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  Button,
  Divider,
  Dropdown,
  Typography,
  Listbox,
  Menu,
  Input,
  IconCopy,
  IconChevronDown,
  IconEdit,
  IconTrash,
  IconSearch,
  IconPlus,
  IconDatabase,
  IconX,
  IconLoader,
  IconRefreshCw,
} from '@supabase/ui'
import { PostgresSchema, PostgresTable } from '@supabase/postgres-meta'

import Base64 from 'lib/base64'
import { useStore } from 'hooks'
import { SchemaView } from './TableEditorLayout.types'

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

  const schemas: PostgresSchema[] = meta.schemas.list()
  const tables: PostgresTable[] = meta.tables.list(
    (table: PostgresTable) => table.schema === selectedSchema
  )

  const schemaTables =
    searchText.length === 0
      ? tables
      : tables.filter((table) => table.name.toLowerCase().includes(searchText.toLowerCase()))

  const filteredSchemaViews =
    searchText.length === 0
      ? schemaViews
      : schemaViews.filter((view) => view.name.includes(searchText))

  // Temp fix - Ideally we'd just take up all the remaining space but
  // can't seem to figure that out immediately
  const maxScrollHeight = schemaViews.length > 0 ? 270 : 515

  return (
    <div className="my-6 flex flex-col flex-grow">
      {/* Schema selection dropdown */}
      <div className="mx-4">
        {!meta.schemas.isInitialized ? (
          <div className="h-[30px] border border-gray-500 px-3 rounded flex items-center space-x-3">
            <IconLoader className="animate-spin" size={14} />
            <Typography.Text small>Loading schemas...</Typography.Text>
          </div>
        ) : (
          <Listbox
            icon={<IconDatabase size={16} />}
            size="tiny"
            value={selectedSchema}
            onChange={(name: string) => {
              setSearchText('')
              setSchemaViews([])
              onSelectSchema(name)
            }}
          >
            {schemas.map((schema) => (
              <Listbox.Option key={schema.id} value={schema.name} label={schema.name}>
                {schema.name}
              </Listbox.Option>
            ))}
          </Listbox>
        )}
      </div>

      <div className="mx-4 my-4 space-y-1">
        {/* Add new table button */}
        {selectedSchema === 'public' && (
          <Button
            block
            icon={<IconPlus />}
            type="text"
            style={{ justifyContent: 'start' }}
            onClick={onAddTable}
          >
            New table
          </Button>
        )}

        {/* Table search input */}
        <Input
          layout="vertical"
          icon={<IconSearch size="tiny" />}
          className="sbui-input-no-border"
          placeholder="Search for a table"
          onChange={(e) => setSearchText(e.target.value)}
          value={searchText}
          size="tiny"
          actions={
            searchText && (
              <IconX
                size={'tiny'}
                className="cursor-pointer mx-1"
                onClick={() => setSearchText('')}
              />
            )
          }
        />
      </div>

      {/* List of tables belonging to selected schema */}
      {schemaTables.length > 0 && (
        <div className="mx-2 mt-6 space-y-2">
          <div className="px-4 w-full flex items-center justify-between">
            <Typography.Text type="secondary" small>
              All tables
            </Typography.Text>
            <div className="cursor-pointer" onClick={refreshTables}>
              <Typography.Text type="secondary">
                <IconRefreshCw className={isRefreshing ? 'animate-spin' : ''} size={14} />
              </Typography.Text>
            </div>
          </div>
          <div className="overflow-y-auto space-y-1" style={{ maxHeight: maxScrollHeight }}>
            {schemaTables.map((table) => {
              const isActive = Number(id) === table.id
              return (
                <Link key={table.name} href={`/project/${projectRef}/editor/${table.id}`}>
                  <a className="block editor-product-menu">
                    <Menu.Item rounded active={isActive}>
                      <div className="flex justify-between py-[2px]">
                        <Typography.Text className="truncate flex items-center">
                          {table.name}
                        </Typography.Text>
                        {isActive && (
                          <Dropdown
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
                              <Divider key="divider" light />,
                              <Dropdown.Item
                                key="delete-table"
                                icon={<IconTrash size="tiny" />}
                                onClick={() => onDeleteTable(table)}
                              >
                                Delete Table
                              </Dropdown.Item>,
                            ]}
                          >
                            <Button
                              as="span"
                              type="text"
                              icon={<IconChevronDown />}
                              style={{ padding: '3px' }}
                            />
                          </Dropdown>
                        )}
                      </div>
                    </Menu.Item>
                  </a>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* List of views belonging to selected schema */}
      {filteredSchemaViews.length > 0 && (
        <div className="mx-2 mt-6 space-y-2">
          <div className="px-4 w-full flex items-center justify-between">
            <Typography.Text type="secondary" small>
              All Views
            </Typography.Text>
          </div>
          <div className="overflow-y-auto space-y-1" style={{ maxHeight: maxScrollHeight }}>
            {schemaViews.map((view: SchemaView) => {
              const viewId = Base64.encode(JSON.stringify(view))
              const isActive = id === viewId
              return (
                <Link key={viewId} href={`/project/${projectRef}/editor/${viewId}`}>
                  <div className="dash-product-menu">
                    <Menu.Item key={viewId} rounded active={isActive}>
                      <div className="flex justify-between">
                        <Typography.Text className="truncate">{view.name}</Typography.Text>
                      </div>
                    </Menu.Item>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {searchText.length > 0 && schemaTables.length === 0 && filteredSchemaViews.length === 0 && (
        <div className="my-2 mx-6">
          <Typography.Text type="secondary">No tables or views found</Typography.Text>
        </div>
      )}

      {searchText.length === 0 && schemaTables.length === 0 && filteredSchemaViews.length === 0 && (
        <div className="my-2 mx-6">
          <Typography.Text type="secondary">No tables available</Typography.Text>
        </div>
      )}
    </div>
  )
}

export default TableEditorMenu
