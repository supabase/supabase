'use client'

import { cva, VariantProps } from 'class-variance-authority'
import { Check, ChevronsUpDown, X as RemoveIcon } from 'lucide-react'
import React, { useEffect } from 'react'
import { Badge, cn, useOnClickOutside } from 'ui'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from 'ui/src/components/shadcn/ui/command'
import { SIZE_VARIANTS, SIZE_VARIANTS_DEFAULT } from 'ui/src/lib/constants'

interface MultiSelectContextProps {
  values: string[]
  onValuesChange: (value: string[]) => void
  toggleValue: (values: string) => void
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  inputValue: string
  setInputValue: React.Dispatch<React.SetStateAction<string>>
  activeIndex: number
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>
  size: MultiSelectorProps['size']
  disabled?: boolean
  dropdownPlacement: 'top' | 'bottom'
  dropdownMaxHeight: number
}

const MultiSelectContext = React.createContext<MultiSelectContextProps | null>(null)

const DROPDOWN_MAX_HEIGHT = 300
const DROPDOWN_GAP = 8

const commandItemClass = cn(
  'relative text-foreground-lighter text-left px-2 py-1.5 rounded',
  'hover:text-foreground hover:!bg-overlay-hover w-full flex items-center space-x-2',
  'peer-data-[value=true]:bg-overlay-hover peer-data-[value=true]:text-strong'
)

function useMultiSelect() {
  const context = React.useContext(MultiSelectContext)
  if (!context) {
    throw new Error('useMultiSelect must be used within a MultiSelectProvider')
  }
  return context
}

const MultiSelectorVariants = cva('', {
  variants: {
    size: {
      ...SIZE_VARIANTS,
    },
  },
  defaultVariants: {
    size: SIZE_VARIANTS_DEFAULT,
  },
})

type MultiSelectorMode = 'combobox' | 'inline-combobox'

type MultiSelectorProps = {
  mode?: MultiSelectorMode
  values: string[]
  onValuesChange: (value: string[]) => void
  disabled?: boolean
} & React.ComponentPropsWithoutRef<typeof Command> &
  VariantProps<typeof MultiSelectorVariants>

function MultiSelector({
  values = [],
  onValuesChange,
  disabled,
  dir,
  size,
  className,
  children,
  ...props
}: MultiSelectorProps) {
  const ref = React.useRef(null)
  const [open, setOpen] = React.useState<boolean>(false)
  const [inputValue, setInputValue] = React.useState<string>('')
  const [activeIndex, setActiveIndex] = React.useState<number>(-1)

  const [dropdownPlacement, setDropdownPlacement] = React.useState<'top' | 'bottom'>('bottom')
  const [dropdownMaxHeight, setDropdownMaxHeight] = React.useState<number>(DROPDOWN_MAX_HEIGHT)

  const toggleValue = React.useCallback(
    (toggledValue: string) => {
      if (values.includes(toggledValue)) {
        onValuesChange(values.filter((value) => value !== toggledValue) || [])
      } else {
        onValuesChange([...values, toggledValue])
      }
    },
    [values]
  )

  const updateDropdownMetrics = React.useCallback(() => {
    if (typeof window === 'undefined') return
    const triggerEl = ref.current as HTMLDivElement | null
    if (!triggerEl) return

    const rect = triggerEl.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - rect.bottom - DROPDOWN_GAP
    const spaceAbove = rect.top - DROPDOWN_GAP
    const shouldDropUp = spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow
    const placement = shouldDropUp ? 'top' : 'bottom'
    const availableSpace = Math.max(placement === 'top' ? spaceAbove : spaceBelow, 0)
    const nextHeight =
      availableSpace > 0 ? Math.min(DROPDOWN_MAX_HEIGHT, availableSpace) : DROPDOWN_MAX_HEIGHT

    setDropdownPlacement(placement)
    setDropdownMaxHeight(nextHeight)
  }, [])

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const { signal } = controller

    const handleUpdate = updateDropdownMetrics
    handleUpdate()
    window.addEventListener('resize', handleUpdate, { signal })
    window.addEventListener('scroll', handleUpdate, { capture: true, passive: true, signal })

    return () => controller.abort()
  }, [open, updateDropdownMetrics])

  // detect clicks from outside
  useOnClickOutside(ref, () => {
    if (open) {
      setOpen(false)
    }
  })

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      switch (e.key) {
        case 'Backspace':
        case 'Delete':
          if (values.length > 0 && inputValue.length === 0) {
            if (activeIndex !== -1 && activeIndex < values.length) {
              onValuesChange(values.filter((item) => item !== values[activeIndex]))
              const newIndex = activeIndex - 1 < 0 ? 0 : activeIndex - 1
              setActiveIndex(newIndex)
            } else {
              onValuesChange(values.filter((item) => item !== values[values.length - 1]))
            }
          }
          break
        case 'Escape':
          activeIndex !== -1 ? setActiveIndex(-1) : setOpen(false)
          if (ref.current) {
            const button = (ref.current as HTMLDivElement).querySelector('button[role="combobox"]')
            button && (button as HTMLButtonElement).focus()
          }
          break
        case 'Enter':
          setOpen(true)
          break
      }
    },
    [values, inputValue, activeIndex]
  )

  return (
    <MultiSelectContext.Provider
      value={{
        values,
        toggleValue,
        onValuesChange,
        open,
        setOpen,
        inputValue,
        setInputValue,
        activeIndex,
        setActiveIndex,
        size: size || 'small',
        disabled,
        dropdownPlacement,
        dropdownMaxHeight,
      }}
    >
      <Command
        ref={ref}
        onKeyDown={handleKeyDown}
        className={cn('relative w-auto overflow-visible bg-transparent flex flex-col', className)}
        dir={dir}
        {...props}
      >
        {children}
      </Command>
    </MultiSelectContext.Provider>
  )
}

