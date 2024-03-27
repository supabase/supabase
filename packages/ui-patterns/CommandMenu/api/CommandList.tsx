import { Command as CommandPrimitive } from 'cmdk'
import { forwardRef } from 'react'

import { cn } from 'ui'

import { CommandItem } from '../internal/Command'
import { CommandEmpty } from '../internal/CommandEmpty'
import { CommandGroup } from '../internal/CommandGroup'
import { useCommandSectionsContext } from '../internal/Context'

const CommandList = forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => {
  const { commandSections } = useCommandSectionsContext()

  return (
    <CommandPrimitive.List
      ref={ref}
      className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)}
      {...props}
    >
      <CommandEmpty>No results found.</CommandEmpty>
      {commandSections.map((section) => (
        <CommandGroup key={section.id} heading={section.name}>
          {section.commands.map((command) => (
            <CommandItem key={command.id}>{command.name}</CommandItem>
          ))}
        </CommandGroup>
      ))}
    </CommandPrimitive.List>
  )
})
CommandList.displayName = CommandPrimitive.List.displayName

export { CommandList }
