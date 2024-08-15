'use client'

import { Badge } from 'ui'
import {
  Command,
  CommandItem,
  CommandEmpty,
  CommandList,
} from 'ui/src/components/shadcn/ui/command'
import { cn } from 'ui/src/lib/utils/cn'
import { Command as CommandPrimitive } from 'cmdk'
import { X as RemoveIcon, Check } from 'lucide-react'
import React, {
  KeyboardEvent,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useState,
} from 'react'
import { CommandInput } from 'cmdk'
import {
  SIZE,
  SIZE_VARIANTS,
  SIZE_VARIANTS_DEFAULT,
  SIZE_VARIANTS_INNER,
} from 'ui/src/lib/constants'
import { VariantProps, cva } from 'class-variance-authority'
import { sizeVariants } from 'ui/src/lib/commonCva'

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

type MultiSelectorProps = {
  values: string[]
  onValuesChange: (value: string[]) => void
  loop?: boolean
  disabled?: boolean
} & React.ComponentPropsWithoutRef<typeof Command> &
  VariantProps<typeof MultiSelectorVariants>

interface MultiSelectContextProps {
  value: string[]
  onValueChange: (value: any) => void
  open: boolean
  setOpen: (value: boolean) => void
  inputValue: string
  setInputValue: React.Dispatch<React.SetStateAction<string>>
  activeIndex: number
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>
  size: MultiSelectorProps['size']
  disabled?: boolean
}

const MultiSelectContext = createContext<MultiSelectContextProps | null>(null)

const useMultiSelect = () => {
  const context = useContext(MultiSelectContext)
  if (!context) {
    throw new Error('useMultiSelect must be used within MultiSelectProvider')
  }
  return context
}

const MultiSelector = ({
  values: value,
  onValuesChange: onValueChange,
  loop = false,
  className,
  children,
  dir,
  size = 'small',
  disabled,
  ...props
}: MultiSelectorProps) => {
  const [inputValue, setInputValue] = useState('')
  const [open, setOpen] = useState<boolean>(false)
  const [activeIndex, setActiveIndex] = useState<number>(-1)

  const onValueChangeHandler = useCallback(
    (val: string) => {
      if (value.includes(val)) {
        onValueChange(value.filter((item) => item !== val))
      } else {
        onValueChange([...value, val])
      }
    },
    [value]
  )

  // TODO : change from else if use to switch case statement

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const moveNext = () => {
        const nextIndex = activeIndex + 1
        setActiveIndex(nextIndex > value.length - 1 ? (loop ? 0 : -1) : nextIndex)
      }

      const movePrev = () => {
        const prevIndex = activeIndex - 1
        setActiveIndex(prevIndex < 0 ? value.length - 1 : prevIndex)
      }

      if ((e.key === 'Backspace' || e.key === 'Delete') && value.length > 0) {
        if (inputValue.length === 0) {
          if (activeIndex !== -1 && activeIndex < value.length) {
            onValueChange(value.filter((item) => item !== value[activeIndex]))
            const newIndex = activeIndex - 1 < 0 ? 0 : activeIndex - 1
            setActiveIndex(newIndex)
          } else {
            onValueChange(value.filter((item) => item !== value[value.length - 1]))
          }
        }
      } else if (e.key === 'Enter') {
        setOpen(true)
      } else if (e.key === 'Escape') {
        if (activeIndex !== -1) {
          setActiveIndex(-1)
        } else {
          setOpen(false)
        }
      } else if (dir === 'rtl') {
        if (e.key === 'ArrowRight') {
          movePrev()
        } else if (e.key === 'ArrowLeft' && (activeIndex !== -1 || loop)) {
          moveNext()
        }
      } else {
        if (e.key === 'ArrowLeft') {
          movePrev()
        } else if (e.key === 'ArrowRight' && (activeIndex !== -1 || loop)) {
          moveNext()
        }
      }
    },
    [value, inputValue, activeIndex, loop]
  )

  return (
    <MultiSelectContext.Provider
      value={{
        value,
        onValueChange: onValueChangeHandler,
        open,
        setOpen,
        inputValue,
        setInputValue,
        activeIndex,
        setActiveIndex,
        size: size || 'small',
        disabled,
      }}
    >
      <CommandPrimitive
        onKeyDown={handleKeyDown}
        className={cn('relative overflow-visible bg-transparent flex flex-col', className)}
        dir={dir}
        {...props}
      >
        {children}
      </CommandPrimitive>
    </MultiSelectContext.Provider>
  )
}

