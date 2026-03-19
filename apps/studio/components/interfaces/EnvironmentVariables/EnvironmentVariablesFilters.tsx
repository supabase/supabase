import { ArrowUpDown, ChevronDown, Search } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

export type ScopeFilter = 'all' | 'production' | 'preview' | 'development'
export type SortOption = 'updated' | 'name'

const SCOPE_LABELS: Record<ScopeFilter, string> = {
  all: 'All Environments',
  production: 'Production',
  preview: 'Preview',
  development: 'Development',
}

const SORT_LABELS: Record<SortOption, string> = {
  updated: 'Last Updated',
  name: 'Name',
}

interface EnvironmentVariablesFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  scopeFilter: ScopeFilter
  onScopeFilterChange: (v: ScopeFilter) => void
  sort: SortOption
  onSortChange: (v: SortOption) => void
}

export const EnvironmentVariablesFilters = ({
  search,
  onSearchChange,
  scopeFilter,
  onScopeFilterChange,
  sort,
  onSortChange,
}: EnvironmentVariablesFiltersProps) => {
  return (
    <div className="flex items-center gap-2">
      <Input
        size="small"
        className="flex-1"
        placeholder="Search..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        icon={<Search size={14} />}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="default" size="small" iconRight={<ChevronDown size={14} />}>
            {SCOPE_LABELS[scopeFilter]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuRadioGroup
            value={scopeFilter}
            onValueChange={(v) => onScopeFilterChange(v as ScopeFilter)}
          >
            {Object.entries(SCOPE_LABELS).map(([value, label]) => (
              <DropdownMenuRadioItem key={value} value={value}>
                {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="default" size="small" icon={<ArrowUpDown size={14} />} iconRight={<ChevronDown size={14} />}>
            {SORT_LABELS[sort]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuRadioGroup
            value={sort}
            onValueChange={(v) => onSortChange(v as SortOption)}
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <DropdownMenuRadioItem key={value} value={value}>
                {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
