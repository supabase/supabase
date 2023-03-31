import SVG from 'react-inlinesvg'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { noop, partition } from 'lodash'
import { observer } from 'mobx-react-lite'
import {
  Button,
  Dropdown,
  IconCheck,
  IconChevronDown,
  IconChevronsDown,
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
import type { PostgresSchema } from '@supabase/postgres-meta'

import { useParams } from 'common/hooks'
import { BASE_PATH } from 'lib/constants'
import { checkPermissions, useStore, useLocalStorage } from 'hooks'
import ProductMenuItem from 'components/ui/ProductMenu/ProductMenuItem'
import { useEntityTypesQuery } from 'data/entity-types/entity-types-infinite-query'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { Entity } from 'data/entity-types/entity-type-query'
import { useProjectContext } from '../ProjectLayout/ProjectContext'
import InfiniteList from 'components/ui/InfiniteList'
import clsx from 'clsx'

export interface TableEditorMenuProps {
  selectedSchema?: string
  onSelectSchema: (schema: string) => void
  onAddTable: () => void
  onEditTable: (table: Entity) => void
  onDeleteTable: (table: Entity) => void
  onDuplicateTable: (table: Entity) => void
}

const TableEditorMenu = ({
  selectedSchema,
  onSelectSchema = noop,
  onAddTable = noop,
  onEditTable = noop,
  onDeleteTable = noop,
  onDuplicateTable = noop,
}: TableEditorMenuProps) => {
  const { meta } = useStore()
  const { id } = useParams()

  const [searchText, setSearchText] = useState<string>('')
  const [sort, setSort] = useLocalStorage<'alphabetical' | 'grouped-alphabetical'>(
    'table-editor-sort',
    'alphabetical'
  )

  const { project } = useProjectContext()
  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isPreviousData: isSearching,
  } = useEntityTypesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schema: selectedSchema,
      search: searchText || undefined,
      sort,
    },
    {
      keepPreviousData: true,
    }
  )

  const totalCount = data?.pages?.[0].data.count
  const entityTypes = useMemo(
    () => data?.pages.flatMap((page) => page.data.entities),
    [data?.pages]
  )

  const schemas: PostgresSchema[] = meta.schemas.list()

  const schema = schemas.find((schema) => schema.name === selectedSchema)
  const canCreateTables = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  const isLoadingTableMetadata = id ? !meta.tables.byId(id) : true

  const refreshTables = async () => {
    await refetch()
  }

  const [protectedSchemas, openSchemas] = partition(schemas, (schema) =>
    meta.excludedSchemas.includes(schema?.name ?? '')
  )
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  return (
    <div
      className="pt-6 flex flex-col flex-grow space-y-6 h-full"
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
        {/* Table search input */}
        <div className="mb-2 block px-3">
          <Input
            className="table-editor-search border-none"
            icon={
              isSearching ? (
                <IconLoader className="animate-spin text-scale-900" size={12} strokeWidth={1.5} />
              ) : (
                <IconSearch className="text-scale-900" size={12} strokeWidth={1.5} />
              )
            }
            placeholder="Search tables"
            onChange={(e) => setSearchText(e.target.value.trim())}
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

      {isLoading ? (
        <div className="mx-7 flex items-center space-x-2">
          <IconLoader className="animate-spin" size={14} strokeWidth={1.5} />
          <p className="text-sm text-scale-1000">Loading entities...</p>
        </div>
      ) : searchText.length === 0 && (entityTypes?.length ?? 0) === 0 ? (
        <div className="mx-7 space-y-1 rounded-md border border-scale-400 bg-scale-300 py-3 px-4">
          <p className="text-xs">No entities available</p>
          <p className="text-xs text-scale-1100">This schema has no entities available yet</p>
        </div>
      ) : searchText.length > 0 && (entityTypes?.length ?? 0) === 0 ? (
        <div className="mx-7 space-y-1 rounded-md border border-scale-400 bg-scale-300 py-3 px-4">
          <p className="text-xs">No results found</p>
          <p className="text-xs text-scale-1100">There are no entities that match your search</p>
        </div>
      ) : (
        <Menu
          type="pills"
          className="flex flex-auto px-4 space-y-6 pb-4"
          ulClassName="flex flex-auto flex-col"
        >
          <Menu.Group
            // @ts-ignore
            title={
              <>
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <p>Tables</p>
                    {totalCount !== undefined && (
                      <p style={{ fontVariantNumeric: 'tabular-nums' }}>({totalCount})</p>
                    )}
                  </div>

                  <div className="flex gap-3 items-center">
                    <Dropdown
                      size="small"
                      side="bottom"
                      align="start"
                      style={{ zIndex: 1 }}
                      overlay={[
                        <Dropdown.Item
                          key="alphabetical"
                          icon={
                            sort === 'alphabetical' ? (
                              <IconCheck size="tiny" />
                            ) : (
                              <div className="w-[14px] h-[14px]" />
                            )
                          }
                          onClick={() => {
                            setSort('alphabetical')
                          }}
                        >
                          Alphabetical
                        </Dropdown.Item>,
                        <Dropdown.Item
                          key="grouped-alphabetical"
                          icon={
                            sort === 'grouped-alphabetical' ? (
                              <IconCheck size="tiny" />
                            ) : (
                              <div className="w-[14px] h-[14px]" />
                            )
                          }
                          onClick={() => {
                            setSort('grouped-alphabetical')
                          }}
                        >
                          Entity Type
                        </Dropdown.Item>,
                      ]}
                    >
                      <Tooltip.Root delayDuration={0}>
                        <Tooltip.Trigger asChild>
                          <div className="text-scale-900 transition-colors hover:text-scale-1200">
                            <IconChevronsDown size={18} strokeWidth={1} />
                          </div>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content side="bottom">
                            <Tooltip.Arrow className="radix-tooltip-arrow" />
                            <div
                              className={[
                                'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                                'border border-scale-200',
                              ].join(' ')}
                            >
                              <span className="text-xs">Sort By</span>
                            </div>
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Dropdown>

                    <button
                      className="cursor-pointer text-scale-900 transition-colors hover:text-scale-1200"
                      onClick={refreshTables}
                    >
                      <IconRefreshCw className={isRefetching ? 'animate-spin' : ''} size={14} />
                    </button>
                  </div>
                </div>
              </>
            }
          />

          <div className="flex flex-1">
            <InfiniteList
              items={entityTypes}
              ItemComponent={EntityListItem}
              itemProps={{
                projectRef: project?.ref,
                id: Number(id),
                onEditTable,
                onDeleteTable,
                onDuplicateTable,
                isLoadingTableMetadata,
              }}
              getItemSize={() => 28}
              hasNextPage={hasNextPage}
              isLoadingNextPage={isFetchingNextPage}
              onLoadNextPage={() => fetchNextPage()}
            />
          </div>
        </Menu>
      )}
    </div>
  )
}

