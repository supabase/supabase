'use client'

import { type PropsWithChildren, forwardRef } from 'react'
import { CommandItem_Shadcn_, cn } from 'ui'
import { useCrossCompatRouter } from '../api/hooks/useCrossCompatRouter'
import { useSetCommandMenuOpen } from '../api/hooks/viewHooks'
import { type ICommand, type IActionCommand, type IRouteCommand } from './types'

const isActionCommand = (command: ICommand): command is IActionCommand => 'action' in command
const isRouteCommand = (command: ICommand): command is IRouteCommand => 'route' in command

const generateCommandClassNames = (isLink: boolean) =>
  cn(
    'cursor-default',
    'select-none',
    'items-center gap-2',
    'rounded-md',
    'text-sm',
    'group',
    'py-3',
    'text-foreground-light',
    'relative',
    'flex',
    isLink
      ? `
bg-transparent
px-2
transition-all
outline-none
aria-selected:border-overlay
aria-selected:bg-selection/90
aria-selected:shadow-sm
aria-selected:scale-[100.3%]
data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50`
      : `
px-2
aria-selected:bg-selection/80
aria-selected:backdrop-filter
aria-selected:backdrop-blur-md
data-[disabled=true]:pointer-events-none
data-[disabled=true]:opacity-50
`
  )

interface CommandItemProps extends React.ComponentPropsWithoutRef<typeof CommandItem_Shadcn_> {
  command: ICommand
}

const CommandItem = forwardRef<
  React.ElementRef<typeof CommandItem_Shadcn_>,
  PropsWithChildren<CommandItemProps>
>(({ children, className, command: _command, ...props }, ref) => {
  const router = useCrossCompatRouter()
  const setIsOpen = useSetCommandMenuOpen()

  const command = _command as ICommand // strip the readonly applied from the proxy

  return (
    <CommandItem_Shadcn_
      ref={ref}
      onSelect={
        isActionCommand(command)
          ? command.action
          : isRouteCommand(command)
            ? () => {
                command.route.startsWith('http')
                  ? (setIsOpen(false), window.open(command.route, '_blank', 'noreferrer,noopener'))
                  : router.push(command.route)
              }
            : () => {}
      }
      value={command.value ?? command.name}
      forceMount={command.forceMount}
      className={cn(
        generateCommandClassNames(isRouteCommand(command)),
        className,
        command.className
      )}
      {...props}
    >
      <div className="w-full flex flex-row justify-between items-center">
        <div className="flex flex-row gap-2 flex-grow items-center">
          {command.icon?.()}
          {children}
        </div>
        {command.badge?.()}
      </div>
    </CommandItem_Shadcn_>
  )
})
CommandItem.displayName = CommandItem_Shadcn_.displayName

export { CommandItem, generateCommandClassNames }
