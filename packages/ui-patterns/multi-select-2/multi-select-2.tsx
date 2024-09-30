'use client'

import { ChevronsUpDown } from 'lucide-react'
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useState,
  PropsWithChildren,
  useRef,
  useEffect,
} from 'react'

import {
  Command,
  CommandItem,
  CommandEmpty,
  CommandList,
} from 'ui/src/components/shadcn/ui/command'
import {
  cn,
  Badge,
  Checkbox_Shadcn_ as Checkbox,
  Popover_Shadcn_ as Popover,
  PopoverContent_Shadcn_ as PopoverContent,
  PopoverTrigger_Shadcn_ as PopoverTrigger,
} from 'ui'

interface Item {
  value: string
  label: string
}

const MultiSelectContext = createContext<{
  selected: string[]
  handleSelect: (value: string) => void
  setOpen: (open: boolean) => void
}>({
  selected: [],
  handleSelect: () => {},
  setOpen: () => {},
})

function MultiSelectProvider({
  selected,
  onSelectedChange,
  setOpen,
  children,
}: PropsWithChildren<{
  selected: string[]
  onSelectedChange: (selected: string[] | ((selected: string[]) => string[])) => void
  setOpen: (open: boolean) => void
}>) {
  const handleSelect = useCallback(
    (value: string) => {
      onSelectedChange((values: string[]) => {
        const isSelected = values.some((currValue) => currValue === value)
        if (isSelected) {
          return values.filter((currValue) => currValue !== value)
        } else {
          return [...values, value]
        }
      })
    },
    [onSelectedChange]
  )

  return (
    <MultiSelectContext.Provider value={{ selected, handleSelect, setOpen }}>
      {children}
    </MultiSelectContext.Provider>
  )
}

function useMultiSelect() {
  const context = useContext(MultiSelectContext)
  if (!context) {
    throw new Error('useMultiSelect must be used within a MultiSelectProvider')
  }
  return context
}

function MultiSelector({
  open: _controlledOpen,
  setOpen: _setControlledOpen,
  selected = [],
  onSelectedChange,
  children,
  ...props
}: PropsWithChildren<
  {
    open?: boolean
    setOpen?: React.Dispatch<React.SetStateAction<boolean>>
    selected?: string[]
    onSelectedChange: (selected: string[] | ((selected: string[]) => string[])) => void
  } & React.ComponentProps<typeof Popover>
>) {
  const [_internalOpen, _setInternalOpen] = useState(false)
  const open = _controlledOpen ?? _internalOpen
  const setOpen = _setControlledOpen ?? _setInternalOpen

  return (
    <MultiSelectProvider selected={selected} onSelectedChange={onSelectedChange} setOpen={setOpen}>
      <Popover open={open} onOpenChange={setOpen} {...props}>
        {children}
      </Popover>
    </MultiSelectProvider>
  )
}

const MultiSelectorTrigger = forwardRef<
  HTMLButtonElement,
  { label?: string; className?: string } & React.ComponentProps<typeof PopoverTrigger>
>(({ label, className, ...props }, ref) => {
  const { selected } = useMultiSelect()

  const [measuredWidth, setMeasuredWidth] = useState(0)
  const measuredRef = (node: HTMLDivElement | null) => {
    if (node) {
      setMeasuredWidth(node.getBoundingClientRect().width)
    }
  }

  const badgeWidth = 100 // Approximate width of a badge in pixels
  const maxBadges = Math.max(1, Math.floor((measuredWidth || 200) / badgeWidth))
  const visibleBadges = selected.slice(0, maxBadges)
  const extraBadgesCount = Math.max(0, selected.length - maxBadges)

  const badgeClasses = 'bg-200'

  return (
    <PopoverTrigger asChild ref={ref}>
      <button
        role="combobox"
        className={cn(
          'flex w-full min-w-[200px] items-center justify-between rounded-md border',
          'border-alternative bg-foreground/[.026] px-3 py-2 text-sm',
          'ring-offset-background placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'hover:border-primary transition-colors duration-200',
          className
        )}
        {...props}
      >
        {selected.length === 0 ? (
          // Leading prevents shift when switching to badges
          <span className="text-muted-foreground leading-[1.375rem]">{label}</span>
        ) : (
          <div ref={measuredRef} className="flex gap-1 overflow-hidden">
            {visibleBadges.map((value) => (
              <Badge key={value} className={cn('shrink-0', badgeClasses)}>
                {value}
              </Badge>
            ))}
            {extraBadgesCount > 0 && <Badge className={badgeClasses}>+{extraBadgesCount}</Badge>}
          </div>
        )}
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>
    </PopoverTrigger>
  )
})

MultiSelectorTrigger.displayName = 'MultiSelectorTrigger'

const MultiSelectorContent = forwardRef<
  HTMLDivElement,
  PropsWithChildren<{ className?: string } & React.ComponentProps<typeof PopoverContent>>
>(({ children, className, ...props }, ref) => {
  return (
    <PopoverContent ref={ref} className={cn('w-full p-4 space-y-4', className)} {...props}>
      {children}
    </PopoverContent>
  )
})

MultiSelectorContent.displayName = 'MultiSelectorContent'

// const MultiSelectorItem = forwardRef({ item, className }: { item: Item; className?: string }) => {
const MultiSelectorItem = forwardRef<
  React.ElementRef<typeof CommandItem>,
  { value: string } & React.ComponentPropsWithoutRef<typeof CommandItem>
>(({ className, value, children }, ref) => {
  const id = useId()
  const { selected, handleSelect } = useMultiSelect()

  return (
    <div ref={ref} className={cn('flex items-center space-x-2', className)}>
      <Checkbox
        id={`${id}-checkbox-${value}`}
        checked={selected.some((sel) => sel === value)}
        onCheckedChange={() => handleSelect(value)}
      />
      <label
        htmlFor={`${id}-checkbox-${value}`}
        className="text-sm leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {children}
      </label>
    </div>
  )
})

MultiSelectorItem.displayName = 'MultiSelectorItem'

export { MultiSelector, MultiSelectorTrigger, MultiSelectorContent, MultiSelectorItem }
