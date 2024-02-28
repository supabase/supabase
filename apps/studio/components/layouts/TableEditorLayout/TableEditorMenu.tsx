import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { partition } from 'lodash'
import { Plus, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef, useState } from 'react'

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
  Input_Shadcn_,
  cn,
} from 'ui'

import { ProtectedSchemaModal } from 'components/interfaces/Database/ProtectedSchemaWarning'
import AlertError from 'components/ui/AlertError'
import InfiniteList from 'components/ui/InfiniteList'
import SchemaSelector from 'components/ui/SchemaSelector'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useEntityTypesQuery } from 'data/entity-types/entity-types-infinite-query'
import { useCheckPermissions, useLocalStorage } from 'hooks'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useProjectContext } from '../ProjectLayout/ProjectContext'
import EntityListItem from './EntityListItem'

const TableEditorMenu = () => {
  const router = useRouter()
  const { id } = useParams()
  const snap = useTableEditorStateSnapshot()

  const [showModal, setShowModal] = useState(false)
  const [searchText, setSearchText] = useState<string>('')
  const [sort, setSort] = useLocalStorage<'alphabetical' | 'grouped-alphabetical'>(
    'table-editor-sort',
    'alphabetical'
  )
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isSearchInputFocused, setIsSearchInputFocused] = useState(false)

  const { project } = useProjectContext()
  const {
    data,
    isLoading,
    isSuccess,
    isError,
    error,
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
      keepPreviousData: Boolean(searchText),
    }
  )

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

  refreshTables
  const [protectedSchemas] = partition(
    (schemas ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    (schema) => EXCLUDED_SCHEMAS.includes(schema?.name ?? '')
  )
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  const expandSearch = () => {
    setIsSearchOpen(!isSearchOpen)
  }

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isSearchOpen])

  const handleSearchInputFocusChange = () => {
    setIsSearchInputFocused(inputRef.current === document.activeElement)
  }

  return (
    <>
      <div
        className="pt-5 flex flex-col flex-grow gap-5 h-full"
        style={{ maxHeight: 'calc(100vh - 48px)' }}
      >
        <div className="flex flex-col gap-1">
          <SchemaSelector
            className="mx-4 h-7"
            selectedSchemaName={snap.selectedSchemaName}
            onSelectSchema={(name: string) => {
              setSearchText('')
              snap.setSelectedSchemaName(name)
              router.push(`/project/${project?.ref}/editor`)
            }}
            onSelectCreateSchema={() => snap.onAddSchema()}
          />

          <div className="grid gap-3 mx-4">
            {!isLocked ? (
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger className="w-full" asChild>
                  <Button
                    title="Create a new table"
                    name="New table"
                    block
                    disabled={!canCreateTables}
                    size="tiny"
                    icon={<Plus size={14} strokeWidth={1.5} className="text-foreground-muted" />}
                    type="default"
                    className="justify-start"
                    onClick={snap.onAddTable}
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
                <AlertTitle_Shadcn_ className="text-sm">
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
          </div>
        </div>
        <div className="flex flex-auto flex-col gap-2 pb-4 px-2">
          <div className="flex items-center px-2 w-full gap-2">
            <label htmlFor={'search-tables'} className="relative w-full">
              <span className="sr-only">Search tables</span>
              <Input_Shadcn_
                id="search-tables"
                name="search-tables"
                type="text"
                placeholder="Search tables..."
                className={cn('h-[28px] w-full', 'text-xs', 'pl-7', 'w-full')}
                onChange={(e) => {
                  setSearchText(e.target.value.trim())
                }}
                value={searchText}
                ref={(el) => {
                  inputRef.current = el
                  if (el) {
                    el.addEventListener('focus', handleSearchInputFocusChange)
                    el.addEventListener('blur', handleSearchInputFocusChange)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsSearchOpen(false)
                    setSearchText('')
                  }
                }}
              />
              <Search
                className="absolute left-2 top-2 text-foreground-muted"
                size={14}
                strokeWidth={1.5}
              />
            </label>
            <DropdownMenu>
              <Tooltip.Root delayDuration={0}>
                <DropdownMenuTrigger asChild>
                  <Tooltip.Trigger className="text-foreground-lighter transition-colors hover:text-foreground data-[state=open]:text-foreground">
                    <IconChevronsDown size={18} strokeWidth={1} />
                  </Tooltip.Trigger>
                </DropdownMenuTrigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="bottom"
                    className={[
                      'rounded bg-alternative py-1 px-2 leading-none shadow',
                      'border border-background text-xs',
                    ].join(' ')}
                  >
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    Sort By
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
              <DropdownMenuContent side="bottom" align="end" className="w-48">
                <DropdownMenuRadioGroup value={sort} onValueChange={(value: any) => setSort(value)}>
                  <DropdownMenuRadioItem key="alphabetical" value="alphabetical">
                    Alphabetical
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem key="grouped-alphabetical" value="grouped-alphabetical">
                    Entity Type
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isLoading && (
            <div className="flex flex-col px-2 gap-1 pb-4">
              <ShimmeringLoader className="w-full h-7 rounded-md" delayIndex={0} />
              <ShimmeringLoader className="w-full h-7 rounded-md" delayIndex={1} />
              <ShimmeringLoader className="w-full h-7 rounded-md" delayIndex={2} />
            </div>
          )}

          {isError && (
            <AlertError error={(error ?? null) as any} subject="Failed to retrieve tables" />
          )}

          {isSuccess && (
            <>
              {searchText.length === 0 && (entityTypes?.length ?? 0) <= 0 && (
                <div className="mx-2 my-2 space-y-1 rounded-md border border-muted bg-surface-100 py-3 px-4">
                  <p className="text-xs">No entities available</p>
                  <p className="text-xs text-foreground-light">
                    This schema has no entities available yet
                  </p>
                </div>
              )}
              {searchText.length > 0 && (entityTypes?.length ?? 0) <= 0 && (
                <div className="mx-2 my-2 space-y-1 rounded-md border border-muted bg-surface-100 py-3 px-4">
                  <p className="text-xs">No results found</p>
                  <p className="text-xs text-foreground-light">
                    Your search for "{searchText}" did not return any results
                  </p>
                </div>
              )}
              {(entityTypes?.length ?? 0) > 0 && (
                <div className="flex flex-1">
                  <InfiniteList
                    items={entityTypes}
                    ItemComponent={EntityListItem}
                    itemProps={{
                      projectRef: project?.ref!,
                      id: Number(id),
                      isLocked,
                    }}
                    getItemSize={() => 28}
                    hasNextPage={hasNextPage}
                    isLoadingNextPage={isFetchingNextPage}
                    onLoadNextPage={() => fetchNextPage()}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ProtectedSchemaModal visible={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}

export default TableEditorMenu
