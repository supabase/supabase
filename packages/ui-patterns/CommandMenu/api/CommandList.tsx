import { Command as CommandPrimitive } from 'cmdk'
import { useRouter } from 'next/navigation'
import { forwardRef } from 'react'

import { cn } from 'ui'

import { useCommands } from './hooks/commandsHooks'
import { CommandItem } from '../internal/Command'
import { CommandEmpty } from '../internal/CommandEmpty'
import { CommandGroup } from '../internal/CommandGroup'

const CommandList = forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => {
  const commandSections = useCommands()
  console.log('一条龙', commandSections)
  const router = useRouter()

  console.log(commandSections.length)

  return (
    <CommandPrimitive.List
      ref={ref}
      className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)}
      {...props}
    >
      <CommandEmpty>No results found.</CommandEmpty>
      {commandSections.map(
        (section) => (
          console.log('来者何人', section),
          (
            <CommandGroup key={section.id} heading={section.name}>
              {section.commands.map((command) => (
                <CommandItem
                  key={command.id}
                  onSelect={'action' in command ? command.action : () => router.push(command.route)}
                >
                  {command.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )
        )
      )}
    </CommandPrimitive.List>
  )
})
CommandList.displayName = CommandPrimitive.List.displayName

export { CommandList }
