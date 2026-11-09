'use client'

import { useRef, type MouseEvent } from 'react'
import { CommandItem } from 'ui'

import type { SearchRenderLink, SearchResult } from './types'
import { formatHeadingPath, highlightMatches } from './utils'

const renderDefaultLink: SearchRenderLink = (props) => <a {...props} />

export interface SearchResultItemProps {
  result: SearchResult
  highlightQuery: string
  renderLink?: SearchRenderLink
  /** Fires whenever the result is activated, by click or Enter, before anything navigates. */
  onActivate?: (result: SearchResult) => void
  /** Fires when the result was activated from the keyboard, so the consumer has to navigate. */
  onNavigate: (path: string) => void
  /** Fires when the link itself is about to navigate in this tab (not a new-tab click). */
  onLinkNavigate?: () => void
}

export function SearchResultItem({
  result,
  highlightQuery,
  renderLink = renderDefaultLink,
  onActivate,
  onNavigate,
  onLinkNavigate,
}: SearchResultItemProps) {
  // clicks navigate via the link and also fire onSelect, so onSelect only navigates for Enter
  const isPointerSelectRef = useRef(false)

  function handleLinkClick(event: MouseEvent<HTMLAnchorElement>) {
    isPointerSelectRef.current = true
    const isNewTab = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
    if (!isNewTab) onLinkNavigate?.()
  }

  function handleSelect() {
    onActivate?.(result)
    if (isPointerSelectRef.current) {
      isPointerSelectRef.current = false
      return
    }
    onNavigate(result.path)
  }

  return (
    <CommandItem
      asChild
      value={result.path}
      onSelect={handleSelect}
      className="cursor-pointer rounded-md px-2 py-2"
    >
      {renderLink({
        href: result.path,
        tabIndex: -1,
        onClick: handleLinkClick,
        children: (
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
        ),
      })}
    </CommandItem>
  )
}
