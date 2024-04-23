import { Command as CommandPrimitive } from 'cmdk'
import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { cn } from 'ui/src/lib/utils'

import { AlertTriangle } from 'lucide-react'
import { DetailedHTMLProps, HTMLAttributes, KeyboardEventHandler } from 'react'
import { Dialog, DialogContent } from 'ui'
import { Button } from 'ui/src/components/Button'
import { LoadingLine } from 'ui/src/components/LoadingLine/LoadingLine'
import { useCommandMenu } from './CommandMenuProvider'

type CommandPrimitiveElement = React.ElementRef<typeof CommandPrimitive>
type CommandPrimitiveProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive>

export const copyToClipboard = (str: string, callback = () => {}) => {
  const focused = window.document.hasFocus()
  if (focused) {
    window.navigator?.clipboard?.writeText(str).then(callback)
  } else {
    console.warn('Unable to copy to clipboard')
  }
}

export const Command = React.forwardRef<CommandPrimitiveElement, CommandPrimitiveProps>(
  ({ className, ...props }, ref) => (
    <CommandPrimitive
      ref={ref}
      className={cn('flex h-full w-full flex-col overflow-hidden', className)}
      {...props}
    />
  )
)

Command.displayName = CommandPrimitive.displayName

export function CommandError({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  return (
    <div className={cn('min-h-64', 'flex items-center justify-center')}>
      <div className="p-10 flex flex-col items-center gap-6 mt-4">
        <AlertTriangle strokeWidth={1.5} size={40} />
        <p className="text-lg text-center">
          Sorry, looks like we&apos;re having some issues with the command menu!
        </p>
        <p className="text-sm text-center">Please try again in a bit.</p>
        <Button size="tiny" type="secondary" onClick={resetErrorBoundary}>
          Try again?
        </Button>
      </div>
    </div>
  )
}

interface CommandDialogProps extends React.ComponentProps<typeof Dialog> {
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>
  page?: number | string
  visible?: boolean
  setIsOpen: (open: boolean) => void
}

export const CommandDialog = ({
  children,
  onKeyDown,
  page,
  setIsOpen,
  ...props
}: CommandDialogProps) => {
  const [animateBounce, setAnimateBounce] = React.useState(false)

  React.useEffect(() => {
    setAnimateBounce(true)
    setTimeout(() => setAnimateBounce(false), 126)
  }, [page])

  return (
    <Dialog {...props} open={props.visible || props.open}>
      <DialogContent
        onInteractOutside={(e) => {
          // Only hide menu when clicking outside, not focusing outside
          // Prevents Firefox dropdown issue that immediately closes menu after opening
          if (e.type === 'dismissableLayer.pointerDownOutside') {
            setIsOpen(!open)
          }
        }}
        hideClose
        size={'xlarge'}
        className={cn(
          '!bg-overlay/90 backdrop-filter backdrop-blur-sm',
          '!border-overlay/90',
          'transition ease-out',
          'place-self-start mx-auto top-24',
          animateBounce ? 'scale-[101.5%]' : 'scale-100'
        )}
      >
        <ErrorBoundary FallbackComponent={CommandError}>
          <Command
            className={[
              '[&_[cmdk-group]]:px-2 [&_[cmdk-group]]:!bg-transparent [&_[cmdk-group-heading]]:!bg-transparent [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-border-stronger [&_[cmdk-input]]:h-12',
              '[&_[cmdk-item]_svg]:h-5',
              '[&_[cmdk-item]_svg]:w-5',
              '[&_[cmdk-input-wrapper]_svg]:h-5',
              '[&_[cmdk-input-wrapper]_svg]:w-5',

              '[&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0',
            ].join(' ')}
          >
            {children}
          </Command>
        </ErrorBoundary>
      </DialogContent>
    </Dialog>
  )
}

CommandDialog.displayName = 'CommandDialog'

type CommandPrimitiveInputElement = React.ElementRef<typeof CommandPrimitive.Input>
type CommandPrimitiveInputProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>

export const CommandInput = React.forwardRef<
  CommandPrimitiveInputElement,
  CommandPrimitiveInputProps
>(({ className, value, onValueChange, ...props }, ref) => {
  const { isLoading } = useCommandMenu()

  return (
    <div className="flex flex-col items-center" cmdk-input-wrapper="">
      <CommandPrimitive.Input
        value={value}
        autoFocus
        onValueChange={onValueChange}
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-md bg-transparent px-4 py-7 text-sm outline-none',
          'focus:shadow-none focus:ring-transparent',
          'text-foreground-light placeholder:text-border-stronger disabled:cursor-not-allowed disabled:opacity-50 border-0',
          className
        )}
        {...props}
      />
      <LoadingLine loading={isLoading} />
    </div>
  )
})

