'use client'

import { SearchTrigger, type SearchTriggerProps } from 'docs-search/components'
import { Search } from 'lucide-react'
import { Button, cn, KeyboardShortcut, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { SEARCH_SHORTCUT_KEY } from './constants'
import { useSearchV2 } from './SearchV2Provider'

type SearchV2TriggerProps = Pick<SearchTriggerProps, 'className' | 'placeholder'>

export function SearchV2Trigger({ className, placeholder }: SearchV2TriggerProps) {
  const { isSearchOpen, showSearch } = useSearchV2()

  return (
    <SearchTrigger
      className={className}
      placeholder={placeholder}
      expanded={isSearchOpen}
      onClick={() => showSearch('search_input')}
    />
  )
}

export const SearchV2IconTrigger = ({ className }: { className?: string }) => {
  const { isSearchOpen, showSearch } = useSearchV2()

  const handleClick = () => showSearch('search_input')

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label="Search docs"
          aria-haspopup="dialog"
          aria-expanded={isSearchOpen}
          aria-keyshortcuts={`Meta+${SEARCH_SHORTCUT_KEY} Control+${SEARCH_SHORTCUT_KEY}`}
          onClick={handleClick}
          icon={<Search />}
          className={cn('size-7.5 shrink-0 px-0', className)}
        />
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-2">
        {/* the button label already names it, so the tooltip description adds only the shortcut */}
        <span aria-hidden>Search docs</span>
        <KeyboardShortcut keys={['Meta', SEARCH_SHORTCUT_KEY]} variant="keycaps" />
      </TooltipContent>
    </Tooltip>
  )
}
