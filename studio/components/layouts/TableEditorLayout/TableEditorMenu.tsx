import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { partition } from 'lodash'
import { useMemo, useState } from 'react'
import {
  Alert,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  IconCheck,
  IconChevronsDown,
  IconCode,
  IconEdit,
  IconLoader,
  IconPlus,
  IconRefreshCw,
  IconSearch,
  IconX,
  Input,
  Menu,
  Modal,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
} from 'ui'

import InfiniteList from 'components/ui/InfiniteList'
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

  const [open, setOpen] = useState(false)
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

  const [protectedSchemas, openSchemas] = partition(
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
        {/* Schema selection dropdown */}
        <div className="mx-4">
          {isSchemasLoading && (
            <Button
              type="outline"
              className="w-full [&>span]:w-full"
              icon={<IconLoader className="animate-spin" size={12} />}
            >
              <div>
                <div className="w-full flex space-x-3 py-0.5">
                  <p className="text-xs text-light">Loading schemas...</p>
                </div>
              </div>
            </Button>
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
            <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
              <PopoverTrigger_Shadcn_ asChild>
                <Button
                  asChild
                  type="outline"
                  className="w-full [&>span]:w-full"
                  iconRight={
                    <IconCode
                      className="text-foreground-light rotate-90"
                      strokeWidth={2}
                      size={12}
                    />
                  }
                >
                  <div>
                    <div className="w-full flex space-x-3 py-0.5">
                      <p className="text-xs text-light">schema</p>
                      <p className="text-xs">{snap.selectedSchemaName}</p>
                    </div>
                  </div>
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_ className="p-0 w-64" side="bottom" align="start">
                <Command_Shadcn_>
                  <CommandInput_Shadcn_ placeholder="Find schema..." />
                  <CommandList_Shadcn_>
                    <CommandEmpty_Shadcn_>No schemas found</CommandEmpty_Shadcn_>
                    <CommandGroup_Shadcn_>
                      <ScrollArea className={(schemas || []).length > 7 ? 'h-[210px]' : ''}>
                        {schemas?.map((schema) => (
                          <CommandItem_Shadcn_
                            asChild
                            key={schema.id}
                            className="cursor-pointer flex items-center space-x-2 w-full"
                            onSelect={() => {
                              setSearchText('')
                              snap.setSelectedSchemaName(schema.name)
                              setOpen(false)
                            }}
                            onClick={() => {
                              setSearchText('')
                              snap.setSelectedSchemaName(schema.name)
                              setOpen(false)
                            }}
                          >
                            <div className="w-full flex items-center justify-between">
                              <p>{schema.name}</p>
                              {schema.name === snap.selectedSchemaName && (
                                <IconCheck className="text-brand" strokeWidth={2} />
                              )}
                            </div>
                          </CommandItem_Shadcn_>
                        ))}
                      </ScrollArea>
                    </CommandGroup_Shadcn_>
                    <CommandGroup_Shadcn_ className="border-t">
                      <CommandItem_Shadcn_
                        asChild
                        className="cursor-pointer flex items-center space-x-2 w-full"
                        onSelect={() => {
                          snap.onAddSchema()
                          setOpen(false)
                        }}
                        onClick={() => {
                          snap.onAddSchema()
                          setOpen(false)
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <IconPlus />
                          <p>Create a new schema</p>
                        </div>
                      </CommandItem_Shadcn_>
                    </CommandGroup_Shadcn_>
                  </CommandList_Shadcn_>
                </Command_Shadcn_>
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
          )}
        </div>

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
                        'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                        'border border-scale-200',
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
          <div className="mx-4 space-y-1 rounded-md border border-scale-400 bg-scale-300 py-3 px-4">
            <p className="text-xs">No entities available</p>
            <p className="text-xs text-foreground-light">
              This schema has no entities available yet
            </p>
          </div>
        ) : searchText.length > 0 && (entityTypes?.length ?? 0) === 0 ? (
          <div className="mx-4 space-y-1 rounded-md border border-scale-400 bg-scale-300 py-3 px-4">
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
                                    'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                                    'border border-scale-200',
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

      <Modal
        size="medium"
        visible={showModal}
        header="Schemas managed by Supabase"
        customFooter={
          <div className="flex items-center justify-end space-x-2">
            <Button type="default" onClick={() => setShowModal(false)}>
              Understood
            </Button>
          </div>
        }
        onCancel={() => setShowModal(false)}
      >
        <Modal.Content className="py-4 space-y-2">
          <p className="text-sm">
            The following schemas are managed by Supabase and are currently protected from write
            access through the Table Editor.
          </p>
          <div className="flex flex-wrap gap-1">
            {EXCLUDED_SCHEMAS.map((schema) => (
              <code key={schema} className="text-xs">
                {schema}
              </code>
            ))}
          </div>
          <p className="text-sm !mt-4">
            These schemas are critical to the functionality of your Supabase project and hence we
            highly recommend not altering them.
          </p>
          <p className="text-sm">
            You can, however, still interact with those schemas through the SQL Editor although we
            advise you only do so if you know what you are doing.
          </p>
        </Modal.Content>
      </Modal>
    </>
  )
}

export default TableEditorMenu
