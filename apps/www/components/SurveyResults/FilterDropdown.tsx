import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
} from 'ui'
import { ChevronsUpDown } from 'lucide-react'

// Dropdown component for SQL
export function FilterDropdown({
  filterKey,
  filterConfig,
  selectedValue,
  setFilterValue,
}: {
  filterKey: string
  filterConfig: {
    label: string
    options: { value: string; label: string }[]
  }
  selectedValue: string
  setFilterValue: (filterKey: string, value: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="default"
          size="tiny"
          className="w-full [&>span]:w-full !pr-1 space-x-1"
          iconRight={<ChevronsUpDown className="text-foreground-muted" strokeWidth={2} size={14} />}
        >
          {selectedValue === 'unset' ? (
            <div className="w-full flex gap-1">
              <p className="text-foreground-lighter">{filterConfig.label.toLowerCase()}</p>
            </div>
          ) : (
            <div className="w-full flex gap-1">
              <p className="text-foreground-lighter">{filterConfig.label.toLowerCase()}</p>
              <p className="text-foreground">{selectedValue}</p>
            </div>
          )}
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
              {option.label}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