export interface ButtonVariantProps extends React.HTMLAttributes<HTMLDivElement> {}

const MultiSelectorTriggerBadgeVariants = cva(
  `
  gap-2
  w-content 
  my-[3px] 
  bg-overlay dark:bg-surface-300
  border border-control
  bg-opacity-100
  rounded-lg 
  items-center 
  flex text-foreground-light
  border
  `,

  {
    variants: {
      size: {
        ...SIZE_VARIANTS_INNER,
      },
      active: {
        true: 'ring-2 ring-muted-foreground',
        false: '',
      },
    },
    defaultVariants: {
      size: SIZE_VARIANTS_DEFAULT,
    },
  }
)

const MultiSelectorTrigger = forwardRef<HTMLDivElement, ButtonVariantProps>(
  ({ className, children, ...props }, ref) => {
    const { value, onValueChange, activeIndex, size, disabled } = useMultiSelect()

    const mousePreventDefault = useCallback((e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }, [])

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-wrap gap-1 border border-control bg-foreground/[.026] rounded-lg px-1',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
        {...props}
      >
        {value.map((item, index) => (
          <div
            key={item}
            className={cn(
              MultiSelectorTriggerBadgeVariants({ size: size, active: activeIndex === index })
            )}
          >
            <span>{item}</span>
            <button
              aria-label={`Remove ${item} option`}
              aria-roledescription="button to remove option"
              type="button"
              onMouseDown={mousePreventDefault}
              onClick={() => onValueChange(item)}
            >
              <span className="sr-only">Remove {item} option</span>
              <RemoveIcon
                className="transition-colors h-3 w-3 text-foreground-muted hover:text-destructive"
                strokeWidth={3}
              />
            </button>
          </div>
        ))}
        {children}
      </div>
    )
  }
)

MultiSelectorTrigger.displayName = 'MultiSelectorTrigger'

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

const MultiSelectorInput = forwardRef<
  React.ElementRef<typeof CommandInput>,
  React.ComponentPropsWithoutRef<typeof CommandInput>
>(({ className, ...props }, ref) => {
  const { setOpen, inputValue, setInputValue, activeIndex, setActiveIndex, size, disabled } =
    useMultiSelect()
  return (
    <CommandInput
      {...props}
      ref={ref}
      value={inputValue}
      onValueChange={activeIndex === -1 ? setInputValue : undefined}
      onBlur={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onClick={() => setActiveIndex(-1)}
      disabled={disabled}
      className={cn(
        MultiSelectorInputVariants({ size }),
        'text-sm bg-transparent border-none outline-none placeholder:text-foreground-muted flex-1',
        className,
        activeIndex !== -1 && 'caret-transparent'
      )}
    />
  )
})

MultiSelectorInput.displayName = 'MultiSelectorInput'

const MultiSelectorContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children }, ref) => {
    const { open } = useMultiSelect()
    return (
      <div ref={ref} className="relative">
        {open && children}
      </div>
    )
  }
)

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
  React.ElementRef<typeof CommandItem>,
  { value: string } & React.ComponentPropsWithoutRef<typeof CommandItem>
>(({ className, value, children, ...props }, ref) => {
  const { value: Options, onValueChange, setInputValue, size } = useMultiSelect()

  const mousePreventDefault = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const isIncluded = Options.includes(value)
  return (
    <CommandItem
      ref={ref}
      {...props}
      onSelect={() => {
        onValueChange(value)
        setInputValue('')
      }}
      className={cn(
        'relative',
        'text-foreground-light',
        'hover:text-foreground',
        'rounded-md cursor-pointer px-2 py-1 transition-colors flex justify-between',
        size && SIZE.text[size],
        className,
        isIncluded && 'cursor-default',
        props.disabled && 'opacity-75 cursor-not-allowed'
      )}
      onMouseDown={mousePreventDefault}
    >
      <div className={cn(isIncluded && 'opacity-50')}>{children}</div>
      {isIncluded && (
        <div className="w-5 h-5 bg-foreground left-2 rounded-full flex items-center justify-center">
          <Check className="h-3 w-3 text-background" strokeWidth={5} />
        </div>
      )}
    </CommandItem>
  )
})

MultiSelectorItem.displayName = 'MultiSelectorItem'

export {
  MultiSelector,
  MultiSelectorTrigger,
  MultiSelectorInput,
  MultiSelectorContent,
  MultiSelectorList,
  MultiSelectorItem,
}
