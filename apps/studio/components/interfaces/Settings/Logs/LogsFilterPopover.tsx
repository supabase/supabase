import { useEffect, useMemo, useState } from 'react'

import { Button, cn } from 'ui'
import type { FilterSet, Filters } from './Logs.types'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/components/shadcn/ui/popover'
import { Label } from '@ui/components/shadcn/ui/label'
import { Checkbox } from '@ui/components/shadcn/ui/checkbox'

interface LogsFilterPopoverProps {
  options: FilterSet
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  buttonClassName: string
  align?: 'start' | 'end' | 'center'
  isLoading?: boolean
}

const LogsFilterPopover = ({
  options,
  filters,
  onFiltersChange,
  buttonClassName,
  align = 'start',
  isLoading = false,
}: LogsFilterPopoverProps) => {
  const filterKey = options.key
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Filters>(filters)

  const handleReset = () => {
    const emptyFilters = { [filterKey]: {} }
    setValues(emptyFilters)
    onFiltersChange({
      ...filters,
      [filterKey]: {},
    })
  }

  const handleToggle = () => setOpen(!open)
  const isActive = useMemo(() => {
    const filter = values[filterKey]
    if (typeof filter === 'object' && Object.values(filter).some(Boolean)) {
      return true
    }
    return false
  }, [values, filterKey])

  // Reset values on close without applying
  useEffect(() => {
    if (!open) {
      setValues(filters)
    }
  }, [open, filters])

  return (
    <Popover open={open} onOpenChange={handleToggle}>
      <PopoverTrigger asChild>
        <Button
          type={isActive ? 'default' : 'outline'}
          onClick={handleToggle}
          className={cn(
            'min-w-20 border-dashed',
            {
              'border-solid': isActive,
            },
            buttonClassName
          )}
        >
          <span>{options.label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="p-0 w-60">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onFiltersChange(values)
            setOpen(false)
          }}
        >
          {options.options.map((x, i: number) => (
            <Label
              key={x.key}
              htmlFor={`${options.key}.${x.key}`}
              className="flex items-start hover:bg-overlay-hover overflow-hidden p-2 m-1 rounded-sm gap-3 transition-all duration-150 ease-in-out"
            >
              <div>
                <Checkbox
                  value={options.key}
                  id={`${options.key}.${x.key}`}
                  checked={Boolean((values?.[options.key] as Filters)?.[x.key])}
                  onCheckedChange={(checked) => {
                    const newValues = {
                      ...values,
                      [options.key]: {
                        ...(values[options.key] as Filters),
                        [x.key]: checked,
                      },
                    }

                    setValues(newValues)
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span>{x.label}</span>
                <span className="text-sm text-foreground-lighter">{x.description}</span>
              </div>
            </Label>
          ))}

          <div className="flex items-center justify-end gap-2 border-t border-default p-2">
            <Button size="tiny" type="default" onClick={handleReset} htmlType="button">
              Clear
            </Button>
            <Button loading={isLoading} type="primary" htmlType="submit">
              Apply
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}

export default LogsFilterPopover
