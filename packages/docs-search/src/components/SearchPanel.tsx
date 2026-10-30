'use client'

import { useRef, useState, type KeyboardEvent } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList } from 'ui'

import { resolveSearchLabels } from './labels'
import { LoadingBeam } from './LoadingBeam'
import { SearchFooter } from './SearchFooter'
import { SearchResultItem } from './SearchResultItem'
import type { SearchLabels, SearchRenderLink, SearchResult, SearchState } from './types'
import { canSubmitQuery, getHighlightQuery, getIsSearching, getVisibleResults } from './utils'

export interface SearchPanelProps {
  searchState: SearchState
  /**
   * Fires when the trimmed query changes, so surrounding whitespace and repeats never re-fire it.
   * An empty string means there's nothing to search: the input was cleared (typed away or via
   * the Clear button) or is still `minCharacters` long or shorter. The consumer should reset its
   * search, which also drops any pending one, so a query that was never submitted never reports
   * as a search.
   */
  onQueryChange: (query: string) => void
  /**
   * The query has to be longer than this, once trimmed, to be submitted: with 2, nothing is
   * searched until the third character. Defaults to 0, so any non-empty query is submitted.
   */
  minCharacters?: number
  /** Fires when a result is activated by click or Enter. `query` is the one its results belong to. */
  onResultActivate?: (result: SearchResult, context: { query: string }) => void
  /** Fires when a result is activated from the keyboard, so the consumer has to navigate. */
  onResultNavigate: (path: string) => void
  /** Fires when a result link is about to navigate in this tab (not a new-tab click). */
  onResultLinkNavigate?: () => void
  renderLink?: SearchRenderLink
  labels?: Partial<SearchLabels>
}

export function SearchPanel({
  searchState,
  onQueryChange,
  minCharacters = 0,
  onResultActivate,
  onResultNavigate,
  onResultLinkNavigate,
  renderLink,
  labels,
}: SearchPanelProps) {
  const copy = resolveSearchLabels(labels)
  const [query, setQuery] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  // starts empty to match a search that hasn't run, so clearing an untouched input reports nothing
  const reportedQueryRef = useRef('')

  // highlight with the query the visible results belong to, not the one being typed
  const highlightQuery = getHighlightQuery(searchState)
  const results = getVisibleResults(searchState)

  const isListVisible =
    results.length > 0 || searchState.status === 'noResults' || searchState.status === 'error'
  const isSearching = getIsSearching({ searchState, query, minCharacters })

  // only reports a query that differs from the last one reported, so "abc" followed by "abc "
  // doesn't search (and report a search) twice for the same query
  function reportQuery(nextQuery: string) {
    if (nextQuery === reportedQueryRef.current) return
    reportedQueryRef.current = nextQuery
    onQueryChange(nextQuery)
  }

  function handleClear() {
    setQuery('')
    reportQuery('')
    inputRef.current?.focus()
  }

  // cmdk's root turns enter into "open highlighted result", so keep it on the button.
  // other keys must bubble, or tab never reaches the dialog's focus trap
  function handleClearKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Enter') event.stopPropagation()
  }

  function handleValueChange(value: string) {
    setIsDeleting(value.length < query.length)
    setQuery(value)

    // the input keeps what was typed, but only the trimmed query is ever submitted
    const trimmedQuery = value.trim()
    reportQuery(canSubmitQuery(trimmedQuery, minCharacters) ? trimmedQuery : '')
  }

  // Announced via the aria-live region below — a sighted user sees the spinner/list update,
  // but a screen reader user gets no equivalent signal unless we say so explicitly. Also covers
  // the result count, which isn't reliably announced by the listbox/option roles alone.
  function getStatusMessage(): string {
    if (searchState.status === 'loading') return copy.searching
    if (searchState.status === 'noResults') return copy.noResults
    if (searchState.status === 'error') return copy.error
    if (results.length > 0) return copy.resultCount(results.length)
    return ''
  }

  return (
    <Command shouldFilter={false} className="bg-transparent">
      <div className="relative flex items-center gap-3 pr-4">
        <CommandInput
          ref={inputRef}
          value={query}
          placeholder={copy.inputPlaceholder}
          aria-label={copy.inputLabel}
          onValueChange={handleValueChange}
          wrapperClassName="flex-1 border-0 pl-3 pr-0 text-foreground-lighter [&_svg]:size-4.5 [&_svg]:stroke-2 [&_svg]:opacity-100"
          className="h-12 pl-2.5 text-base text-foreground placeholder:text-foreground-lighter"
        />
        {query ? (
          <button
            type="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={handleClearKeyDown}
            className="relative -mx-2 shrink-0 cursor-pointer rounded-md px-2 py-1 text-xs text-foreground-lighter transition-colors duration-150 after:absolute after:inset-x-0 after:-inset-y-2 after:content-[''] hover:bg-overlay-hover hover:text-foreground focus-ring"
          >
            {copy.clear}
          </button>
        ) : null}
        <LoadingBeam
          isActive={isSearching}
          direction={isDeleting ? 'backward' : 'forward'}
          className={isListVisible ? '-bottom-px' : undefined}
        />
      </div>
      {/*
        Screen-reader-only status announcement. Focus stays in the input as results come in
        (that's what lets people keep typing), so nothing else here gets read aloud on its
        own — this is what tells a screen reader user a search ran and how many results it found.
      */}
      <div role="status" aria-live="polite" className="sr-only">
        {getStatusMessage()}
      </div>
      <CommandList
        label={copy.resultsLabel}
        className="h-(--cmdk-list-height) max-h-[min(477px,70dvh)] inset-shadow-2xs inset-shadow-border mx-px transition-all duration-150 ease-enter motion-reduce:transition-none scroll-fade-bottom"
      >
        {searchState.status === 'noResults' && <CommandEmpty>{copy.noResults}</CommandEmpty>}
        {searchState.status === 'error' && <CommandEmpty>{copy.error}</CommandEmpty>}
        {results.length > 0 && (
          <CommandGroup className="pt-1.25">
            {results.map((result) => (
              <SearchResultItem
                key={result.path}
                result={result}
                highlightQuery={highlightQuery}
                renderLink={renderLink}
                onActivate={(activated) => onResultActivate?.(activated, { query: highlightQuery })}
                onNavigate={(path) => onResultNavigate(path)}
                onLinkNavigate={() => onResultLinkNavigate?.()}
              />
            ))}
          </CommandGroup>
        )}
      </CommandList>
      {results.length > 0 ? <SearchFooter labels={copy} /> : null}
    </Command>
  )
}