CommandInput.displayName = CommandPrimitive.Input.displayName

type CommandPrimitiveListElement = React.ElementRef<typeof CommandPrimitive.List>
type CommandPrimitiveListProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>

export const CommandList = React.forwardRef<CommandPrimitiveListElement, CommandPrimitiveListProps>(
  ({ className, ...props }, ref) => (
    <CommandPrimitive.List
      ref={ref}
      className={cn('overflow-y-auto overflow-x-hidden bg-transparent', className)}
      {...props}
    />
  )
)

CommandList.displayName = CommandPrimitive.List.displayName

type CommandPrimitiveEmptyElement = React.ElementRef<typeof CommandPrimitive.Empty>
type CommandPrimitiveEmptyProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>

export const CommandEmpty = React.forwardRef<
  CommandPrimitiveEmptyElement,
  CommandPrimitiveEmptyProps
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm text-foreground-muted"
    {...props}
  />
))

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

type CommandPrimitiveGroupElement = React.ElementRef<typeof CommandPrimitive.Group>
type CommandPrimitiveGroupProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>

export const CommandGroup = React.forwardRef<
  CommandPrimitiveGroupElement,
  CommandPrimitiveGroupProps
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'overflow-hidden py-3 px-2 text-border-strong [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-normal [&_[cmdk-group-heading]]:text-foreground-muted',
      className
    )}
    {...props}
  />
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

type CommandPrimitiveSeparatorElement = React.ElementRef<typeof CommandPrimitive.Separator>
type CommandPrimitiveSeparatorProps = React.ComponentPropsWithoutRef<
  typeof CommandPrimitive.Separator
>

export const CommandSeparator = React.forwardRef<
  CommandPrimitiveSeparatorElement,
  CommandPrimitiveSeparatorProps
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn(
      `h-px
    w-full
    bg-alternative
    `,
      className
    )}
    {...props}
  />
))

CommandSeparator.displayName = CommandPrimitive.Separator.displayName

type CommandPrimitiveItemElement = React.ElementRef<typeof CommandPrimitive.Item>
type CommandPrimitiveItemProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>

export interface CommandItemProps extends CommandPrimitiveItemProps {
  type: 'link' | 'block-link' | 'command'
  badge?: React.ReactNode
}

export const CommandItem = React.forwardRef<CommandPrimitiveItemElement, CommandItemProps>(
  ({ className, type, children, badge, ...props }, ref) => (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(
        'cursor-default',
        'select-none',
        'items-center',
        'rounded-md',
        'text-sm',
        'group',
        'py-3',
        'text-foreground-light',
        'relative',
        'flex',
        type === 'block-link'
          ? `
        bg-transparent
        border
        border-overlay/90
        px-5
        transition-all
        outline-none
        aria-selected:border-overlay
        aria-selected:bg-overlay-hover/90
        aria-selected:shadow-sm
        aria-selected:scale-[100.3%]
        data-[disabled]:pointer-events-none data-[disabled]:opacity-50`
          : type === 'link'
            ? `
        px-2
        transition-all
        outline-none
        aria-selected:bg-overlay-hover/90
        data-[disabled]:pointer-events-none data-[disabled]:opacity-50`
            : `
        px-2
        aria-selected:bg-overlay-hover/80
        aria-selected:backdrop-filter
        aria-selected:backdrop-blur-md
        data-[disabled]:pointer-events-none
        data-[disabled]:opacity-50
        `,
        className
      )}
      {...props}
    >
      <div className="w-full flex flex-row justify-between items-center">
        <div className="flex flex-row gap-2 flex-grow items-center">{children}</div>
        {badge}
      </div>
    </CommandPrimitive.Item>
  )
)

