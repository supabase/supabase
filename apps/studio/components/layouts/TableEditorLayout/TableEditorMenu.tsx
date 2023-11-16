import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { partition } from 'lodash'
import { useMemo, useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  IconChevronsDown,
  IconEdit,
  IconLoader,
  IconRefreshCw,
  IconSearch,
  IconX,
  Input,
  Menu,
} from 'ui'

import { ProtectedSchemaModal } from 'components/interfaces/Database/ProtectedSchemaWarning'
import InfiniteList from 'components/ui/InfiniteList'
import SchemaSelector from 'components/ui/SchemaSelector'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useEntityTypesQuery } from 'data/entity-types/entity-types-infinite-query'
import { useCheckPermissions, useLocalStorage } from 'hooks'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useProjectContext } from '../ProjectLayout/ProjectContext'
import EntityListItem from './EntityListItem'

const TableEditorMenu = () => {
  const { id } = useParams()
  const snap = useTableEditorStateSnapshot()

  const [showModal, setShowModal] = useState(false)
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

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const schema = schemas?.find((schema) => schema.name === snap.selectedSchemaName)
  const canCreateTables = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  const refreshTables = async () => {
    await refetch()
  }

  const [protectedSchemas] = partition(
    (schemas ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    (schema) => EXCLUDED_SCHEMAS.includes(schema?.name ?? '')
  )
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  return (
    <>
      <div
        className="pt-5 flex flex-col flex-grow space-y-4 h-full"
        style={{ maxHeight: 'calc(100vh - 48px)' }}
      >
        <SchemaSelector
          className="mx-4"
          selectedSchemaName={snap.selectedSchemaName}
          onSelectSchema={(name: string) => {
            setSearchText('')
            snap.setSelectedSchemaName(name)
          }}
          onSelectCreateSchema={() => snap.onAddSchema()}
        />

        <div className="space-y-1 mx-4">
          {!isLocked ? (
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger className="w-full">
                <Button
                  asChild
                  block
                  disabled={!canCreateTables}
                  size="tiny"
                  icon={
                    <div className="text-foreground-lighter">
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
                        'rounded bg-alternative py-1 px-2 leading-none shadow',
                        'border border-background',
                      ].join(' ')}
                    >
                      <span className="text-xs text-foreground">
                        You need additional permissions to create tables
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          ) : (
            <Alert_Shadcn_>
              <AlertTitle_Shadcn_ className="text-xs tracking-normal">
                Viewing protected schema
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_ className="text-xs">
                <p className="mb-2">
                  This schema is managed by Supabase and is read-only through the table editor
                </p>
                <Button type="default" size="tiny" onClick={() => setShowModal(true)}>
                  Learn more
                </Button>
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          )}

          {/* Table search input */}
          <div className="mb-2 block">
            <Input
              className="table-editor-search border-none"
              icon={
                isSearching ? (
                  <IconLoader
                    className="animate-spin text-foreground-lighter"
                    size={12}
                    strokeWidth={1.5}
                  />
                ) : (
                  <IconSearch className="text-foreground-lighter" size={12} strokeWidth={1.5} />
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
          <div className="mx-4 flex items-center space-x-2">
            <IconLoader className="animate-spin" size={14} strokeWidth={1.5} />
            <p className="text-sm text-foreground-light">Loading entities...</p>
          </div>
        ) : searchText.length === 0 && (entityTypes?.length ?? 0) === 0 ? (
          <div className="mx-4 space-y-1 rounded-md border border-muted bg-surface-100 py-3 px-4">
            <p className="text-xs">No entities available</p>
            <p className="text-xs text-foreground-light">
              This schema has no entities available yet
            </p>
          </div>
        ) : searchText.length > 0 && (entityTypes?.length ?? 0) === 0 ? (
          <div className="mx-4 space-y-1 rounded-md border border-muted bg-surface-100 py-3 px-4">
            <p className="text-xs">No results found</p>
            <p className="text-xs text-foreground-light">
              There are no entities that match your search
            </p>
          </div>
        ) : (
          <Menu
            type="pills"
            className="flex flex-auto px-2 space-y-6 pb-4"
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
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Tooltip.Root delayDuration={0}>
                            <Tooltip.Trigger asChild>
                              <div className="text-foreground-lighter transition-colors hover:text-foreground">
                                <IconChevronsDown size={18} strokeWidth={1} />
                              </div>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content side="bottom">
                                <Tooltip.Arrow className="radix-tooltip-arrow" />
                                <div
                                  className={[
                                    'rounded bg-alternative py-1 px-2 leading-none shadow',
                                    'border border-background',
                                  ].join(' ')}
                                >
                                  <span className="text-xs">Sort By</span>
                                </div>
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="bottom" align="start" className="w-48">
                          <DropdownMenuRadioGroup
                            value={sort}
                            onValueChange={(value: any) => setSort(value)}
                          >
                            <DropdownMenuRadioItem key="alphabetical" value="alphabetical">
                              Alphabetical
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                              key="grouped-alphabetical"
                              value="grouped-alphabetical"
                            >
                              Entity Type
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <button
                        className="cursor-pointer text-foreground-lighter transition-colors hover:text-foreground"
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

      <ProtectedSchemaModal visible={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}

export default TableEditorMenu
