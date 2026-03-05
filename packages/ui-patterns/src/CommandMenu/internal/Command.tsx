'use client'

import { forwardRef, type PropsWithChildren } from 'react'
import { cn, CommandItem_Shadcn_ } from 'ui'

import { useCommandMenuTelemetryContext } from '../api/hooks/useCommandMenuTelemetryContext'
import { useCrossCompatRouter } from '../api/hooks/useCrossCompatRouter'
import { useResetCommandMenu, useSetCommandMenuOpen } from '../api/hooks/viewHooks'
import type { IActionCommand, ICommand, IRouteCommand } from './types'

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
  const resetCommandMenu = useResetCommandMenu()
  const telemetryContext = useCommandMenuTelemetryContext()

  const command = _command as ICommand // strip the readonly applied from the proxy

  const handleCommandSelect = () => {
    // Send telemetry event
    if (telemetryContext?.onTelemetry) {
      const event = {
        action: 'command_menu_command_clicked' as const,
        properties: {
          command_name: command.name,
          command_value: command.value,
          command_type: isActionCommand(command) ? ('action' as const) : ('route' as const),
          app: telemetryContext.app,
        },
        groups: {},
      }

      telemetryContext.onTelemetry(event)
    }

    // Execute the original command logic
    if (isActionCommand(command)) {
      command.action()
    } else if (isRouteCommand(command)) {
      if (command.route.startsWith('http')) {
        setIsOpen(false)
        window.open(command.route, '_blank', 'noreferrer,noopener')
        resetCommandMenu()
      } else {
        router.push(command.route)
      }
    }
  }

  return (
    <CommandItem_Shadcn_
      ref={ref}
      onSelect={handleCommandSelect}
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
