'use client'

import { Search } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn, KeyboardShortcut } from 'ui'

import { SearchV2Dialog } from './SearchV2Dialog'

interface SearchV2TriggerProps {
  className?: string
  placeholder?: ReactNode
}

export function SearchV2Trigger({ className, placeholder = 'Search...' }: SearchV2TriggerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn(
          'group cursor-pointer',
          'grow md:min-w-44 xl:min-w-56 h-[30px] rounded-md',
          'pl-1.5 md:pl-2 pr-1',
          'flex items-center justify-between',
          'bg-transparent text-foreground-lighter border border-strong',
          'hover:bg-popover hover:border-control-hover',
          'focus-ring',
          'transition-colors',
          className
        )}
      >
        <div className="flex items-center space-x-1.5 text-foreground-lighter">
          <Search
            size={16}
            strokeWidth={1.5}
            className="group-hover:text-foreground-light transition-colors"
          />
          <p className="flex text-xs pr-2 text-foreground-muted">{placeholder}</p>
        </div>
        <KeyboardShortcut
          keys={['Meta', 'k']}
          aria-hidden
          className="hidden md:inline-flex border border-default bg-surface-300 text-foreground-lighter shadow-xs shadow-background-surface-100"
        />
      </button>
      <SearchV2Dialog open={open} onOpenChange={setOpen} />
    </>
  )
}
