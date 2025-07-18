import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
} from 'ui'
import { ChevronDown } from 'lucide-react'

// Dropdown component for SQL
export function FilterDropdown({
  filterKey,
  filterConfig,
  selectedValue,
  setFilterValue,
}: {
  filterKey: string
  filterConfig: { options: { value: string }[] }
  selectedValue: string
  setFilterValue: (filterKey: string, value: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="text"
          size="tiny"
          className={`inline-flex items-center gap-1 px-2 py-0 h-auto text-sm font-mono bg-background border border-border hover:bg-surface-100 ${
            selectedValue === 'unset' ? 'text-foreground-lighter' : ''
          }`}
          iconRight={<ChevronDown className="w-3 h-3" />}
        >
          {selectedValue === 'unset'
            ? filterConfig.label
            : `${filterConfig.label}: ${selectedValue}`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={() => setFilterValue(filterKey, 'unset')}
          className={selectedValue === 'unset' ? 'text-brand-600' : ''}
        >
          Unset
        </DropdownMenuItem>
        {filterConfig.options
          .filter((opt) => opt.value !== 'unset')
          .map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setFilterValue(filterKey, option.value)}
              className={selectedValue === option.value ? 'text-brand-600' : ''}
            >
              {option.value}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
