import { useFlag } from 'common'
import { ListFilterIcon } from 'lucide-react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'ui'

import {
  CATEGORY_LABELS,
  ISSUE_CATEGORIES,
  ISSUE_SEVERITIES,
  SEVERITY_LABELS,
} from '@/components/interfaces/Issues/Issues.constants'
import { useIssueFilters } from '@/components/interfaces/Issues/useIssueFilters'

const toggle = <T extends string>(values: T[], value: T) =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value]

const MultiSelectSub = <T extends string>({
  label,
  options,
  labels,
  selected,
  onChange,
}: {
  label: string
  options: T[]
  labels: Record<T, string>
  selected: T[]
  onChange: (next: T[] | null) => void
}) => (
  <DropdownMenuSub>
    <DropdownMenuSubTrigger className="justify-between gap-x-2">
      <span>{label}</span>
      {selected.length > 0 && (
        <span className="text-sm text-foreground-lighter">{selected.length}</span>
      )}
    </DropdownMenuSubTrigger>
    <DropdownMenuSubContent className="w-44">
      {options.map((option) => (
        <DropdownMenuCheckboxItem
          key={option}
          checked={selected.includes(option)}
          onSelect={(event) => event.preventDefault()}
          onCheckedChange={() => {
            const next = toggle(selected, option)
            onChange(next.length > 0 ? next : null)
          }}
        >
          {labels[option]}
        </DropdownMenuCheckboxItem>
      ))}
    </DropdownMenuSubContent>
  </DropdownMenuSub>
)

export const IssuesFilterMenu = () => {
  const isHealthAdvisorEnabled = useFlag('healthAdvisor')
  const { filters, setFilters, activeFilterCount, clearFilters } = useIssueFilters()
  const hasFilters = activeFilterCount > 0
  const categories = ISSUE_CATEGORIES.filter(
    (category) => category !== 'health' || isHealthAdvisorEnabled
  )

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={hasFilters ? 'default' : 'text'}
          size="tiny"
          aria-label={hasFilters ? `Filters, ${activeFilterCount} active` : 'Filters'}
          className={cn('h-[28px] shrink-0 px-1.5', !hasFilters && 'w-7')}
          icon={<ListFilterIcon size={14} />}
        >
          {hasFilters ? activeFilterCount : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Filter</DropdownMenuLabel>
        <MultiSelectSub
          label="Severity"
          options={ISSUE_SEVERITIES}
          labels={SEVERITY_LABELS}
          selected={filters.severity}
          onChange={(severity) => setFilters({ severity })}
        />
        <MultiSelectSub
          label="Category"
          options={categories}
          labels={CATEGORY_LABELS}
          selected={filters.category}
          onChange={(category) => setFilters({ category })}
        />
        {hasFilters && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={clearFilters}>Clear filters</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
