'use client'

import { SearchTrigger, type SearchTriggerProps } from 'docs-search/components'

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
