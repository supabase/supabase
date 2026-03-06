'use client'

import { forwardRef, useRef } from 'react'
import { cn, CommandList_Shadcn_ } from 'ui'

import { CommandItem } from '../internal/Command'
import { CommandEmpty } from '../internal/CommandEmpty'
import { CommandGroup } from '../internal/CommandGroup'
import { useCommands } from './hooks/commandsHooks'
import { useQuery } from './hooks/queryHooks'
import { TextHighlighter } from './TextHighlighter'

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
      className={cn('max-h-[initial] overflow-y-auto overflow-x-hidden bg-transparent', className)}
      {...props}
    >
      <CommandEmpty listRef={innerRef}>No results found.</CommandEmpty>
      {commandSections.map((section) => {
        if (section.commands.every((command) => command.defaultHidden) && !query) return null

        return (
          <CommandGroup key={section.id} heading={section.name} forceMount={section.forceMount}>
            {section.commands
              .filter((command) => !command.defaultHidden || query)
              .map((command) => (
                <CommandItem key={command.id} command={command}>
                  <TextHighlighter>{command.name}</TextHighlighter>
                </CommandItem>
              ))}
          </CommandGroup>
        )
      })}
    </CommandList_Shadcn_>
  )
})
CommandList.displayName = CommandList_Shadcn_.displayName

export { CommandList }
