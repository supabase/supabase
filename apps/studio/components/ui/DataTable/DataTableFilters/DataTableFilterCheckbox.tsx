import { Search } from 'lucide-react'
import { useState } from 'react'

import { Checkbox_Shadcn_ as Checkbox, cn, Label_Shadcn_ as Label, Skeleton } from 'ui'
import type { DataTableCheckboxFilterField } from '../DataTable.types'
import { formatCompactNumber } from '../DataTable.utils'
import { InputWithAddons } from '../primitives/InputWithAddons'
import { useDataTable } from '../providers/DataTableProvider'
import { DataTableFilterCheckboxLoader } from './DataTableFilterCheckboxLoader'

export function DataTableFilterCheckbox<TData>({
  value: _value,
  options,
  component,
}: DataTableCheckboxFilterField<TData>) {
  const value = _value as string
  const [inputValue, setInputValue] = useState('')
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
      <div className="flex items-center justify-center px-2 py-4 text-center border border-border rounded">
        <p className="text-xs text-foreground-light">No options available</p>
      </div>
    )

  return (
    <div className="grid gap-2">
      {options && options.length > 4 ? (
        <InputWithAddons
          placeholder="Search"
          leading={<Search size={14} className="text-foreground-lighter" />}
          containerClassName="h-8 rounded"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      ) : null}
      {/* FIXME: due to the added max-h and overflow-y-auto, the hover state and border is laying on top of the scroll bar */}
      <div className="max-h-[200px] overflow-y-auto rounded border border-border empty:border-none">
        {filterOptions.length === 0 && inputValue !== '' ? (
          <div className="flex items-center justify-center px-2 py-4 text-center">
            <div className="space-y-0.5">
              <p className="text-xs text-foreground">No results found</p>
              <p className="text-xs text-foreground-lighter">Try a different search term</p>
            </div>
          </div>
        ) : (
          filterOptions
            // TODO: we shoudn't sort the options here, instead filterOptions should be sorted by default
            // .sort((a, b) => a.label.localeCompare(b.label))
            .map((option, index) => {
              const checked = filters.includes(option.value)

              return (
                <div
                  key={String(option.value)}
                  className={cn(
                    'group relative flex items-center space-x-2 px-2 py-2 hover:bg-accent/50',
                    index !== filterOptions.length - 1 ? 'border-b' : undefined
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
                    className="flex w-full items-center justify-between gap-2 text-foreground/70 group-hover:text-accent-foreground text-[0.8rem] min-w-0"
                  >
                    <div className="flex-1 min-w-0 overflow-hidden">
                      {Component ? (
                        <Component {...option} />
                      ) : (
                        <span className="truncate font-normal block">{option.label}</span>
                      )}
                    </div>
                    <span className="flex-shrink-0 flex items-center justify-center font-mono text-xs">
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
                      onClick={() => column?.setFilterValue([option.value])}
                      className={cn(
                        'absolute inset-y-0 right-0 hidden font-normal text-muted-foreground backdrop-blur-sm hover:text-foreground group-hover:block',
                        'rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                      )}
                    >
                      <span className="px-2">only</span>
                    </button>
                  </Label>
                </div>
              )
            })
        )}
      </div>
    </div>
  )
}
