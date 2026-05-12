import { LayoutGrid, List, Search } from 'lucide-react'
import {
  cn,
  Select_Shadcn_ as Select,
  SelectContent_Shadcn_ as SelectContent,
  SelectItem_Shadcn_ as SelectItem,
  SelectTrigger_Shadcn_ as SelectTrigger,
  SelectValue_Shadcn_ as SelectValue,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

import { INTEGRATION_TYPES, type MarketplaceIntegrationType } from './Marketplace.constants'

export type ViewMode = 'list' | 'grid'

interface MarketplaceFilterBarProps {
  resultCount: number
  search: string
  onSearchChange: (value: string) => void
  category: string | null
  onCategoryChange: (value: string | null) => void
  categoryOptions: Array<{ slug: string; name: string }>
  type: MarketplaceIntegrationType | null
  onTypeChange: (value: MarketplaceIntegrationType | null) => void
  tier: 'Partner' | 'Official' | null
  onTierChange: (value: 'Partner' | 'Official' | null) => void
  viewMode: ViewMode
  onViewModeChange: (value: ViewMode) => void
  hasActiveFilter: boolean
  onClearFilters: () => void
}

const ALL = '__all__'

const triggerCls = 'w-[170px]'

export const MarketplaceFilterBar = ({
  resultCount,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categoryOptions,
  type,
  onTypeChange,
  tier,
  onTierChange,
  viewMode,
  onViewModeChange,
  hasActiveFilter,
  onClearFilters,
}: MarketplaceFilterBarProps) => {
  return (
    <div
      className={cn(
        'sticky top-0 z-5 -mx-6 flex flex-wrap items-center gap-2 px-6 py-3 xl:-mx-10 xl:px-10',
        'bg-dash-sidebar/95 backdrop-blur',
        hasActiveFilter ? 'border-b border-muted' : 'border-b border-transparent'
      )}
    >
      <Input
        value={search}
        size="tiny"
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={`Search ${resultCount} integration${resultCount === 1 ? '' : 's'}…`}
        icon={<Search size={14} />}
        className="w-60"
      />

      <Select value={category ?? ALL} onValueChange={(v) => onCategoryChange(v === ALL ? null : v)}>
        <SelectTrigger size="tiny" className={triggerCls}>
          <SelectValue placeholder="Category: All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Category: All</SelectItem>
          {categoryOptions.map((c) => (
            <SelectItem key={c.slug} value={c.slug}>
              Category: {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={type ?? ALL}
        onValueChange={(v) => onTypeChange(v === ALL ? null : (v as MarketplaceIntegrationType))}
      >
        <SelectTrigger size="tiny" className={triggerCls}>
          <SelectValue placeholder="Type: All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Type: All</SelectItem>
          {INTEGRATION_TYPES.map((t) => (
            <SelectItem key={t.key} value={t.key}>
              Type: {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={tier ?? ALL}
        onValueChange={(v) => onTierChange(v === ALL ? null : (v as 'Partner' | 'Official'))}
      >
        <SelectTrigger size="tiny" className="w-[130px]">
          <SelectValue placeholder="Tier: All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tier: All</SelectItem>
          <SelectItem value="Partner">Tier: Partner</SelectItem>
          <SelectItem value="Official">Tier: Official</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilter && (
        <button
          type="button"
          onClick={onClearFilters}
          className="px-1 text-xs text-foreground-light underline-offset-2 hover:underline"
        >
          Clear all
        </button>
      )}

      <div className="ml-auto flex overflow-hidden rounded-md border">
        <button
          type="button"
          aria-label="List view"
          onClick={() => onViewModeChange('list')}
          className={cn(
            'px-2.5 py-1.5',
            viewMode === 'list'
              ? 'bg-surface-200 text-foreground'
              : 'text-foreground-light hover:bg-surface-100'
          )}
        >
          <List size={13} />
        </button>
        <button
          type="button"
          aria-label="Grid view"
          onClick={() => onViewModeChange('grid')}
          className={cn(
            'border-l px-2.5 py-1.5',
            viewMode === 'grid'
              ? 'bg-surface-200 text-foreground'
              : 'text-foreground-light hover:bg-surface-100'
          )}
        >
          <LayoutGrid size={13} />
        </button>
      </div>
    </div>
  )
}
