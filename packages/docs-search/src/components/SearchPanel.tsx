'use client'

import { Search } from 'lucide-react'
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList } from 'ui'

import { resolveSearchLabels } from './labels'
import { LoadingBeam } from './LoadingBeam'
import { SearchFooter } from './SearchFooter'
import { SearchInputRow } from './SearchInputRow'
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
  renderNoResults?: (context: { query: string }) => ReactNode
  renderFooterStart?: (context: { query: string }) => ReactNode
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
  renderNoResults,
  renderFooterStart,
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

  // cmdk's root turns enter into "open highlighted result", so footer actions keep it.
  // other keys must bubble, or tab never reaches the dialog's focus trap
  function handleFooterKeyDown(event: KeyboardEvent<HTMLElement>) {
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
      <SearchInputRow
        icon={<Search aria-hidden className="size-full" strokeWidth={2} />}
        onClear={query ? handleClear : undefined}
        clearLabel={copy.clear}
        beam={
          <LoadingBeam
            isActive={isSearching}
            direction={isDeleting ? 'backward' : 'forward'}
            className={isListVisible ? '-bottom-px' : undefined}
          />
        }
      >
        <CommandInput
          autoFocus
          ref={inputRef}
          autoComplete="off"
          data-1p-ignore // 1Password
          data-lpignore="true" // LastPass
          data-form-type="other" // Dashlane
          data-bwignore // Bitwarden
          value={query}
          placeholder={copy.inputPlaceholder}
          aria-label={copy.inputLabel}
          onValueChange={handleValueChange}
          showSearchIcon={false}
          wrapperClassName="size-full border-0 p-0"
          className="h-full p-0 text-search-dialog! placeholder:text-foreground-lighter"
        />
      </SearchInputRow>
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
        className="h-(--cmdk-list-height) max-h-[min(477px,70dvh)] outline-hidden inset-shadow-2xs inset-shadow-border mx-px transition-all duration-150 ease-enter motion-reduce:transition-none scroll-fade-bottom"
      >
        {searchState.status === 'noResults' ? (
          renderNoResults ? (
            <div className="py-6 text-center text-sm">
              {renderNoResults({ query: highlightQuery })}
            </div>
          ) : (
            <CommandEmpty className="text-sm">{copy.noResults}</CommandEmpty>
          )
        ) : null}
        {searchState.status === 'error' && (
          <CommandEmpty className="text-sm">{copy.error}</CommandEmpty>
        )}
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
      {results.length > 0 ? (
        <SearchFooter labels={copy}>
          {renderFooterStart ? (
            <span onKeyDown={handleFooterKeyDown} className="contents">
              {renderFooterStart({ query: query.trim() })}
            </span>
          ) : null}
        </SearchFooter>
      ) : null}
    </Command>
  )
}
