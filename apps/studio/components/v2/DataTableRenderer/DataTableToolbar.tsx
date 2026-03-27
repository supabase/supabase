'use client'

import { Search } from 'lucide-react'
import {
  cn,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

import type { FilterDefinition, FilterState } from './types'

interface DataTableToolbarProps {
  filters?: FilterDefinition[]
  filterState: FilterState
  onFilterChange: (state: FilterState) => void
  toolbarLeft?: React.ReactNode
  toolbarRight?: React.ReactNode
}

export function DataTableToolbar({
  filters,
  filterState,
  onFilterChange,
  toolbarLeft,
  toolbarRight,
}: DataTableToolbarProps) {
  const hasFilters = filters && filters.length > 0
  const hasContent = hasFilters || toolbarLeft || toolbarRight

  if (!hasContent) return null

  const updateFilter = (id: string, value: string | boolean | string[]) => {
    onFilterChange({ ...filterState, [id]: value })
  }

  return (
    <div className="flex h-10 shrink-0 items-center justify-between gap-2 overflow-x-auto border-b border-border bg-dash-sidebar px-1.5 py-1.5 dark:bg-surface-100">
      {/* Left: custom slot + filter controls */}
      <div className="flex flex-1 min-w-0 items-center gap-2">
        {toolbarLeft}
        {filters?.map((filter) => {
          const currentValue = filterState[filter.id]
          if (filter.render) {
            return (
              <div key={filter.id}>
                {filter.render({
                  value: currentValue,
                  onChange: (value) => updateFilter(filter.id, value),
                  filterState,
                })}
              </div>
            )
          }

          if (filter.type === 'search') {
            return (
              <div key={filter.id} className="relative flex items-center">
                <Search className="absolute left-2 h-3.5 w-3.5 text-foreground-lighter pointer-events-none" />
                <Input_Shadcn_
                  placeholder={filter.placeholder ?? `Filter ${filter.label.toLowerCase()}...`}
                  value={(filterState[filter.id] as string) ?? ''}
                  onChange={(e) => updateFilter(filter.id, e.target.value)}
                  size="small"
                  className={cn('h-8 bg-surface-100', 'pl-7 pr-3 text-xs', 'min-w-[180px]')}
                />
              </div>
            )
          }

          if (filter.type === 'select') {
            const value = (filterState[filter.id] as string) ?? '__all__'
            return (
              <Select_Shadcn_
                key={filter.id}
                value={value}
                onValueChange={(nextValue) =>
                  updateFilter(filter.id, nextValue === '__all__' ? '' : nextValue)
                }
              >
                <SelectTrigger_Shadcn_
                  className="h-8 min-w-[150px] bg-surface-100 text-xs"
                  size="small"
                >
                  <SelectValue_Shadcn_ placeholder={filter.placeholder ?? `All ${filter.label}`} />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  <SelectItem_Shadcn_ value="__all__">
                    {filter.placeholder ?? `All ${filter.label}`}
                  </SelectItem_Shadcn_>
                  {filter.options?.map((opt) => (
                    <SelectItem_Shadcn_ key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            )
          }

          if (filter.type === 'multi-select') {
            const selected = Array.isArray(filterState[filter.id])
              ? (filterState[filter.id] as string[])
              : []
            return (
              <DropdownMenu key={filter.id}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-8 items-center rounded-md border border-control bg-surface-100 px-2 text-xs text-foreground-light hover:text-foreground"
                  >
                    {selected.length > 0 ? `${filter.label} (${selected.length})` : filter.label}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {filter.options?.map((opt) => (
                    <DropdownMenuCheckboxItem
                      key={opt.value}
                      checked={selected.includes(opt.value)}
                      onCheckedChange={(checked) => {
                        const next = checked
                          ? [...selected, opt.value]
                          : selected.filter((v) => v !== opt.value)
                        updateFilter(filter.id, next)
                      }}
                    >
                      {opt.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }

          if (filter.type === 'toggle') {
            const isActive = Boolean(filterState[filter.id])
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => updateFilter(filter.id, !isActive)}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs transition-colors',
                  isActive
                    ? 'border-brand/50 bg-brand/10 text-brand'
                    : 'border-control bg-surface-100 text-foreground-light hover:text-foreground'
                )}
              >
                {filter.label}
              </button>
            )
          }

          return null
        })}
      </div>

      {/* Right: custom slot */}
      {toolbarRight && <div className="flex shrink-0 items-center gap-2">{toolbarRight}</div>}
    </div>
  )
}
