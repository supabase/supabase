'use client'

import { SearchTrigger, useSearchShortcut, type SearchTriggerProps } from 'docs-search/components'
import { useCallback } from 'react'

import { SearchV2Dialog } from './SearchV2Dialog'
import { useSearchV2Dialog } from './useSearchV2Dialog'

type SearchV2TriggerProps = Pick<SearchTriggerProps, 'className' | 'placeholder'>

export function SearchV2Trigger({ className, placeholder }: SearchV2TriggerProps) {
  const { open, openDialog, handleOpenChange } = useSearchV2Dialog()

  const handleShortcut = useCallback(() => openDialog('keyboard_shortcut'), [openDialog])

  useSearchShortcut(handleShortcut)

  return (
    <>
      <SearchTrigger
        className={className}
        placeholder={placeholder}
        expanded={open}
        onClick={() => openDialog('search_input')}
      />
      <SearchV2Dialog open={open} onOpenChange={handleOpenChange} />
    </>
  )
}
