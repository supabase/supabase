import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { AnimatePresence, motion } from 'framer-motion'
import { partition } from 'lodash'
import { Loader2 } from 'lucide-react'
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
  IconPlusCircle,
  IconSearch,
  IconX,
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
        className="pt-5 flex flex-col flex-grow space-y-3 h-full"
        style={{ maxHeight: 'calc(100vh - 48px)' }}
      >
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

        <div className="grid gap-3 mx-4 zans">
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
                      <IconPlusCircle size={14} strokeWidth={1.5} />
                    </div>
                  }
                  type="default"
                  className="justify-start h-7"
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
              <AlertTitle_Shadcn_ className="text-sm">Viewing protected schema</AlertTitle_Shadcn_>
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

        <div className="flex flex-auto flex-col gap-2 pb-4 px-2">
          <div className="relative">
            <div className="relative flex items-center text-foreground-lighter">
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div
                    initial={{ x: 10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1, transition: { duration: 0.2 } }}
                    exit={{ x: 20, opacity: 0, transition: { duration: 0 } }}
                    className="absolute top-0 left-2"
                  >
                    <label htmlFor={'search-tables'} className="relative">
                      <span className="sr-only">Search tables</span>
                      <input
                        id="search-tables"
                        name="search-tables"
                        type="text"
                        placeholder="Search..."
                        className={cn(
                          'bg-default text-foreground rounded-none px-1 py-1 h-5 w-44 text-sm',
                          'border-b outline-none ',
                          'border-transparent focus:border-transparent focus:ring-2'
                        )}
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
                          if (e.key === 'Backspace' && searchText.length === 0) {
                            setIsSearchOpen(false)
                          }
                        }}
                      />
                      <div
                        className={cn(
                          'absolute -bottom-1 w-full h-px bg-border transition-colors',
                          isSearchInputFocused && 'bg-border-stronger'
                        )}
                      ></div>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.button
                onClick={
                  !isSearchOpen
                    ? () => expandSearch()
                    : () => {
                        setSearchText('')
                        expandSearch()
                      }
                }
                initial={{ x: 0 }}
                animate={{ x: isSearchOpen ? 185 : 0, transition: { duration: 0 } }}
                className="px-2 py-0.5 rounded-md mt-1 transition transform hover:scale-105 focus:ring-2 "
              >
                {isSearchOpen ? (
                  isSearching ? (
                    <Loader2
                      className="w-4 h-4 animate-spin text-foreground"
                      size={15}
                      strokeWidth={1}
                    />
                  ) : (
                    <IconX className={cn('w-4  h-4 hover:text-foreground transition-colors')} />
                  )
                ) : (
                  <IconSearch className={cn('w-4 h-4 hover:text-foreground transition-colors')} />
                )}
              </motion.button>
            </div>
            <div className="flex gap-3 items-center absolute right-1 top-1.5">
              <DropdownMenu>
                <Tooltip.Root delayDuration={0}>
                  <DropdownMenuTrigger asChild>
                    <Tooltip.Trigger>
                      <IconChevronsDown
                        size={18}
                        strokeWidth={1}
                        className="text-foreground-lighter transition-colors hover:text-foreground"
                      />
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

                <DropdownMenuContent side="bottom" align="start" className="w-48">
                  <DropdownMenuRadioGroup
                    value={sort}
                    onValueChange={(value: any) => setSort(value)}
                  >
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
