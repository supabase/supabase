'use client'

import { AiIcon } from '@ui/components/Command'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@ui/components/shadcn/ui/command'
import { Popover, PopoverAnchor, PopoverContent } from '@ui/components/shadcn/ui/popover'
import { cn } from '@ui/lib/utils'
import { createRef, useEffect, useRef, useState } from 'react'

const AssistantCommandsPopover = ({
  children,
  textAreaRef,
  setValue,
  value,
  open,
  setOpen,
  suggestions,
  usingIcon = false,
}: {
  children: React.ReactNode
  textAreaRef: React.RefObject<HTMLTextAreaElement>
  setValue: (value: string) => void
  value: string
  open: boolean
  setOpen: (value: boolean) => void
  suggestions?: string[]
  usingIcon?: boolean
}) => {
  const [command, setCommand] = useState<string>('')

  const ref = createRef<HTMLDivElement>()
  const commandWidth = ref.current?.clientWidth

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
    // console.log('event.key', event.key)
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

  useEffect(() => {}, [command, ref])

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
      >
        <PopoverAnchor className={cn('w-full relative', usingIcon && 'bg-control')}>
          <>
            <div
              style={{
                left: '0px',
                top: '10px',
                marginLeft:
                  command && commandWidth
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
          ref={ref}
          className="w-[420px] p-0"
          align="start"
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            // if (textAreaRef) textAreaRef?.current?.focus()
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

export { AssistantCommandsPopover }
