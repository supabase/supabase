import { keepPreviousData } from '@tanstack/react-query'
import { useDebounce, useIntersectionObserver } from '@uidotdev/usehooks'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn, Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'ui'

import type { ResourcePickerRenderProps } from './SecondLevelNav.Layout'
import { usePaginatedBucketsQuery } from '@/data/storage/buckets-query'

type StorageResourceListProps = ResourcePickerRenderProps & {
  projectRef?: string
}

const SEARCH_DEBOUNCE_MS = 400

const useSearchQuery = () => {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS)
  const searchQuery = search.length === 0 ? undefined : debouncedSearch

  return {
    rawQuery: search,
    query: searchQuery,
    setSearch,
  }
}

type UseInfiniteLoadingBucketsParams = {
  projectRef?: string
  searchQuery?: string
  rawQuery: string
}

const useInfiniteLoadingBuckets = ({
  projectRef,
  searchQuery,
  rawQuery,
}: UseInfiniteLoadingBucketsParams) => {
  const { data, isFetching, hasNextPage, fetchNextPage, isFetchingNextPage } =
    usePaginatedBucketsQuery(
      { projectRef, search: searchQuery },
      {
        enabled: !!projectRef,
        placeholderData: rawQuery.length === 0 ? keepPreviousData : undefined,
      }
    )
  const buckets = useMemo(() => data?.pages.flatMap((page) => page) ?? [], [data])

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [sentinelRef, entry] = useIntersectionObserver({
    threshold: 1,
    root: scrollContainerRef.current,
    rootMargin: '0px',
  })

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage && !isFetching) {
      fetchNextPage()
    }
  }, [entry?.isIntersecting, fetchNextPage, hasNextPage, isFetching])

  return {
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    buckets,
    scrollContainerRef,
    sentinelRef,
  }
}

export const StorageResourceList = ({
  projectRef,
  selectedResource,
  onSelect,
  closePopover,
}: StorageResourceListProps) => {
  const { rawQuery, query: searchQuery, setSearch } = useSearchQuery()

  const { isFetching, hasNextPage, isFetchingNextPage, buckets, scrollContainerRef, sentinelRef } =
    useInfiniteLoadingBuckets({
      projectRef,
      searchQuery,
      rawQuery,
    })

  const handleSelect = (value: string) => {
    onSelect(value)
    closePopover()
  }

  const showEmptyState = !isFetching && buckets.length === 0
  const emptyMessage =
    rawQuery.length > 0 ? 'No buckets found for this search' : 'No buckets available'

  return (
    <Command shouldFilter={false}>
      <CommandInput
        showResetIcon
        value={rawQuery}
        onValueChange={setSearch}
        placeholder="Search buckets..."
        handleReset={() => setSearch('')}
      />
      <CommandList>
        <CommandEmpty hidden={!showEmptyState} className="py-3 text-sm text-foreground-light">
          {emptyMessage}
        </CommandEmpty>
        <CommandGroup>
          {isFetching && buckets.length === 0 ? (
            <div className="px-4 py-3 text-sm text-foreground-light">Loading buckets...</div>
          ) : (
            <div ref={scrollContainerRef} className="max-h-72 min-h-[150px] overflow-y-auto">
              {buckets.map((bucket) => {
                const isActive = bucket.name === selectedResource
                return (
                  <CommandItem
                    key={bucket.id}
                    value={bucket.name}
                    className={cn(
                      'cursor-pointer px-4',
                      isActive ? 'text-foreground bg-selection' : 'text-foreground-light'
                    )}
                    onSelect={() => handleSelect(bucket.name)}
                  >
                    <p className="truncate">{bucket.name}</p>
                  </CommandItem>
                )
              })}
              {hasNextPage && <div ref={sentinelRef} className="h-2 w-full" />}
            </div>
          )}
        </CommandGroup>
        {isFetchingNextPage && (
          <div className="px-4 py-2 text-sm text-foreground-light">Loading more buckets...</div>
        )}
      </CommandList>
    </Command>
  )
}
