import { ChevronDown, LayoutGrid, List, Search } from 'lucide-react'
import type { Ref } from 'react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

import {
  formatCategoryLabel,
  getCategoryIcon,
  INTEGRATION_TYPES,
  MARKETPLACE_SOURCES,
  type MarketplaceIntegrationType,
  type MarketplaceSource,
} from './Marketplace.constants'
import { onSearchInputEscape } from '@/lib/keyboard'

export type ViewMode = 'list' | 'grid'

interface MarketplaceFilterBarProps {
  resultCount: number
  search: string
  searchInputRef?: Ref<HTMLInputElement>
  onSearchChange: (value: string) => void
  category: string | null
  onCategoryChange: (value: string | null) => void
  categoryOptions: Array<{ slug: string; name: string }>
  categoryCounts?: Record<string, number>
  type: MarketplaceIntegrationType | null
  onTypeChange: (value: MarketplaceIntegrationType | null) => void
  typeCounts?: Record<MarketplaceIntegrationType, number>
  source: MarketplaceSource | null
  onSourceChange: (value: MarketplaceSource | null) => void
  sourceCounts?: Record<MarketplaceSource, number>
  viewMode: ViewMode
  onViewModeChange: (value: ViewMode) => void
  hasActiveFilter: boolean
  onClearFilters: () => void
}

const ALL = '__all__'

const triggerCls = 'inline-flex flex-row gap-2'

export const MarketplaceFilterBar = ({
  resultCount,
  search,
  searchInputRef,
  onSearchChange,
  category,
  onCategoryChange,
  categoryOptions,
  categoryCounts,
  type,
  onTypeChange,
  typeCounts,
  source,
  onSourceChange,
  sourceCounts,
  viewMode,
  onViewModeChange,
  hasActiveFilter,
  onClearFilters,
}: MarketplaceFilterBarProps) => {
  const showClear = hasActiveFilter || search.length > 0
  const categoryLabel = category ? formatCategoryLabel(category, categoryOptions) : 'All'
  const typeLabel = type ? (INTEGRATION_TYPES.find((t) => t.key === type)?.label ?? type) : 'All'
  const sourceLabel = source
    ? (MARKETPLACE_SOURCES.find((s) => s.key === source)?.label ?? source)
    : 'All'

  return (
    <div
      className={cn(
        'sticky top-0 z-5 -mx-6 flex flex-wrap items-center gap-2 px-6 py-3 xl:-mx-10 xl:px-10',
        'bg-dash-sidebar/95 backdrop-blur',
        showClear ? 'border-b border-muted' : 'border-b border-transparent'
      )}
    >
      <Input
        ref={searchInputRef}
        value={search}
        size="tiny"
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={onSearchInputEscape(search, onSearchChange)}
        placeholder={`Search integration${resultCount === 1 ? '' : 's'}…`}
        icon={<Search size={14} />}
        containerClassName="w-full min-w-40 max-w-60 grow flex-1"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="default" iconRight={<ChevronDown />} className={triggerCls}>
            <span className="truncate">Category: {categoryLabel}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup
            value={category ?? ALL}
            onValueChange={(v) => onCategoryChange(v === ALL ? null : v)}
          >
            <DropdownMenuItem onClick={() => onCategoryChange(null)}>
              All categories
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {categoryOptions
              .filter((c) => !categoryCounts || categoryCounts[c.slug] > 0)
              .map((c) => {
                const Icon = getCategoryIcon(c.slug)
                return (
                  <DropdownMenuItem
                    key={c.slug}
                    onClick={() => onCategoryChange(c.slug)}
                    className="flex items-center gap-2"
                  >
                    <Icon size={13} className="text-foreground-lighter" />
                    <span className="flex-1">{c.name}</span>
                    {categoryCounts?.[c.slug] !== undefined && (
                      <span className="font-mono text-xs text-foreground-lighter">
                        {categoryCounts[c.slug]}
                      </span>
                    )}
                  </DropdownMenuItem>
                )
              })}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="default" iconRight={<ChevronDown />} className={triggerCls}>
            <span className="truncate">Type: {typeLabel}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup
            value={type ?? ALL}
            onValueChange={(v) =>
              onTypeChange(v === ALL ? null : (v as MarketplaceIntegrationType))
            }
          >
            <DropdownMenuItem onClick={() => onTypeChange(null)}>All Types</DropdownMenuItem>
            <DropdownMenuSeparator />
            {INTEGRATION_TYPES.map(({ key, label, icon: Icon }) => (
              <DropdownMenuItem
                key={key}
                onClick={() => onTypeChange(key)}
                className="flex items-center gap-2"
              >
                <Icon size={13} className="text-foreground-lighter" />
                <span className="flex-1">{label}</span>
                {typeCounts?.[key] !== undefined && (
                  <span className="font-mono text-xs text-foreground-lighter">
                    {typeCounts[key]}
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="default" iconRight={<ChevronDown />} className={triggerCls}>
            <span className="truncate">Source: {sourceLabel}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup
            value={source ?? ALL}
            onValueChange={(v) => onSourceChange(v === ALL ? null : (v as MarketplaceSource))}
          >
            <DropdownMenuItem onClick={() => onSourceChange(null)}>All sources</DropdownMenuItem>
            <DropdownMenuSeparator />
            {MARKETPLACE_SOURCES.map(({ key, label, icon: Icon }) => (
              <DropdownMenuItem
                key={key}
                onClick={() => onSourceChange(key)}
                className="flex items-center gap-2"
              >
                <Icon size={13} className="text-foreground-lighter" />
                <span className="flex-1">{label}</span>
                {sourceCounts?.[key] !== undefined && (
                  <span className="font-mono text-xs text-foreground-lighter">
                    {sourceCounts[key]}
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {showClear && (
        <button
          type="button"
          onClick={onClearFilters}
          className="px-1 text-xs text-foreground-light underline-offset-2 hover:underline"
        >
          Clear all
        </button>
      )}

      <div className="ml-auto flex rounded-md border">
        <button
          type="button"
          aria-label="Grid view"
          onClick={() => onViewModeChange('grid')}
          className={cn(
            'border-r px-2 py-1.5 rounded-l-md cursor-pointer',
            'focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground-muted focus-visible:ring-offset-1 focus-visible:ring-offset-background',
            viewMode === 'grid'
              ? 'bg-surface-200 text-foreground'
              : 'text-foreground-light hover:bg-surface-100'
          )}
        >
          <LayoutGrid size={13} />
        </button>
        <button
          type="button"
          aria-label="List view"
          onClick={() => onViewModeChange('list')}
          className={cn(
            'px-2 py-1.5 rounded-r-md cursor-pointer',
            'focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground-muted focus-visible:ring-offset-1 focus-visible:ring-offset-background',
            viewMode === 'list'
              ? 'bg-surface-200 text-foreground'
              : 'text-foreground-light hover:bg-surface-100'
          )}
        >
          <List size={13} />
        </button>
      </div>
    </div>
  )
}
