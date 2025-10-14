'use client'

import { forwardRef, useRef } from 'react'

import { CommandList_Shadcn_, cn } from 'ui'

import { CommandItem } from '../internal/Command'
import { CommandEmpty } from '../internal/CommandEmpty'
import { CommandGroup } from '../internal/CommandGroup'
import { useCommands } from './hooks/commandsHooks'
import { useCommandMenuTriggerSource } from './hooks/viewHooks'
import { TextHighlighter } from './TextHighlighter'

const CommandList = forwardRef<
  React.ElementRef<typeof CommandList_Shadcn_>,
  React.ComponentPropsWithoutRef<typeof CommandList_Shadcn_>
>(({ className, ...props }, ref) => {
  const commandSections = useCommands()
  const triggerSource = useCommandMenuTriggerSource()

  const innerRef = useRef<HTMLDivElement | undefined>(undefined)
  const setInnerRef = (elem: HTMLDivElement) => {
    innerRef.current = elem
  }

  const setRef = (elem: HTMLDivElement) => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(elem)
      } else {
        ref.current = elem
      }
    }
    setInnerRef(elem)
  }

  // Filter sections based on trigger source
  const filteredSections = commandSections.filter((section) => {
    // If triggered from quick-actions, only show the "Quick Actions" section
    if (triggerSource === 'quick-actions') {
      return section.name === 'Quick Actions'
    }
    // For all other trigger sources, show all sections
    return true
  })

  return (
    <CommandList_Shadcn_
      ref={setRef}
      className={cn('max-h-[initial] overflow-y-auto overflow-x-hidden bg-transparent', className)}
      {...props}
    >
      <CommandEmpty listRef={innerRef}>No results found.</CommandEmpty>
      {filteredSections.map((section) => {
        // Always show sections that have commands, regardless of defaultHidden status
        if (section.commands.length === 0) return null

        return (
          <CommandGroup key={section.id} heading={section.name} forceMount={section.forceMount}>
            {section.commands.map((command) => (
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
