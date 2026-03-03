import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useDebounce, useIntersectionObserver } from '@uidotdev/usehooks'
import { Check, ChevronsUpDown, CircleAlert, Info } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  cn,
  Command_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { exposedTableCountsQueryOptions } from '@/data/privileges/exposed-table-counts-query'
import { exposedTablesInfiniteQueryOptions } from '@/data/privileges/exposed-tables-infinite-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { pluralize } from '@/lib/helpers'

interface ExposedTableSelectorProps {
  className?: string
  disabled?: boolean
  selectedSchemas: string[]
  pendingAddTableIds: number[]
  pendingRemoveTableIds: number[]
  onTogglePendingAdd: (tableId: number) => void
  onTogglePendingRemove: (tableId: number) => void
}

export const ExposedTableSelector = ({
  className,
  disabled = false,
  selectedSchemas,
  pendingAddTableIds,
  pendingRemoveTableIds,
  onTogglePendingAdd,
  onTogglePendingRemove,
}: ExposedTableSelectorProps) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { data: project } = useSelectedProjectQuery()

  const scrollRootRef = useRef<HTMLDivElement | null>(null)
  const [sentinelRef, entry] = useIntersectionObserver({
    root: scrollRootRef.current,
    threshold: 0,
    rootMargin: '0px',
  })

  const {
    data: countsData,
    isPending: isCountsPending,
  } = useQuery({
    ...exposedTableCountsQueryOptions({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      selectedSchemas,
    }),
    placeholderData: keepPreviousData,
  })
  const pendingCount = pendingAddTableIds.length + pendingRemoveTableIds.length

  const totalCount = countsData?.total_count ?? 0
  const grantsCount = countsData?.grants_count ?? 0

  const { data, isPending, isError, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      ...exposedTablesInfiniteQueryOptions({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        search: search.length === 0 ? undefined : debouncedSearch || undefined,
      }),
      placeholderData: search.length > 0 ? keepPreviousData : undefined,
    })

  const tables = useMemo(() => data?.pages.flatMap((page) => page.tables) ?? [], [data?.pages])

  const pendingAddSet = useMemo(() => new Set(pendingAddTableIds), [pendingAddTableIds])
  const pendingRemoveSet = useMemo(() => new Set(pendingRemoveTableIds), [pendingRemoveTableIds])

  useEffect(() => {
    if (!isPending && !isFetching && entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [entry?.isIntersecting, hasNextPage, isFetching, isFetchingNextPage, isPending, fetchNextPage])

  return (
    <div className={className}>
      <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            size="small"
            disabled={disabled}
            type="default"
            className="w-full [&>span]:w-full !pr-1 space-x-1"
            iconRight={
              <ChevronsUpDown className="text-foreground-muted" strokeWidth={2} size={14} />
            }
          >
            <div className="w-full flex gap-1">
              <p className="text-foreground-lighter">
                {isCountsPending
                  ? 'Loading tables...'
                  : `${grantsCount} of ${totalCount} tables exposed${
                      pendingCount > 0
                        ? `, ${pendingCount} pending ${pluralize(pendingCount, 'change')}`
                        : ''
                    }`}
              </p>
            </div>
          </Button>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_
          className="p-0 min-w-[200px] pointer-events-auto"
          side="bottom"
          align="start"
          sameWidthAsTrigger
        >
          <Command_Shadcn_ shouldFilter={false}>
            <CommandInput_Shadcn_
              className="text-xs"
              placeholder="Find table..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList_Shadcn_>
              <CommandGroup_Shadcn_>
                {isPending ? (
                  <>
                    <div className="px-2 py-1">
                      <ShimmeringLoader className="py-2" />
                    </div>
                    <div className="px-2 py-1 w-4/5">
                      <ShimmeringLoader className="py-2" />
                    </div>
                  </>
                ) : isError ? (
                  <div className="flex items-center py-3 justify-center">
                    <p className="text-xs text-foreground-lighter">Failed to retrieve tables</p>
                  </div>
                ) : (
                  <>
                    {search.length > 0 && tables.length === 0 && (
                      <p className="text-xs text-center text-foreground-lighter py-3">
                        No tables found
                      </p>
                    )}
                    <ScrollArea
                      ref={scrollRootRef}
                      className={tables.length > 7 ? 'h-[210px]' : ''}
                    >
                      {tables.map((table) => {
                        const isSchemaExposed = selectedSchemas.includes(table.schema)
                        const hasPendingAdd = pendingAddSet.has(table.id)
                        const hasPendingRemove = pendingRemoveSet.has(table.id)

                        const isCustomTable = table.status === 'custom'
                        const isGranted = table.status === 'granted'

                        const isCustomNeutral = isCustomTable && !hasPendingAdd && !hasPendingRemove
                        const isExposed =
                          isSchemaExposed &&
                          (isCustomTable
                            ? hasPendingAdd
                            : isGranted
                              ? !hasPendingRemove
                              : hasPendingAdd)

                        const customGrantsTooltip = getCustomGrantsTooltip({
                          hasPendingAdd,
                          hasPendingRemove,
                        })

                        return (
                          <CommandItem_Shadcn_
                            key={table.id}
                            value={`${table.schema}.${table.name}-${table.id}`}
                            className={cn('w-full', isSchemaExposed ? 'cursor-pointer' : 'opacity-50 !cursor-not-allowed')}
                            onSelect={() => {
                              if (!isSchemaExposed) return

                              if (isCustomTable) {
                                if (hasPendingAdd) {
                                  onTogglePendingAdd(table.id)
                                  onTogglePendingRemove(table.id)
                                } else if (hasPendingRemove) {
                                  onTogglePendingRemove(table.id)
                                  onTogglePendingAdd(table.id)
                                } else {
                                  onTogglePendingAdd(table.id)
                                }
                                return
                              }

                              if (isGranted) {
                                onTogglePendingRemove(table.id)
                              } else {
                                onTogglePendingAdd(table.id)
                              }
                            }}
                          >
                            <div className="w-full flex items-center gap-x-2">
                              <div className="w-4 shrink-0 flex items-center justify-center">
                                {isExposed && <Check size={16} className="text-brand shrink-0" />}
                              </div>
                              <span
                                className={cn(
                                  'truncate',
                                  (!isSchemaExposed || isCustomNeutral) && 'text-foreground-muted',
                                  isCustomNeutral && isSchemaExposed && 'text-warning'
                                )}
                              >
                                {`${table.schema}.${table.name}`}
                              </span>
                              
                              <div className="ml-auto flex items-center gap-x-2">
                                {isCustomTable && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div
                                        className={cn(
                                          'shrink-0 flex items-center justify-center hover:text-foreground-light',
                                          isCustomNeutral && isSchemaExposed
                                            ? 'text-warning'
                                            : 'text-foreground-muted'
                                        )}
                                      >
                                        <CircleAlert size={14} />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-[320px] text-xs pointer-events-none">
                                      {customGrantsTooltip}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                {!isSchemaExposed && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        tabIndex={-1}
                                        aria-label="Schema not exposed"
                                        className="inline-flex items-center text-foreground-muted hover:text-foreground-light"
                                      >
                                        <Info size={14} />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-[320px] text-xs">
                                      {`The schema "${table.schema}" must be exposed before enabling this table.`}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          </CommandItem_Shadcn_>
                        )
                      })}
                      <div ref={sentinelRef} className="h-1 -mt-1" />
                      {hasNextPage && (
                        <div className="px-2 py-1">
                          <ShimmeringLoader className="py-2" />
                        </div>
                      )}
                    </ScrollArea>
                  </>
                )}
              </CommandGroup_Shadcn_>
            </CommandList_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </div>
  )
}

const getCustomGrantsTooltip = ({
  hasPendingAdd,
  hasPendingRemove,
}: {
  hasPendingAdd: boolean
  hasPendingRemove: boolean
}) => {
  if (hasPendingAdd) {
    return 'This table has custom grants. Saving will override them with standard Data API grants for anon, authenticated, and service_role. Select again to revoke all grants instead.'
  }

  if (hasPendingRemove) {
    return 'This table has custom grants. Saving will revoke all grants for anon, authenticated, and service_role. Select again to override with standard Data API grants instead.'
  }

  return 'This table has custom grants. Select it to override with standard Data API grants for anon, authenticated, and service_role.'
}