CommandItem.displayName = CommandPrimitive.Item.displayName

export const CommandItemStale = React.forwardRef<CommandPrimitiveItemElement, CommandItemProps>(
  ({ className, ...props }, ref) => (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(
        'text-foreground-light relative flex cursor-default select-none items-center rounded-md py-1.5 px-2 text-sm outline-none aria-selected:bg-overlay-selection data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    />
  )
)

CommandItemStale.displayName = 'CommandItemStale'

interface CommandShortcutProps {
  className?: string
  children?: React.ReactNode
  onClick?: () => void
  type?: 'default' | 'breadcrumb'
}

export const CommandShortcut = ({
  className,
  children,
  onClick,
  type = 'default',
}: CommandShortcutProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'cursor-default px-1.5 py-0.5 rounded text-xs [&:not(:last-child)]:hover:cursor-pointer',
        'justify-end',
        type === 'breadcrumb'
          ? 'text-foreground-muted'
          : 'bg-overlay-hover text-foreground-muted [&:not(:last-child)]:hover:bg-selection last:bg-selection last:text-foreground-muted',
        className
      )}
    >
      {children}
    </button>
  )
}

CommandShortcut.displayName = 'CommandShortcut'

export const CommandLabel = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span {...props} className={cn('grow', className)} />
}

CommandShortcut.displayName = 'CommandLabel'

export interface TextHighlighterProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> {
  text: string
  query: string
}

export const TextHighlighter = ({ text, query, ...props }: TextHighlighterProps) => {
  // Wrap all instances of `query` in a span to make them bold
  const elements = text.split(query).flatMap((part, index, parts) => {
    const returnValue = [<>{part}</>]

    // Add back the wrapped `query` (if it's not the last element)
    if (index !== parts.length - 1) {
      returnValue.push(<span className="font-semibold text-foreground">{query}</span>)
    }

    return returnValue
  })

  return <span {...props}>{elements}</span>
}

TextHighlighter.displayName = 'TextHighlighter'

export interface UseHistoryKeysOptions {
  enable: boolean
  messages: string[]
  setPrompt: (prompt: string) => void
}

/**
 * Enables a shell-style message history when hitting
 * up/down on the keyboard
 */
export function useHistoryKeys({ enable, messages, setPrompt }: UseHistoryKeysOptions) {
  // Message index when hitting up/down on the keyboard (shell style)
  const [, setMessageSelectionIndex] = React.useState(0)

  React.useEffect(() => {
    if (enable) {
      return
    }

    // Note: intentionally setting index to 1 greater than max index
    setMessageSelectionIndex(messages.length)
  }, [messages, enable])

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'ArrowUp':
          setMessageSelectionIndex((index) => {
            const newIndex = Math.max(index - 1, 0)
            const newMessage = messages[newIndex]
            if (newMessage) {
              setPrompt(newMessage)
            }
            return newIndex
          })
          return
        case 'ArrowDown':
          setMessageSelectionIndex((index) => {
            const newIndex = Math.min(index + 1, messages.length)
            const newMessage = messages[newIndex]
            if (newMessage) {
              setPrompt(newMessage)
            }
            return newIndex
          })
          return
        default:
          return
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [messages])
}

/**
 * Automatically focuses an input on key press
 * and on load (after the call stack)
 *
 * @returns An input ref for the input to focus
 */
export function useAutoInputFocus() {
  const [input, setInput] = React.useState<HTMLInputElement>()

  // Use a callback-style ref to access the element when it mounts
  const inputRef = React.useCallback((inputElement: HTMLInputElement) => {
    if (inputElement) {
      setInput(inputElement)

      // We need to delay the focus until the end of the call stack
      // due to order of operations
      setTimeout(() => {
        inputElement.focus()
      }, 0)
    }
  }, [])

  // Focus the input when typing from anywhere
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key !== 'Tab') {
        input?.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [input])

  return inputRef
}
