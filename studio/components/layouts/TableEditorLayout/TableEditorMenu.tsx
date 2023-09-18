import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { useMemo, useState } from 'react'

import { useParams } from 'common/hooks'
import InfiniteList from 'components/ui/InfiniteList'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useEntityTypesQuery } from 'data/entity-types/entity-types-infinite-query'
import { useCheckPermissions, useLocalStorage } from 'hooks'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import {
  Alert,
  Button,
  Dropdown,
  IconCheck,
  IconChevronsDown,
  IconEdit,
  IconLoader,
  IconRefreshCw,
  IconSearch,
  IconX,
  Input,
  Listbox,
  Menu,
} from 'ui'
import { useProjectContext } from '../ProjectLayout/ProjectContext'
import EntityListItem from './EntityListItem'

const TableEditorMenu = () => {
  const { id } = useParams()
  const snap = useTableEditorStateSnapshot()

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
      schema: snap.selectedSchemaName,
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

  const {
    data: schemas,
    isLoading: isSchemasLoading,
    isSuccess: isSchemasSuccess,
    isError: isSchemasError,
    error: schemasError,
    refetch: refetchSchemas,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const schema = schemas?.find((schema) => schema.name === snap.selectedSchemaName)
  const canCreateTables = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  const refreshTables = async () => {
    await refetch()
  }

  const [protectedSchemas, openSchemas] = partition(schemas, (schema) =>
    EXCLUDED_SCHEMAS.includes(schema?.name ?? '')
  )
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  return (
    <div
      className="pt-6 flex flex-col flex-grow space-y-6 h-full"
      style={{ maxHeight: 'calc(100vh - 48px)' }}
    >
      {/* Schema selection dropdown */}
      <div className="px-3 mx-4">
        {isSchemasLoading && (
          <div className="flex h-[26px] items-center space-x-3 rounded border border-gray-500 px-3">
            <IconLoader className="animate-spin" size={12} />
            <span className="text-xs text-scale-900">Loading schemas...</span>
          </div>
        )}

        {isSchemasError && (
          <Alert variant="warning" title="Failed to load schemas" className="!px-3 !py-3">
            <p className="mb-2">Error: {schemasError.message}</p>
            <Button type="default" size="tiny" onClick={() => refetchSchemas()}>
              Reload schemas
            </Button>
          </Alert>
        )}

        {isSchemasSuccess && (
          <Listbox
            size="tiny"
            value={snap.selectedSchemaName}
            onChange={(name: string) => {
              setSearchText('')
              snap.setSelectedSchemaName(name)
            }}
          >
            <Listbox.Option
              disabled
              key="normal-schemas"
              value="normal-schemas"
              label="Schemas"
              className="!w-[200px]"
            >
              <p className="text-xs text-scale-1100">Schemas</p>
            </Listbox.Option>
            {openSchemas.map((schema) => (
              <Listbox.Option
                key={schema.id}
                value={schema.name}
                label={schema.name}
                className="!w-[200px]"
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
              className="!w-[200px]"
            >
              <p className="text-xs text-scale-1100">Protected schemas</p>
            </Listbox.Option>
            {protectedSchemas.map((schema) => (
              <Listbox.Option
                key={schema.id}
                value={schema.name}
                label={schema.name}
                className="!w-[200px]"
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
                  asChild
                  block
                  disabled={!canCreateTables}
                  size="tiny"
                  icon={
                    <div className="text-scale-900">
                      <IconEdit size={14} strokeWidth={1.5} />
                    </div>
                  }
                  type="default"
                  style={{ justifyContent: 'start' }}
                  onClick={snap.onAddTable}
                >
                  <span>New table</span>
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

export default TableEditorMenu