export interface MultiSelectorTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  label?: string
  persistLabel?: boolean
  className?: string
  badgeLimit?: number | 'wrap'
  deletableBadge?: boolean
  showIcon?: boolean
  mode?: MultiSelectorMode
}

const MultiSelectorTrigger = React.forwardRef<HTMLButtonElement, MultiSelectorTriggerProps>(
  (
    {
      label,
      persistLabel = false,
      className,
      deletableBadge = true,
      badgeLimit = 9999,
      showIcon = true,
      mode = 'combobox',
      children,
      ...props
    },
    ref
  ) => {
    const { activeIndex, values, setInputValue, toggleValue, disabled, open, setOpen } =
      useMultiSelect()

    const inputRef = React.useRef<HTMLButtonElement>(null)

    // Use the provided ref if available, otherwise use the local ref
    React.useImperativeHandle(ref, () => inputRef.current as HTMLButtonElement)
    const inlineInputRef = React.useRef<HTMLInputElement>(null)
    const badgesRef = React.useRef<HTMLDivElement>(null)

    const [visibleBadges, setVisibleBadges] = React.useState<string[]>([])
    const [extraBadgesCount, setExtraBadgesCount] = React.useState(0)
    const [isDeleteHovered, setIsDeleteHovered] = React.useState(false)

    const IS_BADGE_LIMIT_WRAP = badgeLimit === 'wrap'
    const IS_NUMERIC_LIMIT = typeof badgeLimit === 'number'
    const IS_INLINE_MODE = mode === 'inline-combobox'

    React.useEffect(() => {
      if (!inputRef?.current || !badgesRef.current) return

      if (IS_BADGE_LIMIT_WRAP) {
        setVisibleBadges(values)
        setExtraBadgesCount(0)
      } else {
        setVisibleBadges(values.slice(0, badgeLimit))
        setExtraBadgesCount(Math.max(0, values.length - badgeLimit))
      }
    }, [values, badgeLimit])

    const badgeClasses = 'rounded shrink-0 px-1.5'

    const handleTriggerClick: React.MouseEventHandler<HTMLButtonElement> = React.useCallback(
      (event) => {
        if (IS_INLINE_MODE) {
          if (!open) {
            setOpen(true)
            setInputValue('')
          }

          event.stopPropagation()
          event.preventDefault()

          setTimeout(() => {
            inlineInputRef.current?.focus()
          }, 100)

          return
        }

        const willOpen = !open
        setOpen(willOpen)
        if (willOpen) setInputValue('')
      },
      [open, setOpen, setInputValue, IS_INLINE_MODE]
    )

    return (
      <button
        ref={inputRef}
        onClick={(e) => !isDeleteHovered && handleTriggerClick(e)}
        disabled={disabled}
        type="button"
        role="combobox"
        className={cn(
          'flex w-full min-w-[200px] min-h-[40px] items-center justify-between rounded-md border',
          'border-alternative bg-foreground/[.026] px-3 py-2 text-sm',
          'ring-offset-background placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'hover:border-primary transition-colors duration-200',
          className
        )}
        {...props}
      >
        <div
          ref={badgesRef}
          className={cn(
            'flex gap-1 -ml-1 overflow-hidden flex-1',
            IS_BADGE_LIMIT_WRAP && 'flex-wrap',
            !IS_BADGE_LIMIT_WRAP &&
              'overflow-x-auto scrollbar-thin scrollbar-track-transparent transition-colors scrollbar-thumb-muted-foreground dark:scrollbar-thumb-muted scrollbar-thumb-rounded-lg'
          )}
        >
          {visibleBadges.map((value) => (
            <Badge key={value} className={badgeClasses}>
              {value}
              {deletableBadge && (
                <div
                  onMouseEnter={() => setIsDeleteHovered(true)}
                  onMouseLeave={() => setIsDeleteHovered(false)}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleValue(value)
                    setIsDeleteHovered(false)
                  }}
                  className="ml-1 text-foreground-lighter hover:text-foreground-light transition-colors pointer-events-auto"
                >
                  <RemoveIcon size={12} />
                </div>
              )}
            </Badge>
          ))}
          {extraBadgesCount > 0 && (
            <Badge className={badgeClasses}>
              {IS_NUMERIC_LIMIT && badgeLimit < 1
                ? `${extraBadgesCount} item${extraBadgesCount > 1 ? 's' : ''} selected`
                : `+${extraBadgesCount}`}
            </Badge>
          )}
          <span
            className={cn(
              'text-foreground-muted whitespace-nowrap leading-[1.375rem] ml-1 opacity-0 transition-opacity hidden',
              !IS_INLINE_MODE &&
                (persistLabel || values.length === 0) &&
                'opacity-100 visible inline'
            )}
          >
            {label}
          </span>
          {IS_INLINE_MODE && (
            <MultiSelectorInput
              ref={inlineInputRef}
              showSearchIcon={false}
              onValueChange={activeIndex === -1 ? setInputValue : undefined}
              placeholder={label}
              autoFocus={false}
              wrapperClassName={cn(
                'px-0 flex-1 border-none truncate',
                IS_BADGE_LIMIT_WRAP && 'min-w-[85px]'
              )}
              className="py-0 px-1 truncate"
            />
          )}
        </div>

        {showIcon && (
          <ChevronsUpDown
            size={16}
            strokeWidth={2}
            className="text-foreground-lighter shrink-0 ml-1.5"
          />
        )}
      </button>
    )
  }
)

