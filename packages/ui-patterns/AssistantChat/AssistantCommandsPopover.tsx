'use client'

import {
  ComponentPropsWithoutRef,
  ElementRef,
  createRef,
  forwardRef,
  useEffect,
  useRef,
} from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './../../ui/src/components/shadcn/ui/command'
import { Popover, PopoverAnchor, PopoverContent } from './../../ui/src/components/shadcn/ui/popover'
import { cn } from './../../ui/src/lib/utils/cn'

const AssistantCommandsPopover = forwardRef<
  ElementRef<typeof Popover>,
  ComponentPropsWithoutRef<typeof Popover> & {
    /* The children to render - this is where the AssistantChatForm should be placed */
    children: React.ReactNode
    /* The ref for the textarea - used with the AssistantChatForm */
    textAreaRef: React.RefObject<HTMLTextAreaElement>
    /* The function to handle the value change */
    setValue: (value: string) => void
    /* The value of the textarea */
    value: string
    /* Whether the popover is open */
    open: boolean
    /* The function to handle the popover open state */
    setOpen: (value: boolean) => void
    /* The suggestions to display in the popover */
    suggestions?: string[]
    /* Whether an icon is being used in the AssistantChatForm */
    usingIcon?: boolean
  }
>(
  (
    {
      children,
      textAreaRef,
      setValue,
      value,
      open,
      setOpen,
      suggestions,
      usingIcon = false,
      ...props
    },
    ref
  ) => {
    const popoverContentRef = createRef<HTMLDivElement>()
    const commandWidth = popoverContentRef.current?.clientWidth

    const targetInputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
      // Attach the event listener when the component mounts
      if (textAreaRef.current) {
        textAreaRef.current.addEventListener('keydown', handleKeyPress)
      }

      // Detach the event listener when the component unmounts
      return () => {
        if (textAreaRef.current) {
          textAreaRef.current.removeEventListener('keydown', handleKeyPress)
        }
        // Detach the event listener when the component unmounts
      }
    }, []) // Empty dependency array means this effect runs once when the component mounts

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === '/' && !value) {
        // Add your action here
        setOpen(true)
        if (textAreaRef) textAreaRef?.current?.focus()
      } else if (event.key === 'Escape') {
        // Add your action here
        setOpen(false)
      } else if (event.key === 'Backspace') {
        // Add your action here
        setOpen(false)
      } else {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'Enter') {
          // Forward the event to the target input
          if (targetInputRef.current) {
            const keyboardEvent = new KeyboardEvent('keydown', {
              bubbles: true,
              cancelable: true,
              composed: true,
              key: event.key,
              code: event.code,
            })

            targetInputRef.current.dispatchEvent(keyboardEvent)

            // Schedule focus on the original input using requestAnimationFrame
            requestAnimationFrame(() => {
              if (textAreaRef.current) {
                textAreaRef.current.focus()
              }
            })

            // Prevent the default behavior for ArrowUp, ArrowDown, and Enter
            event.preventDefault()
          }
        }
      }
    }

    const resultArray = value.split(/(\s+)/).filter(Boolean)

    const commands = ['fix', 'improve', 'explain', 'help']

    return (
      <>
        <Popover
          open={open}
          onOpenChange={() => {
            setOpen(!open)
            if (textAreaRef) textAreaRef?.current?.focus()
          }}
          {...props}
        >
          <PopoverAnchor className={cn('w-full relative', usingIcon && 'bg-control')}>
            <>
              <div
                style={{
                  left: '0px',
                  top: '10px',
                  marginLeft: commandWidth
                    ? `${(usingIcon ? 48 : 12) + commandWidth + 12}px`
                    : `${usingIcon ? 48 : 12}px`,
                }}
                className={cn('z-0 absolute flex items-center text-sm text-transparent')}
              >
                {resultArray.map((item, i) => (
                  <span
                    key={i}
                    className={cn(
                      item === '/fix' ||
                        item === '/improve' ||
                        item === '/explain' ||
                        item === '/help'
                        ? 'bg-surface-300'
                        : ''
                    )}
                  >
                    {item === ' ' ? '\u00A0' : item}
                  </span>
                ))}
              </div>
              {children}
            </>
          </PopoverAnchor>
          <PopoverContent
            ref={popoverContentRef}
            className="w-[420px] p-0"
            align="start"
            onOpenAutoFocus={(event) => {
              event.preventDefault()
            }}
          >
            <Command>
              <CommandInput
                placeholder="Type a command or search..."
                wrapperClassName="hidden"
                value={value}
                ref={targetInputRef}
                tabIndex={-1}
                autoFocus={false}
              />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                  {suggestions?.map((suggestion, idx) => (
                    <CommandItem
                      key={idx}
                      value={'/ ' + suggestion}
                      className="text-sm gap-0.5"
                      onSelect={() => {
                        setValue(`${suggestion}`)
                        // closing of the popover is handled by the keydown event in AssistantChatForm
                      }}
                    >
                      <span className="text-default">{suggestion}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Commands">
                  {commands.map((command, idx) => (
                    <CommandItem
                      key={idx}
                      className="text-sm gap-0.5"
                      onSelect={() => {
                        setValue(`/${command} `)
                        // closing of the popover is handled by the keydown event in AssistantChatForm
                      }}
                    >
                      <span className="text-brand">/</span>
                      <span className="text-default">{command}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </>
    )
  }
)

export { AssistantCommandsPopover }
