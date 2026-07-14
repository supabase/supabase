import { Checkbox } from '@ui/components/shadcn/ui/checkbox'
import { CommandGroup } from '@ui/components/shadcn/ui/command'
import { Label } from '@ui/components/shadcn/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/components/shadcn/ui/popover'
import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, cn, Command, CommandEmpty, CommandInput, CommandItem, CommandList } from 'ui'
import { z } from 'zod'

export interface ReportSelectOption {
  label: React.ReactNode
  value: string
  description?: string
}

export const selectFilterSchema = z.array(z.string())
export type SelectFilters = z.infer<typeof selectFilterSchema>

interface ReportsSelectFilterProps {
  label: string
  options: ReportSelectOption[]
  value: SelectFilters
  onChange: (value: SelectFilters) => void
  isLoading?: boolean
  className?: string
  showSearch?: boolean
}

export const ReportsSelectFilter = ({
  label,
  options,
  value,
  onChange,
  isLoading = false,
  className,
  showSearch = false,
}: ReportsSelectFilterProps) => {
  const [open, setOpen] = useState(false)
  const [tempValue, setTempValue] = useState<SelectFilters>(value)

  const isActive = tempValue.length > 0

  useEffect(() => {
    if (!open) {
      setTempValue(value)
    }
  }, [open, value])

  const handleApply = () => {
    onChange(tempValue)
    setOpen(false)
  }

  const handleClearAll = () => {
    setTempValue([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleApply()
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={isActive ? 'default' : 'outline'}
          className={cn(
            'min-w-20 border-dashed relative group justify-between',
            { 'border-solid': isActive },
            className
          )}
          iconRight={<ChevronDown size={14} />}
        >
          <span>
            {label}
            {tempValue.length > 0 && <span className="ml-1 text-xs">({tempValue.length})</span>}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0 w-72">
        <Command>
          {showSearch && <CommandInput placeholder="Search..." />}
          <CommandList className="max-h-72">
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option.value}>
                  <Label
                    key={option.value}
                    className={
                      'flex items-center overflow-hidden p-1 rounded-xs gap-x-3 w-full h-full'
                    }
                  >
                    <Checkbox
                      id={`${label}-${option.value}`}
                      checked={tempValue.includes(option.value)}
                      onCheckedChange={(checked) => {
                        setTempValue(
                          checked
                            ? [...tempValue, option.value]
                            : tempValue.filter((x) => x !== option.value)
                        )
                      }}
                      onKeyDown={handleKeyDown}
                    />
                    <div className="flex flex-col text-xs">
                      {option.label}
                      {option.description && (
                        <span className="text-foreground-lighter">{option.description}</span>
                      )}
                    </div>
                  </Label>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>

        <div className="flex items-center justify-end gap-2 border-t border-default p-2">
          <Button size="tiny" variant="outline" onClick={handleClearAll} disabled={isLoading}>
            Clear
          </Button>
          <Button
            loading={isLoading}
            size="tiny"
            variant="primary"
            onClick={handleApply}
            type="button"
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
