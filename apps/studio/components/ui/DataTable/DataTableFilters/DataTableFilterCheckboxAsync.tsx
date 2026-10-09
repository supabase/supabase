import { Loader2, Search } from 'lucide-react'
import { Checkbox, cn, Label } from 'ui'

import type { DataTableCheckboxFilterField } from '../DataTable.types'
import { formatCompactNumber } from '../DataTable.utils'
import { InputWithAddons } from '../primitives/InputWithAddons'
import { useUnifiedLogsPathnameOptions } from '@/components/interfaces/UnifiedLogs/useUnifiedLogsPathnameOptions'
import { AlertError } from '@/components/ui/AlertError'
import { onSearchInputEscape } from '@/lib/keyboard'

export function DataTableFilterCheckboxAsync<TData>({
  value: _value,
  options,
  component: Component,
}: DataTableCheckboxFilterField<TData>) {
  const value = _value as string
  const {
    column,
    error,
    filterOptions,
    inputValue,
    isError,
    isFetching,
    isLoading,
    projectRef,
    selectedValues,
    setInputValue,
  } = useUnifiedLogsPathnameOptions(value, options)

  return (
    <div className="grid gap-2">
      <InputWithAddons
        placeholder="Search"
        leading={<Search size={14} className="text-foreground-lighter" />}
        containerClassName="h-8 rounded-sm"
        value={inputValue}
        trailing={isFetching ? <Loader2 size={12} className="animate-spin" /> : undefined}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={onSearchInputEscape(inputValue, setInputValue)}
      />

      {isError && (
        <AlertError error={error} subject="Failed to retrieve pathnames" projectRef={projectRef} />
      )}

      <div className="max-h-[215px] overflow-y-auto rounded-sm border border-border empty:border-none">
        {filterOptions.length === 0 && isLoading ? (
          <div className="flex items-center justify-center px-2 py-3 text-center">
            <Loader2 size={14} className="animate-spin" />
          </div>
        ) : filterOptions.length === 0 && !isError ? (
          <div className="flex items-center justify-center px-2 py-3 text-center">
            <div className="space-y-0.5">
              <p className="text-xs text-foreground">No results found</p>
              <p className="text-xs text-foreground-lighter">Try a different search term</p>
            </div>
          </div>
        ) : (
          filterOptions.map((option, index) => {
            const checked = selectedValues.includes(option.value)

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
                    const newValues = checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter((value) => option.value !== value)
                    column?.setFilterValue(
                      newValues.length ? { operator: '=', values: newValues } : undefined
                    )
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
                  <span className="shrink-0 flex items-center justify-center font-mono text-xs group-hover:opacity-0">
                    {'count' in option ? formatCompactNumber(option.count) : null}
                  </span>
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={() =>
                      column?.setFilterValue({ operator: '=', values: [option.value] })
                    }
                    className={cn(
                      'text-xs text-muted-foreground hover:text-foreground',
                      'absolute inset-y-0 right-0 hidden bg-surface-100 group-hover:flex group-focus-within:flex items-center cursor-pointer',
                      'focus-ring'
                    )}
                  >
                    <span className="px-2">Only</span>
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
