import { useIntersectionObserver } from '@uidotdev/usehooks'
import { noop } from 'lodash'
import { ChevronDown, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  Button,
  Checkbox_Shadcn_,
  cn,
  Label_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

interface FilterPopoverProps<T> {
  title?: string
  options: T[]
  activeOptions: string[]
  valueKey: keyof T
  labelKey: keyof T
  iconKey?: string
  name: string
  variant?: 'rectangular' | 'rounded'
  buttonType?: 'default' | 'dashed'
  disabled?: boolean
  labelClass?: string
  maxHeightClass?: string
  clearButtonText?: string
  className?: string
  isMinimized?: boolean
  onSaveFilters: (options: string[]) => void

  // [Joshen] These props are to support async data with infinite loading if applicable
  search?: string
  setSearch?: (value: string) => void
  hasNextPage?: boolean
  isLoading?: boolean
  isFetching?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void

  // Support for grouped options with separators
  groupKey?: keyof T
  groups?: Array<{ name: string; options: string[] }>

  // Support for custom label rendering (e.g., for tooltips)
  renderLabel?: (option: T, value: string) => React.ReactNode
}

// [Joshen] Known issue currently that FilterPopover trigger label will not show selected options properly
// for async data with infinite loading. Thinking this requires quite a bit of change that I'd rather do in
// a separate PR
export const FilterPopover = <T extends Record<string, any>>({
  title,
  options = [],
  activeOptions = [],
  valueKey,
  labelKey,
  iconKey = 'icon',
  name = 'default',
  variant = 'rectangular',
  buttonType,
  disabled,
  labelClass,
  className,
  maxHeightClass = 'h-[205px]',
  clearButtonText = 'Clear',
  isMinimized = false,
  onSaveFilters,

  search,
  setSearch = noop,
  hasNextPage = false,
  isLoading = false,
  isFetching = false,
  isFetchingNextPage = false,
  fetchNextPage = noop,
  groups,
  renderLabel,
}: FilterPopoverProps<T>) => {
  const [open, setOpen] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  // Helper function to render an option
  const renderOption = (option: T) => {
    const value = option[valueKey]
    const icon = iconKey ? option[iconKey] : undefined

    const defaultLabel = (
      <Label_Shadcn_
        htmlFor={option[valueKey]}
        className={cn('flex items-center gap-x-2 text-xs cursor-pointer', labelClass)}
      >
        {icon && (
          <img src={icon} alt={option[labelKey]} className={cn('w-4 h-4', option.iconClass)} />
        )}
        <span>{option[labelKey]}</span>
      </Label_Shadcn_>
    )

    const label = renderLabel ? renderLabel(option, value) : defaultLabel

    return (
      <div key={value} className="group flex items-center gap-x-2">
        <Checkbox_Shadcn_
          id={value}
          checked={selectedOptions.includes(value)}
          onCheckedChange={() => {
            if (selectedOptions.includes(value)) {
              setSelectedOptions(selectedOptions.filter((x) => x !== value))
            } else {
              setSelectedOptions(selectedOptions.concat(value))
            }
          }}
        />
        <div className="flex-1">{label}</div>
        <button
          className="text-xs text-foreground-lighter hover:text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.preventDefault()
            setSelectedOptions([value])
          }}
        >
          Only
        </button>
      </div>
    )
  }

  const scrollRootRef = useRef<HTMLDivElement | null>(null)
  const [sentinelRef, entry] = useIntersectionObserver({
    root: scrollRootRef.current,
    threshold: 0,
    rootMargin: '0px',
  })

  const formattedOptions = activeOptions.map((option) => {
    const base = options.find((x) => x[valueKey] === option)
    if (!base || !base[labelKey]) {
      return ''
    }
    return base[labelKey]
  })

  useEffect(() => {
    if (!open) setSelectedOptions(activeOptions)
    if (!open) setSearch('')
  }, [open, activeOptions])

  useEffect(() => {
    if (
      open &&
      entry?.isIntersecting &&
      hasNextPage &&
      !isLoading &&
      !isFetching &&
      !isFetchingNextPage
    ) {
      console.log('Fetch next page')
      fetchNextPage()
    }
  }, [
    open,
    entry?.isIntersecting,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
  ])

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          asChild
          disabled={disabled}
          type={buttonType ?? (activeOptions.length > 0 ? 'default' : 'dashed')}
          onClick={() => setOpen(false)}
          className={variant === 'rounded' ? 'rounded-full' : ''}
          iconRight={<ChevronDown />}
        >
          <div>
            <span>{name}</span>
            {activeOptions.length > 0 && (
              <>
                <span className="mr-1">:</span>
                {isMinimized ? (
                  <span>{activeOptions.length}</span>
                ) : activeOptions.length >= 3 ? (
                  <span>
                    {formattedOptions[0]} and {activeOptions.length - 1} others
                  </span>
                ) : (
                  <span>{formattedOptions.join(', ')}</span>
                )}
              </>
            )}
          </div>
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        className={cn('p-0', search !== undefined ? 'w-64' : 'w-44', className)}
        align="start"
      >
        <div className="border-b border-overlay bg-surface-200 rounded-t pb-1 px-3">
          <span className="text-xs text-foreground-light">
            {title ?? `Select ${name.toLowerCase()}`}
          </span>
        </div>
        {search !== undefined && (
          <Input
            size="tiny"
            value={search}
            onChange={(e) => {
              if (!!setSearch) setSearch(e.target.value)
            }}
            className="rounded-none border-x-0 border-t-0 bg-surface-100 px-3"
            placeholder="Search for a project..."
            actions={
              (search ?? '').length > 0 ? (
                <X size={14} className="cursor-pointer mr-1" onClick={() => setSearch('')} />
              ) : null
            }
          />
        )}
        {(search ?? '').length > 0 && options.length === 0 && (
          <p className="text-xs text-foreground-lighter pt-3 px-3">No results found</p>
        )}
        <ScrollArea className={options.length > 7 ? maxHeightClass : ''}>
          <div className="px-3 pt-3 flex flex-col gap-y-2">
            {groups ? (
              <>
                {groups
                  .filter((group) => group.options.length > 0)
                  .map((group: { name: string; options: string[] }, groupIndex: number) => (
                    <div key={group.name} className={groupIndex > 0 ? 'py-2' : ''}>
                      {groupIndex > 0 && <div className="mb-2 border-t border-overlay -mx-3" />}
                      <span className="text-xs text-foreground-lighter font-medium mb-2 block">
                        {group.name}
                      </span>
                      <div className="flex flex-col gap-y-2">
                        {group.options.map((optionValue) => {
                          const option = options.find((x) => x[valueKey] === optionValue)
                          return option ? renderOption(option) : null
                        })}
                      </div>
                    </div>
                  ))}
              </>
            ) : (
              options.map((option) => renderOption(option))
            )}
          </div>
          <div ref={sentinelRef} className="h-1 -mt-1" />
          {hasNextPage ? (
            <div className="px-3 py-2">
              <ShimmeringLoader className="py-2" />
            </div>
          ) : (
            <div className="py-1.5" />
          )}
        </ScrollArea>
        <div className="flex items-center justify-end gap-2 border-t border-overlay bg-surface-200 py-2 px-3">
          <Button
            size="tiny"
            type="default"
            onClick={() => {
              onSaveFilters([])
              setSelectedOptions([])
              setOpen(false)
            }}
          >
            {clearButtonText}
          </Button>
          <Button
            type="primary"
            onClick={() => {
              // Order the selection based on the options provided
              const sortingOrder = options.map((option) => option[valueKey]) as string[]
              const sortedSelection = selectedOptions.sort(
                (a, b) => sortingOrder.indexOf(a) - sortingOrder.indexOf(b)
              )
              onSaveFilters(sortedSelection)
              setOpen(false)
            }}
          >
            Save
          </Button>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
