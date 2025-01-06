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
  selected: Item[]
  handleSelect: (item: Item) => void
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
  selected: Item[]
  onSelectedChange: (selected: Item[] | ((selected: Item[]) => Item[])) => void
  setOpen: (open: boolean) => void
}>) {
  const handleSelect = useCallback(
    (item: Item) => {
      onSelectedChange((current: Item[]) => {
        const isSelected = current.some((currItem) => currItem.value === item.value)
        if (isSelected) {
          return current.filter((currItem) => currItem.value !== item.value)
        } else {
          return [...current, item]
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

export function MultiSelect({
  open: _controlledOpen,
  setOpen: _setControlledOpen,
  selected,
  onSelectedChange,
  children,
  ...props
}: PropsWithChildren<
  {
    open?: boolean
    setOpen?: React.Dispatch<React.SetStateAction<boolean>>
    selected?: Item[]
    onSelectedChange: (selected: Item[] | ((selected: Item[]) => Item[])) => void
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

const Trigger = forwardRef<
  HTMLButtonElement,
  { label?: string; className?: string } & React.ComponentProps<typeof PopoverTrigger>
>(({ label, className, ...props }, ref) => {
  const { selected } = useMultiSelect()

  const [measuredWidth, setMeasuredWidth] = useState(0)
  const measuredRef = (node: HTMLElement) => {
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
            {visibleBadges.map((item) => (
              <Badge key={item.value} className={cn('shrink-0', badgeClasses)}>
                {item.label}
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
Trigger.displayName = 'Trigger'
MultiSelect.Trigger = Trigger

const Content = forwardRef<
  HTMLDivElement,
  PropsWithChildren<{ className?: string } & React.ComponentProps<typeof PopoverContent>>
>(({ children, className, ...props }, ref) => {
  return (
    <PopoverContent ref={ref} className={cn('w-full p-4 space-y-4', className)} {...props}>
      {children}
    </PopoverContent>
  )
})
Content.displayName = 'Content'
MultiSelect.Content = Content

export function Item({ item, className }: { item: Item; className?: string }) {
  const id = useId()
  const { selected, handleSelect } = useMultiSelect()

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Checkbox
        id={`${id}-checkbox-${item.value}`}
        checked={selected.some((sel) => sel.value === item.value)}
        onCheckedChange={() => handleSelect(item)}
      />
      <label
        htmlFor={`${id}-checkbox-${item.value}`}
        className="text-sm leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {item.label}
      </label>
    </div>
  )
}
MultiSelect.Item = Item
