'use client'

import { type PropsWithChildren, type ReactNode, forwardRef } from 'react'

import { CommandItem_Shadcn_, cn } from 'ui'
import { useCrossCompatRouter } from '../api/hooks/useCrossCompatRouter'
import { useQuery } from '../api/hooks/queryHooks'
import { useSetCommandMenuOpen } from '../api/hooks/viewHooks'

type ICommand = IActionCommand | IRouteCommand

interface IBaseCommand {
  id: string
  name: string
  value?: string
  className?: string
  forceMount?: boolean
  badge?: () => ReactNode
  icon?: () => ReactNode
  /**
   * Whether the item should be hidden until searched
   */
  defaultHidden?: boolean
  /**
   * Currently unused
   */
  keywords?: string[]
  /**
   * Currently unused
   */
  shortcut?: string
}

interface IActionCommand extends IBaseCommand {
  action: () => void
}

interface IRouteCommand extends IBaseCommand {
  route: `/${string}` | `http${string}`
}

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
data-[disabled]:pointer-events-none data-[disabled]:opacity-50`
      : `
px-2
aria-selected:bg-selection/80
aria-selected:backdrop-filter
aria-selected:backdrop-blur-md
data-[disabled]:pointer-events-none
data-[disabled]:opacity-50
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
  const query = useQuery()

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
      value={command.forceMount ? `${query} ${command.value}` : command.value}
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

export { CommandItem, generateCommandClassNames, isActionCommand, isRouteCommand }
export type { ICommand }
