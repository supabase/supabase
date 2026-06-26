import { Loader2, Search } from 'lucide-react'
import { ComponentPropsWithoutRef, forwardRef, useMemo, useState } from 'react'
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from 'ui'

import { useInfiniteTablesQuery } from '@/data/tables/tables-query'
import { useDebouncedValue } from '@/hooks/misc/useDebouncedValue'
import type { SafePostgresTable } from '@/lib/postgres-types'

type FindTableSelectorProps = Omit<ComponentPropsWithoutRef<'div'>, 'onSelect'> & {
  projectRef?: string
  connectionString?: string | null
  schema?: string
  disabled?: boolean
  size?: 'tiny' | 'small'
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (table: SafePostgresTable) => void
}

export const FindTableSelector = forwardRef<HTMLDivElement, FindTableSelectorProps>(
  (
    {
      className,
      projectRef,
      connectionString,
      schema,
      disabled = false,
      size = 'tiny',
      open,
      onOpenChange,
      onSelect,
      ...rest
    },
    ref
  ) => {
    const [search, setSearch] = useState('')
    const debouncedSearch = useDebouncedValue(search, 300)
    const nameFilter = debouncedSearch.trim() || undefined

    const { data, isFetching, hasNextPage, isFetchingNextPage, fetchNextPage } =
      useInfiniteTablesQuery(
        {
          projectRef,
          connectionString,
          schema,
          includeColumns: false,
          pageSize: 50,
          nameFilter,
        },
        { enabled: open }
      )

    const tables = useMemo(() => data?.pages.flat() ?? [], [data])

    const handleOpenChange = (next: boolean) => {
      if (!next) setSearch('')
      onOpenChange(next)
    }

    return (
      <div ref={ref} className={className} {...rest}>
        <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
          <PopoverTrigger asChild>
            <Button
              size={size}
              variant="default"
              disabled={disabled}
              data-testid="find-table-selector"
              icon={<Search size={14} strokeWidth={1.5} className="text-foreground-muted" />}
            >
              <span className="text-foreground-lighter">Find table…</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[260px] pointer-events-auto" side="bottom" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                className="text-xs"
                placeholder="Find table…"
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                {isFetching && tables.length === 0 ? (
                  <div className="flex items-center justify-center gap-x-2 py-6 text-xs text-foreground-light">
                    <Loader2 className="animate-spin" size={14} />
                    <span>Loading tables</span>
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No tables found</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea className={tables.length > 7 ? 'h-[210px]' : ''}>
                        {tables.map((table) => (
                          <CommandItem
                            key={table.id}
                            value={String(table.id)}
                            className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                            onSelect={() => {
                              onSelect(table)
                              handleOpenChange(false)
                            }}
                          >
                            <span>{table.name}</span>
                          </CommandItem>
                        ))}
                        {hasNextPage && (
                          <div className="px-2 py-1.5">
                            <Button
                              block
                              size="tiny"
                              variant="default"
                              loading={isFetchingNextPage}
                              onClick={() => fetchNextPage()}
                            >
                              Load more
                            </Button>
                          </div>
                        )}
                      </ScrollArea>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    )
  }
)

FindTableSelector.displayName = 'FindTableSelector'
