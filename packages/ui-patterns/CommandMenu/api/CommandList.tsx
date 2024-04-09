import { useRouter } from 'next/navigation'
import { forwardRef } from 'react'

import { CommandList_Shadcn_, cn } from 'ui'

import { useCommands } from './hooks/commandsHooks'
import { CommandItem } from '../internal/Command'
import { CommandEmpty } from '../internal/CommandEmpty'
import { CommandGroup } from '../internal/CommandGroup'

const CommandList = forwardRef<
  React.ElementRef<typeof CommandList_Shadcn_>,
  React.ComponentPropsWithoutRef<typeof CommandList_Shadcn_>
>(({ className, ...props }, ref) => {
  const commandSections = useCommands()
  const router = useRouter()

  return (
    <CommandList_Shadcn_ ref={ref} className={cn(className)} {...props}>
      {/* Need to check for length because there's a bug in cmdk when only force-mounted items are left. */}
      {!commandSections.length && <CommandEmpty>No results found.</CommandEmpty>}
      {commandSections.map((section) => (
        <CommandGroup key={section.id} heading={section.name} forceMount={section.forceMount}>
          {section.commands.map((command) => (
            <CommandItem
              key={command.id}
              forceMount={command.forceMount}
              onSelect={'action' in command ? command.action : () => router.push(command.route)}
            >
              {command.name}
            </CommandItem>
          ))}
        </CommandGroup>
      ))}
    </CommandList_Shadcn_>
  )
})
CommandList.displayName = CommandList_Shadcn_.displayName

export { CommandList }
