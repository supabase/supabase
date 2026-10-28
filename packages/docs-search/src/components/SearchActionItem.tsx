import type { ReactNode } from 'react'
import { cn, CommandGroup, CommandItem } from 'ui'

export interface SearchActionItemProps {
  icon?: ReactNode
  children: ReactNode
  onSelect: () => void
  className?: string
}

export function SearchActionItem({ icon, children, onSelect, className }: SearchActionItemProps) {
  return (
    <CommandGroup className="pt-1.25">
      <CommandItem
        value="search-action"
        onSelect={onSelect}
        className={cn(
          'cursor-pointer gap-2.5 rounded-md px-2 py-2 text-sm text-foreground',
          className
        )}
      >
        {icon}
        {children}
      </CommandItem>
    </CommandGroup>
  )
}
