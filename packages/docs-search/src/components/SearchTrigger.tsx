'use client'

import { Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn, KeyboardShortcut } from 'ui'

export interface SearchTriggerProps {
  className?: string
  placeholder?: ReactNode
  /** Whether the dialog this button opens is currently open. */
  expanded?: boolean
  onClick: () => void
}

export function SearchTrigger({
  className,
  placeholder = 'Search...',
  expanded = false,
  onClick,
}: SearchTriggerProps) {
  return (
    <button
      type="button"
      tabIndex={0}
      aria-haspopup="dialog"
      aria-expanded={expanded}
      onClick={onClick}
      className={cn(
        'cursor-pointer',
        'grow xl:min-w-56 h-[30px] rounded-md',
        'pl-2 pr-1',
        'flex items-center justify-between',
        'max-xl:w-7.5 max-xl:grow-0 max-xl:justify-center max-xl:px-0',
        'border border-default bg-surface-75 text-foreground-lighter shadow-(--shadow-codeblock)',
        'hover:border-strong hover:text-foreground-light',
        'focus-ring',
        'transition-colors',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Search aria-hidden className="size-4 shrink-0" strokeWidth={2.25} />
        <p className="flex pr-2 text-sm max-xl:sr-only">{placeholder}</p>
      </div>
      <KeyboardShortcut keys={['Meta', 'k']} aria-hidden className="hidden xl:inline-flex" />
    </button>
  )
}
