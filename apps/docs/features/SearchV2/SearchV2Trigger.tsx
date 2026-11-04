'use client'

import { SearchTrigger, type SearchTriggerProps } from 'docs-search/components'
import { Search } from 'lucide-react'
import { Button, KeyboardShortcut, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

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

export function SearchV2IconTrigger() {
  const { isSearchOpen, showSearch } = useSearchV2()

  const handleClick = () => showSearch('search_input')

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label="Search docs"
          aria-haspopup="dialog"
          aria-expanded={isSearchOpen}
          aria-keyshortcuts="Meta+K"
          onClick={handleClick}
          icon={<Search strokeWidth={2} />}
          className="h-[30px] w-[30px] px-0"
        />
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-2">
        Search docs
        <KeyboardShortcut keys={['Meta', 'k']} variant="keycaps" />
      </TooltipContent>
    </Tooltip>
  )
}
