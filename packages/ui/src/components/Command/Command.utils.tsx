import { Command as CommandPrimitive } from 'cmdk-supabase'
import * as React from 'react'

import { cn } from './../../utils/cn'

import { DetailedHTMLProps, HTMLAttributes, KeyboardEventHandler } from 'react'
import { Modal } from '../Modal'
import { ModalProps } from '../Modal/Modal'
import { useCommandMenu } from './CommandMenuProvider'
import { LoadingLine } from './LoadingLine'

type CommandPrimitiveElement = React.ElementRef<typeof CommandPrimitive>
type CommandPrimitiveProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive>

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

export interface CommandDialogProps extends ModalProps {
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>
  page?: number | string
}

export const CommandDialog = ({ children, onKeyDown, page, ...props }: CommandDialogProps) => {
  const [animateBounce, setAnimateBounce] = React.useState(false)

  React.useEffect(() => {
    setAnimateBounce(true)
    setTimeout(() => setAnimateBounce(false), 126)
  }, [page])

  return (
    <Modal
      {...props}
      hideFooter
      className={cn(
        '!bg-[#f8f9fa]/95 dark:!bg-[#1c1c1c]/80 backdrop-filter backdrop-blur-sm',
        '!border-[#e6e8eb]/90 dark:!border-[#282828]/90',
        'transition ease-out',
        'place-self-start mx-auto top-24',
        animateBounce ? 'scale-[101.5%]' : 'scale-100'
      )}
    >
      <Command
        className={[
          '[&_[cmdk-group]]:px-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-scale-800 [&_[cmdk-input]]:h-12',

          '[&_[cmdk-item]_svg]:mr-3',
          '[&_[cmdk-item]_svg]:h-5',
          '[&_[cmdk-item]_svg]:w-5',
          '[&_[cmdk-input-wrapper]_svg]:h-5',
          '[&_[cmdk-input-wrapper]_svg]:w-5',

          '[&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0',
        ].join(' ')}
      >
        {children}
      </Command>
    </Modal>
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
          'text-scale-1100 placeholder:text-scale-800 dark:placeholder:text-scale-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-scale-1200 border-0',
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
      className={cn('overflow-y-auto overflow-x-hidden', className)}
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
    className="py-6 text-center text-sm text-scale-900"
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
      'overflow-hidden py-3 px-2 text-scale-700 dark:text-scale-800 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-normal [&_[cmdk-group-heading]]:text-scale-900 [&_[cmdk-group-heading]]:dark:text-sca-300',
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
    bg-scale-50
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
}

export const CommandItem = React.forwardRef<CommandPrimitiveItemElement, CommandItemProps>(
  ({ className, type, ...props }, ref) => (
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
        'text-scale-1100',
        'relative',
        'flex',
        type === 'block-link'
          ? `
      bg-[#fbfcfd]/90
      dark:bg-[#232323]/90
        border
      border-[#ddd]/90
      dark:border-[#282828]/90
        backdrop-filter
        backdrop-blur-md
        px-5
        transition-all
        outline-none
      aria-selected:border-[#ccc]
      dark:aria-selected:border-[#323232]
      aria-selected:bg-[#f1f3f5]/90
      dark:aria-selected:bg-[#323232]
        aria-selected:shadow-sm
        aria-selected:scale-[100.3%]
        data-[disabled]:pointer-events-none data-[disabled]:opacity-50`
          : type === 'link'
          ? `
        px-2
        backdrop-filter
        backdrop-blur-md
        transition-all
        outline-none
        aria-selected:bg-[#f1f3f5]/90
        dark:aria-selected:bg-[#323232]
        data-[disabled]:pointer-events-none data-[disabled]:opacity-50`
          : `
        px-2
        aria-selected:bg-scale-300
        dark:aria-selected:bg-[#323232]/80
        aria-selected:backdrop-filter
        aria-selected:backdrop-blur-md
        data-[disabled]:pointer-events-none
        data-[disabled]:opacity-50
        `,
        className
      )}
      {...props}
    />
  )
)

CommandItem.displayName = CommandPrimitive.Item.displayName

export const CommandItemStale = React.forwardRef<CommandPrimitiveItemElement, CommandItemProps>(
  ({ className, ...props }, ref) => (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(
        'text-scale-1100 relative flex cursor-default select-none items-center rounded-md py-1.5 px-2 text-sm outline-none aria-selected:bg-scale-500 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:aria-selected:bg-scale-500',
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
          ? 'text-scale-900'
          : 'bg-scale-500 text-scale-900 [&:not(:last-child)]:hover:bg-scale-600 last:bg-scale-600 last:text-scale-900',
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
  text: string | undefined
  query: string | undefined
}

export const TextHighlighter = ({ text, query, ...props }: TextHighlighterProps) => {
  const highlightMatches = (text?: string) => {
    if (!text) {
      return ''
    }

    if (!query) {
      return text
    }

    const regex = new RegExp(query, 'gi')
    return text.replace(
      regex,
      (match) => `<span class="font-semibold text-scale-1200">${match}</span>`
    )
  }

  return <span dangerouslySetInnerHTML={{ __html: highlightMatches(text) }} {...props} />
}

TextHighlighter.displayName = 'TextHighlighter'
