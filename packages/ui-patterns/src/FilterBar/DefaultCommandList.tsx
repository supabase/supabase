import React from 'react'
import {
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
} from 'ui'

import { MenuItem } from './menuItems'

type DefaultCommandListProps = {
  items: MenuItem[]
  highlightedIndex: number
  onSelect: (item: MenuItem) => void
  includeIcon?: boolean
}

export function DefaultCommandList({
  items,
  highlightedIndex,
  onSelect,
  includeIcon = true,
}: DefaultCommandListProps) {
  return (
    <Command_Shadcn_>
      <CommandList_Shadcn_>
        <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
        <CommandGroup_Shadcn_>
          {items.map((item, idx) => (
            <CommandItem_Shadcn_
              key={`${item.value}-${item.label}`}
              value={item.value}
              onSelect={() => onSelect(item)}
              className={`text-xs ${idx === highlightedIndex ? 'bg-surface-400' : ''}`}
            >
              {includeIcon && item.icon}
              {item.label}
            </CommandItem_Shadcn_>
          ))}
        </CommandGroup_Shadcn_>
      </CommandList_Shadcn_>
    </Command_Shadcn_>
  )
}
