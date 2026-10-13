'use client'

import type { DocsSearchV2Result } from 'common'
import Link from 'next/link'
import { useRef, type MouseEvent } from 'react'
import { CommandItem } from 'ui'

import { formatHeadingPath, highlightMatches } from './SearchV2.utils'

interface SearchV2ResultProps {
  result: DocsSearchV2Result
  highlightQuery: string
  onResultSelect: (path: string) => void
  onResultOpen: () => void
}

export function SearchV2Result({
  result,
  highlightQuery,
  onResultSelect,
  onResultOpen,
}: SearchV2ResultProps) {
  // clicks navigate via the link and also fire onSelect, so onSelect only navigates for Enter
  const isPointerSelectRef = useRef(false)

  function handleLinkClick(event: MouseEvent<HTMLAnchorElement>) {
    isPointerSelectRef.current = true
    const isNewTab = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
    if (!isNewTab) onResultOpen()
  }

  function handleSelect() {
    if (isPointerSelectRef.current) {
      isPointerSelectRef.current = false
      return
    }
    onResultSelect(result.path)
  }

  return (
    <CommandItem
      asChild
      value={result.path}
      onSelect={handleSelect}
      className="cursor-pointer rounded-md px-2 py-2"
    >
      <Link href={result.path} prefetch={false} tabIndex={-1} onClick={handleLinkClick}>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-sm leading-5 text-foreground">
            {highlightMatches(formatHeadingPath(result.headingPath), highlightQuery)}
          </p>
          {result.excerpt ? (
            <p className="line-clamp-2 text-pretty text-sm leading-5 text-foreground-lighter">
              {highlightMatches(result.excerpt, highlightQuery)}
            </p>
          ) : null}
        </div>
      </Link>
    </CommandItem>
  )
}
