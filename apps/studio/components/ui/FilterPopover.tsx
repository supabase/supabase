import { useState } from 'react'
import { Button, Checkbox, Popover, ScrollArea } from 'ui'

interface FilterPopoverProps {
  options: any[]
  activeOptions: any[]
  valueKey: string
  labelKey: string
  name: string
  variant?: 'rectangular' | 'rounded'
  onSaveFilters: (options: string[]) => void
}

// [Joshen] Form + Checkbox.Group doesn't seem to work properly RE form state
// hence why the manual implementation here as a workaround

export const FilterPopover = ({
  options = [],
  activeOptions = [],
  valueKey,
  labelKey,
  name,
  variant = 'rectangular',
  onSaveFilters,
}: FilterPopoverProps) => {
  const [open, setOpen] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  const formattedOptions = activeOptions.map((option) => {
    const base = options.find((x) => x[valueKey] === option)
    return base[labelKey]
  })

  return (
    <Popover
      side="bottom"
      align="start"
      open={open}
      onOpenChange={() => setOpen(!open)}
      header={<div className="prose text-xs">Select {name.toLowerCase()}</div>}
      overlay={
        <>
          <div className="space-y-4 px-3 py-3 min-w-[170px]">
            <ScrollArea className={options.length > 7 ? 'h-[205px]' : ''}>
              <Checkbox.Group
                id="projects"
                onChange={(event) => {
                  const value = event.target.value
                  if (selectedOptions.includes(value)) {
                    setSelectedOptions(selectedOptions.filter((x) => x !== value))
                  } else {
                    setSelectedOptions(selectedOptions.concat(value))
                  }
                }}
                options={options.map((option) => {
                  return {
                    value: option[valueKey],
                    label: option[labelKey],
                    defaultChecked: activeOptions.includes(option[valueKey]),
                  }
                })}
              />
            </ScrollArea>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-overlay bg-surface-200 py-2 px-3">
            <Button
              size="tiny"
              type="default"
              onClick={() => {
                onSaveFilters([])
                setOpen(false)
              }}
            >
              Clear
            </Button>
            <Button
              type="primary"
              onClick={() => {
                onSaveFilters(selectedOptions)
                setOpen(false)
              }}
            >
              Save
            </Button>
          </div>
        </>
      }
    >
      <Button
        asChild
        type={activeOptions.length > 0 ? 'default' : 'dashed'}
        onClick={() => setOpen(false)}
        className={variant === 'rounded' ? 'rounded-full' : ''}
      >
        <div>
          <span>{name}</span>
          {activeOptions.length > 0 && <span className="mr-1">:</span>}
          {activeOptions.length >= 3 ? (
            <span>
              {formattedOptions[0]} and {activeOptions.length - 1} others
            </span>
          ) : activeOptions.length > 0 ? (
            <span>{formattedOptions.join(', ')}</span>
          ) : null}
        </div>
      </Button>
    </Popover>
  )
}
