import { formatDistanceToNow } from 'date-fns'
import { LoaderCircle, Search, X } from 'lucide-react'
import { ParserBuilder } from 'nuqs'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import {
  cn,
  Command_Shadcn_ as Command,
  CommandEmpty_Shadcn_ as CommandEmpty,
  CommandGroup_Shadcn_ as CommandGroup,
  CommandInput_Shadcn_ as CommandInput,
  CommandItem_Shadcn_ as CommandItem,
  CommandList_Shadcn_ as CommandList,
  CommandSeparator_Shadcn_ as CommandSeparator,
  Separator,
} from 'ui'
import type { DataTableFilterField } from '../DataTable.types'
import { formatCompactNumber } from '../DataTable.utils'
import { Kbd } from '../primitives/Kbd'
import { useDataTable } from '../providers/DataTableProvider'
import {
  columnFiltersParser,
  getFieldOptions,
  getFilterValue,
  getWordByCaretPosition,
  replaceInputByFieldType,
} from './DataTableFilters.utils'

// FIXME: there is an issue on cmdk if I wanna only set a single slider value...

interface DataTableFilterCommandProps {
  // TODO: maybe use generics for the parser
  searchParamsParser: Record<string, ParserBuilder<any>>
  placeholder?: string
}

export function DataTableFilterCommand({
  searchParamsParser,
  placeholder = 'Search data table...',
}: DataTableFilterCommandProps) {
  const { table, isLoading, filterFields: _filterFields, getFacetedUniqueValues } = useDataTable()
  const columnFilters = table.getState().columnFilters
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState<boolean>(false)
  const [currentWord, setCurrentWord] = useState<string>('')
  const filterFields = useMemo(
    () => _filterFields?.filter((i) => !i.commandDisabled),
    [_filterFields]
  )
  const columnParser = useMemo(
    () => columnFiltersParser({ searchParamsParser, filterFields }),
    [searchParamsParser, filterFields]
  )
  const [inputValue, setInputValue] = useState<string>(columnParser.serialize(columnFilters))
  const [lastSearches, setLastSearches] = useLocalStorage<
    {
      search: string
      timestamp: number
    }[]
  >('data-table-command', [])

  const trimmedInputValue = inputValue.trim()

  const queryFields = filterFields.filter(
    (x) => typeof x.value === 'string' && currentWord.includes(`${x.value}:`)
  )

  // [Joshen] Temporarily disabling as this conflicts with our current CMD K behaviour
  // useHotKey(() => setOpen((open) => !open), 'k')

  useEffect(() => {
    // TODO: we could check for ARRAY_DELIMITER or SLIDER_DELIMITER to auto-set filter when typing
    if (currentWord !== '' && open) return
    // reset
    if (currentWord !== '' && !open) setCurrentWord('')
    // avoid recursion
    if (trimmedInputValue === '' && !open) return

    const searchParams = columnParser.parse(inputValue)

    const currentFilters = table.getState().columnFilters
    const currentEnabledFilters = currentFilters.filter((filter) => {
      const field = _filterFields?.find((field) => field.value === filter.id)
      return !field?.commandDisabled
    })

    for (const key of Object.keys(searchParams)) {
      const value = searchParams[key as keyof typeof searchParams]
      table.getColumn(key)?.setFilterValue(value)
    }
    const currentFiltersToReset = currentEnabledFilters.filter((filter) => {
      return !(filter.id in searchParams)
    })
    for (const filter of currentFiltersToReset) {
      table.getColumn(filter.id)?.setFilterValue(undefined)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, open, currentWord])

  useEffect(() => {
    // REMINDER: only update the input value if the command is closed (avoids jumps while open)
    if (!open) {
      setInputValue(columnParser.serialize(columnFilters))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters, filterFields, open])

  useEffect(() => {
    if (open) {
      inputRef?.current?.focus()
    }
  }, [open])

  return (
    <div>
      <button
        type="button"
        className={cn(
          'group flex w-full items-center rounded-lg border border-input bg-background px-3 text-muted-foreground ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:bg-accent/50 hover:text-accent-foreground',
          open ? 'hidden' : 'visible'
        )}
        onClick={() => setOpen(true)}
      >
        {isLoading ? (
          <LoaderCircle className="mr-2 h-4 w-4 shrink-0 animate-spin text-muted-foreground opacity-50 group-hover:text-popover-foreground" />
        ) : (
          <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground opacity-50 group-hover:text-popover-foreground" />
        )}
        <span
          className={cn(
            'h-9 w-full max-w-sm truncate py-3 text-left text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50',
            'flex items-center md:max-w-xl lg:max-w-4xl xl:max-w-5xl',
            trimmedInputValue ? 'text-foreground' : 'text-foreground-light'
          )}
        >
          {trimmedInputValue ? inputValue : placeholder}
        </span>
        {/* [Joshen] Temporarily disabling as this conflicts with existing CMD K shortcut */}
        {/* <Kbd className="ml-auto text-muted-foreground group-hover:text-accent-foreground">
          <span className="mr-1">⌘</span>
          <span>K</span>
        </Kbd> */}
      </button>

      <Command
        className={cn(
          'overflow-visible rounded-lg border border-border shadow-md [&>div]:border-none bg',
          open ? 'visible' : 'hidden'
        )}
        filter={(value, search, keywords) =>
          getFilterValue({ value, search, keywords, currentWord })
        }
        onKeyDown={(e) => {
          // Stop arrow key navigation from propagating to parent components
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.stopPropagation()
          }
        }}
      >
        <CommandInput
          ref={inputRef}
          value={inputValue}
          onValueChange={setInputValue}
          onKeyDown={(e) => {
            if (e.key === 'Escape') inputRef?.current?.blur()
          }}
          onBlur={() => {
            setOpen(false)
            // FIXME: doesnt reflect the jumps
            // FIXME: will save non-existing searches
            // TODO: extract into function
            const search = inputValue.trim()
            if (!search) return
            const timestamp = Date.now()
            const searchIndex = lastSearches.findIndex((item) => item.search === search)
            if (searchIndex !== -1) {
              lastSearches[searchIndex].timestamp = timestamp
              setLastSearches(lastSearches)
              return
            }
            setLastSearches([...lastSearches, { search, timestamp }])
            return
          }}
          onInput={(e) => {
            const caretPosition = e.currentTarget?.selectionStart || -1
            const value = e.currentTarget?.value || ''
            const word = getWordByCaretPosition({ value, caretPosition })
            setCurrentWord(word)
          }}
          placeholder={placeholder}
          className="text-foreground"
        />
        <div className="relative">
          <div className="absolute top-2 z-50 w-full overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            {/* default height is 300px but in case of more, we'd like to tease the user */}
            <CommandList className="max-h-[310px] bg-surface-100">
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Filter">
                {filterFields.map((field) => {
                  if (typeof field.value !== 'string') return null
                  if (inputValue.includes(`${field.value}:`)) return null
                  // TBD: should we handle this in the component?
                  return (
                    <CommandItem
                      key={field.value}
                      value={field.value}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onSelect={(value) => {
                        setInputValue((prev) => {
                          if (currentWord.trim() === '') {
                            const input = `${prev}${value}`
                            return `${input}:`
                          }
                          // lots of cheat
                          const isStarting = currentWord === prev
                          const prefix = isStarting ? '' : ' '
                          const input = prev.replace(`${prefix}${currentWord}`, `${prefix}${value}`)
                          return `${input}:`
                        })
                        setCurrentWord(`${value}:`)
                      }}
                      className="group"
                    >
                      {field.label}
                      <CommandItemSuggestions field={field} />
                    </CommandItem>
                  )
                })}
              </CommandGroup>

              <CommandSeparator />

              {queryFields.length > 0 && (
                <>
                  <CommandGroup heading="Query">
                    {queryFields.map((field) => {
                      const column = table.getColumn(field.value)
                      const facetedValue =
                        getFacetedUniqueValues?.(table, field.value) ||
                        column?.getFacetedUniqueValues()

                      const options = getFieldOptions({ field })

                      return options.map((optionValue) => {
                        return (
                          <CommandItem
                            key={`${String(field.value)}:${optionValue}`}
                            value={`${String(field.value)}:${optionValue}`}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                            onSelect={(value) => {
                              setInputValue((prev) =>
                                replaceInputByFieldType({
                                  prev,
                                  currentWord,
                                  optionValue,
                                  value,
                                  field,
                                })
                              )
                              setCurrentWord('')
                            }}
                          >
                            {`${optionValue}`}
                            {facetedValue?.has(optionValue) ? (
                              <span className="ml-auto font-mono text-muted-foreground">
                                {formatCompactNumber(facetedValue.get(optionValue) || 0)}
                              </span>
                            ) : null}
                          </CommandItem>
                        )
                      })
                    })}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {lastSearches.length > 0 && (
                <CommandGroup heading="Suggestions">
                  {lastSearches
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 5)
                    .map((item) => {
                      return (
                        <CommandItem
                          key={`suggestion:${item.search}`}
                          value={`suggestion:${item.search}`}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                          onSelect={(value) => {
                            const search = value.replace('suggestion:', '')
                            setInputValue(`${search} `)
                            setCurrentWord('')
                          }}
                          className="group"
                        >
                          {item.search}
                          <span className="ml-auto truncate text-muted-foreground/80 group-aria-[selected=true]:block">
                            {formatDistanceToNow(item.timestamp, {
                              addSuffix: true,
                            })}
                          </span>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              // TODO: extract into function
                              setLastSearches(lastSearches.filter((i) => i.search !== item.search))
                            }}
                            className="ml-1 hidden rounded-md p-0.5 hover:bg-background group-aria-[selected=true]:block"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </CommandItem>
                      )
                    })}
                </CommandGroup>
              )}
            </CommandList>

            <div className="bg-surface-100 flex flex-wrap justify-between gap-3 border-t bg-accent/50 px-2 py-1.5 text-sm text-accent-foreground">
              <div className="flex flex-wrap gap-3">
                <span>
                  Use <Kbd>↑</Kbd> <Kbd>↓</Kbd> to navigate
                </span>
                <span>
                  <Kbd>Enter</Kbd> to query
                </span>
                <span>
                  <Kbd>Esc</Kbd> to close
                </span>
                <Separator orientation="vertical" className="my-auto h-3" />
                <span>
                  Union: <Kbd>regions:a,b</Kbd>
                </span>
                <span>
                  Range: <Kbd>p95:59-340</Kbd>
                </span>
              </div>
              {lastSearches.length ? (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-accent-foreground"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={() => setLastSearches([])}
                >
                  Clear suggestions
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </Command>
    </div>
  )
}

function CommandItemSuggestions<TData>({ field }: { field: DataTableFilterField<TData> }) {
  const { table, getFacetedMinMaxValues, getFacetedUniqueValues } = useDataTable()
  const value = field.value as string
  const className = 'ml-2 hidden truncate text-foreground-lighter group-aria-[selected=true]:block'

  switch (field.type) {
    case 'checkbox': {
      return (
        <span className={cn(className)}>
          {field.options && field.options.length > 0
            ? field.options.map(({ value }) => `[${value}]`).join(' ')
            : getFacetedUniqueValues
              ? Array.from(getFacetedUniqueValues(table, value)?.keys() || [])
                  .map((value) => `[${value}]`)
                  .join(' ')
              : null}
        </span>
      )
    }
    case 'slider': {
      const [min, max] = getFacetedMinMaxValues?.(table, value) || [field.min, field.max]
      return (
        <span className={cn(className)}>
          [{min} - {max}]
        </span>
      )
    }
    case 'input': {
      return <span className={cn(className)}>[{`${String(field.value)}`} input]</span>
    }
    default: {
      return null
    }
  }
}
