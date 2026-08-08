import { Minus, Plus, Search } from 'lucide-react'
import { useQueryStates } from 'nuqs'
import { useState } from 'react'
import { Checkbox, cn, Label, Skeleton } from 'ui'

import type { DataTableCheckboxFilterField } from '../DataTable.types'
import { formatCompactNumber } from '../DataTable.utils'
import { InputWithAddons } from '../primitives/InputWithAddons'
import { useDataTable } from '../providers/DataTableProvider'
import { DataTableFilterCheckboxLoader } from './DataTableFilterCheckboxLoader'
import { SEARCH_PARAMS_PARSER } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.constants'

export function DataTableFilterCheckbox<TData>({
  value: _value,
  options,
  component,
}: DataTableCheckboxFilterField<TData>) {
  const value = _value as string
  const [inputValue, setInputValue] = useState('')
  const [expandedOptions, setExpandedOptions] = useState<Set<string>>(new Set())
  const [searchParams, setSearchParams] = useQueryStates(SEARCH_PARAMS_PARSER)

  // Nested options map 1:1 to a boolean search param via their `value`
  // (e.g. `show_connection_logs`), so they can be read/written generically.
  const getBooleanParam = (key: string) => Boolean(searchParams[key as keyof typeof searchParams])
  const setBooleanParam = (key: string, val: boolean) =>
    setSearchParams({ [key]: val } as Partial<typeof searchParams>)

  const toggleExpanded = (key: string) =>
    setExpandedOptions((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  const { table, columnFilters, isLoading, isLoadingCounts, getFacetedUniqueValues } =
    useDataTable()

  const column = table.getColumn(value)
  // REMINDER: avoid using column?.getFilterValue()
  const filterValue = columnFilters.find((i) => i.id === value)?.value
  const facetedValue = getFacetedUniqueValues?.(table, value) || column?.getFacetedUniqueValues()

  const Component = component

  // filter out the options based on the input value
  const filterOptions =
    options?.filter(
      (option) => inputValue === '' || option.label.toLowerCase().includes(inputValue.toLowerCase())
    ) || []

  // CHECK: it could be filterValue or searchValue
  const filters = filterValue ? (Array.isArray(filterValue) ? filterValue : [filterValue]) : []

  // REMINDER: if no options are defined, while fetching data, we should show a skeleton
  if (isLoading && !filterOptions?.length) return <DataTableFilterCheckboxLoader />

  // Show empty state when no original options are available (not due to search filtering)
  if (!options?.length)
    return (
      <div className="flex items-center justify-center px-2 py-4 text-center border border-border rounded-sm">
        <p className="text-xs text-foreground-light">No options available</p>
      </div>
    )

  return (
    <div className="grid gap-2">
      {options && options.length > 4 ? (
        <InputWithAddons
          placeholder="Search"
          leading={<Search size={14} className="text-foreground-lighter" />}
          containerClassName="h-8 rounded-sm"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      ) : null}
      <div className="max-h-[215px] overflow-y-auto rounded-sm border border-border empty:border-none">
        {filterOptions.length === 0 && inputValue !== '' ? (
          <div className="flex items-center justify-center px-2 py-4 text-center">
            <div className="space-y-0.5">
              <p className="text-xs text-foreground">No results found</p>
              <p className="text-xs text-foreground-lighter">Try a different search term</p>
            </div>
          </div>
        ) : (
          filterOptions.map((option, index) => {
            const checked = filters.includes(option.value)
            const optionKey = String(option.value)
            const hasNested = (option.options ?? []).length > 0
            const isExpanded = expandedOptions.has(optionKey)

            return (
              <div
                key={String(option.value)}
                className={cn(index !== filterOptions.length - 1 ? 'border-b' : undefined)}
              >
                <div
                  className={cn(
                    'group relative flex items-center space-x-2 pl-2 hover:bg-accent/50'
                  )}
                >
                  <Checkbox
                    id={`${value}-${option.value}`}
                    checked={checked}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(filters || []), option.value]
                        : filters?.filter((value) => option.value !== value)
                      column?.setFilterValue(newValue?.length ? newValue : undefined)
                    }}
                  />
                  <Label
                    htmlFor={`${value}-${option.value}`}
                    className="py-2 relative flex w-full items-center justify-between gap-2 text-foreground/70 group-hover:text-accent-foreground text-[0.8rem] min-w-0"
                  >
                    <div className="flex-1 min-w-0 overflow-hidden">
                      {Component ? (
                        <Component {...option} />
                      ) : (
                        <span className="truncate font-normal block">{option.label}</span>
                      )}
                    </div>
                    {hasNested && (
                      <button
                        type="button"
                        tabIndex={0}
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        aria-expanded={isExpanded}
                        onClick={() => toggleExpanded(optionKey)}
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-foreground-lighter',
                          'hover:bg-selection hover:text-foreground',
                          'absolute top-2 right-10'
                        )}
                      >
                        {isExpanded ? <Minus size={12} /> : <Plus size={12} />}
                      </button>
                    )}
                    <span className="shrink-0 flex items-center justify-center font-mono text-xs pr-2 group-hover:opacity-0">
                      {isLoadingCounts ? (
                        <Skeleton className="h-4 w-4" />
                      ) : facetedValue?.has(option.value) ? (
                        formatCompactNumber(facetedValue.get(option.value) || 0)
                      ) : ['log_type', 'method', 'level'].includes(value) ? (
                        '0'
                      ) : null}
                    </span>

                    <button
                      type="button"
                      tabIndex={0}
                      onClick={() => column?.setFilterValue([option.value])}
                      className={cn(
                        'text-xs text-muted-foreground hover:text-foreground',
                        'absolute inset-y-0 right-0 hidden bg-surface-100 group-hover:flex group-focus-within:flex items-center cursor-pointer',
                        'ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                      )}
                    >
                      <span className="pl-1 pr-2">Only</span>
                    </button>
                  </Label>
                </div>

                {hasNested && isExpanded && (
                  <div className="pb-1">
                    {option.options?.map((optionNested, nestedIndex) => {
                      const nestedChecked = getBooleanParam(optionNested.value)
                      const isLastNested = nestedIndex === (option.options?.length ?? 0) - 1

                      return (
                        <div
                          key={optionNested.value}
                          className="group/nested relative flex items-stretch"
                        >
                          <div aria-hidden className="relative w-7 shrink-0">
                            {isLastNested ? (
                              <span
                                className={cn(
                                  'absolute left-[0.95rem] w-3 rounded-bl-sm border-b border-l border-border',
                                  nestedIndex === 0
                                    ? 'top-[-8px] h-[calc(60%+8px)]'
                                    : cn(
                                        'top-0',
                                        option.options?.length === 1 ? 'h-[60%]' : 'h-1/2'
                                      )
                                )}
                              />
                            ) : (
                              <>
                                <span
                                  className={cn(
                                    'absolute left-[0.95rem] w-px bg-border',
                                    nestedIndex === 0
                                      ? 'top-[-8px] h-[calc(100%+8px)]'
                                      : 'top-0 h-full'
                                  )}
                                />
                                <span className="absolute left-4 top-[55%] h-px w-3 bg-border" />
                              </>
                            )}
                          </div>
                          <div className="flex flex-1 items-center gap-x-2 rounded-sm py-1 pr-2 hover:bg-accent/50 min-w-0">
                            <Checkbox
                              id={`${value}-${optionNested.value}`}
                              checked={nestedChecked}
                              onCheckedChange={(isChecked) =>
                                setBooleanParam(optionNested.value, Boolean(isChecked))
                              }
                            />
                            <Label
                              htmlFor={`${value}-${optionNested.value}`}
                              className="flex w-full cursor-pointer items-center text-[0.8rem] font-normal text-foreground/70 group-hover/nested:text-accent-foreground min-w-0"
                            >
                              <span className="truncate text-xs">{optionNested.label}</span>
                            </Label>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
