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
import { ChevronsUpDown } from 'lucide-react'

import {
  Command,
  CommandEmpty,
  CommandItem,
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
import { max } from 'lodash'

interface MultiSelectContextProps {
  selected: string[]
  handleSelect: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  handleKeyDown?: (event: React.KeyboardEvent) => void
  itemRefs?: (HTMLElement | null)[]
  // focusedIndex: number
  // setFocusedIndex: React.Dispatch<React.SetStateAction<number>>
}

const MultiSelectContext = createContext<MultiSelectContextProps>({
  selected: [],
  handleSelect: () => {},
  open: false,
  setOpen: () => false,
  handleKeyDown: () => {},
  itemRefs: [],
  // focusedIndex: -1,
  // setFocusedIndex: () => -1,
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
  handleKeyDown?: (event: React.KeyboardEvent) => void
  open: boolean
  setOpen: (open: boolean) => void
}>) {
  // const [focusedIndex, setFocusedIndex] = React.useState(-1)

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
    <MultiSelectContext.Provider
      value={{
        selected,
        handleSelect,
        open,
        setOpen,
        handleKeyDown,
        // focusedIndex,
        // setFocusedIndex,
      }}
    >
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
    <MultiSelectProvider
      selected={selected}
      onSelectedChange={onSelectedChange}
      open={open}
      setOpen={setOpen}
      // handleKeyDown={handleKeyDown}
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

      let maxVisibleBadges = 1
      setVisibleBadges(selected.slice(0, maxVisibleBadges))
      setExtraBadgesCount(Math.max(0, selected.length - maxVisibleBadges))
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
        <ChevronsUpDown size={16} strokeWidth={2} className="text-foreground-lighter shrink-0" />
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
      className={cn('w-full p-0 border-none', className)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <Command>{children}</Command>
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
  HTMLDivElement,
  { value: string } & React.ComponentPropsWithoutRef<typeof CommandItem>
>(({ className, value, children }, ref) => {
  const id = useId()
  const { selected, handleSelect, open } = useMultiSelect()
  const isSelected = selected.some((item) => item === value)

  return (
    <CommandItem
      ref={ref}
      tabIndex={open ? 0 : -1}
      role="option"
      aria-selected={isSelected}
      onSelect={() => handleSelect(value)}
      className={cn(
        'relative',
        'text-foreground-lighter text-left pointer-events-auto',
        'px-2 py-1.5 rounded',
        'hover:text-foreground hover:!bg-overlay-hover',
        'w-full flex items-center space-x-2',
        'peer-data-[selected=true]:bg-overlay-hover peer-data-[selected=true]:text-strong',
        className
      )}
    >
      <Checkbox
        id={`${id}-checkbox-${value}`}
        checked={isSelected}
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
    </CommandItem>
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
