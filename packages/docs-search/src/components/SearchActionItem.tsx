import type { ReactNode } from 'react'
import { cn, CommandItem } from 'ui'

export interface SearchActionItemProps {
  icon?: ReactNode
  children: ReactNode
  onSelect: () => void
  className?: string
}

export function SearchActionItem({ icon, children, onSelect, className }: SearchActionItemProps) {
  return (
    <CommandItem
      value="search-action"
      onSelect={onSelect}
      className={cn(
        'group inline-flex cursor-pointer items-center gap-1.5 p-0 align-bottom text-sm text-foreground data-[selected=true]:bg-transparent',
        className
      )}
    >
      {icon}
      <span className="underline decoration-foreground-muted underline-offset-4 group-hover:decoration-foreground">
        {children}
      </span>
    </CommandItem>
  )
}
