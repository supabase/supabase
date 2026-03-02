import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { useDebounce, useIntersectionObserver } from '@uidotdev/usehooks'
import { Check, ChevronsUpDown } from 'lucide-react'
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
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { exposedTablesInfiniteQueryOptions } from '@/data/privileges/exposed-tables-infinite-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { pluralize } from '@/lib/helpers'

interface ExposedTableSelectorProps {
  className?: string
  disabled?: boolean
  pendingAddTableIds: number[]
  pendingRemoveTableIds: number[]
  onTogglePendingAdd: (tableId: number) => void
  onTogglePendingRemove: (tableId: number) => void
}

export const ExposedTableSelector = ({
  className,
  disabled = false,
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

  const { data: countsData, isSuccess: isCountsSuccess } = useInfiniteQuery(
    exposedTablesInfiniteQueryOptions({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    })
  )
  const grantsCount = countsData?.pages[0]?.grants_count ?? 0
  const totalCount = countsData?.pages[0]?.total_count ?? 0
  const pendingCount = pendingAddTableIds.length + pendingRemoveTableIds.length

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
                {isCountsSuccess
                  ? `${grantsCount} of ${totalCount} tables exposed${
                      pendingCount > 0
                        ? `, ${pendingCount} pending ${pluralize(pendingCount, 'change')}`
                        : ''
                    }`
                  : 'Loading tables...'}
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
                        const isExposed = table.has_grants
                          ? !pendingRemoveSet.has(table.id)
                          : pendingAddSet.has(table.id)

                        return (
                          <CommandItem_Shadcn_
                            key={table.id}
                            value={`${table.schema}.${table.name}-${table.id}`}
                            className="cursor-pointer w-full"
                            onSelect={() => {
                              if (table.has_grants) {
                                onTogglePendingRemove(table.id)
                              } else {
                                onTogglePendingAdd(table.id)
                              }
                            }}
                          >
                            <div
                              className={cn(
                                'w-full flex items-center gap-x-2',
                                !isExposed && 'ml-6'
                              )}
                            >
                              {isExposed && <Check size={16} className="text-brand shrink-0" />}
                              <span className="truncate">{`${table.schema}.${table.name}`}</span>
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
