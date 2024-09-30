'use client'

import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useState,
  PropsWithChildren,
} from 'react'
import { ChevronDown } from 'lucide-react'

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

interface MultiSelectContextProps {
  selected: string[]
  handleSelect: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  handleKeyDown: (event: React.KeyboardEvent) => void
}

const MultiSelectContext = createContext<MultiSelectContextProps>({
  selected: [],
  handleSelect: () => {},
  open: false,
  setOpen: () => {},
  handleKeyDown: () => {},
})

function MultiSelectProvider({
  selected,
  onSelectedChange,
  open,
  setOpen,
  handleKeyDown,
  children,
}: PropsWithChildren<{
  selected: string[]
  onSelectedChange: (selected: string[] | ((selected: string[]) => string[])) => void
  handleKeyDown: (event: React.KeyboardEvent) => void
  open: boolean
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
    <MultiSelectContext.Provider value={{ selected, handleSelect, open, setOpen, handleKeyDown }}>
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
  const [focusedIndex, setFocusedIndex] = React.useState(-1)
  const [_internalOpen, _setInternalOpen] = useState(false)
  const open = _controlledOpen ?? _internalOpen
  const setOpen = _setControlledOpen ?? _setInternalOpen

  const handleSelect = React.useCallback((value: string) => {
    onSelectedChange((values: string[]) => {
      const isSelected = values.some((currentVal: string) => currentVal === value)
      if (isSelected) {
        return values.filter((currentVal: string) => currentVal !== value)
      } else {
        return [...values, value]
      }
    })
  }, [])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setFocusedIndex((prevIndex) =>
          prevIndex < selected.length - 1 ? prevIndex + 1 : prevIndex
        )
        break
      case 'ArrowUp':
        event.preventDefault()
        setFocusedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0))
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (focusedIndex !== -1) {
          handleSelect(selected[focusedIndex])
        }
        break
      case 'Escape':
        setOpen(false)
        // inputRef.current?.focus()
        break
    }
  }

  return (
    <MultiSelectProvider
      selected={selected}
      onSelectedChange={onSelectedChange}
      open={open}
      setOpen={setOpen}
      handleKeyDown={handleKeyDown}
    >
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

  const inputRef = React.useRef<HTMLButtonElement>(null)
  const badgesRef = React.useRef<HTMLDivElement>(null)

  const [visibleBadges, setVisibleBadges] = React.useState<string[]>([])
  const [extraBadgesCount, setExtraBadgesCount] = React.useState(0)

  React.useEffect(() => {
    const calculateVisibleBadges = () => {
      if (!inputRef.current || !badgesRef.current) return

      const inputWidth = inputRef.current.offsetWidth
      const badgesContainer = badgesRef.current
      const badges = Array.from(badgesContainer.children) as HTMLElement[]

      let totalWidth = 0
      let visibleCount = 0

      // Subtract 100px: 60px for chevron and padding, 40px for extraBadgesCount growth
      const availableWidth = inputWidth - 100

      for (let i = 0; i < selected.length; i++) {
        if (i < badges.length) {
          totalWidth += badges[i].offsetWidth + 4 // 4px for gap
        } else {
          // Estimate width for badges not yet rendered
          totalWidth += 100 // Approximate width of a badge
        }

        if (totalWidth > availableWidth) {
          break
        }
        visibleCount++
      }

      setVisibleBadges(selected.slice(0, visibleCount))
      setExtraBadgesCount(Math.max(0, selected.length - visibleCount))
    }

    calculateVisibleBadges()
    window.addEventListener('resize', calculateVisibleBadges)

    return () => {
      window.removeEventListener('resize', calculateVisibleBadges)
    }
  }, [selected])

  const badgeClasses = ''

  return (
    <PopoverTrigger asChild ref={ref}>
      <button
        ref={inputRef}
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
          <span className="text-foreground-muted leading-[1.375rem]">{label}</span>
        ) : (
          <div ref={badgesRef} className="flex gap-1 overflow-hidden">
            {visibleBadges.map((value) => (
              <Badge key={value} className={cn('shrink-0', badgeClasses)}>
                {value}
              </Badge>
            ))}
            {extraBadgesCount > 0 && <Badge className={badgeClasses}>+{extraBadgesCount}</Badge>}
          </div>
        )}
        <ChevronDown size={16} strokeWidth={2} className="text-foreground-lighter shrink-0" />
      </button>
    </PopoverTrigger>
  )
})

MultiSelectorTrigger.displayName = 'MultiSelectorTrigger'

const MultiSelectorContent = forwardRef<
  HTMLDivElement,
  PropsWithChildren<
    {
      className?: string
    } & React.ComponentProps<typeof PopoverContent>
  >
>(({ children, className, ...props }, ref) => {
  const { handleKeyDown } = useMultiSelect()

  return (
    <PopoverContent
      ref={ref}
      className={cn('w-full px-1 py-1.5 space-y-1', className)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </PopoverContent>
  )
})

MultiSelectorContent.displayName = 'MultiSelectorContent'

const MultiSelectorList = forwardRef<
  React.ElementRef<typeof CommandList>,
  React.ComponentPropsWithoutRef<typeof CommandList>
>(({ className, children }, ref) => {
  return (
    <CommandList
      ref={ref}
      className={cn(
        'p-2 flex flex-col gap-2 rounded-md scrollbar-thin scrollbar-track-transparent transition-colors scrollbar-thumb-muted-foreground dark:scrollbar-thumb-muted scrollbar-thumb-rounded-lg w-full absolute bg-overlay shadow-md z-10 border border-overlay top-1',
        className
      )}
    >
      {children}
      <CommandEmpty>
        <span className="text-foreground-muted">No results found</span>
      </CommandEmpty>
    </CommandList>
  )
})

MultiSelectorList.displayName = 'MultiSelectorList'

const MultiSelectorItem = forwardRef<
  HTMLButtonElement,
  { value: string } & React.ComponentPropsWithoutRef<typeof CommandItem>
>(({ className, value, children }, ref) => {
  const id = useId()
  const { selected, handleSelect, open } = useMultiSelect()

  const isSelected = selected.some((item) => item === value)

  const mousePreventDefault = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  return (
    <button
      ref={ref}
      tabIndex={open ? 0 : -1}
      role="option"
      aria-selected={isSelected}
      onClick={() => handleSelect(value)}
      onMouseDown={mousePreventDefault}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleSelect(value)
        }
      }}
      className={cn(
        'relative',
        'text-foreground-lighter text-left pointer-events-auto',
        'px-2 py-1.5 rounded-md',
        'hover:text-foreground hover:!bg-overlay-hover',
        'w-full flex items-center space-x-2',
        'peer-data-[selected=true]:bg-overlay-hover peer-data-[selected=true]:text-strong',
        className
      )}
    >
      <Checkbox
        id={`${id}-checkbox-${value}`}
        checked={isSelected}
        // onCheckedChange={() => handleSelect(value)}
        tabIndex={-1}
        className="pointer-events-none"
      />
      <label
        htmlFor={`${id}-checkbox-${value}`}
        className="text-xs flex-grow leading-none pointer-events-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:pointer-events-none peer-disabled:opacity-50"
        tabIndex={-1}
      >
        {children}
      </label>
    </button>
  )
})

MultiSelectorItem.displayName = 'MultiSelectorItem'

export {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
}