MultiSelectorTrigger.displayName = 'MultiSelectorTrigger'
MultiSelector.Trigger = MultiSelectorTrigger

const MultiSelectorInputVariants = cva('bg-control border', {
  variants: {
    size: {
      ...SIZE_VARIANTS,
    },
  },
  defaultVariants: {
    size: SIZE_VARIANTS_DEFAULT,
  },
})

const MultiSelectorInput = React.forwardRef<
  React.ElementRef<typeof CommandInput>,
  React.ComponentPropsWithoutRef<typeof CommandInput> & {
    showResetIcon?: boolean
    showSearchIcon?: boolean
    wrapperClassName?: string
  }
>(({ className, wrapperClassName, showResetIcon, showSearchIcon, ...props }, ref) => {
  const { open, setOpen, inputValue, setInputValue, activeIndex, setActiveIndex, size, disabled } =
    useMultiSelect()
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Use the provided ref if available, otherwise use the local ref
  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

  const handleFocus = () => setOpen(true)
  const handleClick = () => setActiveIndex(-1)
  const handleReset = () => {
    setInputValue('')
    setInputFocus()
  }

  const setInputFocus = () => {
    setTimeout(() => {
      if (!inputRef?.current) return
      if (open) {
        inputRef.current.focus()
      }
    }, 100)
  }

  useEffect(() => {
    setInputFocus()

    if (!open) {
      inputRef.current?.blur()
    }
  }, [open])

  return (
    <CommandInput
      ref={inputRef}
      value={inputValue}
      onValueChange={activeIndex === -1 ? setInputValue : undefined}
      onFocus={handleFocus}
      onClick={handleClick}
      tabIndex={open ? 0 : -1}
      disabled={disabled}
      showSearchIcon={showSearchIcon}
      showResetIcon={showResetIcon}
      handleReset={handleReset}
      wrapperClassName={wrapperClassName}
      className={cn(
        MultiSelectorInputVariants({ size }),
        'text-sm bg-transparent h-full flex-grow border-none outline-none placeholder:text-foreground-muted flex-1',
        activeIndex !== -1 && 'caret-transparent',
        className
      )}
      {...props}
    />
  )
})

