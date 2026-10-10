'use client'

import { forwardRef, useRef } from 'react'
import { cn, CommandList } from 'ui'
import { TextHighlighter, useCommands, useQuery } from 'ui-patterns/CommandMenu'
import { CommandMenuEmpty } from 'ui-patterns/CommandMenu/internal/CommandMenuEmpty'
import { CommandMenuGroup } from 'ui-patterns/CommandMenu/internal/CommandMenuGroup'
import { CommandMenuItem } from 'ui-patterns/CommandMenu/internal/CommandMenuItem'

import { useActiveSectionId } from './CommandMenuFilterBar.state'

/**
 * Studio-local variant of ui-patterns' CommandMenuList that additionally
 * respects CommandMenuFilterBar's section selection. Mirrors the shared
 * component's rendering exactly, minus the section filter, to avoid changing
 * behaviour for other CommandMenu consumers (e.g. apps/www).
 */
const FilterableCommandMenuList = forwardRef<
  React.ElementRef<typeof CommandList>,
  React.ComponentPropsWithoutRef<typeof CommandList>
>(({ className, ...props }, ref) => {
  const commandSections = useCommands()
  const query = useQuery()
  const activeSectionId = useActiveSectionId()

  const innerRef = useRef<HTMLDivElement | undefined>(undefined)
  const setInnerRef = (elem: HTMLDivElement) => (innerRef.current = elem)

  const setRef = (elem: HTMLDivElement) => {
    if (ref) typeof ref === 'function' ? ref(elem) : (ref.current = elem)
    setInnerRef(elem)
  }

  const visibleSections = activeSectionId
    ? commandSections.filter((section) => section.id === activeSectionId)
    : commandSections

  return (
    <CommandList
      ref={setRef}
      className={cn('max-h-[initial] overflow-y-auto overflow-x-hidden bg-transparent', className)}
      {...props}
    >
      <CommandMenuEmpty listRef={innerRef}>No results found.</CommandMenuEmpty>
      {visibleSections.map((section) => {
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
FilterableCommandMenuList.displayName = 'FilterableCommandMenuList'

export { FilterableCommandMenuList }
