import { forwardRef, useRef } from 'react'

import { CommandList_Shadcn_, cn } from 'ui'

import { useCommands } from './hooks/commandsHooks'
import { useQuery } from './hooks/queryHooks'
import { CommandItem, type ICommand } from '../internal/Command'
import { CommandEmpty } from '../internal/CommandEmpty'
import { CommandGroup } from '../internal/CommandGroup'
import { TextHighlighter } from '../internal/TextHighlighter'

const CommandList = forwardRef<
  React.ElementRef<typeof CommandList_Shadcn_>,
  React.ComponentPropsWithoutRef<typeof CommandList_Shadcn_>
>(({ className, ...props }, ref) => {
  const commandSections = useCommands()
  const query = useQuery()

  const innerRef = useRef<HTMLDivElement | undefined>(undefined)
  const setInnerRef = (elem: HTMLDivElement) => (innerRef.current = elem)

  const setRef = (elem: HTMLDivElement) => {
    if (ref) typeof ref === 'function' ? ref(elem) : (ref.current = elem)
    setInnerRef(elem)
  }

  return (
    <CommandList_Shadcn_
      ref={setRef}
      className={cn('overflow-y-auto overflow-x-hidden bg-transparent', className)}
      {...props}
    >
      <CommandEmpty listRef={innerRef}>No results found.</CommandEmpty>
      {commandSections.map((section) => (
        <CommandGroup key={section.id} heading={section.name} forceMount={section.forceMount}>
          {section.commands.map((_command) => {
            const command = _command as ICommand // strip the readonly applied from the proxy

            return (
              <CommandItem key={command.id} command={command}>
                <TextHighlighter query={query}>{command.name}</TextHighlighter>
              </CommandItem>
            )
          })}
        </CommandGroup>
      ))}
    </CommandList_Shadcn_>
  )
})
CommandList.displayName = CommandList_Shadcn_.displayName

export { CommandList }
