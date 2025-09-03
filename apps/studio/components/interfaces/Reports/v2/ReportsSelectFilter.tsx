import { useState, useEffect } from 'react'
import { X, ChevronDown } from 'lucide-react'

import { Button, cn } from 'ui'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/components/shadcn/ui/popover'
import { Label } from '@ui/components/shadcn/ui/label'
import { Checkbox } from '@ui/components/shadcn/ui/checkbox'

export interface ReportSelectOption {
  key: string
  label: React.ReactNode
  description?: string
}

export interface SelectFilters {
  [key: string]: boolean
}

interface ReportsSelectFilterProps {
  label: string
  options: ReportSelectOption[]
  value: SelectFilters
  onChange: (value: SelectFilters) => void
  placeholder?: string
  isLoading?: boolean
  className?: string
}

export const ReportsSelectFilter = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select options',
  isLoading = false,
  className,
}: ReportsSelectFilterProps) => {
  const [open, setOpen] = useState(false)
  const [tempValue, setTempValue] = useState<SelectFilters>(value)

  const selectedCount = Object.values(value).filter(Boolean).length
  const isActive = selectedCount > 0

  useEffect(() => {
    if (!open) {
      setTempValue(value)
    }
  }, [open, value])

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange({})
  }

  const handleApply = () => {
    onChange(tempValue)
    setOpen(false)
  }

  const handleSelectAll = () => {
    const allSelected = options.reduce((acc, option) => {
      acc[option.key] = true
      return acc
    }, {} as SelectFilters)
    setTempValue(allSelected)
  }

  const handleClearAll = () => {
    setTempValue({})
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
          type={isActive ? 'default' : 'outline'}
          className={cn(
            'min-w-20 border-dashed relative group justify-between',
            {
              'border-solid': isActive,
            },
            className
          )}
          iconRight={<ChevronDown size={14} />}
        >
          <span>
            {label}
            {selectedCount > 0 && <span className="ml-1 text-xs">({selectedCount})</span>}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0 w-72" portal={true}>
        <div className="p-2 border-b border-default">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-foreground">{label}</span>
            <div className="flex gap-2">
              <Button size="tiny" type="outline" onClick={handleClearAll} disabled={isLoading}>
                Clear
              </Button>
            </div>
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto p-1" onKeyDown={handleKeyDown}>
          {options.length === 0 ? (
            <div className="p-4 text-center text-sm text-foreground-light">
              {isLoading ? 'Loading options...' : 'No options available'}
            </div>
          ) : (
            options.map((option) => (
              <Label
                key={option.key}
                htmlFor={`${label}-${option.key}`}
                className="flex items-start hover:bg-overlay-hover overflow-hidden p-2 m-1 rounded-sm gap-3 transition-all duration-150 ease-in-out cursor-pointer"
              >
                <div>
                  <Checkbox
                    id={`${label}-${option.key}`}
                    checked={Boolean(tempValue[option.key])}
                    onCheckedChange={(checked) => {
                      setTempValue({
                        ...tempValue,
                        [option.key]: Boolean(checked),
                      })
                    }}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  {option.description && (
                    <span className="text-sm text-foreground-lighter">{option.description}</span>
                  )}
                </div>
              </Label>
            ))
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-default p-2">
          <Button size="tiny" type="default" onClick={() => setOpen(false)} htmlType="button">
            Cancel
          </Button>
          <Button
            loading={isLoading}
            size="tiny"
            type="primary"
            onClick={handleApply}
            htmlType="button"
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
