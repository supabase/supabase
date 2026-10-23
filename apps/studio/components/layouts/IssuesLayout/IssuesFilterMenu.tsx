import { ListFilterIcon } from 'lucide-react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'ui'

import {
  CATEGORY_LABELS,
  ISSUE_CATEGORIES,
  ISSUE_ORIGIN_TYPES,
  ISSUE_SEVERITIES,
  ORIGIN_LABELS,
  SEVERITY_LABELS,
} from '@/components/interfaces/Issues/Issues.constants'
import {
  getIssueStatusViewCount,
  type IssueStatusView,
} from '@/components/interfaces/Issues/Issues.utils'
import { useIssueFilters } from '@/components/interfaces/Issues/useIssueFilters'
import type { IssueStatus } from '@/data/issues/issue-schema'

const STATUS_VIEW_OPTIONS: { value: IssueStatusView; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'snoozed', label: 'Snoozed' },
  { value: 'closed', label: 'Closed' },
]

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

export const IssuesFilterMenu = ({ counts }: { counts?: Record<IssueStatus, number> }) => {
  const { filters, setFilters, activeFilterCount, clearFilters } = useIssueFilters()
  const hasFilters = activeFilterCount > 0

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
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="justify-between gap-x-2">
            <span>Status</span>
            <span className="text-foreground-lighter">
              {STATUS_VIEW_OPTIONS.find((option) => option.value === filters.status)?.label}
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-44">
            <DropdownMenuRadioGroup
              value={filters.status}
              onValueChange={(value) => {
                const option = STATUS_VIEW_OPTIONS.find((option) => option.value === value)
                if (option) setFilters({ status: option.value })
              }}
            >
              {STATUS_VIEW_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  <span className="flex-1">{option.label}</span>
                  <span className="text-foreground-lighter tabular-nums">
                    {getIssueStatusViewCount(counts, option.value)}
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <MultiSelectSub
          label="Severity"
          options={ISSUE_SEVERITIES}
          labels={SEVERITY_LABELS}
          selected={filters.severity}
          onChange={(severity) => setFilters({ severity })}
        />
        <MultiSelectSub
          label="Category"
          options={ISSUE_CATEGORIES}
          labels={CATEGORY_LABELS}
          selected={filters.category}
          onChange={(category) => setFilters({ category })}
        />
        <MultiSelectSub
          label="Source"
          options={ISSUE_ORIGIN_TYPES}
          labels={ORIGIN_LABELS}
          selected={filters.source}
          onChange={(source) => setFilters({ source })}
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