export default observer(TableEditorMenu)

export interface EntityListItemProps {
  id: number
  projectRef: string
  item: Entity
  isLocked: boolean
  onEditTable: (table: Entity) => void
  onDeleteTable: (table: Entity) => void
  onDuplicateTable: (table: Entity) => void
  isLoadingTableMetadata?: boolean
}

const EntityListItem = ({
  id,
  projectRef,
  item: entity,
  isLocked,
  onEditTable,
  onDeleteTable,
  onDuplicateTable,
  isLoadingTableMetadata = false,
}: EntityListItemProps) => {
  const isActive = Number(id) === entity.id
  const formatTooltipText = (entityType: string) => {
    return Object.entries(ENTITY_TYPE)
      .find(([, value]) => value === entityType)?.[0]
      ?.toLowerCase()
      ?.split('_')
      ?.join(' ')
  }

  return (
    <ProductMenuItem
      url={`/project/${projectRef}/editor/${entity.id}`}
      name={entity.name}
      hoverText={entity.comment ? entity.comment : entity.name}
      isActive={isActive}
      icon={
        <Tooltip.Root delayDuration={0} disableHoverableContent={true}>
          <Tooltip.Trigger className="w-full flex items-center">
            {entity.type === ENTITY_TYPE.TABLE ? (
              <SVG
                className="table-icon"
                src={`${BASE_PATH}/img/icons/table-icon.svg`}
                style={{ width: `16px`, height: `16px`, strokeWidth: '1px' }}
                preProcessor={(code: any) =>
                  code.replace(/svg/, 'svg class="m-auto text-color-inherit"')
                }
              />
            ) : entity.type === ENTITY_TYPE.VIEW ? (
              <SVG
                className="view-icon"
                src={`${BASE_PATH}/img/icons/view-icon.svg`}
                style={{ width: `16px`, height: `16px`, strokeWidth: '1px' }}
                preProcessor={(code: any) =>
                  code.replace(/svg/, 'svg class="m-auto text-color-inherit"')
                }
              />
            ) : (
              <div
                className={clsx(
                  'flex items-center justify-center text-xs h-4 w-4 rounded-[2px] font-bold',
                  entity.type === ENTITY_TYPE.FOREIGN_TABLE && 'text-yellow-900 bg-yellow-500',
                  entity.type === ENTITY_TYPE.MATERIALIZED_VIEW && 'text-purple-1000 bg-purple-500',
                  entity.type === ENTITY_TYPE.PARTITIONED_TABLE && 'text-scale-1100 bg-scale-800'
                )}
              >
                {Object.entries(ENTITY_TYPE)
                  .find(([, value]) => value === entity.type)?.[0]?.[0]
                  ?.toUpperCase()}
              </div>
            )}
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                  'border border-scale-200',
                ].join(' ')}
              >
                <span className="text-xs text-scale-1200 capitalize">
                  {formatTooltipText(entity.type)}
                </span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      }
      action={
        entity.type === ENTITY_TYPE.TABLE &&
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
                onClick={() => onEditTable(entity)}
                disabled={isLoadingTableMetadata}
              >
                Edit Table
              </Dropdown.Item>,
              <Dropdown.Item
                key="duplicate-table"
                icon={<IconCopy size="tiny" />}
                onClick={() => onDuplicateTable(entity)}
                disabled={isLoadingTableMetadata}
              >
                Duplicate Table
              </Dropdown.Item>,
              <Link href={`/project/${projectRef}/auth/policies?search=${entity.id}`}>
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
                onClick={() => onDeleteTable(entity)}
                disabled={isLoadingTableMetadata}
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
}
