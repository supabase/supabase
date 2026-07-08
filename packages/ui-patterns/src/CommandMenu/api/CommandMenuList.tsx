'use client'

import { forwardRef, useRef } from 'react'
import { cn, CommandList } from 'ui'

import { CommandMenuEmpty } from '../internal/CommandMenuEmpty'
import { CommandMenuGroup } from '../internal/CommandMenuGroup'
import { CommandMenuItem } from '../internal/CommandMenuItem'
import { useCommands } from './hooks/commandsHooks'
import { useQuery } from './hooks/queryHooks'
import { TextHighlighter } from './TextHighlighter'

const CommandMenuList = forwardRef<
  React.ElementRef<typeof CommandList>,
  React.ComponentPropsWithoutRef<typeof CommandList>
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
    <CommandList
      ref={setRef}
      className={cn('max-h-[initial] overflow-y-auto overflow-x-hidden bg-transparent', className)}
      {...props}
    >
      <CommandMenuEmpty listRef={innerRef}>No results found.</CommandMenuEmpty>
      {commandSections.map((section) => {
        if (section.commands.every((command) => command.defaultHidden) && !query) return null

        return (
          <CommandMenuGroup key={section.id} heading={section.name} forceMount={section.forceMount}>
            {section.commands
              .filter((command) => !command.defaultHidden || query)
              .map((command) => (
                <CommandMenuItem key={command.id} command={command}>
                  <TextHighlighter>{command.name}</TextHighlighter>
                </CommandMenuItem>
              ))}
          </CommandMenuGroup>
        )
      })}
    </CommandList>
  )
})
CommandMenuList.displayName = 'CommandMenuList'

export { CommandMenuList }