MultiSelectorInput.displayName = 'MultiSelectorInput'
MultiSelector.Input = MultiSelectorInput

const MultiSelectorContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children }, ref) => {
    const { open, dropdownPlacement } = useMultiSelect()

    const closedTranslationClass = dropdownPlacement === 'top' ? 'translate-y-3' : '-translate-y-3'

    return (
      <div
        ref={ref}
        className={cn(
          'absolute w-full bg-overlay shadow-md z-10 border border-overlay rounded-md transition-all',
          dropdownPlacement === 'top'
            ? 'bottom-[calc(100%+0.25rem)] origin-bottom'
            : 'top-[calc(100%+0.25rem)] origin-top',
          open
            ? 'opacity-100 translate-y-0 visible duration-150 ease-[.76,0,.23,1]'
            : cn('opacity-0 invisible duration-0', closedTranslationClass),
          className
        )}
      >
        {open && children}
      </div>
    )
  }
)

MultiSelectorContent.displayName = 'MultiSelectorContent'
MultiSelector.Content = MultiSelectorContent

const MultiSelectorList = React.forwardRef<
  React.ElementRef<typeof CommandList>,
  React.ComponentPropsWithoutRef<typeof CommandList> & {
    creatable?: boolean
  }
>(({ className, children, creatable = false }, ref) => {
  const { open, inputValue, setInputValue, toggleValue, dropdownMaxHeight } = useMultiSelect()

  const options = !!children
    ? Array.isArray(children)
      ? (children as React.ReactNode[])
      : typeof children === 'object' && 'props' in children
        ? children.props.children
        : []
    : []
  const availableOptions = options
    .filter((x: any) => !!x.props.value)
    .map((x: any) => x.props.value.toLowerCase())
  const isOptionExists = availableOptions.some((x: string) => x === inputValue.toLowerCase())

  return (
    <CommandList
      ref={ref}
      className={cn(
        'p-2 flex flex-col gap-2 scrollbar-thin scrollbar-track-transparent transition-colors',
        'scrollbar-thumb-muted-foreground dark:scrollbar-thumb-muted',
        'scrollbar-thumb-rounded-lg w-full overflow-y-auto',
        className
      )}
      style={{ maxHeight: dropdownMaxHeight }}
    >
      {children}
      {creatable && inputValue.length > 0 && !isOptionExists ? (
        <CommandItem
          role="option"
          onSelect={() => {
            open && toggleValue(inputValue)
            setInputValue('')
          }}
          className={commandItemClass}
        >
          Create "{inputValue}"
        </CommandItem>
      ) : creatable && options.length === 0 ? (
        <div className="p-2 py-1.5 text-xs text-foreground-lighter font-italic">
          Type to add a value
        </div>
      ) : (
        <CommandEmpty>
          <span className="text-foreground-muted">No results found</span>
        </CommandEmpty>
      )}
    </CommandList>
  )
})

MultiSelectorList.displayName = 'MultiSelectorList'
MultiSelector.List = MultiSelectorList

const MultiSelectorItem = React.forwardRef<
  HTMLDivElement,
  { value: string } & React.ComponentPropsWithoutRef<typeof CommandItem>
>(({ className, value, children, ...props }, ref) => {
  const { values: selectedValues, setInputValue, toggleValue, open } = useMultiSelect()
  const isSelected = selectedValues.includes(value)

  return (
    <CommandItem
      ref={ref}
      tabIndex={open ? 0 : -1}
      role="option"
      onSelect={() => {
        open && toggleValue(value)
        setInputValue('')
      }}
      className={cn(commandItemClass, className)}
      {...props}
    >
      <div
        className={cn(
          'flex items-center justify-center',
          'peer h-4 w-4 shrink-0 rounded border border-control bg-control/25 ring-offset-background',
          'transition-colors duration-150 ease-in-out',
          'hover:border-strong',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-foreground data-[state=checked]:text-background',
          isSelected ? 'bg-foreground text-background' : '[&_svg]:invisible'
        )}
      >
        <Check className="h-3 w-3" strokeWidth={4} />
      </div>
      <div className="text-xs flex-grow leading-none pointer-events-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:pointer-events-none peer-disabled:opacity-50">
        {children}
      </div>
    </CommandItem>
  )
})

MultiSelectorItem.displayName = 'MultiSelectorItem'
MultiSelector.Item = MultiSelectorItem

export {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
}
