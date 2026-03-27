'use client'

import { FeedbackDropdown } from 'components/layouts/Navigation/LayoutHeader/FeedbackDropdown/FeedbackDropdown'
import { cn } from 'ui'
import { CommandMenuTriggerInput } from 'ui-patterns'

import { V2ProjectBranchSelector } from './V2ProjectBranchSelector'

export function TopBar() {
  return (
    <header
      className={cn(
        'h-11 md:h-12 flex items-center justify-between pl-1 pr-1.5 border-b border-border bg-dash-sidebar shrink-0'
      )}
    >
      <div className="flex items-center gap-2 min-w-0 md:w-1/4">
        <V2ProjectBranchSelector />
      </div>
      <div className="flex items-center justify-center gap-2 shrink-0 md:w-1/2">
        <CommandMenuTriggerInput
          placeholder="Search ⌘K"
          className="text-foreground-lighter max-w-xs border border-border rounded px-2 py-1 text-xs"
        />
      </div>
      <div className="hidden md:flex justify-end w-1/4">
        <FeedbackDropdown />
      </div>
    </header>
  )
}
